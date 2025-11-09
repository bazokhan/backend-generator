import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { Config } from '@tg-scripts/types';
import { ApiGenerator } from '../../generator/api/ApiGenerator';
import { DashboardGenerator } from '../../generator/dashboard/DashboardGenerator';
import { DtoGenerator } from '../../generator/dto/DtoGenerator';
import { ConfigLoader, ConfigLoaderError } from '../config/ConfigLoader';
import { SystemValidator } from '../validation/SystemValidator';
import type { DiagnosticReport, DiagnosticCategory } from '../validation/SystemValidator';
import { PreflightChecker } from '../preflight/PreflightChecker';
import type { PreflightReport } from '../preflight/PreflightChecker';
import { NestStaticGenerator } from '../../generator/nest-static-generator/NestStaticGenerator';
import { promptText, promptUser } from '../utils/user-prompt';

export type CliCommand =
  | 'api'
  | 'dashboard'
  | 'dtos'
  | 'all'
  | 'init'
  | 'doctor'
  | 'preflight'
  | 'static'
  | 'types'
  | 'swagger';

export interface CliOptions {
  configPath?: string;
  nonInteractive?: boolean;
  forcePublic?: boolean;
}

interface ParsedArguments {
  command?: CliCommand;
  options: CliOptions;
  helpRequested: boolean;
  errors: string[];
  configPath?: string;
  initOutputPath?: string;
  initRequireAdmin?: boolean;
  staticList?: boolean;
  staticInclude?: string[];
  skipSwagger?: boolean;
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

  private applyCliOverrides(config: Config, options: CliOptions): Config {
    const nextConfig: Config = { ...config };

    if (options.nonInteractive !== undefined) {
      nextConfig.behavior = {
        ...nextConfig.behavior,
        nonInteractive: options.nonInteractive,
      };
    }

    if (options.forcePublic) {
      nextConfig.api = {
        ...nextConfig.api,
        authentication: {
          ...nextConfig.api.authentication,
          enabled: false,
          requireAdmin: false,
        },
      };
    }

    return nextConfig;
  }

  private buildConfigTemplate(values?: {
    schemaPath?: string;
    prismaService?: string;
    apiSuffix?: string;
    apiPrefix?: string;
    authEnabled?: boolean;
    requireAdmin?: boolean;
    backendDtos?: string;
    backendDefaultRoot?: string;
    staticGuards?: string;
    staticDecorators?: string;
    staticDtos?: string;
    staticInterceptors?: string;
    staticUtils?: string;
    dashboardRoot?: string;
    dashboardResources?: string;
    swaggerCommand?: string;
    swaggerJsonPath?: string;
  }): string {
    const v = {
      schemaPath: values?.schemaPath ?? 'prisma/schema.prisma',
      prismaService: values?.prismaService ?? 'src/infrastructure/database/prisma.service.ts',
      apiSuffix: (values?.apiSuffix ?? 'Admin').trim(),
      apiPrefix: (values?.apiPrefix ?? 'tg-api').trim(),
      authEnabled: values?.authEnabled ?? true,
      requireAdmin: values?.requireAdmin ?? true,
      backendDtos: values?.backendDtos ?? 'src/dtos/generated',
      backendDefaultRoot: values?.backendDefaultRoot ?? 'src/features',
      staticGuards: values?.staticGuards ?? 'src/guards',
      staticDecorators: values?.staticDecorators ?? 'src/decorators',
      staticDtos: values?.staticDtos ?? 'src/dtos',
      staticInterceptors: values?.staticInterceptors ?? 'src/interceptors',
      staticUtils: values?.staticUtils ?? 'src/utils',
      dashboardRoot: values?.dashboardRoot ?? 'src/dashboard/src',
      dashboardResources: values?.dashboardResources ?? 'src/dashboard/src/resources',
      swaggerCommand: values?.swaggerCommand ?? 'npm run generate:swagger',
      swaggerJsonPath:
        values?.swaggerJsonPath ?? `${values?.dashboardRoot ?? 'src/dashboard/src'}/types/swagger.json`,
    };

    return `import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  // ============================================================================
  // INPUT: Where to read from
  // ============================================================================
    input: {
      // Path to your Prisma schema file
      schemaPath: '${v.schemaPath}',
      
      // Path to your PrismaService file (used for generating correct imports)
      prismaService: '${v.prismaService}',
    },

  // ============================================================================
  // OUTPUT: Where to write generated files
  // ============================================================================
  output: {
    backend: {
      // Where to generate DTOs
      dtos: '${v.backendDtos}',

      // Module location configuration
      modules: {
        // Directories to search for existing modules (in order of priority)
        // The generator will look in these locations when finding modules
        searchPaths: ['src/features', 'src/modules', 'src'],

        // Default directory for creating new modules
        // When a model doesn't have an existing module, create it here
        defaultRoot: '${v.backendDefaultRoot}',
      },

      // Where to generate static helper files (guards, decorators, etc.)
      staticFiles: {
        guards: '${v.staticGuards}',
        decorators: '${v.staticDecorators}',
        dtos: '${v.staticDtos}',
        interceptors: '${v.staticInterceptors}',
        utils: '${v.staticUtils}',
        prismaService: '${v.prismaService}',
      },
    },

    dashboard: {
      // Root directory of your React Admin dashboard
      root: '${v.dashboardRoot}',

      // Where to generate dashboard resource folders
      resources: '${v.dashboardResources}',

      // Swagger generation settings for dashboard API types
      swagger: {
        // Command to regenerate swagger.json before running tgraph types
        command: '${v.swaggerCommand}',
        // Path to the swagger.json file relative to project root
        jsonPath: '${v.swaggerJsonPath}',
      },
    },
  },

  // ============================================================================
  // API: Backend API generation settings
  // ============================================================================
  api: {
    // Suffix for generated classes (e.g., 'Admin' -> UserAdminService)
    // Use different suffixes for different APIs (e.g., 'Admin', 'Public')
    suffix: '${v.apiSuffix}',

    // API route prefix (e.g., 'tg-api' -> /tg-api/users)
    // Use different prefixes to separate multiple APIs
    prefix: '${v.apiPrefix}',

    // Authentication and authorization configuration
    authentication: {
      // Whether to add authentication guards to generated controllers
      enabled: ${v.authEnabled ? 'true' : 'false'},

      // Whether endpoints require admin role (affects guard configuration)
      requireAdmin: ${v.requireAdmin ? 'true' : 'false'},

      // List of guards to apply to controllers
      // When authentication.enabled is true, these guards are added
      guards: [
        { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
      ],
      adminGuards: [
        { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
      ],
    },

    relations: {
      // Include relation fields in Prisma selects (use 'all' or list relation field names)
      include: [],
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

  private async executeStaticCommand(parsed: ParsedArguments): Promise<number> {
    // Load config if available (some paths are needed)
    const loader = parsed.configPath ? new ConfigLoader({ configPath: parsed.configPath }) : this.configLoader;
    if (!loader.exists()) {
      console.error(`❌ Error: Configuration file not found. Run 'tgraph init' first.`);
      return 1;
    }
    const config = loader.load();

    const available = [
      'admin.guard',
      'is-admin.decorator',
      'paginated-search-query.dto',
      'paginated-search-result.dto',
      'api-response.dto',
      'pagination.interceptor',
      'paginated-search.decorator',
      'paginated-search.util',
      'feature-flag.guard',
      'audit.interceptor',
    ];

    if (parsed.staticList) {
      console.log('Available static modules:');
      available.forEach((n) => console.log(` - ${n}`));
      return 0;
    }

    let include = parsed.staticInclude ?? [];
    if (include.length === 0 && !(parsed.options.nonInteractive ?? false)) {
      console.log('No --include provided. Select which static modules to generate:');
      for (const name of available) {
        const yes = await promptUser(`Generate ${name}? (y/n): `, { defaultValue: true });
        if (yes) include.push(name);
      }
    }

    // If still empty and nonInteractive, generate all
    if (include.length === 0) include = available;

    const generator = new NestStaticGenerator(config);
    await generator.generate({ include });
    console.log('✅ Static files generation completed');
    return 0;
  }

  private async executeSwaggerCommand(parsed: ParsedArguments): Promise<number> {
    const loader = parsed.configPath ? new ConfigLoader({ configPath: parsed.configPath }) : this.configLoader;
    if (!loader.exists()) {
      console.error(`❌ Error: Configuration file not found. Run 'tgraph init' first.`);
      return 1;
    }
    const config = loader.load();
    const workspaceRoot = process.cwd();
    const command = config.output.dashboard.swagger?.command ?? 'npm run generate:swagger';
    return this.runSwaggerCommand(command, workspaceRoot);
  }

  private async executeTypesCommand(parsed: ParsedArguments): Promise<number> {
    const loader = parsed.configPath ? new ConfigLoader({ configPath: parsed.configPath }) : this.configLoader;
    if (!loader.exists()) {
      console.error(`❌ Error: Configuration file not found. Run 'tgraph init' first.`);
      return 1;
    }
    const config = loader.load();

    const workspaceRoot = process.cwd();
    const dashboardRoot = this.pathModule.isAbsolute(config.output.dashboard.root)
      ? config.output.dashboard.root
      : this.pathModule.join(workspaceRoot, config.output.dashboard.root);

    if (!parsed.skipSwagger) {
      const swaggerCommand = config.output.dashboard.swagger?.command ?? 'npm run generate:swagger';
      const swaggerResult = this.runSwaggerCommand(swaggerCommand, workspaceRoot);
      if (swaggerResult !== 0) {
        return swaggerResult;
      }
    }

    const swaggerConfigPath = config.output.dashboard.swagger?.jsonPath;
    const swaggerJsonPath = swaggerConfigPath
      ? this.pathModule.isAbsolute(swaggerConfigPath)
        ? swaggerConfigPath
        : this.pathModule.join(workspaceRoot, swaggerConfigPath)
      : this.pathModule.join(dashboardRoot, 'types', 'swagger.json');

    if (!this.fsModule.existsSync(swaggerJsonPath)) {
      console.error('❌ Missing swagger.json. Please generate swagger before running tgraph types.');
      console.error(`Expected at: ${swaggerJsonPath}`);
      return 1;
    }

    const outputDir = this.pathModule.join(dashboardRoot, 'types');
    const command = `npx swagger-typescript-api generate -p "${swaggerJsonPath}" -o "${outputDir}" -n api.ts`;
    try {
      execSync(command, { stdio: 'inherit', cwd: workspaceRoot });
      console.log('✅ Types generated successfully');
      return 0;
    } catch (error) {
      console.error('❌ Failed to generate types from swagger.json');
      console.error(error);
      return 1;
    }
  }

  private runSwaggerCommand(command: string | undefined, workspaceRoot: string): number {
    const trimmed = command?.trim();
    if (!trimmed) {
      console.warn('⚠️ No swagger command configured. Skipping swagger generation.');
      return 0;
    }

    try {
      console.log(`🧾 Running swagger command: ${trimmed}`);
      execSync(trimmed, { stdio: 'inherit', cwd: workspaceRoot });
      return 0;
    } catch (error) {
      console.error('❌ Failed to run swagger command:', error);
      return 1;
    }
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
        const message =
          error instanceof ConfigLoaderError ? error.cause : error instanceof Error ? error.message : String(error);
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
      console.log(
        `⏳ Running diagnostic checks... [${new Date().toLocaleTimeString()}] (config loaded in ${configLoadTime - startTime}ms)\n`,
      );

      const validator = new SystemValidator();
      const runtimeConfig = this.applyCliOverrides(config, cliOptions);
      const report: DiagnosticReport = await validator.runDiagnostics(runtimeConfig);

      const diagnosticsTime = Date.now();
      console.log(
        `✓ Diagnostics completed in ${diagnosticsTime - configLoadTime}ms [${new Date().toLocaleTimeString()}]\n`,
      );

      this.printDiagnosticReport(report);

      // Return appropriate exit code
      if (report.hasErrors) {
        console.log('\n❌ Diagnostics failed! Please fix the errors above before running generation.');
        console.log("💡 Run 'tgraph doctor' again after making changes to verify the fixes.\n");
        return 1;
      } else if (report.hasWarnings) {
        console.log(
          `\n✅ All critical checks passed! (${this.countWarnings(report)} warning${this.countWarnings(report) !== 1 ? 's' : ''})`,
        );
        console.log("💡 Run 'tgraph all' to start generating\n");
        return 0;
      } else {
        console.log('\n✅ All checks passed!');
        console.log("💡 Run 'tgraph all' to start generating\n");
        return 0;
      }
    } catch (error) {
      console.error('❌ Error running diagnostics:', error);
      return 1;
    }
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

  private async initializeConfig(options?: { outputPath?: string | undefined; requireAdmin?: boolean | undefined }): Promise<number> {
    const defaultPath = options?.outputPath
      ? this.pathModule.isAbsolute(options.outputPath)
        ? options.outputPath
        : this.pathModule.join(process.cwd(), options.outputPath)
      : this.pathModule.join(process.cwd(), 'tgraph.config.ts');

    // Interactive wizard
    const ask = async () => {
      const schemaPath = await promptText('Path to Prisma schema', { defaultValue: 'prisma/schema.prisma' });
      const prismaService = await promptText('Path to PrismaService', {
        defaultValue: 'src/infrastructure/database/prisma.service.ts',
      });
      const apiSuffix = await promptText('API class suffix (empty for none)', { defaultValue: 'Admin' });
      const apiPrefix = await promptText('API route prefix', { defaultValue: 'tg-api' });
      const authEnabled = await promptUser('Enable authentication guards? (y/n): ', { defaultValue: true });
      const requireAdmin = await promptUser('Require admin for this API? (y/n): ', {
        defaultValue: options?.requireAdmin ?? true,
      });
      const backendDefaultRoot = await promptText('Default feature root', { defaultValue: 'src/features' });
      const backendDtos = await promptText('Generated DTOs directory', { defaultValue: 'src/dtos/generated' });
      const staticGuards = await promptText('Guards directory', { defaultValue: 'src/guards' });
      const staticDecorators = await promptText('Decorators directory', { defaultValue: 'src/decorators' });
      const staticDtos = await promptText('Static DTOs directory', { defaultValue: 'src/dtos' });
      const staticInterceptors = await promptText('Interceptors directory', { defaultValue: 'src/interceptors' });
      const staticUtils = await promptText('Utils directory', { defaultValue: 'src/utils' });
      const dashboardRoot = await promptText('Dashboard root', { defaultValue: 'src/dashboard/src' });
      const dashboardResources = await promptText('Dashboard resources dir', {
        defaultValue: 'src/dashboard/src/resources',
      });

      return {
        schemaPath,
        prismaService,
        apiSuffix,
        apiPrefix,
        authEnabled,
        requireAdmin,
        backendDtos,
        backendDefaultRoot,
        staticGuards,
        staticDecorators,
        staticDtos,
        staticInterceptors,
        staticUtils,
        dashboardRoot,
        dashboardResources,
      };
    };

    if (this.configLoader.exists()) {
      const existingPath = this.configLoader.getConfigFilePath();
      console.error(`❌ Error: Configuration file already exists at '${existingPath}'`);
      console.error(`   Remove it first if you want to reinitialize.`);
      return 1;
    }
    try {
      // Ask whether to use defaults or run wizard
      const runWizard = await promptUser('Run interactive init wizard? (y/n): ', { defaultValue: true });
      const answers = runWizard ? await ask() : undefined;
      const content = this.buildConfigTemplate(answers);

      this.fsModule.writeFileSync(defaultPath, content, 'utf-8');
      console.log(`✅ Created configuration file: ${defaultPath}`);
      console.log(`   You can now customize it for your project.`);
      console.log(`   Run 'tgraph all' to generate code.`);
      return 0;
    } catch (error) {
      console.error(`❌ Error creating configuration file:`, error);
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
        case '--output':
          index = this.readNextValue(args, index, (value) => (parsed.initOutputPath = value), parsed);
          continue;
        case '--requireAdmin': {
          const nextIndex = this.readNextValue(
            args,
            index,
            (value) => (parsed.initRequireAdmin = value === 'true'),
            parsed,
          );
          index = nextIndex;
          continue;
        }
        case '--list':
          parsed.staticList = true;
          index += 1;
          continue;
        case '--include':
          index = this.readNextValue(
            args,
            index,
            (value) =>
              (parsed.staticInclude = value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)),
            parsed,
          );
          continue;
        case '--skip-swagger':
          parsed.skipSwagger = true;
          index += 1;
          continue;
        case '--public':
          parsed.options.forcePublic = true;
          index += 1;
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
            if (
              ['api', 'dashboard', 'dtos', 'all', 'init', 'doctor', 'preflight', 'static', 'types', 'swagger'].includes(
                normalizedCommand,
              )
            ) {
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

  private printDiagnosticReport(report: DiagnosticReport): void {
    for (const category of report.categories) {
      this.printDiagnosticCategory(category);
    }
  }

  private printHelp(command?: CliCommand): void {
    if (command === 'init') {
      const text = `
tgraph init [options]

Initializes a new tgraph.config.ts file. Run with no options to use interactive wizard.

Options:
  --output <file>            Output file name (default: tgraph.config.ts)
  --requireAdmin <true|false>  Default requireAdmin in generated config (default: true)
  -y, --yes                  Non-interactive defaults
  -h, --help                 Show this help
`;
      console.log(text.trim());
      return;
    }
    if (command === 'static') {
      const text = `
tgraph static [options]

Generate selectable static backend files (guards, decorators, dtos, interceptors, utils).

Options:
  --list                     List available static modules and exit
  --include <names>          Comma-separated list to include (e.g. admin-guard,pagination.interceptor)
  -y, --yes                  Generate defaults without prompts
  -h, --help                 Show this help

Available names include:
  admin.guard, is-admin.decorator, paginated-search-query.dto, paginated-search-result.dto,
  api-response.dto, pagination.interceptor, paginated-search.decorator, paginated-search.util,
  feature-flag.guard, audit.interceptor
`;
      console.log(text.trim());
      return;
    }
    if (command === 'types') {
      const text = `
tgraph types [options]

Generate dashboard API types (api.ts) from an existing swagger.json.

Options:
  -c, --config <path>        Configuration file path
  --skip-swagger             Skip running the configured swagger generation command
  -h, --help                 Show this help

Notes:
  - Runs the configured swagger command (default: npm run generate:swagger) before type generation unless skipped.
`;
      console.log(text.trim());
      return;
    }

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
  static      Generate selectable static backend files
  types       Generate dashboard API client types from swagger.json
  swagger     Run the configured swagger generation command

Options:
  -c, --config, --file <path>  Path to configuration file (default: tgraph.config.ts)
  -y, --yes, --non-interactive Automatically confirm interactive prompts
  --interactive                Force interactive prompts
  --public                     Override config to generate controllers without authentication guards
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

  /**
   * Execute the CLI with the provided arguments.
   * Returns the exit code that should be used by the caller.
   */
  async run(argv: string[]): Promise<number> {
    const parsed = this.parseArguments(argv);

    if (parsed.helpRequested) {
      this.printHelp(parsed.command);
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
      return await this.initializeConfig({ outputPath: parsed.initOutputPath, requireAdmin: parsed.initRequireAdmin });
    }

    if (parsed.command === 'doctor') {
      return await this.executeDoctorCommand(parsed.configPath, parsed.options);
    }

    if (parsed.command === 'static') {
      return await this.executeStaticCommand(parsed);
    }

    if (parsed.command === 'types') {
      return await this.executeTypesCommand(parsed);
    }

    if (parsed.command === 'swagger') {
      return await this.executeSwaggerCommand(parsed);
    }

    // Check if config file exists (or was specified)
    const configLoader = parsed.configPath ? new ConfigLoader({ configPath: parsed.configPath }) : this.configLoader;

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
}
