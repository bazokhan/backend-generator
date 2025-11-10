import type { Command, Option } from '@tg-scripts/parser/cli-parser/types';

export const buildHelpText = (command: Command): string => {
  let text = `tgraph ${command.name} [options]
Aliases: ${command.aliases.join(', ')}
Options:
${command.options?.map(buildOptionText).join('\n')}
${command.description}
`;
  return text;
};

export const buildOptionText = (option: Option): string => {
  return `  ${option.name}        ${option.description}${option.aliases.length > 0 ? ` (aliases: ${option.aliases.join(', ')})` : ''}\n`;
};
