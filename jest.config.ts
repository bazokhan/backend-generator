/** @jest-config-loader esbuild-register */
import type { Config } from 'jest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read and parse tsconfig.json (handling comments)
const tsconfigPath = join(__dirname, 'tsconfig.json');
const tsconfigContent = readFileSync(tsconfigPath, 'utf8');
const tsconfigJson = tsconfigContent.replace(/\/\/.*$/gm, '');
const { compilerOptions } = JSON.parse(tsconfigJson);

// Build module name mapper from tsconfig paths
const moduleNameMapper: Record<string, string> = {};
if (compilerOptions.paths) {
  const baseUrl = compilerOptions.baseUrl || '.';
  for (const [alias, paths] of Object.entries(compilerOptions.paths)) {
    const pathPattern = Array.isArray(paths) ? paths[0] : paths;
    const regex = `^${alias.replace(/\*/g, '(.*)')}$`;
    const replacement = pathPattern.replace(/\*/g, '$1').replace(/\.d\.ts$/, '');
    moduleNameMapper[regex] = `<rootDir>/${replacement}`;
  }
}

const config: Config = {
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
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!dist/**',
    '!node_modules/**',
    '!__mocks__/**',
    '!__snapshots__/**',
  ],
};

export default config;
