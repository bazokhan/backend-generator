import * as fs from 'fs';
import * as path from 'path';
import type { GeneratedModuleFolder, ModulePathInfo } from '@tg-scripts/types';
import { pluralize, toKebabCase } from '../../generator/utils';

interface ModulePathResolverOptions {
  fsModule?: typeof fs;
  pathModule?: typeof path;
  moduleRoots?: Partial<Record<GeneratedModuleFolder, string[]>>;
}

export class ModulePathResolver {
  private readonly fsModule: typeof fs;
  private readonly pathModule: typeof path;
  private readonly moduleRoots: Partial<Record<GeneratedModuleFolder, string[]>>;

  constructor(private readonly options: ModulePathResolverOptions = {}) {
    this.fsModule = this.options.fsModule ?? fs;
    this.pathModule = this.options.pathModule ?? path;
    this.moduleRoots = this.options.moduleRoots ?? {};
  }

  public findModulePath(modelName: string, baseDir: string): ModulePathInfo | null {
    const namingVariations = [
      modelName.toLowerCase(),
      pluralize(modelName.toLowerCase()),
      toKebabCase(modelName),
      pluralize(toKebabCase(modelName)),
    ];

    const uniqueVariations = [...new Set(namingVariations)];

    for (const folder of ['features', 'infrastructure'] as GeneratedModuleFolder[]) {
      const roots = this.resolveRoots(folder, baseDir);
      for (const variation of uniqueVariations) {
        for (const root of roots) {
          const folderPath = this.pathModule.join(root, variation);
          if (this.fsModule.existsSync(folderPath)) {
          return { path: folderPath, type: folder, folderName: variation };
        }
      }
    }
    }

    return null;
  }

  public getModuleFileName(modulePath: string): string {
    if (!this.fsModule.existsSync(modulePath)) {
      return '';
    }

    const files = this.fsModule.readdirSync(modulePath);
    const moduleFile = files.find((file) => file.endsWith('.module.ts'));
    return moduleFile || '';
  }

  private resolveRoots(type: GeneratedModuleFolder, baseDir: string): string[] {
    const configuredRoots = this.moduleRoots[type] ?? [];
    if (configuredRoots.length > 0) {
      return configuredRoots.map((root) => this.toAbsolute(root, baseDir));
    }

    return [this.pathModule.join(baseDir, 'src', type)];
  }

  private toAbsolute(root: string, baseDir: string): string {
    return this.pathModule.isAbsolute(root) ? root : this.pathModule.join(baseDir, root);
  }
}
