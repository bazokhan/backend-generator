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

export type StaticGeneratorOverrides = Partial<StaticTemplateOptions>;

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
    isAdminDecorator: string;
    paginatedSearchQueryDto: string;
    paginatedSearchResultDto: string;
    apiResponseDto: string;
    paginationInterceptor: string;
    paginatedSearchDecorator: string;
    paginatedSearchUtil: string;
  } {
    const staticFiles = this.config.output.backend.staticFiles;
    return {
      adminGuard: this.resolveStaticPath(staticFiles.guards, 'admin.guard.ts'),
      isAdminDecorator: this.resolveStaticPath(staticFiles.decorators, 'is-admin.decorator.ts'),
      paginatedSearchQueryDto: this.resolveStaticPath(staticFiles.dtos, 'paginated-search-query.dto.ts'),
      paginatedSearchResultDto: this.resolveStaticPath(staticFiles.dtos, 'paginated-search-result.dto.ts'),
      apiResponseDto: this.resolveStaticPath(staticFiles.dtos, 'api-response.dto.ts'),
      paginationInterceptor: this.resolveStaticPath(staticFiles.interceptors, 'pagination.interceptor.ts'),
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

    const filesToWrite: Array<{ target: string; content: string }> = [
      {
        target: outputs.adminGuard,
        content: this.renderer.render(adminGuardTemplate, {
          rolesEnumName: this.templateOptions.rolesEnumName,
          prismaGeneratedPath: this.templateOptions.prismaGeneratedPath,
          adminRole: this.templateOptions.adminRole,
        }),
      },
      {
        target: outputs.isAdminDecorator,
        content: this.renderer.render(isAdminDecoratorTemplate, guardTemplateVars),
      },
      {
        target: outputs.paginatedSearchQueryDto,
        content: paginatedSearchQueryDtoTemplate,
      },
      {
        target: outputs.paginatedSearchResultDto,
        content: paginatedSearchResultDtoTemplate,
      },
      {
        target: outputs.apiResponseDto,
        content: apiResponseDtoTemplate,
      },
      {
        target: outputs.paginationInterceptor,
        content: this.renderer.render(paginationInterceptorTemplate, paginationImports),
      },
      {
        target: outputs.paginatedSearchDecorator,
        content: this.renderer.render(paginatedSearchDecoratorTemplate, paginatedDecoratorImports),
      },
      {
        target: outputs.paginatedSearchUtil,
        content: this.renderer.render(paginatedSearchUtilTemplate, {
          prismaGeneratedPath: this.templateOptions.prismaGeneratedPath,
          queryDtoPath: this.createImportPath(outputs.paginatedSearchUtil, outputs.paginatedSearchQueryDto),
          resultDtoPath: this.createImportPath(outputs.paginatedSearchUtil, outputs.paginatedSearchResultDto),
        }),
      },
    ];

    await Promise.all(filesToWrite.map(({ target, content }) => fs.promises.writeFile(target, content, 'utf-8')));

    formatGeneratedFiles(
      filesToWrite.map(({ target }) => target),
      this.workspaceRoot,
    );
  }
}
