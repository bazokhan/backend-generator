import { generateDtoImports, filterDtoFields } from './dto-utils';
import type { PrismaField, PrismaModel } from '@tg-scripts/types';

describe('DTO Utilities', () => {
  describe('generateDtoImports (Response DTOs)', () => {
    it('should return relation imports for relation fields', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
          {
            name: 'author',
            type: 'User',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isRelation: true,
            baseType: 'User',
            isEnum: false,
          },
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = generateDtoImports(model, model.fields, 'response');
      expect(result).toContain('UserResponseDto');
      expect(result).toContain('./user-response.dto');
    });

    it('should return enum imports for enum fields', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [
          {
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
          },
        ],
        enums: ['Status'],
        moduleType: 'features',
      };

      const result = generateDtoImports(model, model.fields, 'response');
      expect(result).toContain('Status');
      expect(result).toContain('@/generated/prisma');
    });

    it('should exclude self-references from relation imports', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [
          {
            name: 'parent',
            type: 'Post',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            baseType: 'Post',
            isEnum: false,
          },
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = generateDtoImports(model, model.fields, 'response');
      expect(result).not.toContain('PostResponseDto');
    });

    it('should handle multiple relation types', () => {
      const model: PrismaModel = {
        name: 'Comment',
        fields: [
          {
            name: 'author',
            type: 'User',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isRelation: true,
            baseType: 'User',
            isEnum: false,
          },
          {
            name: 'post',
            type: 'Post',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isRelation: true,
            baseType: 'Post',
            isEnum: false,
          },
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = generateDtoImports(model, model.fields, 'response');
      expect(result).toContain('UserResponseDto');
      expect(result).toContain('PostResponseDto');
    });

    it('should handle multiple enum types', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [
          {
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
          },
          {
            name: 'role',
            type: 'Role',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            baseType: 'Role',
            isEnum: true,
          },
        ],
        enums: ['Status', 'Role'],
        moduleType: 'features',
      };

      const result = generateDtoImports(model, model.fields, 'response');
      expect(result).toContain('Status');
      expect(result).toContain('Role');
    });

    it('should return empty arrays when no relations or enums', () => {
      const model: PrismaModel = {
        name: 'Product',
        fields: [
          {
            name: 'name',
            type: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            baseType: 'String',
            isEnum: false,
          },
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = generateDtoImports(model, model.fields, 'response');
      expect(result).not.toContain('ResponseDto');
      expect(result).not.toContain('@/generated/prisma');
    });
  });

  describe('filterDtoFields', () => {
    it('should include primitive string fields', () => {
      const fields: PrismaField[] = [
        {
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
        },
      ];

      const result = filterDtoFields(fields, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('title');
    });

    it('should include enum fields', () => {
      const fields: PrismaField[] = [
        {
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
        },
      ];

      const result = filterDtoFields(fields, 'create');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('status');
    });

    it('should exclude id fields', () => {
      const fields: PrismaField[] = [
        {
          name: 'id',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: true,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        },
      ];

      const result = filterDtoFields(fields, 'create');
      expect(result).toHaveLength(0);
    });

    it('should exclude timestamp fields', () => {
      const fields: PrismaField[] = [
        {
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
        },
        {
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
        },
        {
          name: 'name',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        },
      ];

      const result = filterDtoFields(fields, 'create');
      // createdAt and updatedAt should be filtered out, name should remain
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('name');
    });

    it('should filter out createdAt field specifically in update DTOs', () => {
      const fields: PrismaField[] = [
        {
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
        },
      ];

      const result = filterDtoFields(fields, 'update');
      expect(result).toHaveLength(0);
    });

    it('should filter out updatedAt field specifically in update DTOs', () => {
      const fields: PrismaField[] = [
        {
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
        },
      ];

      const result = filterDtoFields(fields, 'update');
      expect(result).toHaveLength(0);
    });

    it('should exclude array fields', () => {
      const fields: PrismaField[] = [
        {
          name: 'tags',
          type: 'String[]',
          isOptional: false,
          isArray: true,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        },
      ];

      const result = filterDtoFields(fields, 'create');
      expect(result).toHaveLength(0);
    });

    it('should exclude relation fields', () => {
      const fields: PrismaField[] = [
        {
          name: 'user',
          type: 'User',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          relationName: 'UserPost',
          customValidations: [],
          baseType: 'User',
          isEnum: false,
        },
      ];

      const result = filterDtoFields(fields, 'create');
      expect(result).toHaveLength(0);
    });

    it('should include multiple primitive types', () => {
      const fields: PrismaField[] = [
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
          name: 'publishedAt',
          type: 'DateTime',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'DateTime',
          isEnum: false,
        },
        {
          name: 'metadata',
          type: 'Json',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Json',
          isEnum: false,
        },
      ];

      const result = filterDtoFields(fields, 'create');
      expect(result).toHaveLength(6);
      expect(result.map((f) => f.name)).toEqual(['title', 'age', 'price', 'isActive', 'publishedAt', 'metadata']);
    });

    it('should handle optional fields', () => {
      const fields: PrismaField[] = [
        {
          name: 'description',
          type: 'String?',
          isOptional: true,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        },
      ];

      const result = filterDtoFields(fields, 'create');
      expect(result).toHaveLength(1);
    });

    it('should handle complex scenario with mixed fields', () => {
      const fields: PrismaField[] = [
        {
          name: 'id',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: true,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        },
        {
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
        },
        {
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
        },
        {
          name: 'user',
          type: 'User',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          relationName: 'UserPost',
          customValidations: [],
          baseType: 'User',
          isEnum: false,
        },
        {
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
        },
      ];

      const result = filterDtoFields(fields, 'create');
      expect(result).toHaveLength(2);
      expect(result.map((f) => f.name)).toEqual(['title', 'status']);
    });

    it('should use availableModels parameter when provided for relation detection', () => {
      const fields: PrismaField[] = [
        {
          name: 'user',
          type: 'User',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'User',
          isEnum: false,
        },
        {
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
        },
      ];

      // When availableModels is provided, it uses isRelationField which will detect 'User' type
      const result = filterDtoFields(fields, 'create');
      // 'user' field should be filtered out (it's a relation), 'title' should remain
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('title');
    });
  });

  describe('generateDtoImports (Create/Update DTOs)', () => {
    it('should generate imports for String fields', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
          name: 'name',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('IsString');
      expect(result).toContain("from 'class-validator'");
    });

    it('should generate IsEmail import for email fields (based on tg_format email)', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
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
          tgFormat: 'email',
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('IsEmail');
      expect(result).toContain('IsString');
    });

    it('should generate IsUrl import when tg_format url is set', () => {
      const model: PrismaModel = {
        name: 'Bookmark',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
          name: 'target',
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
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('IsUrl');
    });

    it('should generate Matches import when tg_format tel is set', () => {
      const model: PrismaModel = {
        name: 'Contact',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
          name: 'phoneNumber',
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
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('Matches');
    });

    it('should generate imports for number fields', () => {
      const model: PrismaModel = {
        name: 'Product',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
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
        },
        {
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
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('IsNumber');
    });

    it('should generate imports for Boolean fields', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
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
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('IsBoolean');
    });

    it('should generate imports for DateTime fields', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
          name: 'publishedAt',
          type: 'DateTime',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'DateTime',
          isEnum: false,
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('IsDateString');
    });

    it('should generate imports for enum fields', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [],
        enums: ['Status'],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
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
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('IsEnum');
      expect(result).toContain('Status');
      expect(result).toContain("from '@/generated/prisma'");
    });

    it('should generate IsEnum import for enum field after checking other types', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
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
        },
      ];

      const result = generateDtoImports(model, fields, 'update');
      // Should go through all the else-if checks and reach the enum check
      expect(result).toContain('IsEnum');
    });

    it('should generate IsEnum import for enum field that is not String, Number, Boolean, or DateTime', () => {
      const model: PrismaModel = {
        name: 'Task',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
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
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('IsEnum');
      expect(result).toContain('Priority');
    });

    it('should generate IsOptional for update DTOs', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
          name: 'name',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        },
      ];

      const result = generateDtoImports(model, fields, 'update');
      expect(result).toContain('IsOptional');
    });

    it('should generate IsOptional for optional fields', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
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
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('IsOptional');
    });

    it('should generate validation decorator imports', () => {
      const model: PrismaModel = {
        name: 'Post',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
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
            { decorator: 'length', value: 10 },
            { decorator: 'pattern', value: '^[A-Z]' },
          ],
          baseType: 'String',
          isEnum: false,
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('MaxLength');
      expect(result).toContain('MinLength');
      expect(result).toContain('Length');
      expect(result).toContain('Matches');
    });

    it('should generate Max/Min for number fields with max/min validations', () => {
      const model: PrismaModel = {
        name: 'Product',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
          name: 'price',
          type: 'Int',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [
            { decorator: 'max', value: 1000 },
            { decorator: 'min', value: 0 },
          ],
          baseType: 'Int',
          isEnum: false,
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('Max');
      expect(result).toContain('Min');
      expect(result).not.toContain('MaxLength');
      expect(result).not.toContain('MinLength');
    });

    it('should generate multiple enum imports', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [],
        enums: ['Status', 'Role'],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
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
        },
        {
          name: 'role',
          type: 'Role',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'Role',
          isEnum: true,
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain('Status');
      expect(result).toContain('Role');
    });

    it('should return empty string when no imports needed', () => {
      const model: PrismaModel = {
        name: 'Empty',
        fields: [],
        enums: [],
        moduleType: 'features',
      };

      const result = generateDtoImports(model, [], 'create');
      expect(result).toBe('');
    });

    it('should separate validator imports from enum imports', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [],
        enums: ['Status'],
        moduleType: 'features',
      };

      const fields: PrismaField[] = [
        {
          name: 'name',
          type: 'String',
          isOptional: false,
          isArray: false,
          isId: false,
          isUnique: false,
          hasDefaultValue: false,
          customValidations: [],
          baseType: 'String',
          isEnum: false,
        },
        {
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
        },
      ];

      const result = generateDtoImports(model, fields, 'create');
      expect(result).toContain("from 'class-validator'");
      expect(result).toContain("from '@/generated/prisma'");
      expect(result.split("from 'class-validator'")[0]).toContain('IsString');
      expect(result.split("from '@/generated/prisma'")[0]).toContain('Status');
    });
  });
});
