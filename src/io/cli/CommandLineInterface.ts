import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '@tg-scripts/types';
import { ApiGenerator } from '../../generator/api/ApiGenerator';
import { DashboardGenerator } from '../../generator/dashboard/DashboardGenerator';
import { DtoGenerator } from '../../generator/dto/DtoGenerator';
import { ConfigLoader, ConfigLoaderError } from '../config/ConfigLoader';

export type CliCommand = 'api' | 'dashboard' | 'dtos' | 'all' | 'init';

export interface CliOptions
  extends Partial<Pick<Config, 'schemaPath' | 'dashboardPath' | 'dtosPath' | 'suffix' | 'isAdmin'>> {
  updateDataProvider?: boolean;
}

interface ParsedArguments {
  command?: CliCommand;
  options: CliOptions;
  helpRequested: boolean;
  errors: string[];
}

export class CommandLineInterface {
  private readonly configLoader: ConfigLoader;
  private readonly fsModule: typeof fs;
  private readonly pathModule: typeof path;

  constructor(options: { configLoader?: ConfigLoader; fsModule?: typeof fs; pathModule?: typeof path } = {}) {
    this.configLoader = options.configLoader ?? new ConfigLoader();
    this.fsModule = options.fsModule ?? fs;
    this.pathModule = options.pathModule ?? path;
  }

  /**
   * Execute the CLI with the provided arguments.
   * Returns the exit code that should be used by the caller.
   */
  async run(argv: string[]): Promise<number> {
    const parsed = this.parseArguments(argv);

    if (parsed.helpRequested) {
      this.printHelp();
      return parsed.errors.length > 0 ? 1 : 0;
    }

    if (!parsed.command) {
      parsed.errors.forEach((error) => console.error(error));
      this.printHelp();
      return 1;
    }

    if (parsed.errors.length > 0) {
      parsed.errors.forEach((error) => console.error(error));
      this.printHelp();
      return 1;
    }

    if (parsed.command === 'init') {
      return this.initializeConfig();
    }

    if (!this.configLoader.exists()) {
      console.error(`❌ Error: No configuration file found.`);
      console.error(`   Run 'tgraph init' to create a configuration file.`);
      console.error(`   Expected file: tgraph.config.ts or tgraph.config.js in project root.`);
      return 1;
    }

    try {
      const runtimeConfig = this.resolveConfig(parsed.options);
      await this.executeCommand(parsed.command, runtimeConfig);
      return 0;
    } catch (error) {
      this.handleExecutionError(error);
      return 1;
    }
  }

  private parseArguments(args: string[]): ParsedArguments {
    const parsed: ParsedArguments = {
      options: {},
      helpRequested: false,
      errors: [],
    };

    let index = 0;
    while (index < args.length) {
      const arg = args[index];

      switch (arg) {
        case '-h':
        case '--help':
          parsed.helpRequested = true;
          index += 1;
          continue;
        case '--schema':
          index = this.readNextValue(args, index, (value) => (parsed.options.schemaPath = value), parsed);
          continue;
        case '--dashboard':
          index = this.readNextValue(args, index, (value) => (parsed.options.dashboardPath = value), parsed);
          continue;
        case '--dtos':
          index = this.readNextValue(args, index, (value) => (parsed.options.dtosPath = value), parsed);
          continue;
        case '--suffix':
          index = this.readNextValue(args, index, (value) => (parsed.options.suffix = value), parsed);
          continue;
        case '--admin':
          parsed.options.isAdmin = true;
          index += 1;
          continue;
        case '--no-admin':
          parsed.options.isAdmin = false;
          index += 1;
          continue;
        case '--update-data-provider':
          parsed.options.updateDataProvider = true;
          index += 1;
          continue;
        case '--no-update-data-provider':
          parsed.options.updateDataProvider = false;
          index += 1;
          continue;
        default:
          if (arg?.startsWith('--')) {
            parsed.errors.push(`Unknown option: ${arg}`);
            index += 1;
            continue;
          }

          if (!parsed.command && arg !== undefined) {
            if (['api', 'dashboard', 'dtos', 'all', 'init'].includes(arg)) {
              parsed.command = arg as CliCommand;
              index += 1;
              continue;
            }
          }

          parsed.errors.push(`Unknown argument: ${arg ?? '<undefined>'}`);
          index += 1;
      }
    }

    return parsed;
  }

  private readNextValue(
    args: string[],
    index: number,
    assign: (value: string) => void,
    parsed: ParsedArguments,
  ): number {
    if (index + 1 >= args.length) {
      parsed.errors.push(`Missing value for ${args[index]} option.`);
      return args.length;
    }

    const value = args[index + 1];
    if (value !== undefined) {
      assign(value);
    }

    return index + 2;
  }

  private resolveConfig(overrides: CliOptions): Config {
    const baseConfig = this.configLoader.load();

    const resolved: Config = {
      ...baseConfig,
      ...overrides,
      updateDataProvider:
        typeof overrides.updateDataProvider === 'boolean'
          ? overrides.updateDataProvider
          : (baseConfig.updateDataProvider ?? false),
      isAdmin: typeof overrides.isAdmin === 'boolean' ? overrides.isAdmin : (baseConfig.isAdmin ?? false),
    };

    return resolved;
  }

  private async executeCommand(command: CliCommand, config: Config): Promise<void> {
    switch (command) {
      case 'api':
        await new ApiGenerator(config).generate();
        return;
      case 'dashboard':
        await new DashboardGenerator(config).generate();
        return;
      case 'dtos':
        new DtoGenerator(config).generate();
        return;
      case 'all':
        await new ApiGenerator(config).generate();
        await new DashboardGenerator(config).generate();
        new DtoGenerator(config).generate();
        return;
      default:
        throw new Error(`Unsupported command: ${command}`);
    }
  }

  private initializeConfig(): number {
    const configPath = this.pathModule.join(process.cwd(), 'tgraph.config.ts');

    if (this.configLoader.exists()) {
      const existingPath = this.configLoader.getConfigFilePath();
      console.error(`❌ Error: Configuration file already exists at '${existingPath}'`);
      console.error(`   Remove it first if you want to reinitialize.`);
      return 1;
    }

    const template = this.buildConfigTemplate();

    try {
      this.fsModule.writeFileSync(configPath, template, 'utf-8');
      console.log(`✅ Created configuration file: ${configPath}`);
      console.log(`   You can now customize it for your project.`);
      console.log(`   Run 'tgraph all' to generate code.`);
      return 0;
    } catch (error) {
      console.error(`❌ Error creating configuration file:`, error);
      return 1;
    }
  }

  private buildConfigTemplate(): string {
    return `import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  // Path to your Prisma schema file
  // Default: 'prisma/schema.prisma'
  schemaPath: 'prisma/schema.prisma',

  // Path to your React Admin dashboard source directory
  // Default: 'src/dashboard/src'
  dashboardPath: 'src/dashboard/src',

  // Path where DTO files will be generated
  // Default: 'src/dtos/generated'
  dtosPath: 'src/dtos/generated',

  // Suffix for generated classes (e.g., UserTgService, UserTgController)
  // Default: 'Tg'
  suffix: 'Tg',

  // Generate admin-only endpoints with authentication guards
  // Default: true
  isAdmin: true,

  // Automatically update data provider endpoint mappings
  // Default: true
  updateDataProvider: true,
};
`;
  }

  private printHelp(): void {
    const helpText = `
tgraph <command> [options]

Commands:
  init        Initialize configuration file (tgraph.config.ts)
  api         Generate NestJS modules, services, controllers, and update data provider
  dashboard   Generate React Admin dashboard resources and field directive config
  dtos        Generate NestJS DTO files
  all         Run api, dashboard, and dtos generators sequentially

Options:
  --schema <path>              Override Prisma schema path
  --dashboard <path>           Override dashboard source directory
  --dtos <path>                Override DTO output directory
  --suffix <name>              Override suffix used for generated artifacts
  --admin                      Force admin mode (isAdmin = true)
  --no-admin                   Disable admin mode (isAdmin = false)
  --update-data-provider       Enable data provider updates
  --no-update-data-provider    Disable data provider updates
  -h, --help                   Display this help message
`;
    console.log(helpText.trim());
  }

  private handleExecutionError(error: unknown): void {
    if (error instanceof ConfigLoaderError) {
      console.error(`❌ ${error.message}`);
      if (error.cause) {
        console.error(`   Cause:`, error.cause);
      }
      return;
    }

    console.error('❌ CLI execution failed:', error);
  }
}
