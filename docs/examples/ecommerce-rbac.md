---
title: E-commerce RBAC Example
---

# Example 03: E-commerce RBAC

**Source:** [`examples/03-ecommerce-rbac/`](https://github.com/bazokhan/backend-generator/tree/main/examples/03-ecommerce-rbac)

Full showcase. Five models, role-based access control, Prisma enums, complex relations, and a React Admin dashboard that only allows ADMIN users.

## What This Demonstrates

- Five models with complex relations: `User → Order → OrderItem → Product → Category`
- `enum Role { ADMIN CUSTOMER }` — RBAC with `RolesGuard`
- `enum OrderStatus { PENDING PROCESSING ... }` — enum field support
- `/// @tg_upload(image)` — file upload fields
- `adminGuards` — a separate authorization guard applied on top of the authentication guard
- `requireAdmin: true` — all endpoints require admin role
- Seed data script for instant setup
- **Automatic dashboard scaffolding** — `tgraph all` creates the Vite/React project for you

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- [npm](https://www.npmjs.com/) 9 or higher
- NestJS CLI: `npm install -g @nestjs/cli`

## Step-by-Step Setup

### 1. Navigate to the example

```bash
cd examples/03-ecommerce-rbac
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Set up the database

```bash
npx prisma migrate dev --name init
```

Creates `prisma/dev.db` with all tables (User, Category, Product, Order, OrderItem).

### 4. Generate the API and dashboard

```bash
npx tgraph all
```

This:
1. **Scaffolds the dashboard project** — creates `src/dashboard/package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, and `src/providers/authProvider.ts` if they don't already exist. Running again is safe.
2. **Generates the NestJS API** — controllers, services, and DTOs for all 5 models.
3. **Generates the React Admin dashboard** — pages for all 5 models.

### 5. Install dashboard dependencies

```bash
cd src/dashboard && npm install && cd ../..
```

### 6. Seed the database

```bash
npm run seed
```

Creates:

```
✅ Created admin: admin@example.com
Created categories: Electronics Clothing
Created products

Seed complete!
Login at http://localhost:5173 with:
  Email: admin@example.com
  Password: admin123
```

### 7. Start the backend

```bash
npm run start:dev
```

```
Server running at http://localhost:3003
Swagger UI at http://localhost:3003/api
```

### 8. Start the dashboard (new terminal)

```bash
cd src/dashboard && npm run dev
```

```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

## Verify It Works

### Login as admin

```bash
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

Response includes `role: "ADMIN"` in the user object.

### Call a protected endpoint

```bash
TOKEN="eyJ..."

curl http://localhost:3003/admin-api/productsAdmin \
  -H "Authorization: Bearer $TOKEN"
```

### Verify RBAC rejects non-admin

```bash
# First create a customer user (using admin token)
curl -X POST http://localhost:3003/admin-api/usersAdmin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Customer", "email": "customer@example.com", "password": "pass123", "role": "CUSTOMER"}'

# Login as customer
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "pass123"}'

# Try to access admin API with customer token — expect 403
CUSTOMER_TOKEN="eyJ..."
curl http://localhost:3003/admin-api/productsAdmin \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
# → {"statusCode":403,"message":"Admin access required"}
```

### Test the dashboard

1. Open **[http://localhost:5173](http://localhost:5173)**
2. Log in with `admin@example.com` / `admin123`
3. All 5 models (Users, Categories, Products, Orders, Order Items) appear in the sidebar
4. Try creating a Product — notice the **Category** dropdown (ReferenceInput) and the **Image** file picker
5. Try creating an Order — notice the **Status** dropdown (SelectInput from enum) and **User** picker
6. Try logging in with a CUSTOMER account — the dashboard will reject it

## Project Structure

Before running `tgraph all`:

```
examples/03-ecommerce-rbac/
├── .env                              ← DATABASE_URL + JWT_SECRET
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                       ← admin user + sample data
├── src/
│   ├── app.module.ts
│   ├── main.ts                       ← CORS enabled for dashboard
│   ├── auth/                         ← hand-written JWT + RBAC
│   │   ├── auth.controller.ts        ← POST /auth/login (returns role in token)
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts           ← includes role in JWT payload
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt.strategy.ts           ← extracts role from token
│   │   └── roles.guard.ts            ← checks user.role === 'ADMIN'
│   ├── infrastructure/database/
│   │   └── prisma.service.ts
│   └── dashboard/src/
│       ├── App.tsx                   ← pre-written with httpClient + authProvider
│       └── providers/
│           └── authProvider.ts       ← checks role on login
```

After running `tgraph all`:

```
src/
├── user/                             ← generated by tgraph all
├── category/                         ← generated by tgraph all
├── product/                          ← generated by tgraph all
├── order/                            ← generated by tgraph all
├── order-item/                       ← generated by tgraph all
└── dashboard/
    ├── package.json                  ← scaffolded by tgraph
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx                  ← scaffolded by tgraph
        ├── App.tsx                   ← updated with all 5 resource registrations
        ├── providers/
        │   ├── authProvider.ts       ← hand-written (not overwritten)
        │   └── fieldDirectives.generated.ts
        └── resources/
            ├── users/
            ├── categories/
            ├── products/             ← FileInput for image, ReferenceInput for category
            ├── orders/               ← SelectInput for OrderStatus, ReferenceInput for user
            └── order-items/          ← ReferenceInput for order + product
```

## Schema

```prisma
enum Role {
  ADMIN
  CUSTOMER
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

// @tg_form()
// @tg_label(name)
model User {
  id        String   @id @default(uuid())
  name      String
  /// @tg_format(email)
  email     String   @unique
  /// @tg_format(password)
  password  String
  role      Role     @default(CUSTOMER)
  /// @tg_readonly
  createdAt DateTime @default(now())
  orders    Order[]
}

// @tg_form()
// @tg_label(name)
model Category {
  id       String    @id @default(uuid())
  name     String    @unique
  products Product[]
}

// @tg_form()
// @tg_label(name)
model Product {
  id          String      @id @default(uuid())
  name        String
  description String?
  price       Float
  stock       Int         @default(0)
  /// @tg_upload(image)
  image       String?
  category    Category    @relation(fields: [categoryId], references: [id])
  categoryId  String
  /// @tg_readonly
  createdAt   DateTime    @default(now())
  orderItems  OrderItem[]
}

// @tg_form()
model Order {
  id        String      @id @default(uuid())
  user      User        @relation(fields: [userId], references: [id])
  userId    String
  status    OrderStatus @default(PENDING)
  total     Float
  /// @tg_readonly
  createdAt DateTime    @default(now())
  items     OrderItem[]
}

// @tg_form()
model OrderItem {
  id        String  @id @default(uuid())
  order     Order   @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product @relation(fields: [productId], references: [id])
  productId String
  quantity  Int
  price     Float
}
```

## Config

```typescript
export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'admin-api',
  apiSuffix: 'Admin',
  authenticationEnabled: true,
  requireAdmin: true,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  adminGuards: [{ name: 'RolesGuard', importPath: '@/auth/roles.guard' }],
  dashboard: { root: 'src/dashboard/src' },
  nonInteractive: true,
};
```

## Key Concepts

### `adminGuards` and `requireAdmin`

`adminGuards` is the key difference from example 02. When `requireAdmin: true`, TGraph applies **both** `guards` and `adminGuards` to every generated controller:

```typescript
@Controller('admin-api/productsAdmin')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← authentication + authorization
export class ProductAdminController { ... }
```

- `JwtAuthGuard` validates the JWT token (are you logged in?)
- `RolesGuard` checks the role (are you an admin?)

If only `guards` were used (no `adminGuards`), any authenticated user — including customers — could access the API.

### Enum Support

Prisma enums are automatically surfaced in the dashboard as `SelectInput` components:

```tsx
// Generated in OrderCreate.tsx / OrderEdit.tsx
<SelectInput source="status" choices={[
  { id: 'PENDING', name: 'Pending' },
  { id: 'PROCESSING', name: 'Processing' },
  { id: 'SHIPPED', name: 'Shipped' },
  { id: 'DELIVERED', name: 'Delivered' },
  { id: 'CANCELLED', name: 'Cancelled' },
]} />
```

And in the DTO:

```typescript
// Generated create-order.admin.tg.dto.ts
import { OrderStatus } from '../../../generated/prisma';

@IsEnum(OrderStatus)
@IsOptional()
status?: OrderStatus;
```

### RBAC Implementation

The hand-written `RolesGuard` checks the `role` property that `JwtStrategy` extracts from the token:

```typescript
// src/auth/roles.guard.ts
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('Authentication required');
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return true;
  }
}
```

The login endpoint includes `role` in the JWT payload:

```typescript
// src/auth/auth.service.ts
const token = this.jwtService.sign({
  sub: user.id,
  email: user.email,
  role: user.role,  // ← extracted by jwt.strategy.ts → validate()
});
```

The dashboard's `authProvider` blocks non-admin logins at the UI level:

```typescript
// src/dashboard/src/providers/authProvider.ts
login: async ({ username, password }) => {
  // ...
  if (data.user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  // store token...
}
```

### Dashboard Scaffold (automatic)

`tgraph all` (or `tgraph dashboard`) automatically creates the Vite/React project structure if it doesn't exist yet. You never need to manually create `package.json` or `vite.config.ts`. The scaffold is idempotent — existing files (including your custom `authProvider.ts`) are never overwritten.

## Regenerating After Schema Changes

```bash
npx tgraph all
```

Safe to run multiple times. Only `.tg.`-suffixed files are regenerated. The scaffold and hand-written files are skipped.
