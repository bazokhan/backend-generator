import * as fs from 'fs';
import * as path from 'path';
import type { GeneratedModuleFolder, ModulePathInfo } from '@tg-scripts/types';
import { pluralize, toKebabCase } from '../../generator/utils';

export class ModulePathResolver {
  public findModulePath(modelName: string, baseDir: string): ModulePathInfo | null {
    const namingVariations = [
      modelName.toLowerCase(),
      pluralize(modelName.toLowerCase()),
      toKebabCase(modelName),
      pluralize(toKebabCase(modelName)),
    ];

    const uniqueVariations = [...new Set(namingVariations)];

    for (const folder of ['features', 'infrastructure'] as GeneratedModuleFolder[]) {
      for (const variation of uniqueVariations) {
        const folderPath = path.join(baseDir, 'src', folder, variation);
        if (fs.existsSync(folderPath)) {
          return { path: folderPath, type: folder, folderName: variation };
        }
      }
    }

    return null;
  }

  public getModuleFileName(modulePath: string): string {
    if (!fs.existsSync(modulePath)) {
      return '';
    }

    const files = fs.readdirSync(modulePath);
    const moduleFile = files.find((file) => file.endsWith('.module.ts'));
    return moduleFile || '';
  }
}
