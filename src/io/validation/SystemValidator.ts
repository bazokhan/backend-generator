import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { Config, Guard } from '@tg-scripts/types';
import { supportedConfigs } from '../cli/config';

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
  private readonly cwd: string;
  private readonly execFn: typeof execAsync;
  private readonly fsModule: typeof fs;
  private readonly pathModule: typeof path;
  constructor(
    options: {
      fsModule?: typeof fs;
      pathModule?: typeof path;
      execFn?: typeof execAsync;
      cwd?: string;
    } = {},
  ) {
    this.fsModule = options.fsModule ?? fs;
    this.pathModule = options.pathModule ?? path;
    this.execFn = options.execFn ?? execAsync;
    this.cwd = options.cwd ?? process.cwd();
  }

  /**
   * Check configuration validity
   */
  private async checkConfiguration(config: Config): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Check if config file exists
    const configFiles = ['tgraph.config.ts', 'tgraph.config.js'];
    const configExists = configFiles.some((file) => this.fsModule.existsSync(this.pathModule.join(this.cwd, file)));

    if (configExists) {
      const configFile = configFiles.find((file) => this.fsModule.existsSync(this.pathModule.join(this.cwd, file)));
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

    // Helper to format value for display
    const formatValueForDisplay = (value: any, type: string): string => {
      if (type === 'string[]' && Array.isArray(value)) {
        return value.join(', ');
      }
      if (type === 'Guard[]' && Array.isArray(value)) {
        return `${value.length} guard${value.length === 1 ? '' : 's'}`;
      }
      if (type === 'object') {
        return 'configured';
      }
      if (type === 'string' && value === '') {
        return '(empty string)';
      }
      return String(value);
    };

    // Dynamically validate all configs
    for (const configEntry of supportedConfigs) {
      const value = getValueAtPath(config, configEntry.fullPath);
      const exists = value !== undefined && value !== null;

      if (configEntry.required) {
        // Required field validation
        if (exists) {
          // Special validation for string[]
          if (configEntry.type === 'string[]' && Array.isArray(value)) {
            if (value.length === 0) {
              results.push({
                severity: 'error',
                message: `Missing ${configEntry.fullPath} (array is empty)`,
                suggestion: configEntry.suggestion || `Provide at least one value for ${configEntry.fullPath}`,
              });
            } else {
              results.push({
                severity: 'ok',
                message: `${configEntry.description}: ${formatValueForDisplay(value, configEntry.type)}`,
              });
            }
          } else {
            results.push({
              severity: 'ok',
              message: `${configEntry.description}: ${formatValueForDisplay(value, configEntry.type)}`,
            });
          }
        } else {
          results.push({
            severity: 'error',
            message: `Missing required field '${configEntry.fullPath}'`,
            suggestion: configEntry.suggestion || `Set '${configEntry.fullPath}' in your configuration file`,
          });
        }
      } else {
        // Optional field - only report if exists
        if (exists) {
          results.push({
            severity: 'ok',
            message: `${configEntry.description}: ${formatValueForDisplay(value, configEntry.type)}`,
          });
        }
      }
    }

    // Special validations
    // Validate api.suffix is PascalCase if not empty
    if (config.api?.suffix && typeof config.api.suffix === 'string' && config.api.suffix !== '') {
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(config.api.suffix as string)) {
        results.push({
          severity: 'warning',
          message: `API suffix '${config.api.suffix}' is not PascalCase`,
          suggestion: "Use PascalCase format (e.g., 'Admin', 'Public')",
        });
      }
    }

    // Validate authentication configuration
    if (config.api?.authenticationEnabled !== undefined) {
      const guardsCount = (config.api.guards as Guard[])?.length ?? 0;
      const adminGuardsCount = (config.api.adminGuards as Guard[])?.length ?? 0;
      results.push({
        severity: 'ok',
        message: `Authentication ${config.api.authenticationEnabled ? 'enabled' : 'disabled'} (${guardsCount} guard${guardsCount === 1 ? '' : 's'}${config.api.requireAdmin ? `, ${adminGuardsCount} admin guard${adminGuardsCount === 1 ? '' : 's'}` : ''})`,
      });
    }

    return results;
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

  /**
   * Parse version string into components
   */
  private parseVersion(version: string): [number, number, number] {
    const cleaned = version.replace(/^v/, '');
    const parts = cleaned.split('.').map((part) => parseInt(part?.split('-')[0] ?? '0', 10));
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  }

  /**
   * Check if configured paths exist
   */
  async checkConfigPaths(config: Config): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Check dashboard path
    if (config.output?.dashboard?.root) {
      const dashboardPath = this.pathModule.isAbsolute(config.output.dashboard?.root as string)
        ? (config.output.dashboard?.root as string)
        : this.pathModule.join(this.cwd, config.output.dashboard?.root as string);

      if (this.fsModule.existsSync(dashboardPath as string)) {
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

    if (config.output?.dashboard?.resourcesPath) {
      const resourcesPath = this.pathModule.isAbsolute(config.output.dashboard.resourcesPath as string)
        ? (config.output.dashboard.resourcesPath as string)
        : this.pathModule.join(this.cwd, config.output.dashboard.resourcesPath as string);

      if (this.fsModule.existsSync(resourcesPath)) {
        results.push({
          severity: 'ok',
          message: `Dashboard resources directory exists: ${config.output.dashboard.resourcesPath}`,
        });
      } else {
        results.push({
          severity: 'warning',
          message: `Dashboard resources directory does not exist: ${config.output.dashboard.resourcesPath}`,
          suggestion: 'Directory will be created during generation',
        });
      }
    }

    // Check DTOs path
    if (config.output?.backend?.dtosPath) {
      const dtosPath = this.pathModule.isAbsolute(config.output.backend.dtosPath as string)
        ? (config.output.backend.dtosPath as string)
        : this.pathModule.join(this.cwd, config.output.backend.dtosPath as string);

      if (this.fsModule.existsSync(dtosPath)) {
        results.push({
          severity: 'ok',
          message: `DTOs directory exists: ${config.output.backend.dtosPath}`,
        });
      } else {
        results.push({
          severity: 'warning',
          message: `DTOs directory does not exist: ${config.output.backend.dtosPath}`,
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
   * Check Prisma schema validity
   */
  async checkPrismaSchema(config: Config): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    if (!config.input?.prisma.schemaPath) {
      results.push({
        severity: 'error',
        message: 'Schema path not configured',
        suggestion: "Set 'input.schemaPath' in your configuration file",
      });
      return results;
    }

    // Resolve schema path
    const schemaPath = this.pathModule.isAbsolute(config.input.prisma.schemaPath as string)
      ? (config.input.prisma.schemaPath as string)
      : this.pathModule.join(this.cwd, config.input.prisma.schemaPath as string);

    // Check if schema file exists
    if (!this.fsModule.existsSync(schemaPath)) {
      results.push({
        severity: 'error',
        message: `Schema file not found: ${config.input.prisma.schemaPath}`,
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
}
