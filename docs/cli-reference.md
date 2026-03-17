---
title: CLI Reference
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

Initialize a configuration file in your project root with an interactive wizard or default values.

```bash
tgraph init [options]
```

**Options:**

- `--output <file>` - Output file name (default: `tgraph.config.ts`)
- `--requireAdmin <true|false>` - Default requireAdmin in generated config (default: `true`)
- `-y, --yes` - Non-interactive mode, uses all defaults

**What it does:**

- Runs an interactive wizard to customize your configuration (unless `-y` is used)
- Creates `tgraph.config.ts` (or custom path via `--output`) in your project root
- Includes comprehensive inline comments explaining each option
- Prompts for common paths and preferences
- Fails if a config file already exists

**Interactive wizard prompts:**

When running without `-y`, the wizard will ask:

- Path to Prisma schema
- Path to PrismaService
- API class suffix (e.g., "Admin", "Public")
- API route prefix (e.g., "tg-api", "api")
- Enable authentication guards?
- Require admin for this API?
- Default feature root directory
- Generated DTOs directory
- Guards, decorators, interceptors, utils directories
- Dashboard root and resources directories

**Examples:**

```bash
# Interactive wizard (recommended for first-time setup)
tgraph init

# Non-interactive with defaults
tgraph init --yes

# Custom output path
tgraph init --output my-config.ts

# Configure for public API
tgraph init --requireAdmin false
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
import type { UserConfig } from '@tgraph/backend-generator';

export const config: UserConfig = {
  // Path to your Prisma schema file
  // Default: 'prisma/schema.prisma'
  schemaPath: 'prisma/schema.prisma',

  // Root source directory (all paths derived from this)
  // Default: 'src'
  srcRoot: 'src',

  // API route prefix
  // Default: 'tg-api'
  apiPrefix: 'tg-api',

  // Suffix for generated class names (e.g., 'Admin' → UserAdminService)
  // Default: ''
  apiSuffix: 'Admin',

  // Add authentication guards to controllers
  // Default: true
  authenticationEnabled: true,

  // Require admin role for all endpoints
  // Default: true
  requireAdmin: true,

  // Guards applied to all controllers
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],

  // Dashboard config (false to disable)
  dashboard: { root: 'src/dashboard/src' },

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

### `tgraph preflight`

Simulate a full generation run without touching the filesystem. Identifies missing modules, dashboard resources that would be overwritten, and manual steps to complete before running `tgraph all`.

```bash
tgraph preflight
# Alias
tgraph dry-run
```

**What it reports:**

- Resolved project paths (AppModule, module roots, dashboard entrypoints)
- Modules that will be created or require new files
- Dashboard resources that already exist and will be regenerated
- Missing dependencies like Swagger JSON or data provider files
- Actionable manual steps to take before generating

**Example:**

```
🧪 Running preflight analysis...

📂 Key Paths
  ✓ AppModule: src/app.module.ts
  ⚠️ Data Provider: not found (src/dashboard/src/providers/dataProvider.ts)
  ✓ Dashboard App: src/dashboard/src/App.tsx
  ⚠️ Swagger JSON: not found (src/dashboard/src/types/swagger.json)

🧱 Modules
  🆕 Invoice: module directory will be created at src/features/invoice
  ⚙️ Customer: module file will be generated at src/features/customer/customer.module.ts

🖥️ Dashboard Resources
  ⚠️ customers: src/dashboard/src/resources/customers (existing folder will be replaced)
  ✓ invoices: src/dashboard/src/resources/invoices

📝 Manual Steps
  ⚠️ Dashboard data provider not found. Configure config.paths.dataProvider or create the file before running generation.
  ℹ️ Swagger JSON missing. Run "npm run generate:swagger" before generating dashboard types.

⚠️ Preflight completed with warnings. Review the manual steps above.
```

**When to use it:**

- Before the first run on a new or custom project layout
- In pull requests to preview generator impact
- In CI to fail fast if required files are missing

**Exit codes:**

- `0` – Command executed successfully (warnings may be present)
- `1` – Unexpected error while performing the analysis

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

---

### `tgraph static`

Generate selectable static backend files including guards, decorators, DTOs, interceptors, and utilities.

```bash
tgraph static [options]
```

**Options:**

- `--list` - List available static modules with their output paths
- `--cat <name>` - Preview contents of a specific static file before generation
- `--preflight <name>` - Alias for `--cat`
- `--include <names>` - Comma-separated list of modules to include (e.g., `admin.guard,adapter.runtime`)
- `-y, --yes` - Generate all modules without prompts
- `-c, --config <path>` - Path to configuration file

**Available static modules:**

- `admin.guard` - Admin role guard implementation
- `feature-flag.guard` - Feature flag guard stub
- `is-admin.decorator` - IsAdmin decorator for endpoints
- `paginated-search-query.dto` - Pagination query DTO
- `paginated-search-result.dto` - Pagination result DTO
- `api-response.dto` - Standard API response wrapper
- `pagination.interceptor` - Pagination response interceptor
- `audit.interceptor` - Audit logging interceptor stub
- `paginated-search.decorator` - Paginated search endpoint decorator
- `paginated-search.util` - Pagination utility functions
- `generate.swagger` - Swagger generation script template

**What it generates:**

Static backend files are generated based on paths configured in `config.output.backend.staticFiles`:

- Guards → `src/guards/`
- Decorators → `src/decorators/`
- DTOs → `src/dtos/`
- Interceptors → `src/interceptors/`
- Utils → `src/utils/`

**Behavior:**

- **Interactive mode** (default): Prompts for each module individually
- **List mode** (`--list`): Shows available modules without generating
- **Selective mode** (`--include`): Generates only specified modules
- **Non-interactive mode** (`-y`): Generates all modules

**Examples:**

```bash
# List available modules with their output paths
tgraph static --list

# Preview a specific module before generating
tgraph static --cat admin.guard
tgraph static --preflight adapter.runtime

# Interactive selection (prompts for each module)
tgraph static

# Generate specific modules
tgraph static --include admin.guard,adapter.runtime

# Generate all modules without prompts
tgraph static --yes

# Generate with custom config
tgraph static --config custom-config.ts --include admin.guard
```

**When to use:**

- During `tgraph api` generation, you'll be prompted to generate required static files
- Run standalone to regenerate or selectively add static files
- Use `--include` to add new modules without regenerating everything

---

### `tgraph types`

Regenerate the dashboard API client (`types/api.ts`). Runs the configured swagger command first, then feeds the resulting `swagger.json` into `swagger-typescript-api`.

```bash
tgraph types [options]
```

**Options:**

- `-c, --config <path>` – Path to configuration file (defaults to `tgraph.config.ts`)
- `--skip-swagger` – Skip running the swagger command (expects `swagger.json` already updated)

**Behavior:**

- Command to regenerate swagger is read from `dashboard.swagger.command` (defaults to `npm run generate:swagger`).
- Path to `swagger.json` is resolved from `dashboard.swagger.jsonPath` (defaults to `<dashboardRoot>/types/swagger.json`).
- If the swagger command fails or the JSON file is still missing, the command exits with an error.
- Generates `types/api.ts` using `swagger-typescript-api`.

**Examples:**

```bash
# Run swagger -> types end-to-end
tgraph types

# Skip running swagger command when swagger.json is already up to date
tgraph types --skip-swagger
```

---

### `tgraph swagger`

Runs the configured swagger generation command (default `npm run generate:swagger`). Useful for regenerating the swagger file without producing TypeScript types.

```bash
tgraph swagger [options]
```

**Options:**

- `-c, --config <path>` – Path to configuration file (defaults to `tgraph.config.ts`)

**Example:**

```bash
tgraph swagger
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

### `--public`

Forces a single run to generate public (unauthenticated) controllers without editing the config file. Internally it disables admin guards and authentication for the command invocation.

```bash
tgraph api --public
```

**Impact:**

- Sets `api.authentication.enabled = false`
- Sets `api.authentication.requireAdmin = false`
- Controllers generated without `@UseGuards` decorators
- Useful for creating separate public APIs alongside admin APIs

**Use cases:**

- Generate public endpoints while keeping config set for admin endpoints
- Testing without authentication guards
- Creating dual API configurations (admin + public)

**Example workflow:**

```bash
# Generate admin API (uses config defaults)
tgraph api --suffix Admin

# Generate public API (overrides authentication)
tgraph api --suffix Public --public
```

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
  init        Initialize a new tgraph.config.ts file
  api         Generate NestJS modules, services, controllers, and update data provider
  dashboard   Generate React Admin dashboard resources and field directive config
  dtos        Generate NestJS DTO files
  all         Run api, dashboard, and dtos generators sequentially
  static      Generate selectable static backend files (guards, dtos, utils)
  types       Generate dashboard API client types from swagger.json
  swagger     Run the configured swagger generation command
  doctor      Run system diagnostics
  preflight   Simulate generation without touching filesystem

Options:
  -c, --config <path>          Path to configuration file (default: tgraph.config.ts)
  --public                     Override config to generate controllers without authentication guards
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
# Initialize config file with interactive wizard
tgraph init

# Check environment (recommended)
tgraph doctor

# Preview what will be generated
tgraph preflight

# Generate everything
tgraph all

# Generate static files if needed
tgraph static

# Generate dashboard API types
tgraph types
```

### Standard Generation

```bash
# Generate everything with defaults
tgraph all

# Generate static files interactively
tgraph static

# Update dashboard types from swagger
tgraph types
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

### Multiple API Generations

```bash
# Admin API with authentication
tgraph api --suffix Admin

# Public API without authentication
tgraph api --suffix Public --public

# Generate static files for admin API
tgraph static --include admin.guard,pagination.interceptor
```

### Static Files Only

```bash
# List what's available
tgraph static --list

# Generate specific modules
tgraph static --include admin.guard,is-admin.decorator

# Generate all modules non-interactively
tgraph static --yes
```

### Dashboard Types Generation

```bash
# Generate swagger.json and types/api.ts
tgraph types

# Only generate types (skip swagger regeneration)
tgraph types --skip-swagger

# Only regenerate swagger.json
tgraph swagger
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
