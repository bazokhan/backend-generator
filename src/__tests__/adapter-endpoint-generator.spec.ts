/**
 * Tests for adapter endpoint generation
 * Tests correct code generation for controller methods, decorators, parameters, and imports
 */

import { generateAdapterEndpoint, generateAdapterImports } from '../generator/nest-controller-generator/adapter-config';
import type { AdapterDefinition, PrismaModel } from '@tg-scripts/types';

describe('Adapter Endpoint Generation', () => {
  const mockModel: PrismaModel = {
    name: 'Post',
    tableName: 'Post',
    fields: [],
    uniqueFields: [],
    dbName: null,
    documentation: null,
    primaryKeyField: { name: 'id', type: 'String' },
  };

  describe('generateAdapterEndpoint()', () => {
    it('should generate endpoint for JSON adapter with service target', () => {
      const adapter: AdapterDefinition = {
        filePath: '/path/to/create-with-slug.adapter.ts',
        name: 'CreateWithSlug',
        type: 'json',
        config: {
          method: 'POST',
          path: '/create-with-slug',
          target: 'PostService.create',
        },
        handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
      };

      const endpoint = generateAdapterEndpoint(adapter, mockModel, 'Tg');

      expect(endpoint).toContain('@Post(\'/create-with-slug\')');
      expect(endpoint).toContain('async createWithSlug(');
      expect(endpoint).toContain('@Body() body: any');
      expect(endpoint).toContain('const contextBuilder = new AdapterContextBuilder(this.prisma)');
      expect(endpoint).toContain('const context = contextBuilder.build(body, query, params, req, res, undefined)');
      expect(endpoint).toContain('const result = await createWithSlugAdapter.handler(context)');
      expect(endpoint).toContain('const serviceResult = await this.postService.create(result)');
    });

    it('should generate endpoint for multipart adapter', () => {
      const adapter: AdapterDefinition = {
        filePath: '/path/to/upload-avatar.adapter.ts',
        name: 'UploadAvatar',
        type: 'multipart',
        config: {
          method: 'POST',
          path: '/upload-avatar',
          target: 'UserService.update',
          auth: 'JwtAuthGuard',
        },
        handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
      };

      const endpoint = generateAdapterEndpoint(adapter, mockModel, 'Tg');

      expect(endpoint).toContain('@Post(\'/upload-avatar\')');
      expect(endpoint).toContain('@UseGuards(JwtAuthGuard)');
      expect(endpoint).toContain('@UseInterceptors(FileInterceptor(\'file\'))');
      expect(endpoint).toContain('@ApiConsumes(\'multipart/form-data\')');
      expect(endpoint).toContain('const context = contextBuilder.build(body, query, params, req, res, file)');
    });

    it('should generate endpoint with direct response check when no target', () => {
      const adapter: AdapterDefinition = {
        filePath: '/path/to/webhook.adapter.ts',
        name: 'Webhook',
        type: 'json',
        config: {
          method: 'POST',
          path: '/webhook',
          // No target - direct response
        },
        handlerCode: 'async (ctx) => { return adapter.response(200, { success: true }); }',
      };

      const endpoint = generateAdapterEndpoint(adapter, mockModel, 'Tg');

      expect(endpoint).toContain('if (\'__isDirectResponse\' in result && result.__isDirectResponse)');
      expect(endpoint).toContain('res.setHeader(key, value)');
      expect(endpoint).toContain('res.status(result.status)');
      expect(endpoint).toContain('return result.body');
    });

    it('should NOT include direct response check when adapter uses service target', () => {
      const adapter: AdapterDefinition = {
        filePath: '/path/to/create.adapter.ts',
        name: 'Create',
        type: 'json',
        config: {
          method: 'POST',
          path: '/create',
          target: 'PostService.create',
        },
        handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
      };

      const endpoint = generateAdapterEndpoint(adapter, mockModel, 'Tg');

      expect(endpoint).not.toContain('__isDirectResponse');
    });

    it('should generate endpoint with multiple auth guards', () => {
      const adapter: AdapterDefinition = {
        filePath: '/path/to/admin-only.adapter.ts',
        name: 'AdminOnly',
        type: 'json',
        config: {
          method: 'DELETE',
          path: '/admin/delete',
          target: 'PostService.deleteMany',
          auth: ['JwtAuthGuard', 'AdminGuard'],
        },
        handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
      };

      const endpoint = generateAdapterEndpoint(adapter, mockModel, 'Tg');

      expect(endpoint).toContain('@UseGuards(JwtAuthGuard, AdminGuard)');
    });

    it('should generate endpoint with select fields', () => {
      const adapter: AdapterDefinition = {
        filePath: '/path/to/list-public.adapter.ts',
        name: 'ListPublic',
        type: 'json',
        config: {
          method: 'GET',
          path: '/public',
          target: 'PostService.findMany',
          select: ['id', 'title', 'createdAt'],
        },
        handlerCode: 'async (ctx) => { return { args: {} }; }',
      };

      const endpoint = generateAdapterEndpoint(adapter, mockModel, 'Tg');

      expect(endpoint).toContain('helpers.pick(serviceResult, [\'id\', \'title\', \'createdAt\'])');
    });
  });

  describe('generateAdapterImports()', () => {
    it('should generate imports for JSON adapter only', () => {
      const adapters: AdapterDefinition[] = [
        {
          filePath: '/path/to/create.adapter.ts',
          name: 'Create',
          type: 'json',
          config: {
            method: 'POST',
            path: '/create',
            target: 'PostService.create',
          },
          handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
        },
      ];

      const imports = generateAdapterImports(adapters, mockModel);

      // Should always import AdapterContextBuilder from package
      expect(imports).toContain(`import { AdapterContextBuilder } from '@tgraph/backend-generator/adapters';`);

      // Should import common dependencies
      expect(imports).toContain(`import { Req, Res } from '@nestjs/common';`);
      expect(imports).toContain(`import type { Request, Response } from 'express';`);

      // Should NOT import multipart dependencies
      expect(imports.some(i => i.includes('FileInterceptor'))).toBe(false);
      expect(imports.some(i => i.includes('UploadedFile'))).toBe(false);
      expect(imports.some(i => i.includes('ApiConsumes'))).toBe(false);

      // Should import the adapter itself (but not DTOs - user provides them)
      expect(imports.some(i => i.includes('import createAdapter from'))).toBe(true);
    });

    it('should generate imports including multipart dependencies when multipart adapter exists', () => {
      const adapters: AdapterDefinition[] = [
        {
          filePath: '/path/to/upload.adapter.ts',
          name: 'Upload',
          type: 'multipart',
          config: {
            method: 'POST',
            path: '/upload',
            target: 'FileService.upload',
          },
          handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
        },
      ];

      const imports = generateAdapterImports(adapters, mockModel);

      // Should import multipart dependencies
      expect(imports).toContain(`import { FileInterceptor } from '@nestjs/platform-express';`);
      expect(imports).toContain(`import { UploadedFile, UseInterceptors } from '@nestjs/common';`);
      expect(imports).toContain(`import { ApiConsumes } from '@nestjs/swagger';`);
    });

    it('should generate imports including helpers when select is used', () => {
      const adapters: AdapterDefinition[] = [
        {
          filePath: '/path/to/list.adapter.ts',
          name: 'List',
          type: 'json',
          config: {
            method: 'GET',
            path: '/list',
            target: 'PostService.findMany',
            select: ['id', 'title'],
          },
          handlerCode: 'async (ctx) => { return { args: {} }; }',
        },
      ];

      const imports = generateAdapterImports(adapters, mockModel);

      // Should import helpers for pick function
      expect(imports).toContain(`import { helpers } from '@tgraph/backend-generator/adapters';`);
    });

    it('should NOT import helpers when select is not used', () => {
      const adapters: AdapterDefinition[] = [
        {
          filePath: '/path/to/create.adapter.ts',
          name: 'Create',
          type: 'json',
          config: {
            method: 'POST',
            path: '/create',
            target: 'PostService.create',
          },
          handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
        },
      ];

      const imports = generateAdapterImports(adapters, mockModel);

      // Should NOT import helpers
      expect(imports.some(i => i.includes('import { helpers }'))).toBe(false);
    });

    it('should use type keyword for type-only imports', () => {
      const adapters: AdapterDefinition[] = [
        {
          filePath: '/path/to/create.adapter.ts',
          name: 'Create',
          type: 'json',
          config: {
            method: 'POST',
            path: '/create',
            target: 'PostService.create',
          },
          handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
        },
      ];

      const imports = generateAdapterImports(adapters, mockModel);

      // Should use type keyword for type-only imports
      expect(imports).toContain(`import type { Request, Response } from 'express';`);
    });

    it('should handle mixed JSON and multipart adapters', () => {
      const adapters: AdapterDefinition[] = [
        {
          filePath: '/path/to/create.adapter.ts',
          name: 'Create',
          type: 'json',
          config: {
            method: 'POST',
            path: '/create',
            target: 'PostService.create',
          },
          handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
        },
        {
          filePath: '/path/to/upload.adapter.ts',
          name: 'Upload',
          type: 'multipart',
          config: {
            method: 'POST',
            path: '/upload',
            target: 'FileService.upload',
          },
          handlerCode: 'async (ctx) => { return { args: ctx.body }; }',
        },
      ];

      const imports = generateAdapterImports(adapters, mockModel);

      // Should import multipart dependencies
      expect(imports.some(i => i.includes('FileInterceptor'))).toBe(true);

      // Should import both adapters
      expect(imports.filter(i => i.includes('import') && i.includes('Adapter from')).length).toBe(2);
    });
  });
});

