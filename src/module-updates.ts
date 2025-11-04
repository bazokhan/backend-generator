import { findMatchingBrace, findMatchingBracket } from './parser/utils/character-parsers';

/**
 * Generate TG import statements for controller and service
 */
export function generateModuleImportStatements(
  modelName: string,
  modelNameLower: string,
  namingSuffix: string,
  fileSuffix: string,
): {
  controllerImport: string;
  serviceImport: string;
} {
  return {
    controllerImport: `import { ${modelName}${namingSuffix}Controller } from './${modelNameLower}${fileSuffix ? `.${fileSuffix}` : ''}.controller';`,
    serviceImport: `import { ${modelName}${namingSuffix}Service } from './${modelNameLower}${fileSuffix ? `.${fileSuffix}` : ''}.service';`,
  };
}

/**
 * Find the bounds of an array in a module decorator
 * Returns { start: index, end: index } or null if not found
 */
export function findArrayInModule(content: string, arrayName: string): { start: number; end: number } | null {
  // Find the @Module decorator
  const moduleMatch = content.match(/@Module\s*\(\s*\{/);
  if (!moduleMatch) {
    return null;
  }

  const moduleStartIndex = moduleMatch.index! + moduleMatch[0].length - 1; // -1 to point to opening brace
  const moduleEndIndex = findMatchingBrace(content, moduleStartIndex);

  if (moduleEndIndex === -1) {
    return null;
  }

  // Extract module content
  const moduleContent = content.substring(moduleStartIndex + 1, moduleEndIndex);

  // Find the array keyword
  const arrayKeywordIndex = moduleContent.indexOf(`${arrayName}:`);
  if (arrayKeywordIndex === -1) {
    return null;
  }

  // Find opening bracket directly after the colon (with optional whitespace)
  const afterColon = moduleContent.substring(arrayKeywordIndex + arrayName.length + 1);
  const bracketMatch = afterColon.match(/^\s*\[/);
  if (!bracketMatch) {
    return null; // No bracket found directly after the colon
  }

  // Calculate the array start position
  const arrayStartInModule = arrayKeywordIndex + arrayName.length + 1 + bracketMatch[0].indexOf('[');

  // Calculate actual position in original content
  const arrayStart = moduleStartIndex + 1 + arrayStartInModule;
  const arrayEnd = findMatchingBracket(content, arrayStart);

  if (arrayEnd === -1) {
    return null;
  }

  return { start: arrayStart, end: arrayEnd };
}

/**
 * Add import statements to module content if they don't already exist
 */
export function addImportsToModule(content: string, imports: string[]): string {
  // Filter out imports that already exist
  const importsToAdd = imports.filter((imp) => {
    // Extract the class name from import statement
    const match = imp.match(/import\s*\{\s*([A-Za-z0-9_]+)\s*\}/);
    if (!match) return true; // If we can't parse it, add it to be safe
    const className = match[1];
    // Check if this exact import statement exists, not just the class name
    return !content.includes(className ?? '');
  });

  // If no imports to add, return original content
  if (importsToAdd.length === 0) {
    return content;
  }

  // Find the last import statement
  const lastImportMatch = content.match(/import[^;]+;(?=\n(?!import))/);
  if (lastImportMatch) {
    const lastImportIndex = content.indexOf(lastImportMatch[0]) + lastImportMatch[0].length;
    return content.slice(0, lastImportIndex) + '\n' + importsToAdd.join('\n') + content.slice(lastImportIndex);
  }

  // No imports found, add at the beginning
  return importsToAdd.join('\n') + '\n\n' + content;
}

/**
 * Add items to an array in a module decorator (controllers, providers, etc.)
 */
export function addToArrayInModule(content: string, arrayName: string, items: string[]): string {
  const arrayRegex = new RegExp(`${arrayName}:\\s*\\[([\\s\\S]*?)\\]`, 'g');
  const match = arrayRegex.exec(content);
  if (!match) {
    return content; // Array not found, return original
  }

  const existingContent = match[1]?.trim() ?? '';
  const hasExisting = existingContent.length > 0;

  // Check which items need to be added
  const itemsToAdd: string[] = [];
  for (const item of items) {
    if (!existingContent.includes(item)) {
      itemsToAdd.push(item);
    }
  }

  if (itemsToAdd.length === 0) {
    return content; // All items already exist
  }

  // Build new array content
  const newContent = hasExisting ? `${existingContent}, ${itemsToAdd.join(', ')}` : itemsToAdd.join(', ');

  // Replace the array content
  return content.replace(new RegExp(`${arrayName}:\\s*\\[[\\s\\S]*?\\]`), `${arrayName}: [${newContent}]`);
}
