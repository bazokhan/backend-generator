---
title: E-commerce RBAC Example
---

# Example 03: E-commerce RBAC

**Source:** [`examples/03-ecommerce-rbac/`](https://github.com/trugraph/backend-generator/tree/main/examples/03-ecommerce-rbac)

Full showcase. Five models, role-based access control, Prisma enums, complex relations, and a React Admin dashboard that only allows ADMIN users.

## What You'll Build

- Admin API for User, Category, Product, Order, OrderItem
- Every endpoint protected by `@UseGuards(JwtAuthGuard, RolesGuard)`
- React Admin dashboard — login rejects non-ADMIN users
- Seed data: admin user + sample products

## Schema Highlights

```prisma
enum Role { ADMIN CUSTOMER }
enum OrderStatus { PENDING PROCESSING SHIPPED DELIVERED CANCELLED }

// @tg_form()
model User {
  role  Role  @default(CUSTOMER)
  ...
}

// @tg_form()
model Product {
  /// @tg_upload(image)
  image     String?
  category  Category @relation(...)
  price     Float
  stock     Int
}

// @tg_form()
model Order {
  status  OrderStatus @default(PENDING)
  user    User        @relation(...)
  items   OrderItem[]
  total   Float
}
```

## Config

```typescript
export const config: UserConfig = {
  apiPrefix: 'admin-api',
  apiSuffix: 'Admin',
  authenticationEnabled: true,
  requireAdmin: true,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  adminGuards: [{ name: 'RolesGuard', importPath: '@/auth/roles.guard' }],
  dashboard: { root: 'src/dashboard/src' },
};
```

The `adminGuards` field is the key difference from example 02. When `requireAdmin: true`, both `guards` AND `adminGuards` are applied:

```typescript
@Controller('admin-api/products')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← both guards
export class ProductAdminController { ... }
```

## Quick Start

```bash
cd examples/03-ecommerce-rbac
npm install && cd src/dashboard && npm install && cd ../..
npx prisma migrate dev --name init
npx tgraph static --include paginated-search-query.dto,paginated-search-result.dto,api-response.dto,pagination.interceptor,paginated-search.decorator,paginated-search.util
npx tgraph all
npm run seed
npm run start:dev
```

In a second terminal:

```bash
cd src/dashboard && npm run dev
```

## Login

Navigate to **http://localhost:5173** and log in:

- **Email:** admin@example.com
- **Password:** admin123

The `authProvider` checks `user.role === 'ADMIN'` and rejects CUSTOMER logins.

## Generated Files

After `tgraph all`:

```
src/features/
├── user/
├── category/
├── product/           ← @UseGuards(JwtAuthGuard, RolesGuard)
├── order/
└── order-item/

src/dashboard/src/resources/
├── users/
├── categories/
├── products/          ← FileInput for image, ReferenceInput for category
├── orders/            ← SelectInput for OrderStatus enum
└── order-items/
```

## Enum Handling

The `OrderStatus` enum is automatically handled in the dashboard:

```tsx
// Generated in OrderEdit.tsx
<SelectInput source="status" choices={[
  { id: 'PENDING', name: 'Pending' },
  { id: 'PROCESSING', name: 'Processing' },
  { id: 'SHIPPED', name: 'Shipped' },
  { id: 'DELIVERED', name: 'Delivered' },
  { id: 'CANCELLED', name: 'Cancelled' },
]} />
```

## RolesGuard Implementation

The hand-written `RolesGuard` checks the `role` property set by `JwtStrategy`:

```typescript
// src/auth/roles.guard.ts
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return true;
  }
}
```

The JWT strategy includes `role` in the token payload:

```typescript
// src/auth/auth.service.ts — login()
const token = this.jwtService.sign({
  sub: user.id,
  email: user.email,
  role: user.role,   // ← included in payload
});
```
