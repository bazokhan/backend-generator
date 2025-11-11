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
        content: `import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: wire to your feature-flag service
    return true;
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

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    const started = Date.now();
    return next.handle().pipe(
      tap(() => {
        // TODO: replace with your audit log sink
        // console.log('Audit:', { duration: Date.now() - started });
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
