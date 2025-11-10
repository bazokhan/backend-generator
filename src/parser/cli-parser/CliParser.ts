import type { IParser } from '@tg-scripts/types';
import { supportedCommands, supportedOptions } from './config';
import type { ParsedArguments } from './types';

export class CliParser implements IParser {
  private readNextValue(
    args: string[],
    index: number,
    assign: (value: string) => void,
    parsed: ParsedArguments,
  ): number {
    if (index + 1 >= args.length) {
      parsed.errors.push(`Missing value for ${args[index]} option.`);
      return args.length;
    }

    const value = args[index + 1];
    if (value !== undefined) {
      assign(value);
    }

    return index + 2;
  }

  public parse(args: string[]): ParsedArguments {
    const parsed: ParsedArguments = {
      options: {},
      errors: [],
    };

    let index = 0;
    while (index < args.length) {
      const arg = args[index];

      let optionMatched = false;
      for (const option of supportedOptions) {
        if (arg && option.aliases.includes(arg)) {
          optionMatched = true;
          if (option.requiresValue) {
            index = this.readNextValue(
              args,
              index,
              (value: string) => (parsed.options[option.configKey as keyof typeof parsed.options] = value),
              parsed,
            );
            break;
          } else {
            parsed.options[option.configKey as keyof typeof parsed.options] = true;
            index += 1;
            break;
          }
        }
      }
      if (optionMatched) {
        continue;
      }

      if (arg?.startsWith('--')) {
        parsed.errors.push(`Unknown option: ${arg}`);
        index += 1;
        continue;
      }

      if (!parsed.command && arg !== undefined) {
        const command = supportedCommands.find((c) => c.aliases.includes(arg));
        if (command) {
          parsed.command = command.name;
          index += 1;
          continue;
        }
      }

      parsed.errors.push(`Unknown argument: ${arg ?? '<undefined>'}`);
      index += 1;
    }

    return parsed;
  }
}
