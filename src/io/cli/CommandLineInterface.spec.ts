import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '@tg-scripts/types';
import { ConfigLoader, ConfigLoaderError } from '../config/ConfigLoader';
import { CommandLineInterface } from './CommandLineInterface';
import { ApiGenerator } from '@tg-scripts/generator/api/ApiGenerator';
import { DashboardGenerator } from '@tg-scripts/generator/dashboard/DashboardGenerator';
import { DtoGenerator } from '@tg-scripts/generator/dto/DtoGenerator';

const apiGenerateMock = jest.fn<Promise<void>, []>();
const dashboardGenerateMock = jest.fn<Promise<void>, []>();
const dtoGenerateMock = jest.fn<void, []>();

jest.mock('@tg-scripts/generator/api/ApiGenerator', () => ({
  ApiGenerator: jest.fn().mockImplementation(() => ({ generate: apiGenerateMock })),
}));

jest.mock('@tg-scripts/generator/dashboard/DashboardGenerator', () => ({
  DashboardGenerator: jest.fn().mockImplementation(() => ({ generate: dashboardGenerateMock })),
}));

jest.mock('@tg-scripts/generator/dto/DtoGenerator', () => ({
  DtoGenerator: jest.fn().mockImplementation(() => ({ generate: dtoGenerateMock })),
}));

const SAMPLE_CONFIG: Config = {
  schemaPath: 'schema.prisma',
  dashboardPath: 'dashboard',
  dtosPath: 'dtos',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: false,
};

const ApiGeneratorMock = jest.mocked(ApiGenerator);
const DashboardGeneratorMock = jest.mocked(DashboardGenerator);
const DtoGeneratorMock = jest.mocked(DtoGenerator);

describe('CommandLineInterface', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    apiGenerateMock.mockResolvedValue(undefined);
    dashboardGenerateMock.mockResolvedValue(undefined);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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
    expect(runtimeConfig).toMatchObject({
      schemaPath: SAMPLE_CONFIG.schemaPath,
      dashboardPath: SAMPLE_CONFIG.dashboardPath,
      dtosPath: SAMPLE_CONFIG.dtosPath,
    });
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

  it('merges CLI overrides into runtime config', async () => {
    const loader = createLoaderMock();
    const cli = new CommandLineInterface({ configLoader: loader });

    const exitCode = await cli.run(['api', '--schema', 'custom.prisma', '--no-update-data-provider']);

    expect(exitCode).toBe(0);
    expect(loader.load).toHaveBeenCalled();
    const mergedConfig = ApiGeneratorMock.mock.calls[0]?.[0] as Config;
    expect(mergedConfig.schemaPath).toBe('custom.prisma');
    expect(mergedConfig.updateDataProvider).toBe(false);
    expect(apiGenerateMock).toHaveBeenCalled();
  });
});
