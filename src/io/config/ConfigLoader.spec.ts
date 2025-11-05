import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ConfigLoader, ConfigLoaderError } from './ConfigLoader';

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

    const configContent = `module.exports = { config: { schemaPath: 'schema.prisma', dashboardPath: 'dash', dtosPath: 'dtos', suffix: 'App' } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), configContent, 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });
    const config = loader.load();

    expect(config.schemaPath).toBe('schema.prisma');
    expect(config.dashboardPath).toBe('dash');
    expect(config.dtosPath).toBe('dtos');
    expect(config.suffix).toBe('App');
  });

  it('throws a ConfigLoaderError when required fields are missing', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-missing-'));
    tempDirs.push(tempDir);

    const invalidConfig = `module.exports = { config: { dashboardPath: 'dash', dtosPath: 'dtos', suffix: 'App' } };`;
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

    const configContent = `module.exports = { config: { schemaPath: 'schema.prisma', dashboardPath: 'dash', dtosPath: 'dtos', suffix: 'notPascal' } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), configContent, 'utf-8');

    // Temporarily restore console.warn to check if it was called
    const mockWarn = console.warn as jest.Mock;
    mockWarn.mockClear();

    const loader = new ConfigLoader({ cwd: tempDir });
    const config = loader.load();

    expect(config.suffix).toBe('notPascal');
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Config field 'suffix' should be PascalCase")
    );
  });

  it('throws ConfigLoaderError when schema file does not exist', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-no-schema-'));
    tempDirs.push(tempDir);

    const configContent = `module.exports = { config: { schemaPath: 'nonexistent.prisma', dashboardPath: 'dash', dtosPath: 'dtos', suffix: 'App' } };`;
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

    const configContent = `module.exports = { config: { schemaPath: 'schema.prisma', dashboardPath: 'dash', dtosPath: 'dtos', suffix: '' } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), configContent, 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });
    const config = loader.load();

    expect(config.suffix).toBe('');
  });

  it('throws ConfigLoaderError when suffix is undefined', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-no-suffix-'));
    tempDirs.push(tempDir);

    // Create a dummy schema file
    const schemaPath = path.join(tempDir, 'schema.prisma');
    fs.writeFileSync(schemaPath, 'model Test { id Int @id }', 'utf-8');

    const configContent = `module.exports = { config: { schemaPath: 'schema.prisma', dashboardPath: 'dash', dtosPath: 'dtos' } };`;
    fs.writeFileSync(path.join(tempDir, 'tgraph.config.js'), configContent, 'utf-8');

    const loader = new ConfigLoader({ cwd: tempDir });

    expect(() => loader.load()).toThrow(ConfigLoaderError);
    try {
      loader.load();
    } catch (error) {
      expect((error as ConfigLoaderError).cause).toBeDefined();
      expect(String((error as ConfigLoaderError).cause)).toMatch(/missing required field 'suffix'/);
    }
  });
});
