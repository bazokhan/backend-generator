import * as path from 'path';
import type { AdapterDefinition, PrismaModel } from '@tg-scripts/types';
import { toCamelCase, toPascalCase } from '../utils';

/**
 * Detect if adapter uses direct response (adapter.response())
 */
function usesDirectResponse(adapter: AdapterDefinition): boolean {
  return adapter.handlerCode.includes('adapter.response(') || !adapter.config.target;
}

/**
 * Generate controller endpoint method for an adapter
 *
 * @param adapter - Adapter definition
 * @param model - Associated Prisma model
 * @param serviceSuffix - Service naming suffix (e.g., 'Admin', 'Tg')
 * @returns Generated controller method code
 */
export function generateAdapterEndpoint(adapter: AdapterDefinition, model: PrismaModel, serviceSuffix: string): string {
  console.log('[Adapter Gen] Generating endpoint for', adapter.name);
  
  const methodName = toCamelCase(adapter.name);
  const httpMethod = adapter.config.method.toLowerCase();
  const httpDecorator = toPascalCase(adapter.config.method);
  const adapterImportName = getAdapterImportName(adapter);

  // Generate decorators
  const decorators = generateDecorators(adapter, model, httpDecorator);

  // Generate method parameters
  const parameters = generateParameters(adapter);

  // Generate method body
  const body = generateMethodBody(adapter, adapterImportName);

  return `
  ${decorators}
  async ${methodName}(${parameters}) {
    ${body}
  }`;
}

/**
 * Generate all decorators for an adapter endpoint
 */
function generateDecorators(adapter: AdapterDefinition, model: PrismaModel, httpDecorator: string): string {
  const decorators: string[] = [];

  // HTTP method decorator
  decorators.push(`@${httpDecorator}('${adapter.config.path}')`);

  // Guard decorators
  if (adapter.config.auth) {
    const guards = Array.isArray(adapter.config.auth) ? adapter.config.auth : [adapter.config.auth];

    decorators.push(`@UseGuards(${guards.join(', ')})`);
  }

  // Multipart interceptor
  if (adapter.type === 'multipart') {
    decorators.push(`@UseInterceptors(FileInterceptor('file'))`);
  }

  // OpenAPI decorators
  const summary = adapter.config.summary || `${adapter.name} endpoint`;
  const description = adapter.config.description || `Custom adapter endpoint: ${adapter.name}`;

  decorators.push(`@ApiOperation({ summary: '${summary}', description: '${description}' })`);

  // Response decorator
  const responseType = adapter.config.target ? model.name : 'any';
  decorators.push(`@ApiResponse({ status: 200, description: 'Success' })`);

  // Multipart consumes
  if (adapter.type === 'multipart') {
    decorators.push(`@ApiConsumes('multipart/form-data')`);
  }

  return decorators.join('\n  ');
}

/**
 * Generate method parameters
 */
function generateParameters(adapter: AdapterDefinition): string {
  const params: string[] = [];

  // Body parameter (type will be inferred from adapter, or use 'any')
  if (adapter.config.method !== 'GET') {
    params.push(`@Body() body: any`);
  }

  // File parameter for multipart
  if (adapter.type === 'multipart') {
    params.push(`@UploadedFile() file: Express.Multer.File`);
  }

  // Query parameters (always available)
  params.push(`@Query() query: any`);

  // Route parameters (always available)
  params.push(`@Param() params: any`);

  // Request object (for context)
  params.push(`@Req() req: Request`);

  // Response object (for context)
  params.push(`@Res({ passthrough: true }) res: Response`);

  return params.join(', ');
}

/**
 * Generate method body that calls adapter handler and optionally service
 */
function generateMethodBody(adapter: AdapterDefinition, adapterImportName: string): string {
  const lines: string[] = [];

  // Build adapter context
  lines.push(`// Build adapter context`);
  lines.push(`const contextBuilder = new AdapterContextBuilder(this.prisma);`);

  const filesArg = adapter.type === 'multipart' ? 'file' : 'undefined';
  lines.push(`const context = contextBuilder.build(body, query, params, req, res, ${filesArg});`);
  lines.push(``);

  // Load and execute adapter handler
  lines.push(`// Execute adapter handler`);
  lines.push(`const result = await ${adapterImportName}.handler(context);`);
  lines.push(``);

  // Only check for direct response if adapter might use it
  if (usesDirectResponse(adapter)) {
    lines.push(`// Check if direct response`);
    lines.push(`if ('__isDirectResponse' in result && result.__isDirectResponse) {`);
    lines.push(`  if (result.headers) {`);
    lines.push(`    for (const [key, value] of Object.entries(result.headers)) {`);
    lines.push(`      res.setHeader(key, value);`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push(`  res.status(result.status);`);
    lines.push(`  return result.body;`);
    lines.push(`}`);
    lines.push(``);
  }

  if (adapter.config.target) {
    const [serviceName, methodName] = adapter.config.target.split('.');
    if (!serviceName || !methodName) {
      throw new Error(`Invalid target service format: ${adapter.config.target}`);
    }
    const serviceImportName = toCamelCase(serviceName);

    lines.push(`// Call target service method with result from adapter`);
    lines.push(`const serviceResult = await this.${serviceImportName}.${methodName}(result);`);
    lines.push(``);

    // Apply select/include if specified
    if (adapter.config.select || adapter.config.include) {
      lines.push(`// Apply response filtering`);

      if (adapter.config.select) {
        const fields = adapter.config.select.map((f) => `'${f}'`).join(', ');
        lines.push(`const filtered = helpers.pick(serviceResult, [${fields}]);`);
        lines.push(`return { data: filtered };`);
      } else if (adapter.config.include) {
        lines.push(`// Include filtering handled by Prisma select in service`);
        lines.push(`return { data: serviceResult };`);
      }
    } else {
      lines.push(`return { data: serviceResult };`);
    }
  } else {
    lines.push(`// No service call - return adapter result`);
    lines.push(`return result;`);
  }

  return lines.join('\n    ');
}

/**
 * Generate imports needed for adapter endpoints
 */
export function generateAdapterImports(adapters: AdapterDefinition[], model: PrismaModel): string[] {
  const imports: string[] = [];

  if (adapters.length === 0) {
    return imports;
  }

  const hasMultipart = adapters.some((a) => a.type === 'multipart');
  const hasDirectResponse = adapters.some((a) => usesDirectResponse(a));
  
  console.log('[Adapter Gen] Generating imports, hasMultipart:', hasMultipart, 'hasDirectResponse:', hasDirectResponse);

  // Always import AdapterContextBuilder from package
  imports.push(`import { AdapterContextBuilder } from '@tgraph/backend-generator/adapters';`);

  // Common imports
  imports.push(`import { Req, Res } from '@nestjs/common';`);
  imports.push(`import type { Request, Response } from 'express';`); // TYPE import

  // Conditional multipart imports
  if (hasMultipart) {
    imports.push(`import { FileInterceptor } from '@nestjs/platform-express';`);
    imports.push(`import { UploadedFile, UseInterceptors } from '@nestjs/common';`);
    imports.push(`import { ApiConsumes } from '@nestjs/swagger';`);
  }

  // Import helpers if select is used
  const needsHelpers = adapters.some((a) => a.config.select && a.config.select.length > 0);
  if (needsHelpers) {
    imports.push(`import { helpers } from '@tgraph/backend-generator/adapters';`);
  }

  // Add adapter module imports (no DTO imports - user provides them)
  for (const adapter of adapters) {
    const adapterImportName = getAdapterImportName(adapter);
    const adapterImportPath = resolveAdapterImportPath(model, adapter);

    imports.push(`import ${adapterImportName} from '${adapterImportPath}';`);
  }

  return imports;
}

/**
 * Generate import statements for guards used by adapters
 */
export function generateAdapterGuardImports(adapters: AdapterDefinition[]): string[] {
  const imports: string[] = [];
  const guardSet = new Set<string>();

  for (const adapter of adapters) {
    if (adapter.config.auth) {
      const guards = Array.isArray(adapter.config.auth) ? adapter.config.auth : [adapter.config.auth];

      guards.forEach((guard) => guardSet.add(guard));
    }
  }

  // We don't know the import paths for custom guards
  // So we'll just add a comment for users to update
  if (guardSet.size > 0) {
    imports.push(`// TODO: Add imports for guards: ${Array.from(guardSet).join(', ')}`);
  }

  return imports;
}

function getAdapterImportName(adapter: AdapterDefinition): string {
  return `${toCamelCase(adapter.name)}Adapter`;
}

function resolveAdapterImportPath(model: PrismaModel, adapter: AdapterDefinition): string {
  const controllerDir = model.modulePath ?? path.dirname(adapter.filePath);
  const relativePath = path.relative(controllerDir, adapter.filePath).replace(/\\/g, '/');
  const withoutExtension = relativePath.replace(/\.(ts|tsx|js|jsx)$/, '');

  if (withoutExtension.startsWith('.')) {
    return withoutExtension;
  }

  return `./${withoutExtension}`;
}
