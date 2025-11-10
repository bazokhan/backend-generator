import { AdapterValidator, AdapterValidationError } from '../io/validation/AdapterValidator';
import type { AdapterDefinition, PrismaModel } from '@tg-scripts/types';

describe('AdapterValidator', () => {
  let validator: AdapterValidator;
  let mockModel: PrismaModel;
  let mockAdapter: AdapterDefinition;

  beforeEach(() => {
    validator = new AdapterValidator();

    mockModel = {
      name: 'Post',
      fields: [
        { name: 'id', type: 'String', isRelation: false } as any,
        { name: 'title', type: 'String', isRelation: false } as any,
        { name: 'content', type: 'String', isRelation: false } as any,
        { name: 'author', type: 'User', isRelation: true } as any,
      ],
      enums: [],
      moduleType: 'features',
    };

    mockAdapter = {
      filePath: '/test/adapter.ts',
      name: 'TestAdapter',
      type: 'json',
      config: {
        method: 'POST',
        path: '/test',
      },
      handlerCode: 'async (ctx) => { return { args: {} }; }',
    };
  });

  describe('validate', () => {
    it('should validate correct adapter', () => {
      expect(() => validator.validate(mockAdapter, mockModel)).not.toThrow();
    });

    it('should throw when method is missing', () => {
      const adapter = { ...mockAdapter, config: { path: '/test' } as any };

      expect(() => validator.validate(adapter, mockModel)).toThrow(AdapterValidationError);
      expect(() => validator.validate(adapter, mockModel)).toThrow(/Missing required field: method/);
    });

    it('should throw when path is missing', () => {
      const adapter = { ...mockAdapter, config: { method: 'POST' } as any };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Missing required field: path/);
    });

    it('should throw for invalid HTTP method', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, method: 'INVALID' as any },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Invalid HTTP method/);
    });

    it('should throw when path does not start with /', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, path: 'test' },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Path must start with/);
    });

    it('should throw for invalid path characters', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, path: '/test path' },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/contains invalid characters/);
    });
  });

  describe('auth validation', () => {
    it('should accept string auth', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, auth: 'JwtAuthGuard' },
      };

      expect(() => validator.validate(adapter, mockModel)).not.toThrow();
    });

    it('should accept array auth', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, auth: ['JwtAuthGuard', 'AdminGuard'] },
      };

      expect(() => validator.validate(adapter, mockModel)).not.toThrow();
    });

    it('should throw for empty string auth', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, auth: '' },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Auth guard name cannot be empty/);
    });

    it('should throw for empty array auth', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, auth: [] },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Auth guards array cannot be empty/);
    });

    it('should throw for invalid auth type', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, auth: 123 as any },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Auth must be a string/);
    });
  });

  describe('select field validation', () => {
    it('should validate existing select fields', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, select: ['id', 'title'] },
      };

      expect(() => validator.validate(adapter, mockModel)).not.toThrow();
    });

    it('should throw for non-existent select field', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, select: ['id', 'invalid'] },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Select field "invalid" does not exist/);
    });

    it('should not validate select when empty', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, select: [] },
      };

      expect(() => validator.validate(adapter, mockModel)).not.toThrow();
    });
  });

  describe('include field validation', () => {
    it('should validate existing include fields', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, include: ['author'] },
      };

      expect(() => validator.validate(adapter, mockModel)).not.toThrow();
    });

    it('should throw for non-relation include field', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, include: ['title'] },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Include field "title" is not a relation/);
    });

    it('should throw for both select and include', () => {
      const adapter = {
        ...mockAdapter,
        config: {
          ...mockAdapter.config,
          select: ['id'],
          include: ['author'],
        },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Cannot specify both "select" and "include"/);
    });
  });

  describe('target validation', () => {
    it('should accept valid target format', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, target: 'PostService.create' },
      };

      expect(() => validator.validate(adapter, mockModel)).not.toThrow();
    });

    it('should accept null target', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, target: null },
      };

      expect(() => validator.validate(adapter, mockModel)).not.toThrow();
    });

    it('should throw for invalid target format', () => {
      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, target: 'invalidFormat' },
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Target must be in format/);
    });

    it('should warn for mismatched service name', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const adapter = {
        ...mockAdapter,
        config: { ...mockAdapter.config, target: 'UserService.create' },
      };

      validator.validate(adapter, mockModel);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('handler validation', () => {
    it('should validate async handler', () => {
      const adapter = {
        ...mockAdapter,
        handlerCode: 'async (ctx) => { return { args: {} }; }',
      };

      expect(() => validator.validate(adapter, mockModel)).not.toThrow();
    });

    it('should throw for non-async handler', () => {
      const adapter = {
        ...mockAdapter,
        handlerCode: '(ctx) => { return { args: {} }; }',
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Handler must be an async function/);
    });

    it('should throw for empty handler', () => {
      const adapter = {
        ...mockAdapter,
        handlerCode: '',
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Handler code is empty/);
    });

    it('should throw for handler without context parameter', () => {
      const adapter = {
        ...mockAdapter,
        handlerCode: 'async () => { return { args: {} }; }',
      };

      expect(() => validator.validate(adapter, mockModel)).toThrow(/Handler must accept a context parameter/);
    });
  });

  describe('validateAll', () => {
    it('should validate multiple adapters', () => {
      const adapters: AdapterDefinition[] = [
        { ...mockAdapter, name: 'Adapter1', config: { method: 'POST', path: '/test1' } },
        { ...mockAdapter, name: 'Adapter2', config: { method: 'GET', path: '/test2' } },
      ];

      const errors = validator.validateAll(adapters, mockModel);

      expect(errors).toEqual([]);
    });

    it('should collect all validation errors', () => {
      const adapters: AdapterDefinition[] = [
        { ...mockAdapter, name: 'Adapter1', config: { method: 'INVALID' as any, path: '/test1' } },
        { ...mockAdapter, name: 'Adapter2', config: { method: 'POST', path: 'invalid' } },
      ];

      const errors = validator.validateAll(adapters, mockModel);

      expect(errors).toHaveLength(2);
    });

    it('should detect duplicate paths', () => {
      const adapters: AdapterDefinition[] = [
        { ...mockAdapter, name: 'Adapter1', config: { method: 'POST', path: '/test' } },
        { ...mockAdapter, name: 'Adapter2', config: { method: 'POST', path: '/test' } },
      ];

      const errors = validator.validateAll(adapters, mockModel);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes('Duplicate endpoint'))).toBe(true);
    });

    it('should allow same path with different methods', () => {
      const adapters: AdapterDefinition[] = [
        { ...mockAdapter, name: 'Adapter1', config: { method: 'GET', path: '/test' } },
        { ...mockAdapter, name: 'Adapter2', config: { method: 'POST', path: '/test' } },
      ];

      const errors = validator.validateAll(adapters, mockModel);

      expect(errors.every((e) => !e.message.includes('Duplicate endpoint'))).toBe(true);
    });
  });
});
