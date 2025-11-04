import * as readline from 'readline';

/**
 * Prompt the user with a yes/no question
 * Returns true if the answer starts with 'y' or 'Y', false otherwise
 */
export function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase().startsWith('y'));
    });
  });
}
