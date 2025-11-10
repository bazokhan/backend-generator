export type CliCommand =
  | 'init'
  | 'doctor'
  | 'preflight'
  | 'api'
  | 'dashboard'
  | 'dtos'
  | 'all'
  | 'static'
  | 'types'
  | 'swagger'
  | 'help';

export interface Command {
  name: CliCommand;
  aliases: string[];
  description: string;
  options?: Option[];
}

export type CliOption =
  | '--help'
  | '--config'
  | '--output'
  | '--requireAdmin'
  | '--list'
  | '--include'
  | '--cat'
  | '--skip-swagger'
  | '--public'
  | '--non-interactive';

export type ConfigKey =
  | 'helpRequested'
  | 'configPath'
  | 'initOutputPath'
  | 'initRequireAdmin'
  | 'staticList'
  | 'staticInclude'
  | 'staticCat'
  | 'skipSwagger'
  | 'forcePublic'
  | 'nonInteractive';

export interface Option {
  name: CliOption;
  aliases: string[];
  description: string;
  configKey: ConfigKey;
  requiresValue: boolean;
}

export type CliParsedOptions = {
  [K in ConfigKey]?: boolean | string | undefined;
};

export interface ParsedArguments {
  command?: CliCommand;
  options: CliParsedOptions;
  errors: string[];
}
