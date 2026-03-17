---
title: SDK Reference
---

# SDK Reference

Use TGraph Backend Generator programmatically in your own scripts and build pipelines.

## Installation

```bash
npm install --save-dev @tgraph/backend-generator
```

## Basic Usage

```typescript
import { ApiGenerator, DashboardGenerator, DtoGenerator } from '@tgraph/backend-generator';
import type { Config } from '@tgraph/backend-generator';

// Define your configuration
const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};

(async () => {
  // Generate API files
  const api = new ApiGenerator(config);
  await api.generate();

  // Generate dashboard
  const dashboard = new DashboardGenerator(config);
  await dashboard.generate();

  // Generate DTOs
  const dtos = new DtoGenerator(config);
  dtos.generate();
})();
```

## Exported Modules

### Generators

#### `ApiGenerator`

Generates NestJS API files: controllers, services, DTOs, and updates AppModule.

**Constructor:**

```typescript
new ApiGenerator(config: Config)
```

**Methods:**

```typescript
async generate(): Promise<void>
```

**Example:**

```typescript
import { ApiGenerator } from '@tgraph/backend-generator';

const config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Admin',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};

const generator = new ApiGenerator(config);
await generator.generate();
```

**What it generates:**

- Controllers with REST endpoints
- Services with CRUD operations
- Create/Update DTOs with validation
- Module files if missing
- AppModule import updates
- Data provider endpoint mappings (if enabled)

---

#### `DashboardGenerator`

Generates React Admin dashboard resources.

**Constructor:**

```typescript
new DashboardGenerator(config: Config)
```

**Methods:**

```typescript
async generate(): Promise<void>
```

**Example:**

```typescript
import { DashboardGenerator } from '@tgraph/backend-generator';

const config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};

const generator = new DashboardGenerator(config);
await generator.generate();
```

**What it generates:**

- List, Edit, Create, Show, Studio components
- Field directive metadata
- App.tsx resource registrations
- App.tsx studio routes

---

#### `DtoGenerator`

Generates response DTO files.

**Constructor:**

```typescript
new DtoGenerator(config: Config)
```

**Methods:**

```typescript
generate(): void
```

**Example:**

```typescript
import { DtoGenerator } from '@tgraph/backend-generator';

const config = {
  schemaPath: 'prisma/schema.prisma',
  dtosPath: 'src/dtos/generated',
  suffix: 'Response',
  isAdmin: false,
};

const generator = new DtoGenerator(config);
generator.generate();
```

---

### Utilities

#### `ModulePathResolver`

Locates NestJS module files in your project.

**Constructor:**

```typescript
new ModulePathResolver();
```

**Methods:**

```typescript
resolve(modelName: string): Promise<ModulePathInfo | null>
```

**Example:**

```typescript
import { ModulePathResolver } from '@tgraph/backend-generator';

const resolver = new ModulePathResolver();
const moduleInfo = await resolver.resolve('User');

if (moduleInfo) {
  console.log('Module path:', moduleInfo.path);
  console.log('Module type:', moduleInfo.type); // e.g., 'features', 'modules', 'domains', etc.
  console.log('Folder name:', moduleInfo.folderName);
}
```

**Return Type:**

```typescript
interface ModulePathInfo {
  path: string; // e.g., 'src/features/user'
  type: string; // Folder name where module is found (e.g., 'features', 'modules', 'domains', etc.)
  folderName: string; // e.g., 'user'
}
```

---

#### `NestAppModuleUpdater`

Updates `app.module.ts` with auto-generated imports.

**Constructor:**

```typescript
new NestAppModuleUpdater();
```

**Methods:**

```typescript
update(modules: {  name: string; path: string }[]): Promise<void>
```

**Example:**

```typescript
import { NestAppModuleUpdater } from '@tgraph/backend-generator';

const updater = new NestAppModuleUpdater();

await updater.update([
  { name: 'UserModule', path: './features/user/user.module' },
  { name: 'PostModule', path: './features/post/post.module' },
]);
```

**Behavior:**

- Inserts imports between `// AUTO-GENERATED IMPORTS START/END` comments
- Preserves manual imports
- Creates sentinel comments if missing

---

#### `NestModuleUpdater`

Updates individual feature module files with providers/controllers.

**Constructor:**

```typescript
new NestModuleUpdater();
```

**Methods:**

```typescript
update(modulePath: string, updates: ModuleUpdates): Promise<void>
```

**Example:**

```typescript
import { NestModuleUpdater } from '@tgraph/backend-generator';

const updater = new NestModuleUpdater();

await updater.update('src/features/user/user.module.ts', {
  providers: ['UserTgService'],
  controllers: ['UserTgController'],
});
```

---

#### `DataProviderEndpointGenerator`

Updates React Admin data provider with endpoint mappings.

**Constructor:**

```typescript
new DataProviderEndpointGenerator();
```

**Methods:**

```typescript
update(resources: {  name: string; endpoint: string }[]): Promise<void>
```

**Example:**

```typescript
import { DataProviderEndpointGenerator } from '@tgraph/backend-generator';

const generator = new DataProviderEndpointGenerator();

await generator.update([
  { name: 'users', endpoint: 'tg-api/users' },
  { name: 'posts', endpoint: 'tg-api/posts' },
]);
```

**Behavior:**

- Updates `endpointMap` in data provider file
- Preserves custom endpoint mappings
- Inserts between auto-generated comments

---

### Configuration

#### `config`

Default configuration object.

**Type:**

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

**Default Values:**

```typescript
{
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
}
```

**Example:**

```typescript
import type { Config } from '@tgraph/backend-generator';

// Define base configuration
const baseConfig: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};

// Create variations
const adminConfig: Config = {
  ...baseConfig,
  suffix: 'Admin',
  isAdmin: true,
};

const publicConfig: Config = {
  ...baseConfig,
  suffix: 'Public',
  isAdmin: false,
};
```

---

## Advanced Patterns

### Custom Build Script

Create a custom generation script with pre/post hooks:

```typescript
// scripts/generate.ts
import { ApiGenerator, DashboardGenerator, DtoGenerator } from '@tgraph/backend-generator';
import type { Config } from '@tgraph/backend-generator';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load your configuration
const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};

async function generate() {
  console.log('🚀 Starting generation...');

  // Pre-generation: Run Prisma migrations
  console.log('📦 Running Prisma migrations...');
  await execAsync('npx prisma migrate dev');

  // Generate backend
  console.log('⚙️  Generating backend...');
  const api = new ApiGenerator(config);
  await api.generate();

  // Generate dashboard
  console.log('🎨 Generating dashboard...');
  const dashboard = new DashboardGenerator(config);
  await dashboard.generate();

  // Generate DTOs
  console.log('📝 Generating DTOs...');
  const dtos = new DtoGenerator(config);
  dtos.generate();

  // Post-generation: Format code
  console.log('✨ Formatting code...');
  await execAsync('npx prettier --write "src/**/*.{ts,tsx}"');

  // Post-generation: Run linter
  console.log('🔍 Running linter...');
  await execAsync('npx eslint --fix "src/**/*.{ts,tsx}"');

  console.log('✅ Generation complete!');
}

generate().catch((error) => {
  console.error('❌ Generation failed:', error);
  process.exit(1);
});
```

**Run:**

```bash
npx ts-node scripts/generate.ts
```

---

### Multiple Configurations

Generate for different environments:

```typescript
// scripts/generate-all.ts
import { ApiGenerator, DashboardGenerator } from '@tgraph/backend-generator';

const baseConfig = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  updateDataProvider: true,
  nonInteractive: false,
};

async function generateAll() {
  // Admin API
  console.log('Generating admin API...');
  const adminApi = new ApiGenerator({
    ...baseConfig,
    suffix: 'Admin',
    isAdmin: true,
  });
  await adminApi.generate();

  // Public API
  console.log('Generating public API...');
  const publicApi = new ApiGenerator({
    ...baseConfig,
    suffix: 'Public',
    isAdmin: false,
    dtosPath: 'src/dtos/public',
  });
  await publicApi.generate();

  // Admin Dashboard
  console.log('Generating admin dashboard...');
  const adminDashboard = new DashboardGenerator({
    ...baseConfig,
    suffix: 'Admin',
  });
  await adminDashboard.generate();
}

generateAll();
```

---

### Conditional Generation

Generate based on environment or conditions:

```typescript
import { ApiGenerator, DashboardGenerator } from '@tgraph/backend-generator';

async function smartGenerate() {
  const env = process.env.NODE_ENV || 'development';
  const generateDashboard = process.env.GENERATE_DASHBOARD === 'true';

  const config = {
    schemaPath: 'prisma/schema.prisma',
    dashboardPath: 'src/dashboard/src',
    dtosPath: `src/dtos/${env}`,
    suffix: env === 'production' ? 'Prod' : 'Dev',
    isAdmin: true,
    updateDataProvider: generateDashboard,
  };

  // Always generate API
  const api = new ApiGenerator(config);
  await api.generate();

  // Conditionally generate dashboard
  if (generateDashboard) {
    const dashboard = new DashboardGenerator(config);
    await dashboard.generate();
  }
}

smartGenerate();
```

---

### Error Handling

Robust error handling:

```typescript
import { ApiGenerator } from '@tgraph/backend-generator';

async function safeGenerate() {
  try {
    const generator = new ApiGenerator(config);
    await generator.generate();
    console.log('✅ Generation successful');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Generation failed:', error.message);
      console.error('Stack trace:', error.stack);
    }

    // Send error to monitoring service
    await sendToSentry(error);

    // Exit with error code
    process.exit(1);
  }
}

safeGenerate();
```

---

### Watch Mode

Auto-regenerate on schema changes:

```typescript
import { watch } from 'fs';
import { ApiGenerator, DashboardGenerator } from '@tgraph/backend-generator';

const config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};

async function regenerate() {
  console.log('🔄 Regenerating...');

  const api = new ApiGenerator(config);
  await api.generate();

  const dashboard = new DashboardGenerator(config);
  await dashboard.generate();

  console.log('✅ Done');
}

// Watch schema file
watch(config.schemaPath, async (eventType) => {
  if (eventType === 'change') {
    console.log('📝 Schema changed, regenerating...');
    await regenerate();
  }
});

console.log(`👀 Watching ${config.schemaPath} for changes...`);
```

---

### Monorepo Support

Generate for multiple apps in a monorepo:

```typescript
import { ApiGenerator, DashboardGenerator } from '@tgraph/backend-generator';

const apps = [
  {
    name: 'main-app',
    schemaPath: 'apps/main/prisma/schema.prisma',
    dashboardPath: 'apps/main/src/dashboard/src',
    dtosPath: 'apps/main/src/dtos',
  },
  {
    name: 'admin-app',
    schemaPath: 'apps/admin/prisma/schema.prisma',
    dashboardPath: 'apps/admin/src/dashboard/src',
    dtosPath: 'apps/admin/src/dtos',
  },
];

async function generateMonorepo() {
  for (const app of apps) {
    console.log(`\n📦 Generating for ${app.name}...`);

    const config = {
      ...app,
      suffix: 'Tg',
      isAdmin: true,
      updateDataProvider: true,
      nonInteractive: false,
    };

    const api = new ApiGenerator(config);
    await api.generate();

    const dashboard = new DashboardGenerator(config);
    await dashboard.generate();
  }
}

generateMonorepo();
```

---

## TypeScript Types

### Config

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

### ModulePathInfo

```typescript
interface ModulePathInfo {
  path: string;
  type: string; // Folder name where module is found
  folderName: string;
}
```

### ModuleUpdates

```typescript
interface ModuleUpdates {
  providers?: string[];
  controllers?: string[];
  imports?: string[];
  exports?: string[];
}
```

---

## Next Steps

- **[CLI Reference](./cli-reference.md)** – Command-line usage
- **[API Documentation](./api/generators.md)** – Detailed API docs
- **[Configuration Guide](./api/configuration.md)** – Advanced config
