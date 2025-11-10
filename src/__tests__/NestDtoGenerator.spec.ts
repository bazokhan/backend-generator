import type { PrismaModel, PrismaField } from '@tg-scripts/types';
import { NestDtoGenerator } from '../generator/nest-dto-generator/NestDtoGenerator';

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

describe('Nest DTO Generator', () => {
  const dtoGenerator = new NestDtoGenerator({ suffix: 'Tg' });

  describe('Generate Response DTO', () => {
    const enums = new Map<string, string[]>([['Status', ['ACTIVE', 'INACTIVE']]]);

    it('should generate basic ResponseDto content', () => {
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

      const result = dtoGenerator.generate({ model, dtoType: 'response', enums });
      expect(result).toContain('export class PostResponseDto');
      expect(result).toContain('title: string;');
      expect(result).toContain('@ApiProperty');
      expect(result).toContain("import { ApiProperty } from '@nestjs/swagger'");
    });

    it('should generate optional fields correctly', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
          createField({
            name: 'description',
            type: 'String',
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

      const result = dtoGenerator.generate({ model, dtoType: 'response', enums });
      expect(result).toContain('description?: string | null;');
      expect(result).toContain('"required":false');
      expect(result).toContain('"nullable":true');
    });

    it('should generate relation fields as optional', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
          createField({
            name: 'author',
            type: 'User',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isRelation: true,
          }),
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = dtoGenerator.generate({ model, dtoType: 'response', enums });
      expect(result).toContain('author?: UserResponseDto | null;');
      expect(result).toContain('import { UserResponseDto }');
      expect(result).toContain('./user-response.dto');
    });

    it('should generate enum fields correctly', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
          createField({
            name: 'status',
            type: 'Status',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: true,
          }),
        ],
        enums: ['Status'],
        moduleType: 'features',
      };

      const result = dtoGenerator.generate({ model, dtoType: 'response', enums });
      expect(result).toContain('status: Status;');
      expect(result).toContain("import { Status } from '@/generated/prisma'");
    });

    it('should generate all field types correctly', () => {
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
            name: 'price',
            type: 'Float',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
          }),
          createField({
            name: 'isActive',
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

      const result = dtoGenerator.generate({ model, dtoType: 'response', enums });
      expect(result).toContain('name: string;');
      expect(result).toContain('price: number;');
      expect(result).toContain('isActive: boolean;');
    });
  });

  describe('Generate Create DTO', () => {
    const enums = new Map<string, string[]>([['Status', ['ACTIVE', 'INACTIVE']]]);

    it('should generate CreateDto with filtered fields', () => {
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
            name: 'title',
            type: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
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

      const result = dtoGenerator.generate({ model, dtoType: 'create', enums });
      expect(result).toContain('export class CreatePostTgDto');
      expect(result).toContain('title');
      expect(result).not.toMatch(/\bid\b/); // Use word boundary to avoid matching "id" in "description"
      expect(result).not.toContain('createdAt');
      expect(result).toContain("import { ApiProperty } from '@nestjs/swagger'");
    });

    it('should include validation decorators', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [
          createField({
            name: 'email',
            type: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            tgFormat: 'email',
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

      const result = dtoGenerator.generate({ model, dtoType: 'create', enums });
      expect(result).toContain('IsString');
      expect(result).toContain('IsEmail');
      expect(result).toContain('IsNumber');
      expect(result).toContain("from 'class-validator'");
    });

    it('should include enum fields with validation', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
          createField({
            name: 'status',
            type: 'Status',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: true,
          }),
        ],
        enums: ['Status'],
        moduleType: 'features',
      };

      const result = dtoGenerator.generate({ model, dtoType: 'create', enums });
      expect(result).toContain('IsEnum');
      expect(result).toContain('Status');
      expect(result).toContain("from '@/generated/prisma'");
    });

    it('should exclude optional decorator for required fields', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
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

      const result = dtoGenerator.generate({ model, dtoType: 'create', enums });
      // IsOptional should not be included for required create fields
      expect(result).not.toContain('IsOptional');
    });

    it('should include optional decorator for optional fields', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
          createField({
            name: 'description',
            type: 'String',
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

      const result = dtoGenerator.generate({ model, dtoType: 'create', enums });
      expect(result).toContain('IsOptional');
    });

    it('should filter out relation fields', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
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
          createField({
            name: 'author',
            type: 'User',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            relationName: 'UserPost',
            customValidations: [],
          }),
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = dtoGenerator.generate({ model, dtoType: 'create', enums });
      expect(result).toContain('title');
      expect(result).not.toContain('author');
    });

    it('should include array fields with proper validators', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
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
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = dtoGenerator.generate({ model, dtoType: 'create', enums });
      expect(result).toContain('title');
      expect(result).toContain('tags');
      expect(result).toContain('@IsArray()');
      expect(result).toContain('@IsString({ each: true })');
    });
  });

  describe('Generate Update DTO', () => {
    const enums = new Map<string, string[]>([['Status', ['ACTIVE', 'INACTIVE']]]);

    it('should generate UpdateDto with filtered fields', () => {
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
            name: 'title',
            type: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
          }),
          createField({
            name: 'updatedAt',
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

      const result = dtoGenerator.generate({ model, dtoType: 'update', enums });
      expect(result).toContain('export class UpdatePostTgDto');
      expect(result).toContain('title');
      expect(result).not.toMatch(/\bid\b/); // Use word boundary to avoid matching "id" in "description"
      expect(result).not.toContain('updatedAt');
    });

    it('should include IsOptional for all fields in update DTOs', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
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

      const result = dtoGenerator.generate({ model, dtoType: 'update', enums });
      expect(result).toContain('IsOptional');
    });

    it('should use same field filtering logic as CreateDto', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
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
            name: 'author',
            type: 'User',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            relationName: 'UserPost',
            customValidations: [],
          }),
        ],
        enums: [],
        moduleType: 'features',
      };

      const createResult = dtoGenerator.generate({ model, dtoType: 'create', enums });
      const updateResult = dtoGenerator.generate({ model, dtoType: 'update', enums });

      // Both should filter the same fields
      expect(createResult).toContain('title');
      expect(createResult).not.toMatch(/\bid\b/); // Use word boundary to avoid matching "id" in "description"
      expect(createResult).not.toContain('author');

      expect(updateResult).toContain('title');
      expect(updateResult).not.toMatch(/\bid\b/); // Use word boundary to avoid matching "id" in "description"
      expect(updateResult).not.toContain('author');
    });

    it('should generate same imports structure as CreateDto', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [
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

      const createResult = dtoGenerator.generate({ model, dtoType: 'create', enums });
      const updateResult = dtoGenerator.generate({ model, dtoType: 'update', enums });

      // Both should have same validator and enum imports
      expect(createResult).toContain("from 'class-validator'");
      expect(updateResult).toContain("from 'class-validator'");
      expect(createResult).toContain("from '@/generated/prisma'");
      expect(updateResult).toContain("from '@/generated/prisma'");
    });
  });

  describe('Cross-layer consistency', () => {
    const enums = new Map<string, string[]>([['Status', ['ACTIVE', 'INACTIVE']]]);

    it('should use same field filtering for CreateDto and UpdateDto', () => {
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
            isEnum: false,
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
            isEnum: false,
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
            isEnum: false,
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
            isEnum: false,
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
            isEnum: false,
          }),
          createField({
            name: 'category',
            type: 'Category',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            relationName: 'ProductCategory',
            customValidations: [],
            isEnum: false,
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
            isEnum: true,
          }),
        ],
        enums: ['Status'],
        moduleType: 'features',
      };

      const createResult = dtoGenerator.generate({ model, dtoType: 'create', enums });
      const updateResult = dtoGenerator.generate({ model, dtoType: 'update', enums });

      // Both should include: name, price, status, tags (array fields now supported)
      expect(createResult).toContain('name');
      expect(createResult).toContain('price');
      expect(createResult).toContain('status');
      expect(createResult).toContain('tags'); // Array fields are now included
      expect(createResult).not.toMatch(/\bid\b/); // Use word boundary to avoid matching "id" in "description"
      expect(createResult).not.toContain('createdAt');
      expect(createResult).not.toContain('category');

      expect(updateResult).toContain('name');
      expect(updateResult).toContain('price');
      expect(updateResult).toContain('status');
      expect(updateResult).toContain('tags'); // Array fields are now included
      expect(updateResult).not.toMatch(/\bid\b/); // Use word boundary to avoid matching "id" in "description"
      expect(updateResult).not.toContain('createdAt');
      expect(updateResult).not.toContain('category');
    });

    it('should use same import generation logic', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
          createField({
            name: 'title',
            type: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [
              { decorator: 'max', value: 100 },
              { decorator: 'min', value: 5 },
            ],
            isEnum: false,
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
            isEnum: true,
          }),
        ],
        enums: ['Status'],
        moduleType: 'features',
      };

      const createResult = dtoGenerator.generate({ model, dtoType: 'create', enums });
      const updateResult = dtoGenerator.generate({ model, dtoType: 'update', enums });

      // Both should have validator imports
      expect(createResult).toContain('IsString');
      expect(createResult).toContain('MaxLength');
      expect(createResult).toContain('MinLength');
      expect(updateResult).toContain('IsString');
      expect(updateResult).toContain('MaxLength');
      expect(updateResult).toContain('MinLength');

      // Both should have enum imports
      expect(createResult).toContain('IsEnum');
      expect(createResult).toContain('Status');
      expect(updateResult).toContain('IsEnum');
      expect(updateResult).toContain('Status');
    });
  });

  describe('Complex snapshot tests', () => {
    const enums = new Map<string, string[]>([
      ['Status', ['ACTIVE', 'INACTIVE', 'PENDING']],
      ['Priority', ['LOW', 'MEDIUM', 'HIGH']],
      ['Role', ['USER', 'ADMIN', 'MODERATOR']],
    ]);

    it('should generate complete ResponseDto with all field types and relations', () => {
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
            isEnum: false,
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
            isEnum: false,
          }),
          createField({
            name: 'content',
            type: 'String',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
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
            isEnum: true,
          }),
          createField({
            name: 'priority',
            type: 'Priority',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: true,
          }),
          createField({
            name: 'views',
            type: 'Int',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
          createField({
            name: 'rating',
            type: 'Float',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
          createField({
            name: 'isPublished',
            type: 'Boolean',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
          createField({
            name: 'publishedAt',
            type: 'DateTime',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
          createField({
            name: 'metadata',
            type: 'Json',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
          createField({
            name: 'author',
            type: 'User',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
          createField({
            name: 'comments',
            type: 'Comment[]',
            isOptional: false,
            isArray: true,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
          createField({
            name: 'category',
            type: 'Category',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
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
            isEnum: false,
          }),
          createField({
            name: 'updatedAt',
            type: 'DateTime',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
        ],
        enums: ['Status', 'Priority'],
        moduleType: 'features',
      };

      const result = dtoGenerator.generate({ model, dtoType: 'response', enums });
      expect(result).toMatchSnapshot();
    });

    it('should generate complex CreateDto with all validations and field types', () => {
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
            isEnum: false,
          }),
          createField({
            name: 'email',
            type: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: true,
            hasDefaultValue: false,
            customValidations: [
              { decorator: 'max', value: 255 },
              {
                decorator: 'pattern',
                value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
              },
            ],
            isEnum: false,
          }),
          createField({
            name: 'username',
            type: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: true,
            hasDefaultValue: false,
            customValidations: [
              { decorator: 'min', value: 3 },
              { decorator: 'max', value: 30 },
              { decorator: 'pattern', value: '^[a-zA-Z0-9_]+$' },
            ],
            isEnum: false,
          }),
          createField({
            name: 'password',
            type: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [{ decorator: 'min', value: 8 }],
            isEnum: false,
          }),
          createField({
            name: 'age',
            type: 'Int',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [
              { decorator: 'min', value: 13 },
              { decorator: 'max', value: 120 },
            ],
            isEnum: false,
          }),
          createField({
            name: 'salary',
            type: 'Float',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [{ decorator: 'min', value: 0 }],
            isEnum: false,
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
            isEnum: true,
          }),
          createField({
            name: 'role',
            type: 'Role',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: true,
          }),
          createField({
            name: 'isActive',
            type: 'Boolean',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
          createField({
            name: 'biography',
            type: 'String',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [{ decorator: 'max', value: 1000 }],
            isEnum: false,
          }),
          createField({
            name: 'website',
            type: 'String',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [{ decorator: 'pattern', value: '^https?://' }],
            isEnum: false,
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
            isEnum: false,
          }),
          createField({
            name: 'updatedAt',
            type: 'DateTime',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isEnum: false,
          }),
        ],
        enums: ['Status', 'Role'],
        moduleType: 'features',
      };

      const createResult = dtoGenerator.generate({ model, dtoType: 'create', enums });
      const updateResult = dtoGenerator.generate({ model, dtoType: 'update', enums });

      expect(createResult).toMatchSnapshot();
      expect(updateResult).toMatchSnapshot();
    });
  });
});
