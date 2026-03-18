import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '@tg-scripts/types';
import { ProjectPathResolver } from '../../io/project-paths/ProjectPathResolver';

/**
 * Scaffolds the dashboard Vite/React project structure if it doesn't already exist.
 *
 * All scaffold files are idempotent — if a file already exists it is skipped, so
 * user customisations are never overwritten.  Running `tgraph dashboard` or
 * `tgraph all` multiple times is therefore safe.
 *
 * Files created (only when absent):
 *   {projectRoot}/package.json
 *   {projectRoot}/tsconfig.json
 *   {projectRoot}/vite.config.ts
 *   {projectRoot}/index.html
 *   {projectRoot}/src/main.tsx
 *   {projectRoot}/src/App.tsx          — config-aware (auth wiring, correct API prefix)
 *   {projectRoot}/src/providers/authProvider.ts  — only when authenticationEnabled
 */
export class DashboardScaffolder {
  private readonly config: Config;
  private readonly workspaceRoot: string;
  /** Absolute path to the dashboard source dir (e.g. /abs/.../src/dashboard/src) */
  private readonly dashboardAbsolutePath: string;
  /** Absolute path to the Vite project root (one level above the source dir) */
  private readonly dashboardProjectRoot: string;

  constructor(config: Config) {
    this.config = config;
    this.workspaceRoot = process.cwd();
    const resolver = new ProjectPathResolver(config, { workspaceRoot: this.workspaceRoot });
    this.dashboardAbsolutePath = resolver.getDashboardRoot();
    this.dashboardProjectRoot = path.dirname(this.dashboardAbsolutePath);
  }

  scaffold(): void {
    const auth = this.config.api.authenticationEnabled as boolean;
    const prefix = this.config.api.prefix as string;

    console.log('🏗️  Scaffolding dashboard project...');

    // Ensure NestJS tsconfig.build.json excludes the dashboard directory
    const dashboardRelPath = path.relative(this.workspaceRoot, this.dashboardProjectRoot).replace(/\\/g, '/');
    this.createIfAbsent(
      path.join(this.workspaceRoot, 'tsconfig.build.json'),
      this.buildNestTsConfigBuild(dashboardRelPath),
    );

    this.createIfAbsent(path.join(this.dashboardProjectRoot, 'package.json'), this.buildPackageJson());
    this.createIfAbsent(path.join(this.dashboardProjectRoot, 'tsconfig.json'), this.buildTsConfig());
    this.createIfAbsent(path.join(this.dashboardProjectRoot, 'vite.config.ts'), this.buildViteConfig());
    this.createIfAbsent(path.join(this.dashboardProjectRoot, 'index.html'), this.buildIndexHtml());
    this.createIfAbsent(path.join(this.dashboardAbsolutePath, 'main.tsx'), this.buildMainTsx());
    this.createIfAbsent(path.join(this.dashboardAbsolutePath, 'App.tsx'), this.buildAppTsx(prefix, auth));

    if (auth) {
      this.createIfAbsent(
        path.join(this.dashboardAbsolutePath, 'providers', 'authProvider.ts'),
        this.buildAuthProvider(),
      );
    }

    console.log('✅ Dashboard scaffold ready');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private createIfAbsent(filePath: string, content: string): void {
    if (fs.existsSync(filePath)) {
      return; // Skip — already exists, user may have customised it
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    const rel = path.relative(this.workspaceRoot, filePath).replace(/\\/g, '/');
    console.log(`   ✨ Created: ${rel}`);
  }

  private buildNestTsConfigBuild(dashboardRelPath: string): string {
    return (
      JSON.stringify(
        {
          extends: './tsconfig.json',
          compilerOptions: { rootDir: 'src', incremental: false },
          include: ['src'],
          exclude: ['node_modules', 'dist', `${dashboardRelPath}/**`],
        },
        null,
        2,
      ) + '\n'
    );
  }

  private buildPackageJson(): string {
    return (
      JSON.stringify(
        {
          name: 'dashboard',
          version: '0.0.1',
          private: true,
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview',
          },
          dependencies: {
            react: '^18.3.1',
            'react-admin': '^5.3.4',
            'react-dom': '^18.3.1',
            'ra-data-simple-rest': '^5.3.4',
          },
          devDependencies: {
            '@types/react': '^18.3.12',
            '@types/react-dom': '^18.3.1',
            '@vitejs/plugin-react': '^4.3.3',
            typescript: '^5.6.3',
            vite: '^5.4.10',
          },
        },
        null,
        2,
      ) + '\n'
    );
  }

  private buildTsConfig(): string {
    return (
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
            noUnusedLocals: false,
            noUnusedParameters: false,
            noFallthroughCasesInSwitch: true,
          },
          include: ['src'],
        },
        null,
        2,
      ) + '\n'
    );
  }

  private buildViteConfig(): string {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
`;
  }

  private buildIndexHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  }

  private buildMainTsx(): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;
  }

  private buildAppTsx(prefix: string, auth: boolean): string {
    const baseUrl = `http://localhost:3000/${prefix}`;

    if (!auth) {
      return `import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';

const dataProvider = simpleRestProvider('${baseUrl}');

// AUTO-GENERATED IMPORTS START
// AUTO-GENERATED IMPORTS END

export const App = () => (
  <Admin dataProvider={dataProvider}>
    {/* AUTO-GENERATED RESOURCES START */}
    {/* AUTO-GENERATED RESOURCES END */}
  </Admin>
);

export default App;
`;
    }

    return `import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import { authProvider } from './providers/authProvider';

const httpClient = (url: string, options: any = {}) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    options.headers = new Headers(options.headers);
    options.headers.set('Authorization', \`Bearer \${token}\`);
  }
  return fetch(url, options).then(async (response) => {
    const body = await response.json();
    return { status: response.status, headers: response.headers, body: JSON.stringify(body), json: body };
  });
};

const dataProvider = simpleRestProvider('${baseUrl}', httpClient);

// AUTO-GENERATED IMPORTS START
// AUTO-GENERATED IMPORTS END

export const App = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    {/* AUTO-GENERATED RESOURCES START */}
    {/* AUTO-GENERATED RESOURCES END */}
  </Admin>
);

export default App;
`;
  }

  private buildAuthProvider(): string {
    return `export const authProvider = {
  login: async ({ username, password }: { username: string; password: string }) => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });

    if (!response.ok) throw new Error('Invalid credentials');

    const data = await response.json();
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  },

  logout: async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  checkAuth: async () => {
    if (!localStorage.getItem('auth_token')) throw new Error('Not authenticated');
  },

  checkError: async (error: { status?: number }) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('auth_token');
      throw new Error('Session expired');
    }
  },

  getIdentity: async () => {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    return { id: user.id, fullName: user.name };
  },

  getPermissions: async () => null,
};
`;
  }
}
