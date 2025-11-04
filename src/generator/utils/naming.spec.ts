import { toKebabCase, toCamelCase, pluralize, getResourceName, getFileNameBase } from './naming';

describe('Naming Utilities', () => {
  describe('toKebabCase', () => {
    it('should convert simple PascalCase to kebab-case', () => {
      expect(toKebabCase('CustomField')).toBe('custom-field');
      expect(toKebabCase('UserProfile')).toBe('user-profile');
    });

    it('should convert complex PascalCase to kebab-case', () => {
      expect(toKebabCase('CustomFieldType')).toBe('custom-field-type');
      expect(toKebabCase('ProjectInstanceData')).toBe('project-instance-data');
    });

    it('should handle consecutive uppercase letters', () => {
      expect(toKebabCase('HTTPRequest')).toBe('http-request');
      expect(toKebabCase('XMLParser')).toBe('xml-parser');
      expect(toKebabCase('APIEndpoint')).toBe('api-endpoint');
    });

    it('should handle single word', () => {
      expect(toKebabCase('User')).toBe('user');
      expect(toKebabCase('Project')).toBe('project');
    });

    it('should handle already lowercase strings', () => {
      expect(toKebabCase('user')).toBe('user');
      expect(toKebabCase('project')).toBe('project');
    });

    it('should handle strings with numbers', () => {
      expect(toKebabCase('User2FA')).toBe('user2-fa');
      expect(toKebabCase('Field3Type')).toBe('field3-type');
      expect(toKebabCase('Test2A')).toBe('test2-a');
      expect(toKebabCase('Item3Test')).toBe('item3-test');
      expect(toKebabCase('Node3D')).toBe('node3-d');
    });

    it('should handle strings with numbers in various positions', () => {
      expect(toKebabCase('API2Auth')).toBe('api2-auth');
      expect(toKebabCase('HTTP2Protocol')).toBe('http2-protocol');
      expect(toKebabCase('Version2')).toBe('version2');
      expect(toKebabCase('Type3D')).toBe('type3-d');
    });

    it('should handle empty string', () => {
      expect(toKebabCase('')).toBe('');
    });

    it('should handle strings with multiple consecutive uppercase letters in middle', () => {
      expect(toKebabCase('URLShortener')).toBe('url-shortener');
      expect(toKebabCase('HTMLElement')).toBe('html-element');
    });

    it('should handle very long compound names', () => {
      expect(toKebabCase('ProjectInstanceDataField')).toBe('project-instance-data-field');
      expect(toKebabCase('UserProfileSettingsData')).toBe('user-profile-settings-data');
    });

    it('should handle uppercase letters at the end', () => {
      expect(toKebabCase('UserID')).toBe('user-id');
      expect(toKebabCase('HTMLParserXML')).toBe('html-parser-xml');
    });
  });

  describe('toCamelCase', () => {
    it('should convert PascalCase to camelCase', () => {
      expect(toCamelCase('CustomFieldType')).toBe('customFieldType');
      expect(toCamelCase('UserProfile')).toBe('userProfile');
      expect(toCamelCase('ProjectInstance')).toBe('projectInstance');
    });

    it('should handle single word', () => {
      expect(toCamelCase('User')).toBe('user');
      expect(toCamelCase('Project')).toBe('project');
    });

    it('should handle already camelCase strings', () => {
      expect(toCamelCase('customFieldType')).toBe('customFieldType');
      expect(toCamelCase('userProfile')).toBe('userProfile');
    });

    it('should handle single character', () => {
      expect(toCamelCase('A')).toBe('a');
      expect(toCamelCase('Z')).toBe('z');
    });

    it('should handle empty string', () => {
      expect(toCamelCase('')).toBe('');
    });

    it('should handle lowercase first character', () => {
      expect(toCamelCase('user')).toBe('user');
      expect(toCamelCase('project')).toBe('project');
    });

    it('should handle all uppercase words', () => {
      expect(toCamelCase('HTTP')).toBe('hTTP');
      expect(toCamelCase('XML')).toBe('xML');
      expect(toCamelCase('API')).toBe('aPI');
    });

    it('should handle mixed case words', () => {
      expect(toCamelCase('OAuth')).toBe('oAuth');
      expect(toCamelCase('MacBook')).toBe('macBook');
    });

    it('should handle words with numbers', () => {
      expect(toCamelCase('User2FA')).toBe('user2FA');
      expect(toCamelCase('Item3D')).toBe('item3D');
    });
  });

  describe('pluralize', () => {
    it('should pluralize regular nouns', () => {
      expect(pluralize('type')).toBe('types');
      expect(pluralize('field')).toBe('fields');
      expect(pluralize('user')).toBe('users');
      expect(pluralize('project')).toBe('projects');
    });

    it('should pluralize words ending in s', () => {
      expect(pluralize('bus')).toBe('buses');
      expect(pluralize('class')).toBe('classes');
    });

    it('should pluralize words ending in x', () => {
      expect(pluralize('box')).toBe('boxes');
      expect(pluralize('tax')).toBe('taxes');
    });

    it('should pluralize words ending in z', () => {
      expect(pluralize('quiz')).toBe('quizes');
      expect(pluralize('waltz')).toBe('waltzes');
      expect(pluralize('fizz')).toBe('fizzes');
    });

    it('should pluralize words ending in ch', () => {
      expect(pluralize('match')).toBe('matches');
      expect(pluralize('church')).toBe('churches');
      expect(pluralize('speech')).toBe('speeches');
      expect(pluralize('beach')).toBe('beaches');
    });

    it('should pluralize words ending in sh', () => {
      expect(pluralize('brush')).toBe('brushes');
      expect(pluralize('wish')).toBe('wishes');
      expect(pluralize('push')).toBe('pushes');
      expect(pluralize('dish')).toBe('dishes');
    });

    it('should pluralize words ending in consonant + y', () => {
      expect(pluralize('category')).toBe('categories');
      expect(pluralize('city')).toBe('cities');
      expect(pluralize('country')).toBe('countries');
      expect(pluralize('family')).toBe('families');
      expect(pluralize('library')).toBe('libraries');
    });

    it('should pluralize words ending in vowel + y', () => {
      expect(pluralize('day')).toBe('days');
      expect(pluralize('boy')).toBe('boys');
      expect(pluralize('key')).toBe('keys');
      expect(pluralize('toy')).toBe('toys');
      expect(pluralize('guy')).toBe('guys');
    });

    it('should handle single character words', () => {
      expect(pluralize('a')).toBe('as');
      expect(pluralize('y')).toBe('ys');
    });

    it('should handle empty string', () => {
      expect(pluralize('')).toBe('s');
    });

    it('should handle words ending in ay, ey, iy, oy, uy', () => {
      expect(pluralize('way')).toBe('ways');
      expect(pluralize('key')).toBe('keys');
      expect(pluralize('toy')).toBe('toys');
      expect(pluralize('guy')).toBe('guys');
    });

    it('should handle words ending in fe/f', () => {
      expect(pluralize('leaf')).toBe('leafs');
      expect(pluralize('knife')).toBe('knifes');
    });

    it('should handle words ending in o', () => {
      expect(pluralize('photo')).toBe('photos');
      expect(pluralize('piano')).toBe('pianos');
    });

    it('should handle compound words from the project context', () => {
      expect(pluralize('custom-field-type')).toBe('custom-field-types');
      expect(pluralize('project-instance')).toBe('project-instances');
      expect(pluralize('unit-type')).toBe('unit-types');
    });
  });

  describe('getResourceName', () => {
    it('should generate correct resource name for simple models', () => {
      expect(getResourceName('User')).toBe('users');
      expect(getResourceName('Project')).toBe('projects');
    });

    it('should generate correct resource name for compound models', () => {
      expect(getResourceName('CustomFieldType')).toBe('custom-field-types');
      expect(getResourceName('ProjectInstance')).toBe('project-instances');
      expect(getResourceName('UnitType')).toBe('unit-types');
    });

    it('should handle models with special pluralization', () => {
      expect(getResourceName('Category')).toBe('categories');
      expect(getResourceName('Company')).toBe('companies');
    });

    it('should handle models ending in s', () => {
      expect(getResourceName('Status')).toBe('statuses');
    });

    it('should handle models with consecutive uppercase letters', () => {
      expect(getResourceName('APIKey')).toBe('api-keys');
    });

    it('should handle models ending in x, z, ch, sh', () => {
      expect(getResourceName('Box')).toBe('boxes');
      expect(getResourceName('Match')).toBe('matches');
      expect(getResourceName('Brush')).toBe('brushes');
      expect(getResourceName('Quiz')).toBe('quizes');
    });

    it('should handle models with numbers', () => {
      expect(getResourceName('User2FA')).toBe('user2-fas');
      expect(getResourceName('Test3D')).toBe('test3-ds');
    });

    it('should handle complex compound models', () => {
      expect(getResourceName('CustomFieldInstance')).toBe('custom-field-instances');
      expect(getResourceName('ProjectTypeConfiguration')).toBe('project-type-configurations');
    });
  });

  describe('getFileNameBase', () => {
    it('should generate correct file name base for simple models', () => {
      expect(getFileNameBase('User')).toBe('user');
      expect(getFileNameBase('Project')).toBe('project');
    });

    it('should generate correct file name base for compound models', () => {
      expect(getFileNameBase('CustomFieldType')).toBe('customFieldType');
      expect(getFileNameBase('ProjectInstance')).toBe('projectInstance');
      expect(getFileNameBase('UnitType')).toBe('unitType');
    });

    it('should handle already camelCase input', () => {
      expect(getFileNameBase('userProfile')).toBe('userProfile');
      expect(getFileNameBase('customField')).toBe('customField');
    });

    it('should handle single character', () => {
      expect(getFileNameBase('A')).toBe('a');
    });

    it('should handle models with consecutive uppercase letters', () => {
      expect(getFileNameBase('APIKey')).toBe('aPIKey');
      expect(getFileNameBase('HTTPRequest')).toBe('hTTPRequest');
    });

    it('should handle models with numbers', () => {
      expect(getFileNameBase('User2FA')).toBe('user2FA');
      expect(getFileNameBase('Test3D')).toBe('test3D');
    });

    it('should handle very long names', () => {
      expect(getFileNameBase('ProjectInstanceData')).toBe('projectInstanceData');
      expect(getFileNameBase('CustomFieldTypeConfiguration')).toBe('customFieldTypeConfiguration');
    });

    it('should handle all uppercase models', () => {
      expect(getFileNameBase('HTTP')).toBe('hTTP');
      expect(getFileNameBase('XML')).toBe('xML');
    });
  });

  describe('Integration tests', () => {
    it('should work consistently across all functions for the same input', () => {
      const modelName = 'CustomFieldType';

      expect(toKebabCase(modelName)).toBe('custom-field-type');
      expect(toCamelCase(modelName)).toBe('customFieldType');
      expect(pluralize('custom-field-type')).toBe('custom-field-types');
      expect(getResourceName(modelName)).toBe('custom-field-types');
      expect(getFileNameBase(modelName)).toBe('customFieldType');
    });

    it('should handle real-world model names from the project', () => {
      const models = [
        'User',
        'AuditLog',
        'CustomFieldType',
        'CustomFieldInstance',
        'ProjectType',
        'ProjectInstance',
        'UnitType',
        'UnitInstance',
        'Translation',
      ];

      const results = models.map((model) => ({
        model,
        kebab: toKebabCase(model),
        camel: toCamelCase(model),
        resource: getResourceName(model),
        fileName: getFileNameBase(model),
      }));

      expect(results).toMatchSnapshot();
    });
  });
});
