import * as fs from 'fs';
import * as path from 'path';
import { toKebabCase, pluralize } from './generator/utils';
import type { GeneratedModuleFolder, ModulePathInfo } from '@tg-scripts/types';

/**
 * Find the module path for a given model name by checking various naming variations
 */
export function findModulePath(modelName: string, baseDir: string): ModulePathInfo | null {
  const namingVariations = [
    modelName.toLowerCase(), // user
    pluralize(modelName.toLowerCase()), // users
    toKebabCase(modelName), // feature-flag
    pluralize(toKebabCase(modelName)), // feature-flags
  ];

  // Remove duplicates
  const uniqueVariations = [...new Set(namingVariations)];

  for (const folder of ['features', 'infrastructure'] as GeneratedModuleFolder[]) {
    for (const variation of uniqueVariations) {
      // Check folder directory
      const folderPath = path.join(baseDir, 'src', folder, variation);
      if (fs.existsSync(folderPath)) {
        return { path: folderPath, type: folder, folderName: variation };
      }
    }
  }

  return null;
}

/**
 * Find the .module.ts file in a given directory
 */
export function getModuleFileName(modulePath: string): string {
  if (!fs.existsSync(modulePath)) {
    return '';
  }

  const files = fs.readdirSync(modulePath);
  const moduleFile = files.find((f) => f.endsWith('.module.ts'));
  return moduleFile || '';
}
