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
} from '../generator/nest-controller-generator/config';
import { NestControllerGenerator } from '../generator/nest-controller-generator/NestControllerGenerator';

describe('Nest Admin Controller Generator', () => {
  const modelName = 'CustomFieldType';
  const camelCaseName = 'customFieldType';
  const namingSuffix = 'Tg';

  describe('getList', () => {
    it('should generate getList method for any model', () => {
      const result = getList(modelName, camelCaseName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('getOne', () => {
    it('should generate getOne method for any model', () => {
      const result = getOne(modelName, camelCaseName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('getMany', () => {
    it('should generate getMany method for any model', () => {
      const result = getMany(modelName, camelCaseName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('getManyReference', () => {
    it('should generate getManyReference method for any model', () => {
      const result = getManyReference(modelName, camelCaseName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('create', () => {
    it('should generate create method for any model', () => {
      const result = create(modelName, camelCaseName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('update', () => {
    it('should generate update method for any model', () => {
      const result = update(modelName, camelCaseName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('updateMany', () => {
    it('should generate updateMany method for any model', () => {
      const result = updateMany(modelName, camelCaseName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('deleteOne', () => {
    it('should generate delete method for any model', () => {
      const result = deleteOne(modelName, camelCaseName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('deleteMany', () => {
    it('should generate deleteMany method for any model', () => {
      const result = deleteMany(modelName, camelCaseName, namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('Integration - different model names', () => {
    it('should work for User model', () => {
      const result = getList('User', 'user', namingSuffix);
      expect(result).toMatchSnapshot();
    });

    it('should work for ProjectInstance model', () => {
      const result = getList('ProjectInstance', 'projectInstance', namingSuffix);
      expect(result).toMatchSnapshot();
    });

    it('should work for AuditLog model', () => {
      const result = getList('AuditLog', 'auditLog', namingSuffix);
      expect(result).toMatchSnapshot();
    });
  });

  describe('All operations together', () => {
    it('should generate complete controller methods', () => {
      const allMethods = [
        getList(modelName, camelCaseName, namingSuffix),
        getOne(modelName, camelCaseName, namingSuffix),
        getMany(modelName, camelCaseName, namingSuffix),
        getManyReference(modelName, camelCaseName, namingSuffix),
        create(modelName, camelCaseName, namingSuffix),
        update(modelName, camelCaseName, namingSuffix),
        updateMany(modelName, camelCaseName, namingSuffix),
        deleteOne(modelName, camelCaseName, namingSuffix),
        deleteMany(modelName, camelCaseName, namingSuffix),
      ].join('\n\n');

      expect(allMethods).toMatchSnapshot();
    });
  });

  describe('getApiEndpoint', () => {
    it('should generate correct API endpoint for simple models', () => {
      const generator = new NestControllerGenerator({ suffix: 'tg' });
      expect(generator.getApiEndpoint('User')).toBe('tg-api/users');
      expect(generator.getApiEndpoint('Project')).toBe('tg-api/projects');
    });

    it('should generate correct API endpoint for compound models', () => {
      const generator = new NestControllerGenerator({ suffix: 'tg' });
      expect(generator.getApiEndpoint('CustomFieldType')).toBe('tg-api/custom-field-types');
      expect(generator.getApiEndpoint('ProjectInstance')).toBe('tg-api/project-instances');
      expect(generator.getApiEndpoint('UnitType')).toBe('tg-api/unit-types');
    });

    it('should handle models with special pluralization', () => {
      const generator = new NestControllerGenerator({ suffix: 'tg' });
      expect(generator.getApiEndpoint('Category')).toBe('tg-api/categories');
      expect(generator.getApiEndpoint('Company')).toBe('tg-api/companies');
    });

    it('should handle models ending in s', () => {
      const generator = new NestControllerGenerator({ suffix: 'tg' });
      expect(generator.getApiEndpoint('Status')).toBe('tg-api/statuses');
    });

    it('should handle models with consecutive uppercase letters', () => {
      const generator = new NestControllerGenerator({ suffix: 'tg' });
      expect(generator.getApiEndpoint('APIKey')).toBe('tg-api/api-keys');
      expect(generator.getApiEndpoint('HTTPResponse')).toBe('tg-api/http-responses');
    });

    it('should handle models with numbers', () => {
      const generator = new NestControllerGenerator({ suffix: 'tg' });
      expect(generator.getApiEndpoint('User2FA')).toBe('tg-api/user2-fas');
      expect(generator.getApiEndpoint('Test3D')).toBe('tg-api/test3-ds');
    });

    it('should handle hyphenated compound names', () => {
      const generator = new NestControllerGenerator({ suffix: 'tg' });
      expect(generator.getApiEndpoint('DataField')).toBe('tg-api/data-fields');
      expect(generator.getApiEndpoint('UserRole')).toBe('tg-api/user-roles');
    });

    it('should prefer config.api.prefix when provided', () => {
      const generator = new NestControllerGenerator({ suffix: 'Admin', prefix: 'public-api' });
      expect(generator.getApiEndpoint('User')).toBe('public-api/users');
      expect(generator.getApiEndpoint('CustomFieldType')).toBe('public-api/custom-field-types');
    });
  });
});
