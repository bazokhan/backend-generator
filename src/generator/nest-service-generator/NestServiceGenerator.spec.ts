import {
  getList,
  getOne,
  getMany,
  getManyReference,
  create,
  update,
  updateMany,
  deleteOne,
  deleteMany,
  getSelectFields,
  generateUniqueChecks,
} from './config';
import { NestServiceGenerator } from './NestServiceGenerator';
import type { PrismaModel } from '@tg-scripts/types';

describe('Nest Service Generator', () => {
  const modelName = 'CustomFieldType';
  const camelCaseName = 'customFieldType';
  const searchableFields = `{ name: 'name', type: 'string' }, { name: 'description', type: 'string' }`;
  const selectFields = ['id', 'name', 'type', 'required', 'createdAt', 'updatedAt'];
  const namingSuffix = 'Tg';
  describe('getList', () => {
    it('should generate getList method', () => {
      const result = getList(modelName, searchableFields);
      expect(result).toMatchSnapshot();
    });
  });

  describe('getOne', () => {
    it('should generate getOne method', () => {
      const result = getOne(modelName, camelCaseName);
      expect(result).toMatchSnapshot();
    });
  });

  describe('getMany', () => {
    it('should generate getMany method', () => {
      const result = getMany(camelCaseName);
      expect(result).toMatchSnapshot();
    });
  });

  describe('getManyReference', () => {
    it('should generate getManyReference method', () => {
      const result = getManyReference(modelName, searchableFields);
      expect(result).toMatchSnapshot();
    });
  });

  describe('create', () => {
    it('should generate create method without unique checks', () => {
      const uniqueFields: Array<{ name: string }> = [];
      const result = create(modelName, camelCaseName, uniqueFields, namingSuffix);
      expect(result).toMatchSnapshot();
    });

    it('should generate create method with unique checks', () => {
      const uniqueFields = [{ name: 'email' }];
      const result = create(modelName, camelCaseName, uniqueFields, namingSuffix);
      expect(result).toMatchSnapshot();
    });

    it('should generate create method with multiple unique checks', () => {
      const uniqueFields = [{ name: 'email' }, { name: 'username' }];
      const result = create(modelName, camelCaseName, uniqueFields, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('update', () => {
    it('should generate update method without unique checks', () => {
      const uniqueFields: Array<{ name: string }> = [];
      const result = update(modelName, camelCaseName, uniqueFields, namingSuffix);
      expect(result).toMatchSnapshot();
    });

    it('should generate update method with unique checks', () => {
      const uniqueFields = [{ name: 'email' }];
      const result = update(modelName, camelCaseName, uniqueFields, namingSuffix);
      expect(result).toMatchSnapshot();
    });

    it('should generate update method with multiple unique checks', () => {
      const uniqueFields = [{ name: 'email' }, { name: 'username' }];
      const result = update(modelName, camelCaseName, uniqueFields, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('updateMany', () => {
    it('should generate updateMany method', () => {
      const result = updateMany(modelName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('deleteOne', () => {
    it('should generate delete method', () => {
      const result = deleteOne(modelName, camelCaseName);
      expect(result).toMatchSnapshot();
    });
  });

  describe('deleteMany', () => {
    it('should generate deleteMany method', () => {
      const result = deleteMany();
      expect(result).toMatchSnapshot();
    });
  });

  describe('getSelectFields', () => {
    it('should generate getSelectFields method', () => {
      const result = getSelectFields(selectFields);
      expect(result).toMatchSnapshot();
    });

    it('should handle empty fields array', () => {
      const result = getSelectFields([]);
      expect(result).toMatchSnapshot();
    });
  });

  describe('generateUniqueChecks', () => {
    it('should return empty string when no unique fields', () => {
      const result = generateUniqueChecks(modelName, camelCaseName, []);
      expect(result).toBe('');
    });

    it('should generate unique checks for create (no isUpdate flag)', () => {
      const uniqueFields = [{ name: 'email' }];
      const result = generateUniqueChecks(modelName, camelCaseName, uniqueFields, false);
      expect(result).toMatchSnapshot();
    });

    it('should generate unique checks for update', () => {
      const uniqueFields = [{ name: 'email' }];
      const result = generateUniqueChecks(modelName, camelCaseName, uniqueFields, true);
      expect(result).toMatchSnapshot();
    });

    it('should generate multiple unique checks', () => {
      const uniqueFields = [{ name: 'email' }, { name: 'username' }];
      const result = generateUniqueChecks(modelName, camelCaseName, uniqueFields, false);
      expect(result).toMatchSnapshot();
    });

    it('should work for different model names', () => {
      const uniqueFields = [{ name: 'code' }];
      const result = generateUniqueChecks('ProjectType', camelCaseName, uniqueFields, false);
      expect(result).toMatchSnapshot();
    });
  });

  describe('Integration - all nest service methods', () => {
    it('should generate complete service for User model', () => {
      const userFields = ['id', 'email', 'name', 'role', 'createdAt'];
      const userSearchableFields = `{ name: 'email', type: 'string' }, { name: 'name', type: 'string' }`;
      const uniqueFields = [{ name: 'email' }];

      const allMethods = [
        getList('user', userSearchableFields),
        getOne('User', 'user'),
        getMany('user'),
        getManyReference('user', userSearchableFields),
        create('User', 'user', uniqueFields, namingSuffix),
        update('User', 'user', uniqueFields, namingSuffix),
        updateMany('User', namingSuffix),
        deleteOne('User', 'user'),
        deleteMany(),
        getSelectFields(userFields),
      ].join('\n\n');

      expect(allMethods).toMatchSnapshot();
    });
  });

  describe('searchType usage', () => {
    it('should generate searchable fields with correct types from searchType property', () => {
      const generator = new NestServiceGenerator({ suffix: 'Tg' });

      const model: PrismaModel = {
        name: 'AuditLog',
        fields: [
          {
            name: 'id',
            type: 'String',
            baseType: 'String',
            isOptional: false,
            isArray: false,
            isId: true,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'string',
          },
          {
            name: 'method',
            type: 'String',
            baseType: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'string',
          },
          {
            name: 'statusCode',
            type: 'Int',
            baseType: 'Int',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'number',
          },
          {
            name: 'duration',
            type: 'Int',
            baseType: 'Int',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'number',
          },
          {
            name: 'timestamp',
            type: 'DateTime',
            baseType: 'DateTime',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'date',
          },
          {
            name: 'requestBody',
            type: 'Json',
            baseType: 'Json',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: null,
          },
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = generator.generate(model);

      // Verify that searchable fields include correct types
      expect(result).toContain('fieldsToSearch: [');
      expect(result).toContain("{ name: 'method', type: 'string' }");
      expect(result).toContain("{ name: 'statusCode', type: 'number' }");
      expect(result).toContain("{ name: 'duration', type: 'number' }");
      expect(result).toContain("{ name: 'timestamp', type: 'date' }");

      // Verify that Json fields are excluded from fieldsToSearch (but may be in getSelectFields)
      // Check both occurrences of fieldsToSearch (in getList and getManyReference)
      const fieldsToSearchMatches = result.matchAll(/fieldsToSearch: \[([^\]]+)\]/g);
      const matchesArray = Array.from(fieldsToSearchMatches);
      expect(matchesArray.length).toBeGreaterThan(0);
      matchesArray.forEach((match) => {
        expect(match[1]).not.toContain('requestBody');
      });
    });

    it('should exclude fields with null searchType', () => {
      const generator = new NestServiceGenerator({ suffix: 'Tg' });

      const model: PrismaModel = {
        name: 'TestModel',
        fields: [
          {
            name: 'id',
            type: 'String',
            baseType: 'String',
            isOptional: false,
            isArray: false,
            isId: true,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'string',
          },
          {
            name: 'metadata',
            type: 'Json',
            baseType: 'Json',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: null,
          },
          {
            name: 'user',
            type: 'User',
            baseType: 'User',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            isRelation: true,
            searchType: null,
          },
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = generator.generate(model);

      // Verify that only searchable fields are included in fieldsToSearch
      expect(result).toContain("{ name: 'id', type: 'string' }");

      // Verify that non-searchable fields are excluded from fieldsToSearch
      // Check both occurrences of fieldsToSearch (in getList and getManyReference)
      const fieldsToSearchMatches = result.matchAll(/fieldsToSearch: \[([^\]]+)\]/g);
      const matchesArray = Array.from(fieldsToSearchMatches);
      expect(matchesArray.length).toBeGreaterThan(0);
      matchesArray.forEach((match) => {
        expect(match[1]).not.toContain('metadata');
        expect(match[1]).not.toContain('user');
      });
    });

    it('should handle excluded fields correctly', () => {
      const generator = new NestServiceGenerator({ suffix: 'Tg' });

      const model: PrismaModel = {
        name: 'TestModel',
        fields: [
          {
            name: 'id',
            type: 'String',
            baseType: 'String',
            isOptional: false,
            isArray: false,
            isId: true,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'string',
          },
          {
            name: 'password',
            type: 'String',
            baseType: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'string',
          },
          {
            name: 'email',
            type: 'String',
            baseType: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'string',
          },
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = generator.generate(model, { excludeFields: ['password'] });

      // Verify that excluded fields are not in searchable fields
      expect(result).toContain("{ name: 'id', type: 'string' }");
      expect(result).toContain("{ name: 'email', type: 'string' }");
      expect(result).not.toContain('password');
    });

    it('should handle all field types correctly in searchable fields', () => {
      const generator = new NestServiceGenerator({ suffix: 'Tg' });

      const model: PrismaModel = {
        name: 'TestModel',
        fields: [
          {
            name: 'id',
            type: 'String',
            baseType: 'String',
            isOptional: false,
            isArray: false,
            isId: true,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'string',
          },
          {
            name: 'textField',
            type: 'String',
            baseType: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'string',
          },
          {
            name: 'numberField',
            type: 'Int',
            baseType: 'Int',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'number',
          },
          {
            name: 'booleanField',
            type: 'Boolean',
            baseType: 'Boolean',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'boolean',
          },
          {
            name: 'dateField',
            type: 'DateTime',
            baseType: 'DateTime',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            searchType: 'date',
          },
        ],
        enums: [],
        moduleType: 'features',
      };

      const result = generator.generate(model);

      // Verify all types are correctly included
      expect(result).toContain("{ name: 'textField', type: 'string' }");
      expect(result).toContain("{ name: 'numberField', type: 'number' }");
      expect(result).toContain("{ name: 'booleanField', type: 'boolean' }");
      expect(result).toContain("{ name: 'dateField', type: 'date' }");
    });
  });
});
