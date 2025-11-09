import type { DtoType, PrismaField } from '@tg-scripts/types';

const handlersByType: Record<string, (f: PrismaField) => any> = {
  String: (f) =>
    f.name === 'email' ? 'user@example.com' : f.name.toLowerCase().includes('name') ? 'John Doe' : 'example',
  Int: () => 1,
  Float: () => 1,
  Boolean: () => false,
  DateTime: () => '2023-01-01T00:00:00.000Z',
};

export function getExampleValue(field: PrismaField, enums: Map<string, string[]>): any {
  const baseType = field.baseType;
  const handler = handlersByType[baseType];
  if (handler) return handler(field);

  if (field.isEnum) return enums.get(baseType)![0];
  return 'example';
}

const validatorsByType: Record<string, (f: PrismaField) => { decorators: string[]; needsTransform: boolean }> = {
  String: (f) => ({
    decorators: ['@IsString()', ...(f.tgFormat === 'email' ? ['@IsEmail()'] : [])],
    needsTransform: false,
  }),
  Int: () => ({
    decorators: ['@IsNumber()'],
    needsTransform: true,
  }),
  Float: () => ({
    decorators: ['@IsNumber()'],
    needsTransform: true,
  }),
  Boolean: () => ({
    decorators: ['@IsBoolean()'],
    needsTransform: true,
  }),
  DateTime: () => ({
    decorators: ['@IsDateString()'],
    needsTransform: false,
  }),
};

const customValidationHandlers: Record<string, (f: PrismaField, v: any) => string> = {
  max: (f, v) => {
    const baseType = f.baseType;
    return baseType === 'String' ? `@MaxLength(${v})` : `@Max(${v})`;
  },
  min: (f, v) => {
    const baseType = f.baseType;
    return baseType === 'String' ? `@MinLength(${v})` : `@Min(${v})`;
  },
  length: (_f, v) => `@Length(${v})`,
  pattern: (_f, v) => `@Matches(${v})`,
};

const formatDecoratorMap: Partial<Record<NonNullable<PrismaField['tgFormat']>, string>> = {
  email: '@IsEmail()',
  url: '@IsUrl()',
  tel: '@Matches(/^[0-9+()\\s-]+$/)',
};

/**
 * Unified function to generate field definition for any DTO type
 * @param dtoType - The type of DTO ('response', 'create', or 'update')
 * @param includeValidators - Whether to include validation decorators (true for create/update)
 * @param includeRelations - Whether to handle relations as ResponseDto types (true for response)
 */
export function generateFieldDefinition(field: PrismaField, dtoType: DtoType, enums: Map<string, string[]>): string {
  const indent = '  ';
  const decorators: string[] = [];
  const includeValidators = dtoType === 'create' || dtoType === 'update';
  const includeRelations = dtoType === 'response';

  // Determine if field is optional
  const isOptional = dtoType === 'update' || field.isOptional || (includeRelations && field.isRelation);

  // base fallback mapping for scalars
  // For ResponseDTOs: DateTime maps to Date (Prisma returns Date, NestJS serializes to ISO string)
  // For Create/UpdateDTOs: DateTime maps to string (HTTP sends ISO strings)
  const scalarMap: Record<string, string> = {
    String: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    DateTime: dtoType === 'response' ? 'Date' : 'string',
    Json: 'any',
    Decimal: 'number',
    BigInt: 'number',
    Bytes: 'Buffer',
  };

  let tsType = field.tsType;
  // Override tsType for DateTime in ResponseDTOs (Prisma returns Date, not string)
  if (dtoType === 'response' && field.baseType === 'DateTime') {
    tsType = field.isArray ? 'Date[]' : 'Date';
  } else if (!tsType) {
    const baseType = field.baseType;
    if (field.isEnum) {
      tsType = field.isArray ? `${baseType}[]` : baseType;
    } else {
      const mapped = scalarMap[baseType] ?? baseType;
      tsType = field.isArray ? `${mapped}[]` : mapped;
    }
  }
  if (includeRelations && field.isRelation) {
    const responseDtoType = `${field.baseType}ResponseDto`;
    tsType = field.isArray ? `${responseDtoType}[]` : responseDtoType;
  }

  // Build ApiProperty decorator
  const apiProperty: any = {
    name: field.name,
  };

  if (includeValidators) {
    apiProperty.description = `${field.name} field`;
    apiProperty.example = getExampleValue(field, enums);
  }

  if (isOptional) {
    if (includeValidators) {
      decorators.push('@IsOptional()');
    }
    apiProperty.required = false;
    if (includeRelations) {
      apiProperty.nullable = true;
    }
  }

  // Add validation decorators for Create/Update DTOs
  if (includeValidators) {
    if (!field.isOptional || dtoType === 'update') {
      const baseType = field.baseType;
      const validatorResult = validatorsByType[baseType]?.(field);

      if (validatorResult) {
        // Add Transform decorator if needed (for Boolean, Int, Float)
        if (validatorResult.needsTransform) {
          if (baseType === 'Boolean') {
            decorators.push('@Transform(({ value }) => value === "true" || value === true)');
          } else if (baseType === 'Int') {
            decorators.push('@Transform(({ value }: { value: string }) => parseInt(value, 10))');
          } else if (baseType === 'Float') {
            decorators.push('@Transform(({ value }: { value: string }) => parseFloat(value))');
          }
        }
        decorators.push(...validatorResult.decorators);
      }

      if (field.isEnum) {
        decorators.push(`@IsEnum(${baseType})`);
        apiProperty.enum = enums.get(baseType);
      }
    }

    // Add array validators when applicable
    if (field.isArray) {
      decorators.push('@IsArray()');
      const baseType = field.baseType;
      if (field.isEnum) {
        decorators.push(`@IsEnum(${baseType}, { each: true })`);
      } else if (baseType === 'String') {
        decorators.push('@IsString({ each: true })');
      } else if (baseType === 'Int' || baseType === 'Float') {
        decorators.push('@IsNumber({}, { each: true })');
      } else if (baseType === 'Boolean') {
        decorators.push('@IsBoolean({ each: true })');
      }
    }

    if (field.tgFormat) {
      const formatDecorator = formatDecoratorMap[field.tgFormat];
      if (formatDecorator && !decorators.includes(formatDecorator)) {
        decorators.push(formatDecorator);
      }
    }

    field.customValidations.forEach((validation) => {
      const shouldApply =
        !validation.operations ||
        (dtoType === 'update' && validation.operations.includes('update')) ||
        (dtoType === 'create' && validation.operations.includes('create'));

      if (shouldApply) {
        const toDecorator = customValidationHandlers[validation.decorator];
        if (toDecorator) decorators.push(toDecorator(field, validation.value));
      }
    });
  }

  decorators.push(`@ApiProperty(${JSON.stringify(apiProperty)})`);

  // Build property type and optional marker
  let fieldType = tsType;
  const isAnyType = tsType === 'any';
  if (isOptional && includeRelations && !isAnyType) {
    fieldType = `${tsType} | null`;
  }

  const property = isOptional ? `${field.name}?: ${fieldType};` : `${field.name}: ${fieldType};`;

  return `${decorators.map((d) => `${indent}${d}`).join('\n')}\n${indent}${property}`;
}
