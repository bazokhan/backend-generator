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
    prisma: {
      schemaPath: 'prisma/schema.prisma',
      servicePath: 'src/infrastructure/database/prisma.service.ts',
    },
    dashboard: {
      components: { form: {}, display: {} },
    },
  },
  output: {
    backend: {
      root: 'src/features',
      dtosPath: 'src/dtos/generated',
      modulesPaths: ['src/features', 'src/modules', 'src'],
      guardsPath: 'src/guards',
      decoratorsPath: 'src/decorators',
      interceptorsPath: 'src/interceptors',
      utilsPath: 'src/utils',
      appModulePath: 'src/app.module.ts',
    },
    dashboard: {
      enabled: true,
      updateDataProvider: true,
      root: 'src/dashboard/src',
      resourcesPath: 'src/dashboard/src/resources',
      swaggerJsonPath: 'src/dashboard/src/types/swagger.json',
      apiPath: 'src/dashboard/src/types/api.ts',
      appComponentPath: 'src/dashboard/src/App.tsx',
      dataProviderPath: 'src/dashboard/src/providers/dataProvider.ts',
    },
  },
  api: {
    suffix: 'Admin',
    prefix: 'tg-api',
    authenticationEnabled: true,
    requireAdmin: true,
    guards: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }],
    adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
  },
  behavior: {
    nonInteractive: false,
  },
};
```

You can export a default object or a named `config`; both are supported. Pass a different file via `tgraph api --config ./tgraph.public.config.ts` when you need multiple variants.

---

## Input

### Prisma Input

| Property                   | Type     | Default                                         | Description                                                                                                                        |
| -------------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `input.prisma.schemaPath`  | `string` | `prisma/schema.prisma`                          | Path to the Prisma schema file. Relative paths are resolved from the workspace root (the directory containing `tgraph.config.ts`). |
| `input.prisma.servicePath` | `string` | `src/infrastructure/database/prisma.service.ts` | Location of the Nest `PrismaService` so generated services can import it with the correct relative path.                           |

### Dashboard Input

| Property                     | Type                 | Default                     | Description                                                                                                               |
| ---------------------------- | -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `input.dashboard.components` | `ComponentOverrides` | `{ form: {}, display: {} }` | Override default React Admin components. Used for custom styling or behavior. See Dashboard Settings section for details. |

---

## Output → Backend

| Property                          | Type       | Default                                  | Description                                                                                                                                       |
| --------------------------------- | ---------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `output.backend.root`             | `string`   | `src/features`                           | Default directory for creating new modules when a model doesn't have an existing module.                                                          |
| `output.backend.dtosPath`         | `string`   | `src/dtos/generated`                     | Folder that receives response DTOs when running `tgraph dtos`. It is wiped before regeneration, so point it to a dedicated `generated` directory. |
| `output.backend.modulesPaths`     | `string[]` | `['src/features', 'src/modules', 'src']` | Ordered list of directories where `ModulePathResolver` looks for existing modules. Include monorepo paths such as `apps/api/src/features`.        |
| `output.backend.guardsPath`       | `string`   | `src/guards`                             | Directory for guard files used by `NestStaticGenerator`.                                                                                          |
| `output.backend.decoratorsPath`   | `string`   | `src/decorators`                         | Directory for decorator files used by `NestStaticGenerator`.                                                                                      |
| `output.backend.interceptorsPath` | `string`   | `src/interceptors`                       | Directory for interceptor files used by `NestStaticGenerator`.                                                                                    |
| `output.backend.utilsPath`        | `string`   | `src/utils`                              | Directory for utility files used by `NestStaticGenerator`.                                                                                        |
| `output.backend.appModulePath`    | `string`   | `src/app.module.ts`                      | (Optional) Path to `app.module.ts`. Auto-discovered if not specified.                                                                             |

---

## Output → Dashboard

| Property                              | Type      | Default                                       | Description                                                                                |
| ------------------------------------- | --------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `output.dashboard.enabled`            | `boolean` | `true`                                        | Whether to generate dashboard resources.                                                   |
| `output.dashboard.updateDataProvider` | `boolean` | `true`                                        | Whether `ApiGenerator` should rewrite the endpoint map inside the dashboard data provider. |
| `output.dashboard.root`               | `string`  | `src/dashboard/src`                           | Absolute or relative path to your React Admin app's `src` directory.                       |
| `output.dashboard.resourcesPath`      | `string`  | `src/dashboard/src/resources`                 | Folder where the generator creates `<resource>/<page>.tsx` files.                          |
| `output.dashboard.swaggerJsonPath`    | `string`  | `src/dashboard/src/types/swagger.json`        | Path to output the generated swagger.json file.                                            |
| `output.dashboard.apiPath`            | `string`  | `src/dashboard/src/types/api.ts`              | Path to output the generated api.ts file.                                                  |
| `output.dashboard.appComponentPath`   | `string`  | `src/dashboard/src/App.tsx`                   | (Optional) Path to App component file. Auto-discovered if not specified.                   |
| `output.dashboard.dataProviderPath`   | `string`  | `src/dashboard/src/providers/dataProvider.ts` | (Optional) Path to data provider file. Auto-discovered if not specified.                   |

---

## API Settings

| Property                    | Type      | Default  | Description                                                                                                                                                                       |
| --------------------------- | --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.suffix`                | `string`  | `''`     | String appended to generated class and file names (e.g., `UserAdminService`, `user.admin.service.ts`). Use different suffixes when producing multiple variants (Admin vs Public). |
| `api.prefix`                | `string`  | `tg-api` | Route prefix applied to every controller (e.g., `/tg-api/users`). Combined with `getApiEndpoint` to build dashboard endpoint maps.                                                |
| `api.authenticationEnabled` | `boolean` | `true`   | Whether to add authentication guards to generated controllers. When `false`, no guards are imported or applied.                                                                   |
| `api.requireAdmin`          | `boolean` | `true`   | Whether endpoints require admin role. When `true` and `authenticationEnabled` is `true`, guards from both `guards` and `adminGuards` arrays are applied.                          |
| `api.guards`                | `Guard[]` | `[]`     | Base guards applied when `authenticationEnabled` is `true`. Each guard has `name` and `importPath` properties.                                                                    |
| `api.adminGuards`           | `Guard[]` | `[]`     | Additional guards applied only when both `authenticationEnabled` and `requireAdmin` are `true`.                                                                                   |

**Guard Interface:**

```typescript
interface Guard {
  name: string; // Guard class name, e.g., 'JwtAuthGuard'
  importPath: string; // Import path, e.g., '@/guards/jwt-auth.guard'
}
```

**Example configurations:**

```typescript
// Public API - no authentication
api: {
  suffix: 'Public',
  prefix: 'api',
  authenticationEnabled: false,
  requireAdmin: false,
  guards: [],
  adminGuards: [],
}

// User API - authentication but not admin-only
api: {
  suffix: '',
  prefix: 'api',
  authenticationEnabled: true,
  requireAdmin: false,
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
  ],
  adminGuards: [],
}

// Admin API - authentication with admin requirement
api: {
  suffix: 'Admin',
  prefix: 'admin-api',
  authenticationEnabled: true,
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

---

## Behavior Flags

| Property                  | Type      | Default | Description                                                                                                                                                                                  |
| ------------------------- | --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `behavior.nonInteractive` | `boolean` | `false` | When `true`, every prompt auto-confirms using `PromptUserOptions.defaultValue` (defaults to `true`). This is ideal for CI pipelines or scripted scaffolds where no manual input is possible. |

---

## Component Overrides

Component overrides are configured in `input.dashboard.components` and allow you to replace default React Admin components with custom implementations:

```typescript
interface ComponentImport {
  name: string; // e.g., 'RichTextInput'
  importPath: string; // e.g., '@/components/forms/RichTextInput'
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

**Example:**

```typescript
input: {
  prisma: { schemaPath: 'prisma/schema.prisma', servicePath: 'src/infrastructure/database/prisma.service.ts' },
  dashboard: {
    components: {
      form: {
        TextInput: { name: 'RichTextInput', importPath: '@/components/forms/RichTextInput' },
      },
      display: {
        TextField: { name: 'CustomTextField', importPath: '@/components/fields/TextField' },
      },
    },
  },
}
```

The generator automatically updates both the imports and JSX usage whenever it sees an override.

---

## Multiple Configurations

You can maintain separate configs for admin vs public APIs or for different workspaces:

```typescript
// tgraph.admin.config.ts
export const config: Config = {
  input: {
    prisma: { schemaPath: 'prisma/schema.prisma', servicePath: 'src/infrastructure/database/prisma.service.ts' },
    dashboard: { components: { form: {}, display: {} } },
  },
  output: {
    backend: {
      root: 'src/features',
      dtosPath: 'src/dtos/generated',
      modulesPaths: ['src/features'],
      // ... other paths
    },
    dashboard: {
      enabled: true,
      updateDataProvider: true,
      root: 'src/dashboard/src',
      resourcesPath: 'src/dashboard/src/resources',
      // ... other paths
    },
  },
  api: {
    suffix: 'Admin',
    prefix: 'admin-api',
    authenticationEnabled: true,
    requireAdmin: true,
    guards: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }],
    adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
  },
  behavior: { nonInteractive: false },
};

// tgraph.public.config.ts
export const config: Config = {
  input: {
    prisma: { schemaPath: 'prisma/schema.prisma', servicePath: 'src/infrastructure/database/prisma.service.ts' },
    dashboard: { components: { form: {}, display: {} } },
  },
  output: {
    backend: {
      root: 'src/features',
      dtosPath: 'src/dtos/generated/public',
      modulesPaths: ['src/features'],
      // ... other paths
    },
    dashboard: {
      enabled: false,
      updateDataProvider: false,
      root: 'src/dashboard/src',
      resourcesPath: 'src/dashboard/src/resources',
      // ... other paths
    },
  },
  api: {
    suffix: 'Public',
    prefix: 'api',
    authenticationEnabled: false,
    requireAdmin: false,
    guards: [],
    adminGuards: [],
  },
  behavior: { nonInteractive: false },
};
```

Run them explicitly:

```bash
tgraph api --config tgraph.admin.config.ts
tgraph api --config tgraph.public.config.ts
```

---

## Tips

- Keep `output.backend.modulesPaths` ordered from most to least specific so the resolver finds modules in the right package.
- Commit `tgraph.config.ts`—it documents paths for the whole team and keeps automated runs reproducible.
- Run `tgraph doctor` to validate paths and configuration before triggering large generations.
- Use `tgraph init` to generate a properly structured configuration file with helpful comments.

---

## Related Docs

- [Generators](./generators.md) – see how each section of the config is consumed.
- [Utilities](./utilities.md) – path resolvers, config loader, and helpers that rely on these values.
- [CLI Reference](../cli-reference.md) – flags that allow temporary overrides.
