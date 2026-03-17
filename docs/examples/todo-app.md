---
title: Todo App Example
---

# Example 01: Todo App

**Source:** [`examples/01-todo-app/`](https://github.com/trugraph/backend-generator/tree/main/examples/01-todo-app)

The simplest possible TGraph project. One model, no auth, no dashboard — just a clean REST API with pagination and Swagger docs.

## What You'll Build

After running `tgraph api`, you get a fully functional REST API:

```
GET    /api/todos         List todos (paginated + searchable)
GET    /api/todos/:id     Get one todo
POST   /api/todos         Create todo
PUT    /api/todos/:id     Update todo
DELETE /api/todos/:id     Delete todo
```

Swagger UI available at `http://localhost:3000/api`.

## Schema

```prisma
// @tg_form()
model Todo {
  id          String   @id @default(uuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  /// @tg_readonly
  createdAt   DateTime @default(now())
  /// @tg_readonly
  updatedAt   DateTime @updatedAt
}
```

- `// @tg_form()` — marks the model for generation
- `/// @tg_readonly` — excludes `createdAt` and `updatedAt` from create/update DTOs

## Config

```typescript
export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'api',
  apiSuffix: '',
  authenticationEnabled: false,
  requireAdmin: false,
  guards: [],
  dashboard: false,
  nonInteractive: true,
};
```

## Quick Start

```bash
cd examples/01-todo-app
npm install
npx prisma migrate dev --name init
npx tgraph static --include paginated-search-query.dto,paginated-search-result.dto,api-response.dto,pagination.interceptor,paginated-search.decorator,paginated-search.util
npx tgraph api
npm run start:dev
```

Open **http://localhost:3000/api** for Swagger UI.

## Generated Files

After `tgraph api`, these files appear:

```
src/features/todo/
├── todo.module.ts              ← auto-created
├── todo.tg.controller.ts       ← GET/POST/PUT/DELETE /api/todos
├── todo.tg.service.ts          ← CRUD with Prisma
├── create-todo.tg.dto.ts       ← { title, description?, completed? }
└── update-todo.tg.dto.ts       ← partial create DTO

src/dtos/
├── paginated-search-query.dto.ts
├── paginated-search-result.dto.ts
└── api-response.dto.ts
```

`src/app.module.ts` is updated with the `TodoModule` import.

## Key Concepts

### `@tg_readonly` fields

Fields annotated with `/// @tg_readonly` are excluded from DTOs:

```typescript
// Generated create-todo.tg.dto.ts
export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  // createdAt and updatedAt NOT included — they're @tg_readonly
}
```

### Pagination

The generated controller uses `PaginatedSearchQueryDto` for list endpoints:

```typescript
@Get()
async findAll(@Query() query: PaginatedSearchQueryDto) {
  // Supports: ?page=1&limit=10&search=groceries&sortBy=createdAt&sortOrder=desc
}
```

## Regenerating

When you update your schema, just re-run:

```bash
npx tgraph api
```

Only `.tg.` files are overwritten. Any custom code you've added is preserved.
