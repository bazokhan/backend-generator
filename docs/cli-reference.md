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

### `tgraph init`

Initialize a configuration file in your project root.

```bash
tgraph init
```

**What it does:**

- Creates `tgraph.config.ts` in your project root
- Includes comprehensive inline comments explaining each option
- Uses default values suitable for most projects
- Fails if a config file already exists

**Example:**

```bash
tgraph init
```

**Output:**

```
✅ Created configuration file: /path/to/your/project/tgraph.config.ts
   You can now customize it for your project.
   Run 'tgraph all' to generate code.
```

**Error cases:**

If a config file already exists:

```
❌ Error: Configuration file already exists at 'tgraph.config.ts'
   Remove it first if you want to reinitialize.
```

**Generated file structure:**

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  // Path to your Prisma schema file
  // Default: 'prisma/schema.prisma'
  schemaPath: 'prisma/schema.prisma',

  // Path to your React Admin dashboard source directory
  // Default: 'src/dashboard/src'
  dashboardPath: 'src/dashboard/src',

  // Path where DTO files will be generated
  // Default: 'src/dtos/generated'
  dtosPath: 'src/dtos/generated',

  // Suffix for generated classes (e.g., UserTgService, UserTgController)
  // Default: 'Tg'
  suffix: 'Tg',

  // Generate admin-only endpoints with authentication guards
  // Default: true
  isAdmin: true,

  // Automatically update data provider endpoint mappings
  // Default: true
  updateDataProvider: true,

  // Skip interactive prompts (useful for CI)
  // Default: false
  nonInteractive: false,
};
```

**Note:** You must run `tgraph init` before running any other commands. All generation commands require a config file.

---

### `tgraph doctor`

Run system diagnostics to check your environment and configuration before generation.

```bash
tgraph doctor
```

**What it checks:**

- Configuration file existence and validity
- Required configuration fields
- Node.js version (>= 18.0.0)
- Prisma CLI installation
- Prisma schema file existence and validity
- Project directory structure
- Dashboard and DTOs path availability

**Example:**

```bash
tgraph doctor
```

**Output (success with warnings):**

```
🔍 Running system diagnostics...

✓ Configuration
  ✓ Config file found: tgraph.config.ts
  ✓ Schema path configured: prisma/schema.prisma
  ✓ Dashboard path configured: src/dashboard/src
  ✓ DTOs path configured: src/dtos/generated
  ✓ Suffix configured: "Tg"

✓ Environment
  ✓ Node version: 18.19.0 (>= 18.0.0 required)
  ✓ Prisma CLI installed

✓ Prisma Schema
  ✓ Schema file exists
  ✓ Schema is valid

⚠️ Project Paths
  ⚠️ Dashboard directory does not exist: src/dashboard/src
     💡 Directory will be created during generation
  ✓ DTOs directory exists: src/dtos/generated
  ✓ Source directory exists: src/

✅ All critical checks passed! (1 warning)
💡 Run 'tgraph all' to start generating
```

**Output (with errors):**

```
🔍 Running system diagnostics...

❌ Configuration
  ❌ No configuration file found
     💡 Run 'tgraph init' to create a configuration file

✓ Environment
  ✓ Node version: 18.19.0 (>= 18.0.0 required)
  ✓ Prisma CLI installed

❌ Prisma Schema
  ❌ Schema file not found: prisma/schema.prisma
     💡 Run 'npx prisma init' to create a schema

❌ Diagnostics failed! Please fix the errors above before running generation.
💡 Run 'tgraph doctor' again after making changes to verify the fixes.
```

**Exit codes:**

- `0` - All checks passed or only warnings present
- `1` - One or more critical errors found

**Use cases:**

- **First-time setup:** Verify environment before running generators
- **CI/CD pipelines:** Validate setup before attempting generation
- **Troubleshooting:** Diagnose issues when generation fails
- **After updates:** Ensure environment is still compatible

**Note:** The `doctor` command can run even if no configuration file exists. It will detect and report the missing config file as an error, along with other environment issues.

---

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

### `-y`, `--yes`, `--non-interactive`

Automatically answer "yes" to interactive prompts. Essential for CI pipelines where user input is not possible.

**Example:**

```bash
tgraph all --yes
```

**Use case:** Prevents the CLI from pausing when creating modules or regenerating dashboard resources.

---

### `--interactive`

Forces interactive prompts even when the config enables non-interactive mode.

**Example:**

```bash
tgraph api --interactive
```

**Use case:** Override a non-interactive config for local runs when you want to review prompts.

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
  -y, --yes, --non-interactive Automatically confirm interactive prompts
  --interactive                Force interactive prompts even if config sets nonInteractive
  -h, --help                   Display this help message
```

---

## Configuration File

The CLI requires a configuration file to run. Create one using:

```bash
tgraph init
```

This generates `tgraph.config.ts` (or you can manually create `tgraph.config.js`) in your project root:

```typescript
import type { Config } from '@tgraph/backend-generator';

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

**Config file discovery:**

The CLI searches for config files in this order:
1. `tgraph.config.ts`
2. `tgraph.config.js`

CLI options override config file values.

---

## Common Workflows

### First Time Setup

```bash
# Initialize config file
tgraph init

# Check environment (recommended)
tgraph doctor

# Generate everything
tgraph all
```

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

### Config File Not Found

**Problem:**

```
❌ Error: No configuration file found.
   Run 'tgraph init' to create a configuration file.
```

**Solution:** Initialize a config file:

```bash
tgraph init
```

### Schema Not Found

**Problem:** `Prisma schema not found`

**Solution:** Specify correct path in your config file or via CLI:

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
