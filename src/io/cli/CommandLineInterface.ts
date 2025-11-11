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
import { promptUser } from '../utils/user-prompt';
import { supportedCommands } from '../../parser/cli-parser/config';
import { buildHelpText } from './utils';
import type { CliCommand, CliParsedOptions, ParsedArguments } from '../../parser/cli-parser/types';
import { CliParser } from '@tg-scripts/parser/cli-parser/CliParser';
import { AdaptersGenerator } from '../../generator/adapters-generator/AdaptersGenerator';
import { PrismaSchemaParser } from '@tg-scripts/parser/prisma-schema-parser/PrismaSchemaParser';
import { PrismaRelationsParser } from '@tg-scripts/parser/prisma-relation-parser/PrismaRelationsParser';
import { PrismaFieldParser } from '@tg-scripts/parser/prisma-field-parser/PrismaFieldParser';
import { AdapterParser } from '@tg-scripts/parser/adapter-parser/AdapterParser';
import { AdapterDtoGenerator } from '@tg-scripts/generator/adapter-dto-generator/AdapterDtoGenerator';
import { AdapterValidator } from '../validation/AdapterValidator';
import { ConfigFileGenerator } from '@tg-scripts/generator/config-file-generator/ConfigFileGenerator';
import { ModulePathResolver } from '../module-path-resolver/ModulePathResolver';

export class CommandLineInterface {
  private readonly configLoader: ConfigLoader;
  private readonly cliParser: CliParser;
  private readonly configFileGenerator: ConfigFileGenerator;
  private readonly fsModule: typeof fs;
  // pathModule is a module that provides functions for working with file paths
  private readonly pathModule: typeof path;

  constructor(
    options: {
      configLoader?: ConfigLoader;
      cliParser?: CliParser;
      fsModule?: typeof fs;
      pathModule?: typeof path;
    } = {},
  ) {
    this.configLoader = options.configLoader ?? new ConfigLoader();
    this.cliParser = options.cliParser ?? new CliParser();
    this.fsModule = options.fsModule ?? fs;
    this.pathModule = options.pathModule ?? path;
    this.configFileGenerator = new ConfigFileGenerator({
      type: 'commonjs',
      extension: 'ts',
    });
  }

  private applyCliOverrides(config: Config, options: CliParsedOptions): Config {
    const nextConfig: Config = { ...config };

    if (options.nonInteractive !== undefined) {
      nextConfig.behavior = {
        ...nextConfig.behavior,
        nonInteractive: options.nonInteractive as boolean,
      };
    }

    if (options.forcePublic) {
      nextConfig.api = {
        ...nextConfig.api,
        authenticationEnabled: false,
        requireAdmin: false,
      };
    }

    return nextConfig;
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
      default:
        throw new Error(`Unsupported command: ${command}`);
    }
  }

  private async executeStaticCommand(parsed: ParsedArguments, config: Config): Promise<number> {
    const generator = new NestStaticGenerator(config);
    const availableFiles = generator.getAvailableFiles();
    const available = availableFiles.map((f) => f.name);

    // Handle --cat or --preflight option
    if (parsed.options.staticCat) {
      const file = availableFiles.find((f) => f.name === parsed.options.staticCat);
      if (!file) {
        console.error(`❌ Error: Static file '${parsed.options.staticCat}' not found.`);
        console.error(`   Available files: ${available.join(', ')}`);
        return 1;
      }

      console.log(`📄 Preview of ${file.name}:`);
      console.log(`   Will be generated at: ${file.path}\n`);

      // Generate just this file to preview content
      const generatedFiles = await generator.generate({ include: [file.name] });
      const firstFile = generatedFiles[0];
      if (firstFile && this.fsModule.existsSync(firstFile)) {
        const content = this.fsModule.readFileSync(firstFile, 'utf-8');
        console.log(content);
      }

      return 0;
    }

    if (parsed.options.staticList) {
      console.log('Available static modules:');
      availableFiles.forEach((f) => {
        const relativePath = this.pathModule.relative(process.cwd(), f.path);
        console.log(` - ${f.name} → ${relativePath}`);
      });
      return 0;
    }

    let include = (parsed.options.staticInclude ?? []) as string[];
    if (include.length === 0 && !(parsed.options.nonInteractive ?? false)) {
      console.log('No --include provided. Select which static modules to generate:');
      for (const name of available) {
        const yes = await promptUser(`Generate ${name}? (y/n): `, { defaultValue: true });
        if (yes) include.push(name);
      }
    }

    // If still empty and nonInteractive, generate all
    if (include.length === 0) include = available;

    const generatedFiles = await generator.generate({ include });

    console.log('\n✅ Static files generation completed successfully!');
    console.log('\n📁 Generated files:');
    generatedFiles.forEach((filePath) => {
      const relativePath = this.pathModule.relative(process.cwd(), filePath);
      console.log(`   ✓ ${relativePath}`);
    });

    return 0;
  }

  private async executeSwaggerCommand(parsed: ParsedArguments): Promise<number> {
    const loader = parsed.options.configPath
      ? new ConfigLoader({ configPath: parsed.options.configPath as string })
      : this.configLoader;
    if (!loader.exists()) {
      console.error(`❌ Error: Configuration file not found. Run 'tgraph init' first.`);
      return 1;
    }
    const config = loader.load();
    const workspaceRoot = process.cwd();
    const command = 'npm run generate:swagger';
    return this.runSwaggerCommand(command, workspaceRoot);
  }

  private async executeTypesCommand(parsed: ParsedArguments): Promise<number> {
    const loader = parsed.options.configPath
      ? new ConfigLoader({ configPath: parsed.options.configPath as string })
      : this.configLoader;
    if (!loader.exists()) {
      console.error(`❌ Error: Configuration file not found. Run 'tgraph init' first.`);
      return 1;
    }
    const config = loader.load();

    const workspaceRoot = process.cwd();
    const dashboardRoot = this.pathModule.isAbsolute(config.output.dashboard.root as string)
      ? config.output.dashboard.root
      : this.pathModule.join(workspaceRoot, config.output.dashboard.root as string);

    if (!parsed.options.skipSwagger) {
      const swaggerCommand = 'npm run generate:swagger';
      const swaggerResult = this.runSwaggerCommand(swaggerCommand, workspaceRoot);
      if (swaggerResult !== 0) {
        return swaggerResult;
      }
    }

    const swaggerConfigPath = config.output.dashboard.swaggerJsonPath as string;
    const swaggerJsonPath = swaggerConfigPath
      ? this.pathModule.isAbsolute(swaggerConfigPath)
        ? swaggerConfigPath
        : this.pathModule.join(workspaceRoot, swaggerConfigPath)
      : this.pathModule.join(dashboardRoot as string, 'types', 'swagger.json');

    if (!this.fsModule.existsSync(swaggerJsonPath)) {
      console.error('❌ Missing swagger.json. Please generate swagger before running tgraph types.');
      console.error(`Expected at: ${swaggerJsonPath}`);
      return 1;
    }

    const outputDir = this.pathModule.join(dashboardRoot as string, 'types');
    const command = `npx swagger-typescript-api generate -p "${swaggerJsonPath}" -o "${outputDir}" -n api.ts`;
    try {
      execSync(command, { stdio: 'inherit', cwd: workspaceRoot });

      // Format the generated files
      const { formatGeneratedFile } = await import('../../io/utils');
      const apiTsPath = this.pathModule.join(outputDir, 'api.ts');
      if (this.fsModule.existsSync(apiTsPath)) {
        formatGeneratedFile(apiTsPath, workspaceRoot);
      }
      if (this.fsModule.existsSync(swaggerJsonPath)) {
        formatGeneratedFile(swaggerJsonPath, workspaceRoot);
      }

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

      // Note: swagger.json formatting is handled in executeTypesCommand
      // If running swagger command independently, we could format it here
      // but we don't have access to the swagger path in this context

      return 0;
    } catch (error) {
      console.error('❌ Failed to run swagger command:', error);
      return 1;
    }
  }

  private async executeDoctorCommand(configPath: string | undefined, cliOptions: CliParsedOptions): Promise<number> {
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
            prisma: {
              schemaPath: '',
              servicePath: '',
            },
            dashboard: {
              components: {},
            },
          },
          output: {
            backend: {
              root: '',
              dtosPath: '',
              modulesPaths: [],
              guardsPath: '',
              decoratorsPath: '',
              interceptorsPath: '',
              utilsPath: '',
              appModulePath: '',
            },
            dashboard: {
              enabled: false,
              updateDataProvider: false,
              root: '',
              resourcesPath: '',
              swaggerJsonPath: '',
              apiPath: '',
              dataProviderPath: '',
              appComponentPath: '',
            },
          },
          api: {
            suffix: '',
            prefix: '',
            authenticationEnabled: true,
            requireAdmin: true,
            guards: [],
            adminGuards: [],
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

  private async initializeConfig(options?: {
    outputPath?: string | undefined;
    requireAdmin?: boolean | undefined;
  }): Promise<number> {
    try {
      const defaultPath = options?.outputPath
        ? this.pathModule.isAbsolute(options.outputPath)
          ? options.outputPath
          : this.pathModule.join(process.cwd(), options.outputPath)
        : this.pathModule.join(process.cwd(), 'tgraph.config.ts');

      // Check if config already exists at the target path
      if (this.fsModule.existsSync(defaultPath)) {
        console.error(`❌ Error: Configuration file already exists at '${defaultPath}'`);
        console.error(`   Remove it first if you want to reinitialize.`);
        return 1;
      }

      const content = await this.configFileGenerator.generate({
        requireAdmin: options?.requireAdmin,
      });
      this.fsModule.writeFileSync(defaultPath, content, 'utf-8');

      // Format the generated config file
      const { formatGeneratedFile } = await import('../../io/utils');
      formatGeneratedFile(defaultPath, process.cwd());

      console.log(`✅ Created configuration file: ${defaultPath}`);
      console.log(`   You can now customize it for your project.`);
      console.log(`   Run 'tgraph all' to generate code.`);
      return 0;
    } catch (error) {
      console.error('❌ Error initializing config:', error);
      return 1;
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

  private printDiagnosticReport(report: DiagnosticReport): void {
    for (const category of report.categories) {
      this.printDiagnosticCategory(category);
    }
  }

  private printHelp(command?: CliCommand): void {
    if (command === 'help' || command === undefined) {
      // Print help for all commands
      const helpText = supportedCommands.map(buildHelpText).join('\n');
      console.log(helpText.trim());
    } else {
      // Print help for a specific command
      console.log(buildHelpText(supportedCommands.find((c) => c.name === command)!));
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

  private printPreflightReport(report: PreflightReport, config: Config): void {
    console.log('📂 Key Paths');
    this.printPathStatus(report.appModule, false);
    this.printPathStatus(report.dataProvider, !((config.output.dashboard.updateDataProvider as boolean) ?? true));
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
    try {
      const parsed = this.cliParser.parse(argv);

      if (parsed.options.helpRequested) {
        this.printHelp(parsed.command);
        return parsed.errors.length > 0 ? 1 : 0;
      }

      if (!parsed.command || parsed.errors.length > 0) {
        parsed.errors.forEach((error) => console.error(error));
        this.printHelp();
        return 1; // Return error when command is missing or errors exist
      }

      // handle commands that don't require a config file
      if (parsed.command === 'help') {
        this.printHelp(parsed.command);
        return 0;
      }
      if (parsed.command === 'init') {
        return await this.initializeConfig({
          outputPath: parsed.options.initOutputPath as string,
          requireAdmin: parsed.options.initRequireAdmin as boolean,
        });
      }
      if (parsed.command === 'doctor') {
        return await this.executeDoctorCommand(parsed.options.configPath as string, parsed.options);
      }

      // Check if config file exists (or was specified)
      const configLoader = parsed.options.configPath
        ? new ConfigLoader({ configPath: parsed.options.configPath as string })
        : this.configLoader;

      if (!configLoader.exists()) {
        if (parsed.options.configPath) {
          console.error(`❌ Error: Configuration file not found at: ${parsed.options.configPath as string}`);
        } else {
          console.error(`❌ Error: No configuration file found.`);
          console.error(`   Run 'tgraph init' to create a configuration file.`);
          console.error(`   Expected file: tgraph.config.ts or tgraph.config.js in project root.`);
          console.error(`   Or specify a config file with: --config <path>`);
        }
        throw new Error('Configuration file not found');
      }

      const runtimeConfig = configLoader.load();
      const mergedConfig = this.applyCliOverrides(runtimeConfig, parsed.options);

      const handlers: { [K in CliCommand]: () => Promise<void> } = {
        init: async () => {
          await this.initializeConfig({
            outputPath: parsed.options.initOutputPath as string,
            requireAdmin: parsed.options.initRequireAdmin as boolean,
          });
        },
        doctor: async () => {
          await this.executeDoctorCommand(parsed.options.configPath as string, parsed.options);
        },
        preflight: async () => {
          await this.runPreflight(mergedConfig);
        },
        api: async () => {
          await new ApiGenerator(mergedConfig).generate();
        },
        adapters: async () => {
          const schema = fs.readFileSync(mergedConfig.input.prisma.schemaPath as string, 'utf8');
          const schemaParser = new PrismaSchemaParser(new PrismaFieldParser(), new PrismaRelationsParser());
          schemaParser.load(schema);
          const models = schemaParser.parse().models;
          const adapters = await new AdaptersGenerator(
            new AdapterParser(),
            new AdapterValidator(),
            new AdapterDtoGenerator(),
            new ModulePathResolver(),
          ).generate({
            models: models,
          });
          console.log(
            Object.entries(adapters)
              .map(([modelName, { adapters, dtos }]) => ({
                modelName,
                adapters,
                dtos,
              }))
              .filter(({ adapters, dtos }) => adapters.length > 0 || dtos.length > 0)
              .map(({ adapters, dtos, modelName }) => adapters?.[0]?.config),
          );
        },
        dashboard: async () => {
          await new DashboardGenerator(mergedConfig).generate();
        },
        dtos: async () => {
          new DtoGenerator(mergedConfig).generate();
        },
        all: async () => {
          await new ApiGenerator(mergedConfig).generate();
          await new DashboardGenerator(mergedConfig).generate();
          new DtoGenerator(mergedConfig).generate();
        },
        static: async () => {
          await this.executeStaticCommand(parsed, mergedConfig);
        },
        types: async () => {
          await this.executeTypesCommand(parsed);
        },
        swagger: async () => {
          await this.executeSwaggerCommand(parsed);
        },
        help: async () => {
          this.printHelp(parsed.command);
        },
      };

      const handler = handlers[parsed.command];
      await handler();
      return 0;
    } catch (error) {
      this.handleExecutionError(error);
      return 1;
    }
  }
}
