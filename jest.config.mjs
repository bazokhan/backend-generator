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
    moduleNameMapper[regex] = `<rootDir>/${replacement}`;
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
  moduleNameMapper: {
    '^@tg-scripts/types$': '<rootDir>/types',
    ...moduleNameMapper,
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/*.spec.tsx',
    '!**/*.test.tsx',
    '!dist/**',
    '!node_modules/**',
    '!__mocks__/**',
    '!__snapshots__/**',
    '!cli.ts',
    '!config.ts',
    '!jest.config.mjs',
    '!index.ts',
  ],
};

export default config;
