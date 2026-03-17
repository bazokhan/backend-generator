---
layout: home
title: TGraph Backend Generator

hero:
  name: TGraph
  text: Prisma → NestJS + React Admin
  tagline: Transform your Prisma schema into a complete, production-ready backend and admin dashboard with a single command.
  image:
    src: /logo.png
    alt: TGraph
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Quick Start
      link: /quick-start
    - theme: alt
      text: View on GitHub
      link: https://github.com/trugraph/backend-generator

features:
  - icon: ⚡
    title: One Command
    details: Run `tgraph all` and get controllers, services, DTOs, and React Admin pages — all generated from your Prisma schema.
  - icon: 🔒
    title: Type-Safe End to End
    details: Full TypeScript from database to frontend. Generated DTOs include class-validator decorators derived from schema constraints.
  - icon: 🎛️
    title: Field Directives
    details: Annotate your Prisma fields with `@tg_format`, `@tg_upload`, `@tg_readonly` to control exactly how each field is rendered and validated.
  - icon: 🛡️
    title: Authentication Built In
    details: Generated controllers respect your guards config — JWT, admin role, or any custom guard composition you define.
  - icon: 🔄
    title: Safe Regeneration
    details: Auto-generated files use `.tg.` suffix and are safe to regenerate. Your custom code is never touched.
  - icon: 📊
    title: React Admin Dashboard
    details: Full CRUD admin pages with relations, file uploads, autocomplete, and Studio (spreadsheet) views generated automatically.
---

## Installation

```bash
npm install --save-dev @tgraph/backend-generator
```

## Usage

```bash
# Initialize config
tgraph init

# Generate everything
tgraph all

# Or individually
tgraph api        # NestJS controllers, services, DTOs
tgraph dashboard  # React Admin pages
tgraph dtos       # Response DTOs
tgraph static     # Guards, interceptors, utilities
```

## Example

Annotate your Prisma model:

```prisma
// @tg_form()
// @tg_label(name)
model User {
  id        String   @id @default(uuid())
  name      String
  /// @tg_format(email)
  email     String   @unique
  /// @tg_format(password)
  password  String
  role      Role     @default(USER)
  /// @tg_readonly
  createdAt DateTime @default(now())
}
```

Configure once in `tgraph.config.ts`:

```typescript
import type { UserConfig } from '@tgraph/backend-generator';

export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'tg-api',
  apiSuffix: 'Admin',
  authenticationEnabled: true,
  requireAdmin: true,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  dashboard: { root: 'src/dashboard/src' },
};
```

Run `tgraph all` and get:

- `src/features/user/user.admin.controller.ts` — REST endpoints with `@UseGuards(JwtAuthGuard)`
- `src/features/user/user.admin.service.ts` — CRUD service with Prisma
- `src/features/user/create-user.admin.dto.ts` — validated DTO with `@IsEmail()`
- `src/dashboard/src/resources/users/` — List, Edit, Create, Show, Studio pages
