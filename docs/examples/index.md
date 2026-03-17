---
title: Examples
---

# Examples

Three self-contained NestJS project skeletons that demonstrate TGraph from schema to running API. Each example contains only the **starting state** — you run `tgraph all` to generate the full API and dashboard.

## Getting Started with Examples

Clone the repository and navigate to any example:

```bash
git clone https://github.com/trugraph/backend-generator.git
cd backend-generator/examples/01-todo-app
npm install
```

Then follow the README in each example directory.

---

## Examples Overview

### [01 — Todo App](./todo-app)

**Complexity:** Beginner
**Auth:** None
**Dashboard:** No

The simplest possible example. One model, no authentication, no dashboard. Proves the core generation works.

```prisma
// @tg_form()
model Todo {
  id          String   @id @default(uuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  /// @tg_readonly
  createdAt   DateTime @default(now())
}
```

Run `tgraph api` → get a full CRUD REST API with pagination and Swagger docs.

---

### [02 — Blog](./blog)

**Complexity:** Intermediate
**Auth:** JWT
**Dashboard:** React Admin

Multiple related models, JWT authentication, and a React Admin dashboard.

```prisma
// @tg_form()
model User { ... }

// @tg_form()
model Post {
  author    User     @relation(...)
  category  Category @relation(...)
  /// @tg_upload(image)
  coverImage String?
}

// @tg_form()
model Category { ... }
```

Run `tgraph all` → get API + React Admin dashboard with relation support, file uploads, and auth.

---

### [03 — E-commerce RBAC](./ecommerce-rbac)

**Complexity:** Advanced
**Auth:** JWT + RolesGuard (ADMIN/CUSTOMER)
**Dashboard:** React Admin with admin-only login

Full showcase. Five models, role-based access control, enums, complex relations.

```prisma
enum Role { ADMIN CUSTOMER }
enum OrderStatus { PENDING PROCESSING SHIPPED DELIVERED CANCELLED }

// @tg_form()
model User { role Role @default(CUSTOMER) ... }
model Product { /// @tg_upload(image) image String? ... }
model Order { status OrderStatus ... items OrderItem[] ... }
```

Run `tgraph all` → full e-commerce admin API with `@UseGuards(JwtAuthGuard, RolesGuard)` on every endpoint.

---

## What Each Example Contains

Each example directory contains:

```
examples/<name>/
├── README.md                    # Step-by-step guide
├── package.json                 # Dependencies
├── tsconfig.json
├── nest-cli.json
├── .env                         # DATABASE_URL, JWT_SECRET
├── prisma/
│   └── schema.prisma            # Starting schema with @tg_form() directives
├── tgraph.config.ts             # Flat UserConfig — the only config needed
└── src/
    ├── main.ts                  # Bootstrap with Swagger
    ├── app.module.ts            # Minimal — tgraph adds module imports
    ├── infrastructure/database/
    │   └── prisma.service.ts
    ├── auth/                    # (for auth examples)
    └── dashboard/src/           # (for dashboard examples)
```

The generated code appears **after** you run `tgraph` commands — it is not committed to the repository.
