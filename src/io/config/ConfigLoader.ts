import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '@tg-scripts/types';

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
          `Configuration file not found at: ${this.configPath}\n` +
          `Resolved path: ${resolvedPath}`,
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

  private logConfig(config: Config): void {
    console.log('📋 Configuration loaded successfully:');
    console.log(`   Schema path: ${config.input.schemaPath}`);
    console.log(`   Backend DTOs: ${config.output.backend.dtos}`);
    console.log(`   Module search paths: ${config.output.backend.modules.searchPaths.join(', ')}`);
    console.log(`   Module default root: ${config.output.backend.modules.defaultRoot}`);
    console.log(`   Dashboard root: ${config.output.dashboard.root}`);
    console.log(`   API suffix: ${config.api.suffix}`);
    console.log(`   API prefix: ${config.api.prefix}`);
    console.log(`   Authentication enabled: ${config.api.authentication.enabled}`);
    console.log(`   Require admin: ${config.api.authentication.requireAdmin}`);
    console.log(`   Dashboard enabled: ${config.dashboard.enabled}`);
    console.log(`   Update data provider: ${config.dashboard.updateDataProvider}`);
    console.log(`   Non-interactive mode: ${config.behavior.nonInteractive}`);
    if (config.paths?.appModule) {
      console.log(`   AppModule override: ${config.paths.appModule}`);
    }
    if (config.paths?.dataProvider) {
      console.log(`   Data provider override: ${config.paths.dataProvider}`);
    }
    if (config.paths?.appComponent) {
      console.log(`   App component override: ${config.paths.appComponent}`);
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

  private loadFromFile(configPath: string): Config {
    delete require.cache[require.resolve(configPath)];

    const loadedModule: { config?: Config; default?: Config } | Config = require(configPath);

    return (
      (loadedModule as { config?: Config }).config ||
      (loadedModule as { default?: Config }).default ||
      (loadedModule as Config)
    );
  }

  private validateConfig(config: Config | undefined, configPath: string): void {
    if (!config) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' does not export a 'config' object or default export.`,
      );
    }

    // Validate main sections exist
    if (!config.input) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'input'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }
    if (!config.output) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'output'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }
    if (!config.api) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'api'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }
    if (!config.dashboard) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'dashboard'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }
    if (!config.behavior) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'behavior'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }

    // Validate input section
    if (!config.input.schemaPath) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required field 'input.schemaPath'.\n` +
          `💡 Add 'input.schemaPath' to your configuration file.`,
      );
    }

    // Validate output.backend section
    if (!config.output.backend?.dtos) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required field 'output.backend.dtos'.\n` +
          `💡 Add 'output.backend.dtos' to your configuration file.`,
      );
    }
    if (!config.output.backend.modules) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'output.backend.modules'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }
    if (!Array.isArray(config.output.backend.modules.searchPaths) || config.output.backend.modules.searchPaths.length === 0) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' requires 'output.backend.modules.searchPaths' to be a non-empty array.\n` +
          `💡 Example: searchPaths: ['src/features', 'src/modules', 'src']`,
      );
    }
    if (!config.output.backend.modules.defaultRoot) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required field 'output.backend.modules.defaultRoot'.\n` +
          `💡 Example: defaultRoot: 'src/features'`,
      );
    }

    // Validate API section
    if (!config.api.suffix && config.api.suffix !== '') {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required field 'api.suffix'.\n` +
          `💡 Use empty string '' if no suffix is needed, or a PascalCase value like 'Admin'.`,
      );
    }
    if (config.api.suffix && !/^[A-Z][a-zA-Z0-9]*$/.test(config.api.suffix)) {
      console.warn(
        `⚠️  Warning: Config field 'api.suffix' should be PascalCase (e.g., 'Admin', 'Public'). Current value: '${config.api.suffix}'`,
      );
    }
    if (!config.api.prefix) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required field 'api.prefix'.\n` +
          `💡 Example: prefix: 'tg-api' or 'api'`,
      );
    }
    if (!config.api.authentication) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required section 'api.authentication'.\n` +
          `💡 Run 'tgraph init' to create a valid configuration file.`,
      );
    }
    if (!Array.isArray(config.api.authentication.guards)) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' requires 'api.authentication.guards' to be an array.\n` +
          `💡 Example: guards: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }]`,
      );
    }

    // Validate schema file exists
    const schemaPath = path.isAbsolute(config.input.schemaPath)
      ? config.input.schemaPath
      : path.join(this.options.cwd ?? process.cwd(), config.input.schemaPath);

    console.log(`   🔍 Validating schema file at: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new ConfigLoaderError(
        `Prisma schema file not found at: ${config.input.schemaPath}\n` +
          `Resolved path: ${schemaPath}\n` +
          `💡 Run 'npx prisma init' to create a schema or update 'input.schemaPath' in your config.\n` +
          `💡 Run 'tgraph doctor' for full diagnostics.`,
      );
    }

    // Check if schema file has content
    const schemaStats = fs.statSync(schemaPath);
    console.log(`   📄 Schema file size: ${schemaStats.size} bytes`);

    if (schemaStats.size === 0) {
      console.warn(`   ⚠️  Warning: Schema file is empty!`);
    }

    const cwd = this.options.cwd ?? process.cwd();
    if (config.paths?.appModule) {
      this.warnIfPathMissing('App module override', config.paths.appModule, cwd);
    }
    if (config.paths?.dataProvider) {
      this.warnIfPathMissing('Data provider override', config.paths.dataProvider, cwd);
    }
    if (config.paths?.appComponent) {
      this.warnIfPathMissing('App component override', config.paths.appComponent, cwd);
    }

    // Warn if module search paths don't exist
    for (const searchPath of config.output.backend.modules.searchPaths) {
      this.warnIfDirectoryMissing('Module search path', searchPath, cwd);
    }
  }

  private warnIfPathMissing(label: string, targetPath: string, cwd: string): void {
    const resolved = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);
    if (!fs.existsSync(resolved)) {
      console.warn(`   ⚠️  Warning: ${label} not found at ${resolved}`);
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
}
