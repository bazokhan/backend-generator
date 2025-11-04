#!/usr/bin/env node

import type { Config } from '@tg-scripts/types';
import { ApiGenerator } from './generate-api';
import { DashboardGenerator } from './generate-dashboard';
import { DtoGenerator } from './generate-dtos';
import { config as defaultConfig } from './config';

type Command = 'api' | 'dashboard' | 'dtos' | 'all';

interface CliOptions extends Partial<Pick<Config, 'schemaPath' | 'dashboardPath' | 'dtosPath' | 'suffix'>> {
  updateDataProvider?: boolean;
  isAdmin?: boolean;
}

interface ParsedArguments {
  command?: Command | undefined;
  options: CliOptions;
  helpRequested: boolean;
}

function printHelp(): void {
  const helpText = `
schema-form-generator <command> [options]

Commands:
  api         Generate NestJS modules, services, controllers, and update data provider
  dashboard   Generate React Admin dashboard resources and field directive config
  dtos        Generate NestJS DTO files
  all         Run api, dashboard, and dtos generators sequentially

Options:
  --schema <path>              Override Prisma schema path
  --dashboard <path>           Override dashboard source directory
  --dtos <path>                Override DTO output directory
  --suffix <name>              Override suffix used for generated artifacts
  --admin                      Force admin mode (isAdmin = true)
  --no-admin                   Disable admin mode (isAdmin = false)
  --update-data-provider       Enable data provider updates
  --no-update-data-provider    Disable data provider updates
  -h, --help                   Display this help message
`;
  console.log(helpText.trim());
}

function parseArguments(args: string[]): ParsedArguments {
  const result: ParsedArguments = {
    command: undefined,
    options: {},
    helpRequested: false,
  };

  let index = 0;
  while (index < args.length) {
    const arg = args[index];
    switch (arg) {
      case '-h':
      case '--help':
        result.helpRequested = true;
        index += 1;
        continue;
      case '--schema': {
        if (index + 1 >= args.length) {
          console.error('Missing value for --schema option.');
          result.helpRequested = true;
          return result;
        }
        const value = args[index + 1];
        if (value !== undefined) {
          result.options.schemaPath = value;
        }
        index += 2;
        continue;
      }
      case '--dashboard': {
        if (index + 1 >= args.length) {
          console.error('Missing value for --dashboard option.');
          result.helpRequested = true;
          return result;
        }
        const value = args[index + 1];
        if (value !== undefined) {
          result.options.dashboardPath = value;
        }
        index += 2;
        continue;
      }
      case '--dtos': {
        if (index + 1 >= args.length) {
          console.error('Missing value for --dtos option.');
          result.helpRequested = true;
          return result;
        }
        const value = args[index + 1];
        if (value !== undefined) {
          result.options.dtosPath = value;
        }
        index += 2;
        continue;
      }
      case '--suffix': {
        if (index + 1 >= args.length) {
          console.error('Missing value for --suffix option.');
          result.helpRequested = true;
          return result;
        }
        const value = args[index + 1];
        if (value !== undefined) {
          result.options.suffix = value;
        }
        index += 2;
        continue;
      }
      case '--admin':
        result.options.isAdmin = true;
        index += 1;
        continue;
      case '--no-admin':
        result.options.isAdmin = false;
        index += 1;
        continue;
      case '--update-data-provider':
        result.options.updateDataProvider = true;
        index += 1;
        continue;
      case '--no-update-data-provider':
        result.options.updateDataProvider = false;
        index += 1;
        continue;
      default: {
        if (arg !== undefined && !result.command && !arg.startsWith('--')) {
          if (['api', 'dashboard', 'dtos', 'all'].includes(arg)) {
            result.command = arg as Command;
            index += 1;
            continue;
          }
        }
        console.error(`Unknown argument: ${arg ?? '<undefined>'}`);
        result.helpRequested = true;
        return result;
      }
    }
  }

  return result;
}

function resolveConfig(overrides: CliOptions): Config {
  const merged: Config = {
    ...defaultConfig,
    ...overrides,
    updateDataProvider:
      typeof overrides.updateDataProvider === 'boolean'
        ? overrides.updateDataProvider
        : defaultConfig.updateDataProvider ?? false,
    isAdmin: typeof overrides.isAdmin === 'boolean' ? overrides.isAdmin : defaultConfig.isAdmin ?? false,
  };

  return merged;
}

async function run(): Promise<void> {
  const { command, options, helpRequested } = parseArguments(process.argv.slice(2));

  if (helpRequested || !command) {
    printHelp();
    process.exit(helpRequested ? 0 : 1);
  }

  const runtimeConfig = resolveConfig(options);

  try {
    switch (command) {
      case 'api': {
        const generator = new ApiGenerator(runtimeConfig);
        await generator.generate();
        break;
      }
      case 'dashboard': {
        const generator = new DashboardGenerator(runtimeConfig);
        await generator.generate();
        break;
      }
      case 'dtos': {
        const generator = new DtoGenerator(runtimeConfig);
        generator.generate();
        break;
      }
      case 'all': {
        const apiGenerator = new ApiGenerator(runtimeConfig);
        await apiGenerator.generate();

        const dashboardGenerator = new DashboardGenerator(runtimeConfig);
        await dashboardGenerator.generate();

        const dtoGenerator = new DtoGenerator(runtimeConfig);
        dtoGenerator.generate();
        break;
      }
      default:
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ CLI execution failed:', error);
    process.exit(1);
  }
}

void run();
