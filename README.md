# schema-form-generator

Transform a Prisma schema into a fully wired NestJS backend and React Admin dashboard with a single command. This toolkit discovers your project structure, scaffolds DTOs, services, controllers, and UI resources, and keeps your AppModule and data provider files in sync. Use it from the CLI or embed the generators in your own build pipeline.

## Features

- **API generation** – Build NestJS modules, controllers, services, DTOs, and update `AppModule` imports automatically.
- **Dashboard generation** – Scaffold React Admin CRUD pages, studio routes, and field directive configurations.
- **DTO generation** – Produce type-safe response DTOs tagged as auto-generated for safe regeneration.
- **Smart project introspection** – Locate feature modules in `src/features` or `src/infrastructure`, preserving manual code while inserting auto-generated sections.
- **Composable architecture** – Generator, parser, directive, and IO utilities are exposed for custom workflows.
- **Ready-to-ship CLI** – Install once, run anywhere through the `schema-form-generator` command.

## Requirements

- Node.js **18.0.0 or newer**
- npm **9.x** or newer (or any package manager that supports Node 18+)
- A NestJS + React Admin workspace that follows (or can be configured to follow) the folder standards outlined below.

## Installation

Install as a project dependency (recommended):

```bash
npm install --save-dev schema-form-generator
```

Install globally to share the CLI across multiple projects:

```bash
npm install --global schema-form-generator
```

The package ships precompiled JavaScript in `dist/` after running `npm run build`.

## Configuration

The package ships with a default `config.ts`:

```ts
import type { Config } from '@tg-scripts/types';

export const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
};
```

Override values in two ways:

1. **Edit `config.ts`** in your project (recommended for shared defaults).
2. **Pass CLI flags** when invoking commands (see the CLI reference below).

> ⚠️ The generators expect feature modules under `src/features/<kebab-name>` or `src/infrastructure/<kebab-name>`. Adjust `ModulePathResolver` if your layout differs.

## CLI Usage

Run `schema-form-generator --help` to see usage:

```
schema-form-generator <command> [options]
```

### Commands

- `api` – Generate NestJS modules, services, controllers, DTOs, and update data provider endpoints.
- `dashboard` – Generate React Admin resources, studio pages, and field directive configuration.
- `dtos` – Generate DTO response files only.
- `all` – Run `api`, `dashboard`, and `dtos` sequentially with the same configuration.

### Options

| Flag | Description |
|------|-------------|
| `--schema <path>` | Override the Prisma schema path. |
| `--dashboard <path>` | Override the React Admin dashboard source directory. |
| `--dtos <path>` | Override the DTO output directory. |
| `--suffix <name>` | Override the suffix appended to generated classes and files. |
| `--admin` / `--no-admin` | Force admin or public mode (`Config.isAdmin`). |
| `--update-data-provider` / `--no-update-data-provider` | Toggle automatic data provider updates. |
| `-h`, `--help` | Display the help message. |

### Examples

Generate everything with defaults:

```bash
schema-form-generator all
```

Generate API files using a custom schema and DTO directory, skipping data provider updates:

```bash
schema-form-generator api \
  --schema apps/core/prisma/schema.prisma \
  --dtos apps/admin/src/dtos \
  --no-update-data-provider
```

Generate dashboard pages for a public surface area:

```bash
schema-form-generator dashboard --no-admin
```

## Programmatic API

Import generators directly to script custom workflows:

```ts
import {
  ApiGenerator,
  DashboardGenerator,
  DtoGenerator,
  ModulePathResolver,
  NestAppModuleUpdater,
  NestModuleUpdater,
  DataProviderEndpointGenerator,
  config as defaultConfig,
} from 'schema-form-generator';

(async () => {
  const api = new ApiGenerator({ ...defaultConfig, suffix: 'Admin' });
  await api.generate();

  const dashboard = new DashboardGenerator(defaultConfig);
  await dashboard.generate();

  const dtos = new DtoGenerator({ ...defaultConfig, suffix: 'Public', isAdmin: false });
  dtos.generate();
})();
```

### Core building blocks

- **Generators** (`ApiGenerator`, `DashboardGenerator`, `DtoGenerator`) orchestrate high-level flows.
- **Parsers** (e.g., `PrismaSchemaParser`, `NestAppModuleParser`) analyze existing code to preserve manual edits.
- **IO utilities** (`ModulePathResolver`) locate module files and folders on disk.
- **Directive writers** (e.g., `buildFieldDirectiveFile`) encapsulate React Admin directive logic.
- **Updater classes** (`NestAppModuleUpdater`, `NestModuleUpdater`, `DataProviderEndpointGenerator`) expose focused operations for manual integrations.

You can mix and match these primitives to design bespoke pipelines or integrate with other generators.

## Expected Project Layout

The default heuristics assume the following structure (customize `ModulePathResolver` if needed):

```
src/
  app.module.ts
  features/
    user/
      user.module.ts
    post/
      post.module.ts
  infrastructure/
    database/
      database.module.ts
dashboard/
  src/
    App.tsx
    providers/
      dataProvider.ts
```

- DTOs are generated alongside their owning module (e.g., `src/features/user`).
- AppModule updates insert auto-generated import blocks bounded by `// AUTO-GENERATED IMPORTS START/END`.
- Dashboard routes and resources are inserted between `AUTO-GENERATED` sentinel comments; manual content remains intact.

## Development Scripts

Clone the repository and install dependencies, then:

| Command | Description |
|---------|-------------|
| `npm run build` | Emit CommonJS bundles and declaration files to `dist/`. |
| `npm test` | Run the Jest test suite (requires Node 18+). |

> Jest snapshots live next to their corresponding spec files. When updating behaviour, run tests with `--updateSnapshot`.

## Troubleshooting

- **Missing modules** – The CLI prompts to create feature folders when a Prisma model has no matching module. Answer “y” to scaffold the module file automatically.
- **Formatting issues** – The generators call the formatting helpers in `src/io/utils`. Ensure your workspace can run Prettier or adjust `formatGeneratedFile(s)` as needed.
- **Non-standard structure** – Override `ModulePathResolver` or pass a custom implementation to your own scripts if modules live outside `src/features` or `src/infrastructure`.
- **Node version errors** – Upgrade to Node 18+ to satisfy dependencies that rely on modern language features (optional chaining, `node:` protocol imports, etc.).

## License

ISC © Current project authors. Use it in your own automation pipelines, extend it, or contribute back improvements.
