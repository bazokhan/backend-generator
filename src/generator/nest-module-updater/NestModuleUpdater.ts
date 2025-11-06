import { findMatchingBrace, findMatchingBracket } from '../../parser/utils/character-parsers';

export class NestModuleUpdater {
  public addImportsToModule(content: string, imports: string[]): string {
    const importsToAdd = imports.filter((imp) => {
      const match = imp.match(/import\s*\{\s*([A-Za-z0-9_]+)\s*\}/);
      if (!match) return true;
      const className = match[1];
      return !content.includes(className ?? '');
    });

    if (importsToAdd.length === 0) {
      return content;
    }

    const lastImportMatch = content.match(/import[^;]+;(?=\n(?!import))/);
    if (lastImportMatch) {
      const lastImportIndex = content.indexOf(lastImportMatch[0]) + lastImportMatch[0].length;
      return content.slice(0, lastImportIndex) + '\n' + importsToAdd.join('\n') + content.slice(lastImportIndex);
    }

    return importsToAdd.join('\n') + '\n\n' + content;
  }

  public addToArrayInModule(content: string, arrayName: string, items: string[]): string {
    const arrayRegex = new RegExp(`${arrayName}:\\s*\\[([\\s\\S]*?)\\]`, 'g');
    const match = arrayRegex.exec(content);
    if (!match) {
      return content;
    }

    const existingContent = match[1]?.trim() ?? '';
    const hasExisting = existingContent.length > 0;

    const itemsToAdd: string[] = [];
    for (const item of items) {
      if (!existingContent.includes(item)) {
        itemsToAdd.push(item);
      }
    }

    if (itemsToAdd.length === 0) {
      return content;
    }

    const newContent = hasExisting ? `${existingContent}, ${itemsToAdd.join(', ')}` : itemsToAdd.join(', ');

    return content.replace(new RegExp(`${arrayName}:\\s*\\[[\\s\\S]*?\\]`), `${arrayName}: [${newContent}]`);
  }

  public findArrayInModule(content: string, arrayName: string): { start: number; end: number } | null {
    const moduleMatch = content.match(/@Module\s*\(\s*\{/);
    if (!moduleMatch) {
      return null;
    }

    const moduleStartIndex = moduleMatch.index! + moduleMatch[0].length - 1;
    const moduleEndIndex = findMatchingBrace(content, moduleStartIndex);

    if (moduleEndIndex === -1) {
      return null;
    }

    const moduleContent = content.substring(moduleStartIndex + 1, moduleEndIndex);
    const arrayKeywordIndex = moduleContent.indexOf(`${arrayName}:`);
    if (arrayKeywordIndex === -1) {
      return null;
    }

    const afterColon = moduleContent.substring(arrayKeywordIndex + arrayName.length + 1);
    const bracketMatch = afterColon.match(/^\s*\[/);
    if (!bracketMatch) {
      return null;
    }

    const arrayStartInModule = arrayKeywordIndex + arrayName.length + 1 + bracketMatch[0].indexOf('[');

    const arrayStart = moduleStartIndex + 1 + arrayStartInModule;
    const arrayEnd = findMatchingBracket(content, arrayStart);

    if (arrayEnd === -1) {
      return null;
    }

    return { start: arrayStart, end: arrayEnd };
  }

  public generateModuleImportStatements(
    modelName: string,
    modelNameLower: string,
    namingSuffix: string,
    fileSuffix: string,
  ): {
    controllerImport: string;
    serviceImport: string;
  } {
    return {
      controllerImport: `import { ${modelName}${namingSuffix}Controller } from './${modelNameLower}${
        fileSuffix ? `.${fileSuffix}` : ''
      }.controller';`,
      serviceImport: `import { ${modelName}${namingSuffix}Service } from './${modelNameLower}${
        fileSuffix ? `.${fileSuffix}` : ''
      }.service';`,
    };
  }
}
