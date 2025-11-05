---
layout: default
title: Configuration
parent: API Reference
nav_order: 4
---

# Configuration

Complete configuration reference for TGraph Backend Generator.

## Configuration Object

```typescript
interface Config {
  schemaPath: string;
  dashboardPath: string;
  dtosPath: string;
  suffix: string;
  isAdmin?: boolean;
  updateDataProvider?: boolean;
  nonInteractive?: boolean;
  paths?: {
    appModule?: string;
    moduleRoots?: Partial<Record<'features' | 'infrastructure', string[]>>;
    dashboard?: {
      appComponent?: string;
      dataProvider?: string;
    };
  };
}
```

## Configuration Properties

### `schemaPath`

Path to the Prisma schema file.

**Type:** `string`  
**Default:** `'prisma/schema.prisma'`  
**Required:** Yes

**Examples:**

```typescript
// Standard location
schemaPath: 'prisma/schema.prisma';

// Monorepo
schemaPath: 'apps/api/prisma/schema.prisma';

// Custom location
schemaPath: 'database/schema.prisma';
```

---

### `dashboardPath`

Path to the React Admin dashboard source directory.

**Type:** `string`  
**Default:** `'src/dashboard/src'`  
**Required:** Yes

**Examples:**

```typescript
// Standard location
dashboardPath: 'src/dashboard/src';

// Monorepo
dashboardPath: 'apps/admin/src';

// Custom location
dashboardPath: 'frontend/admin/src';
```

---

### `dtosPath`

Path to the DTO output directory.

**Type:** `string`  
**Default:** `'src/dtos/generated'`  
**Required:** Yes

**Examples:**

```typescript
// Standard location
dtosPath: 'src/dtos/generated';

// Separate directory
dtosPath: 'src/common/dtos';

// Monorepo
dtosPath: 'apps/api/src/dtos';
```

---

### `suffix`

Suffix appended to generated class names and files.

**Type:** `string`  
**Default:** `'Tg'`  
**Required:** Yes

**Impact:**

- Class names: `User{Suffix}Service`, `User{Suffix}Controller`
- DTOs: `CreateUser{Suffix}Dto`, `UpdateUser{Suffix}Dto`
- Files: `user.{suffix}.service.ts`, `user.{suffix}.controller.ts`

**Examples:**

```typescript
// Default
suffix: 'Tg';
// → UserTgService, user.tg.service.ts

// Admin API
suffix: 'Admin';
// → UserAdminService, user.admin.service.ts

// Business logic
suffix: 'Bz';
// → UserBzService, user.bz.service.ts

// Public API
suffix: 'Public';
// → UserPublicService, user.public.service.ts
```

---

### `isAdmin`

Whether to generate admin-only endpoints with authentication guards.

**Type:** `boolean`  
**Default:** `true`  
**Required:** No

**Impact:**

**When `true`:**

```typescript
@Controller('tg-api/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserTgController {}
```

**When `false`:**

```typescript
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UserTgController {}
```

**Examples:**

```typescript
// Admin API - requires admin role
isAdmin: true;

// Public API - any authenticated user
isAdmin: false;
```

---

### `updateDataProvider`

Whether to automatically update data provider endpoint mappings.

**Type:** `boolean`  
**Default:** `true`  
**Required:** No

**Impact:**

**When `true`:**

- Automatically updates `src/dashboard/src/providers/dataProvider.ts`
- Adds endpoint mappings for generated resources
- Preserves manual mappings

**When `false`:**

- Skips data provider updates
- You must manually add endpoint mappings

**Examples:**

```typescript
// Auto-update data provider (recommended)
updateDataProvider: true;

// Manual data provider management
updateDataProvider: false;
```

---

### `nonInteractive`

Automatically accept CLI prompts during generation. Useful for CI/CD pipelines or scripted environments where interactive input is not possible.

**Type:** `boolean`  
**Default:** `false`  
**Required:** No

**Impact:**

- Creates missing NestJS module directories without prompting.
- Regenerates existing dashboard resource folders automatically.
- Ensures generator commands do not hang waiting for user input.

**Examples:**

```typescript
// Enable non-interactive mode (always answer "yes")
nonInteractive: true;

// Keep interactive prompts
nonInteractive: false;
```

---

### `paths`

Optional overrides for project discovery. TGraph auto-detects standard layouts (e.g., `src/app.module.ts`, `src/features/*`, `src/dashboard/src/App.tsx`). Use `paths` when your project deviates from these conventions or lives inside a monorepo.

All paths can be absolute or relative to the workspace root.

```typescript
paths: {
  appModule: 'apps/api/src/app.module.ts',
  moduleRoots: {
    features: ['apps/api/src/modules/features', 'libs/shared/src/features'],
    infrastructure: ['apps/api/src/modules/infrastructure'],
  },
  dashboard: {
    appComponent: 'apps/admin/src/App.tsx',
    dataProvider: 'apps/admin/src/providers/dataProvider.ts',
  },
}
```

#### `paths.appModule`

Direct path to the NestJS root module. When omitted, the generator searches common locations (e.g., `src/app.module.ts`, `apps/*/src/app.module.ts`).

Set this when your AppModule lives outside standard folders so auto-imports continue to work.

#### `paths.moduleRoots`

Explicit module root directories for feature and infrastructure modules. Provide one or more directories for each key. The generator searches these first before falling back to discovery.

```typescript
moduleRoots: {
  features: ['apps/api/src/modules', 'libs/domains/src/features'],
  infrastructure: ['apps/api/src/infrastructure'],
}
```

- The first configured path is used when creating new modules.
- Additional paths are scanned when locating existing modules.

#### `paths.dashboard.appComponent`

Location of the React Admin entrypoint that should receive generated `<Resource />` registrations. Defaults to `App.tsx` inside `dashboardPath`, but you can point to any file.

#### `paths.dashboard.dataProvider`

Path to the React Admin data provider file. When `updateDataProvider` is `true`, this file is updated with new endpoint mappings. Configure this if your provider lives outside `providers/dataProvider.ts` under `dashboardPath`.

> 💡 Tip: Run `tgraph preflight` to see how discovery resolved each path before you generate anything.

---

## Configuration Files

### Configuration File Requirement

**Important:** The CLI requires a configuration file to run any generation commands (`api`, `dashboard`, `dtos`, `all`).

If you try to run a command without a config file, you'll see:

```
❌ Error: No configuration file found.
   Run 'tgraph init' to create a configuration file.
   Expected file: tgraph.config.ts or tgraph.config.js in project root.
```

### Initializing Configuration

Create a configuration file using:

```bash
tgraph init
```

This generates `tgraph.config.ts` in your project root with comprehensive inline documentation.

### Config File Discovery

The CLI searches for configuration files in your project root (`process.cwd()`) in this order:

1. `tgraph.config.ts` (TypeScript)
2. `tgraph.config.js` (JavaScript)

The first file found is loaded and used.

### Default Values

When you run `tgraph init`, it creates a configuration file with these default values:

```typescript
// tgraph.config.ts
export const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};
```

**Note:** A configuration file is required. The package no longer includes fallback defaults to ensure explicit configuration.

### Project Configuration

Your project configuration file (`tgraph.config.ts`):

```typescript
// tgraph.config.ts
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Admin',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};
```

**Supported export formats:**

```typescript
// Named export (recommended)
export const config: Config = { ... };

// Default export (also supported)
export default { ... };
```

### Multiple Configurations

For programmatic usage, you can create separate configs for different environments:

```typescript
// config/generator.dev.ts
export const devConfig: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/dev',
  suffix: 'Dev',
  isAdmin: false,
  updateDataProvider: true,
};

// config/generator.prod.ts
export const prodConfig: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/prod',
  suffix: 'Prod',
  isAdmin: true,
  updateDataProvider: true,
};
```

Use in scripts:

```typescript
// scripts/generate-dev.ts
import { ApiGenerator } from '@tgraph/backend-generator';
import { devConfig } from '../config/generator.dev';

const generator = new ApiGenerator(devConfig);
await generator.generate();
```

**Note:** For CLI usage, only `tgraph.config.ts` or `tgraph.config.js` in the project root is loaded. Use environment variables or CLI flags for environment-specific overrides.

---

## CLI Configuration Override

CLI flags override configuration file values:

```bash
# Use project config but override suffix
tgraph api --suffix Custom

# Override multiple options
tgraph all --suffix Admin --no-update-data-provider

# Override paths
tgraph api \
  --schema apps/api/prisma/schema.prisma \
  --dtos apps/api/src/dtos
```

**Priority Order:**

1. CLI flags (highest)
2. Project config file (`tgraph.config.ts` or `tgraph.config.js`)
3. Package defaults (lowest)

## Config File Loading

The config loader (`config-loader.ts`) handles loading and validation:

**Loading process:**

1. Searches for `tgraph.config.ts` in `process.cwd()`
2. If not found, searches for `tgraph.config.js`
3. Uses `require()` to dynamically load the config module
4. Validates required fields (`schemaPath`, `dashboardPath`, `dtosPath`, `suffix`)
5. Returns the loaded and validated config

**Error handling:**

- Missing required fields: Shows error with field name
- Invalid syntax: Shows parse error
- Invalid suffix format: Shows warning if not PascalCase
- File not found: Uses package defaults (with warning for CLI usage)

---

## Environment-Based Configuration

Use environment variables for dynamic configuration:

```typescript
// tgraph.config.ts
import type { Config } from '@tgraph/backend-generator';

const env = process.env.NODE_ENV || 'development';

export const config: Config = {
  schemaPath: process.env.PRISMA_SCHEMA || 'prisma/schema.prisma',
  dashboardPath: process.env.DASHBOARD_PATH || 'src/dashboard/src',
  dtosPath: `src/dtos/${env}`,
  suffix: env === 'production' ? 'Prod' : 'Dev',
  isAdmin: env === 'production',
  updateDataProvider: true,
};
```

Use:

```bash
NODE_ENV=production npm run generate
```

---

## Validation

The CLI automatically validates your configuration when loading. For programmatic usage, you can add custom validation:

```typescript
import { existsSync } from 'fs';

function validateConfig(config: Config): void {
  if (!existsSync(config.schemaPath)) {
    throw new Error(`Schema file not found: ${config.schemaPath}`);
  }

  if (!existsSync(config.dashboardPath)) {
    console.warn(`Dashboard path not found: ${config.dashboardPath}`);
  }

  if (config.suffix.length === 0) {
    throw new Error('Suffix cannot be empty');
  }

  if (!/^[A-Z][a-zA-Z0-9]*$/.test(config.suffix)) {
    throw new Error('Suffix must be PascalCase (e.g., "Admin", "Public")');
  }
}

validateConfig(config);
```

**Built-in validation:**

The config loader automatically validates:
- Required fields presence
- Suffix format (warns if not PascalCase)
- Config file syntax (shows parse errors)

---

## Best Practices

### 1. Initialize Config First

Always start by initializing your configuration:

```bash
tgraph init
```

This ensures you have the correct file name and structure.

### 2. Version Control Configuration

Commit your config file to version control:

```bash
git add tgraph.config.ts
git commit -m "Add tgraph configuration"
```

This ensures all team members use the same configuration.

### 3. Document Custom Paths

The generated config file includes inline comments. Customize them for your project structure:

```typescript
export const config: Config = {
  // Custom monorepo structure
  schemaPath: 'apps/api/prisma/schema.prisma',

  // Separate admin dashboard
  dashboardPath: 'apps/admin-panel/src',

  // Shared DTOs directory
  dtosPath: 'libs/shared/dtos',

  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
};
```

### 4. Separate Configs for Programmatic Usage

For SDK usage with multiple environments, create separate config files:

```typescript
// config/admin.config.ts
export const adminConfig: Config = {
  suffix: 'Admin',
  isAdmin: true,
  // ...
};

// config/public.config.ts
export const publicConfig: Config = {
  suffix: 'Public',
  isAdmin: false,
  dtosPath: 'src/dtos/public',
  // ...
};
```

Import these in your scripts rather than using the CLI.

---

## Next Steps

- **[Generators API](./generators.md)** – Generator classes
- **[SDK Reference](../sdk-reference.md)** – Programmatic usage
- **[CLI Reference](../cli-reference.md)** – Command-line usage
