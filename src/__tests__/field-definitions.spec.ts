import { getExampleValue, generateFieldDefinition } from '../generator/utils/field-definitions';
import type { PrismaField } from '@tg-scripts/types';

describe('Fields Utilities', () => {
  describe('getExampleValue', () => {
    const enums = new Map<string, string[]>([
      ['Status', ['ACTIVE', 'INACTIVE', 'PENDING']],
      ['Priority', ['LOW', 'MEDIUM', 'HIGH']],
      ['Color', ['RED', 'GREEN', 'BLUE']],
    ]);

    describe('String type', () => {
      it('should return email for email field', () => {
        const field: PrismaField = {
          name: 'email',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe('user@example.com');
      });

      it('should return name for fields containing "name"', () => {
        const field: PrismaField = {
          name: 'fullName',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe('John Doe');
      });

      it('should return example for generic string fields', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe('example');
      });

      it('should return example for description fields', () => {
        const field: PrismaField = {
          name: 'description',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe('example');
      });
    });

    describe('Int type', () => {
      it('should return 1 for integer fields', () => {
        const field: PrismaField = {
          name: 'age',
          type: 'Int',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Int',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe(1);
      });

      it('should return 1 for quantity fields', () => {
        const field: PrismaField = {
          name: 'quantity',
          type: 'Int',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Int',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe(1);
      });
    });

    describe('Float type', () => {
      it('should return 1 for float fields', () => {
        const field: PrismaField = {
          name: 'price',
          type: 'Float',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Float',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe(1);
      });

      it('should return 1 for rating fields', () => {
        const field: PrismaField = {
          name: 'rating',
          type: 'Float',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Float',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe(1);
      });
    });

    describe('Boolean type', () => {
      it('should return false for boolean fields', () => {
        const field: PrismaField = {
          name: 'isActive',
          type: 'Boolean',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Boolean',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe(false);
      });

      it('should return false for enabled fields', () => {
        const field: PrismaField = {
          name: 'enabled',
          type: 'Boolean',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Boolean',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe(false);
      });
    });

    describe('DateTime type', () => {
      it('should return ISO date string for DateTime fields', () => {
        const field: PrismaField = {
          name: 'createdAt',
          type: 'DateTime',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'DateTime',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe('2023-01-01T00:00:00.000Z');
      });

      it('should return ISO date string for updatedAt fields', () => {
        const field: PrismaField = {
          name: 'updatedAt',
          type: 'DateTime',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'DateTime',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe('2023-01-01T00:00:00.000Z');
      });
    });

    describe('Enum type', () => {
      it('should return first enum value for enum fields', () => {
        const field: PrismaField = {
          name: 'status',
          type: 'Status',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Status',
          isEnum: true,
        };

        expect(getExampleValue(field, enums)).toBe('ACTIVE');
      });

      it('should return first enum value for Priority enum', () => {
        const field: PrismaField = {
          name: 'priority',
          type: 'Priority',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Priority',
          isEnum: true,
        };

        expect(getExampleValue(field, enums)).toBe('LOW');
      });

      it('should return first enum value for Color enum', () => {
        const field: PrismaField = {
          name: 'color',
          type: 'Color',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Color',
          isEnum: true,
        };

        expect(getExampleValue(field, enums)).toBe('RED');
      });
    });

    describe('Unknown types', () => {
      it('should return example for unknown types', () => {
        const field: PrismaField = {
          name: 'unknownField',
          type: 'UnknownType',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'UnknownType',
          isEnum: false,
        };

        expect(getExampleValue(field, enums)).toBe('example');
      });
    });
  });

  // Type mapping tests moved to FieldParser.spec.ts

  describe('generateFieldDefinition', () => {
    const enums = new Map<string, string[]>([
      ['Status', ['ACTIVE', 'INACTIVE', 'PENDING']],
      ['Priority', ['LOW', 'MEDIUM', 'HIGH']],
      ['Role', ['USER', 'ADMIN']],
    ]);

    describe('String fields', () => {
      it('should generate definition for required String field', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for optional String field', () => {
        const field: PrismaField = {
          name: 'description',
          type: 'String',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for String field with email validation', () => {
        const field: PrismaField = {
          name: 'email',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should add decorators for tg_format email', () => {
        const field: PrismaField = {
          name: 'contact',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
          tgFormat: 'email',
        };

        const definition = generateFieldDefinition(field, 'create', enums);
        expect(definition).toContain('@IsEmail()');
      });

      it('should add decorators for tg_format url', () => {
        const field: PrismaField = {
          name: 'website',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
          tgFormat: 'url',
        };

        const definition = generateFieldDefinition(field, 'create', enums);
        expect(definition).toContain('@IsUrl()');
      });

      it('should add decorators for tg_format tel', () => {
        const field: PrismaField = {
          name: 'phone',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
          tgFormat: 'tel',
        };

        const definition = generateFieldDefinition(field, 'create', enums);
        expect(definition).toContain('@Matches(/^[0-9+()\\s-]+$/)');
      });

      it('should generate definition for String field with max length validation', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'max', value: 100, operations: ['create'] }],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for String field with min length validation', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'min', value: 5, operations: ['create'] }],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for String field with length validation', () => {
        const field: PrismaField = {
          name: 'code',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'length', value: 6, operations: ['create'] }],
          baseType: 'String',
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for String field with pattern validation', () => {
        const field: PrismaField = {
          name: 'phone',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [
            {
              decorator: 'pattern',
              value: '^\\d{10}$',
              operations: ['create'],
            },
          ],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for String field with multiple validations', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [
            { decorator: 'min', value: 5, operations: ['create'] },
            { decorator: 'max', value: 100, operations: ['create'] },
          ],
          baseType: 'String',
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });
    });

    describe('Number fields', () => {
      it('should generate definition for required Int field', () => {
        const field: PrismaField = {
          name: 'age',
          type: 'Int',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Int',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for optional Int field', () => {
        const field: PrismaField = {
          name: 'quantity',
          type: 'Int',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for Int field with max validation', () => {
        const field: PrismaField = {
          name: 'quantity',
          type: 'Int',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'max', value: 100, operations: ['create'] }],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for Int field with min validation', () => {
        const field: PrismaField = {
          name: 'score',
          type: 'Int',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'min', value: 0, operations: ['create'] }],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for Float field', () => {
        const field: PrismaField = {
          name: 'price',
          type: 'Float',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Float',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for optional Float field', () => {
        const field: PrismaField = {
          name: 'rating',
          type: 'Float',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });
    });

    describe('Boolean fields', () => {
      it('should generate definition for required Boolean field', () => {
        const field: PrismaField = {
          name: 'isActive',
          type: 'Boolean',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Boolean',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for optional Boolean field', () => {
        const field: PrismaField = {
          name: 'enabled',
          type: 'Boolean',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });
    });

    describe('DateTime fields', () => {
      it('should generate definition for required DateTime field', () => {
        const field: PrismaField = {
          name: 'createdAt',
          type: 'DateTime',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'DateTime',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for optional DateTime field', () => {
        const field: PrismaField = {
          name: 'deletedAt',
          type: 'DateTime',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });
    });

    describe('Enum fields', () => {
      it('should generate definition for required enum field', () => {
        const field: PrismaField = {
          name: 'status',
          type: 'Status',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Status',
          isEnum: true,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for optional enum field', () => {
        const field: PrismaField = {
          name: 'priority',
          type: 'Priority',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Priority',
          isEnum: true,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });
    });

    describe('Json fields', () => {
      it('should generate definition for Json field', () => {
        const field: PrismaField = {
          name: 'metadata',
          type: 'Json',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should generate definition for optional Json field', () => {
        const field: PrismaField = {
          name: 'extraData',
          type: 'Json',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });
    });

    describe('Update operations (isUpdate = true)', () => {
      it('should make required field optional for update', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'update', enums)).toMatchSnapshot();
      });

      it('should keep optional field optional for update', () => {
        const field: PrismaField = {
          name: 'description',
          type: 'String',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'update', enums)).toMatchSnapshot();
      });

      it('should apply update-only validations for update', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'max', value: 100, operations: ['update'] }],
          baseType: 'String',
        };

        expect(generateFieldDefinition(field, 'update', enums)).toMatchSnapshot();
      });

      it('should not apply create-only validations for update', () => {
        const field: PrismaField = {
          name: 'code',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'length', value: 6, operations: ['create'] }],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'update', enums)).toMatchSnapshot();
      });

      it('should apply both create and update validations', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'min', value: 5, operations: ['create', 'update'] }],
          baseType: 'String',
          isEnum: false,
        };

        const createResult = generateFieldDefinition(field, 'create', enums);
        const updateResult = generateFieldDefinition(field, 'update', enums);

        expect(createResult).toContain('@MinLength(5)');
        expect(updateResult).toContain('@MinLength(5)');
      });
    });

    describe('Validation operations filtering', () => {
      it('should apply validation for create when operations includes create', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'max', value: 100, operations: ['create'] }],
          baseType: 'String',
        };

        const result = generateFieldDefinition(field, 'create', enums);

        expect(result).toContain('@MaxLength(100)');
      });

      it('should not apply validation for update when operations only includes create', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'max', value: 100, operations: ['create'] }],
          baseType: 'String',
        };

        const result = generateFieldDefinition(field, 'update', enums);

        expect(result).not.toContain('@MaxLength(100)');
      });

      it('should apply validation when operations is undefined (apply to all)', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'max', value: 100 }],
          baseType: 'String',
          isEnum: false,
        };

        const createResult = generateFieldDefinition(field, 'create', enums);
        const updateResult = generateFieldDefinition(field, 'update', enums);

        expect(createResult).toContain('@MaxLength(100)');
        expect(updateResult).toContain('@MaxLength(100)');
      });
    });

    describe('Edge cases', () => {
      it('should handle field with Json type and any TypeScript type', () => {
        const field: PrismaField = {
          name: 'data',
          type: 'Json',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Json',
        };

        const result = generateFieldDefinition(field, 'create', enums);

        expect(result).toContain('any');
        expect(result).not.toContain('any | undefined');
      });

      it('should handle unknown custom validation decorator gracefully', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [{ decorator: 'unknownDecorator', value: 'test' }],
          baseType: 'String',
          isEnum: false,
        };

        const result = generateFieldDefinition(field, 'create', enums);

        // Should not throw, and unknown decorator should be ignored
        expect(result).toBeDefined();
        expect(result).not.toContain('unknownDecorator');
      });

      it('should handle field with many custom validations', () => {
        const field: PrismaField = {
          name: 'title',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [
            { decorator: 'min', value: 3, operations: ['create'] },
            { decorator: 'max', value: 100, operations: ['create'] },
            { decorator: 'pattern', value: '^[A-Z]', operations: ['create'] },
          ],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should handle optional Number field', () => {
        const field: PrismaField = {
          name: 'score',
          type: 'Int',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Int',
          isEnum: false,
        };

        const result = generateFieldDefinition(field, 'create', enums);

        expect(result).toContain('score?: number;');
      });

      it('should not add undefined for any type', () => {
        const field: PrismaField = {
          name: 'data',
          type: 'Json',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Json',
          isEnum: false,
        };

        const result = generateFieldDefinition(field, 'create', enums);

        expect(result).toContain('any');
        expect(result).not.toContain('any | undefined');
      });
    });

    describe('Complex combinations', () => {
      it('should generate complete definition for complex field with all properties', () => {
        const field: PrismaField = {
          name: 'description',
          type: 'String',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [
            { decorator: 'min', value: 10, operations: ['create', 'update'] },
            { decorator: 'max', value: 500, operations: ['create', 'update'] },
            {
              decorator: 'pattern',
              value: '^[A-Za-z0-9 ]+$',
              operations: ['create'],
            },
          ],
          baseType: 'String',
          isEnum: false,
        };

        const result = generateFieldDefinition(field, 'create', enums);

        expect(result).toMatchSnapshot();
      });

      it('should generate definition for enum field in update mode', () => {
        const field: PrismaField = {
          name: 'status',
          type: 'Status',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Status',
          isEnum: true,
        };

        expect(generateFieldDefinition(field, 'update', enums)).toMatchSnapshot();
      });

      it('should generate definition for DateTime field with validations', () => {
        const field: PrismaField = {
          name: 'scheduledAt',
          type: 'DateTime',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        };

        const createResult = generateFieldDefinition(field, 'create', enums);
        const updateResult = generateFieldDefinition(field, 'update', enums);

        expect(createResult).toMatchSnapshot();
        expect(updateResult).toMatchSnapshot();
      });

      it('should handle numeric fields with range validations', () => {
        const field: PrismaField = {
          name: 'score',
          type: 'Int',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [
            { decorator: 'min', value: 0, operations: ['create'] },
            { decorator: 'max', value: 100, operations: ['create'] },
          ],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });

      it('should handle Float fields with range validations', () => {
        const field: PrismaField = {
          name: 'rating',
          type: 'Float',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [
            { decorator: 'min', value: 0, operations: ['create'] },
            { decorator: 'max', value: 5, operations: ['create'] },
          ],
          baseType: 'String',
          isEnum: false,
        };

        expect(generateFieldDefinition(field, 'create', enums)).toMatchSnapshot();
      });
    });
  });
});
