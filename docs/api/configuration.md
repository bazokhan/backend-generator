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
schemaPath: 'prisma/schema.prisma'

// Monorepo
schemaPath: 'apps/api/prisma/schema.prisma'

// Custom location
schemaPath: 'database/schema.prisma'
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
dashboardPath: 'src/dashboard/src'

// Monorepo
dashboardPath: 'apps/admin/src'

// Custom location
dashboardPath: 'frontend/admin/src'
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
dtosPath: 'src/dtos/generated'

// Separate directory
dtosPath: 'src/common/dtos'

// Monorepo
dtosPath: 'apps/api/src/dtos'
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
suffix: 'Tg'
// → UserTgService, user.tg.service.ts

// Admin API
suffix: 'Admin'
// → UserAdminService, user.admin.service.ts

// Business logic
suffix: 'Bz'
// → UserBzService, user.bz.service.ts

// Public API
suffix: 'Public'
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
export class UserTgController { }
```

**When `false`:**
```typescript
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UserTgController { }
```

**Examples:**

```typescript
// Admin API - requires admin role
isAdmin: true

// Public API - any authenticated user
isAdmin: false
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
updateDataProvider: true

// Manual data provider management
updateDataProvider: false
```

---

## Configuration Files

### Default Configuration

The package includes a default configuration:

```typescript
// node_modules/@tgraph/backend-generator/config.ts
export const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
};
```

### Project Configuration

Override defaults by creating `config.ts` in your project root:

```typescript
// config.ts
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Admin',
  isAdmin: true,
  updateDataProvider: true,
};
```

### Multiple Configurations

Create separate configs for different environments:

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
2. Project config file
3. Default config (lowest)

---

## Environment-Based Configuration

Use environment variables for dynamic configuration:

```typescript
// config.ts
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

Validate your configuration before generation:

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

---

## Best Practices

### 1. Use Project Config File

Store configuration in your project instead of passing CLI flags every time:

```typescript
// config.ts
export const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
};
```

### 2. Separate Configs for Different APIs

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

### 3. Version Control Configuration

Commit your config files:

```bash
git add config.ts
git commit -m "Add generator configuration"
```

### 4. Document Custom Paths

Add comments explaining non-standard paths:

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

---

## Next Steps

- **[Generators API](./generators.md)** – Generator classes
- **[SDK Reference](../sdk-reference.md)** – Programmatic usage
- **[CLI Reference](../cli-reference.md)** – Command-line usage

