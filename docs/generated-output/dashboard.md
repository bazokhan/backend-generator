---
layout: default
title: tgraph dashboard
parent: Generated Output Reference
nav_order: 3
---

# `tgraph dashboard`

Generates React Admin resources from Prisma models tagged with `@tg_form()`.

## Swagger type generation

- Looks for `types/swagger.json` inside the configured dashboard directory (default `src/dashboard/src/types/swagger.json`).
- When the file exists, runs  
  `npx swagger-typescript-api generate -p "<swagger.json>" -o "<typesDir>" -n api.ts`  
  producing `types/api.ts`, overwriting any existing file.
- If `swagger.json` is missing or the generator fails, the command continues after logging a warning.
- Prettier formats `api.ts` when it is created.

## Resource directories

For each eligible model:

```text
<dashboardPath>/resources/<resource-name>/
├── <Model>NameList.tsx
├── <Model>NameEdit.tsx
├── <Model>NameCreate.tsx
├── <Model>NameShow.tsx
├── <Model>NameStudio.tsx
└── index.ts
```

- `<resource-name>` is kebab-case plural (e.g., `UserForm` → `user-forms`).
- If the resource folder already exists, the CLI prompts to delete it.
  - Answering `y` deletes the folder recursively and regenerates all files.
  - Answering `n` skips that model entirely.
- New folders are created with `fs.mkdirSync(..., { recursive: true })`.
- Every generated file is overwritten without merge logic and formatted via Prettier.

## Field directive configuration

- Writes `providers/fieldDirectives.generated.ts` beneath the dashboard path.
- The parent folder is created if necessary.
- The file is always overwritten with fresh content derived from the current schema.

## App component updates

- Reads `<dashboardPath>/App.tsx` and removes any previous auto-generated blocks.
- Appends updated sections:
  - `// AUTO-GENERATED IMPORTS` block importing all generated pages.
  - `{/* AUTO-GENERATED RESOURCES */}` block registering `<Resource>` elements.
  - `{/* AUTO-GENERATED CUSTOM ROUTES */}` block adding `<CustomRoutes>` entries for Studio pages.
- Adds `CustomRoutes` and `Route` imports when at least one resource is generated.
- If `App.tsx` is missing, the command throws an error.
- File is saved back to disk and formatted with Prettier.
