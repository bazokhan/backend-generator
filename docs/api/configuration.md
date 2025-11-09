---
layout: default
title: Configuration
parent: API Reference
nav_order: 4
---

# Configuration Reference

Every generator consumes the shared `Config` interface exported from `@tgraph/backend-generator`. This page documents every property, default, and practical tip so you can tailor the toolkit to any workspace layout.

---

## Quick Start

Run `tgraph init` inside your project to scaffold `tgraph.config.ts` with inline comments:

```bash
tgraph init
```

Or create the file manually:

```typescript
// tgraph.config.ts
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  input: {
    schemaPath: 'prisma/schema.prisma',
    prismaService: 'src/infrastructure/database/prisma.service.ts',
  },
  output: {
    backend: {
      dtos: 'src/dtos/generated',
      modules: {
        searchPaths: ['src/features', 'src/modules', 'src'],
        defaultRoot: 'src/features',
      },
      staticFiles: {
        guards: 'src/guards',
        decorators: 'src/decorators',
        dtos: 'src/dtos',
        interceptors: 'src/interceptors',
        utils: 'src/utils',
      },
    },
    dashboard: {
      root: 'src/dashboard/src',
      resources: 'src/dashboard/src/resources',
      swagger: {
        command: 'npm run generate:swagger',
        jsonPath: 'src/dashboard/src/types/swagger.json',
      },
    },
  },
  api: {
    suffix: 'Admin',
    prefix: 'tg-api',
    authentication: {
      enabled: true,
      requireAdmin: true,
      guards: [
        { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
      ],
      adminGuards: [
        { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
      ],
    },
    relations: {
      include: [], // or 'all' or ['author', 'comments']
    },
  },
  dashboard: {
    enabled: true,
    updateDataProvider: true,
    components: { form: {}, display: {} },
  },
  behavior: {
    nonInteractive: false,
  },
  paths: {
    appModule: 'src/app.module.ts',
    dataProvider: 'src/dashboard/src/providers/dataProvider.ts',
    appComponent: 'src/dashboard/src/App.tsx',
  },
};
```

You can export a default object or a named `config`; both are supported. Pass a different file via `tgraph api --config ./tgraph.public.config.ts` when you need multiple variants.

---

## Input

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `schemaPath` | `string` | `prisma/schema.prisma` | Path to the Prisma schema file. Relative paths are resolved from the workspace root (the directory containing `tgraph.config.ts`). |
| `prismaService` | `string` | `src/infrastructure/database/prisma.service.ts` | Location of the Nest `PrismaService` so generated services can import it with the correct relative path. |

---

## Output → Backend

### `output.backend.dtos`

Folder that receives response DTOs when running `tgraph dtos`. It is wiped before regeneration, so point it to a dedicated `generated` directory.

### `output.backend.modules`

| Property | Type | Default | Notes |
| -------- | ---- | ------- | ----- |
| `searchPaths` | `string[]` | `['src/features', 'src/modules', 'src']` | Ordered list of directories where `ModulePathResolver` looks for existing modules. Include monorepo paths such as `apps/api/src/features`. |
| `defaultRoot` | `string` | `src/features` | Directory that receives new module folders when one cannot be found. |

### `output.backend.staticFiles`

Directories used by `NestStaticGenerator` when it needs to copy guards, decorators, DTO utilities, interceptors, or helper functions. Keep these aligned with your project structure to avoid scattering generated files.

```typescript
staticFiles: {
  guards: 'src/guards',
  decorators: 'src/decorators',
  dtos: 'src/dtos',
  interceptors: 'src/interceptors',
  utils: 'src/utils',
}
```

---

## Output → Dashboard

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `root` | `string` | `src/dashboard/src` | Absolute or relative path to your React Admin app's `src` directory. |
| `resources` | `string` | `src/dashboard/src/resources` | Folder where the generator creates `<resource>/<page>.tsx` files. |

### `output.dashboard.swagger` (Optional)

Configures swagger.json generation for dashboard API type generation.

```typescript
swagger?: {
  command?: string;    // Command to regenerate swagger.json (default: 'npm run generate:swagger')
  jsonPath?: string;   // Path to swagger.json (default: '<dashboardRoot>/types/swagger.json')
}
```

**Example:**

```typescript
output: {
  dashboard: {
    root: 'src/dashboard/src',
    resources: 'src/dashboard/src/resources',
    swagger: {
      command: 'npm run docs:swagger',
      jsonPath: 'src/dashboard/types/swagger.json',
    },
  },
}
```

When you run `tgraph types`:
1. The command specified in `swagger.command` is executed to regenerate the swagger JSON
2. The generated `swagger.json` is read from `jsonPath`
3. TypeScript types are generated at `<dashboardRoot>/types/api.ts` using `swagger-typescript-api`

Use `tgraph types --skip-swagger` to bypass the swagger generation step if your swagger.json is already up to date.

---

## API Settings

### `api.suffix`

String appended to generated class and file names (e.g., `UserAdminService`, `user.admin.service.ts`). Use different suffixes when producing multiple variants (Admin vs Public).

### `api.prefix`

Route prefix applied to every controller (e.g., `/tg-api/users`). Combined with `getApiEndpoint` to build dashboard endpoint maps.

### `api.authentication`

```typescript
interface Guard {
  name: string;
  importPath: string;
}

authentication: {
  enabled: boolean;       // Wrap controllers with @UseGuards(...)
  requireAdmin: boolean;  // Whether admin-only guards are applied
  guards: Guard[];        // Base guards (always applied when enabled)
  adminGuards?: Guard[];  // Additional guards applied only when requireAdmin is true
}
```

**Behavior:**

- When `enabled` is `false`, no guards are imported or applied to controllers.
- When `enabled` is `true` but `requireAdmin` is `false`, only guards from the `guards` array are applied.
- When both `enabled` and `requireAdmin` are `true`, guards from both `guards` and `adminGuards` arrays are applied.
- The CLI ensures all guards are imported once, regardless of how many times they appear.

**Example configurations:**

```typescript
// Public API - no authentication
authentication: {
  enabled: false,
  requireAdmin: false,
  guards: [],
}

// User API - authentication but not admin-only
authentication: {
  enabled: true,
  requireAdmin: false,
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
  ],
}

// Admin API - authentication with admin requirement
authentication: {
  enabled: true,
  requireAdmin: true,
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
  ],
  adminGuards: [
    { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
  ],
}
```

Use the `--public` CLI flag to temporarily override authentication settings without editing the config file:

```bash
tgraph api --public  # Generates controllers without any guards
```

### `api.relations` (Optional)

Controls whether and which Prisma relation fields are included in service query selects.

```typescript
relations?: {
  include?: 'all' | string[];  // Relation field names to include, or 'all' for all relations
}
```

**Default:** No relations are included (empty array).

**Examples:**

```typescript
// Include all relations in service selects
api: {
  relations: {
    include: 'all',
  },
}

// Include specific relations only
api: {
  relations: {
    include: ['author', 'comments', 'tags'],
  },
}
```

**Behavior:**

When relations are included, the generated service `getSelectFields()` method will return a Prisma select object that includes the specified relations with their `id` and display field:

```typescript
// Without relations
getSelectFields() {
  return {
    id: true,
    title: true,
    content: true,
  };
}

// With relations: ['author']
getSelectFields() {
  return {
    id: true,
    title: true,
    content: true,
    author: { select: { id: true, name: true } },
  };
}
```

The generator automatically determines the display field for each relation based on:
1. `@tg.display` directive on the related model
2. `@tg.label` directive on the related model
3. Falls back to `id`

**Note:** Including relations affects all service methods (getAll, getOne, create, update). Consider performance implications when using `'all'` with deeply nested relations.

---

## Dashboard Settings

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `enabled` | `boolean` | `true` | Toggle React Admin generation. |
| `updateDataProvider` | `boolean` | `true` | Whether `ApiGenerator` should rewrite the endpoint map inside the dashboard data provider. |
| `components` | `ComponentOverrides` | `{ form: {}, display: {} }` | Map default React Admin components (TextInput, NumberField, etc.) to custom imports. |

```typescript
interface ComponentImport {
  name: string;        // e.g., 'RichTextInput'
  importPath: string;  // e.g., '@/components/forms/RichTextInput'
}

interface ComponentOverrides {
  form?: {
    TextInput?: ComponentImport;
    NumberInput?: ComponentImport;
    BooleanInput?: ComponentImport;
    DateTimeInput?: ComponentImport;
    SelectInput?: ComponentImport;
    ReferenceInput?: ComponentImport;
    ReferenceArrayInput?: ComponentImport;
    AutocompleteInput?: ComponentImport;
    AutocompleteArrayInput?: ComponentImport;
    JsonInput?: ComponentImport;
    FileInput?: ComponentImport;
    UrlInput?: ComponentImport;
  };
  display?: {
    TextField?: ComponentImport;
    NumberField?: ComponentImport;
    BooleanField?: ComponentImport;
    DateField?: ComponentImport;
    DateTimeField?: ComponentImport;
    SelectField?: ComponentImport;
    ReferenceField?: ComponentImport;
    JsonField?: ComponentImport;
    FileField?: ComponentImport;
    UrlField?: ComponentImport;
  };
}
```

Example override:

```typescript
components: {
  form: {
    TextInput: { name: 'RichTextInput', importPath: '@/components/forms/RichTextInput' },
  },
}
```

The generator automatically updates both the imports and JSX usage whenever it sees an override.

---

## Behavior Flags

### `behavior.nonInteractive`

When `true`, every prompt auto-confirms using `PromptUserOptions.defaultValue` (defaults to `true`). This is ideal for CI pipelines or scripted scaffolds where no manual input is possible.

---

## Optional Path Overrides

`paths` lets you short-circuit discovery when files live in non-standard locations:

| Property | Purpose |
| -------- | ------- |
| `appModule` | Absolute or relative path to `app.module.ts`. |
| `dataProvider` | Path to `dataProvider.ts` for endpoint map updates. |
| `appComponent` | Path to `App.tsx` (or `.jsx/.ts`) used by the dashboard generator. |

If omitted, `ProjectPathResolver` scans common locations and falls back to filesystem searches.

---

## Multiple Configurations

You can maintain separate configs for admin vs public APIs or for different workspaces:

```typescript
// tgraph.admin.config.ts
export const config: Config = {
  /* ...common settings... */
  api: { suffix: 'Admin', prefix: 'admin-api', authentication: { enabled: true, requireAdmin: true, guards: [...] } },
};

// tgraph.public.config.ts
export const config: Config = {
  /* ...common settings... */
  api: { suffix: 'Public', prefix: 'api', authentication: { enabled: true, requireAdmin: false, guards: [...] } },
  dashboard: { enabled: false, updateDataProvider: false, components: { form: {}, display: {} } },
};
```

Run them explicitly:

```bash
tgraph api --config tgraph.admin.config.ts
tgraph api --config tgraph.public.config.ts
```

---

## Tips

- Keep `output.backend.modules.searchPaths` ordered from most to least specific so the resolver finds modules in the right package.
- Commit `tgraph.config.ts`—it documents paths for the whole team and keeps automated runs reproducible.
- Pair `PreflightChecker` (via `tgraph doctor`) with the config file to validate paths before triggering large generations.

---

## Related Docs

- [Generators](./generators.md) – see how each section of the config is consumed.
- [Utilities](./utilities.md) – path resolvers, config loader, and helpers that rely on these values.
- [CLI Reference](../cli-reference.md) – flags that allow temporary overrides.
