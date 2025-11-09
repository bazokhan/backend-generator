import * as fs from 'fs';
import * as path from 'path';
import type { Config, IGenerator } from '@tg-scripts/types';
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
} from './templates';
import { defaultStaticGeneratorOptions, StaticTemplateOptions } from './config';
import { GuardResolver } from '../nest-controller-generator/GuardResolver';

export type StaticGeneratorOverrides = Partial<StaticTemplateOptions> & { include?: string[] };

export class NestStaticGenerator implements IGenerator<StaticGeneratorOverrides, void> {
  private readonly renderer: TemplateRenderer;
  private readonly templateOptions: StaticTemplateOptions;
  private readonly workspaceRoot: string;
  constructor(
    private readonly config: Config,
    overrides: StaticGeneratorOverrides = {},
  ) {
    this.workspaceRoot = process.cwd();
    this.renderer = new TemplateRenderer();
    this.templateOptions = { ...defaultStaticGeneratorOptions, ...overrides };
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
  } {
    const staticFiles = this.config.output.backend.staticFiles;
    return {
      adminGuard: this.resolveStaticPath(staticFiles.guards, 'admin.guard.ts'),
      featureFlagGuard: this.resolveStaticPath(staticFiles.guards, 'feature-flag.guard.ts'),
      isAdminDecorator: this.resolveStaticPath(staticFiles.decorators, 'is-admin.decorator.ts'),
      paginatedSearchQueryDto: this.resolveStaticPath(staticFiles.dtos, 'paginated-search-query.dto.ts'),
      paginatedSearchResultDto: this.resolveStaticPath(staticFiles.dtos, 'paginated-search-result.dto.ts'),
      apiResponseDto: this.resolveStaticPath(staticFiles.dtos, 'api-response.dto.ts'),
      paginationInterceptor: this.resolveStaticPath(staticFiles.interceptors, 'pagination.interceptor.ts'),
      auditInterceptor: this.resolveStaticPath(staticFiles.interceptors, 'audit.interceptor.ts'),
      paginatedSearchDecorator: this.resolveStaticPath(staticFiles.decorators, 'paginated-search.decorator.ts'),
      paginatedSearchUtil: this.resolveStaticPath(staticFiles.utils, 'paginated-search.ts'),
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

  public async generate(overrides: StaticGeneratorOverrides = {}, _options?: Record<string, unknown>): Promise<void> {
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
      this.config.api.authentication.guards,
      this.config.api.authentication.enabled,
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
    ];

    const include = overrides?.include;
    const filtered = include && include.length > 0 ? filesToWrite.filter((f) => include.includes(f.name)) : filesToWrite;

    await Promise.all(filtered.map(({ target, content }) => fs.promises.writeFile(target, content, 'utf-8')));

    formatGeneratedFiles(filtered.map(({ target }) => target), this.workspaceRoot);
  }
}
