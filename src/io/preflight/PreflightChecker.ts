import * as fs from 'fs';
import * as path from 'path';
import type { ComponentOverrides, Config, PrismaModel } from '@tg-scripts/types';
import { ProjectPathResolver } from '../project-paths/ProjectPathResolver';
import { ModulePathResolver } from '../module-path-resolver/ModulePathResolver';
import { PrismaFieldParser } from '../../parser/prisma-field-parser/PrismaFieldParser';
import { PrismaRelationsParser } from '../../parser/prisma-relation-parser/PrismaRelationsParser';
import { PrismaSchemaParser } from '../../parser/prisma-schema-parser/PrismaSchemaParser';
import { getResourceName, toCamelCase, toKebabCase } from '../../generator/utils/naming';

interface PreflightPathReport {
  label: string;
  configuredPath?: string;
  resolvedPath?: string | null;
  exists: boolean;
}

interface PreflightModuleReport {
  name: string;
  status: 'ready' | 'missing-directory' | 'missing-module-file';
  moduleType?: string;
  existingDirectory?: string;
  existingModuleFile?: string;
  pendingDirectory?: string;
  pendingModuleFile?: string;
}

interface PreflightResourceReport {
  name: string;
  path: string;
  exists: boolean;
}

interface PreflightManualStep {
  message: string;
  severity: 'info' | 'warning';
}

export interface PreflightReport {
  appModule: PreflightPathReport;
  dataProvider: PreflightPathReport;
  appComponent: PreflightPathReport;
  swagger: PreflightPathReport & { required: boolean };
  modules: PreflightModuleReport[];
  dashboardResources: PreflightResourceReport[];
  manualSteps: PreflightManualStep[];
  hasWarnings: boolean;
}

interface PreflightCheckerOptions {
  workspaceRoot?: string;
  fsModule?: typeof fs;
  pathModule?: typeof path;
}

export class PreflightChecker {
  private readonly dashboardRoot: string;
  private readonly fsModule: typeof fs;
  private readonly modulePathResolver: ModulePathResolver;
  private readonly pathModule: typeof path;
  private readonly projectPaths: ProjectPathResolver;
  private readonly schemaParser: PrismaSchemaParser;
  private readonly workspaceRoot: string;
  private readonly swaggerCommand: string;
  constructor(
    private readonly config: Config,
    options: PreflightCheckerOptions = {},
  ) {
    this.workspaceRoot = options.workspaceRoot ?? process.cwd();
    this.fsModule = options.fsModule ?? fs;
    this.pathModule = options.pathModule ?? path;
    this.projectPaths = new ProjectPathResolver(config, {
      workspaceRoot: this.workspaceRoot,
      fsModule: this.fsModule,
      pathModule: this.pathModule,
    });
    this.modulePathResolver = new ModulePathResolver({
      fsModule: this.fsModule,
      pathModule: this.pathModule,
      searchPaths: config.output.backend.modulesPaths as string[],
      defaultRoot: config.output.backend.root as string,
    });
    const fieldParser = new PrismaFieldParser();
    const relationsParser = new PrismaRelationsParser();
    this.schemaParser = new PrismaSchemaParser(fieldParser, relationsParser);
    this.dashboardRoot = this.projectPaths.getDashboardRoot();
    this.swaggerCommand = 'npm run generate:swagger';
  }

  private collectManualSteps(context: {
    appModule: PreflightPathReport;
    dataProvider: PreflightPathReport;
    appComponent: PreflightPathReport;
    swagger: PreflightPathReport & { required: boolean };
    modules: PreflightModuleReport[];
    resources: PreflightResourceReport[];
  }): PreflightManualStep[] {
    const steps: PreflightManualStep[] = [];

    if (!context.appModule.exists) {
      steps.push({
        severity: 'warning',
        message:
          'AppModule not found. Configure config.paths.appModule or create the file so auto-imports can be applied.',
      });
    }

    if ((this.config.output.dashboard.updateDataProvider as boolean) && !context.dataProvider.exists) {
      steps.push({
        severity: 'warning',
        message:
          'Dashboard data provider not found. Configure config.paths.dataProvider or create the file before running generation.',
      });
    }

    if (!context.appComponent.exists) {
      steps.push({
        severity: 'warning',
        message:
          'Dashboard App component not found. Configure config.paths.appComponent so resources can be registered.',
      });
    }

    if (context.swagger.required && !context.swagger.exists) {
      steps.push({
        severity: 'info',
        message: `Swagger JSON missing. Run "${this.swaggerCommand}" before generating dashboard types.`,
      });
    }

    context.modules
      .filter((module) => module.status !== 'ready')
      .forEach((module) => {
        if (module.status === 'missing-directory') {
          steps.push({
            severity: 'info',
            message: `Module directory for ${module.name} will be created at ${module.pendingDirectory}.`,
          });
        }
        if (module.status === 'missing-module-file') {
          steps.push({
            severity: 'info',
            message: `Module file for ${module.name} will be generated at ${module.pendingModuleFile}.`,
          });
        }
      });

    context.resources
      .filter((resource) => resource.exists)
      .forEach((resource) => {
        steps.push({
          severity: 'info',
          message: `Dashboard resource for ${resource.name} already exists at ${resource.path} and will be replaced.`,
        });
      });

    return steps;
  }

  private evaluateAppComponent(): PreflightPathReport {
    const configuredPath = this.config.output.dashboard.appComponentPath as string;
    const resolvedPath = this.projectPaths.resolveDashboardAppComponentPath();
    const exists = resolvedPath ? this.fsModule.existsSync(resolvedPath) : false;

    const report: PreflightPathReport = {
      label: 'Dashboard App',
      exists,
    };

    if (configuredPath !== undefined) {
      report.configuredPath = configuredPath;
    }
    if (resolvedPath !== null && resolvedPath !== undefined) {
      report.resolvedPath = resolvedPath;
    }

    return report;
  }

  private evaluateAppModule(): PreflightPathReport {
    const configuredPath = this.config.output.backend.appModulePath as string;
    const resolvedPath = this.projectPaths.resolveAppModulePath();
    const exists = resolvedPath ? this.fsModule.existsSync(resolvedPath) : false;

    const report: PreflightPathReport = {
      label: 'AppModule',
      exists,
    };

    if (configuredPath !== undefined) {
      report.configuredPath = configuredPath;
    }
    if (resolvedPath !== null && resolvedPath !== undefined) {
      report.resolvedPath = resolvedPath;
    }

    return report;
  }

  private evaluateDashboardResources(models: PrismaModel[]): PreflightResourceReport[] {
    return models.map((model) => {
      const resourceName = getResourceName(model.name);
      const resourcePath = this.pathModule.join(this.dashboardRoot, 'resources', resourceName);
      const exists = this.fsModule.existsSync(resourcePath);
      return {
        name: model.name,
        path: resourcePath,
        exists,
      };
    });
  }

  private evaluateDataProvider(): PreflightPathReport {
    const configuredPath = this.config.output.dashboard.dataProviderPath as string;
    const resolvedPath = this.projectPaths.resolveDashboardDataProviderPath();
    const exists = resolvedPath ? this.fsModule.existsSync(resolvedPath) : false;

    const report: PreflightPathReport = {
      label: 'Data Provider',
      exists,
    };

    if (configuredPath !== undefined) {
      report.configuredPath = configuredPath;
    }
    if (resolvedPath !== null && resolvedPath !== undefined) {
      report.resolvedPath = resolvedPath;
    }

    return report;
  }

  private evaluateModules(models: PrismaModel[]): PreflightModuleReport[] {
    const defaultFeatureRoot = this.projectPaths.getDefaultModuleRoot();
    return models.map((model) => {
      const moduleInfo = this.modulePathResolver.findModulePath(model.name, this.workspaceRoot);

      if (!moduleInfo) {
        const pendingDirectory = this.pathModule.join(defaultFeatureRoot, toKebabCase(model.name));
        const pendingModuleFile = this.pathModule.join(pendingDirectory, `${toCamelCase(model.name)}.module.ts`);
        return {
          name: model.name,
          status: 'missing-directory',
          moduleType: 'features',
          pendingDirectory,
          pendingModuleFile,
        };
      }

      const moduleFileName = this.modulePathResolver.getModuleFileName(moduleInfo.path);
      if (!moduleFileName) {
        const pendingModuleFile = this.pathModule.join(moduleInfo.path, `${toCamelCase(model.name)}.module.ts`);
        return {
          name: model.name,
          status: 'missing-module-file',
          moduleType: moduleInfo.type,
          existingDirectory: moduleInfo.path,
          pendingModuleFile,
        };
      }

      const moduleFilePath = this.pathModule.join(moduleInfo.path, moduleFileName);
      return {
        name: model.name,
        status: 'ready',
        moduleType: moduleInfo.type,
        existingDirectory: moduleInfo.path,
        existingModuleFile: moduleFilePath,
      };
    });
  }

  private evaluateSwagger(): PreflightPathReport & { required: boolean } {
    const swaggerPath = this.resolveSwaggerPath();
    const exists = this.fsModule.existsSync(swaggerPath);
    return {
      label: 'Swagger JSON',
      resolvedPath: swaggerPath,
      exists,
      required: true,
    };
  }

  private resolveSwaggerPath(): string {
    const configured = this.config.output.dashboard.swaggerJsonPath as string;
    if (configured) {
      return this.pathModule.isAbsolute(configured) ? configured : this.pathModule.join(this.workspaceRoot, configured);
    }
    return this.pathModule.join(this.dashboardRoot, 'types', 'swagger.json');
  }

  private parseSchema(): PrismaModel[] {
    const schemaPath = this.pathModule.isAbsolute(this.config.input.prisma.schemaPath as string)
      ? (this.config.input.prisma.schemaPath as string)
      : this.pathModule.join(this.workspaceRoot, this.config.input.prisma.schemaPath as string);
    const schemaContent = this.fsModule.readFileSync(schemaPath, 'utf-8');
    this.schemaParser.load(schemaContent);
    const { models } = this.schemaParser.parse();
    return models;
  }

  public run(): PreflightReport {
    const models = this.parseSchema();

    const appModuleReport = this.evaluateAppModule();
    const dataProviderReport = this.evaluateDataProvider();
    const appComponentReport = this.evaluateAppComponent();
    const swaggerReport = this.evaluateSwagger();

    const modulesReport = this.evaluateModules(models);
    const resourcesReport = this.evaluateDashboardResources(models);

    const manualSteps = this.collectManualSteps({
      appModule: appModuleReport,
      dataProvider: dataProviderReport,
      appComponent: appComponentReport,
      swagger: swaggerReport,
      modules: modulesReport,
      resources: resourcesReport,
    });

    const hasWarnings =
      manualSteps.length > 0 ||
      modulesReport.some((mod) => mod.status !== 'ready') ||
      resourcesReport.some((res) => res.exists);

    return {
      appModule: appModuleReport,
      dataProvider: dataProviderReport,
      appComponent: appComponentReport,
      swagger: swaggerReport,
      modules: modulesReport,
      dashboardResources: resourcesReport,
      manualSteps,
      hasWarnings,
    };
  }
}
