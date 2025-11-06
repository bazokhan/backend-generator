import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { Config } from '@tg-scripts/types';
import { SystemValidator, DiagnosticReport } from './SystemValidator';

describe('SystemValidator', () => {
  const tempDirs: string[] = [];
  let mockExec: jest.Mock;

  type MockConfigOverrides = Partial<Config> & {
    schemaPath?: string;
    dashboardPath?: string;
    dashboardResourcesPath?: string;
    dtosPath?: string;
    suffix?: string;
  };

  const createMockConfig = (overrides: MockConfigOverrides = {}): Config => {
    const base: Config = {
      input: {
        schemaPath: 'prisma/schema.prisma',
        prismaService: 'src/infrastructure/database/prisma.service.ts',
      },
      output: {
        backend: {
          dtos: 'src/dtos/generated',
          modules: {
            searchPaths: ['src/features', 'src/infrastructure'],
            defaultRoot: 'src/features',
          },
          staticFiles: {
            guards: 'src/guards',
            decorators: 'src/decorators',
            dtos: 'src/dtos',
            interceptors: 'src/interceptors',
          utils: 'src/utils',
        },
        },
        dashboard: {
          root: 'src/dashboard/src',
          resources: 'src/dashboard/src/resources',
        },
      },
      api: {
        suffix: 'Tg',
        prefix: 'api',
        authentication: {
          enabled: true,
          requireAdmin: true,
          guards: [],
        },
      },
      dashboard: {
        enabled: true,
        updateDataProvider: true,
        components: {
          form: {},
          display: {},
        },
      },
      behavior: {
        nonInteractive: false,
      },
    };

    if (overrides.input) {
      base.input = { ...base.input, ...overrides.input };
    }

    if (overrides.output) {
      base.output = {
        backend: {
          ...base.output.backend,
          ...(overrides.output.backend
            ? {
                dtos: overrides.output.backend.dtos ?? base.output.backend.dtos,
                modules: overrides.output.backend.modules
                  ? { ...base.output.backend.modules, ...overrides.output.backend.modules }
                  : base.output.backend.modules,
                staticFiles: overrides.output.backend.staticFiles
                  ? { ...base.output.backend.staticFiles, ...overrides.output.backend.staticFiles }
                  : base.output.backend.staticFiles,
              }
            : base.output.backend),
        },
        dashboard: overrides.output.dashboard
          ? { ...base.output.dashboard, ...overrides.output.dashboard }
          : base.output.dashboard,
      };
    }

    if (overrides.api) {
      base.api = {
        ...base.api,
        ...overrides.api,
        authentication: overrides.api.authentication
          ? { ...base.api.authentication, ...overrides.api.authentication }
          : base.api.authentication,
      };
    }

    if (overrides.dashboard) {
      base.dashboard = {
        ...base.dashboard,
        ...overrides.dashboard,
      };
    }

    if (overrides.behavior) {
      base.behavior = {
        ...base.behavior,
        ...overrides.behavior,
      };
    }

    if (overrides.paths) {
      base.paths = {
        ...base.paths,
        ...overrides.paths,
      };
    }

    if (overrides.schemaPath !== undefined) {
      base.input.schemaPath = overrides.schemaPath;
    }

    if (overrides.dtosPath !== undefined) {
      base.output.backend.dtos = overrides.dtosPath;
    }

    if (overrides.dashboardPath !== undefined) {
      base.output.dashboard.root = overrides.dashboardPath;
    }

    if (overrides.dashboardResourcesPath !== undefined) {
      base.output.dashboard.resources = overrides.dashboardResourcesPath;
    }

    if (overrides.suffix !== undefined) {
      base.api.suffix = overrides.suffix;
    }

    return base;
  };

  beforeEach(() => {
    mockExec = jest.fn();
  });

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('checkNodeVersion', () => {
    it('should pass when Node version is >= 18.0.0', async () => {
      const validator = new SystemValidator({
        execFn: mockExec as any,
      });

      // Current process.version should be >= 18.0.0 in test environment
      const result = await validator.checkNodeVersion();

      expect(result.severity).toBe('ok');
      expect(result.message).toContain('Node version');
      expect(result.message).toContain('>= 18.0.0 required');
    });

    it('should handle version comparison correctly', async () => {
      // We can't easily mock process.version, but we can test the logic
      // by verifying the current version passes
      const validator = new SystemValidator({
        execFn: mockExec as any,
      });

      const result = await validator.checkNodeVersion();
      
      // Since we're running on Node >= 18, this should always pass
      expect(result.severity).toBe('ok');
    });
  });

  describe('checkPrismaInstalled', () => {
    it('should pass when Prisma CLI is installed', async () => {
      mockExec.mockResolvedValue({ stdout: 'prisma: 5.0.0', stderr: '' });

      const validator = new SystemValidator({
        execFn: mockExec as any,
      });

      const result = await validator.checkPrismaInstalled();

      expect(result.severity).toBe('ok');
      expect(result.message).toBe('Prisma CLI installed');
      expect(mockExec).toHaveBeenCalledWith('npx prisma --version', expect.any(Object));
    });

    it('should fail when Prisma CLI is not installed', async () => {
      mockExec.mockRejectedValue(new Error('Command not found'));

      const validator = new SystemValidator({
        execFn: mockExec as any,
      });

      const result = await validator.checkPrismaInstalled();

      expect(result.severity).toBe('error');
      expect(result.message).toBe('Prisma CLI not found');
      expect(result.suggestion).toBe("Run 'npm install prisma' to install Prisma");
    });
  });

  describe('checkPrismaSchema', () => {
    it('should pass when schema file exists and is valid', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-schema-valid-'));
      tempDirs.push(tempDir);

      const schemaPath = path.join(tempDir, 'prisma', 'schema.prisma');
      fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
      fs.writeFileSync(schemaPath, 'model User { id Int @id }', 'utf-8');

      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const results = await validator.checkPrismaSchema(config);

      expect(results).toHaveLength(2);
      expect(results[0].severity).toBe('ok');
      expect(results[0].message).toBe('Schema file exists');
      expect(results[1].severity).toBe('ok');
      expect(results[1].message).toBe('Schema is valid');
    });

    it('should fail when schema file does not exist', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-schema-missing-'));
      tempDirs.push(tempDir);

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const results = await validator.checkPrismaSchema(config);

      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('error');
      expect(results[0].message).toContain('Schema file not found');
      expect(results[0].suggestion).toBe("Run 'npx prisma init' to create a schema");
    });

    it('should warn when schema file is empty', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-schema-empty-'));
      tempDirs.push(tempDir);

      const schemaPath = path.join(tempDir, 'prisma', 'schema.prisma');
      fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
      fs.writeFileSync(schemaPath, '', 'utf-8');

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const results = await validator.checkPrismaSchema(config);

      expect(results).toHaveLength(2);
      expect(results[0].severity).toBe('ok');
      expect(results[0].message).toBe('Schema file exists');
      expect(results[1].severity).toBe('warning');
      expect(results[1].message).toBe('Schema file is empty');
    });

    it('should fail when schema validation fails', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-schema-invalid-'));
      tempDirs.push(tempDir);

      const schemaPath = path.join(tempDir, 'prisma', 'schema.prisma');
      fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
      fs.writeFileSync(schemaPath, 'invalid syntax', 'utf-8');

      mockExec.mockRejectedValue(new Error('Validation failed'));

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const results = await validator.checkPrismaSchema(config);

      expect(results).toHaveLength(2);
      expect(results[0].severity).toBe('ok');
      expect(results[1].severity).toBe('error');
      expect(results[1].message).toBe('Schema validation failed');
    });

    it('should handle missing schema path in config', async () => {
      const validator = new SystemValidator({
        execFn: mockExec as any,
      });

      const config = createMockConfig({ schemaPath: '' });
      const results = await validator.checkPrismaSchema(config);

      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('error');
      expect(results[0].message).toBe('Schema path not configured');
    });
  });

  describe('checkConfigPaths', () => {
    it('should pass when all directories exist', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-paths-exist-'));
      tempDirs.push(tempDir);

      const dashboardPath = path.join(tempDir, 'src', 'dashboard', 'src');
      const dtosPath = path.join(tempDir, 'src', 'dtos', 'generated');
      const srcPath = path.join(tempDir, 'src');

      fs.mkdirSync(dashboardPath, { recursive: true });
      fs.mkdirSync(dtosPath, { recursive: true });

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const results = await validator.checkConfigPaths(config);

      const okResults = results.filter((r) => r.severity === 'ok');
      expect(okResults.length).toBeGreaterThanOrEqual(3);
      expect(okResults.some((r) => r.message.includes('Dashboard directory exists'))).toBe(true);
      expect(okResults.some((r) => r.message.includes('DTOs directory exists'))).toBe(true);
      expect(okResults.some((r) => r.message.includes('Source directory exists'))).toBe(true);
    });

    it('should warn when directories do not exist', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-paths-missing-'));
      tempDirs.push(tempDir);

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const results = await validator.checkConfigPaths(config);

    const warningResults = results.filter((r) => r.severity === 'warning');
      expect(warningResults.length).toBeGreaterThanOrEqual(3);
      expect(warningResults.some((r) => r.message.includes('Dashboard directory does not exist'))).toBe(true);
      expect(warningResults.some((r) => r.message.includes('Dashboard resources directory does not exist'))).toBe(true);
      expect(warningResults.some((r) => r.message.includes('DTOs directory does not exist'))).toBe(true);
    });

    it('should warn when src directory is missing', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-no-src-'));
      tempDirs.push(tempDir);

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const results = await validator.checkConfigPaths(config);

      expect(results.some((r) => r.message.includes('Source directory not found'))).toBe(true);
    });
  });

  describe('checkConfiguration', () => {
    it('should validate all config fields correctly', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-config-'));
      tempDirs.push(tempDir);

      fs.writeFileSync(path.join(tempDir, 'tgraph.config.ts'), '', 'utf-8');

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const results = await (validator as any).checkConfiguration(config);

      expect(results.some((r) => r.message.includes('Config file found'))).toBe(true);
      expect(results.some((r) => r.message.includes('Schema path configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('DTO output path configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('Module search paths configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('Module default root configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('Dashboard root configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('Dashboard resources path configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('API suffix configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('API route prefix configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('Authentication configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('Dashboard component overrides configured'))).toBe(true);
      expect(results.some((r) => r.message.includes('Non-interactive mode default'))).toBe(true);
    });

    it('should warn when suffix is not PascalCase', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-suffix-'));
      tempDirs.push(tempDir);

      fs.writeFileSync(path.join(tempDir, 'tgraph.config.ts'), '', 'utf-8');

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig({ suffix: 'lowercase' });
      const results = await (validator as any).checkConfiguration(config);

      const warningResult = results.find((r) => r.severity === 'warning');
      expect(warningResult).toBeDefined();
      expect(warningResult?.message).toContain('not PascalCase');
    });

    it('should error when config file does not exist', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-no-config-'));
      tempDirs.push(tempDir);

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const results = await (validator as any).checkConfiguration(config);

      const errorResult = results.find((r) => r.message.includes('No configuration file found'));
      expect(errorResult).toBeDefined();
      expect(errorResult?.severity).toBe('error');
    });

    it('should handle empty suffix correctly', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-empty-suffix-'));
      tempDirs.push(tempDir);

      fs.writeFileSync(path.join(tempDir, 'tgraph.config.ts'), '', 'utf-8');

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig({ suffix: '' });
      const results = await (validator as any).checkConfiguration(config);

      const suffixResult = results.find((r) => r.message.includes('API suffix configured'));
      expect(suffixResult?.severity).toBe('ok');
      expect(suffixResult?.message).toContain('(empty string)');
    });
  });

  describe('runDiagnostics', () => {
    it('should return a complete diagnostic report', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-full-'));
      tempDirs.push(tempDir);

      // Set up a valid environment
      fs.writeFileSync(path.join(tempDir, 'tgraph.config.ts'), '', 'utf-8');
      const schemaPath = path.join(tempDir, 'prisma', 'schema.prisma');
      fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
      fs.writeFileSync(schemaPath, 'model User { id Int @id }', 'utf-8');

      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const report: DiagnosticReport = await validator.runDiagnostics(config);

      expect(report.categories).toHaveLength(4);
      expect(report.categories[0].name).toBe('Configuration');
      expect(report.categories[1].name).toBe('Environment');
      expect(report.categories[2].name).toBe('Prisma Schema');
      expect(report.categories[3].name).toBe('Project Paths');
    });

    it('should detect errors in the report', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-errors-'));
      tempDirs.push(tempDir);

      // Create environment with errors (no config file, no schema)
      mockExec.mockRejectedValue(new Error('Command not found'));

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const report: DiagnosticReport = await validator.runDiagnostics(config);

      expect(report.hasErrors).toBe(true);
    });

    it('should detect warnings in the report', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-warnings-'));
      tempDirs.push(tempDir);

      // Set up valid config and schema, but missing directories
      fs.writeFileSync(path.join(tempDir, 'tgraph.config.ts'), '', 'utf-8');
      const schemaPath = path.join(tempDir, 'prisma', 'schema.prisma');
      fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
      fs.writeFileSync(schemaPath, 'model User { id Int @id }', 'utf-8');

      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const report: DiagnosticReport = await validator.runDiagnostics(config);

      expect(report.hasWarnings).toBe(true);
      expect(report.hasErrors).toBe(false);
    });

    it('should handle completely valid setup', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-valid-'));
      tempDirs.push(tempDir);

      // Set up completely valid environment
      fs.writeFileSync(path.join(tempDir, 'tgraph.config.ts'), '', 'utf-8');
      
      const schemaPath = path.join(tempDir, 'prisma', 'schema.prisma');
      fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
      fs.writeFileSync(schemaPath, 'model User { id Int @id }', 'utf-8');

      const dashboardPath = path.join(tempDir, 'src', 'dashboard', 'src');
      fs.mkdirSync(dashboardPath, { recursive: true });

      const dtosPath = path.join(tempDir, 'src', 'dtos', 'generated');
      fs.mkdirSync(dtosPath, { recursive: true });

      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const validator = new SystemValidator({
        execFn: mockExec as any,
        cwd: tempDir,
      });

      const config = createMockConfig();
      const report: DiagnosticReport = await validator.runDiagnostics(config);

      // May have some warnings (Node version check, etc) but should not have errors
      expect(report.hasErrors).toBe(false);
    });
  });
});

