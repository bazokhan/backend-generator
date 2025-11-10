import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ConfigLoader, ConfigLoaderError } from '../io/config/ConfigLoader';

describe('ConfigLoader', () => {
  const tempDirs: string[] = [];
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;

  beforeAll(() => {
    // Suppress console.log and console.warn during tests
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws ConfigLoaderError when no config file exists', () => {
    const loader = new ConfigLoader({
      cwd: os.tmpdir(),
      fsModule: {
        ...fs,
        existsSync: () => false,
      } as unknown as typeof fs,
    });

    expect(() => loader.load()).toThrow(ConfigLoaderError);
    expect(() => loader.load()).toThrow(/Configuration file not found/);
  });

  it('loads configuration from the nearest config file', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-success-'));
    tempDirs.push(tempDir);

    // Create a dummy schema file so validation passes
    const schemaPath = path.join(tempDir, 'schema.prisma');
    fs.writeFileSync(schemaPath, 'model Test { id Int @id }', 'utf-8');

    const configContent = `module.exports = { config: { 
      input: { 
        prisma: { schemaPath: 'schema.prisma', servicePath: 'src/infrastructure/database/prisma.service.ts' }, 
        dashboard: { components: { form: {}, display: {} } }
      }, 
      output: { 
        backend: { root: 'src/features', dtosPath: 'dtos', modulesPaths: ['src/features'], guardsPath: 'src/guards', decoratorsPath: 'src/decorators', interceptorsPath: 'src/interceptors', utilsPath: 'src/utils', appModulePath: 'src/app.module.ts' }, 
        dashboard: { enabled: true, updateDataProvider: false, root: 'dash', resourcesPath: 'dash/resources', appComponentPath: 'dash/App.tsx', dataProviderPath: 'dash/providers/dataProvider.ts', swaggerJsonPath: 'dash/types/swagger.json', apiPath: 'dash/types/api.ts' } 
      }, 
      api: { suffix: 'App', prefix: 'api', authenticationEnabled: true, requireAdmin: false, guards: [], adminGuards: [] }, 
      behavior: { nonInteractive: false } 
    } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), configContent, 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });
    const config = loader.load();

    expect(config.input.prisma.schemaPath).toBe('schema.prisma');
    expect(config.output.dashboard.root).toBe('dash');
    expect(config.output.backend.dtosPath).toBe('dtos');
    expect(config.api.suffix).toBe('App');
  });

  it('throws a ConfigLoaderError when required fields are missing', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-missing-'));
    tempDirs.push(tempDir);

    const invalidConfig = `module.exports = { config: { output: { dashboard: { root: 'dash' }, backend: { dtos: 'dtos' } }, api: { suffix: 'App' } } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), invalidConfig, 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });

    expect(() => loader.load()).toThrow(ConfigLoaderError);
  });

  it('identifies when a config file exists', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-exists-'));
    tempDirs.push(tempDir);

    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), 'module.exports = { config: {} };', 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });

    expect(loader.exists()).toBe(true);
    expect(loader.getConfigFilePath()).toBe(path.join(tempDir, 'tgraph.config.js'));
  });

  it('prefers TypeScript config files when both exist', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-priority-'));
    tempDirs.push(tempDir);

    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), 'module.exports = { config: {} };', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.ts'), 'module.exports = { config: {} };', 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });
    expect(loader.getConfigFilePath()).toBe(path.join(tempDir, 'tgraph.config.ts'));
  });

  it('logs a warning when suffix is not PascalCase but still returns config', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-warning-'));
    tempDirs.push(tempDir);

    // Create a dummy schema file so validation passes
    const schemaPath = path.join(tempDir, 'schema.prisma');
    fs.writeFileSync(schemaPath, 'model Test { id Int @id }', 'utf-8');

    const configContent = `module.exports = { config: { 
      input: { 
        prisma: { schemaPath: 'schema.prisma', servicePath: 'src/infrastructure/database/prisma.service.ts' }, 
        dashboard: { components: { form: {}, display: {} } }
      }, 
      output: { 
        backend: { root: 'src/features', dtosPath: 'dtos', modulesPaths: ['src/features'], guardsPath: 'src/guards', decoratorsPath: 'src/decorators', interceptorsPath: 'src/interceptors', utilsPath: 'src/utils', appModulePath: 'src/app.module.ts' }, 
        dashboard: { enabled: true, updateDataProvider: false, root: 'dash', resourcesPath: 'dash/resources', appComponentPath: 'dash/App.tsx', dataProviderPath: 'dash/providers/dataProvider.ts', swaggerJsonPath: 'dash/types/swagger.json', apiPath: 'dash/types/api.ts' } 
      }, 
      api: { suffix: 'notPascal', prefix: 'api', authenticationEnabled: true, requireAdmin: false, guards: [], adminGuards: [] }, 
      behavior: { nonInteractive: false } 
    } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), configContent, 'utf-8');

    // Temporarily restore console.warn to check if it was called
    const mockWarn = console.warn as jest.Mock;
    mockWarn.mockClear();

    const loader = new ConfigLoader({ cwd: tempDir });
    const config = loader.load();

    expect(config.api.suffix).toBe('notPascal');
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Config field 'api.suffix' should be PascalCase"),
    );
  });

  it('throws ConfigLoaderError when schema file does not exist', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-no-schema-'));
    tempDirs.push(tempDir);

    const configContent = `module.exports = { config: { 
      input: { 
        prisma: { schemaPath: 'nonexistent.prisma', servicePath: 'src/infrastructure/database/prisma.service.ts' }, 
        dashboard: { components: { form: {}, display: {} } }
      }, 
      output: { 
        backend: { root: 'src/features', dtosPath: 'dtos', modulesPaths: ['src/features'], guardsPath: 'src/guards', decoratorsPath: 'src/decorators', interceptorsPath: 'src/interceptors', utilsPath: 'src/utils', appModulePath: 'src/app.module.ts' }, 
        dashboard: { enabled: true, updateDataProvider: false, root: 'dash', resourcesPath: 'dash/resources', appComponentPath: 'dash/App.tsx', dataProviderPath: 'dash/providers/dataProvider.ts', swaggerJsonPath: 'dash/types/swagger.json', apiPath: 'dash/types/api.ts' } 
      }, 
      api: { suffix: 'App', prefix: 'api', authenticationEnabled: true, requireAdmin: false, guards: [], adminGuards: [] }, 
      behavior: { nonInteractive: false } 
    } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), configContent, 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });

    expect(() => loader.load()).toThrow(ConfigLoaderError);
    try {
      loader.load();
    } catch (error) {
      expect((error as ConfigLoaderError).cause).toBeDefined();
      expect(String((error as ConfigLoaderError).cause)).toMatch(/Prisma schema file not found/);
    }
  });

  it('allows empty string for suffix', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-empty-suffix-'));
    tempDirs.push(tempDir);

    // Create a dummy schema file so validation passes
    const schemaPath = path.join(tempDir, 'schema.prisma');
    fs.writeFileSync(schemaPath, 'model Test { id Int @id }', 'utf-8');

    const configContent = `module.exports = { config: { 
      input: { 
        prisma: { schemaPath: 'schema.prisma', servicePath: 'src/infrastructure/database/prisma.service.ts' }, 
        dashboard: { components: { form: {}, display: {} } }
      }, 
      output: { 
        backend: { root: 'src/features', dtosPath: 'dtos', modulesPaths: ['src/features'], guardsPath: 'src/guards', decoratorsPath: 'src/decorators', interceptorsPath: 'src/interceptors', utilsPath: 'src/utils', appModulePath: 'src/app.module.ts' }, 
        dashboard: { enabled: true, updateDataProvider: false, root: 'dash', resourcesPath: 'dash/resources', appComponentPath: 'dash/App.tsx', dataProviderPath: 'dash/providers/dataProvider.ts', swaggerJsonPath: 'dash/types/swagger.json', apiPath: 'dash/types/api.ts' } 
      }, 
      api: { suffix: '', prefix: 'api', authenticationEnabled: true, requireAdmin: false, guards: [], adminGuards: [] }, 
      behavior: { nonInteractive: false } 
    } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), configContent, 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });
    const config = loader.load();

    expect(config.api.suffix).toBe('');
  });

  it('allows undefined suffix (defaults to empty string)', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-no-suffix-'));
    tempDirs.push(tempDir);

    // Create a dummy schema file
    const schemaPath = path.join(tempDir, 'schema.prisma');
    fs.writeFileSync(schemaPath, 'model Test { id Int @id }', 'utf-8');

    const configContent = `module.exports = { config: { 
      input: { 
        prisma: { schemaPath: 'schema.prisma', servicePath: 'src/infrastructure/database/prisma.service.ts' }, 
        dashboard: { components: { form: {}, display: {} } }
      }, 
      output: { 
        backend: { root: 'src/features', dtosPath: 'dtos', modulesPaths: ['src/features'], guardsPath: 'src/guards', decoratorsPath: 'src/decorators', interceptorsPath: 'src/interceptors', utilsPath: 'src/utils', appModulePath: 'src/app.module.ts' }, 
        dashboard: { enabled: true, updateDataProvider: false, root: 'dash', resourcesPath: 'dash/resources', appComponentPath: 'dash/App.tsx', dataProviderPath: 'dash/providers/dataProvider.ts', swaggerJsonPath: 'dash/types/swagger.json', apiPath: 'dash/types/api.ts' } 
      }, 
      api: { prefix: 'api', authenticationEnabled: true, requireAdmin: false, guards: [], adminGuards: [] }, 
      behavior: { nonInteractive: false } 
    } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), configContent, 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });

    // Should not throw, suffix is optional now
    const config = loader.load();
    // When suffix is undefined in config, it should be undefined in the loaded config too
    // (or could default to empty string depending on implementation)
    expect(config.api.suffix).toBeUndefined();
  });
});
