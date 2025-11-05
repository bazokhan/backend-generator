---
layout: default
title: Generators
parent: API Reference
nav_order: 1
---

# Generators API

Complete reference for all generator classes.

## ApiGenerator

Generates complete NestJS API infrastructure from Prisma schema.

### Constructor

```typescript
constructor(config: Config)
```

**Parameters:**

- `config` - Configuration object defining paths and options

### Methods

#### `generate()`

Executes the full API generation workflow.

```typescript
async generate(): Promise<void>
```

**Process:**

1. Parses Prisma schema
2. Finds or creates module directories
3. Generates controllers with REST endpoints
4. Generates services with CRUD operations
5. Generates Create/Update DTOs with validation
6. Updates module files with providers/controllers
7. Updates AppModule with imports
8. Updates data provider endpoint mappings (if enabled)

**Example:**

```typescript
import { ApiGenerator } from '@tgraph/backend-generator';

const generator = new ApiGenerator({
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
});

await generator.generate();
```

**Generated Files:**

```
src/features/user/
├── create-user.tg.dto.ts
├── update-user.tg.dto.ts
├── user.tg.service.ts
├── user.tg.controller.ts
└── user.module.ts (updated)

AppModule file (defaults to `src/app.module.ts`, override with `paths.appModule`) – updated
Dashboard data provider (defaults to `src/dashboard/src/providers/dataProvider.ts`, override with `paths.dashboard.dataProvider`) – updated if enabled
```

**Throws:**

- `Error` if schema file not found
- `Error` if module directory cannot be created
- `Error` if file write fails

---

## DashboardGenerator

Generates React Admin dashboard resources and components.

### Constructor

```typescript
constructor(config: Config)
```

**Parameters:**

- `config` - Configuration object

### Methods

#### `generate()`

Executes the full dashboard generation workflow.

```typescript
async generate(): Promise<void>
```

**Process:**

1. Parses Prisma schema
2. Extracts field directives
3. Generates List components
4. Generates Edit components
5. Generates Create components
6. Generates Show components
7. Generates Studio components
8. Generates barrel exports
9. Generates field directive metadata
10. Updates App.tsx with resources and routes

**Example:**

```typescript
import { DashboardGenerator } from '@tgraph/backend-generator';

const generator = new DashboardGenerator({
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
});

await generator.generate();
```

**Generated Files:**

```
src/dashboard/src/resources/users/
├── UserList.tsx
├── UserEdit.tsx
├── UserCreate.tsx
├── UserShow.tsx
├── UserStudio.tsx
└── index.ts

src/dashboard/src/providers/fieldDirectives.generated.ts
src/dashboard/src/App.tsx (updated)
```

**Throws:**

- `Error` if schema file not found
- `Error` if dashboard directory not found
- `Error` if file write fails

---

## DtoGenerator

Generates response DTO files for API endpoints.

### Constructor

```typescript
constructor(config: Config)
```

**Parameters:**

- `config` - Configuration object

### Methods

#### `generate()`

Generates response DTOs for all models.

```typescript
generate(): void
```

**Process:**

1. Parses Prisma schema
2. Generates response DTO for each model
3. Includes relations and enums
4. Marks files as auto-generated

**Example:**

```typescript
import { DtoGenerator } from '@tgraph/backend-generator';

const generator = new DtoGenerator({
  schemaPath: 'prisma/schema.prisma',
  dtosPath: 'src/dtos/generated',
  suffix: 'Response',
  isAdmin: false,
});

generator.generate();
```

**Generated Files:**

```
src/dtos/generated/
├── user-response.dto.ts
├── post-response.dto.ts
└── ...
```

**Generated DTO Example:**

```typescript
/**
 * Auto-generated response DTO
 * DO NOT EDIT MANUALLY
 */

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  posts: PostResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Throws:**

- `Error` if schema file not found
- `Error` if DTO directory cannot be created

---

## Generator Configuration

All generators accept the same configuration object:

```typescript
interface Config {
  schemaPath: string;
  dashboardPath: string;
  dtosPath: string;
  suffix: string;
  isAdmin?: boolean;
  updateDataProvider?: boolean;
  nonInteractive?: boolean;
}
```

### Configuration Properties

#### `schemaPath`

Path to Prisma schema file.

**Type:** `string`
**Default:** `'prisma/schema.prisma'`
**Example:** `'apps/api/prisma/schema.prisma'`

#### `dashboardPath`

Path to React Admin dashboard source directory.

**Type:** `string`
**Default:** `'src/dashboard/src'`
**Example:** `'apps/admin/src'`

#### `dtosPath`

Path to DTO output directory.

**Type:** `string`
**Default:** `'src/dtos/generated'`
**Example:** `'src/common/dtos'`

#### `suffix`

Suffix appended to generated class names.

**Type:** `string`
**Default:** `'Tg'`
**Example:** `'Admin'`, `'Public'`, `'Bz'`

**Impact:**

- Classes: `User{Suffix}Service`, `User{Suffix}Controller`
- Files: `user.{suffix}.service.ts`, `user.{suffix}.controller.ts`

#### `isAdmin`

Whether to generate admin-only endpoints with authentication guards.

**Type:** `boolean`
**Default:** `true`
**Example:** `false` for public APIs

**Impact:**

- `true`: Adds `@UseGuards(JwtAuthGuard, AdminGuard)`
- `false`: Adds only `@UseGuards(JwtAuthGuard)` or no guards

#### `updateDataProvider`

Whether to automatically update data provider endpoint mappings.

**Type:** `boolean`
**Default:** `true`
**Example:** `false` to disable auto-updates

#### `nonInteractive`

Skip interactive confirmation prompts when generating code.

**Type:** `boolean`
**Default:** `false`
**Example:** `true` when running in CI/CD pipelines

**Impact:**

- Automatically creates missing module directories
- Regenerates existing dashboard resources without confirmation
- Prevents commands from hanging waiting for input

---

## Generator Lifecycle

### API Generator Lifecycle

```
1. Parse Prisma Schema
   └─> Extract models with @tg_form()
   └─> Parse fields and relations
   └─> Apply field directives

2. Resolve Module Paths
   └─> Check src/features/{model}
   └─> Check src/infrastructure/{model}
   └─> Prompt to create if missing

3. Generate DTOs
   └─> Create DTO generator
   └─> Generate create DTO with validation
   └─> Generate update DTO with validation
   └─> Write to module directory

4. Generate Service
   └─> Create service generator
   └─> Generate CRUD methods
   └─> Add pagination and search
   └─> Write to module directory

5. Generate Controller
   └─> Create controller generator
   └─> Generate REST endpoints
   └─> Add guards based on isAdmin
   └─> Write to module directory

6. Update Module File
   └─> Read existing module file
   └─> Add providers and controllers
   └─> Write updated module

7. Update AppModule
   └─> Read app.module.ts
   └─> Insert imports in auto-generated section
   └─> Write updated AppModule

8. Update Data Provider (optional)
   └─> Read dataProvider.ts
   └─> Add endpoint mappings
   └─> Write updated data provider
```

### Dashboard Generator Lifecycle

```
1. Parse Prisma Schema
   └─> Extract models with @tg_form()
   └─> Parse fields and relations
   └─> Extract field directives

2. Generate Components
   └─> For each model:
       ├─> Generate List component
       ├─> Generate Edit component
       ├─> Generate Create component
       ├─> Generate Show component
       ├─> Generate Studio component
       └─> Generate barrel export

3. Generate Field Directives
   └─> Build directive metadata object
   └─> Write fieldDirectives.generated.ts

4. Update App.tsx
   └─> Read App.tsx
   └─> Insert Resource imports
   └─> Insert Resource components
   └─> Insert Studio routes
   └─> Write updated App.tsx
```

---

## Error Handling

All generators handle errors gracefully:

```typescript
try {
  const generator = new ApiGenerator(config);
  await generator.generate();
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('File not found:', error.path);
  } else if (error.code === 'EACCES') {
    console.error('Permission denied:', error.path);
  } else {
    console.error('Generation failed:', error.message);
  }
}
```

**Common Errors:**

| Error              | Cause                    | Solution                                 |
| ------------------ | ------------------------ | ---------------------------------------- |
| `ENOENT`           | File/directory not found | Check paths in config                    |
| `EACCES`           | Permission denied        | Fix file permissions                     |
| `Schema not found` | Invalid schema path      | Verify schemaPath in config              |
| `Module not found` | Module directory missing | Create directory or answer 'y' to prompt |
| `Parse error`      | Invalid Prisma syntax    | Fix Prisma schema syntax                 |

---

## Custom Generators

Extend base generators for custom behavior:

```typescript
import { ApiGenerator } from '@tgraph/backend-generator';

class CustomApiGenerator extends ApiGenerator {
  async generate(): Promise<void> {
    // Pre-generation hook
    console.log('Starting custom generation...');

    // Call parent
    await super.generate();

    // Post-generation hook
    await this.customPostProcessing();
  }

  private async customPostProcessing(): Promise<void> {
    // Custom logic after generation
    console.log('Running custom post-processing...');
  }
}

const generator = new CustomApiGenerator(config);
await generator.generate();
```

---

## Best Practices

### 1. Use Consistent Configuration

Store config in a shared file:

```typescript
// config/generator.config.ts
export const generatorConfig = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};

// scripts/generate-api.ts
import { ApiGenerator } from '@tgraph/backend-generator';
import { generatorConfig } from '../config/generator.config';

const generator = new ApiGenerator(generatorConfig);
await generator.generate();
```

### 2. Handle Errors Properly

```typescript
try {
  await generator.generate();
  console.log('✅ Generation successful');
} catch (error) {
  console.error('❌ Generation failed:', error);
  process.exit(1);
}
```

### 3. Run Generators in Sequence

```typescript
async function generateAll() {
  // API first (creates modules)
  const api = new ApiGenerator(config);
  await api.generate();

  // Dashboard second (uses created modules)
  const dashboard = new DashboardGenerator(config);
  await dashboard.generate();

  // DTOs last
  const dtos = new DtoGenerator(config);
  dtos.generate();
}
```

### 4. Validate Configuration

```typescript
function validateConfig(config: Config): void {
  if (!fs.existsSync(config.schemaPath)) {
    throw new Error(`Schema file not found: ${config.schemaPath}`);
  }

  if (!fs.existsSync(config.dashboardPath)) {
    throw new Error(`Dashboard directory not found: ${config.dashboardPath}`);
  }
}

validateConfig(config);
const generator = new ApiGenerator(config);
await generator.generate();
```

---

## Next Steps

- **[Parsers API](./parsers.md)** – Schema parsing utilities
- **[Utilities API](./utilities.md)** – Helper functions
- **[Configuration](./configuration.md)** – Advanced configuration
