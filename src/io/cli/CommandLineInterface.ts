import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '@tg-scripts/types';
import { ApiGenerator } from '../../generator/api/ApiGenerator';
import { DashboardGenerator } from '../../generator/dashboard/DashboardGenerator';
import { DtoGenerator } from '../../generator/dto/DtoGenerator';
import { ConfigLoader, ConfigLoaderError } from '../config/ConfigLoader';
import { SystemValidator } from '../validation/SystemValidator';
import type { DiagnosticReport, DiagnosticCategory } from '../validation/SystemValidator';
import { PreflightChecker } from '../preflight/PreflightChecker';
import type { PreflightReport } from '../preflight/PreflightChecker';

export type CliCommand = 'api' | 'dashboard' | 'dtos' | 'all' | 'init' | 'doctor' | 'preflight';

export interface CliOptions {
  configPath?: string;
  nonInteractive?: boolean;
}

interface ParsedArguments {
  command?: CliCommand;
  options: CliOptions;
  helpRequested: boolean;
  errors: string[];
  configPath?: string;
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
      return await this.executeDoctorCommand(parsed.configPath, parsed.options);
    }

    // Check if config file exists (or was specified)
    const configLoader = parsed.configPath 
      ? new ConfigLoader({ configPath: parsed.configPath })
      : this.configLoader;

    if (!configLoader.exists()) {
      if (parsed.configPath) {
        console.error(`❌ Error: Configuration file not found at: ${parsed.configPath}`);
      } else {
        console.error(`❌ Error: No configuration file found.`);
        console.error(`   Run 'tgraph init' to create a configuration file.`);
        console.error(`   Expected file: tgraph.config.ts or tgraph.config.js in project root.`);
        console.error(`   Or specify a config file with: --config <path>`);
      }
      return 1;
    }

    try {
      const runtimeConfig = configLoader.load();
      const mergedConfig = this.applyCliOverrides(runtimeConfig, parsed.options);
      await this.executeCommand(parsed.command, mergedConfig);
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
        case '--config':
        case '--file':
        case '-c':
          index = this.readNextValue(args, index, (value) => (parsed.configPath = value), parsed);
          continue;
        case '--yes':
        case '-y':
        case '--non-interactive':
          parsed.options.nonInteractive = true;
          index += 1;
          continue;
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
            const normalizedCommand = arg === 'dry-run' ? 'preflight' : arg;
            if (['api', 'dashboard', 'dtos', 'all', 'init', 'doctor', 'preflight'].includes(normalizedCommand)) {
              parsed.command = normalizedCommand as CliCommand;
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
      case 'preflight':
        await this.runPreflight(config);
        return;
      default:
        throw new Error(`Unsupported command: ${command}`);
    }
  }

  private applyCliOverrides(config: Config, options: CliOptions): Config {
    if (options.nonInteractive === undefined) {
      return config;
    }

    return {
      ...config,
      behavior: {
        ...config.behavior,
        nonInteractive: options.nonInteractive,
      },
    };
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
  // ============================================================================
  // INPUT: Where to read from
  // ============================================================================
    input: {
      // Path to your Prisma schema file
      schemaPath: 'prisma/schema.prisma',
      
      // Path to your PrismaService file (used for generating correct imports)
      prismaService: 'src/infrastructure/database/prisma.service.ts',
    },

  // ============================================================================
  // OUTPUT: Where to write generated files
  // ============================================================================
  output: {
    backend: {
      // Where to generate DTOs
      dtos: 'src/dtos/generated',

      // Module location configuration
      modules: {
        // Directories to search for existing modules (in order of priority)
        // The generator will look in these locations when finding modules
        searchPaths: ['src/features', 'src/modules', 'src'],

        // Default directory for creating new modules
        // When a model doesn't have an existing module, create it here
        defaultRoot: 'src/features',
      },

      // Where to generate static helper files (guards, decorators, etc.)
      staticFiles: {
        guards: 'src/guards',
        decorators: 'src/decorators',
        dtos: 'src/dtos',
        interceptors: 'src/interceptors',
        utils: 'src/utils',
        prismaService: 'src/infrastructure/database/prisma.service.ts',
      },
    },

    dashboard: {
      // Root directory of your React Admin dashboard
      root: 'src/dashboard/src',

      // Where to generate dashboard resource folders
      resources: 'src/dashboard/src/resources',
    },
  },

  // ============================================================================
  // API: Backend API generation settings
  // ============================================================================
  api: {
    // Suffix for generated classes (e.g., 'Admin' -> UserAdminService)
    // Use different suffixes for different APIs (e.g., 'Admin', 'Public')
    suffix: 'Admin',

    // API route prefix (e.g., 'tg-api' -> /tg-api/users)
    // Use different prefixes to separate multiple APIs
    prefix: 'tg-api',

    // Authentication and authorization configuration
    authentication: {
      // Whether to add authentication guards to generated controllers
      enabled: true,

      // Whether endpoints require admin role (affects guard configuration)
      requireAdmin: true,

      // List of guards to apply to controllers
      // When authentication.enabled is true, these guards are added
      guards: [
        { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
        { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
      ],
    },
  },

  // ============================================================================
  // DASHBOARD: Frontend dashboard generation settings
  // ============================================================================
  dashboard: {
    // Whether to generate dashboard resources
    enabled: true,

    // Automatically update data provider with new endpoint mappings
    updateDataProvider: true,

    // Override default React Admin components
    // Useful for custom styling or behavior
    components: {
      // Form/Input components (used in Create/Edit pages)
      form: {
        // Example: Use custom text input
        // TextInput: { name: 'CustomTextInput', importPath: '@/components/inputs/TextInput' },
        
        // Example: Use custom number input  
        // NumberInput: { name: 'CustomNumberInput', importPath: '@/components/inputs/NumberInput' },
      },

      // Display components (used in List/Show pages)
      display: {
        // Example: Use custom text field
        // TextField: { name: 'CustomTextField', importPath: '@/components/fields/TextField' },
        
        // Example: Use custom date field
        // DateField: { name: 'CustomDateField', importPath: '@/components/fields/DateField' },
      },
    },
  },

  // ============================================================================
  // BEHAVIOR: CLI and generation behavior
  // ============================================================================
  behavior: {
    // Automatically answer 'yes' to all prompts (useful for CI/CD)
    nonInteractive: false,
  },

  // ============================================================================
  // PATHS: Advanced path overrides (optional)
  // ============================================================================
  // Override auto-discovery for specific files
  // Useful for non-standard project structures
  paths: {
    // NestJS root module (auto-discovered if not specified)
    // appModule: 'src/app.module.ts',

    // React Admin data provider file (auto-discovered if not specified)
    // dataProvider: 'src/dashboard/src/providers/dataProvider.ts',

    // React Admin App component (auto-discovered if not specified)
    // appComponent: 'src/dashboard/src/App.tsx',
  },
};
`;
  }

  private printHelp(): void {
    const helpText = `
tgraph <command> [options]

Commands:
  init        Initialize configuration file (tgraph.config.ts)
  doctor      Run diagnostics to check environment and configuration
  preflight   Analyze pending changes without modifying files
  api         Generate NestJS modules, services, controllers, and update data provider
  dashboard   Generate React Admin dashboard resources and field directive config
  dtos        Generate NestJS DTO files
  all         Run api, dashboard, and dtos generators sequentially

Options:
  -c, --config, --file <path>  Path to configuration file (default: tgraph.config.ts)
  -y, --yes, --non-interactive Automatically confirm interactive prompts
  --interactive                Force interactive prompts
  -h, --help                   Display this help message

Examples:
  tgraph init                                    Create default config file
  tgraph all                                     Generate using default config
  tgraph api --config tgraph.admin.config.ts    Generate admin API
  tgraph api --config tgraph.public.config.ts   Generate public API
  tgraph doctor --config custom.config.ts       Run diagnostics with custom config
`;
    console.log(helpText.trim());
  }

  private async executeDoctorCommand(configPath: string | undefined, cliOptions: CliOptions): Promise<number> {
    const startTime = Date.now();
    console.log(`🔍 Running system diagnostics... [${new Date().toLocaleTimeString()}]\n`);

    try {
      // Try to load config - if it doesn't exist, validator will report it as an error
      let config: Config;
      const loader = configPath ? new ConfigLoader({ configPath }) : this.configLoader;
      
      try {
        config = loader.load();
      } catch (error) {
        const message = error instanceof ConfigLoaderError ? error.cause : error instanceof Error ? error.message : String(error);
        console.error('❌ Error loading config:', message);
        // Config load failed - use minimal config just to run diagnostics
        config = {
          input: { 
            schemaPath: '',
            prismaService: '',
          },
          output: {
            backend: {
              dtos: '',
              modules: {
                searchPaths: [],
                defaultRoot: '',
              },
              staticFiles: {
                guards: '',
                decorators: '',
                dtos: '',
                interceptors: '',
                utils: '',
              },
            },
            dashboard: {
              root: '',
              resources: '',
            },
          },
          api: {
            suffix: '',
            prefix: '',
            authentication: {
              enabled: true,
              requireAdmin: true,
              guards: [],
            },
          },
          dashboard: {
            enabled: false,
            updateDataProvider: false,
            components: { form: {}, display: {} },
          },
          behavior: {
            nonInteractive: false,
          },
        };
      }

      const configLoadTime = Date.now();
      console.log(`⏳ Running diagnostic checks... [${new Date().toLocaleTimeString()}] (config loaded in ${configLoadTime - startTime}ms)\n`);

      const validator = new SystemValidator();
      const runtimeConfig = this.applyCliOverrides(config, cliOptions);
      const report: DiagnosticReport = await validator.runDiagnostics(runtimeConfig);

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

  private async runPreflight(config: Config): Promise<void> {
    console.log('🧪 Running preflight analysis...\n');
    const checker = new PreflightChecker(config);
    const report = checker.run();
    this.printPreflightReport(report, config);
    if (report.hasWarnings) {
      console.log('\n⚠️ Preflight completed with warnings. Review the manual steps above.');
    } else {
      console.log('\n✅ Preflight completed with no pending actions.');
    }
  }

  private printPreflightReport(report: PreflightReport, config: Config): void {
    console.log('📂 Key Paths');
    this.printPathStatus(report.appModule, false);
    this.printPathStatus(report.dataProvider, !(config.dashboard.updateDataProvider ?? true));
    this.printPathStatus(report.appComponent, false);
    this.printPathStatus(report.swagger, false);

    console.log('\n🧱 Modules');
    if (report.modules.length === 0) {
      console.log('  ⚠️ No models with @tg_form() found.');
    } else {
      for (const module of report.modules) {
        console.log(this.describeModuleStatus(module));
      }
    }

    console.log('\n🖥️ Dashboard Resources');
    if (report.dashboardResources.length === 0) {
      console.log('  ℹ️ No dashboard resources will be generated.');
    } else {
      for (const resource of report.dashboardResources) {
        const icon = resource.exists ? '  ⚠️' : '  ✓';
        const suffix = resource.exists ? ' (existing folder will be replaced)' : '';
        console.log(`${icon} ${resource.name}: ${this.toWorkspaceRelative(resource.path)}${suffix}`);
      }
    }

    console.log('\n📝 Manual Steps');
    if (report.manualSteps.length === 0) {
      console.log('  ✓ None');
    } else {
      const sorted = [...report.manualSteps].sort((a, b) => {
        if (a.severity === b.severity) return 0;
        return a.severity === 'warning' ? -1 : 1;
      });
      for (const step of sorted) {
        const icon = step.severity === 'warning' ? '  ⚠️' : '  ℹ️';
        console.log(`${icon} ${step.message}`);
      }
    }
  }

  private printPathStatus(report: PreflightReport['appModule'], optional: boolean): void {
    const location = report.resolvedPath ?? report.configuredPath;
    const displayPath = this.toWorkspaceRelative(location ?? undefined);
    if (report.exists) {
      console.log(`  ✓ ${report.label}: ${displayPath}`);
    } else if (optional) {
      console.log(`  ℹ️ ${report.label}: not required${displayPath !== '(not detected)' ? ` (${displayPath})` : ''}`);
    } else {
      console.log(`  ⚠️ ${report.label}: not found${displayPath !== '(not detected)' ? ` (${displayPath})` : ''}`);
    }
  }

  private describeModuleStatus(module: PreflightReport['modules'][number]): string {
    switch (module.status) {
      case 'ready':
        return `  ✓ ${module.name}: ready at ${this.toWorkspaceRelative(module.existingModuleFile ?? module.existingDirectory)}`;
      case 'missing-module-file':
        return `  ⚙️ ${module.name}: module file will be generated at ${this.toWorkspaceRelative(module.pendingModuleFile)}`;
      case 'missing-directory':
      default:
        return `  🆕 ${module.name}: module directory will be created at ${this.toWorkspaceRelative(module.pendingDirectory)}`;
    }
  }

  private toWorkspaceRelative(targetPath?: string | null): string {
    if (!targetPath) {
      return '(not detected)';
    }

    const cwd = process.cwd();
    const relative = this.pathModule.relative(cwd, targetPath);
    if (!relative || relative.startsWith('..')) {
      return targetPath;
    }

    return relative || '.';
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
