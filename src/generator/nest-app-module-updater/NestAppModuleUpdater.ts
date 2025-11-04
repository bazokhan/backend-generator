import type { GeneratedModuleFolder } from '@tg-scripts/types';
import { NestAppModuleParser } from '../../parser/nest-app-module-parser/NestAppModuleParser';
import { toCamelCase, toKebabCase } from '../utils';

export class NestAppModuleUpdater {
  constructor(private readonly parser: NestAppModuleParser = new NestAppModuleParser()) {}

  public parseImportEntries(block: string): Array<{ name: string; line: string }> {
    const entries: Array<{ name: string; line: string }> = [];
    const importRegex = /import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*['"][^'"\n]+['"];?/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(block)) !== null) {
      entries.push({ name: match[1] ?? '', line: match[0]?.trim() ?? '' });
    }
    return entries;
  }

  public buildImportStatement(modelName: string, moduleType: GeneratedModuleFolder): { name: string; line: string } {
    const modelNameLower = toCamelCase(modelName);
    const line = `import { ${modelName}Module } from './${moduleType}/${toKebabCase(modelName)}/${modelNameLower}.module';`;
    return { name: `${modelName}Module`, line };
  }

  public mergeImportEntries(
    existing: Array<{ name: string; line: string }>,
    newEntries: Array<{ name: string; line: string }>,
  ): Array<{ name: string; line: string }> {
    const seen = new Set(existing.map((e) => e.name));
    return [...existing, ...newEntries.filter((e) => !seen.has(e.name))];
  }

  public findImportBlock(content: string): {
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

  public findLastImportStatement(content: string): {
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

  public insertImportBlock(content: string, importsBlock: string, position: number | null): string {
    if (position === null) {
      return `${importsBlock}\n\n${content}`;
    }

    const lastImportEnd = position;
    return content.substring(0, lastImportEnd) + '\n' + importsBlock + '\n' + content.substring(lastImportEnd);
  }

  public mergeModuleNames(previous: string[], newModules: string[]): string[] {
    return [...previous, ...newModules].filter((name, idx, arr) => arr.indexOf(name) === idx);
  }

  public cleanArrayTokens(tokens: string[]): string[] {
    return tokens.map((token, index, arr) => {
      const trimmedToken = token.trim();
      const cleanedToken = trimmedToken.replace(/,\s*$/, '');
      return index === arr.length - 1 ? cleanedToken : `${cleanedToken},`;
    });
  }

  public buildImportsArrayContent(filteredTokens: string[], moduleNames: string[]): string {
    let newImportsArrayContent = '';

    if (filteredTokens.length > 0) {
      const cleanedTokens = this.cleanArrayTokens(filteredTokens);
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

  public updateImportStatements(
    content: string,
    mods: Array<{ name: string; moduleType: GeneratedModuleFolder }>,
  ): string {
    const newEntries = mods.map((m) => this.buildImportStatement(m.name, m.moduleType));

    const existingBlock = this.findImportBlock(content);
    let existingEntries: Array<{ name: string; line: string }> = [];
    if (existingBlock) {
      existingEntries = this.parseImportEntries(existingBlock.block);
    }

    const merged = this.mergeImportEntries(existingEntries, newEntries);

    const importsBlock = `// AUTO-GENERATED IMPORTS START\n${merged
      .map((e) => e.line)
      .join('\n')}\n// AUTO-GENERATED IMPORTS END`;

    if (existingBlock) {
      return content.replace(/\/\/ AUTO-GENERATED IMPORTS START[\s\S]*?\/\/ AUTO-GENERATED IMPORTS END/, importsBlock);
    }

    const lastImport = this.findLastImportStatement(content);
    return this.insertImportBlock(content, importsBlock, lastImport?.index ?? null);
  }

  public updateImportsArray(content: string, mods: Array<{ name: string; moduleType: GeneratedModuleFolder }>): string {
    const parsedResult = this.parser.parse(content);

    if (!parsedResult.moduleBounds || !parsedResult.importsBounds) {
      return content;
    }

    const desiredNames = mods.map((m) => `${m.name}Module`);
    const newImportsArrayContent = this.buildImportsArrayContent(parsedResult.tokens, desiredNames);

    const beforeImports = parsedResult.importsBounds ? content.substring(0, parsedResult.importsBounds.start + 1) : '';
    const afterImports = parsedResult.importsBounds ? content.substring(parsedResult.importsBounds.end) : '';

    return `${beforeImports ? beforeImports + '\n' : ''}${newImportsArrayContent}${
      afterImports ? '\n  ' + afterImports : ''
    }`;
  }
}
