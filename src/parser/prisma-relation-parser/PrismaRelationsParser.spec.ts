import type { PrismaModel, ParsedSchema, PrismaField } from '@tg-scripts/types';
import { PrismaRelationsParser } from './PrismaRelationsParser';

// Helper to compute baseType from type (removes [] and ?)
function computeBaseType(type: string): string {
  let baseType = type.trim();
  baseType = baseType.replace(/\?$/, '');
  baseType = baseType.replace(/\[\]$/, '');
  return baseType;
}

// Helper to create a field with baseType computed automatically
function createField(field: Omit<PrismaField, 'baseType'>): PrismaField {
  return {
    ...field,
    baseType: computeBaseType(field.type),
  };
}

describe('PrismaRelationsParser', () => {
  let parser: PrismaRelationsParser;

  beforeEach(() => {
    parser = new PrismaRelationsParser();
  });

  describe('parse', () => {
    describe('displayField resolution', () => {
      it('should use explicit tgLabelField if provided', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'name',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'title',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
          tgLabelField: 'customField',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('customField');
      });

      it('should return name if present', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'name',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('name');
      });

      it('should return title if name not present', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'title',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('title');
      });

      it('should return label if name and title not present', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'label',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('label');
      });

      it('should return slug if higher priority fields not present', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'slug',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('slug');
      });

      it('should return email if higher priority fields not present', () => {
        const model: PrismaModel = {
          name: 'User',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'email',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('email');
      });

      it('should return code if higher priority fields not present', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'code',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('code');
      });

      it('should prefer candidates in priority order', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'slug',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'name',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'code',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('name');
      });

      it('should fallback to first non-id String field when no candidates present', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'customField',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'anotherField',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('customField');
      });

      it('should return id as final fallback when no String fields', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'count',
              type: 'Int',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'active',
              type: 'Boolean',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('id');
      });

      it('should return id as final fallback when only id field exists', () => {
        const model: PrismaModel = {
          name: 'Simple',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('id');
      });

      it('should handle optional String fields in fallback', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'description',
              type: 'String?',
              isOptional: true,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('description');
      });

      it('should skip array String fields in fallback, preferring regular string fields', () => {
        const model: PrismaModel = {
          name: 'Product',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'tags',
              type: 'String[]',
              isOptional: false,
              isArray: true,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'description',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        // Should skip 'tags' (array field) and prefer 'description' (regular String)
        expect(model.displayField).toBe('description');
      });

      it('should handle multiple priority candidates, choosing first in order', () => {
        const model: PrismaModel = {
          name: 'MultiField',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'email',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'code',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'slug',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'title',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        // Should choose 'title' (higher priority than email/code/slug)
        expect(model.displayField).toBe('title');
      });

      it('should handle numeric and boolean fields, falling back to first string', () => {
        const model: PrismaModel = {
          name: 'Mixed',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'age',
              type: 'Int',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'active',
              type: 'Boolean',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'info',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('info');
      });

      it('should handle enum fields in model, still preferring string candidates', () => {
        const model: PrismaModel = {
          name: 'WithEnum',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'status',
              type: 'Status',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'displayName',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: ['Status'],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map([['Status', ['ACTIVE', 'INACTIVE']]]),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('displayName');
      });

      it('should handle relation fields in model, ignoring them', () => {
        const model: PrismaModel = {
          name: 'WithRelation',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'userId',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'user',
              type: 'User',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              relationName: 'UserPost',
              customValidations: [],
            }),
            createField({
              name: 'customLabel',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const userModel: PrismaModel = {
          name: 'User',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model, userModel],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('customLabel');
      });

      it('should handle fields with whitespace in type', () => {
        const model: PrismaModel = {
          name: 'Whitespace',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'data',
              type: '  String  ',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('data');
      });

      it('should handle optional array string fields, still skipping them', () => {
        const model: PrismaModel = {
          name: 'OptionalArray',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'items',
              type: 'String[]?',
              isOptional: true,
              isArray: true,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'summary',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('summary');
      });

      it('should ignore id field even if matching priority candidate name', () => {
        const model: PrismaModel = {
          name: 'IdAsName',
          fields: [
            createField({
              name: 'name',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'display',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        // Should skip 'name' because it's the id field, and fallback to 'display'
        expect(model.displayField).toBe('display');
      });

      it('should return id when all non-id fields are arrays', () => {
        const model: PrismaModel = {
          name: 'AllArrays',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'tags',
              type: 'String[]',
              isOptional: false,
              isArray: true,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'items',
              type: 'String[]',
              isOptional: false,
              isArray: true,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.displayField).toBe('id');
      });
    });

    describe('searchType computation', () => {
      it('should set searchType to "string" for String fields', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'name',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'name')?.searchType).toBe('string');
      });

      it('should set searchType to "number" for Int fields', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'age',
              type: 'Int',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'age')?.searchType).toBe('number');
      });

      it('should set searchType to "number" for Float fields', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'price',
              type: 'Float',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'price')?.searchType).toBe('number');
      });

      it('should set searchType to "number" for BigInt fields', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'count',
              type: 'BigInt',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'count')?.searchType).toBe('number');
      });

      it('should set searchType to "number" for Decimal fields', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'amount',
              type: 'Decimal',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'amount')?.searchType).toBe('number');
      });

      it('should set searchType to "boolean" for Boolean fields', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'active',
              type: 'Boolean',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'active')?.searchType).toBe('boolean');
      });

      it('should set searchType to "date" for DateTime fields', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'timestamp',
              type: 'DateTime',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'timestamp')?.searchType).toBe('date');
      });

      it('should set searchType to null for Json fields', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'metadata',
              type: 'Json',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'metadata')?.searchType).toBeNull();
      });

      it('should set searchType to null for relation fields', () => {
        const model: PrismaModel = {
          name: 'Post',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'user',
              type: 'User',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              relationName: 'PostUser',
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const userModel: PrismaModel = {
          name: 'User',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model, userModel],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'user')?.searchType).toBeNull();
      });

      it('should set searchType to "string" for enum fields', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'status',
              type: 'Status',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: ['Status'],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map([['Status', ['ACTIVE', 'INACTIVE']]]),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'status')?.searchType).toBe('string');
      });

      it('should handle multiple field types correctly', () => {
        const model: PrismaModel = {
          name: 'AuditLog',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'method',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'statusCode',
              type: 'Int',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'duration',
              type: 'Int',
              isOptional: true,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'timestamp',
              type: 'DateTime',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'requestBody',
              type: 'Json',
              isOptional: true,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.fields.find((f) => f.name === 'method')?.searchType).toBe('string');
        expect(model.fields.find((f) => f.name === 'statusCode')?.searchType).toBe('number');
        expect(model.fields.find((f) => f.name === 'duration')?.searchType).toBe('number');
        expect(model.fields.find((f) => f.name === 'timestamp')?.searchType).toBe('date');
        expect(model.fields.find((f) => f.name === 'requestBody')?.searchType).toBeNull();
      });
    });

    describe('defaultSortBy computation', () => {
      it('should set defaultSortBy to "timestamp" if timestamp field exists', () => {
        const model: PrismaModel = {
          name: 'AuditLog',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'timestamp',
              type: 'DateTime',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.defaultSortBy).toBe('timestamp');
      });

      it('should set defaultSortBy to "createdAt" if createdAt exists and timestamp does not', () => {
        const model: PrismaModel = {
          name: 'User',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'createdAt',
              type: 'DateTime',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.defaultSortBy).toBe('createdAt');
      });

      it('should prefer timestamp over createdAt when both exist', () => {
        const model: PrismaModel = {
          name: 'TestModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'createdAt',
              type: 'DateTime',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'timestamp',
              type: 'DateTime',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.defaultSortBy).toBe('timestamp');
      });

      it('should set defaultSortBy to "id" if neither timestamp nor createdAt exist', () => {
        const model: PrismaModel = {
          name: 'SimpleModel',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'name',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.defaultSortBy).toBe('id');
      });

      it('should handle AuditLog model correctly', () => {
        const model: PrismaModel = {
          name: 'AuditLog',
          fields: [
            createField({
              name: 'id',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: true,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'method',
              type: 'String',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'statusCode',
              type: 'Int',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
            createField({
              name: 'timestamp',
              type: 'DateTime',
              isOptional: false,
              isArray: false,
              isId: false,
              isUnique: false,
              hasDefaultValue: false,
              customValidations: [],
            }),
          ],
          enums: [],
          moduleType: 'features',
        };

        const parsedSchema: ParsedSchema<PrismaModel> = {
          models: [model],
          enums: new Map(),
        };

        parser.parse(parsedSchema);

        expect(model.defaultSortBy).toBe('timestamp');
      });
    });
  });
});
