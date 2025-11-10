import * as fs from 'fs';
import * as path from 'path';
import type { ModulePathInfo } from '@tg-scripts/types';
import { pluralize, toKebabCase } from '../../generator/utils';

interface ModulePathResolverOptions {
  fsModule?: typeof fs;
  pathModule?: typeof path;
  searchPaths?: string[];
  defaultRoot?: string;
}

export class ModulePathResolver {
  private readonly defaultRoot: string;
  private readonly fsModule: typeof fs;
  private readonly pathModule: typeof path;
  private readonly searchPaths: string[];
  constructor(private readonly options: ModulePathResolverOptions = {}) {
    this.fsModule = this.options.fsModule ?? fs;
    this.pathModule = this.options.pathModule ?? path;
    // Default search paths if not provided
    this.searchPaths = this.options.searchPaths ?? ['src/features', 'src/modules', 'src'];
    this.defaultRoot = this.options.defaultRoot ?? 'src/features';
  }

  private inferModuleType(searchPath: string): string {
    // Extract the folder name from the search path
    // e.g., 'src/features' -> 'features', 'apps/api/src/modules' -> 'modules'
    const parts = searchPath.split(this.pathModule.sep);
    return parts[parts.length - 1] || 'features';
  }

  private toAbsolute(root: string, baseDir: string): string {
    return this.pathModule.isAbsolute(root) ? root : this.pathModule.join(baseDir, root);
  }

  public findModulePath(modelName: string, baseDir: string): ModulePathInfo | null {
    const namingVariations = [
      modelName.toLowerCase(),
      pluralize(modelName.toLowerCase()),
      toKebabCase(modelName),
      pluralize(toKebabCase(modelName)),
    ];

    const uniqueVariations = [...new Set(namingVariations)];

    // Search through all configured search paths
    for (const searchPath of this.searchPaths) {
      const absoluteSearchPath = this.toAbsolute(searchPath, baseDir);

      for (const variation of uniqueVariations) {
        const folderPath = this.pathModule.join(absoluteSearchPath, variation);
        if (this.fsModule.existsSync(folderPath)) {
          // Determine type based on path (for backward compatibility)
          const type = this.inferModuleType(searchPath);
          return { path: folderPath, type, folderName: variation };
        }
      }
    }

    return null;
  }

  public getDefaultRoot(): string {
    return this.defaultRoot;
  }

  public getModuleFileName(modulePath: string): string {
    if (!this.fsModule.existsSync(modulePath)) {
      return '';
    }

    const files = this.fsModule.readdirSync(modulePath);
    const moduleFile = files.find((file) => file.endsWith('.module.ts'));
    return moduleFile || '';
  }

  public getSearchPaths(): string[] {
    return this.searchPaths;
  }
}
