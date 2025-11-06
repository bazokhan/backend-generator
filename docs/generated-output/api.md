---
layout: default
title: tgraph api
parent: Generated Output Reference
nav_order: 2
---

# `tgraph api`

Runs the full NestJS backend generator for every Prisma model tagged with `@tg_form()`.

## Static backend utilities

```text
src/
├── decorators/
│   ├── is-admin.decorator.ts
│   └── paginated-search.decorator.ts
├── dtos/
│   ├── api-response.dto.ts
│   ├── paginated-search-query.dto.ts
│   └── paginated-search-result.dto.ts
├── guards/
│   └── admin.guard.ts
└── interceptors/
    └── pagiantion.interceptor.ts
```

- Written at the start of every run by `NestStaticGenerator`.
- Each file is overwritten in place; there is no merge step and no backup.
- Sub-folders must already exist. If, for example, `src/guards` is missing, `fs.promises.writeFile` throws and the command fails.
- After writing, `npx prettier --write` runs on the touched files (warnings appear if formatting fails).

## Module directories & generated artifacts

For every model with `@tg_form()`:

1. **Locate module folder**  
   Searches all configured paths in `output.backend.modules.searchPaths` using camelCase, kebab-case, and plural variants.
2. **Optional creation**  
   If nothing is found, the CLI prompts:  
   `Do you want to create the module directory for <Model>? (y/n)`  
   - `y`: creates `<defaultRoot>/<kebab-name>/` (based on `output.backend.modules.defaultRoot`) and seeds a module file.  
   - `n`: skips this model entirely.

Once a module path exists, the following files are written (overwriting any existing versions):

```text
<modulePath>/
├── create-<camelName>[.<suffix>].dto.ts
├── update-<camelName>[.<suffix>].dto.ts
├── <camelName>[.<suffix>].service.ts
└── <camelName>[.<suffix>].controller.ts
```

- `<camelName>` is the lower camel case form of the model name.
- `[.<suffix>]` is appended when `config.suffix` is set (e.g., default `Tg` ⇒ `.tg`).
- DTO files are tagged with the `AUTO-GENERATED FILE` notice.
- Password fields (`password` or fields with `@tg_format(password)`) are omitted from services.
- Prettier is invoked on the freshly written files; failures only emit warnings.

## Module wiring updates

- If a module folder exists but no `.module.ts` file is present, one is generated using the suffix-aware template.
- Existing module files are updated in-place:
  - Missing controller/service imports are injected after the last import statement.
  - Controllers and providers arrays gain the generated classes if they were absent.
- When new module folders are auto-created, the AppModule file (defaults to `src/app.module.ts`) is rewritten. Override with `paths.appModule` if needed:
  - An `// AUTO-GENERATED IMPORTS` block is created or extended with `<Model>Module` imports.
  - The `imports: []` array gains an auto-generated block listing those modules.
- All edits are textual; manual additions outside the auto-generated sections remain untouched.

## Dashboard data provider sync (optional)

- Triggered only if `config.updateDataProvider !== false`.
- Rewrites the dashboard data provider (defaults to `src/dashboard/src/providers/dataProvider.ts`, configurable via `paths.dataProvider`) by replacing the `const endpointMap` object with:
  - `// Auto-generated API endpoints` block listing each generated controller route.
  - `// Custom endpoints` block containing any pre-existing entries that were not in the auto-generated section.
- If the `endpointMap` declaration is missing, a warning is logged and the file is left unchanged.
- File is formatted with Prettier after the rewrite.
