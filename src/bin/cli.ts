#!/usr/bin/env node

import { CommandLineInterface } from '@tg-scripts/io/cli/CommandLineInterface';
import { CliParser } from '@tg-scripts/parser/cli-parser/CliParser';

async function main(): Promise<void> {
  const cliParser = new CliParser();
  const cli = new CommandLineInterface({ cliParser });
  const exitCode = await cli.run(process.argv.slice(2));
  process.exit(exitCode);
}

void main().catch((error) => {
  console.error('❌ Unexpected CLI failure:', error);
  process.exit(1);
});
