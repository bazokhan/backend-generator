/**
 * Generalized function to find matching bracket/brace/parenthesis
 * @param content - The content to search in
 * @param startIndex - The index to start searching from
 * @param openChar - The opening character to search for
 * @param closeChar - The closing character to search for
 * @returns The index of the matching character or -1 if not found
 */
export function findMatchingDelimiter(
  content: string,
  startIndex: number,
  openChar: string,
  closeChar: string,
): number {
  let count = 0;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === openChar) count++;
    if (content[i] === closeChar) count--;
    if (count === 0) return i;
  }
  return -1;
}

/**
 * Find matching brace { }
 * @param content - The content to search in
 * @param startIndex - The index to start searching from
 * @returns The index of the matching character or -1 if not found
 */
export function findMatchingBrace(content: string, startIndex: number): number {
  return findMatchingDelimiter(content, startIndex, '{', '}');
}

/**
 * Find matching bracket [ ]
 * @param content - The content to search in
 * @param startIndex - The index to start searching from
 * @returns The index of the matching character or -1 if not found
 */
export function findMatchingBracket(content: string, startIndex: number): number {
  return findMatchingDelimiter(content, startIndex, '[', ']');
}

/**
 * Find matching parenthesis ( )
 * @param content - The content to search in
 * @param startIndex - The index to start searching from
 * @returns The index of the matching character or -1 if not found
 */
export function findMatchingParenthesis(content: string, startIndex: number): number {
  return findMatchingDelimiter(content, startIndex, '(', ')');
}

/**
 * Extracts top-level array elements from a string representation of an array.
 *
 * This function parses a string like "[a, b, c]" and returns ["a", "b", "c"].
 * It correctly handles:
 * - Nested structures (arrays, objects, parentheses)
 * - String literals with commas inside
 * - Top-level commas only (ignores commas in nested structures)
 *
 * @param content - The content inside the array brackets (e.g., "a, b, c")
 * @returns An array of strings representing the top-level elements
 *
 * @example
 * parseStringToArray("a, b, c")
 * @returns ["a", "b", "c"]
 *
 * @example
 * parseStringToArray('a, { x: "1,2,3", y: 4 }, c')
 * @returns ["a", "{ x: \"1,2,3\", y: 4 }", "c"]
 */
export function parseStringToArray(content?: string | null): string[] {
  if (!content) {
    return [];
  }

  const tokens: string[] = [];
  let currentToken = '';
  let depth = 0; // Track nesting depth
  let inString = false;
  let stringChar = '';
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    // Check if quote is escaped by counting consecutive backslashes
    let backslashCount = 0;
    let j = i - 1;
    while (j >= 0 && content[j] === '\\') {
      backslashCount++;
      j--;
    }
    const isEscapedQuote = backslashCount % 2 === 1;

    // Handle string literals
    if ((char === '"' || char === "'") && !isEscapedQuote && !inSingleLineComment && !inMultiLineComment) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    // Skip everything inside strings
    if (inString) {
      currentToken += char;
      i++;
      continue;
    }

    // Handle single-line comments (//)
    if (!inMultiLineComment && i + 1 < content.length && content[i] === '/' && content[i + 1] === '/') {
      inSingleLineComment = true;
      i += 2;
      continue;
    }

    // Handle multi-line comments (/* */)
    if (!inSingleLineComment && i + 1 < content.length && content[i] === '/' && content[i + 1] === '*') {
      inMultiLineComment = true;
      i += 2;
      continue;
    }

    // End single-line comment on newline
    if (inSingleLineComment && (char === '\n' || char === '\r')) {
      inSingleLineComment = false;
      // Handle \r\n (Windows line ending)
      if (char === '\r' && i + 1 < content.length && content[i + 1] === '\n') {
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // End multi-line comment
    if (inMultiLineComment && i + 1 < content.length && content[i] === '*' && content[i + 1] === '/') {
      inMultiLineComment = false;
      i += 2;
      continue;
    }

    // Skip everything inside comments
    if (inSingleLineComment || inMultiLineComment) {
      i++;
      continue;
    }

    // Track nesting depth (don't allow negative depth)
    if (char === '{' || char === '[' || char === '(') {
      depth++;
    } else if (char === '}' || char === ']' || char === ')') {
      if (depth > 0) depth--;
    }

    // Only split on commas at the top level (depth 0)
    if (char === ',' && depth === 0) {
      const trimmedToken = currentToken.trim();
      if (trimmedToken.length > 0) {
        tokens.push(trimmedToken);
      }
      currentToken = '';
      i++;
      continue;
    }

    currentToken += char;
    i++;
  }

  // Add the last token
  const trimmedToken = currentToken.trim();
  if (trimmedToken.length > 0) {
    tokens.push(trimmedToken);
  }

  // Filter out empty strings (consecutive commas, leading/trailing whitespace only)
  return tokens.filter((token) => token.length > 0);
}
