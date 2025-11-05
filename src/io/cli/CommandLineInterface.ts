import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '@tg-scripts/types';
import { ApiGenerator } from '../../generator/api/ApiGenerator';
import { DashboardGenerator } from '../../generator/dashboard/DashboardGenerator';
import { DtoGenerator } from '../../generator/dto/DtoGenerator';
import { ConfigLoader, ConfigLoaderError } from '../config/ConfigLoader';
import { SystemValidator } from '../validation/SystemValidator';
import type { DiagnosticReport, DiagnosticCategory } from '../validation/SystemValidator';

export type CliCommand = 'api' | 'dashboard' | 'dtos' | 'all' | 'init' | 'doctor';

export interface CliOptions
  extends Partial<
    Pick<Config, 'schemaPath' | 'dashboardPath' | 'dtosPath' | 'suffix' | 'isAdmin' | 'updateDataProvider' | 'nonInteractive'>
  > {}

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

    if (parsed.command === 'doctor') {
      return await this.executeDoctorCommand();
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
        case '--yes':
        case '-y':
        case '--non-interactive':
          parsed.options.nonInteractive = true;
          index += 1;
          continue;
        case '--no-yes':
        case '--interactive':
          parsed.options.nonInteractive = false;
          index += 1;
          continue;
        default:
          if (arg?.startsWith('--')) {
            parsed.errors.push(`Unknown option: ${arg}`);
            index += 1;
            continue;
          }

          if (!parsed.command && arg !== undefined) {
            if (['api', 'dashboard', 'dtos', 'all', 'init', 'doctor'].includes(arg)) {
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
      nonInteractive:
        typeof overrides.nonInteractive === 'boolean'
          ? overrides.nonInteractive
          : (baseConfig.nonInteractive ?? false),
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

  // Skip interactive prompts and assume "yes"
  // Default: false
  nonInteractive: false,
};
`;
  }

  private printHelp(): void {
    const helpText = `
tgraph <command> [options]

Commands:
  init        Initialize configuration file (tgraph.config.ts)
  doctor      Run diagnostics to check environment and configuration
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
  -y, --yes, --non-interactive Automatically confirm interactive prompts
  --interactive                Force interactive prompts even if config sets nonInteractive
  -h, --help                   Display this help message
`;
    console.log(helpText.trim());
  }

  private async executeDoctorCommand(): Promise<number> {
    const startTime = Date.now();
    console.log(`🔍 Running system diagnostics... [${new Date().toLocaleTimeString()}]\n`);

    try {
      // Try to load config - if it doesn't exist, validator will report it as an error
      let config: Config;
      try {
        config = this.configLoader.load();
      } catch (error) {
        // Config load failed - use minimal config just to run diagnostics
        // The validator will detect and report the missing config file
        config = {
          schemaPath: 'prisma/schema.prisma',
          dashboardPath: 'src/dashboard/src',
          dtosPath: 'src/dtos/generated',
          suffix: 'Tg',
          isAdmin: true,
          updateDataProvider: true,
          nonInteractive: false,
        };
      }

      const configLoadTime = Date.now();
      console.log(`⏳ Running diagnostic checks... [${new Date().toLocaleTimeString()}] (config loaded in ${configLoadTime - startTime}ms)\n`);

      const validator = new SystemValidator();
      const report: DiagnosticReport = await validator.runDiagnostics(config);

      const diagnosticsTime = Date.now();
      console.log(`✓ Diagnostics completed in ${diagnosticsTime - configLoadTime}ms [${new Date().toLocaleTimeString()}]\n`);

      this.printDiagnosticReport(report);

      // Return appropriate exit code
      if (report.hasErrors) {
        console.log('\n❌ Diagnostics failed! Please fix the errors above before running generation.');
        console.log('💡 Run \'tgraph doctor\' again after making changes to verify the fixes.\n');
        return 1;
      } else if (report.hasWarnings) {
        console.log(`\n✅ All critical checks passed! (${this.countWarnings(report)} warning${this.countWarnings(report) !== 1 ? 's' : ''})`);
        console.log('💡 Run \'tgraph all\' to start generating\n');
        return 0;
      } else {
        console.log('\n✅ All checks passed!');
        console.log('💡 Run \'tgraph all\' to start generating\n');
        return 0;
      }
    } catch (error) {
      console.error('❌ Error running diagnostics:', error);
      return 1;
    }
  }

  private printDiagnosticReport(report: DiagnosticReport): void {
    for (const category of report.categories) {
      this.printDiagnosticCategory(category);
    }
  }

  private printDiagnosticCategory(category: DiagnosticCategory): void {
    // Determine category status (ok, warning, error)
    const hasErrors = category.results.some((r) => r.severity === 'error');
    const hasWarnings = category.results.some((r) => r.severity === 'warning');

    let categoryPrefix: string;
    if (hasErrors) {
      categoryPrefix = '❌';
    } else if (hasWarnings) {
      categoryPrefix = '⚠️';
    } else {
      categoryPrefix = '✓';
    }

    console.log(`${categoryPrefix} ${category.name}`);

    for (const result of category.results) {
      const prefix = result.severity === 'ok' ? '  ✓' : result.severity === 'warning' ? '  ⚠️' : '  ❌';
      console.log(`${prefix} ${result.message}`);
      if (result.suggestion) {
        console.log(`     💡 ${result.suggestion}`);
      }
    }

    console.log(''); // Empty line between categories
  }

  private countWarnings(report: DiagnosticReport): number {
    let count = 0;
    for (const category of report.categories) {
      for (const result of category.results) {
        if (result.severity === 'warning') {
          count++;
        }
      }
    }
    return count;
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
