import * as fs from 'fs';
import * as path from 'path';
import type { Config, Guard, UserConfig } from '@tg-scripts/types';
import { supportedConfigs } from '../cli/config';

const CONFIG_FILENAMES = ['tgraph.config.ts', 'tgraph.config.js'] as const;

export class ConfigLoaderError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ConfigLoaderError';
    this.cause = options?.cause;
  }
}

export class ConfigLoader {
  private readonly configPath?: string;

  constructor(
    private readonly options: {
      cwd?: string;
      fsModule?: typeof fs;
      pathModule?: typeof path;
      configPath?: string;
    } = {},
  ) {
    this.configPath = options.configPath ?? '';
  }

  private isUserConfig(obj: any): obj is UserConfig {
    // UserConfig does NOT have 'input' + 'output' top-level keys
    return typeof obj === 'object' && obj !== null && !('input' in obj && 'output' in obj);
  }

  private normalizeUserConfig(user: UserConfig): Config {
    const srcRoot = user.srcRoot ?? 'src';
    const dashboardEnabled = user.dashboard !== false;
    const dashboardRoot =
      dashboardEnabled && typeof user.dashboard === 'object' && user.dashboard?.root
        ? user.dashboard.root
        : `${srcRoot}/dashboard/src`;

    return {
      input: {
        prisma: {
          schemaPath: user.schemaPath ?? 'prisma/schema.prisma',
          servicePath: user.prismaServicePath ?? `${srcRoot}/infrastructure/database/prisma.service.ts`,
        },
        dashboard: {
          components: { form: {}, display: {} },
        },
      },
      output: {
        backend: {
          root: srcRoot,
          dtosPath: user.dtosPath ?? `${srcRoot}/dtos/generated`,
          modulesPaths: user.modulesPaths ?? [`${srcRoot}/features`, `${srcRoot}/modules`, srcRoot],
          guardsPath: `${srcRoot}/guards`,
          decoratorsPath: `${srcRoot}/decorators`,
          interceptorsPath: `${srcRoot}/interceptors`,
          utilsPath: `${srcRoot}/utils`,
          appModulePath: user.appModulePath ?? `${srcRoot}/app.module.ts`,
        },
        dashboard: {
          enabled: dashboardEnabled,
          updateDataProvider: true,
          root: dashboardRoot,
          swaggerJsonPath: `${dashboardRoot}/types/swagger.json`,
          appComponentPath: `${dashboardRoot}/App.tsx`,
          dataProviderPath: `${dashboardRoot}/providers/dataProvider.ts`,
          resourcesPath: `${dashboardRoot}/resources`,
          apiPath: `${dashboardRoot}/types/api.ts`,
        },
      },
      api: {
        suffix: user.apiSuffix ?? '',
        prefix: user.apiPrefix ?? 'tg-api',
        authenticationEnabled: user.authenticationEnabled ?? true,
        requireAdmin: user.requireAdmin ?? true,
        guards: (user.guards ?? []) as Guard[],
        adminGuards: (user.adminGuards ?? []) as Guard[],
      },
      behavior: {
        nonInteractive: user.nonInteractive ?? false,
      },
    };
  }

  private loadFromFile(configPath: string): Config {
    delete require.cache[require.resolve(configPath)];

    const loadedModule: { config?: Config | UserConfig; default?: Config | UserConfig } | Config | UserConfig =
      require(configPath);

    const raw =
      (loadedModule as { config?: Config | UserConfig }).config ||
      (loadedModule as { default?: Config | UserConfig }).default ||
      (loadedModule as Config | UserConfig);

    return this.isUserConfig(raw) ? this.normalizeUserConfig(raw) : (raw as Config);
  }

  private logConfig(config: Config): void {
    console.log('📋 Configuration loaded successfully:');
    console.log(`   Schema path: ${config.input.prisma.schemaPath}`);
    console.log(`   Backend DTOs: ${config.output.backend.dtosPath}`);
    console.log(`   Module search paths: ${(config.output.backend.modulesPaths as string[]).join(', ')}`);
    console.log(`   Module default root: ${config.output.backend.root}`);
    console.log(`   Dashboard root: ${config.output.dashboard.root}`);
    console.log(`   API suffix: ${config.api.suffix}`);
    console.log(`   API prefix: ${config.api.prefix}`);
    console.log(`   Authentication enabled: ${config.api.authenticationEnabled}`);
    console.log(`   Require admin: ${config.api.requireAdmin}`);
    console.log(`   Dashboard enabled: ${config.output.dashboard.enabled}`);
    console.log(`   Update data provider: ${config.output.dashboard.updateDataProvider}`);
    console.log(`   Non-interactive mode: ${config.behavior.nonInteractive}`);
  }

  private validateConfig(config: Config | undefined, configPath: string): void {
    if (!config) {
      throw new ConfigLoaderError(`Config file '${configPath}' does not export a 'config' object or default export.`);
    }

    // Helper to get value at path
    const getValueAtPath = (obj: any, path: string): any => {
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (current === undefined || current === null) {
          return undefined;
        }
        current = current[part];
      }
      return current;
    };

    // Validate main sections exist
    const requiredSections = ['input', 'output', 'api', 'behavior'];
    for (const section of requiredSections) {
      if (!config[section as keyof Config]) {
        throw new ConfigLoaderError(
          `Config file '${configPath}' is missing required section '${section}'.\n` +
            `💡 Run 'tgraph init' to create a valid configuration file.`,
        );
      }
    }

    // Validate required nested sections
    if (!config.input.prisma) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'input.prisma'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }
    if (!config.input.dashboard) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'input.dashboard'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }
    if (!config.output.backend) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'output.backend'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }
    if (!config.output.dashboard) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'output.dashboard'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }

    // Dynamically validate all required configs
    const requiredConfigs = supportedConfigs.filter((c) => c.required);
    for (const configEntry of requiredConfigs) {
      const value = getValueAtPath(config, configEntry.fullPath);

      // Check if value exists (allow empty string and false)
      if (value === undefined || value === null) {
        throw new ConfigLoaderError(
          `Config file '${configPath}' is missing required field '${configEntry.fullPath}'.\n` +
            `💡 ${configEntry.suggestion || `Add '${configEntry.fullPath}' to your configuration file.`}`,
        );
      }

      // Special validation for specific types
      if (configEntry.type === 'string[]' && (!Array.isArray(value) || value.length === 0)) {
        throw new ConfigLoaderError(
          `Config file '${configPath}' requires '${configEntry.fullPath}' to be a non-empty array.\n` +
            `💡 ${configEntry.suggestion || `Example: ${JSON.stringify(configEntry.example)}`}`,
        );
      }
    }

    // Special validations
    // Validate api.suffix is PascalCase if not empty
    if (config.api.suffix && typeof config.api.suffix === 'string' && config.api.suffix !== '') {
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(config.api.suffix as string)) {
        console.warn(
          `⚠️  Warning: Config field 'api.suffix' should be PascalCase (e.g., 'Admin', 'Public'). Current value: '${config.api.suffix}'`,
        );
      }
    }

    // Validate arrays are actually arrays
    if (!Array.isArray(config.api.guards)) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' requires 'api.guards' to be an array.\n` +
          `💡 Example: guards: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }]`,
      );
    }
    if (!Array.isArray(config.api.adminGuards)) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' requires 'api.adminGuards' to be an array.\n` +
          `💡 Example: adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }]`,
      );
    }

    // Validate schema file exists
    const schemaPath = path.isAbsolute(config.input.prisma.schemaPath as string)
      ? config.input.prisma.schemaPath
      : path.join(this.options.cwd ?? process.cwd(), config.input.prisma.schemaPath as string);

    console.log(`   🔍 Validating schema file at: ${schemaPath}`);

    if (!fs.existsSync(schemaPath as string)) {
      throw new ConfigLoaderError(
        `Prisma schema file not found at: ${config.input.prisma.schemaPath as string}\n` +
          `Resolved path: ${schemaPath}\n` +
          `💡 Run 'npx prisma init' to create a schema or update 'input.prisma.schemaPath' in your config.\n` +
          `💡 Run 'tgraph doctor' for full diagnostics.`,
      );
    }

    // Check if schema file has content
    const schemaStats = fs.statSync(schemaPath as string);
    console.log(`   📄 Schema file size: ${schemaStats.size} bytes`);

    if (schemaStats.size === 0) {
      console.warn(`   ⚠️  Warning: Schema file is empty!`);
    }

    // Warn for optional path overrides if they're specified but don't exist
    const cwd = this.options.cwd ?? process.cwd();
    if (config.output.backend.appModulePath) {
      this.warnIfPathMissing('App module override', config.output.backend.appModulePath as string, cwd);
    }
    if (config.output.dashboard.dataProviderPath) {
      this.warnIfPathMissing('Data provider override', config.output.dashboard.dataProviderPath as string, cwd);
    }
    if (config.output.dashboard.appComponentPath) {
      this.warnIfPathMissing('App component override', config.output.dashboard.appComponentPath as string, cwd);
    }

    // Warn if module search paths don't exist
    for (const searchPath of config.output.backend.modulesPaths as string[]) {
      this.warnIfDirectoryMissing('Module search path', searchPath, cwd);
    }
  }

  private warnIfDirectoryMissing(label: string, targetPath: string, cwd: string): void {
    const resolved = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);
    if (!fs.existsSync(resolved)) {
      console.warn(`   ⚠️  Warning: ${label} not found at ${resolved}`);
      return;
    }
    const stats = fs.statSync(resolved);
    if (!stats.isDirectory()) {
      console.warn(`   ⚠️  Warning: ${label} at ${resolved} is not a directory`);
    }
  }

  private warnIfPathMissing(label: string, targetPath: string, cwd: string): void {
    const resolved = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);
    if (!fs.existsSync(resolved)) {
      console.warn(`   ⚠️  Warning: ${label} not found at ${resolved}`);
    }
  }

  exists(): boolean {
    const fsModule = this.options.fsModule ?? fs;
    const pathModule = this.options.pathModule ?? path;
    const cwd = this.options.cwd ?? process.cwd();

    // If specific config path is provided, check that
    if (this.configPath) {
      const resolvedPath = pathModule.isAbsolute(this.configPath)
        ? this.configPath
        : pathModule.join(cwd, this.configPath);
      return fsModule.existsSync(resolvedPath);
    }

    // Otherwise, check for default config files
    return CONFIG_FILENAMES.some((filename) => fsModule.existsSync(pathModule.join(cwd, filename)));
  }

  getConfigFilePath(): string | null {
    const fsModule = this.options.fsModule ?? fs;
    const pathModule = this.options.pathModule ?? path;
    const cwd = this.options.cwd ?? process.cwd();

    // If specific config path is provided, return that
    if (this.configPath) {
      const resolvedPath = pathModule.isAbsolute(this.configPath)
        ? this.configPath
        : pathModule.join(cwd, this.configPath);
      return fsModule.existsSync(resolvedPath) ? resolvedPath : null;
    }

    // Otherwise, search for default config files
    for (const filename of CONFIG_FILENAMES) {
      const configPath = pathModule.join(cwd, filename);
      if (fsModule.existsSync(configPath)) {
        return configPath;
      }
    }

    return null;
  }

  load(): Config {
    const fsModule = this.options.fsModule ?? fs;
    const pathModule = this.options.pathModule ?? path;
    const cwd = this.options.cwd ?? process.cwd();

    console.log('📂 Loading configuration...');
    console.log(`   Working directory: ${cwd}`);

    // If specific config path is provided, use it
    if (this.configPath) {
      const resolvedPath = pathModule.isAbsolute(this.configPath)
        ? this.configPath
        : pathModule.join(cwd, this.configPath);

      if (!fsModule.existsSync(resolvedPath)) {
        throw new ConfigLoaderError(
          `Configuration file not found at: ${this.configPath}\n` + `Resolved path: ${resolvedPath}`,
        );
      }

      console.log(`   ✅ Found config file: ${this.configPath}`);
      const config = this.loadFromFile(resolvedPath);
      this.validateConfig(config, resolvedPath);
      this.logConfig(config);
      return config;
    }

    // Otherwise, search for default config files
    for (const filename of CONFIG_FILENAMES) {
      const configPath = pathModule.join(cwd, filename);
      if (!fsModule.existsSync(configPath)) {
        console.log(`   ⏭️  Skipping ${filename} (not found)`);
        continue;
      }

      try {
        console.log(`   ✅ Found config file: ${filename}`);
        const config = this.loadFromFile(configPath);
        this.validateConfig(config, configPath);
        this.logConfig(config);
        return config;
      } catch (error) {
        throw new ConfigLoaderError(`Failed to load configuration from '${filename}'`, { cause: error });
      }
    }

    // No config file found - throw error instead of using default
    throw new ConfigLoaderError(
      `Configuration file not found. Expected one of: ${CONFIG_FILENAMES.join(', ')}\n` +
        `💡 Run 'tgraph init' to create a configuration file.\n` +
        `💡 Run 'tgraph doctor' to diagnose configuration issues.\n` +
        `💡 Or specify a config file with: --config <path>`,
    );
  }
}
