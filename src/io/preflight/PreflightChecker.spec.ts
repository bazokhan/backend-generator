import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Config } from '@tg-scripts/types';
import { PreflightChecker } from './PreflightChecker';

const baseConfig: Config = {
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
      root: 'dashboard/src',
      resources: 'dashboard/src/resources',
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

const PRISMA_CONTENT = `
// @tg_form()
model User {
  id String @id
  email String
}

// @tg_form()
model Post {
  id String @id
  title String
}
`;

describe('PreflightChecker', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-checker-'));
    fs.mkdirSync(path.join(tempDir, 'prisma'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'prisma', 'schema.prisma'), PRISMA_CONTENT);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports ready modules and missing swagger file', () => {
    const appModulePath = path.join(tempDir, 'src', 'app.module.ts');
    fs.mkdirSync(path.dirname(appModulePath), { recursive: true });
    fs.writeFileSync(appModulePath, 'export class AppModule {}');

    const userModulePath = path.join(tempDir, 'src', 'features', 'user');
    const postModulePath = path.join(tempDir, 'src', 'features', 'post');
    fs.mkdirSync(userModulePath, { recursive: true });
    fs.mkdirSync(postModulePath, { recursive: true });
    fs.writeFileSync(path.join(userModulePath, 'user.module.ts'), 'export class UserModule {}');
    fs.writeFileSync(path.join(postModulePath, 'post.module.ts'), 'export class PostModule {}');

    const dataProviderPath = path.join(tempDir, 'dashboard', 'src', 'providers');
    fs.mkdirSync(dataProviderPath, { recursive: true });
    fs.writeFileSync(path.join(dataProviderPath, 'dataProvider.ts'), 'export const dataProvider = {};');

    const appComponentPath = path.join(tempDir, 'dashboard', 'src');
    fs.mkdirSync(appComponentPath, { recursive: true });
    fs.writeFileSync(path.join(appComponentPath, 'App.tsx'), 'export const App = () => null;');

    const checker = new PreflightChecker(baseConfig, { workspaceRoot: tempDir });
    const report = checker.run();

    expect(report.appModule.exists).toBe(true);
    expect(report.dataProvider.exists).toBe(true);
    expect(report.appComponent.exists).toBe(true);
    expect(report.modules.every((module) => module.status === 'ready')).toBe(true);
    expect(report.dashboardResources.every((resource) => resource.exists === false)).toBe(true);
    expect(report.swagger.exists).toBe(false);
    expect(report.manualSteps.some((step) => step.message.includes('Swagger JSON'))).toBe(true);
  });

  it('highlights missing modules and dashboard artifacts', () => {
    const checker = new PreflightChecker(baseConfig, { workspaceRoot: tempDir });
    const report = checker.run();

    expect(report.appModule.exists).toBe(false);
    expect(report.dataProvider.exists).toBe(false);
    expect(report.appComponent.exists).toBe(false);
    expect(report.modules.every((module) => module.status === 'missing-directory')).toBe(true);
    expect(report.modules[0]?.pendingDirectory).toContain(path.join(tempDir, 'src', 'features'));
    expect(report.manualSteps.some((step) => step.message.includes('AppModule not found'))).toBe(true);
    expect(report.manualSteps.some((step) => step.message.includes('data provider'))).toBe(true);
    expect(report.manualSteps.some((step) => step.message.includes('Dashboard App component'))).toBe(true);
  });
});
