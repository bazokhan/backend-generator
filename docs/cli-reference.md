---
layout: default
title: CLI Reference
nav_order: 6
---

# CLI Reference

Complete reference for the `tgraph` command-line interface.

## Installation

```bash
# Project dependency
npm install --save-dev @tgraph/backend-generator

# Global installation
npm install -g @tgraph/backend-generator
```

## Usage

```bash
tgraph <command> [options]
```

## Commands

### `tgraph api`

Generate NestJS backend files: controllers, services, DTOs, and update AppModule imports.

```bash
tgraph api [options]
```

**What it generates:**

- Controllers (`*.tg.controller.ts`)
- Services (`*.tg.service.ts`)
- Create DTOs (`create-*.tg.dto.ts`)
- Update DTOs (`update-*.tg.dto.ts`)
- Module files if missing (`*.module.ts`)
- Updates `app.module.ts` with imports
- Updates data provider endpoint mappings (if enabled)

**Example:**

```bash
tgraph api
```

**Example with options:**

```bash
tgraph api --schema prisma/schema.prisma --suffix Admin
```

---

### `tgraph dashboard`

Generate React Admin dashboard resources: List, Edit, Create, Show, and Studio pages.

```bash
tgraph dashboard [options]
```

**What it generates:**

- List components (`*List.tsx`)
- Edit components (`*Edit.tsx`)
- Create components (`*Create.tsx`)
- Show components (`*Show.tsx`)
- Studio components (`*Studio.tsx`)
- Index barrel exports (`index.ts`)
- Field directive metadata (`fieldDirectives.generated.ts`)
- Updates `App.tsx` with resource registrations and routes

**Example:**

```bash
tgraph dashboard
```

**Example with options:**

```bash
tgraph dashboard --dashboard src/admin/src --no-update-data-provider
```

---

### `tgraph dtos`

Generate only DTO response files (not create/update DTOs).

```bash
tgraph dtos [options]
```

**What it generates:**

- Response DTOs for API endpoints
- Type-safe response objects
- Files marked as auto-generated

**Example:**

```bash
tgraph dtos
```

**Example with options:**

```bash
tgraph dtos --dtos src/common/dtos --suffix Public
```

---

### `tgraph all`

Run all generators sequentially: `api`, `dashboard`, and `dtos`.

```bash
tgraph all [options]
```

**Equivalent to:**

```bash
tgraph api && tgraph dashboard && tgraph dtos
```

**Example:**

```bash
tgraph all
```

**Example with options:**

```bash
tgraph all --schema apps/api/prisma/schema.prisma --dashboard apps/admin/src
```

---

## Options

### `--schema <path>`

Override the Prisma schema file path.

**Default:** `prisma/schema.prisma`

**Example:**

```bash
tgraph api --schema apps/core/prisma/schema.prisma
```

---

### `--dashboard <path>`

Override the React Admin dashboard source directory.

**Default:** `src/dashboard/src`

**Example:**

```bash
tgraph dashboard --dashboard src/admin/src
```

---

### `--dtos <path>`

Override the DTO output directory.

**Default:** `src/dtos/generated`

**Example:**

```bash
tgraph dtos --dtos src/common/dtos
```

---

### `--suffix <name>`

Override the suffix appended to generated classes and files.

**Default:** `Tg`

**Example:**

```bash
# Generates: UserAdminService, UserAdminController, CreateUserAdminDto
tgraph api --suffix Admin
```

**Impact:**

- Class names: `User{Suffix}Service`, `User{Suffix}Controller`
- DTOs: `CreateUser{Suffix}Dto`, `UpdateUser{Suffix}Dto`
- Files: `user.{suffix}.service.ts`, `user.{suffix}.controller.ts`

---

### `--admin`

Force admin mode generation (require admin authentication guards).

**Default:** `true`

**Example:**

```bash
tgraph api --admin
```

**Impact:**

- Controllers use `@UseGuards(JwtAuthGuard, AdminGuard)`
- Endpoints are admin-only
- Generated routes are prefixed with `tg-api/`

---

### `--no-admin`

Disable admin mode (generate public endpoints without admin guards).

**Example:**

```bash
tgraph api --no-admin
```

**Impact:**

- Controllers use only `@UseGuards(JwtAuthGuard)` (if any)
- Endpoints are user-accessible
- May use different route prefix

---

### `--update-data-provider`

Enable automatic data provider endpoint mapping updates.

**Default:** `true`

**Example:**

```bash
tgraph all --update-data-provider
```

---

### `--no-update-data-provider`

Disable automatic data provider updates (you'll update manually).

**Example:**

```bash
tgraph dashboard --no-update-data-provider
```

**Use case:** When you have custom data provider logic that shouldn't be auto-updated.

---

### `-h`, `--help`

Display help message.

```bash
tgraph --help
```

**Output:**

```
tgraph <command> [options]

Commands:
  api         Generate NestJS modules, services, controllers, and update data provider
  dashboard   Generate React Admin dashboard resources and field directive config
  dtos        Generate NestJS DTO files
  all         Run api, dashboard, and dtos generators sequentially

Options:
  --schema <path>              Override Prisma schema path
  --dashboard <path>           Override dashboard source directory
  --dtos <path>                Override DTO output directory
  --suffix <name>              Override suffix used for generated artifacts
  --admin                      Force admin mode (isAdmin = true)
  --no-admin                   Disable admin mode (isAdmin = false)
  --update-data-provider       Enable data provider updates
  --no-update-data-provider    Disable data provider updates
  -h, --help                   Display this help message
```

---

## Configuration File

Instead of passing options every time, create a `config.ts` file in your project root:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
};
```

CLI options override config file values.

---

## Common Workflows

### Standard Generation

```bash
# Generate everything with defaults
tgraph all
```

### Backend Only

```bash
# Generate API without dashboard
tgraph api
```

### Dashboard Only

```bash
# Generate dashboard without backend
tgraph dashboard
```

### Custom Paths

```bash
# Monorepo structure
tgraph all \
  --schema apps/api/prisma/schema.prisma \
  --dashboard apps/admin/src \
  --dtos apps/api/src/dtos
```

### Public API Generation

```bash
# Generate public (non-admin) API
tgraph api --no-admin --suffix Public
```

### Multiple Generations

```bash
# Admin API
tgraph api --suffix Admin

# Public API
tgraph api --no-admin --suffix Public --dtos src/public-dtos
```

---

## NPM Scripts Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "generate": "tgraph all",
    "generate:api": "tgraph api",
    "generate:dashboard": "tgraph dashboard",
    "generate:dtos": "tgraph dtos",
    "dev": "npm run generate && npm run start:dev"
  }
}
```

Then run:

```bash
npm run generate
```

---

## Exit Codes

| Code | Meaning                               |
| ---- | ------------------------------------- |
| 0    | Success                               |
| 1    | Error occurred (check console output) |

---

## Environment Variables

The CLI respects these environment variables:

```bash
# Override default paths
export PRISMA_SCHEMA_PATH=prisma/schema.prisma
export DASHBOARD_PATH=src/dashboard/src

# Run generation
tgraph all
```

---

## Troubleshooting

### Command Not Found

**Problem:** `tgraph: command not found`

**Solutions:**

1. **Local installation** – Use npx:

   ```bash
   npx tgraph all
   ```

2. **Global installation** – Install globally:

   ```bash
   npm install -g @tgraph/backend-generator
   ```

3. **Add to PATH** – Add `node_modules/.bin` to your PATH.

### Permission Denied

**Problem:** Permission errors when generating files.

**Solution:** Ensure write permissions on target directories:

```bash
chmod -R u+w src/features
chmod -R u+w src/dashboard/src
```

### Schema Not Found

**Problem:** `Prisma schema not found`

**Solution:** Specify correct path:

```bash
tgraph api --schema path/to/schema.prisma
```

### Module Not Found

**Problem:** CLI prompts to create missing module.

**Solution:** Answer `y` to create automatically, or create manually:

```bash
mkdir -p src/features/user
```

### TypeScript Errors

**Problem:** Generated code has TypeScript errors.

**Solutions:**

1. Install dependencies:

   ```bash
   npm install
   ```

2. Check `tsconfig.json` configuration.

3. Run TypeScript compiler:
   ```bash
   npx tsc --noEmit
   ```

---

## Advanced Usage

### Programmatic CLI

Call the CLI from Node.js scripts:

```javascript
const { spawn } = require('child_process');

const generate = () => {
  return new Promise((resolve, reject) => {
    const proc = spawn('tgraph', ['all'], {
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tgraph exited with code ${code}`));
    });
  });
};

generate().then(() => console.log('Done!'));
```

### Pre-commit Hook

Auto-generate on commit:

```bash
# .husky/pre-commit
#!/bin/sh
npm run generate
git add src/features src/dashboard/src
```

### CI/CD Integration

```yaml
# .github/workflows/generate.yml
name: Generate Code
on: [push]
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run generate
      - run: git diff --exit-code || (echo "Generated files changed" && exit 1)
```

---

## Next Steps

- **[SDK Reference](./sdk-reference.md)** – Programmatic API
- **[Configuration Guide](./api/configuration.md)** – Advanced configuration
- **[Troubleshooting](./troubleshooting.md)** – Common issues
