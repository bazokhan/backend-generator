import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { Config } from '@tg-scripts/types';

const execAsync = promisify(exec);

export type DiagnosticSeverity = 'ok' | 'warning' | 'error';

export interface DiagnosticResult {
  severity: DiagnosticSeverity;
  message: string;
  suggestion?: string;
}

export interface DiagnosticCategory {
  name: string;
  results: DiagnosticResult[];
}

export interface DiagnosticReport {
  categories: DiagnosticCategory[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export class SystemValidator {
  private readonly fsModule: typeof fs;
  private readonly pathModule: typeof path;
  private readonly execFn: typeof execAsync;
  private readonly cwd: string;

  constructor(options: {
    fsModule?: typeof fs;
    pathModule?: typeof path;
    execFn?: typeof execAsync;
    cwd?: string;
  } = {}) {
    this.fsModule = options.fsModule ?? fs;
    this.pathModule = options.pathModule ?? path;
    this.execFn = options.execFn ?? execAsync;
    this.cwd = options.cwd ?? process.cwd();
  }

  /**
   * Run all diagnostic checks and return a grouped report
   */
  async runDiagnostics(config: Config): Promise<DiagnosticReport> {
    const categories: DiagnosticCategory[] = [];
    const startTime = Date.now();

    // Configuration checks
    const configStart = Date.now();
    categories.push({
      name: 'Configuration',
      results: await this.checkConfiguration(config),
    });
    console.log(`  ⏱️  Configuration checks: ${Date.now() - configStart}ms`);

    // Environment checks (can be slow due to Prisma CLI check)
    const envStart = Date.now();
    categories.push({
      name: 'Environment',
      results: await this.checkEnvironment(),
    });
    console.log(`  ⏱️  Environment checks: ${Date.now() - envStart}ms`);

    // Prisma schema checks (can be slow due to prisma validate)
    const schemaStart = Date.now();
    categories.push({
      name: 'Prisma Schema',
      results: await this.checkPrismaSchema(config),
    });
    console.log(`  ⏱️  Prisma schema checks: ${Date.now() - schemaStart}ms`);

    // Path checks
    const pathStart = Date.now();
    categories.push({
      name: 'Project Paths',
      results: await this.checkConfigPaths(config),
    });
    console.log(`  ⏱️  Path checks: ${Date.now() - pathStart}ms`);
    console.log(`  ⏱️  Total diagnostic time: ${Date.now() - startTime}ms\n`);

    // Determine if there are errors or warnings
    let hasErrors = false;
    let hasWarnings = false;

    for (const category of categories) {
      for (const result of category.results) {
        if (result.severity === 'error') {
          hasErrors = true;
        } else if (result.severity === 'warning') {
          hasWarnings = true;
        }
      }
    }

    return {
      categories,
      hasErrors,
      hasWarnings,
    };
  }

  /**
   * Check configuration validity
   */
  private async checkConfiguration(config: Config): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Check if config file exists
    const configFiles = ['tgraph.config.ts', 'tgraph.config.js'];
    const configExists = configFiles.some((file) =>
      this.fsModule.existsSync(this.pathModule.join(this.cwd, file)),
    );

    if (configExists) {
      const configFile = configFiles.find((file) =>
        this.fsModule.existsSync(this.pathModule.join(this.cwd, file)),
      );
      results.push({
        severity: 'ok',
        message: `Config file found: ${configFile}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: 'No configuration file found',
        suggestion: "Run 'tgraph init' to create a configuration file",
      });
    }

    // Validate input schema path
    if (config.input?.schemaPath) {
      results.push({
        severity: 'ok',
        message: `Schema path configured: ${config.input.schemaPath}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'input.schemaPath'",
        suggestion: "Set 'input.schemaPath' in your configuration file",
      });
    }

    // Validate input prismaService path
    if (config.input?.prismaService) {
      results.push({
        severity: 'ok',
        message: `PrismaService path configured: ${config.input.prismaService}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'input.prismaService'",
        suggestion: "Set 'input.prismaService' to the path of your PrismaService file (e.g., 'src/infrastructure/database/prisma.service.ts')",
      });
    }

    // Validate backend output paths
    if (config.output?.backend?.dtos) {
      results.push({
        severity: 'ok',
        message: `DTO output path configured: ${config.output.backend.dtos}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'output.backend.dtos'",
        suggestion: "Set 'output.backend.dtos' to the directory where DTOs should be generated",
      });
    }

    if (config.output?.backend?.modules?.searchPaths?.length) {
      results.push({
        severity: 'ok',
        message: `Module search paths configured: ${config.output.backend.modules.searchPaths.join(', ')}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing module search paths in 'output.backend.modules.searchPaths'",
        suggestion: 'Provide at least one directory where existing NestJS modules can be discovered',
      });
    }

    if (config.output?.backend?.modules?.defaultRoot) {
      results.push({
        severity: 'ok',
        message: `Module default root configured: ${config.output.backend.modules.defaultRoot}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'output.backend.modules.defaultRoot'",
        suggestion: 'Set a directory where new modules should be created',
      });
    }

    // Validate backend static files paths
    const staticFiles = config.output?.backend?.staticFiles;
    
    if (staticFiles?.guards) {
      results.push({
        severity: 'ok',
        message: `Guards path configured: ${staticFiles.guards}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'output.backend.staticFiles.guards'",
        suggestion: "Set 'output.backend.staticFiles.guards' to the directory for guard files (e.g., 'src/guards')",
      });
    }

    if (staticFiles?.decorators) {
      results.push({
        severity: 'ok',
        message: `Decorators path configured: ${staticFiles.decorators}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'output.backend.staticFiles.decorators'",
        suggestion: "Set 'output.backend.staticFiles.decorators' to the directory for decorator files (e.g., 'src/decorators')",
      });
    }

    if (staticFiles?.dtos) {
      results.push({
        severity: 'ok',
        message: `Static DTOs path configured: ${staticFiles.dtos}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'output.backend.staticFiles.dtos'",
        suggestion: "Set 'output.backend.staticFiles.dtos' to the directory for static DTO files (e.g., 'src/dtos')",
      });
    }

    if (staticFiles?.interceptors) {
      results.push({
        severity: 'ok',
        message: `Interceptors path configured: ${staticFiles.interceptors}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'output.backend.staticFiles.interceptors'",
        suggestion: "Set 'output.backend.staticFiles.interceptors' to the directory for interceptor files (e.g., 'src/interceptors')",
      });
    }

    if (staticFiles?.utils) {
      results.push({
        severity: 'ok',
        message: `Utils path configured: ${staticFiles.utils}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'output.backend.staticFiles.utils'",
        suggestion: "Set 'output.backend.staticFiles.utils' to the directory for utility files (e.g., 'src/utils')",
      });
    }

    if (config.output?.dashboard?.root) {
      results.push({
        severity: 'ok',
        message: `Dashboard root configured: ${config.output.dashboard.root}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'output.dashboard.root'",
        suggestion: 'Set the root of your React Admin dashboard',
      });
    }

    if (config.output?.dashboard?.resources) {
      results.push({
        severity: 'ok',
        message: `Dashboard resources path configured: ${config.output.dashboard.resources}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'output.dashboard.resources'",
        suggestion: 'Set the directory where dashboard resources should be generated',
      });
    }

    // Validate API section
    if (config.api?.suffix !== undefined && config.api.suffix !== null) {
      if (config.api.suffix === '' || /^[A-Z][a-zA-Z0-9]*$/.test(config.api.suffix)) {
        results.push({
          severity: 'ok',
          message: `API suffix configured: ${config.api.suffix === '' ? '(empty string)' : `"${config.api.suffix}"`}`,
        });
      } else {
        results.push({
          severity: 'warning',
          message: `API suffix '${config.api.suffix}' is not PascalCase`,
          suggestion: "Use PascalCase format (e.g., 'Admin', 'Public')",
        });
      }
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'api.suffix'",
        suggestion: "Set 'api.suffix' to control generated class names (use '' for none)",
      });
    }

    if (config.api?.prefix) {
      results.push({
        severity: 'ok',
        message: `API route prefix configured: ${config.api.prefix}`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required field 'api.prefix'",
        suggestion: 'Set the route prefix used for generated controllers (e.g., tg-api)',
      });
    }

    if (config.api?.authentication) {
      const guardsCount = config.api.authentication.guards?.length ?? 0;
      results.push({
        severity: 'ok',
        message: `Authentication configured (${guardsCount} guard${guardsCount === 1 ? '' : 's'})`,
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required section 'api.authentication'",
        suggestion: 'Define guards to be applied to generated controllers',
      });
    }

    // Validate dashboard section
    if (config.dashboard?.components) {
      results.push({
        severity: 'ok',
        message: 'Dashboard component overrides configured',
      });
    } else {
      results.push({
        severity: 'error',
        message: "Missing required section 'dashboard.components'",
        suggestion: 'Provide component defaults, even if they are empty objects',
      });
    }

    if (config.behavior) {
      results.push({
        severity: 'ok',
        message: `Non-interactive mode default: ${config.behavior.nonInteractive ? 'enabled' : 'disabled'}`,
      });
    } else {
      results.push({
        severity: 'warning',
        message: "Missing optional section 'behavior'",
        suggestion: "Add 'behavior.nonInteractive' to control prompt defaults",
      });
    }

    return results;
  }

  /**
   * Check Node.js version
   */
  async checkNodeVersion(): Promise<DiagnosticResult> {
    const currentVersion = process.version;
    const requiredVersion = '18.0.0';

    try {
      const current = this.parseVersion(currentVersion);
      const required = this.parseVersion(requiredVersion);

      if (this.compareVersions(current, required) >= 0) {
        return {
          severity: 'ok',
          message: `Node version: ${currentVersion} (>= ${requiredVersion} required)`,
        };
      } else {
        return {
          severity: 'error',
          message: `Node version ${currentVersion} is below required ${requiredVersion}`,
          suggestion: `Upgrade Node.js to version ${requiredVersion} or higher`,
        };
      }
    } catch (error) {
      return {
        severity: 'error',
        message: `Could not parse Node version: ${currentVersion}`,
        suggestion: 'Ensure Node.js is properly installed',
      };
    }
  }

  /**
   * Check if Prisma CLI is installed
   */
  async checkPrismaInstalled(): Promise<DiagnosticResult> {
    try {
      // Note: This can take a few seconds on first run as npx resolves the package
      await this.execFn('npx prisma --version', { cwd: this.cwd });
      return {
        severity: 'ok',
        message: 'Prisma CLI installed',
      };
    } catch (error) {
      return {
        severity: 'error',
        message: 'Prisma CLI not found',
        suggestion: "Run 'npm install prisma' to install Prisma",
      };
    }
  }

  /**
   * Check environment (Node version and Prisma CLI)
   */
  private async checkEnvironment(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Check Node version
    results.push(await this.checkNodeVersion());

    // Check Prisma CLI
    results.push(await this.checkPrismaInstalled());

    return results;
  }

  /**
   * Check Prisma schema validity
   */
  async checkPrismaSchema(config: Config): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    if (!config.input?.schemaPath) {
      results.push({
        severity: 'error',
        message: "Schema path not configured",
        suggestion: "Set 'input.schemaPath' in your configuration file",
      });
      return results;
    }

    // Resolve schema path
    const schemaPath = this.pathModule.isAbsolute(config.input.schemaPath)
      ? config.input.schemaPath
      : this.pathModule.join(this.cwd, config.input.schemaPath);

    // Check if schema file exists
    if (!this.fsModule.existsSync(schemaPath)) {
      results.push({
        severity: 'error',
        message: `Schema file not found: ${config.input.schemaPath}`,
        suggestion: "Run 'npx prisma init' to create a schema",
      });
      return results;
    }

    results.push({
      severity: 'ok',
      message: 'Schema file exists',
    });

    // Check if schema file has content
    const stats = this.fsModule.statSync(schemaPath);
    if (stats.size === 0) {
      results.push({
        severity: 'warning',
        message: 'Schema file is empty',
        suggestion: 'Add models to your Prisma schema',
      });
      return results;
    }

    // Validate schema using Prisma CLI
    // Note: This can take several seconds as Prisma parses and validates the schema
    try {
      await this.execFn(`npx prisma validate --schema="${schemaPath}"`, {
        cwd: this.cwd,
      });
      results.push({
        severity: 'ok',
        message: 'Schema is valid',
      });
    } catch (error) {
      results.push({
        severity: 'error',
        message: 'Schema validation failed',
        suggestion: "Run 'npx prisma validate' for details and fix syntax errors",
      });
    }

    return results;
  }

  /**
   * Check if configured paths exist
   */
  async checkConfigPaths(config: Config): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Check dashboard path
    if (config.output?.dashboard?.root) {
      const dashboardPath = this.pathModule.isAbsolute(config.output.dashboard.root)
        ? config.output.dashboard.root
        : this.pathModule.join(this.cwd, config.output.dashboard.root);

      if (this.fsModule.existsSync(dashboardPath)) {
        results.push({
          severity: 'ok',
          message: `Dashboard directory exists: ${config.output.dashboard.root}`,
        });
      } else {
        results.push({
          severity: 'warning',
          message: `Dashboard directory does not exist: ${config.output.dashboard.root}`,
          suggestion: 'Directory will be created during generation',
        });
      }
    }

    if (config.output?.dashboard?.resources) {
      const resourcesPath = this.pathModule.isAbsolute(config.output.dashboard.resources)
        ? config.output.dashboard.resources
        : this.pathModule.join(this.cwd, config.output.dashboard.resources);

      if (this.fsModule.existsSync(resourcesPath)) {
        results.push({
          severity: 'ok',
          message: `Dashboard resources directory exists: ${config.output.dashboard.resources}`,
        });
      } else {
        results.push({
          severity: 'warning',
          message: `Dashboard resources directory does not exist: ${config.output.dashboard.resources}`,
          suggestion: 'Directory will be created during generation',
        });
      }
    }

    // Check DTOs path
    if (config.output?.backend?.dtos) {
      const dtosPath = this.pathModule.isAbsolute(config.output.backend.dtos)
        ? config.output.backend.dtos
        : this.pathModule.join(this.cwd, config.output.backend.dtos);

      if (this.fsModule.existsSync(dtosPath)) {
        results.push({
          severity: 'ok',
          message: `DTOs directory exists: ${config.output.backend.dtos}`,
        });
      } else {
        results.push({
          severity: 'warning',
          message: `DTOs directory does not exist: ${config.output.backend.dtos}`,
          suggestion: 'Directory will be created during generation',
        });
      }
    }

    // Check common NestJS paths
    const srcPath = this.pathModule.join(this.cwd, 'src');
    if (this.fsModule.existsSync(srcPath)) {
      results.push({
        severity: 'ok',
        message: 'Source directory exists: src/',
      });
    } else {
      results.push({
        severity: 'warning',
        message: 'Source directory not found: src/',
        suggestion: 'Ensure this is a NestJS project with a src/ directory',
      });
    }

    return results;
  }

  /**
   * Parse version string into components
   */
  private parseVersion(version: string): [number, number, number] {
    const cleaned = version.replace(/^v/, '');
    const parts = cleaned.split('.').map((part) => parseInt(part?.split('-')[0] ?? '0', 10));
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  }

  /**
   * Compare two version tuples
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  private compareVersions(a: [number, number, number], b: [number, number, number]): number {
    for (let i = 0; i < 3; i++) {
      const aVal = a[i]!;
      const bVal = b[i]!;
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  }
}

