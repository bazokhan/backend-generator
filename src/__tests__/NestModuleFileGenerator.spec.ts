import { NestModuleFileGenerator } from '../generator/nest-module-file-generator/NestModuleFileGenerator';
import type { PrismaModel } from '@tg-scripts/types';

const generator = new NestModuleFileGenerator({ suffix: 'Tg' });
const createModelObject = (name: string): PrismaModel => ({ name, fields: [], enums: [], moduleType: 'features' });

describe('NestModuleFileGenerator', () => {
  describe('Generate', () => {
    it('should generate module content for simple model', () => {
      const result = generator.generate(createModelObject('User'));

      expect(result).toContain('export class UserModule');
      expect(result).toContain('UserTgController');
      expect(result).toContain('UserTgService');
      expect(result).toContain('@Module');
    });

    it('should generate module content for compound model name', () => {
      const result = generator.generate(createModelObject('CustomFieldType'));

      expect(result).toContain('export class CustomFieldTypeModule');
      expect(result).toContain('CustomFieldTypeTgController');
      expect(result).toContain('CustomFieldTypeTgService');
    });

    it('should use correct camelCase for imports', () => {
      const result = generator.generate(createModelObject('ProjectInstance'));

      expect(result).toContain('./projectInstance.tg.controller');
      expect(result).toContain('./projectInstance.tg.service');
    });

    it('should generate correct module structure', () => {
      const result = generator.generate(createModelObject('AuditLog'));

      expect(result).toContain("import { Module } from '@nestjs/common'");
      expect(result).toContain('controllers: [');
      expect(result).toContain('providers: [');
      expect(result).toContain('exports: [');
    });

    it('should match snapshot', () => {
      const result = generator.generate(createModelObject('FeatureFlag'));
      expect(result).toMatchSnapshot();
    });
  });

  describe('Integration tests', () => {
    it('should generate complete valid NestJS module', () => {
      const models = ['User', 'CustomFieldType', 'ProjectInstance', 'AuditLog', 'Translation'];

      models.forEach((modelName) => {
        const result = generator.generate(createModelObject(modelName));

        // Verify it's valid TypeScript syntax
        expect(result).toMatch(/^import \{ Module \} from '@nestjs\/common';/);
        expect(result).toContain('@Module({');
        expect(result).toContain('controllers:');
        expect(result).toContain('providers:');
        expect(result).toContain('exports:');
        expect(result).toMatch(/export class \w+Module {}\s*$/);
      });
    });

    it('should handle various model name patterns', () => {
      const testCases = [
        { input: 'User', expected: 'UserModule' },
        { input: 'CustomFieldType', expected: 'CustomFieldTypeModule' },
        { input: 'APIEndpoint', expected: 'APIEndpointModule' },
        { input: 'OAuthToken', expected: 'OAuthTokenModule' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = generator.generate(createModelObject(input));

        expect(result).toContain(`export class ${expected} {}`);
        expect(result).toContain(`${input}TgController`);
        expect(result).toContain(`${input}TgService`);
      });
    });
  });
});
