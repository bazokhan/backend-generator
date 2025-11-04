import { toCamelCase, toKebabCase } from './generator/utils';
import type { GeneratedModuleFolder } from '@tg-scripts/types';
import { NestAppModuleParser } from './parser/nest-app-module-parser/NestAppModuleParser';

/**
 * Parse import statements from an auto-generated block
 */
export function parseImportEntries(block: string): Array<{ name: string; line: string }> {
  const entries: Array<{ name: string; line: string }> = [];
  const importRegex = /import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*['"][^'"\n]+['"];?/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(block)) !== null) {
    entries.push({ name: match[1] ?? '', line: match[0]?.trim() ?? '' });
  }
  return entries;
}

/**
 * Build a single import statement
 */
export function buildImportStatement(
  modelName: string,
  moduleType: GeneratedModuleFolder,
): { name: string; line: string } {
  const modelNameLower = toCamelCase(modelName);
  const line = `import { ${modelName}Module } from './${moduleType}/${toKebabCase(modelName)}/${modelNameLower}.module';`;
  return { name: `${modelName}Module`, line };
}

/**
 * Merge import entries, deduplicating by name
 */
export function mergeImportEntries(
  existing: Array<{ name: string; line: string }>,
  newEntries: Array<{ name: string; line: string }>,
): Array<{ name: string; line: string }> {
  const seen = new Set(existing.map((e) => e.name));
  return [...existing, ...newEntries.filter((e) => !seen.has(e.name))];
}

/**
 * Find existing auto-generated import block
 */
export function findImportBlock(content: string): {
  match: RegExpMatchArray;
  block: string;
} | null {
  const blockRegex = /\/\/ AUTO-GENERATED IMPORTS START([\s\S]*?)\/\/ AUTO-GENERATED IMPORTS END/;
  const match = content.match(blockRegex);
  if (!match) {
    return null;
  }
  return { match, block: match[1] ?? '' };
}

/**
 * Find the last import statement in content
 */
export function findLastImportStatement(content: string): {
  index: number;
  length: number;
} | null {
  const importRegex = /^import\s+.*?from\s+['"][^'"]+['"];$/gm;
  const matches = Array.from(content.matchAll(importRegex));
  if (matches.length === 0) {
    return null;
  }
  const lastMatch = matches[matches.length - 1];
  return {
    index: lastMatch?.index ?? 0,
    length: lastMatch?.[0]?.length ?? 0,
  };
}

/**
 * Insert import block at a specific position
 */
export function insertImportBlock(content: string, importsBlock: string, position: number | null): string {
  if (position === null) {
    // No imports found, add at the beginning
    return `${importsBlock}\n\n${content}`;
  }

  const lastImportEnd = position;
  return content.substring(0, lastImportEnd) + '\n' + importsBlock + '\n' + content.substring(lastImportEnd);
}

/**
 * Merge and deduplicate module names
 */
export function mergeModuleNames(previous: string[], newModules: string[]): string[] {
  return [...previous, ...newModules].filter((name, idx, arr) => arr.indexOf(name) === idx);
}

/**
 * Clean array tokens: remove trailing commas and normalize
 */
export function cleanArrayTokens(tokens: string[]): string[] {
  return tokens.map((token, index, arr) => {
    const trimmedToken = token.trim();
    // Remove trailing comma from all tokens
    const cleanedToken = trimmedToken.replace(/,\s*$/, '');
    // Add comma to all tokens except the last one
    return index === arr.length - 1 ? cleanedToken : `${cleanedToken},`;
  });
}

/**
 * Build final imports array content with auto-generated modules block
 */
export function buildImportsArrayContent(filteredTokens: string[], moduleNames: string[]): string {
  let newImportsArrayContent = '';

  if (filteredTokens.length > 0) {
    const cleanedTokens = cleanArrayTokens(filteredTokens);
    newImportsArrayContent = cleanedTokens.join('\n');
  }

  if (moduleNames.length > 0) {
    const modulesBlock = `    // AUTO-GENERATED MODULES START\n${moduleNames
      .map((n) => `    ${n},`)
      .join('\n')}\n    // AUTO-GENERATED MODULES END`;

    if (newImportsArrayContent) {
      newImportsArrayContent = `${newImportsArrayContent},\n${modulesBlock}`;
    } else {
      newImportsArrayContent = modulesBlock;
    }
  }

  return newImportsArrayContent;
}

/**
 * Update import statements in AppModule
 */
export function updateImportStatements(
  content: string,
  mods: Array<{ name: string; moduleType: GeneratedModuleFolder }>,
): string {
  // Build new import entries
  const newEntries = mods.map((m) => buildImportStatement(m.name, m.moduleType));

  // Find existing block
  const existingBlock = findImportBlock(content);
  let existingEntries: Array<{ name: string; line: string }> = [];
  if (existingBlock) {
    existingEntries = parseImportEntries(existingBlock.block);
  }

  // Merge entries
  const merged = mergeImportEntries(existingEntries, newEntries);

  // Build imports block
  const importsBlock = `// AUTO-GENERATED IMPORTS START\n${merged
    .map((e) => e.line)
    .join('\n')}\n// AUTO-GENERATED IMPORTS END`;

  if (existingBlock) {
    return content.replace(/\/\/ AUTO-GENERATED IMPORTS START[\s\S]*?\/\/ AUTO-GENERATED IMPORTS END/, importsBlock);
  }

  // Find last import to insert after
  const lastImport = findLastImportStatement(content);
  return insertImportBlock(content, importsBlock, lastImport?.index ?? null);
}

/**
 * Update imports array in AppModule @Module decorator
 */
export function updateImportsArray(
  content: string,
  mods: Array<{ name: string; moduleType: GeneratedModuleFolder }>,
): string {
  const parser = new NestAppModuleParser();
  const parsedResult = parser.parse(content);

  if (!parsedResult.moduleBounds || !parsedResult.importsBounds) {
    return content;
  }

  // Merge module names
  const desiredNames = mods.map((m) => `${m.name}Module`);

  // Build new imports array content
  const newImportsArrayContent = buildImportsArrayContent(parsedResult.tokens, desiredNames);

  // Replace imports array
  const beforeImports = parsedResult.importsBounds ? content.substring(0, parsedResult.importsBounds.start + 1) : '';
  const afterImports = parsedResult.importsBounds ? content.substring(parsedResult.importsBounds.end) : '';

  return `${beforeImports ? beforeImports + '\n' : ''}${newImportsArrayContent}${afterImports ? '\n  ' + afterImports : ''}`;
}
