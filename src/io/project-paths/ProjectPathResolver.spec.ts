import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Config } from '@tg-scripts/types';
import { ProjectPathResolver } from './ProjectPathResolver';

const baseConfig: Config = {
  schemaPath: 'schema.prisma',
  dashboardPath: 'dashboard',
  dtosPath: 'dtos',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
};

describe('ProjectPathResolver', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'project-path-resolver-'));
    fs.writeFileSync(path.join(tempDir, 'schema.prisma'), '// schema');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns configured app module path when provided', () => {
    const appModulePath = path.join(tempDir, 'apps', 'api', 'src', 'app.module.ts');
    fs.mkdirSync(path.dirname(appModulePath), { recursive: true });
    fs.writeFileSync(appModulePath, 'export class AppModule {}');

    const resolver = new ProjectPathResolver(
      {
        ...baseConfig,
        paths: {
          appModule: 'apps/api/src/app.module.ts',
        },
      },
      { workspaceRoot: tempDir },
    );

    expect(resolver.resolveAppModulePath()).toBe(appModulePath);
  });

  it('discovers app module path when not configured', () => {
    const defaultAppModule = path.join(tempDir, 'src', 'app.module.ts');
    fs.mkdirSync(path.dirname(defaultAppModule), { recursive: true });
    fs.writeFileSync(defaultAppModule, 'export class AppModule {}');

    const resolver = new ProjectPathResolver(baseConfig, { workspaceRoot: tempDir });

    expect(resolver.resolveAppModulePath()).toBe(defaultAppModule);
  });

  it('resolves module roots from configuration', () => {
    const featuresRoot = path.join(tempDir, 'packages', 'api', 'src', 'feature-modules');
    fs.mkdirSync(featuresRoot, { recursive: true });
    const resolver = new ProjectPathResolver(
      {
        ...baseConfig,
        paths: {
          moduleRoots: {
            features: ['packages/api/src/feature-modules'],
          },
        },
      },
      { workspaceRoot: tempDir },
    );

    const roots = resolver.resolveModuleRoots();
    expect(roots.features).toContain(featuresRoot);
  });

  it('resolves dashboard app component from configuration', () => {
    const appComponent = path.join(tempDir, 'dashboard', 'src', 'Shell.tsx');
    fs.mkdirSync(path.dirname(appComponent), { recursive: true });
    fs.writeFileSync(appComponent, 'export const Shell = () => null;');

    const resolver = new ProjectPathResolver(
      {
        ...baseConfig,
        dashboardPath: 'dashboard/src',
        paths: {
          dashboard: {
            appComponent: 'dashboard/src/Shell.tsx',
          },
        },
      },
      { workspaceRoot: tempDir },
    );

    expect(resolver.resolveDashboardAppComponentPath()).toBe(appComponent);
  });

  it('discovers data provider file within dashboard path', () => {
    const dataProvider = path.join(tempDir, 'dashboard', 'providers', 'dataProvider.ts');
    fs.mkdirSync(path.dirname(dataProvider), { recursive: true });
    fs.writeFileSync(dataProvider, 'export const dataProvider = {};');

    const resolver = new ProjectPathResolver(
      {
        ...baseConfig,
        dashboardPath: 'dashboard',
      },
      { workspaceRoot: tempDir },
    );

    expect(resolver.resolveDashboardDataProviderPath()).toBe(dataProvider);
  });
});
