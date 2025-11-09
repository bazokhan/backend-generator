import * as readline from 'readline';

export interface PromptUserOptions {
  /**
   * When true, the prompt will not wait for user input and will resolve immediately.
   */
  autoConfirm?: boolean;
  /**
   * Value returned when autoConfirm is enabled. Defaults to true.
   */
  defaultValue?: boolean;
}

/**
 * Prompt the user with a yes/no question
 * Returns true if the answer starts with 'y' or 'Y', false otherwise
 */
export function promptUser(question: string, options?: PromptUserOptions): Promise<boolean> {
  if (options?.autoConfirm) {
    const resolved = options.defaultValue ?? true;
    const trimmedQuestion = question.trim();
    const preview = trimmedQuestion.length > 0 ? ` "${trimmedQuestion}"` : '';
    console.log(`🤖 Non-interactive mode: auto-confirming${preview} with ${resolved ? 'yes' : 'no'}.`);
    return Promise.resolve(resolved);
  }

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

export interface PromptTextOptions {
  /** Default value to show and use on empty input */
  defaultValue?: string;
  /** When true, returns defaultValue without prompting */
  autoConfirm?: boolean;
}

/**
 * Prompt the user for a text input with an optional default.
 */
export function promptText(question: string, options?: PromptTextOptions): Promise<string> {
  const def = options?.defaultValue ?? '';
  if (options?.autoConfirm) {
    const trimmedQuestion = question.trim();
    const preview = trimmedQuestion.length > 0 ? ` "${trimmedQuestion}"` : '';
    console.log(`🤖 Non-interactive mode: auto-filling${preview} with default: ${def || '<empty>'}.`);
    return Promise.resolve(def);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = def ? `${question} [${def}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const res = answer.trim();
      resolve(res.length > 0 ? res : def);
    });
  });
}
