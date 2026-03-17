import * as fs from 'fs';
import * as path from 'path';
import type { Config, Guard, IGenerator } from '@tg-scripts/types';
import { formatGeneratedFiles } from '../../io/utils';
import { TemplateRenderer } from './TemplateRenderer';
import {
  adminGuardTemplate,
  apiResponseDtoTemplate,
  isAdminDecoratorTemplate,
  paginatedSearchDecoratorTemplate,
  paginatedSearchQueryDtoTemplate,
  paginatedSearchResultDtoTemplate,
  paginatedSearchUtilTemplate,
  paginationInterceptorTemplate,
  generateSwaggerTemplate,
} from './templates';
import { defaultStaticGeneratorOptions, StaticTemplateOptions } from './config';
import { GuardResolver } from '../nest-controller-generator/GuardResolver';
import { ProjectPathResolver } from '../../io/project-paths/ProjectPathResolver';

export type StaticGeneratorOverrides = Partial<StaticTemplateOptions> & { include?: string[] };

export class NestStaticGenerator implements IGenerator<StaticGeneratorOverrides, string[]> {
  private readonly renderer: TemplateRenderer;
  private readonly templateOptions: StaticTemplateOptions;
  private readonly workspaceRoot: string;
  private readonly projectPathResolver: ProjectPathResolver;
  constructor(
    private readonly config: Config,
    overrides: StaticGeneratorOverrides = {},
  ) {
    this.workspaceRoot = process.cwd();
    this.renderer = new TemplateRenderer();
    this.templateOptions = { ...defaultStaticGeneratorOptions, ...overrides };
    this.projectPathResolver = new ProjectPathResolver(config, { workspaceRoot: this.workspaceRoot });
  }

  private computeOutputPaths(): {
    adminGuard: string;
    featureFlagGuard: string;
    isAdminDecorator: string;
    paginatedSearchQueryDto: string;
    paginatedSearchResultDto: string;
    apiResponseDto: string;
    paginationInterceptor: string;
    auditInterceptor: string;
    paginatedSearchDecorator: string;
    paginatedSearchUtil: string;
    generateSwagger: string;
  } {
    const outputFolders = this.config.output.backend;
    // Scripts directory for generation utilities
    const scriptsPath = path.join(this.workspaceRoot, 'src', 'scripts');

    return {
      adminGuard: this.resolveStaticPath(outputFolders.guardsPath as string, 'admin.guard.ts'),
      featureFlagGuard: this.resolveStaticPath(outputFolders.guardsPath as string, 'feature-flag.guard.ts'),
      isAdminDecorator: this.resolveStaticPath(outputFolders.decoratorsPath as string, 'is-admin.decorator.ts'),
      paginatedSearchQueryDto: this.resolveStaticPath(
        outputFolders.dtosPath as string,
        'paginated-search-query.dto.ts',
      ),
      paginatedSearchResultDto: this.resolveStaticPath(
        outputFolders.dtosPath as string,
        'paginated-search-result.dto.ts',
      ),
      apiResponseDto: this.resolveStaticPath(outputFolders.dtosPath as string, 'api-response.dto.ts'),
      paginationInterceptor: this.resolveStaticPath(
        outputFolders.interceptorsPath as string,
        'pagination.interceptor.ts',
      ),
      auditInterceptor: this.resolveStaticPath(outputFolders.interceptorsPath as string, 'audit.interceptor.ts'),
      paginatedSearchDecorator: this.resolveStaticPath(
        outputFolders.decoratorsPath as string,
        'paginated-search.decorator.ts',
      ),
      paginatedSearchUtil: this.resolveStaticPath(outputFolders.utilsPath as string, 'paginated-search.ts'),
      generateSwagger: path.join(scriptsPath, 'generate-swagger.ts'),
    };
  }

  private createImportPath(fromFile: string, targetFile: string): string {
    const relative = path.relative(path.dirname(fromFile), targetFile);
    const normalized = relative.replace(/\\/g, '/');
    const withoutExtension = normalized.replace(/\.tsx?$|\.jsx?$/i, '');
    if (withoutExtension.startsWith('.')) {
      return withoutExtension;
    }
    return `./${withoutExtension}`;
  }

  private async ensureDirectories(pathsToEnsure: string[]): Promise<void> {
    const uniqueDirs = Array.from(new Set(pathsToEnsure.map((file) => path.dirname(file))));
    await Promise.all(uniqueDirs.map((dir) => fs.promises.mkdir(dir, { recursive: true })));
  }

  private resolveStaticPath(basePath: string, fileName: string): string {
    const absoluteBase = path.isAbsolute(basePath) ? basePath : path.join(this.workspaceRoot, basePath);
    return path.join(absoluteBase, fileName);
  }

  /**
   * Get list of available static files with their output paths
   * @returns Array of objects with name and path
   */
  public getAvailableFiles(): Array<{ name: string; path: string }> {
    const outputs = this.computeOutputPaths();

    return [
      { name: 'admin.guard', path: outputs.adminGuard },
      { name: 'feature-flag.guard', path: outputs.featureFlagGuard },
      { name: 'is-admin.decorator', path: outputs.isAdminDecorator },
      { name: 'paginated-search-query.dto', path: outputs.paginatedSearchQueryDto },
      { name: 'paginated-search-result.dto', path: outputs.paginatedSearchResultDto },
      { name: 'api-response.dto', path: outputs.apiResponseDto },
      { name: 'pagination.interceptor', path: outputs.paginationInterceptor },
      { name: 'audit.interceptor', path: outputs.auditInterceptor },
      { name: 'paginated-search.decorator', path: outputs.paginatedSearchDecorator },
      { name: 'paginated-search.util', path: outputs.paginatedSearchUtil },
      { name: 'generate.swagger', path: outputs.generateSwagger },
    ];
  }

  public async generate(
    overrides: StaticGeneratorOverrides = {},
    _options?: Record<string, unknown>,
  ): Promise<string[]> {
    if (Object.keys(overrides).length > 0) {
      this.templateOptions.rolesEnumName = overrides.rolesEnumName ?? this.templateOptions.rolesEnumName;
      this.templateOptions.prismaGeneratedPath =
        overrides.prismaGeneratedPath ?? this.templateOptions.prismaGeneratedPath;
      this.templateOptions.adminRole = overrides.adminRole ?? this.templateOptions.adminRole;
      this.templateOptions.defaultLimit = overrides.defaultLimit ?? this.templateOptions.defaultLimit;
      this.templateOptions.defaultPage = overrides.defaultPage ?? this.templateOptions.defaultPage;
    }

    const outputs = this.computeOutputPaths();
    await this.ensureDirectories(Object.values(outputs));

    const guardResolver = new GuardResolver(
      this.config.api.guards as Guard[],
      this.config.api.authenticationEnabled as boolean,
    );
    const guardTemplateVars = guardResolver.getTemplateVariables();

    const paginationImports = {
      dtoPath: this.createImportPath(outputs.paginationInterceptor, outputs.paginatedSearchResultDto),
      defaultLimit: String(this.templateOptions.defaultLimit),
      defaultPage: String(this.templateOptions.defaultPage),
    };

    const paginatedDecoratorImports = {
      interceptorPath: this.createImportPath(outputs.paginatedSearchDecorator, outputs.paginationInterceptor),
    };

    const filesToWrite: Array<{ name: string; target: string; content: string }> = [
      {
        name: 'admin.guard',
        target: outputs.adminGuard,
        content: this.renderer.render(adminGuardTemplate, {
          rolesEnumName: this.templateOptions.rolesEnumName,
          prismaGeneratedPath: this.templateOptions.prismaGeneratedPath,
          adminRole: this.templateOptions.adminRole,
        }),
      },
      {
        name: 'feature-flag.guard',
        target: outputs.featureFlagGuard,
        content: `import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const FEATURE_FLAG_KEY = 'feature_flag';

/**
 * Mark a controller or handler as requiring a specific feature flag.
 * The feature must appear in the FEATURE_FLAGS env var (comma-separated list).
 *
 * @example
 * \`\`\`ts
 * @RequireFeature('new-dashboard')
 * @Get('dashboard')
 * getDashboard() { ... }
 * \`\`\`
 *
 * Set env: FEATURE_FLAGS=new-dashboard,beta-search
 */
export const RequireFeature = (feature: string) => SetMetadata(FEATURE_FLAG_KEY, feature);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No feature flag required — allow through
    if (!requiredFeature) return true;

    const enabledFeatures = (process.env['FEATURE_FLAGS'] ?? '')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    return enabledFeatures.includes(requiredFeature);
  }
}
`,
      },
      {
        name: 'is-admin.decorator',
        target: outputs.isAdminDecorator,
        content: this.renderer.render(isAdminDecoratorTemplate, guardTemplateVars),
      },
      {
        name: 'paginated-search-query.dto',
        target: outputs.paginatedSearchQueryDto,
        content: paginatedSearchQueryDtoTemplate,
      },
      {
        name: 'paginated-search-result.dto',
        target: outputs.paginatedSearchResultDto,
        content: paginatedSearchResultDtoTemplate,
      },
      {
        name: 'api-response.dto',
        target: outputs.apiResponseDto,
        content: apiResponseDtoTemplate,
      },
      {
        name: 'pagination.interceptor',
        target: outputs.paginationInterceptor,
        content: this.renderer.render(paginationInterceptorTemplate, paginationImports),
      },
      {
        name: 'audit.interceptor',
        target: outputs.auditInterceptor,
        content: `import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';

/**
 * Logs every request as structured JSON: method, url, status, duration, user, timestamp.
 * Register globally in AppModule.providers or per-controller with @UseInterceptors(AuditInterceptor).
 *
 * Output example:
 *   {"type":"audit","method":"POST","url":"/tg-api/users","status":201,"duration":42,"user":"abc123","timestamp":"2024-01-01T00:00:00.000Z"}
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const user = (request as any).user?.id ?? 'anonymous';
    const started = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        console.log(
          JSON.stringify({
            type: 'audit',
            method,
            url,
            status: response.statusCode,
            duration: Date.now() - started,
            user,
            timestamp: new Date().toISOString(),
          }),
        );
      }),
    );
  }
}
`,
      },
      {
        name: 'paginated-search.decorator',
        target: outputs.paginatedSearchDecorator,
        content: this.renderer.render(paginatedSearchDecoratorTemplate, paginatedDecoratorImports),
      },
      {
        name: 'paginated-search.util',
        target: outputs.paginatedSearchUtil,
        content: this.renderer.render(paginatedSearchUtilTemplate, {
          prismaGeneratedPath: this.templateOptions.prismaGeneratedPath,
          queryDtoPath: this.createImportPath(outputs.paginatedSearchUtil, outputs.paginatedSearchQueryDto),
          resultDtoPath: this.createImportPath(outputs.paginatedSearchUtil, outputs.paginatedSearchResultDto),
        }),
      },
      {
        name: 'generate.swagger',
        target: outputs.generateSwagger,
        content: this.renderer.render(generateSwaggerTemplate, {
          appModuleImport: this.createImportPath(
            outputs.generateSwagger,
            this.projectPathResolver.resolveAppModulePath() ?? path.join(this.workspaceRoot, 'src/app.module.ts'),
          ).replace(/\.ts$/, ''),
          swaggerJsonPath:
            (this.config.output.dashboard.swaggerJsonPath as string) ??
            path.join(this.config.output.dashboard.root as string, 'types', 'swagger.json'),
          title: 'API Documentation',
          description: 'API documentation generated by @tgraph/backend-generator',
          version: '1.0',
        }),
      },
    ];

    const include = overrides?.include;
    const filtered =
      include && include.length > 0 ? filesToWrite.filter((f) => include.includes(f.name)) : filesToWrite;

    await Promise.all(filtered.map(({ target, content }) => fs.promises.writeFile(target, content, 'utf-8')));

    formatGeneratedFiles(
      filtered.map(({ target }) => target),
      this.workspaceRoot,
    );

    // Return the list of generated files
    return filtered.map(({ target }) => target);
  }
}
