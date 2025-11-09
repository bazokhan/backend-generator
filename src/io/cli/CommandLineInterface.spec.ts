import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '@tg-scripts/types';
import type { PreflightReport } from '@tg-scripts/io/preflight/PreflightChecker';
import { ConfigLoader, ConfigLoaderError } from '../config/ConfigLoader';
import { CommandLineInterface } from './CommandLineInterface';
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));
import { execSync } from 'child_process';

// Mock user prompts to avoid interactive input in tests
jest.mock('@tg-scripts/io/utils/user-prompt', () => ({
  promptUser: jest.fn().mockResolvedValue(true),
  promptText: jest.fn().mockImplementation((_q: string, opts?: { defaultValue?: string }) => Promise.resolve(opts?.defaultValue ?? '')),
}));
import { ApiGenerator } from '@tg-scripts/generator/api/ApiGenerator';
import { DashboardGenerator } from '@tg-scripts/generator/dashboard/DashboardGenerator';
import { DtoGenerator } from '@tg-scripts/generator/dto/DtoGenerator';
import { SystemValidator } from '@tg-scripts/io/validation/SystemValidator';
import type { DiagnosticReport } from '@tg-scripts/io/validation/SystemValidator';

const apiGenerateMock = jest.fn<Promise<void>, []>();
const dashboardGenerateMock = jest.fn<Promise<void>, []>();
const dtoGenerateMock = jest.fn<void, []>();
const systemValidatorRunDiagnosticsMock = jest.fn<Promise<DiagnosticReport>, [Config]>();
const preflightRunMock = jest.fn<PreflightReport, []>();

jest.mock('@tg-scripts/generator/api/ApiGenerator', () => ({
  ApiGenerator: jest.fn().mockImplementation(() => ({ generate: apiGenerateMock })),
}));

jest.mock('@tg-scripts/generator/dashboard/DashboardGenerator', () => ({
  DashboardGenerator: jest.fn().mockImplementation(() => ({ generate: dashboardGenerateMock })),
}));

jest.mock('@tg-scripts/generator/dto/DtoGenerator', () => ({
  DtoGenerator: jest.fn().mockImplementation(() => ({ generate: dtoGenerateMock })),
}));

jest.mock('@tg-scripts/io/validation/SystemValidator', () => ({
  SystemValidator: jest.fn().mockImplementation(() => ({ runDiagnostics: systemValidatorRunDiagnosticsMock })),
}));
jest.mock('@tg-scripts/io/preflight/PreflightChecker', () => ({
  PreflightChecker: jest.fn().mockImplementation(() => ({ run: preflightRunMock })),
}));

const SAMPLE_CONFIG: Config = {
  input: {
    schemaPath: 'schema.prisma',
    prismaService: 'src/infrastructure/database/prisma.service.ts',
  },
  output: {
    backend: {
      dtos: 'dtos',
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
      root: 'dashboard',
      resources: 'dashboard/resources',
      swagger: {
        command: 'npm run generate:swagger',
        jsonPath: 'dashboard/types/swagger.json',
      },
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
    updateDataProvider: false,
    components: {
      form: {},
      display: {},
    },
  },
  behavior: {
    nonInteractive: false,
  },
};

const SAMPLE_PREFLIGHT_REPORT: PreflightReport = {
  appModule: { label: 'AppModule', resolvedPath: '/mock/app.module.ts', exists: true },
  dataProvider: { label: 'Data Provider', resolvedPath: '/mock/dataProvider.ts', exists: true },
  appComponent: { label: 'Dashboard App', resolvedPath: '/mock/App.tsx', exists: true },
  swagger: { label: 'Swagger JSON', resolvedPath: '/mock/swagger.json', exists: true, required: true },
  modules: [],
  dashboardResources: [],
  manualSteps: [],
  hasWarnings: false,
};

const ApiGeneratorMock = jest.mocked(ApiGenerator);
const DashboardGeneratorMock = jest.mocked(DashboardGenerator);
const DtoGeneratorMock = jest.mocked(DtoGenerator);
const SystemValidatorMock = jest.mocked(SystemValidator);
const execSyncMock = execSync as jest.MockedFunction<typeof execSync>;

describe('CommandLineInterface', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    apiGenerateMock.mockResolvedValue(undefined);
    dashboardGenerateMock.mockResolvedValue(undefined);
    systemValidatorRunDiagnosticsMock.mockResolvedValue({
      categories: [],
      hasErrors: false,
      hasWarnings: false,
    });
    preflightRunMock.mockReset();
    preflightRunMock.mockReturnValue(SAMPLE_PREFLIGHT_REPORT);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    execSyncMock.mockReset();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const createLoaderMock = (overrides: Partial<jest.Mocked<ConfigLoader>> = {}): jest.Mocked<ConfigLoader> => {
    const loader = {
      exists: jest.fn().mockReturnValue(true),
      getConfigFilePath: jest.fn().mockReturnValue(path.join(process.cwd(), 'tgraph.config.ts')),
      load: jest.fn().mockReturnValue(SAMPLE_CONFIG),
    } as unknown as jest.Mocked<ConfigLoader>;

    Object.assign(loader, overrides);

    return loader;
  };

  it('prints help and exits with 0 when --help is provided', async () => {
    const cli = new CommandLineInterface({ configLoader: createLoaderMock() });

    const exitCode = await cli.run(['--help']);

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('prints init subcommand help when tgraph init --help is provided', async () => {
    const cli = new CommandLineInterface({ configLoader: createLoaderMock() });
    const exitCode = await cli.run(['init', '--help']);
    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('tgraph init'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('--requireAdmin'));
  });

  it('returns exit code 1 when command is missing', async () => {
    const cli = new CommandLineInterface({ configLoader: createLoaderMock() });

    const exitCode = await cli.run([]);

    expect(exitCode).toBe(1);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('creates a configuration file on init when none exists', async () => {
    const writeFileMock = jest.fn();
    const loader = createLoaderMock({
      exists: jest.fn().mockReturnValue(false),
      getConfigFilePath: jest.fn().mockReturnValue(null),
    });

    const cli = new CommandLineInterface({
      configLoader: loader,
      fsModule: {
        ...fs,
        writeFileSync: writeFileMock,
      } as typeof fs,
    });

    const exitCode = await cli.run(['init']);

    expect(exitCode).toBe(0);
    expect(writeFileMock).toHaveBeenCalled();
  });

  it('does not overwrite configuration when init is executed twice', async () => {
    const loader = createLoaderMock({
      exists: jest.fn().mockReturnValue(true),
      getConfigFilePath: jest.fn().mockReturnValue('/existing/config'),
    });
    const writeFileMock = jest.fn();

    const cli = new CommandLineInterface({
      configLoader: loader,
      fsModule: {
        ...fs,
        writeFileSync: writeFileMock,
      } as typeof fs,
    });

    const exitCode = await cli.run(['init']);

    expect(exitCode).toBe(1);
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('runs the API generator when api command is provided', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    const exitCode = await cli.run(['api']);

    expect(exitCode).toBe(0);
    expect(loader.load).toHaveBeenCalled();
    expect(apiGenerateMock).toHaveBeenCalled();
    const runtimeConfig = ApiGeneratorMock.mock.calls[0]?.[0] as Config | undefined;
    expect(runtimeConfig?.input.schemaPath).toBe(SAMPLE_CONFIG.input.schemaPath);
    expect(runtimeConfig?.output.backend.dtos).toBe(SAMPLE_CONFIG.output.backend.dtos);
    expect(runtimeConfig?.output.dashboard.root).toBe(SAMPLE_CONFIG.output.dashboard.root);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('runs all generators sequentially when all command is provided', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    const exitCode = await cli.run(['all']);

    expect(exitCode).toBe(0);
    expect(apiGenerateMock).toHaveBeenCalledTimes(1);
    expect(dashboardGenerateMock).toHaveBeenCalledTimes(1);
    expect(dtoGenerateMock).toHaveBeenCalledTimes(1);
    expect(DashboardGeneratorMock).toHaveBeenCalledTimes(1);
    expect(DtoGeneratorMock).toHaveBeenCalledTimes(1);
  });

  it('runs preflight checker when preflight command is provided', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    const exitCode = await cli.run(['preflight']);

    expect(exitCode).toBe(0);
    expect(loader.load).toHaveBeenCalled();
    expect(preflightRunMock).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🧪 Running preflight analysis'));
  });

  it('aliases dry-run command to preflight', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    const exitCode = await cli.run(['dry-run']);

    expect(exitCode).toBe(0);
    expect(preflightRunMock).toHaveBeenCalled();
  });

  it('returns non-zero exit code when config loading fails', async () => {
    const loader = createLoaderMock({
      load: jest.fn(() => {
        throw new ConfigLoaderError('failed');
      }),
    });

    const cli = new CommandLineInterface({ configLoader: loader });

    const exitCode = await cli.run(['api']);

    expect(exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('enables non-interactive mode when --yes is provided', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    const exitCode = await cli.run(['dashboard', '--yes']);

    expect(exitCode).toBe(0);
    const mergedConfig = DashboardGeneratorMock.mock.calls[0]?.[0] as Config;
    expect(mergedConfig.behavior.nonInteractive).toBe(true);
  });

  it('lists static modules with tgraph static --list', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });
    const exitCode = await cli.run(['static', '--list']);
    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available static modules'));
  });

  it('runs swagger command before generating types', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({
      configLoader: loader,
      fsModule: {
        ...fs,
        existsSync: jest.fn().mockReturnValue(true),
      } as typeof fs,
    });
    execSyncMock.mockReturnValue(undefined as any);

    const exitCode = await cli.run(['types']);

    expect(exitCode).toBe(0);
    expect(execSyncMock).toHaveBeenCalledWith('npm run generate:swagger', expect.objectContaining({ cwd: expect.any(String), stdio: 'inherit' }));
    expect(execSyncMock).toHaveBeenCalledWith(expect.stringContaining('swagger-typescript-api'), expect.objectContaining({ cwd: expect.any(String), stdio: 'inherit' }));
  });

  it('skips swagger command when --skip-swagger is provided', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({
      configLoader: loader,
      fsModule: {
        ...fs,
        existsSync: jest.fn().mockReturnValue(true),
      } as typeof fs,
    });
    execSyncMock.mockReturnValue(undefined as any);

    const exitCode = await cli.run(['types', '--skip-swagger']);

    expect(exitCode).toBe(0);
    const commands = execSyncMock.mock.calls.map((call) => call[0]);
    expect(commands).toHaveLength(1);
    expect(commands[0]).toContain('swagger-typescript-api');
  });

  it('runs configured swagger command when tgraph swagger is executed', async () => {
    const loader = createLoaderMock();
    execSyncMock.mockReturnValue(undefined as any);
    const cli = new CommandLineInterface({ configLoader: loader });

    const exitCode = await cli.run(['swagger']);

    expect(exitCode).toBe(0);
    expect(execSyncMock).toHaveBeenCalledWith('npm run generate:swagger', expect.any(Object));
  });

  it('forces public mode when --public is provided', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });
    await cli.run(['api', '--public']);

    const runtimeConfig = ApiGeneratorMock.mock.calls[0]?.[0] as Config;
    expect(runtimeConfig.api.authentication.enabled).toBe(false);
    expect(runtimeConfig.api.authentication.requireAdmin).toBe(false);
  });

  it('forces interactive prompts when --interactive overrides config', async () => {
    const loader = createLoaderMock({
      load: jest.fn().mockReturnValue({
        ...SAMPLE_CONFIG,
        behavior: { ...SAMPLE_CONFIG.behavior, nonInteractive: true },
      }),
    });
    const cli = new CommandLineInterface({ configLoader: loader });

    const exitCode = await cli.run(['api', '--interactive']);

    expect(exitCode).toBe(0);
    const mergedConfig = ApiGeneratorMock.mock.calls[0]?.[0] as Config;
    expect(mergedConfig.behavior.nonInteractive).toBe(false);
  });
});

describe('CommandLineInterface - doctor command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const createLoaderMock = (overrides?: Partial<ConfigLoader>): ConfigLoader => {
    return {
      exists: jest.fn().mockReturnValue(true),
      load: jest.fn().mockReturnValue(SAMPLE_CONFIG),
      getConfigFilePath: jest.fn().mockReturnValue('tgraph.config.ts'),
      ...overrides,
    } as unknown as ConfigLoader;
  };

  it('runs doctor command successfully with all checks passing', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    systemValidatorRunDiagnosticsMock.mockResolvedValue({
      categories: [
        {
          name: 'Configuration',
          results: [
            { severity: 'ok', message: 'Config file found' },
            { severity: 'ok', message: 'Schema path configured' },
          ],
        },
        {
          name: 'Environment',
          results: [
            { severity: 'ok', message: 'Node version: 18.0.0' },
            { severity: 'ok', message: 'Prisma CLI installed' },
          ],
        },
      ],
      hasErrors: false,
      hasWarnings: false,
    });

    const exitCode = await cli.run(['doctor']);

    expect(exitCode).toBe(0);
    expect(SystemValidatorMock).toHaveBeenCalled();
    expect(systemValidatorRunDiagnosticsMock).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Running system diagnostics'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('All checks passed'));
  });

  it('runs doctor command with warnings but no errors', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    systemValidatorRunDiagnosticsMock.mockResolvedValue({
      categories: [
        {
          name: 'Configuration',
          results: [
            { severity: 'ok', message: 'Config file found' },
          ],
        },
        {
          name: 'Project Paths',
          results: [
            { severity: 'warning', message: 'Dashboard directory does not exist', suggestion: 'Will be created' },
          ],
        },
      ],
      hasErrors: false,
      hasWarnings: true,
    });

    const exitCode = await cli.run(['doctor']);

    expect(exitCode).toBe(0);
    expect(systemValidatorRunDiagnosticsMock).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('All critical checks passed'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1 warning'));
  });

  it('runs doctor command with errors', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    systemValidatorRunDiagnosticsMock.mockResolvedValue({
      categories: [
        {
          name: 'Configuration',
          results: [
            { severity: 'error', message: 'No configuration file found', suggestion: "Run 'tgraph init'" },
          ],
        },
        {
          name: 'Prisma Schema',
          results: [
            { severity: 'error', message: 'Schema file not found', suggestion: "Run 'npx prisma init'" },
          ],
        },
      ],
      hasErrors: true,
      hasWarnings: false,
    });

    const exitCode = await cli.run(['doctor']);

    expect(exitCode).toBe(1);
    expect(systemValidatorRunDiagnosticsMock).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Diagnostics failed'));
  });

  it('runs doctor without config file and reports error', async () => {
    const loader = createLoaderMock({
      load: jest.fn().mockImplementation(() => {
        throw new ConfigLoaderError('Configuration file not found');
      }),
    });
    const cli = new CommandLineInterface({ configLoader: loader });

    systemValidatorRunDiagnosticsMock.mockResolvedValue({
      categories: [
        {
          name: 'Configuration',
          results: [
            { severity: 'error', message: 'No configuration file found', suggestion: "Run 'tgraph init'" },
          ],
        },
      ],
      hasErrors: true,
      hasWarnings: false,
    });

    const exitCode = await cli.run(['doctor']);

    expect(exitCode).toBe(1);
    expect(systemValidatorRunDiagnosticsMock).toHaveBeenCalled();
    // Verify that it still runs diagnostics even when config is missing
    // (it uses a minimal default config internally just to run the checks)
    const callArg = systemValidatorRunDiagnosticsMock.mock.calls[0]?.[0] as Config | undefined;
    expect(callArg).toBeDefined();
    expect(callArg?.input.schemaPath).toBe('');
  });

  it('prints diagnostic categories with proper formatting', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    systemValidatorRunDiagnosticsMock.mockResolvedValue({
      categories: [
        {
          name: 'Configuration',
          results: [
            { severity: 'ok', message: 'Config file found' },
            { severity: 'warning', message: 'Suffix not PascalCase', suggestion: 'Use PascalCase' },
          ],
        },
      ],
      hasErrors: false,
      hasWarnings: true,
    });

    await cli.run(['doctor']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️ Configuration'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓ Config file found'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️ Suffix not PascalCase'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('💡 Use PascalCase'));
  });

  it('handles errors during diagnostic execution', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    systemValidatorRunDiagnosticsMock.mockRejectedValue(new Error('Diagnostic error'));

    const exitCode = await cli.run(['doctor']);

    expect(exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error running diagnostics'), expect.any(Error));
  });

  it('counts warnings correctly in output', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    systemValidatorRunDiagnosticsMock.mockResolvedValue({
      categories: [
        {
          name: 'Category 1',
          results: [
            { severity: 'warning', message: 'Warning 1' },
            { severity: 'warning', message: 'Warning 2' },
          ],
        },
        {
          name: 'Category 2',
          results: [
            { severity: 'warning', message: 'Warning 3' },
            { severity: 'ok', message: 'OK message' },
          ],
        },
      ],
      hasErrors: false,
      hasWarnings: true,
    });

    await cli.run(['doctor']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('3 warnings'));
  });
});
