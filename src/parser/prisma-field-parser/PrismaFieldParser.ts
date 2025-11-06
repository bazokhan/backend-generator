import type { PrismaField, CustomValidation } from '@tg-scripts/types';
import { fieldDirectiveManager } from '../../directives/field/FieldDirectiveManager';
import type { IPrismaFieldParser } from '@tg-scripts/types';

export class PrismaFieldParser implements IPrismaFieldParser<PrismaField> {
  private readonly typeMap: Record<string, string> = {
    String: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    DateTime: 'string',
    Json: 'any',
    Decimal: 'number',
    BigInt: 'number',
    Bytes: 'Buffer',
  };

  /**
   * Get the base type name from a field (removes array brackets and optional marker)
   */
  private computeBasePrismaType(field: { type: string }): string {
    let baseType = field.type.trim();
    baseType = baseType.replace(/\?$/, '');
    baseType = baseType.replace(/\[\]$/, '');
    return baseType;
  }

  private extractCode(line: string): string {
    return line.split('//')[0]?.trim() ?? '';
  }

  private extractFieldList(text: string, pattern: RegExp): string[] | undefined {
    const match = text.match(pattern);
    if (!match) {
      return undefined;
    }

    return match[1]?.split(',').map((f) => f.trim()) ?? [];
  }

  private extractInlineComment(line: string): string | undefined {
    const match = line.match(/\/\/\s*(.+)/);
    return match ? match[1] : undefined;
  }

  private isValidField(line: string): boolean {
    return !line.startsWith('//') && line.trim() !== '';
  }

  private parseBasicStructure(code: string): {
    name: string | null;
    type: string | null;
    modifiers: string[];
  } {
    const parts = code.split(/\s+/);
    if (parts.length < 2) {
      return { name: null, type: null, modifiers: [] };
    }

    return {
      name: parts[0] ?? null,
      type: parts[1] ?? null,
      modifiers: parts.slice(2),
    };
  }

  private parseModifiers(modifiers: string[]): {
    isId: boolean;
    isUnique: boolean;
    hasDefaultValue: boolean;
  } {
    return {
      isId: modifiers.includes('@id'),
      isUnique: modifiers.includes('@unique'),
      hasDefaultValue: modifiers.some((mod) => mod.includes('@default')),
    };
  }

  private parseRelations(code: string): {
    relationName?: string | undefined;
    relationFromFields?: string[] | undefined;
    relationToFields?: string[] | undefined;
  } {
    const relationSectionMatch = code.match(/@relation\(([^)]*)\)/);
    if (!relationSectionMatch) {
      return {};
    }

    const relationSection = relationSectionMatch[1];
    const relationNameMatch = code.match(/@relation\(\s*"([^"]+)"/);
    const relationFromFields = this.extractFieldList(relationSection ?? '', /fields:\s*\[([^\]]+)\]/);
    const relationToFields = this.extractFieldList(relationSection ?? '', /references:\s*\[([^\]]+)\]/);

    return {
      relationName: relationNameMatch ? relationNameMatch[1] : undefined,
      relationFromFields,
      relationToFields,
    };
  }

  private parseType(type: string): {
    cleanType: string;
    isOptional: boolean;
    isArray: boolean;
  } {
    const isArray = /\[\]$/.test(type);
    const isOptional = /\?$/.test(type);
    const cleanType = type.replace(/\?$/, '');

    return { cleanType, isOptional, isArray };
  }

  private parseValidations(comment?: string | undefined): CustomValidation[] {
    if (!comment) {
      return [];
    }

    const validations: CustomValidation[] = [];
    const validationMatches = comment.matchAll(/@(\w+)\(([^)]+)\)/g);

    for (const match of validationMatches) {
      const decorator = match[1] ?? '';
      const valueStr = match[2]?.trim() ?? '';
      const { value, operations } = this.parseValidationValue(valueStr);

      validations.push({
        decorator,
        value,
        operations,
      });
    }

    return validations;
  }

  private parseValidationValue(valueStr: string): {
    value: any;
    operations?: string[] | undefined;
  } {
    // Handle @max(8, [create, update])
    const operationsMatch = valueStr.match(/^(.+),\s*\[([^\]]+)\]$/);
    if (operationsMatch) {
      return {
        value: operationsMatch[1],
        operations: operationsMatch[2]?.split(',').map((op) => op.trim()) ?? [],
      };
    }

    // Handle @required([create])
    const onlyOpsMatch = valueStr.match(/^\[([^\]]+)\]$/);
    if (onlyOpsMatch) {
      return {
        value: undefined,
        operations: onlyOpsMatch[1]?.split(',').map((op) => op.trim()) ?? [],
      };
    }

    // Simple value like @max(50)
    return { value: valueStr };
  }

  /**
   * Parse a single field line from a Prisma model
   * Returns null if the line doesn't represent a valid field
   */
  public parse(line: string, docComment?: string): PrismaField | null {
    if (!this.isValidField(line)) {
      return null;
    }

    const code = this.extractCode(line);
    const { name, type, modifiers } = this.parseBasicStructure(code);
    if (!name || !type) {
      return null;
    }

    const { cleanType, isOptional, isArray } = this.parseType(type);
    const { isId, isUnique, hasDefaultValue } = this.parseModifiers(modifiers);
    const relations = this.parseRelations(code);
    const inlineComment = this.extractInlineComment(line);
    const customValidations = this.parseValidations(inlineComment);

    // Compute baseType from cleanType (removes array brackets and optional marker)
    const baseType = this.computeBasePrismaType({ type: cleanType });

    const field: PrismaField = {
      name,
      type: cleanType,
      isOptional,
      isArray,
      isId,
      isUnique,
      hasDefaultValue,
      ...relations,
      customValidations,
      baseType,
    };

    const directiveSource = [docComment, inlineComment].filter(Boolean).join(' ').trim();
    if (directiveSource) {
      fieldDirectiveManager.apply(field, directiveSource);
    }

    // Compute and attach TypeScript type for non-relation mapping.
    // - Scalars map using typeMap
    // - Enums and relations keep their Prisma base type name
    // - Arrays keep [] suffix
    const mappedBase = this.typeMap[baseType] ?? baseType;
    const tsType = isArray ? `${mappedBase}[]` : mappedBase;
    Object.defineProperty(field, 'tsType', {
      value: tsType,
      writable: true,
      configurable: true,
      enumerable: false,
    });

    return field;
  }
}
