# Getting Started

This guide walks you through installing and configuring TGraph Backend Generator in your project.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.0.0 or newer
- **npm** 9.x or newer (or equivalent package manager)
- A **NestJS** backend project
- A **React Admin** dashboard (optional, for dashboard generation)
- A **Prisma** schema file

## Installation

### As a Project Dependency (Recommended)

Install TGraph Backend Generator in your project:

```bash
npm install --save-dev @tgraph/backend-generator
```

Add scripts to your `package.json`:

```json
{
  "scripts": {
    "generate": "tgraph all",
    "generate:api": "tgraph api",
    "generate:dashboard": "tgraph dashboard",
    "generate:dtos": "tgraph dtos"
  }
}
```

### Global Installation

For use across multiple projects:

```bash
npm install -g @tgraph/backend-generator
```

Then run `tgraph` directly from any project directory.

## Project Structure Requirements

TGraph Backend Generator expects a standard NestJS + React Admin structure:

```
your-project/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.module.ts
│   ├── features/          # Feature modules
│   │   ├── user/
│   │   │   ├── user.module.ts
│   │   │   ├── user.service.ts
│   │   │   └── ...
│   │   └── ...
│   └── infrastructure/    # Infrastructure modules
│       └── ...
└── src/dashboard/src/     # React Admin dashboard
    ├── App.tsx
    └── providers/
        └── dataProvider.ts
```

The generator looks for modules in:

- `src/features/<module-name>/`
- `src/infrastructure/<module-name>/`

If a module doesn't exist, the CLI will prompt you to create it.

## Configuration

Create a `config.ts` file in your project root (optional):

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

### Configuration Options

| Option               | Type    | Default                  | Description                   |
| -------------------- | ------- | ------------------------ | ----------------------------- |
| `schemaPath`         | string  | `'prisma/schema.prisma'` | Path to your Prisma schema    |
| `dashboardPath`      | string  | `'src/dashboard/src'`    | React Admin source directory  |
| `dtosPath`           | string  | `'src/dtos/generated'`   | DTO output directory          |
| `suffix`             | string  | `'Tg'`                   | Suffix for generated classes  |
| `isAdmin`            | boolean | `true`                   | Generate admin-only endpoints |
| `updateDataProvider` | boolean | `true`                   | Auto-update data provider     |

You can override these via CLI flags (see [CLI Reference](./cli-reference.md)).

## Marking Models for Generation

Add the `// @tg_form()` comment above any Prisma model you want to generate:

```prisma
// @tg_form()
model User {
  id        String   @id @default(uuid())
  firstName String
  lastName  String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Only models marked with `// @tg_form()` will be processed.

## First Generation

Run your first generation:

```bash
tgraph all
```

This will:

1. Parse your Prisma schema
2. Generate NestJS controllers, services, and DTOs
3. Generate React Admin dashboard pages
4. Update `app.module.ts` with auto-generated imports
5. Update the data provider with endpoint mappings

## Verify the Output

After generation, you should see:

### Backend Files

```
src/features/user/
├── create-user.tg.dto.ts      # Create DTO
├── update-user.tg.dto.ts      # Update DTO
├── user.tg.service.ts         # CRUD service
└── user.tg.controller.ts      # REST controller
```

### Dashboard Files

```
src/dashboard/src/resources/users/
├── UserList.tsx
├── UserEdit.tsx
├── UserCreate.tsx
├── UserShow.tsx
├── UserStudio.tsx
└── index.ts
```

### Updated Files

- `src/app.module.ts` – Imports added between `// AUTO-GENERATED IMPORTS START/END`
- `src/dashboard/src/App.tsx` – Resources and routes added
- `src/dashboard/src/providers/dataProvider.ts` – Endpoint mappings added

## Testing Your API

Start your NestJS server:

```bash
npm run start:dev
```

The generated endpoints are available at:

```
GET    /tg-api/users              List users
GET    /tg-api/users/:id          Get user by ID
POST   /tg-api/users              Create user
PUT    /tg-api/users/:id          Update user
DELETE /tg-api/users/:id          Delete user
```

## Testing Your Dashboard

Start your React Admin dashboard:

```bash
cd src/dashboard
npm run dev
```

Navigate to `/users` to see the generated admin pages.

## Next Steps

- **[Quick Start Tutorial](./quick-start.md)** – Build a complete feature in 5 minutes
- **[Prisma Setup Guide](./guides/prisma-setup.md)** – Learn about field directives and validation
- **[Customization Guide](./guides/customization.md)** – Extend generated code with custom logic
- **[Recipes](./recipes/basic-crud.md)** – Common use cases and patterns

## Troubleshooting

### Module Not Found

If you see:

```
⚠️ No module found for User
Do you want to create the module directory for User? (y/n):
```

Answer `y` to scaffold the module automatically, or create it manually:

```bash
mkdir -p src/features/user
```

### Permission Errors

Ensure your project has write permissions for generated directories.

### TypeScript Errors

Run `npm install` to ensure all peer dependencies are installed, then check your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

For more help, see [Troubleshooting](./troubleshooting.md).
