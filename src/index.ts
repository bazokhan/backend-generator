import type { Config } from '@tg-scripts/types';
import { ApiGenerator } from './generator/api/ApiGenerator';
import { DashboardGenerator } from './generator/dashboard/DashboardGenerator';
import { DataProviderEndpointGenerator } from './generator/data-provider-endpoint-generator/DataProviderEndpointGenerator';
import { DtoGenerator } from './generator/dto/DtoGenerator';
import { NestAppModuleUpdater } from './generator/nest-app-module-updater/NestAppModuleUpdater';
import { NestModuleUpdater } from './generator/nest-module-updater/NestModuleUpdater';
import { ConfigLoader, ConfigLoaderError } from './io/config/ConfigLoader';
import { ModulePathResolver } from './io/module-path-resolver/ModulePathResolver';
import { ProjectPathResolver } from './io/project-paths/ProjectPathResolver';
import { PreflightChecker } from './io/preflight/PreflightChecker';

// Re-export Config type for external usage
export type { Config } from '@tg-scripts/types';

export {
  ApiGenerator,
  DashboardGenerator,
  DataProviderEndpointGenerator,
  DtoGenerator,
  ModulePathResolver,
  ProjectPathResolver,
  PreflightChecker,
  NestAppModuleUpdater,
  NestModuleUpdater,
  ConfigLoader,
  ConfigLoaderError,
};

export const loadConfig = (): Config => new ConfigLoader().load();
export const configFileExists = (): boolean => new ConfigLoader().exists();
export const getConfigFilePath = (): string | null => new ConfigLoader().getConfigFilePath();
