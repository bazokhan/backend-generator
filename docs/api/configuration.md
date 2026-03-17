---
title: Configuration Reference
---

# Configuration Reference

Every generator consumes the `UserConfig` interface exported from `@tgraph/backend-generator`. This page documents every field, its default, and how values are inferred from `srcRoot`.

---

## Quick Start

Run `tgraph init` to scaffold `tgraph.config.ts`:

```bash
tgraph init
```

Or create the file manually:

```typescript
// tgraph.config.ts
import type { UserConfig } from '@tgraph/backend-generator';

export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'tg-api',
  apiSuffix: 'Admin',
  authenticationEnabled: true,
  requireAdmin: true,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
  dashboard: { root: 'src/dashboard/src' },
  nonInteractive: false,
};
```

Both `export default` and named `export const config` are supported.

---

## UserConfig Fields

### `schemaPath`

| Type | Default |
|------|---------|
| `string?` | `'prisma/schema.prisma'` |

Path to your Prisma schema file. Resolved relative to the directory containing `tgraph.config.ts`.

---

### `prismaServicePath`

| Type | Default |
|------|---------|
| `string?` | `'{srcRoot}/infrastructure/database/prisma.service.ts'` |

Location of your `PrismaService`. Generated services import it using this path.

---

### `srcRoot`

| Type | Default |
|------|---------|
| `string?` | `'src'` |

Root source directory. **All other path defaults are derived from this value.** Change it once and all inferred paths update automatically.

```typescript
srcRoot: 'src'
// Inferred: appModulePath → 'src/app.module.ts'
// Inferred: dtosPath → 'src/dtos/generated'
// Inferred: modulesPaths → ['src/features', 'src/modules', 'src']
```

---

### `apiPrefix`

| Type | Default |
|------|---------|
| `string?` | `'tg-api'` |

Route prefix applied to every generated controller.

```typescript
apiPrefix: 'tg-api'
// → GET /tg-api/users
```

---

### `apiSuffix`

| Type | Default |
|------|---------|
| `string?` | `''` |

Suffix appended to generated class and file names.

```typescript
apiSuffix: 'Admin'
// → class UserAdminController
// → user.admin.service.ts
// → CreateUserAdminDto
```

---

### `authenticationEnabled`

| Type | Default |
|------|---------|
| `boolean?` | `true` |

Whether to add authentication guards to generated controllers. When `false`, no `@UseGuards()` decorators are emitted.

---

### `requireAdmin`

| Type | Default |
|------|---------|
| `boolean?` | `true` |

When `true` and `authenticationEnabled` is `true`, guards from both `guards` and `adminGuards` are applied.

---

### `guards`

| Type | Default |
|------|---------|
| `Guard[]?` | `[]` |

Base guards applied to all generated controllers when `authenticationEnabled` is `true`.

```typescript
guards: [
  { name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' },
]
```

**Guard interface:**

```typescript
interface Guard {
  name: string;       // Guard class name, e.g., 'JwtAuthGuard'
  importPath: string; // Import path, e.g., '@/auth/jwt-auth.guard'
}
```

---

### `adminGuards`

| Type | Default |
|------|---------|
| `Guard[]?` | `[]` |

Additional guards applied only when both `authenticationEnabled` and `requireAdmin` are `true`.

```typescript
adminGuards: [
  { name: 'RolesGuard', importPath: '@/auth/roles.guard' },
]
```

---

### `dashboard`

| Type | Default |
|------|---------|
| `false \| { root?: string }?` | `false` |

Dashboard generation config. Set to `false` to skip. Provide `{ root }` to enable.

```typescript
// Disable
dashboard: false

// Enable with default root ('src/dashboard/src')
dashboard: {}

// Enable with custom root
dashboard: { root: 'src/admin/src' }
```

---

### `nonInteractive`

| Type | Default |
|------|---------|
| `boolean?` | `false` |

When `true`, all interactive prompts auto-confirm. Required for CI/CD pipelines.

---

### `appModulePath` *(override)*

| Type | Default |
|------|---------|
| `string?` | `'{srcRoot}/app.module.ts'` |

Override the auto-discovered `app.module.ts` path.

---

### `dtosPath` *(override)*

| Type | Default |
|------|---------|
| `string?` | `'{srcRoot}/dtos/generated'` |

Override the DTO output directory. This directory is wiped before regeneration.

---

### `modulesPaths` *(override)*

| Type | Default |
|------|---------|
| `string[]?` | `['{srcRoot}/features', '{srcRoot}/modules', '{srcRoot}']` |

Ordered list of directories where the generator looks for existing modules.

---

## Authentication Mode Examples

### Public API

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
};
```

### Authenticated Users (JWT only)

```typescript
export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'api',
  apiSuffix: '',
  authenticationEnabled: true,
  requireAdmin: false,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  dashboard: false,
};
```

### Admin API (JWT + role guard)

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
};
```

---

## Related

- [CLI Reference](../cli-reference.md) — CLI flags that override config values
- [Generators API](./generators.md) — how each config field is consumed
- [Authentication Guards Guide](../guides/authentication-guards.md) — guard setup details
