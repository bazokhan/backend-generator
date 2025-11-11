/**
 * Comprehensive tests for adapter runtime functions
 * Tests all scenarios: json adapters, multipart adapters, direct responses, etc.
 */

import { adapter, helpers, AdapterContextBuilder } from '../runtime/adapters';
import type { AdapterContext } from '../runtime/adapters';

describe('Adapter Runtime', () => {
  describe('adapter.json()', () => {
    it('should create a JSON adapter with correct structure', () => {
      const jsonAdapter = adapter.json(
        {
          method: 'POST',
          path: '/custom',
          target: 'UserService.create',
        },
        async (ctx) => {
          return { args: ctx.body };
        },
      );

      expect(jsonAdapter).toHaveProperty('config');
      expect(jsonAdapter).toHaveProperty('handler');
      expect(jsonAdapter).toHaveProperty('type');
      expect(jsonAdapter.type).toBe('json');
      expect(jsonAdapter.config.method).toBe('POST');
      expect(jsonAdapter.config.path).toBe('/custom');
      expect(jsonAdapter.config.target).toBe('UserService.create');
    });

    it('should handle typed adapter with transformations', () => {
      interface CreatePostDto {
        title: string;
        content: string;
      }

      interface CreatePostInput extends CreatePostDto {
        slug: string;
      }

      const createWithSlugAdapter = adapter.json<CreatePostDto, any, any, CreatePostInput>(
        {
          method: 'POST',
          path: '/create-with-slug',
          target: 'PostService.create',
        },
        async (ctx) => {
          const { body, helpers: h } = ctx;
          h.assert(body.title, 'Title is required');
          const slug = h.slugify(body.title);
          return { ...body, slug }; // Return DTO directly
        },
      );

      expect(createWithSlugAdapter.type).toBe('json');
      expect(createWithSlugAdapter.config.target).toBe('PostService.create');
      expect(typeof createWithSlugAdapter.handler).toBe('function');
    });

    it('should handle adapter with auth guards', () => {
      const authAdapter = adapter.json(
        {
          method: 'DELETE',
          path: '/admin/purge',
          target: 'PostService.deleteMany',
          auth: ['JwtAuthGuard', 'AdminGuard'],
        },
        async (ctx) => {
          return { where: ctx.body.filter };
        },
      );

      expect(authAdapter.config.auth).toEqual(['JwtAuthGuard', 'AdminGuard']);
    });

    it('should handle adapter with select fields', () => {
      const listAdapter = adapter.json(
        {
          method: 'GET',
          path: '/public-list',
          target: 'PostService.findMany',
          select: ['id', 'title', 'createdAt'],
        },
        async (ctx) => {
          return { where: { published: true } };
        },
      );

      expect(listAdapter.config.select).toEqual(['id', 'title', 'createdAt']);
    });

    it('should handle complex transformation from user example', async () => {
      interface CreateProjectDto {
        name: string;
        description: string;
        projectTypeId: string;
        slug: string;
      }

      type CreateProjectWithSlugDto = Omit<CreateProjectDto, 'projectTypeId' | 'slug'> & {
        name: string;
      };

      const createProjectAdapter = adapter.json<CreateProjectWithSlugDto, any, any, CreateProjectDto>(
        {
          method: 'POST',
          path: '/project',
          target: 'ProjectService.create',
        },
        async (ctx) => {
          const { body, helpers: h } = ctx;
          h.assert(body.name, 'Name is required');
          const slug = h.slugify(body.name);
          return {
            ...body,
            slug,
            projectTypeId: 'cmhdupp4y0001luv07mgfu7pr',
          };
        },
      );

      // Create mock context
      const mockContext = {
        body: { name: 'My Project', description: 'Test' },
        helpers,
      } as AdapterContext<CreateProjectWithSlugDto>;

      const result = await createProjectAdapter.handler(mockContext);

      expect(result).toHaveProperty('name', 'My Project');
      expect(result).toHaveProperty('slug', 'my-project');
      expect(result).toHaveProperty('projectTypeId', 'cmhdupp4y0001luv07mgfu7pr');
    });
  });

  describe('adapter.multipart()', () => {
    it('should create a multipart adapter with correct structure', () => {
      const multipartAdapter = adapter.multipart(
        {
          method: 'POST',
          path: '/upload-avatar',
          target: 'UserService.update',
          auth: 'JwtAuthGuard',
        },
        async (ctx) => {
          const file = ctx.files as Express.Multer.File;
          return { args: { id: ctx.params.id, avatarUrl: file.path } };
        },
      );

      expect(multipartAdapter.type).toBe('multipart');
      expect(multipartAdapter.config.method).toBe('POST');
      expect(multipartAdapter.config.auth).toBe('JwtAuthGuard');
    });

    it('should handle file upload with validation', async () => {
      const uploadAdapter = adapter.multipart(
        {
          method: 'POST',
          path: '/upload',
          target: 'FileService.upload',
        },
        async (ctx) => {
          const file = ctx.files as Express.Multer.File;
          helpers.assert(file, 'File is required');
          helpers.assert(file.mimetype.startsWith('image/'), 'Must be an image');
          return { fileName: file.originalname, path: file.path }; // Return DTO directly
        },
      );

      const mockFile = {
        originalname: 'test.jpg',
        path: '/uploads/test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const mockContext = {
        files: mockFile,
        helpers,
      } as AdapterContext;

      const result = await uploadAdapter.handler(mockContext);

      expect(result).toHaveProperty('fileName', 'test.jpg');
      expect(result).toHaveProperty('path', '/uploads/test.jpg');
    });
  });

  describe('adapter.response()', () => {
    it('should create direct response object', () => {
      const directResponse = adapter.response(200, { success: true });

      expect(directResponse).toHaveProperty('__isDirectResponse', true);
      expect(directResponse).toHaveProperty('status', 200);
      expect(directResponse).toHaveProperty('body');
      expect(directResponse.body).toEqual({ success: true });
    });

    it('should create direct response with headers', () => {
      const directResponse = adapter.response(201, { id: 123 }, { 'X-Custom': 'value' });

      expect(directResponse.headers).toEqual({ 'X-Custom': 'value' });
    });

    it('should work in webhook adapter without service target', async () => {
      const webhookAdapter = adapter.json(
        {
          method: 'POST',
          path: '/webhook',
        },
        async (ctx) => {
          // Process webhook (mock)
          const processed = { received: ctx.body, timestamp: Date.now() };
          return adapter.response(200, { success: true, data: processed });
        },
      );

      const mockContext = {
        body: { event: 'test' },
      } as AdapterContext;

      const result = await webhookAdapter.handler(mockContext);

      expect('__isDirectResponse' in result).toBe(true);
      if ('__isDirectResponse' in result) {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      }
    });
  });

  describe('AdapterContextBuilder', () => {
    it('should build context with all properties', () => {
      const mockPrisma = {} as any;
      const builder = new AdapterContextBuilder(mockPrisma);

      const mockReq = {
        url: '/api/test',
        headers: { 'content-type': 'application/json' },
        user: { id: 1 },
      } as any;

      const mockRes = {} as any;

      const context = builder.build(
        { data: 'test' },
        { page: '1' },
        { id: '123' },
        mockReq,
        mockRes,
      );

      expect(context.url).toBe('/api/test');
      expect(context.body).toEqual({ data: 'test' });
      expect(context.query).toEqual({ page: '1' });
      expect(context.params).toEqual({ id: '123' });
      expect(context.user).toEqual({ id: 1 });
      expect(context.di.prisma).toBe(mockPrisma);
      expect(context.helpers).toBeDefined();
    });

    it('should include files for multipart requests', () => {
      const mockPrisma = {} as any;
      const builder = new AdapterContextBuilder(mockPrisma);

      const mockFile = { originalname: 'test.jpg' } as Express.Multer.File;
      const mockReq = { url: '/upload' } as any;
      const mockRes = {} as any;

      const context = builder.build({}, {}, {}, mockReq, mockRes, mockFile);

      expect(context.files).toBe(mockFile);
    });
  });

  describe('Helper functions', () => {
    describe('uuid()', () => {
      it('should generate valid UUIDs', () => {
        const uuid1 = helpers.uuid();
        const uuid2 = helpers.uuid();

        expect(typeof uuid1).toBe('string');
        expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        expect(uuid1).not.toBe(uuid2);
      });
    });

    describe('slugify()', () => {
      it('should convert text to URL-friendly slug', () => {
        expect(helpers.slugify('Hello World!')).toBe('hello-world');
        expect(helpers.slugify('Foo & Bar')).toBe('foo-and-bar');
        expect(helpers.slugify('My Project')).toBe('my-project');
        expect(helpers.slugify('Test__Multiple---Dashes')).toBe('test-multiple-dashes');
      });

      it('should handle special characters', () => {
        expect(helpers.slugify('C++ Programming')).toBe('c-programming');
        expect(helpers.slugify('Price: $100')).toBe('price-100');
      });
    });

    describe('ext()', () => {
      it('should extract file extensions', () => {
        expect(helpers.ext('image.jpg')).toBe('jpg');
        expect(helpers.ext('document.pdf')).toBe('pdf');
        expect(helpers.ext('archive.tar.gz')).toBe('gz');
      });

      it('should return empty string for files without extension', () => {
        expect(helpers.ext('README')).toBe('');
      });
    });

    describe('pick()', () => {
      it('should pick specified properties from object', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const picked = helpers.pick(obj, ['a', 'c']);

        expect(picked).toEqual({ a: 1, c: 3 });
        expect(picked).not.toHaveProperty('b');
        expect(picked).not.toHaveProperty('d');
      });

      it('should handle missing properties', () => {
        const obj = { a: 1, b: 2 };
        const picked = helpers.pick(obj, ['a', 'c' as any]);

        expect(picked).toEqual({ a: 1 });
      });
    });

    describe('assert()', () => {
      it('should not throw for truthy values', () => {
        expect(() => helpers.assert(true, 'Error')).not.toThrow();
        expect(() => helpers.assert(1, 'Error')).not.toThrow();
        expect(() => helpers.assert('text', 'Error')).not.toThrow();
        expect(() => helpers.assert({}, 'Error')).not.toThrow();
      });

      it('should throw BadRequestException for falsy values', () => {
        expect(() => helpers.assert(false, 'Must be true')).toThrow('Must be true');
        expect(() => helpers.assert(0, 'Must be positive')).toThrow('Must be positive');
        expect(() => helpers.assert('', 'Required')).toThrow('Required');
        expect(() => helpers.assert(null, 'Cannot be null')).toThrow('Cannot be null');
        expect(() => helpers.assert(undefined, 'Cannot be undefined')).toThrow('Cannot be undefined');
      });

      it('should use default message if not provided', () => {
        expect(() => helpers.assert(false)).toThrow('Assertion failed');
      });
    });
  });

  describe('End-to-end adapter scenarios', () => {
    it('should handle complete JSON adapter flow', async () => {
      const createAdapter = adapter.json<{ title: string; content: string }>(
        {
          method: 'POST',
          path: '/posts',
          target: 'PostService.create',
        },
        async (ctx) => {
          ctx.helpers.assert(ctx.body.title, 'Title is required');
          ctx.helpers.assert(ctx.body.content, 'Content is required');

          const slug = ctx.helpers.slugify(ctx.body.title);

          return {
            ...ctx.body,
            slug,
            authorId: ctx.user?.id || 'anonymous',
          };
        },
      );

      const mockContext = {
        body: { title: 'Test Post', content: 'Content here' },
        user: { id: 'user123' },
        helpers,
      } as AdapterContext;

      const result = await createAdapter.handler(mockContext);

      expect(result).toHaveProperty('title', 'Test Post');
      expect(result).toHaveProperty('slug', 'test-post');
      expect(result).toHaveProperty('authorId', 'user123');
    });

    it('should throw validation errors', async () => {
      const createAdapter = adapter.json(
        {
          method: 'POST',
          path: '/posts',
          target: 'PostService.create',
        },
        async (ctx) => {
          ctx.helpers.assert(ctx.body.title, 'Title is required');
          return ctx.body;
        },
      );

      const mockContext = {
        body: { content: 'No title' },
        helpers,
      } as AdapterContext;

      await expect(createAdapter.handler(mockContext)).rejects.toThrow('Title is required');
    });
  });
});

