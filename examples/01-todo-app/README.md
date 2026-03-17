# Example 01: Todo App

The simplest possible TGraph example. No auth, no dashboard — just a clean REST API with pagination.

## What This Demonstrates

- `// @tg_form()` marks a model for generation
- `/// @tg_readonly` fields excluded from create/update DTOs
- Flat `UserConfig` with auth disabled
- `nonInteractive: true` for scripted generation

## Setup

```bash
npm install
```

## Step 1: Run the Database Migration

```bash
npx prisma migrate dev --name init
```

## Step 2: Generate Static Infrastructure

```bash
npx tgraph static --include paginated-search-query.dto,paginated-search-result.dto,api-response.dto,pagination.interceptor,paginated-search.decorator,paginated-search.util
```

## Step 3: Generate the API

```bash
npx tgraph api
```

This generates:
- `src/features/todo/todo.controller.ts` — REST controller with `GET /api/todos`, `POST /api/todos`, etc.
- `src/features/todo/todo.service.ts` — CRUD service with Prisma
- `src/features/todo/create-todo.dto.ts` — DTO (title, description, completed)
- `src/features/todo/update-todo.dto.ts` — partial update DTO
- `src/app.module.ts` — updated with TodoModule import

## Step 4: Start the Server

```bash
npm run start:dev
```

## Step 5: Try It

Open Swagger UI at **http://localhost:3000/api**

Or use curl:

```bash
# Create a todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'

# List todos (paginated)
curl "http://localhost:3000/api/todos?page=1&limit=10"

# Mark complete
curl -X PUT http://localhost:3000/api/todos/<id> \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete
curl -X DELETE http://localhost:3000/api/todos/<id>
```

## Regenerating After Schema Changes

```bash
npx tgraph api
```

Only `.tg.`-suffixed files are overwritten. Any custom code you've added is preserved.

## Project Structure After Generation

```
src/
├── app.module.ts              ← updated with TodoModule
├── main.ts
├── infrastructure/
│   └── database/
│       └── prisma.service.ts
├── dtos/                      ← generated static DTOs
│   ├── paginated-search-query.dto.ts
│   ├── paginated-search-result.dto.ts
│   └── api-response.dto.ts
├── interceptors/
│   └── pagination.interceptor.ts
└── features/
    └── todo/
        ├── todo.module.ts
        ├── todo.tg.controller.ts   ← generated
        ├── todo.tg.service.ts      ← generated
        ├── create-todo.tg.dto.ts   ← generated
        └── update-todo.tg.dto.ts   ← generated
```
