---
title: Blog Example
---

# Example 02: Blog

**Source:** [`examples/02-blog/`](https://github.com/trugraph/backend-generator/tree/main/examples/02-blog)

Multiple related models, JWT authentication, and a React Admin dashboard — all generated from a Prisma schema.

## What You'll Build

- REST API for User, Post, Category with `@UseGuards(JwtAuthGuard)`
- React Admin dashboard with relation pickers, file uploads, and auth
- Login endpoint at `POST /auth/login`

## Schema

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
  posts     Post[]
}

// @tg_form()
// @tg_label(title)
model Post {
  title      String
  content    String
  author     User     @relation(fields: [authorId], references: [id])
  authorId   String
  category   Category @relation(fields: [categoryId], references: [id])
  categoryId String
  /// @tg_upload(image)
  coverImage String?
}

// @tg_form()
// @tg_label(name)
model Category {
  name  String @unique
  posts Post[]
}
```

Key directives:
- `// @tg_label(name)` — sets the display field for `ReferenceInput` in React Admin
- `/// @tg_format(email)` — adds `@IsEmail()` to the DTO
- `/// @tg_format(password)` — marks as password field (masked in forms)
- `/// @tg_upload(image)` — generates `FileInput` / `ImageField` in the dashboard

## Config

```typescript
export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'tg-api',
  apiSuffix: 'Admin',
  authenticationEnabled: true,
  requireAdmin: false,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  dashboard: { root: 'src/dashboard/src' },
  nonInteractive: true,
};
```

## Quick Start

```bash
cd examples/02-blog
npm install && cd src/dashboard && npm install && cd ../..
npx prisma migrate dev --name init
npx tgraph static --include paginated-search-query.dto,paginated-search-result.dto,api-response.dto,pagination.interceptor,paginated-search.decorator,paginated-search.util
npx tgraph all
npm run start:dev
```

In a second terminal:

```bash
cd src/dashboard && npm run dev
```

## Create a User

```bash
curl -X POST http://localhost:3000/tg-api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane", "email": "jane@example.com", "password": "secret123"}'
```

Then log in at **http://localhost:5173** with those credentials.

## Generated Files

After `tgraph all`:

```
src/features/
├── user/
│   ├── user.admin.tg.controller.ts
│   ├── user.admin.tg.service.ts
│   ├── create-user.admin.tg.dto.ts   ← @IsEmail() on email field
│   └── update-user.admin.tg.dto.ts
├── post/
│   ├── post.admin.tg.controller.ts
│   └── ...
└── category/
    └── ...

src/dashboard/src/
├── App.tsx                            ← updated with User/Post/Category resources
└── resources/
    ├── users/
    │   ├── UserList.tsx
    │   ├── UserEdit.tsx
    │   ├── UserCreate.tsx
    │   ├── UserShow.tsx
    │   └── UserStudio.tsx
    ├── posts/                         ← ReferenceInput for author + category
    └── categories/
```

## What Makes This Interesting

### Relation Support

The `Post` model has two relations. The generated `PostEdit.tsx` renders:

```tsx
<ReferenceInput source="authorId" reference="users">
  <AutocompleteInput optionText="name" />  {/* @tg_label(name) */}
</ReferenceInput>

<ReferenceInput source="categoryId" reference="categories">
  <AutocompleteInput optionText="name" />
</ReferenceInput>
```

### File Upload

The `/// @tg_upload(image)` directive on `coverImage` generates:

```tsx
<FileInput source="coverImage" accept="image/*">
  <ImageField source="src" />
</FileInput>
```
