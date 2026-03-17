---
title: Generators
---

# Generators API

`@tgraph/backend-generator` exposes high-level generator classes that orchestrate schema parsing, path resolution, file writers, and formatters. Each generator consumes the shared [`Config`](./configuration.md) object and can be invoked from the CLI (`tgraph api`, `tgraph dashboard`, etc.) or from your own scripts.

---

## ApiGenerator

Generates a complete NestJS feature module (DTOs, controller, service, module wiring, and supporting static files) for every Prisma model decorated with `@tg_form()`.

### Constructor

```typescript
import type { Config } from '@tgraph/backend-generator';
import { ApiGenerator, loadConfig } from '@tgraph/backend-generator';

const config: Config = loadConfig(); // or build manually
const generator = new ApiGenerator(config);
```

### Methods

#### `generate(): Promise<void>`

Runs the full backend workflow:

1. **Static file sync** – `NestStaticGenerator` ensures guards, decorators, interceptors, and DTO helpers exist under `config.output.backend.staticFiles`.
2. **Schema parsing** – `PrismaSchemaParser` + `PrismaRelationsParser` read only the models that include `@tg_form()` and enrich them with display metadata.
3. **Module discovery & creation** – `ModulePathResolver` searches every path in `config.output.backend.modules.searchPaths`. When a module does not exist, the generator prompts (or auto-confirms when `behavior.nonInteractive` is true) and creates a module skeleton inside `config.output.backend.modules.defaultRoot`.
4. **File generation** – Controller, service, DTOs, module files, and supporting barrel exports are created or updated with suffix/prefix and guard rules derived from `config.api`.
5. **AppModule update** – `NestAppModuleUpdater` injects imports and `imports: []` entries between the sentinel comments, honouring any manual code.
6. **Data provider update** – When `config.dashboard.updateDataProvider` is enabled, endpoint mappings are rebuilt via `DataProviderEndpointGenerator` and written into `paths.dataProvider` (or the auto-discovered file).

The method throws when required paths cannot be resolved (missing schema, AppModule, data provider, etc.) so you can surface errors in CI.

### Example

```typescript
import { ApiGenerator, loadConfig } from '@tgraph/backend-generator';

async function main() {
  const config = loadConfig(); // Uses tgraph.config.(ts|js)
  const generator = new ApiGenerator(config);
  await generator.generate();
}

main().catch((error) => {
  console.error('Generation failed', error);
  process.exit(1);
});
```

### Generated Artifacts

- `src/features/<model>/create-<model>.<suffix>.dto.ts`, `update-…`, plus module-scoped DTOs
- `src/features/<model>/<model>.<suffix>.service.ts` with Prisma CRUD wired to `config.input.prismaService`
- `src/features/<model>/<model>.module.ts` (created when missing) with controller/service added to the decorators
- `app.module.ts` imports & module registration blocks between `// AUTO-GENERATED …` comments
- Dashboard data provider endpoint map if enabled
- Static guard/decorator/interceptor files when they are missing

### Configuration Touchpoints

- `config.input.schemaPath` – Prisma source of truth
- `config.input.prismaService` – used to compute import statements inside generated services
- `config.output.backend.modules` – search paths plus default creation target
- `config.api.suffix`, `config.api.prefix`, and `config.api.authentication.*` – influence naming, route prefixes, and guard imports
- `config.behavior.nonInteractive` – bypasses prompts for CI pipelines

---

## NestServiceGenerator

Generates NestJS service files with CRUD operations, Prisma integration, and optional relation selects and unique field getters.

### Constructor

```typescript
import { NestServiceGenerator } from '@tgraph/backend-generator';

const generator = new NestServiceGenerator({
  suffix: 'Admin',
  models: allPrismaModels,
  relationsInclude: 'all', // or ['author', 'comments']
});
```

### Options

```typescript
interface NestServiceGeneratorOptions {
  suffix?: string; // Class name suffix (e.g., 'Admin')
  utilsPath?: string; // Path to utility modules
  workspaceRoot?: string; // Project root directory
  prismaServicePath?: string; // Path to Prisma service
  models?: PrismaModel[]; // All parsed models (for relation lookups)
  relationsInclude?: 'all' | string[]; // Relations to include in selects
}
```

### Generated Service Features

#### Standard CRUD Methods

Every generated service includes:

- `getAll(query)` - Paginated search with filtering and sorting
- `getOne(id)` - Find by primary key
- `create(dto)` - Create new record
- `update(id, dto)` - Update existing record
- `updateMany(ids, dto)` - Bulk update
- `deleteOne(id)` - Delete single record
- `deleteMany(ids)` - Bulk delete
- `getSelectFields()` - Returns Prisma select object

#### Unique Field Getters (New)

For each field marked with `@unique` in your Prisma schema, the generator creates a dedicated getter method:

```typescript
// Prisma schema
model User {
  id    String @id @default(uuid())
  email String @unique
  phone String @unique
}

// Generated service methods
async getOneByEmail(email: string): Promise<User> {
  const item = await this.prisma.user.findUnique({
    where: { email },
    select: this.getSelectFields(),
  });
  if (!item) {
    throw new NotFoundException('User not found');
  }
  return item;
}

async getOneByPhone(phone: string): Promise<User> {
  const item = await this.prisma.user.findUnique({
    where: { phone },
    select: this.getSelectFields(),
  });
  if (!item) {
    throw new NotFoundException('User not found');
  }
  return item;
}
```

**Usage in controllers:**

```typescript
@Get('by-email/:email')
async findByEmail(@Param('email') email: string) {
  return this.userService.getOneByEmail(email);
}
```

#### Relation Selects (New)

When `relationsInclude` is configured, the `getSelectFields()` method includes relation data with their display fields:

**Configuration:**

```typescript
// tgraph.config.ts
api: {
  relations: {
    include: ['author', 'comments'], // or 'all'
  },
}
```

**Generated select object:**

```typescript
// Without relations
getSelectFields() {
  return {
    id: true,
    title: true,
    content: true,
    createdAt: true,
  };
}

// With relations: ['author', 'comments']
getSelectFields() {
  return {
    id: true,
    title: true,
    content: true,
    createdAt: true,
    author: { select: { id: true, name: true } },
    comments: { select: { id: true, text: true } },
  };
}
```

The generator automatically determines the display field for each relation:

1. Field marked with `@tg.display` directive
2. Field marked with `@tg.label` directive
3. Falls back to `id`

**Performance considerations:**

- Using `'all'` includes every relation, which may impact query performance
- Specify only needed relations: `['author', 'tags']`
- Relations are excluded from `excludeFields` to prevent duplication

### Example Generated Service

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateUserAdminDto, UpdateUserAdminDto } from '../dtos';

@Injectable()
export class UserAdminService {
  constructor(private prisma: PrismaService) {}

  async getAll(query: PaginatedSearchQueryDto) {
    const { skip, take, where, orderBy } = buildPaginatedQuery(query, ['email', 'name']);

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        orderBy,
        select: this.getSelectFields(),
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async getOne(id: string) {
    const item = await this.prisma.user.findUnique({
      where: { id },
      select: this.getSelectFields(),
    });
    if (!item) {
      throw new NotFoundException('User not found');
    }
    return item;
  }

  async getOneByEmail(email: string) {
    const item = await this.prisma.user.findUnique({
      where: { email },
      select: this.getSelectFields(),
    });
    if (!item) {
      throw new NotFoundException('User not found');
    }
    return item;
  }

  async create(dto: CreateUserAdminDto) {
    return this.prisma.user.create({
      data: dto,
      select: this.getSelectFields(),
    });
  }

  async update(id: string, dto: UpdateUserAdminDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: this.getSelectFields(),
    });
  }

  async deleteOne(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  private getSelectFields() {
    return {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      // Relations included based on config
      profile: { select: { id: true, bio: true } },
    };
  }
}
```

### Configuration Impact

- `config.api.suffix` - Appended to class names
- `config.api.relations.include` - Controls relation selects
- `config.input.prismaService` - Used for import paths
- Unique fields in Prisma schema - Generate dedicated getter methods

---

## DashboardGenerator

Creates a React Admin resource (List/Edit/Create/Show/Studio) for every generated model, updates the dashboard entrypoint, writes directive metadata, and optionally regenerates client-side API types from Swagger.

### Constructor

```typescript
import { DashboardGenerator, loadConfig } from '@tgraph/backend-generator';

const generator = new DashboardGenerator(loadConfig());
```

### Methods

#### `generate(): Promise<void>`

Execution flow:

1. **Schema parse** – Shares the same parser stack as the API generator to guarantee matching metadata.
2. **Type generation** – Attempts to run `swagger-typescript-api` against `<dashboardRoot>/types/swagger.json`. Missing files only raise warnings so local workflows are not blocked.
3. **Resource folders** – For each model, `ReactComponentsGenerator` emits List/Edit/Create/Show/Studio pages plus a barrel `index.ts`. When a folder already exists you are prompted before it is deleted and regenerated.
4. **Field directives** – `fieldDirectives.generated.ts` is regenerated so runtime widgets know which inputs to use.
5. **App component update** – `ProjectPathResolver` locates `App.tsx` (or the configured override) and injects `<Resource>` declarations and Studio routes while preserving manual code.
6. **Formatting** – All generated files are run through Prettier via `formatGeneratedFiles`.

### Example

```typescript
import { DashboardGenerator, loadConfig } from '@tgraph/backend-generator';

const config = loadConfig();
await new DashboardGenerator(config).generate();
```

### Notable Settings

- `config.output.dashboard.root` and `config.output.dashboard.resources` define where files are written.
- `config.dashboard.components` lets you override default React Admin inputs/fields without touching generated files.
- `config.dashboard.updateDataProvider` controls whether the backend generator updates the data provider map after API generation (dashboard generator itself does not touch it).

---

## DtoGenerator

Builds read-only response DTOs for every Prisma model—useful when you only need typed API responses or prefer to manage controllers/services manually.

### Constructor

```typescript
import { DtoGenerator, loadConfig } from '@tgraph/backend-generator';

const generator = new DtoGenerator(loadConfig());
```

### Methods

#### `generate(): void`

1. Clears and recreates `config.output.backend.dtos`.
2. Parses the schema (all models are included, no `@tg_form()` filter).
3. Uses `NestDtoGenerator` to emit `ModelResponseDto` classes that include relations and enums.
4. Wraps every file with the “Auto-generated” banner from `tagAutoGenerated`.
5. Writes an `index.ts` barrel export.

Because DTO generation is synchronous, wrap the call in `try/catch` if you need error reporting.

### Example

```typescript
try {
  new DtoGenerator(loadConfig()).generate();
} catch (error) {
  console.error('DTO generation failed', error);
}
```

### Output Layout

```
src/dtos/generated/
├── user-response.dto.ts
├── project-response.dto.ts
└── index.ts
```

---

## DataProviderEndpointGenerator

Utility generator used by `ApiGenerator` to keep the React Admin data provider’s endpoint map in sync. You can also import it directly when you need custom behavior.

### Methods

- `extractCustomEndpoints(content: string): string` – pulls out the user-managed section below `// Custom endpoints`, allowing automated sections to be rebuilt without losing overrides.
- `generateEndpointMappings(models: PrismaModel[], getResourceName, getApiEndpoint)` – converts resolvers into `"resource": "endpoint"` pairs using any naming strategy you provide (the CLI uses `getResourceName` and `getApiEndpoint` from `generator/utils/naming`).
- `buildEndpointMap(autoGeneratedMappings: string, customEndpoints: string): string` – produces the final `const endpointMap` string that is written back to `dataProvider.ts`.

### Example

```typescript
import { DataProviderEndpointGenerator } from '@tgraph/backend-generator';

const generator = new DataProviderEndpointGenerator();
const custom = generator.extractCustomEndpoints(existingFileContent);
const autogenerated = generator.generateEndpointMappings(
  models,
  (modelName) => modelName.toLowerCase(), // resource name resolver
  (modelName) => `tg-api/${modelName.toLowerCase()}s`, // endpoint resolver
);
const nextContent = generator.buildEndpointMap(autogenerated, custom);
```

---

## Running Generators Together

When you need all artifacts, run the generators sequentially so dependent assets exist in time:

```typescript
import { ApiGenerator, DashboardGenerator, DtoGenerator, loadConfig } from '@tgraph/backend-generator';

async function generateEverything() {
  const config = loadConfig();
  await new ApiGenerator(config).generate();
  await new DashboardGenerator(config).generate();
  new DtoGenerator(config).generate();
}

generateEverything();
```

---

## Next Steps

- Understand how parsers populate metadata: [Parsers API](./parsers.md)
- See how helpers locate files and load configuration: [Utilities](./utilities.md)
- Review every configuration option: [Configuration Reference](./configuration.md)
