import type { PrismaModel } from '@tg-scripts/types';
import { DataProviderEndpointGenerator } from '../generator/data-provider-endpoint-generator/DataProviderEndpointGenerator';

describe('DataProviderEndpointGenerator', () => {
  let generator: DataProviderEndpointGenerator;

  beforeEach(() => {
    generator = new DataProviderEndpointGenerator();
  });

  describe('extractCustomEndpoints', () => {
    it('should extract custom endpoints when auto-generated section exists', () => {
      const content = `   // Auto-generated API endpoints
    'user': 'tg-api/users',
    'featureflag': 'tg-api/feature-flags',
    // Custom endpoints
    'custom': 'api/custom',
    'another': 'api/another'`;
      const result = generator.extractCustomEndpoints(content);

      expect(result).toContain("'custom': 'api/custom'");
      expect(result).toContain("'another': 'api/another'");
      expect(result).not.toContain("'user':");
      expect(result).not.toContain("'featureflag':");
    });

    it('should return empty string if no custom endpoints after auto-generated section', () => {
      const content = `   // Auto-generated API endpoints
    'user': 'tg-api/users',
    // Custom endpoints
`;
      const result = generator.extractCustomEndpoints(content);

      expect(result).toBe('');
    });

    it('should extract all endpoints when no auto-generated section exists', () => {
      const content = `    'custom': 'api/custom',
    'another': 'api/another',
    'test': 'api/test'`;
      const result = generator.extractCustomEndpoints(content);

      expect(result).toContain("'custom':");
      expect(result).toContain("'another':");
      expect(result).toContain("'test':");
    });

    it('should filter out comment lines', () => {
      const content = `   // Auto-generated API endpoints
    'user': 'tg-api/users',
    // Custom endpoints
    'custom': 'api/custom',
    // This is a comment
    'another': 'api/another'`;
      const result = generator.extractCustomEndpoints(content);

      expect(result).not.toContain('// This is a comment');
      expect(result).toContain("'another':");
    });

    it('should filter out empty lines', () => {
      const content = `   // Auto-generated API endpoints
    'user': 'tg-api/users',
    // Custom endpoints
    'custom': 'api/custom',
    
    'another': 'api/another'`;
      const result = generator.extractCustomEndpoints(content);

      expect(result).not.toMatch(/\n\n\n/);
      expect(result).toContain("'custom':");
      expect(result).toContain("'another':");
    });

    it('should remove old auto-generated entries (user, featureflag)', () => {
      const content = `   // Auto-generated API endpoints
    'user': 'tg-api/users',
    'featureflag': 'tg-api/feature-flags',
    // Custom endpoints
    'custom': 'api/custom'`;
      const result = generator.extractCustomEndpoints(content);

      expect(result).not.toContain("'user':");
      expect(result).not.toContain("'featureflag':");
      expect(result).toContain("'custom':");
    });

    it('should handle empty content', () => {
      const result = generator.extractCustomEndpoints('');
      expect(result).toBe('');
    });

    it('should handle content with only comments', () => {
      const content = `   // Auto-generated API endpoints
    // Custom endpoints
    // Just comments`;
      const result = generator.extractCustomEndpoints(content);

      expect(result).toBe('');
    });

    it('should return empty string when multiple auto-generated sections exist but no custom match', () => {
      const content = `   // Auto-generated API endpoints
'user': 'tg-api/users',
'featureflag': 'tg-api/feature-flags'`;
      const result = generator.extractCustomEndpoints(content);

      expect(result).toBe('');
    });
  });

  describe('generateEndpointMappings', () => {
    const getResourceName = (modelName: string) => {
      const kebab = modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      return kebab.endsWith('s') ? kebab : `${kebab}s`;
    };

    const getApiEndpoint = (modelName: string) => {
      const kebab = modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      return `tg-api/${kebab.endsWith('s') ? kebab : `${kebab}s`}`;
    };

    it('should generate mappings for models with modulePath', () => {
      const models: PrismaModel[] = [
        {
          name: 'User',
          fields: [],
          enums: [],
          modulePath: '/src/features/user',
          moduleType: 'features',
        },
        {
          name: 'Project',
          fields: [],
          enums: [],
          modulePath: '/src/features/project',
          moduleType: 'features',
        },
      ];

      const result = generator.generateEndpointMappings(models, getResourceName, getApiEndpoint);

      expect(result).toContain("'users':");
      expect(result).toContain("'projects':");
      expect(result).toContain('tg-api/users');
      expect(result).toContain('tg-api/projects');
    });

    it('should filter out models without modulePath', () => {
      const models: PrismaModel[] = [
        {
          name: 'User',
          fields: [],
          enums: [],
          modulePath: '/src/features/user',
          moduleType: 'features',
        },
        {
          name: 'Project',
          fields: [],
          enums: [],
          moduleType: 'features',
        },
      ];

      const result = generator.generateEndpointMappings(models, getResourceName, getApiEndpoint);

      expect(result).toContain("'users':");
      expect(result).not.toContain("'projects':");
    });

    it('should handle empty models array', () => {
      const result = generator.generateEndpointMappings([], getResourceName, getApiEndpoint);

      expect(result).toBe('');
    });

    it('should handle compound model names', () => {
      const models: PrismaModel[] = [
        {
          name: 'CustomFieldType',
          fields: [],
          enums: [],
          modulePath: '/src/features/custom-field-type',
          moduleType: 'features',
        },
      ];

      const result = generator.generateEndpointMappings(models, getResourceName, getApiEndpoint);

      expect(result).toContain("'custom-field-types':");
      expect(result).toContain('tg-api/custom-field-types');
    });

    it('should format mappings with proper indentation', () => {
      const models: PrismaModel[] = [
        {
          name: 'User',
          fields: [],
          enums: [],
          modulePath: '/src/features/user',
          moduleType: 'features',
        },
      ];

      const result = generator.generateEndpointMappings(models, getResourceName, getApiEndpoint);

      expect(result).toMatch(/^ {4}'/m);
    });
  });

  describe('buildEndpointMap', () => {
    it('should build endpoint map with auto-generated and custom endpoints', () => {
      const autoGeneratedMappings = `    'users': 'tg-api/users',
    'projects': 'tg-api/projects'`;
      const customEndpoints = `    'custom': 'api/custom',
    'another': 'api/another'`;

      const result = generator.buildEndpointMap(autoGeneratedMappings, customEndpoints);

      expect(result).toContain('const endpointMap: Record<string, string> = {');
      expect(result).toContain('// Auto-generated API endpoints');
      expect(result).toContain("'users': 'tg-api/users'");
      expect(result).toContain('// Custom endpoints');
      expect(result).toContain("'custom': 'api/custom'");
      expect(result).toContain('};');
    });

    it('should build endpoint map with only auto-generated endpoints', () => {
      const autoGeneratedMappings = `    'users': 'tg-api/users'`;
      const customEndpoints = '';

      const result = generator.buildEndpointMap(autoGeneratedMappings, customEndpoints);

      expect(result).toContain('// Auto-generated API endpoints');
      expect(result).toContain("'users': 'tg-api/users'");
      expect(result).not.toContain('// Custom endpoints');
      expect(result).toContain('};');
    });

    it('should build endpoint map with only custom endpoints', () => {
      const autoGeneratedMappings = '';
      const customEndpoints = `    'custom': 'api/custom'`;

      const result = generator.buildEndpointMap(autoGeneratedMappings, customEndpoints);

      expect(result).toContain('const endpointMap: Record<string, string> = {');
      expect(result).toContain('// Auto-generated API endpoints');
      expect(result).not.toContain("'users':");
      expect(result).not.toContain('// Custom endpoints');
      expect(result).toContain("'custom': 'api/custom'");
    });

    it('should handle empty inputs', () => {
      const result = generator.buildEndpointMap('', '');

      expect(result).toContain('const endpointMap: Record<string, string> = {');
      expect(result).toContain('// Auto-generated API endpoints');
      expect(result).not.toContain('// Custom endpoints');
      expect(result).toContain('};');
    });

    it('should format output correctly', () => {
      const autoGeneratedMappings = `    'users': 'tg-api/users',
    'projects': 'tg-api/projects'`;
      const customEndpoints = `    'custom': 'api/custom'`;

      const result = generator.buildEndpointMap(autoGeneratedMappings, customEndpoints);

      const lines = result.split('\n');
      expect(lines[0]).toContain('const endpointMap');
      expect(lines.some((l) => l.includes('Auto-generated'))).toBe(true);
      expect(lines.some((l) => l.includes('users'))).toBe(true);
      expect(lines.some((l) => l.includes('Custom endpoints'))).toBe(true);
      expect(lines.some((l) => l.includes('custom'))).toBe(true);
      expect(lines[lines.length - 1]).toContain('};');
    });
  });

  describe('Integration and snapshot tests', () => {
    it('should match snapshot for complete endpoint map generation', () => {
      const getResourceName = (modelName: string) => {
        const kebab = modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        return kebab.endsWith('s') ? kebab : `${kebab}s`;
      };

      const getApiEndpoint = (modelName: string) => {
        const kebab = modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        return `tg-api/${kebab.endsWith('s') ? kebab : `${kebab}s`}`;
      };

      const models: PrismaModel[] = [
        {
          name: 'User',
          fields: [],
          enums: [],
          modulePath: '/src/features/user',
          moduleType: 'features',
        },
        {
          name: 'Project',
          fields: [],
          enums: [],
          modulePath: '/src/features/project',
          moduleType: 'features',
        },
        {
          name: 'CustomFieldType',
          fields: [],
          enums: [],
          modulePath: '/src/features/custom-field-type',
          moduleType: 'features',
        },
      ];

      const existingContent = `   // Auto-generated API endpoints
    'user': 'tg-api/users',
    // Custom endpoints
    'legacy': 'api/legacy'`;

      const customEndpoints = generator.extractCustomEndpoints(existingContent);
      const autoGeneratedMappings = generator.generateEndpointMappings(models, getResourceName, getApiEndpoint);
      const result = generator.buildEndpointMap(autoGeneratedMappings, customEndpoints);

      expect(result).toMatchSnapshot();
    });

    it('should handle real-world endpoint map structure', () => {
      const getResourceName = (modelName: string) => {
        const kebab = modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        return kebab.endsWith('s') ? kebab : `${kebab}s`;
      };

      const getApiEndpoint = (modelName: string) => {
        const kebab = modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        return `tg-api/${kebab.endsWith('s') ? kebab : `${kebab}s`}`;
      };

      const realContent = `   // Auto-generated API endpoints
    'users': 'tg-api/users',
    'feature-flags': 'tg-api/feature-flags',
    // Custom endpoints
    'dashboard': 'api/dashboard',
    'analytics': 'api/analytics'`;

      const models: PrismaModel[] = [
        {
          name: 'AuditLog',
          fields: [],
          enums: [],
          modulePath: '/src/features/audit-log',
          moduleType: 'features',
        },
        {
          name: 'Translation',
          fields: [],
          enums: [],
          modulePath: '/src/features/translation',
          moduleType: 'features',
        },
      ];

      const customEndpoints = generator.extractCustomEndpoints(realContent);
      const autoGeneratedMappings = generator.generateEndpointMappings(models, getResourceName, getApiEndpoint);
      const result = generator.buildEndpointMap(autoGeneratedMappings, customEndpoints);

      expect(result).toMatchSnapshot();
    });
  });
});
