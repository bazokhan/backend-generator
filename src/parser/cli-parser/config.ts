import type { CliOption, Command, Option } from './types';

export const supportedOptions: Option[] = [
  {
    name: '--help',
    aliases: ['--help', '-h'],
    description: 'Show this help message',
    configKey: 'helpRequested',
    requiresValue: false,
  },
  {
    name: '--config',
    aliases: ['--config', '--file', '-f'],
    description: 'Path to configuration file',
    configKey: 'configPath',
    requiresValue: true,
  },
  {
    name: '--output',
    aliases: ['--output', '-o'],
    description: 'Output file name',
    configKey: 'initOutputPath',
    requiresValue: true,
  },
  {
    name: '--requireAdmin',
    aliases: ['--requireAdmin'],
    description: 'Default requireAdmin in generated config',
    configKey: 'initRequireAdmin',
    requiresValue: true,
  },
  {
    name: '--list',
    aliases: ['--list', '-l'],
    description: 'List available static modules with their output paths',
    configKey: 'staticList',
    requiresValue: false,
  },
  {
    name: '--include',
    aliases: ['--include'],
    description: 'Comma-separated list to include',
    configKey: 'staticInclude',
    requiresValue: true,
  },
  {
    name: '--cat',
    aliases: ['--cat', '--preview'],
    description: 'Preview the content of a specific static file',
    configKey: 'staticCat',
    requiresValue: true,
  },
  {
    name: '--skip-swagger',
    aliases: ['--skip-swagger'],
    description: 'Skip running the configured swagger generation command',
    configKey: 'skipSwagger',
    requiresValue: false,
  },
  {
    name: '--public',
    aliases: ['--public', '-p'],
    description: 'Override config to generate controllers without authentication guards',
    configKey: 'forcePublic',
    requiresValue: false,
  },
  {
    name: '--non-interactive',
    aliases: ['--non-interactive', '--yes', '-y'],
    description: 'Non-interactive defaults',
    configKey: 'nonInteractive',
    requiresValue: false,
  },
];

export const supportedCommands: Command[] = [
  {
    name: 'api',
    aliases: ['api'],
    description: 'Generate NestJS modules, services, controllers, and update data provider',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--config', '--public', '--non-interactive', '--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'dashboard',
    aliases: ['dashboard'],
    description: 'Generate React Admin dashboard resources and field directive config',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--config', '--public', '--non-interactive', '--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'dtos',
    aliases: ['dtos'],
    description: 'Generate NestJS DTO files',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--config', '--non-interactive', '--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'all',
    aliases: ['all'],
    description: 'Run api, dashboard, and dtos generators sequentially',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--config', '--public', '--non-interactive', '--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'init',
    aliases: ['init'],
    description: 'Initialize configuration file (tgraph.config.ts)',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--output', '--requireAdmin', '--non-interactive', '--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'doctor',
    aliases: ['doctor'],
    description: 'Run diagnostics to check environment and configuration',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'preflight',
    aliases: ['preflight', 'dry-run'],
    description: 'Analyze pending changes without modifying files',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'static',
    aliases: ['static'],
    description: 'Generate selectable static backend files',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--list', '--include', '--cat', '--non-interactive', '--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'types',
    aliases: ['types'],
    description: 'Generate dashboard API client types from swagger.json',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--skip-swagger', '--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'swagger',
    aliases: ['swagger'],
    description: 'Run the configured swagger generation command',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--help'];
      return options.includes(option.name);
    }),
  },
  {
    name: 'help',
    aliases: ['help'],
    description: 'Display this help message',
    options: supportedOptions.filter((option) => {
      const options: CliOption[] = ['--help'];
      return options.includes(option.name);
    }),
  },
];
