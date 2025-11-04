import type { PrismaModel, DtoType, PrismaField } from '@tg-scripts/types';

/**
 * Unified function to generate imports for any DTO type
 * Returns the complete import string ready to use
 */
export function generateDtoImports(model: PrismaModel, fields: PrismaField[], dtoType: DtoType): string {
  const importLines: string[] = [];
  const relationTypes = new Set<string>();
  const enumTypes = new Set<string>();
  const validatorImports = new Set<string>();
  const transformImports = new Set<string>();

  // Analyze fields to determine what imports are needed
  fields.forEach((field) => {
    const baseType = field.baseType;

    // Collect enum types
    if (field.isEnum) {
      enumTypes.add(baseType);
    }

    // For Response DTOs, collect relation types
    if (dtoType === 'response') {
      if (field.isRelation && baseType !== model.name) {
        relationTypes.add(baseType);
      }
    }

    // For Create/Update DTOs, collect validator imports
    if (dtoType === 'create' || dtoType === 'update') {
      if (baseType === 'String') {
        validatorImports.add('IsString');
        if (field.tgFormat === 'email') {
          validatorImports.add('IsEmail');
        }
        if (field.tgFormat === 'url') {
          validatorImports.add('IsUrl');
        }
        if (field.tgFormat === 'tel') {
          validatorImports.add('Matches');
        }
      } else if (baseType === 'Int' || baseType === 'Float') {
        validatorImports.add('IsNumber');
      } else if (baseType === 'Boolean') {
        validatorImports.add('IsBoolean');
      } else if (baseType === 'DateTime') {
        validatorImports.add('IsDateString');
      } else if (field.isEnum) {
        validatorImports.add('IsEnum');
      }

      // Add Transform import for Boolean, Int, Float fields
      if (baseType === 'Boolean' || baseType === 'Int' || baseType === 'Float') {
        transformImports.add('Transform');
      }

      // Always add IsOptional for update DTOs or if any field is optional
      if (dtoType === 'update' || field.isOptional) {
        validatorImports.add('IsOptional');
      }

      // Add custom validation imports
      field.customValidations.forEach((validation) => {
        switch (validation.decorator) {
          case 'max':
            if (baseType === 'String') {
              validatorImports.add('MaxLength');
            } else {
              validatorImports.add('Max');
            }
            break;
          case 'min':
            if (baseType === 'String') {
              validatorImports.add('MinLength');
            } else {
              validatorImports.add('Min');
            }
            break;
          case 'length':
            validatorImports.add('Length');
            break;
          case 'pattern':
            validatorImports.add('Matches');
            break;
        }
      });
    }
  });

  // Generate relation imports (Response DTOs only)
  if (dtoType === 'response' && relationTypes.size > 0) {
    relationTypes.forEach((relationType) => {
      importLines.push(`import { ${relationType}ResponseDto } from './${relationType.toLowerCase()}-response.dto';`);
    });
  }

  // Generate Transform imports (Create/Update DTOs only)
  if ((dtoType === 'create' || dtoType === 'update') && transformImports.size > 0) {
    const transformList = Array.from(transformImports).join(', ');
    importLines.push(`import { ${transformList} } from 'class-transformer';`);
  }

  // Generate validator imports (Create/Update DTOs only)
  if ((dtoType === 'create' || dtoType === 'update') && validatorImports.size > 0) {
    const validatorList = Array.from(validatorImports).join(', ');
    importLines.push(`import { ${validatorList} } from 'class-validator';`);
  }

  // Generate enum imports
  // For Create/Update, also include enums from model.enums (they might be used in validators)
  const allEnumTypes = new Set(enumTypes);
  if (dtoType === 'create' || dtoType === 'update') {
    model.enums.forEach((enumName) => {
      allEnumTypes.add(enumName);
    });
  }

  if (allEnumTypes.size > 0) {
    const enumList = Array.from(allEnumTypes).join(', ');
    importLines.push(`import { ${enumList} } from '@/generated/prisma';`);
  }

  return importLines.join('\n');
}

/**
 * Unified function to filter fields based on DTO type
 * - Response: Includes all fields (ids, timestamps, relations, arrays)
 * - Create/Update: Excludes ids, timestamps, arrays, relations - only primitives/enums
 */
export function filterDtoFields(fields: PrismaField[], dtoType: DtoType): PrismaField[] {
  if (dtoType === 'response') {
    // Response DTOs include all fields
    return fields;
  }

  // Create/Update DTOs filter out certain fields
  return fields.filter((f) => {
    const isTimestamp = f.name === 'createdAt' || f.name === 'updatedAt';
    const isRelation = f.isRelation;
    const isArray = f.isArray;
    const baseType = f.baseType;
    const isPrimitive = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'].includes(baseType);
    const isEnum = f.isEnum;
    // Keep: non-id, non-timestamp, non-array, non-relation, and either primitive or enum
    return !f.isId && !isTimestamp && !isArray && !isRelation && (isPrimitive || isEnum);
  });
}
