#!/usr/bin/env node

import { CommandLineInterface } from '../io/cli/CommandLineInterface';

async function main(): Promise<void> {
  const cli = new CommandLineInterface();
  const exitCode = await cli.run(process.argv.slice(2));
  process.exit(exitCode);
}

void main().catch((error) => {
  console.error('❌ Unexpected CLI failure:', error);
  process.exit(1);
});
