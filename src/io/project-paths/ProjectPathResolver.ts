import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '@tg-scripts/types';

interface ProjectPathResolverOptions {
  workspaceRoot?: string;
  fsModule?: typeof fs;
  pathModule?: typeof path;
}

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  '.cache',
  'coverage',
  'tmp',
  'temp',
  '.husky',
]);

export class ProjectPathResolver {
  private readonly workspaceRoot: string;
  private readonly fsModule: typeof fs;
  private readonly pathModule: typeof path;
  private readonly dashboardAbsolutePath: string;

  private readonly moduleRootCache: Record<string, string[]> = {};
  private appModulePathCache: string | null | undefined;
  private dataProviderPathCache: string | null | undefined;
  private appComponentPathCache: string | null | undefined;

  constructor(private readonly config: Config, options: ProjectPathResolverOptions = {}) {
    this.workspaceRoot = options.workspaceRoot ?? process.cwd();
    this.fsModule = options.fsModule ?? fs;
    this.pathModule = options.pathModule ?? path;
    const dashboardPath = this.config.output.dashboard.root;
    this.dashboardAbsolutePath = this.isAbsolute(dashboardPath)
      ? dashboardPath
      : this.pathModule.join(this.workspaceRoot, dashboardPath);
  }

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  public getDashboardRoot(): string {
    return this.dashboardAbsolutePath;
  }

  public resolveAppModulePath(): string | null {
    if (this.appModulePathCache !== undefined) {
      return this.appModulePathCache;
    }

    const configured = this.resolveConfiguredPath(this.config.paths?.appModule);
    if (configured) {
      this.appModulePathCache = configured;
      return this.appModulePathCache;
    }

    const candidates = [
      this.pathModule.join(this.workspaceRoot, 'src', 'app.module.ts'),
      this.pathModule.join(this.workspaceRoot, 'apps', 'api', 'src', 'app.module.ts'),
      this.pathModule.join(this.workspaceRoot, 'apps', 'backend', 'src', 'app.module.ts'),
      this.pathModule.join(this.workspaceRoot, 'apps', 'server', 'src', 'app.module.ts'),
      this.pathModule.join(this.workspaceRoot, 'packages', 'api', 'src', 'app.module.ts'),
      this.pathModule.join(this.workspaceRoot, 'packages', 'backend', 'src', 'app.module.ts'),
    ];

    for (const candidate of candidates) {
      if (this.fsModule.existsSync(candidate)) {
        this.appModulePathCache = candidate;
        return this.appModulePathCache;
      }
    }

    const discovered = this.findFileByName(this.workspaceRoot, 'app.module.ts');
    this.appModulePathCache = discovered;
    return this.appModulePathCache;
  }

  public resolveModuleRoots(): Record<string, string[]> {
    // Return all configured search paths as module roots
    const roots: Record<string, string[]> = {};
    for (const searchPath of this.config.output.backend.modules.searchPaths) {
      const absolutePath = this.makeAbsolute(searchPath);
      const folderName = this.pathModule.basename(absolutePath);
      if (!roots[folderName]) {
        roots[folderName] = [];
      }
      roots[folderName].push(absolutePath);
    }
    return roots;
  }

  public resolveDashboardDataProviderPath(): string | null {
    if (this.dataProviderPathCache !== undefined) {
      return this.dataProviderPathCache;
    }

    const configured = this.resolveConfiguredPath(this.config.paths?.dataProvider);
    if (configured) {
      this.dataProviderPathCache = configured;
      return this.dataProviderPathCache;
    }

    const defaultPath = this.pathModule.join(this.dashboardAbsolutePath, 'providers', 'dataProvider.ts');
    if (this.fsModule.existsSync(defaultPath)) {
      this.dataProviderPathCache = defaultPath;
      return this.dataProviderPathCache;
    }

    this.dataProviderPathCache = this.findFileByPredicate(this.dashboardAbsolutePath, (absolutePath) =>
      absolutePath.endsWith(`${this.pathModule.sep}dataProvider.ts`),
    );
    return this.dataProviderPathCache;
  }

  public resolveDashboardAppComponentPath(): string | null {
    if (this.appComponentPathCache !== undefined) {
      return this.appComponentPathCache;
    }

    const configured = this.resolveConfiguredPath(this.config.paths?.appComponent);
    if (configured) {
      this.appComponentPathCache = configured;
      return this.appComponentPathCache;
    }

    const defaultPath = this.pathModule.join(this.dashboardAbsolutePath, 'App.tsx');
    if (this.fsModule.existsSync(defaultPath)) {
      this.appComponentPathCache = defaultPath;
      return this.appComponentPathCache;
    }

    const fallbackCandidates = [
      this.pathModule.join(this.dashboardAbsolutePath, 'app', 'App.tsx'),
      this.pathModule.join(this.dashboardAbsolutePath, 'src', 'App.tsx'),
      this.pathModule.join(this.dashboardAbsolutePath, 'app', 'index.tsx'),
    ];

    for (const candidate of fallbackCandidates) {
      if (this.fsModule.existsSync(candidate)) {
        this.appComponentPathCache = candidate;
        return this.appComponentPathCache;
      }
    }

    this.appComponentPathCache = this.findFileByPredicate(this.dashboardAbsolutePath, (absolutePath) => {
      const fileName = this.pathModule.basename(absolutePath).toLowerCase();
      return fileName === 'app.tsx' || fileName === 'app.jsx' || fileName === 'app.ts';
    });

    return this.appComponentPathCache;
  }

  public getDefaultModuleRoot(): string {
    // With new config, we use the defaultRoot from config
    return this.pathModule.join(this.workspaceRoot, this.config.output.backend.modules.defaultRoot);
  }

  private resolveModuleRootsFor(type: string): string[] {
    if (this.moduleRootCache[type]) {
      return this.moduleRootCache[type] ?? [];
    }

    const resolved: string[] = [];

    // Use search paths from new config structure
    for (const searchPath of this.config.output.backend.modules.searchPaths) {
      resolved.push(this.makeAbsolute(searchPath));
    }

    const defaults = [
      this.pathModule.join(this.workspaceRoot, 'src', type),
      this.pathModule.join(this.workspaceRoot, 'src', 'modules', type),
      this.pathModule.join(this.workspaceRoot, 'src', 'domains', type),
      this.pathModule.join(this.workspaceRoot, type),
    ];
    for (const candidate of defaults) {
      if (this.fsModule.existsSync(candidate)) {
        resolved.push(candidate);
      }
    }

    const multiProjectRoots = ['apps', 'packages', 'services', 'libs'];

    for (const rootName of multiProjectRoots) {
      const basePath = this.pathModule.join(this.workspaceRoot, rootName);
      if (!this.fsModule.existsSync(basePath)) {
        continue;
      }

      const subDirectories = this.safeReadDir(basePath);
      for (const entry of subDirectories) {
        if (!entry.isDirectory()) {
          continue;
        }
        const dirPath = this.pathModule.join(basePath, entry.name);
        const srcPath = this.pathModule.join(dirPath, 'src');
        const candidate = this.pathModule.join(srcPath, type);

        if (this.fsModule.existsSync(candidate)) {
          resolved.push(candidate);
        }
      }
    }

    const discovered = this.discoverModuleDirectories(type);
    resolved.push(...discovered);

    const unique = Array.from(new Set(resolved.map((p) => this.normalizePath(p))));
    const normalized = unique.map((p) => (this.isAbsolute(p) ? p : this.pathModule.join(this.workspaceRoot, p)));

    this.moduleRootCache[type] = normalized;
    return this.moduleRootCache[type] ?? [];
  }

  private discoverModuleDirectories(type: string): string[] {
    const matches: string[] = [];
    const searchBases = [this.workspaceRoot, this.pathModule.join(this.workspaceRoot, 'src')];

    for (const base of searchBases) {
      const directories = this.safeReadDir(base);
      for (const entry of directories) {
        if (!entry.isDirectory()) {
          continue;
        }

        const dirPath = this.pathModule.join(base, entry.name);
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }

        const child = this.pathModule.join(dirPath, type);
        if (this.fsModule.existsSync(child) && this.directoryContainsModuleFiles(child)) {
          matches.push(child);
        }
      }
    }

    return matches;
  }

  private directoryContainsModuleFiles(directory: string): boolean {
    if (!this.fsModule.existsSync(directory)) {
      return false;
    }

    const entries = this.safeReadDir(directory);
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const result = this.directoryContainsModuleFiles(this.pathModule.join(directory, entry.name));
        if (result) {
          return true;
        }
        continue;
      }

      if (entry.name.endsWith('.module.ts')) {
        return true;
      }
    }

    return false;
  }

  private findFileByName(startDir: string, fileName: string, maxDepth = 4): string | null {
    return this.findFileByPredicate(startDir, (absolutePath) => this.pathModule.basename(absolutePath) === fileName, maxDepth);
  }

  private findFileByPredicate(startDir: string, predicate: (absolutePath: string) => boolean, maxDepth = 4): string | null {
    const queue: Array<{ dir: string; depth: number }> = [{ dir: startDir, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }

      if (!this.fsModule.existsSync(current.dir)) {
        continue;
      }

      const entries = this.safeReadDir(current.dir);
      for (const entry of entries) {
        const absolutePath = this.pathModule.join(current.dir, entry.name);
        if (entry.isDirectory()) {
          if (IGNORED_DIRECTORIES.has(entry.name) || current.depth >= maxDepth) {
            continue;
          }
          queue.push({ dir: absolutePath, depth: current.depth + 1 });
          continue;
        }

        if (predicate(absolutePath)) {
          return absolutePath;
        }
      }
    }

    return null;
  }

  private safeReadDir(directory: string): fs.Dirent[] {
    try {
      return this.fsModule.readdirSync(directory, { withFileTypes: true });
    } catch {
      return [];
    }
  }

  private resolveConfiguredPath(value: string | undefined): string | null {
    if (!value) {
      return null;
    }
    return this.makeAbsolute(value);
  }

  private makeAbsolute(targetPath: string): string {
    return this.isAbsolute(targetPath) ? this.normalizePath(targetPath) : this.pathModule.join(this.workspaceRoot, targetPath);
  }

  private isAbsolute(targetPath: string): targetPath is string {
    return this.pathModule.isAbsolute(targetPath);
  }

  private normalizePath(targetPath: string): string {
    return this.pathModule.normalize(targetPath);
  }
}
