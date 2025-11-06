import { findMatchingDelimiter, parseStringToArray } from '../utils';
import type { IParser } from '@tg-scripts/types';

interface Bounds {
  start: number;
  end: number;
  content: string;
}

interface ParseResult {
  tokens: string[];
  moduleBounds: Bounds | null;
  importsBounds: Bounds | null;
}

export class NestAppModuleParser implements IParser {
  /**
   * Find @Module decorator opening and closing brace positions
   */
  private findBounds(text: string, startRegex: RegExp, brackets: [string, string]): Bounds | null {
    const startMatch = text.match(startRegex);
    if (!startMatch) {
      return null;
    }

    const start = startMatch.index! + startMatch[0].length - 1; // -1 to point to opening brace
    const end = findMatchingDelimiter(text, start, brackets[0], brackets[1]);

    if (end === -1) {
      return null;
    }

    const content = text.substring(start + 1, end);

    return { start, end, content };
  }

  public parse(input: string): ParseResult {
    const moduleBounds = this.findBounds(input, /@Module\s*\(\s*\{/, ['{', '}']);
    if (!moduleBounds) {
      return { tokens: [], moduleBounds: null, importsBounds: null };
    }

    const importsBounds = this.findBounds(input, /imports:\s*\[/, ['[', ']']);
    if (!importsBounds) {
      return { tokens: [], moduleBounds: null, importsBounds: null };
    }

    const existingTokens = parseStringToArray(importsBounds.content);
    const filteredTokens = existingTokens.filter((token) => !token.startsWith('//'));
    return { tokens: filteredTokens, moduleBounds, importsBounds };
  }
}
