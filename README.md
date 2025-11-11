# TGraph Backend Generator

> Transform your Prisma schema into production-ready NestJS APIs and React Admin dashboards with a single command.

[![npm version](https://img.shields.io/npm/v/@tgraph/backend-generator.svg)](https://www.npmjs.com/package/@tgraph/backend-generator)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Features

- **Full-Stack Generation**: Generate NestJS controllers, services, DTOs, and React Admin pages from Prisma schemas
- **Type Safety**: Carry TypeScript types from database to frontend, including Swagger-based API clients
- **Smart Introspection**: Automatically discovers your project structure and preserves custom code
- **Unique Field Getters**: Auto-generated getters for every Prisma `@unique` field
- **Relation Support**: React Admin resources and DTOs understand Prisma relations out of the box
- **Static Infrastructure**: Generate guards, interceptors, decorators, and utilities
- **Field Directives**: Fine-grained control with `@tg_format`, `@tg_upload`, and `@tg_readonly`
- **Safe Regeneration**: Generated files live beside your code and can be overwritten safely
- **Convention Over Configuration**: Works out of the box with sensible defaults
- **Interactive Wizard**: Guided setup with `tgraph init`

## Quick Start

```bash
# Install
npm install --save-dev @tgraph/backend-generator

# Initialize configuration
npx tgraph init

# Mark your Prisma models
// @tg_form()
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
}

# Generate everything
npx tgraph all
```

**Result:** Complete CRUD API plus an admin dashboard in seconds.

## What Gets Generated

### Backend (NestJS)

- REST controllers with pagination and search
- Services with CRUD operations, unique field getters, and Prisma integration
- DTOs with class-validator decorators (including arrays and enums)
- Automatic AppModule updates
- Optional static modules (guards, DTOs, interceptors, utilities)

### Frontend (React Admin)

- List/Edit/Create/Show pages for every model
- Studio pages for spreadsheet-style editing
- Type-appropriate inputs (dates, uploads, references, JSON)
- Relation handling with autocomplete widgets
- Type-safe API client generated from Swagger

## Example

**Input (Prisma):**

```prisma
// @tg_form()
model Post {
  id        String   @id @default(uuid())
  title     String   // @min(5) @max(200)
  content   String
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}
```

**Output:** Instant admin system with a working API and dashboard.

## Installation

```bash
# Project dependency (recommended)
npm install --save-dev @tgraph/backend-generator

# Global installation
npm install -g @tgraph/backend-generator
```

## Usage

```bash
# Generate everything
tgraph all

# Preview pending changes without writing files
tgraph preflight

# Generate only API files
tgraph api

# Generate only dashboard resources
tgraph dashboard

# Generate only DTOs
tgraph dtos

# With options
tgraph all --config tgraph.admin.config.ts --non-interactive

# List available static modules
tgraph static --list

# Generate selected static modules
tgraph static --include admin.guard,pagination.interceptor

# Generate dashboard API types from swagger.json
tgraph types
```

## Requirements

- Node.js 18.0.0 or newer
- NestJS project with Prisma
- React Admin dashboard (optional, only required for dashboard generation)

## Documentation

- **[Complete Documentation](https://trugraph.github.io/backend-generator/)** - Browse every guide and reference

### Getting Started

- [Getting Started](https://trugraph.github.io/backend-generator/getting-started.html) - Installation and setup
- [Quick Start Tutorial](https://trugraph.github.io/backend-generator/quick-start.html) - Build a blog in 5 minutes
- [CLI Reference](https://trugraph.github.io/backend-generator/cli-reference.html) - All commands and options

### Guides

- [Prisma Setup](https://trugraph.github.io/backend-generator/guides/prisma-setup.html) - Configure your schema
- [Field Directives](https://trugraph.github.io/backend-generator/guides/field-directives.html) - Control generation behavior
- [Authentication Guards](https://trugraph.github.io/backend-generator/guides/authentication-guards.html) - Configure authentication
- [Static Files Generation](https://trugraph.github.io/backend-generator/guides/static-files.html) - Infrastructure generation
- [Dashboard Types Generation](https://trugraph.github.io/backend-generator/guides/dashboard-types.html) - Type-safe API clients

### Advanced

- [Recipes](https://trugraph.github.io/backend-generator/recipes/basic-crud.html) - Practical examples
- [SDK Reference](https://trugraph.github.io/backend-generator/sdk-reference.html) - Programmatic usage
- [Troubleshooting](https://trugraph.github.io/backend-generator/troubleshooting.html) - Common issues

### AI Integration

- [LLM Integration Guide](https://trugraph.github.io/backend-generator/llm-guide.html) - Complete guide for AI assistants

## Configuration

Initialize a configuration file in your project:

```bash
npx tgraph init
```

This creates `tgraph.config.ts` with typed defaults:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  input: {
    prisma: {
      schemaPath: 'prisma/schema.prisma',
      servicePath: 'src/infrastructure/database/prisma.service.ts',
    },
    dashboard: {
      components: { form: {}, display: {} },
    },
  },
  output: {
    backend: {
      root: 'src/features',
      dtosPath: 'src/dtos/generated',
      modulesPaths: ['src/features', 'src/modules', 'src'],
      guardsPath: 'src/guards',
      decoratorsPath: 'src/decorators',
      interceptorsPath: 'src/interceptors',
      utilsPath: 'src/utils',
      appModulePath: 'src/app.module.ts',
    },
    dashboard: {
      enabled: true,
      updateDataProvider: true,
      root: 'src/dashboard/src',
      resourcesPath: 'src/dashboard/src/resources',
      swaggerJsonPath: 'src/dashboard/src/types/swagger.json',
      apiPath: 'src/dashboard/src/types/api.ts',
      appComponentPath: 'src/dashboard/src/App.tsx',
      dataProviderPath: 'src/dashboard/src/providers/dataProvider.ts',
    },
  },
  api: {
    suffix: '',
    prefix: 'tg-api',
    authenticationEnabled: true,
    requireAdmin: true,
    guards: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }],
    adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
  },
  behavior: {
    nonInteractive: false,
  },
};
```

The structured configuration makes it easy to run multiple variants (`--config tgraph.public.config.ts`), customize component imports, and control every output path.

### Public vs Admin Controllers

- Set `api.authenticationEnabled = false` (or pass `--public`) to generate public controllers without guards.
- Set `api.requireAdmin = true` to add the `@IsAdmin()` decorator and admin guards.

### Route Prefix

`api.prefix` controls the base route for generated controllers (for example `tg-api`, `public-api`). Use different prefixes per config file.

### Static Assets Generation

- During `tgraph api`, you'll be prompted to generate static files. Use `--yes` for non-interactive generation or `tgraph static --include <names>` for a targeted run.
- Available names include: `admin.guard`, `feature-flag.guard`, `is-admin.decorator`, `paginated-search-query.dto`, `paginated-search-result.dto`, `api-response.dto`, `pagination.interceptor`, `audit.interceptor`, `paginated-search.decorator`, `paginated-search.util`.

### Dashboard API Types

`tgraph types` reads the file defined by `output.dashboard.swaggerJsonPath` (default `src/dashboard/src/types/swagger.json`) and generates the client at `output.dashboard.apiPath`. Ensure `swagger.json` is fresh before running.

## Programmatic Usage

```typescript
import { ApiGenerator, DashboardGenerator, DtoGenerator } from '@tgraph/backend-generator';
import { config } from './tgraph.config';

const api = new ApiGenerator(config);
await api.generate();

const dashboard = new DashboardGenerator(config);
await dashboard.generate();

const dtos = new DtoGenerator(config);
await dtos.generate();
```

See the [SDK Reference](https://trugraph.github.io/backend-generator/sdk-reference.html) for every method and option.

## Project Structure

```
your-project/
|- prisma/
|  |- schema.prisma
|
|- src/
|  |- app.module.ts
|  |- features/
|     |- user/
|        |- user.tg.controller.ts   # Generated
|        |- user.tg.service.ts      # Generated
|        |- create-user.tg.dto.ts   # Generated
|        |- user.service.ts         # Your custom logic
|
|- dashboard/src/
   |- App.tsx
   |- resources/
      |- users/
         |- UserList.tsx           # Generated
         |- UserEdit.tsx           # Generated
         |- ...
```

## Field Directives

Control generation directly from your Prisma schema:

```prisma
model User {
  /// @tg_format(email)
  email String @unique

  /// @tg_upload(image)
  avatar String?

  /// @tg_readonly
  ipAddress String?
}
```

See the [Field Directives Guide](https://trugraph.github.io/backend-generator/guides/field-directives.html) for every directive.

## Philosophy

- **Convention over Configuration**: Works out of the box
- **Generate, Don't Replace**: Generated files live beside your code
- **Progressive Disclosure**: Start simple, add complexity when needed
- **Type Safety First**: Catch errors at compile time

## Contributing

Contributions are welcome! See the [Contributing Guide](https://trugraph.github.io/backend-generator/contributing.html).

## Publishing

For maintainers: see the [Publishing Guide](https://trugraph.github.io/backend-generator/publishing.html) for the release process.

## License

ISC

## Links

- [Documentation](https://trugraph.github.io/backend-generator/)
- [GitHub Repository](https://github.com/trugraph/backend-generator)
- [npm Package](https://www.npmjs.com/package/@tgraph/backend-generator)
- [Issues](https://github.com/trugraph/backend-generator/issues)

---

Made with love by the TruGraph team.
