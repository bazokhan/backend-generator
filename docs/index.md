---
layout: default
title: Home
nav_order: 1
description: "Transform your Prisma schema into production-ready NestJS APIs and React Admin dashboards"
permalink: /
---

# TGraph Backend Generator

Transform your Prisma schema into a complete NestJS backend and React Admin dashboard with a single command.

## What is TGraph Backend Generator?

TGraph Backend Generator is a powerful CLI toolkit that automatically generates production-ready code from your Prisma schema. It creates type-safe NestJS APIs, DTOs, services, controllers, and React Admin dashboard pages—all while preserving your custom code.

## Features

- **Full-Stack Generation** – Generate NestJS backend APIs and React Admin dashboard pages from Prisma schemas
- **Type Safety** – End-to-end TypeScript types from database to frontend
- **Smart Introspection** – Discovers your project structure and preserves manual code
- **Field Directives** – Control generation behavior with schema comments (`@tg_format`, `@tg_upload`, `@tg_readonly`)
- **Composable Architecture** – Use the CLI or embed generators in your build pipeline
- **Safe Regeneration** – Auto-generated files are clearly marked and safe to regenerate
- **Validation** – Automatic class-validator decorators from Prisma schema constraints
- **Admin Authentication** – All generated endpoints respect authentication guards

## Quick Links

### Getting Started

- [Installation & Setup](./getting-started.html)
- [Quick Start Tutorial](./quick-start.html)

### Guides

- [Prisma Schema Setup](./guides/prisma-setup.html)
- [Field Directives](./guides/field-directives.html)
- [Naming Conventions](./guides/naming-conventions.html)
- [Customization](./guides/customization.html)

### Recipes

- [Basic CRUD Generation](./recipes/basic-crud.html)
- [File Upload Fields](./recipes/file-uploads.html)
- [Custom Validation](./recipes/custom-validation.html)
- [Extending Generated Code](./recipes/extending-generated-code.html)

### Reference

- [CLI Reference](./cli-reference.html)
- [SDK Reference](./sdk-reference.html)
- [API Documentation](./api/generators.html)

### Contributing

- [Architecture Overview](./architecture/overview.html)
- [Philosophy & Principles](./architecture/philosophy.html)
- [Contributing Guide](./contributing.html)
- [Publishing Guide](./publishing.html)

### Help

- [Troubleshooting](./troubleshooting.html)

## Installation

```bash
# Install as project dependency
npm install --save-dev @tgraph/backend-generator

# Or install globally
npm install -g @tgraph/backend-generator
```

## Basic Usage

```bash
# Generate everything
tgraph all

# Generate only API files
tgraph api

# Generate only dashboard
tgraph dashboard

# Generate only DTOs
tgraph dtos
```

## Example

Mark your Prisma models with `// @tg_form()`:

```prisma
// @tg_form()
model User {
  id        String    @id @default(uuid())
  firstName String
  lastName  String
  email     String    @unique
  role      Role      @default(USER)
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

Run the generator:

```bash
tgraph all
```

You get:

- NestJS controller with REST endpoints (`/tg-api/users`)
- Service with CRUD operations
- Create/Update DTOs with validation
- React Admin List/Edit/Create/Show pages
- Studio page for bulk editing

## Philosophy

TGraph Backend Generator embraces **convention over configuration**. It provides excellent defaults while remaining highly customizable. The generator:

- **Preserves manual code** – Auto-generated sections are clearly bounded
- **Follows best practices** – REST conventions, TypeScript standards, React Admin patterns
- **Stays out of your way** – Generated files use distinct naming (`.tg.` suffix)
- **Enables incremental adoption** – Opt-in per model with `@tg_form()`

## Requirements

- Node.js 18.0.0 or newer
- A NestJS + React Admin project
- Prisma schema

## License

ISC

---

Ready to get started? Head to the [Getting Started Guide](./getting-started.html).
