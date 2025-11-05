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
  constructor(
    private readonly options: {
      cwd?: string;
      fsModule?: typeof fs;
      pathModule?: typeof path;
    } = {},
  ) {}

  load(): Config {
    const fsModule = this.options.fsModule ?? fs;
    const pathModule = this.options.pathModule ?? path;
    const cwd = this.options.cwd ?? process.cwd();

    console.log('📂 Loading configuration...');
    console.log(`   Working directory: ${cwd}`);

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
        
        // Log the loaded configuration
        console.log('📋 Configuration loaded successfully:');
        console.log(`   Schema path: ${config.schemaPath}`);
        console.log(`   Dashboard path: ${config.dashboardPath}`);
        console.log(`   DTOs path: ${config.dtosPath}`);
        console.log(`   Suffix: ${config.suffix ? `"${config.suffix}"` : '(empty string)'}`);
        console.log(`   Admin mode: ${config.isAdmin ?? false}`);
        console.log(`   Update data provider: ${config.updateDataProvider ?? false}`);
        
        return config;
      } catch (error) {
        throw new ConfigLoaderError(`Failed to load configuration from '${filename}'`, { cause: error });
      }
    }

    // No config file found - throw error instead of using default
    throw new ConfigLoaderError(
      `Configuration file not found. Expected one of: ${CONFIG_FILENAMES.join(', ')}\n` +
        `Run 'tgraph init' to create a configuration file.`,
    );
  }

  exists(): boolean {
    const fsModule = this.options.fsModule ?? fs;
    const pathModule = this.options.pathModule ?? path;
    const cwd = this.options.cwd ?? process.cwd();

    return CONFIG_FILENAMES.some((filename) => fsModule.existsSync(pathModule.join(cwd, filename)));
  }

  getConfigFilePath(): string | null {
    const fsModule = this.options.fsModule ?? fs;
    const pathModule = this.options.pathModule ?? path;
    const cwd = this.options.cwd ?? process.cwd();

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

    // Validate required fields exist (not undefined/null)
    // Note: empty string is allowed for suffix
    const requiredFields: (keyof Config)[] = ['schemaPath', 'dashboardPath', 'dtosPath'];
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new ConfigLoaderError(
          `Config file '${configPath}' is missing required field '${String(field)}'.`,
        );
      }
    }

    // Suffix is required but can be empty string
    if (config.suffix === undefined || config.suffix === null) {
      throw new ConfigLoaderError(
        `Config file '${configPath}' is missing required field 'suffix'. Use empty string '' if no suffix is needed.`,
      );
    }

    // Warn if suffix is non-empty and not PascalCase
    if (config.suffix && !/^[A-Z][a-zA-Z0-9]*$/.test(config.suffix)) {
      console.warn(
        `⚠️  Warning: Config field 'suffix' should be PascalCase (e.g., 'Tg', 'Admin', 'Public'). Current value: '${config.suffix}'`,
      );
    }

    // Validate schema file exists
    const schemaPath = path.isAbsolute(config.schemaPath)
      ? config.schemaPath
      : path.join(this.options.cwd ?? process.cwd(), config.schemaPath);

    console.log(`   🔍 Validating schema file at: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new ConfigLoaderError(
        `Prisma schema file not found at: ${config.schemaPath}\n` +
          `Resolved path: ${schemaPath}\n` +
          `Please check the 'schemaPath' in your configuration file.`,
      );
    }

    // Check if schema file has content
    const schemaStats = fs.statSync(schemaPath);
    console.log(`   📄 Schema file size: ${schemaStats.size} bytes`);
    
    if (schemaStats.size === 0) {
      console.warn(`   ⚠️  Warning: Schema file is empty!`);
    }
  }
}
