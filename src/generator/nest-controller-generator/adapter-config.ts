import type { AdapterDefinition, PrismaModel } from '@tg-scripts/types';
import { toCamelCase, toPascalCase } from '../utils';

/**
 * Generate controller endpoint method for an adapter
 * 
 * @param adapter - Adapter definition
 * @param model - Associated Prisma model
 * @param serviceSuffix - Service naming suffix (e.g., 'Admin', 'Tg')
 * @returns Generated controller method code
 */
export function generateAdapterEndpoint(
  adapter: AdapterDefinition,
  model: PrismaModel,
  serviceSuffix: string
): string {
  const methodName = toCamelCase(adapter.name);
  const dtoClassName = `${adapter.name}InputDto`;
  const httpMethod = adapter.config.method.toLowerCase();
  const httpDecorator = toPascalCase(adapter.config.method);
  
  // Generate decorators
  const decorators = generateDecorators(adapter, model, httpDecorator);
  
  // Generate method parameters
  const parameters = generateParameters(adapter, dtoClassName);
  
  // Generate method body
  const body = generateMethodBody(adapter, model, serviceSuffix, methodName);
  
  return `
  ${decorators}
  async ${methodName}(${parameters}) {
    ${body}
  }`;
}

/**
 * Generate all decorators for an adapter endpoint
 */
function generateDecorators(
  adapter: AdapterDefinition,
  model: PrismaModel,
  httpDecorator: string
): string {
  const decorators: string[] = [];
  
  // HTTP method decorator
  decorators.push(`@${httpDecorator}('${adapter.config.path}')`);
  
  // Guard decorators
  if (adapter.config.auth) {
    const guards = Array.isArray(adapter.config.auth)
      ? adapter.config.auth
      : [adapter.config.auth];
    
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
function generateParameters(adapter: AdapterDefinition, dtoClassName: string): string {
  const params: string[] = [];
  
  // Body parameter
  if (adapter.config.method !== 'GET') {
    params.push(`@Body() body: ${dtoClassName}`);
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
function generateMethodBody(
  adapter: AdapterDefinition,
  model: PrismaModel,
  serviceSuffix: string,
  methodName: string
): string {
  const modelCamel = toCamelCase(model.name);
  const serviceName = `${modelCamel}${serviceSuffix}Service`;
  
  const lines: string[] = [];
  
  // Build adapter context
  lines.push(`// Build adapter context`);
  lines.push(`const contextBuilder = new AdapterContextBuilder(this.prisma);`);
  
  const filesArg = adapter.type === 'multipart' ? 'file' : 'undefined';
  lines.push(`const context = contextBuilder.build(req, res, ${filesArg});`);
  lines.push(``);
  
  // Load and execute adapter handler
  lines.push(`// Execute adapter handler`);
  lines.push(`const adapterPath = '${adapter.filePath}';`);
  lines.push(`const adapterModule = await import(adapterPath);`);
  lines.push(`const adapterResult = adapterModule.default;`);
  lines.push(`const result = await adapterResult.handler(context);`);
  lines.push(``);
  
  // Check if direct response
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
  
  // Call service if target specified
  if (adapter.config.target) {
    const [, methodName] = adapter.config.target.split('.');
    
    lines.push(`// Call target service method`);
    lines.push(`const serviceResult = await this.${serviceName}.${methodName}(result.args);`);
    lines.push(``);
    
    // Apply select/include if specified
    if (adapter.config.select || adapter.config.include) {
      lines.push(`// Apply response filtering`);
      
      if (adapter.config.select) {
        const fields = adapter.config.select.map(f => `'${f}'`).join(', ');
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
    lines.push(`return result.args;`);
  }
  
  return lines.join('\n    ');
}

/**
 * Generate imports needed for adapter endpoints
 */
export function generateAdapterImports(adapters: AdapterDefinition[]): string[] {
  const imports: string[] = [];
  
  if (adapters.length === 0) {
    return imports;
  }
  
  // Check if we need file upload imports
  const hasMultipart = adapters.some(a => a.type === 'multipart');
  
  if (hasMultipart) {
    imports.push(
      `import { FileInterceptor } from '@nestjs/platform-express';`,
      `import { UploadedFile, UseInterceptors } from '@nestjs/common';`,
      `import { ApiConsumes } from '@nestjs/swagger';`
    );
  }
  
  // Always need these for adapters
  imports.push(
    `import { Req, Res } from '@nestjs/common';`,
    `import { Request, Response } from 'express';`,
    `import { AdapterContextBuilder } from '@/adapters/context';`,
    `import { helpers } from '@/adapters/helpers';`
  );
  
  // Add DTO imports
  for (const adapter of adapters) {
    const dtoFileName = adapter.name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    
    imports.push(
      `import { ${adapter.name}InputDto } from './adapters/${dtoFileName}-input.dto';`
    );
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
      const guards = Array.isArray(adapter.config.auth)
        ? adapter.config.auth
        : [adapter.config.auth];
      
      guards.forEach(guard => guardSet.add(guard));
    }
  }
  
  // We don't know the import paths for custom guards
  // So we'll just add a comment for users to update
  if (guardSet.size > 0) {
    imports.push(
      `// TODO: Add imports for guards: ${Array.from(guardSet).join(', ')}`
    );
  }
  
  return imports;
}

