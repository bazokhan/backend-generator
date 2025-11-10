# TGraph Backend Generator

> Transform your Prisma schema into production-ready NestJS APIs and React Admin dashboards with a single command.

[![npm version](https://img.shields.io/npm/v/@tgraph/backend-generator.svg)](https://www.npmjs.com/package/@tgraph/backend-generator)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Features

- **Full-Stack Generation** – Generate NestJS controllers, services, DTOs, and React Admin pages from Prisma schemas
- **Type Safety** – End-to-end TypeScript types from database to frontend (including Swagger-generated API clients)
- **Smart Introspection** – Automatically discovers your project structure
- **Unique Field Getters** – Auto-generated methods for fields marked with `@unique` in Prisma
- **Relation Support** – Configurable relation includes in service selects
- **Static Infrastructure** – Generate guards, interceptors, decorators, and utilities
- **Field Directives** – Fine-grained control with `@tg_format`, `@tg_upload`, `@tg_readonly`
- **Safe Regeneration** – Preserves your custom code, regenerates boilerplate
- **Convention Over Configuration** – Works out of the box with sensible defaults
- **Interactive Wizard** – Guided setup with `tgraph init`

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

**Result:** Complete CRUD API + admin dashboard in seconds.

## What Gets Generated

### Backend (NestJS)

- ✅ REST controllers with pagination and search
- ✅ Services with CRUD operations and unique field getters
- ✅ DTOs with class-validator decorators (including array validators)
- ✅ Automatic AppModule updates
- ✅ Static infrastructure files (guards, interceptors, decorators)
- ✅ Configurable relation includes in queries

### Frontend (React Admin)

- ✅ List/Edit/Create/Show pages
- ✅ Studio pages (spreadsheet-like editing)
- ✅ Type-appropriate inputs (date pickers, file uploads, etc.)
- ✅ Relation handling with autocomplete
- ✅ Type-safe API client generated from Swagger

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

**Output:** Instant admin system with working API and dashboard.

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

# Preview pending changes without writing
tgraph preflight

# Generate only API
tgraph api

# Generate only dashboard
tgraph dashboard

# With options
tgraph all --suffix Admin --no-update-data-provider

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
- React Admin dashboard (optional, for dashboard generation)

## Documentation

📚 **[Complete Documentation](https://trugraph.github.io/backend-generator/)**

### Getting Started

- [Getting Started](https://trugraph.github.io/backend-generator/getting-started.html) – Installation and setup
- [Quick Start Tutorial](https://trugraph.github.io/backend-generator/quick-start.html) – Build a blog in 5 minutes
- [CLI Reference](https://trugraph.github.io/backend-generator/cli-reference.html) – All commands and options

### Guides

- [Prisma Setup](https://trugraph.github.io/backend-generator/guides/prisma-setup.html) – Configure your schema
- [Field Directives](https://trugraph.github.io/backend-generator/guides/field-directives.html) – Control generation behavior
- [Authentication Guards](https://trugraph.github.io/backend-generator/guides/authentication-guards.html) – Configure authentication
- [Static Files Generation](https://trugraph.github.io/backend-generator/guides/static-files.html) – Infrastructure generation
- [Dashboard Types Generation](https://trugraph.github.io/backend-generator/guides/dashboard-types.html) – Type-safe API clients

### Advanced

- [Recipes](https://trugraph.github.io/backend-generator/recipes/basic-crud.html) – Practical examples
- [SDK Reference](https://trugraph.github.io/backend-generator/sdk-reference.html) – Programmatic usage
- [Troubleshooting](https://trugraph.github.io/backend-generator/troubleshooting.html) – Common issues

## Configuration

Initialize a configuration file in your project:

```bash
npx tgraph init
```

This creates `tgraph.config.ts` in your project root with default values:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  input: {
    schemaPath: 'prisma/schema.prisma',
  },

  output: {
    backend: {
      dtos: 'src/dtos/generated',
      modules: {
        searchPaths: ['src/features', 'src/modules', 'src'],
        defaultRoot: 'src/features',
      },
      staticFiles: {
        guards: 'src/guards',
        decorators: 'src/decorators',
        dtos: 'src/dtos',
        interceptors: 'src/interceptors',
      },
    },
    dashboard: {
      root: 'src/dashboard/src',
      resources: 'src/dashboard/src/resources',
      swagger: {
        command: 'npm run generate:swagger',
        jsonPath: 'src/dashboard/src/types/swagger.json',
      },
    },
  },

  api: {
    suffix: 'Admin',
    prefix: 'tg-api',
    authentication: {
      enabled: true,
      requireAdmin: true,
      guards: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }],
      adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
    },
    relations: {
      include: [], // or 'all' or ['author', 'comments']
    },
  },

  dashboard: {
    enabled: true,
    updateDataProvider: true,
    components: {
      form: {}, // Override React Admin form components
      display: {}, // Override React Admin display components
    },
  },

  behavior: {
    nonInteractive: false,
  },
};
```

The new structured configuration makes it easy to:

- Generate multiple APIs with different configs (`--config tgraph.admin.config.ts`)
- Customize component imports for consistent UI
- Configure authentication guards per API
- Control where files are generated

Customize the values for your project, or use the `--config` flag to use different configurations.

### Public vs Admin Controllers

- Set `api.authentication.enabled = false` or leave `guards` empty to generate public controllers without `@UseGuards`.
- Set `api.authentication.requireAdmin = true` to add `@IsAdmin()` to controllers.

### Route Prefix

- `api.prefix` controls controller base route (e.g., `tg-api`, `public-api`). This replaces previous hardcoded defaults.

### Static Assets Generation

- During `tgraph api`, you’ll be prompted to generate static files. Use `--yes` for non-interactive generation or `tgraph static --include <names>` for a targeted run.
- Available names include: `admin.guard`, `feature-flag.guard`, `is-admin.decorator`, `paginated-search-query.dto`, `paginated-search-result.dto`, `api-response.dto`, `pagination.interceptor`, `audit.interceptor`, `paginated-search.decorator`, `paginated-search.util`.

### Dashboard API Types

- `tgraph types` reads `<dashboardRoot>/types/swagger.json` and generates `api.ts`. Ensure `swagger.json` is up to date before running.

## Programmatic Usage

```typescript
import { ApiGenerator, DashboardGenerator } from '@tgraph/backend-generator';

const generator = new ApiGenerator(config);
await generator.generate();

const dashboard = new DashboardGenerator(config);
await dashboard.generate();
```

See [SDK Reference](https://trugraph.github.io/backend-generator/sdk-reference.html) for complete API documentation.

## Project Structure

```
your-project/
├── prisma/
│   └── schema.prisma          # Source of truth
├── src/
│   ├── app.module.ts          # Auto-updated
│   ├── features/
│   │   └── user/
│   │       ├── user.tg.controller.ts   # Generated
│   │       ├── user.tg.service.ts      # Generated
│   │       ├── create-user.tg.dto.ts   # Generated
│   │       └── user.service.ts         # Your custom code
│   └── dashboard/src/
│       ├── App.tsx            # Auto-updated
│       └── resources/
│           └── users/
│               ├── UserList.tsx        # Generated
│               ├── UserEdit.tsx        # Generated
│               └── ...
```

## Field Directives

Control generation with special comments:

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

See [Field Directives Guide](https://trugraph.github.io/backend-generator/guides/field-directives.html) for all directives.

## Philosophy

TGraph Backend Generator follows these principles:

- **Convention over Configuration** – Works out of the box
- **Generate, Don't Replace** – Coexist with custom code
- **Progressive Disclosure** – Start simple, add complexity as needed
- **Type Safety First** – Compile-time error checking

Read more in [Philosophy & Principles](https://trugraph.github.io/backend-generator/architecture/philosophy.html).

## Contributing

Contributions are welcome! See [Contributing Guide](https://trugraph.github.io/backend-generator/contributing.html).

## Publishing

For maintainers: See [Publishing Guide](https://trugraph.github.io/backend-generator/publishing.html) for release process.

## License

ISC

## Links

- [Documentation](https://trugraph.github.io/backend-generator/)
- [GitHub Repository](https://github.com/trugraph/backend-generator)
- [npm Package](https://www.npmjs.com/package/@tgraph/backend-generator)
- [Issues](https://github.com/trugraph/backend-generator/issues)

---

**Made with ❤️ by the TruGraph team**
