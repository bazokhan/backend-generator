---
layout: default
title: Utilities
parent: API Reference
nav_order: 3
---

# Utilities API

Supporting classes exported by `@tgraph/backend-generator` that keep the CLI modular and easy to extend. Unless noted otherwise, imports come from the package root. Helpers under `io/utils` are available as deep exports via `@tgraph/backend-generator/dist/...`.

---

## Config Loader Helpers

### `ConfigLoader` & `ConfigLoaderError`

```typescript
import { ConfigLoader } from '@tgraph/backend-generator';

const loader = new ConfigLoader({ cwd: process.cwd() });
const config = loader.load(); // throws ConfigLoaderError if invalid
```

- Searches for `tgraph.config.ts` or `tgraph.config.js` unless `configPath` is provided.
- Accepts stubbed `fs`/`path` modules for tests.
- Validates required sections (`input`, `output`, `api`, `dashboard`, `behavior`).

### Convenience functions

- `loadConfig(): Config` – one-liner used by the CLI and custom scripts.
- `configFileExists(): boolean` – detect whether generation can proceed.
- `getConfigFilePath(): string | null` – returns the resolved config location for logging/tooling.

---

## ModulePathResolver

Locates NestJS module directories for a given model by scanning every path listed in `config.output.backend.modules.searchPaths`.

```typescript
import { ModulePathResolver } from '@tgraph/backend-generator';

const resolver = new ModulePathResolver({
  searchPaths: ['src/features', 'src/modules'],
  defaultRoot: 'src/features',
});

const info = resolver.findModulePath('User', process.cwd());
// => { path: '/workspace/src/features/user', type: 'features', folderName: 'user' }
```

### Methods

- `findModulePath(modelName: string, baseDir: string): ModulePathInfo | null`
- `getModuleFileName(modulePath: string): string` – looks for the first `*.module.ts`.
- `getDefaultRoot(): string` / `getSearchPaths(): string[]`

When the resolver returns `null`, generators prompt (or auto-confirm) and create a folder under `defaultRoot`.

---

## ProjectPathResolver

Determines project-level paths from the active `Config`.

```typescript
import { ProjectPathResolver } from '@tgraph/backend-generator';

const resolver = new ProjectPathResolver(config);
const appModule = resolver.resolveAppModulePath();
const dataProvider = resolver.resolveDashboardDataProviderPath();
const dashboardRoot = resolver.getDashboardRoot();
```

### Capabilities

- Resolves AppModule, dashboard `App.tsx`, and `dataProvider.ts`, honoring overrides in `config.paths`.
- Computes module root directories from the configured search paths.
- Provides `getWorkspaceRoot()` and `getDefaultModuleRoot()` helpers for new directories.
- Caches lookups to avoid repeated filesystem walks.

---

## PreflightChecker

Runs a lightweight diagnostic pass before generation and surfaces actionable warnings.

```typescript
import { PreflightChecker } from '@tgraph/backend-generator';

const report = new PreflightChecker(config).run();
if (report.hasWarnings) {
  report.manualSteps.forEach((step) => console.warn(step.message));
}
```

### Report shape

```typescript
interface PreflightReport {
  appModule: PreflightPathReport;
  dataProvider: PreflightPathReport;
  appComponent: PreflightPathReport;
  swagger: PreflightPathReport & { required: boolean };
  modules: Array<{
    name: string;
    status: 'ready' | 'missing-directory' | 'missing-module-file';
    moduleType?: string;
    existingDirectory?: string;
    pendingDirectory?: string;
  }>;
  dashboardResources: Array<{ name: string; path: string; exists: boolean }>;
  manualSteps: Array<{ message: string; severity: 'info' | 'warning' }>;
  hasWarnings: boolean;
}
```

Use it inside CI or `tgraph doctor` to fail builds before generation touches the filesystem.

---

## NestAppModuleUpdater

Encapsulates the string gymnastics required to update `app.module.ts`.

### Common flow

```typescript
import { NestAppModuleUpdater } from '@tgraph/backend-generator';

const updater = new NestAppModuleUpdater();
const registrations = [{ name: 'User', importPath: './features/user/user.module' }];
let content = fs.readFileSync('src/app.module.ts', 'utf-8');
content = updater.updateImportStatements(content, registrations);
content = updater.updateImportsArray(content, registrations);
fs.writeFileSync('src/app.module.ts', content);
```

### Notable helpers

- `parseImportEntries(block)` – turns an auto-generated import block into `[name, line]` pairs.
- `buildImportStatement(modelName, importPath)` – generates a standard `import { ModelModule } ...`.
- `mergeImportEntries(existing, incoming)` – deduplicates modules.
- `updateImportsArray(content, registrations)` – injects `ModelModule` names between sentinel comments inside the `imports: []` array.

---

## NestModuleUpdater

Small helper that injects controllers/services into feature modules.

```typescript
import { NestModuleUpdater } from '@tgraph/backend-generator';

const updater = new NestModuleUpdater();
const imports = updater.generateModuleImportStatements('User', 'user', 'Admin', 'admin');
let content = fs.readFileSync('src/features/user/user.module.ts', 'utf-8');
content = updater.addImportsToModule(content, [imports.controllerImport, imports.serviceImport]);
content = updater.addToArrayInModule(content, 'controllers', ['UserAdminController']);
content = updater.addToArrayInModule(content, 'providers', ['UserAdminService']);
fs.writeFileSync('src/features/user/user.module.ts', content);
```

### Methods

- `generateModuleImportStatements(modelName, kebab, namingSuffix, fileSuffix)`
- `addImportsToModule(content, imports)`
- `addToArrayInModule(content, arrayName, items)`
- `findArrayInModule(content, arrayName)` – exposes the `[start, end]` span for custom modifications.

---

## Formatting Helpers

Run Prettier against generated files without reimplementing CLI calls.

```typescript
import {
  formatGeneratedFile,
  formatGeneratedFiles,
} from '@tgraph/backend-generator/dist/io/utils/format-files';

await formatGeneratedFile('src/features/user/user.admin.service.ts', process.cwd());
await formatGeneratedFiles(['fileA.ts', 'fileB.ts'], process.cwd());
```

Both helpers shell out to `npx prettier --write`. `formatGeneratedFiles` attempts a batched call first and falls back to per-file formatting if that fails.

---

## Prompt Helper

`promptUser(question: string, options?: { autoConfirm?: boolean; defaultValue?: boolean }): Promise<boolean>`

```typescript
import { promptUser } from '@tgraph/backend-generator/dist/io/utils/user-prompt';

const shouldCreate = await promptUser('Create module directory? (y/n): ', {
  autoConfirm: config.behavior.nonInteractive,
  defaultValue: true,
});
```

When `autoConfirm` is enabled the function logs the assumed answer and resolves immediately, which keeps CI jobs non-blocking.

---

## Related Reading

- [Generators](./generators.md) – see how these helpers are orchestrated.
- [Parsers](./parsers.md) – understand the metadata flowing into the utilities.
- [Configuration](./configuration.md) – source of truth for the `Config` consumed above.
