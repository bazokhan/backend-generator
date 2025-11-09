import { AdapterParser } from './AdapterParser';
import * as fs from 'fs';
import * as path from 'path';
import type { PrismaModel } from '@tg-scripts/types';

// Mock fs
jest.mock('fs');

describe('AdapterParser', () => {
  let parser: AdapterParser;
  let mockModel: PrismaModel;

  beforeEach(() => {
    parser = new AdapterParser();
    mockModel = {
      name: 'Post',
      fields: [],
      enums: [],
      modulePath: '/test/src/features/post',
      moduleType: 'features',
    };
    jest.clearAllMocks();
  });

  describe('discoverAdapters', () => {
    it('should return empty array when no module path', () => {
      const model = { ...mockModel, modulePath: undefined };
      const result = parser.discoverAdapters(model);
      expect(result).toEqual([]);
    });

    it('should return empty array when adapters directory does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = parser.discoverAdapters(mockModel);
      expect(result).toEqual([]);
    });

    it('should discover .adapter.ts files', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'create-with-slug.adapter.ts',
        'upload-image.adapter.ts',
        'other-file.ts',
        'README.md',
      ]);

      const result = parser.discoverAdapters(mockModel);

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('create-with-slug.adapter.ts');
      expect(result[1]).toContain('upload-image.adapter.ts');
    });

    it('should discover .adapter.js files', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'test.adapter.js',
        'another.adapter.ts',
      ]);

      const result = parser.discoverAdapters(mockModel);

      expect(result).toHaveLength(2);
    });

    it('should handle readdir errors gracefully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = parser.discoverAdapters(mockModel);

      expect(result).toEqual([]);
    });
  });

  describe('extractAdapterName', () => {
    it('should extract name from adapter file', () => {
      const parser = new AdapterParser();
      const name = (parser as any).extractAdapterName('create-with-slug.adapter.ts');
      expect(name).toBe('CreateWithSlug');
    });

    it('should handle multi-word names', () => {
      const parser = new AdapterParser();
      const name = (parser as any).extractAdapterName('upload-featured-image.adapter.ts');
      expect(name).toBe('UploadFeaturedImage');
    });

    it('should handle .adapter.js extension', () => {
      const parser = new AdapterParser();
      const name = (parser as any).extractAdapterName('test.adapter.js');
      expect(name).toBe('Test');
    });
  });

  describe('parseAdapter', () => {
    const mockAdapterContent = `
import { adapter } from '@/adapters/runtime';

export default adapter.json({
  method: 'POST',
  path: '/with-slug',
  target: 'PostService.create',
  auth: 'JwtAuthGuard',
}, async (ctx) => {
  const slug = ctx.helpers.slugify(ctx.body.title);
  return { args: { ...ctx.body, slug } };
});
`;

    it('should parse adapter file successfully', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(mockAdapterContent);

      const result = await parser.parseAdapter(
        '/test/path/create-with-slug.adapter.ts',
        '/test'
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('CreateWithSlug');
      expect(result?.type).toBe('json');
      expect(result?.config.method).toBe('POST');
      expect(result?.config.path).toBe('/with-slug');
      expect(result?.config.target).toBe('PostService.create');
      expect(result?.config.auth).toBe('JwtAuthGuard');
    });

    it('should parse multipart adapter', async () => {
      const multipartContent = `
export default adapter.multipart({
  method: 'POST',
  path: '/upload',
  target: 'PostService.update',
}, async (ctx) => {
  return { args: ctx.body };
});
`;
      (fs.readFileSync as jest.Mock).mockReturnValue(multipartContent);

      const result = await parser.parseAdapter('/test/upload.adapter.ts', '/test');

      expect(result?.type).toBe('multipart');
    });

    it('should parse adapter with array auth', async () => {
      const content = `
export default adapter.json({
  method: 'POST',
  path: '/test',
  auth: ['JwtAuthGuard', 'AdminGuard'],
}, async (ctx) => { return { args: ctx.body }; });
`;
      (fs.readFileSync as jest.Mock).mockReturnValue(content);

      const result = await parser.parseAdapter('/test/test.adapter.ts', '/test');

      expect(result?.config.auth).toEqual(['JwtAuthGuard', 'AdminGuard']);
    });

    it('should parse adapter with select fields', async () => {
      const content = `
export default adapter.json({
  method: 'GET',
  path: '/summary',
  target: 'PostService.getOne',
  select: ['id', 'title', 'createdAt'],
}, async (ctx) => { return { args: ctx.params.id }; });
`;
      (fs.readFileSync as jest.Mock).mockReturnValue(content);

      const result = await parser.parseAdapter('/test/test.adapter.ts', '/test');

      expect(result?.config.select).toEqual(['id', 'title', 'createdAt']);
    });

    it('should return null for invalid adapter content', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid content');

      const result = await parser.parseAdapter('/test/invalid.adapter.ts', '/test');

      expect(result).toBeNull();
    });

    it('should handle file read errors', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await parser.parseAdapter('/test/missing.adapter.ts', '/test');

      expect(result).toBeNull();
    });
  });

  describe('parseAdapters', () => {
    it('should parse all adapters for a model', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'adapter1.adapter.ts',
        'adapter2.adapter.ts',
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue(`
export default adapter.json({
  method: 'POST',
  path: '/test',
}, async (ctx) => { return { args: {} }; });
`);

      const result = await parser.parseAdapters(mockModel, '/test');

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no adapters found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await parser.parseAdapters(mockModel, '/test');

      expect(result).toEqual([]);
    });

    it('should skip invalid adapters', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'valid.adapter.ts',
        'invalid.adapter.ts',
      ]);

      let callCount = 0;
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return `
import { adapter } from '@/adapters/runtime';

export default adapter.json({
  method: 'POST',
  path: '/test',
}, async (ctx) => {
  return { args: {} };
});`;
        }
        return 'invalid content';
      });

      const result = await parser.parseAdapters(mockModel, '/test');

      expect(result).toHaveLength(1);
    });
  });
});

