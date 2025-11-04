# TGraph Backend Generator

> Transform your Prisma schema into production-ready NestJS APIs and React Admin dashboards with a single command.

[![npm version](https://img.shields.io/npm/v/@tgraph/backend-generator.svg)](https://www.npmjs.com/package/@tgraph/backend-generator)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Features

- **Full-Stack Generation** – Generate NestJS controllers, services, DTOs, and React Admin pages from Prisma schemas
- **Type Safety** – End-to-end TypeScript types from database to frontend
- **Smart Introspection** – Automatically discovers your project structure
- **Field Directives** – Fine-grained control with `@tg_format`, `@tg_upload`, `@tg_readonly`
- **Safe Regeneration** – Preserves your custom code, regenerates boilerplate
- **Convention Over Configuration** – Works out of the box with sensible defaults

## Quick Start

```bash
# Install
npm install --save-dev @tgraph/backend-generator

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
- ✅ Services with CRUD operations
- ✅ DTOs with class-validator decorators
- ✅ Automatic AppModule updates

### Frontend (React Admin)

- ✅ List/Edit/Create/Show pages
- ✅ Studio pages (spreadsheet-like editing)
- ✅ Type-appropriate inputs (date pickers, file uploads, etc.)
- ✅ Relation handling with autocomplete

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

# Generate only API
tgraph api

# Generate only dashboard
tgraph dashboard

# With options
tgraph all --suffix Admin --no-update-data-provider
```

## Requirements

- Node.js 18.0.0 or newer
- NestJS project with Prisma
- React Admin dashboard (optional, for dashboard generation)

## Documentation

📚 **[Complete Documentation](./docs/index.md)**

- [Getting Started](./docs/getting-started.md) – Installation and setup
- [Quick Start Tutorial](./docs/quick-start.md) – Build a blog in 5 minutes
- [Prisma Setup](./docs/guides/prisma-setup.md) – Configure your schema
- [Field Directives](./docs/guides/field-directives.md) – Control generation behavior
- [Recipes](./docs/recipes/basic-crud.md) – Practical examples
- [CLI Reference](./docs/cli-reference.md) – All commands and options
- [SDK Reference](./docs/sdk-reference.md) – Programmatic usage
- [Troubleshooting](./docs/troubleshooting.md) – Common issues

## Configuration

Create `config.ts` in your project root:

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

Or use CLI flags to override on the fly.

## Programmatic Usage

```typescript
import { ApiGenerator, DashboardGenerator } from '@tgraph/backend-generator';

const generator = new ApiGenerator(config);
await generator.generate();

const dashboard = new DashboardGenerator(config);
await dashboard.generate();
```

See [SDK Reference](./docs/sdk-reference.md) for complete API documentation.

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

See [Field Directives Guide](./docs/guides/field-directives.md) for all directives.

## Philosophy

TGraph Backend Generator follows these principles:

- **Convention over Configuration** – Works out of the box
- **Generate, Don't Replace** – Coexist with custom code
- **Progressive Disclosure** – Start simple, add complexity as needed
- **Type Safety First** – Compile-time error checking

Read more in [Philosophy & Principles](./docs/architecture/philosophy.md).

## Contributing

Contributions are welcome! See [Contributing Guide](./docs/contributing.md).

## Publishing

For maintainers: See [Publishing Guide](./docs/publishing.md) for release process.

## License

ISC

## Links

- [Documentation](./docs/index.md)
- [GitHub Repository](https://github.com/YOUR_ORG/backend-generator)
- [npm Package](https://www.npmjs.com/package/@tgraph/backend-generator)
- [Issues](https://github.com/YOUR_ORG/backend-generator/issues)

---

**Made with ❤️ by the TGraph team**
