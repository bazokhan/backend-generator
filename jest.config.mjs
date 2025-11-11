import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read and parse tsconfig.json (handling comments)
const tsconfigPath = join(__dirname, 'tsconfig.json');
const tsconfigContent = readFileSync(tsconfigPath, 'utf8');
const tsconfigJson = tsconfigContent.replace(/\/\/.*$/gm, '');
const { compilerOptions } = JSON.parse(tsconfigJson);

// Build module name mapper from tsconfig paths
const moduleNameMapper = {};
if (compilerOptions.paths) {
  const baseUrl = compilerOptions.baseUrl || '.';
  for (const [alias, paths] of Object.entries(compilerOptions.paths)) {
    const pathPattern = Array.isArray(paths) ? paths[0] : paths;
    const regex = `^${alias.replace(/\*/g, '(.*)')}$`;
    const replacement = pathPattern.replace(/\*/g, '$1').replace(/\.d\.ts$/, '');
    // Resolve the full path including baseUrl
    const fullPath = join(baseUrl, replacement).replace(/\\/g, '/');
    moduleNameMapper[regex] = `<rootDir>/${fullPath}`;
  }
}

const config = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        sourceMaps: 'inline',
        module: {
          type: 'commonjs',
        },
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          target: 'es2020',
          keepClassNames: true,
          baseUrl: compilerOptions.baseUrl || '.',
          paths: compilerOptions.paths || {},
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper,
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs|tslib)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.tsx',
    '!src/**/*.test.tsx',
    '!src/bin/**',
    '!src/types/**',
    '!dist/**',
    '!node_modules/**',
    '!__mocks__/**',
    '!__snapshots__/**',
    '!jest.config.mjs',
  ],
};

export default config;
