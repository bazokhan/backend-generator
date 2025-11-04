# Naming Conventions

TGraph Backend Generator follows consistent naming patterns across backend and frontend code generation.

## Overview

All generation scripts use shared naming utilities to ensure consistency between your Prisma models, API endpoints, and dashboard resources.

## Model Naming

### Prisma Model

Use PascalCase for model names:

```prisma
// Good
model CustomFieldType { }
model BlogPost { }
model UserProfile { }

// Avoid
model custom_field_type { }
model blogpost { }
```

## Backend Naming

### API Endpoints

REST endpoints use **kebab-case-plural**:

| Model | Endpoint |
|-------|----------|
| `User` | `/tg-api/users` |
| `BlogPost` | `/tg-api/blog-posts` |
| `CustomFieldType` | `/tg-api/custom-field-types` |

**Example:**

```typescript
@Controller('tg-api/custom-field-types')
export class CustomFieldTypeTgController { }
```

### File Names

TypeScript files use **camelCase** with `.tg.` suffix:

| Model | Controller | Service |
|-------|------------|---------|
| `User` | `user.tg.controller.ts` | `user.tg.service.ts` |
| `BlogPost` | `blogPost.tg.controller.ts` | `blogPost.tg.service.ts` |
| `CustomFieldType` | `customFieldType.tg.controller.ts` | `customFieldType.tg.service.ts` |

**DTO Files:**

| Model | Create DTO | Update DTO |
|-------|------------|------------|
| `User` | `create-user.tg.dto.ts` | `update-user.tg.dto.ts` |
| `BlogPost` | `create-blog-post.tg.dto.ts` | `update-blog-post.tg.dto.ts` |

### Class Names

Classes use **PascalCase** with suffix:

```typescript
// Model: User
export class CreateUserTgDto { }
export class UpdateUserTgDto { }
export class UserTgService { }
export class UserTgController { }

// Model: BlogPost
export class CreateBlogPostTgDto { }
export class UpdateBlogPostTgDto { }
export class BlogPostTgService { }
export class BlogPostTgController { }
```

The suffix (default `Tg`) is configurable via the `suffix` option.

### Module Folders

Modules use **kebab-case**:

```
src/features/
├── user/
├── blog-post/
└── custom-field-type/
```

## Frontend Naming

### Resource Names

React Admin resources use **kebab-case-plural** (matching API endpoints):

```tsx
<Resource
  name="custom-field-types"
  list={CustomFieldTypeList}
  edit={CustomFieldTypeEdit}
  create={CustomFieldTypeCreate}
  show={CustomFieldTypeShow}
/>
```

### Resource Folders

Dashboard folders match resource names:

```
src/dashboard/src/resources/
├── users/
├── blog-posts/
└── custom-field-types/
```

### Component Files

Component files use **PascalCase**:

| Model | List | Edit | Create | Show |
|-------|------|------|--------|------|
| `User` | `UserList.tsx` | `UserEdit.tsx` | `UserCreate.tsx` | `UserShow.tsx` |
| `BlogPost` | `BlogPostList.tsx` | `BlogPostEdit.tsx` | `BlogPostCreate.tsx` | `BlogPostShow.tsx` |

### Component Names

Component names use **PascalCase**:

```tsx
// Model: User
export const UserList = () => { };
export const UserEdit = () => { };

// Model: BlogPost
export const BlogPostList = () => { };
export const BlogPostEdit = () => { };
```

## Data Provider Mapping

The data provider maps resources to endpoints:

```typescript
const endpointMap: Record<string, string> = {
  'users': 'tg-api/users',
  'blog-posts': 'tg-api/blog-posts',
  'custom-field-types': 'tg-api/custom-field-types',
  
  // Custom endpoints can still be added manually
  'feature-flags': 'admin/feature-flags',
};
```

**Note:** Resource names and endpoint paths must match for automatic mapping.

## Complete Example

### Prisma Model

```prisma
// @tg_form()
model CustomFieldType {
  id   String @id @default(uuid())
  name String
}
```

### Generated Backend

**Files:**
```
src/features/custom-field-type/
├── create-custom-field-type.tg.dto.ts
├── update-custom-field-type.tg.dto.ts
├── custom-field-type.tg.service.ts
└── custom-field-type.tg.controller.ts
```

**Controller:**
```typescript
@Controller('tg-api/custom-field-types')
export class CustomFieldTypeTgController { }
```

**Classes:**
```typescript
export class CreateCustomFieldTypeTgDto { }
export class UpdateCustomFieldTypeTgDto { }
export class CustomFieldTypeTgService { }
export class CustomFieldTypeTgController { }
```

### Generated Frontend

**Folder:**
```
src/dashboard/src/resources/custom-field-types/
├── CustomFieldTypeList.tsx
├── CustomFieldTypeEdit.tsx
├── CustomFieldTypeCreate.tsx
├── CustomFieldTypeShow.tsx
├── CustomFieldTypeStudio.tsx
└── index.ts
```

**Resource:**
```tsx
<Resource
  name="custom-field-types"
  list={CustomFieldTypeList}
  edit={CustomFieldTypeEdit}
  create={CustomFieldTypeCreate}
  show={CustomFieldTypeShow}
/>
```

**Route:**
```tsx
<Route path="custom-field-types/studio" element={<CustomFieldTypeStudio />} />
```

**Data Provider:**
```typescript
endpointMap['custom-field-types'] = 'tg-api/custom-field-types';
```

## Naming Utilities

All naming transformations use these utilities from `src/scripts/naming-utils.ts`:

### getApiEndpoint(modelName)

Returns the API endpoint path:

```typescript
getApiEndpoint('User')            // 'tg-api/users'
getApiEndpoint('BlogPost')        // 'tg-api/blog-posts'
getApiEndpoint('CustomFieldType') // 'tg-api/custom-field-types'
```

### getResourceName(modelName)

Returns the frontend resource name:

```typescript
getResourceName('User')            // 'users'
getResourceName('BlogPost')        // 'blog-posts'
getResourceName('CustomFieldType') // 'custom-field-types'
```

### toKebabCase(str)

Converts PascalCase to kebab-case:

```typescript
toKebabCase('User')            // 'user'
toKebabCase('BlogPost')        // 'blog-post'
toKebabCase('CustomFieldType') // 'custom-field-type'
```

### pluralize(str)

Simple English pluralization:

```typescript
pluralize('user')     // 'users'
pluralize('post')     // 'posts'
pluralize('category') // 'categories'
```

## Customization

### Custom Suffix

Override the default `Tg` suffix:

```typescript
// config.ts
export const config: Config = {
  // ...
  suffix: 'Admin',
};
```

Generates:
- `CreateUserAdminDto`
- `UserAdminService`
- `UserAdminController`

### Custom Endpoint Prefix

The `tg-api` prefix is currently hardcoded but can be customized by forking the generator templates.

## Migration Guide

If you're updating from older versions with inconsistent naming:

### Step 1: Backup Your Code

```bash
git add -A
git commit -m "Backup before naming migration"
```

### Step 2: Regenerate

```bash
tgraph api
tgraph dashboard
```

### Step 3: Update Hardcoded References

Search for old endpoint formats and update them:

**Old:**
```typescript
fetch('/tg-api/customFieldType')
```

**New:**
```typescript
fetch('/tg-api/custom-field-types')
```

### Step 4: Update Tests

Update any tests that reference the old naming:

```typescript
// Old
describe('CustomFieldTypeBzController', () => {
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

// New
describe('CustomFieldTypeTgController', () => {
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

## Common Patterns

### Single Word Models

```prisma
model User { }
```

- Endpoint: `/tg-api/users`
- Resource: `users`
- Files: `user.tg.controller.ts`

### Two Word Models

```prisma
model BlogPost { }
```

- Endpoint: `/tg-api/blog-posts`
- Resource: `blog-posts`
- Files: `blogPost.tg.controller.ts`

### Three+ Word Models

```prisma
model CustomFieldType { }
```

- Endpoint: `/tg-api/custom-field-types`
- Resource: `custom-field-types`
- Files: `customFieldType.tg.controller.ts`

### Irregular Plurals

The pluralizer handles common irregular cases:

```prisma
model Person { }    // /tg-api/people
model Category { }  // /tg-api/categories
```

## Best Practices

### 1. Use PascalCase Models

Always use PascalCase for Prisma models:

```prisma
// Good
model BlogPost { }
model UserProfile { }

// Avoid
model blog_post { }
model userprofile { }
```

### 2. Avoid Abbreviations

```prisma
// Good
model BlogPost { }
model UserProfile { }

// Avoid
model BP { }
model UsrProf { }
```

### 3. Use Singular Model Names

Prisma models should be singular (Prisma convention):

```prisma
// Good
model User { }
model Post { }

// Avoid
model Users { }
model Posts { }
```

The generator handles pluralization automatically.

### 4. Consistent Word Boundaries

```prisma
// Good - clear boundaries
model BlogPost { }
model UserProfile { }
model CustomFieldType { }

// Avoid - unclear boundaries
model Blogpost { }
model Userprofile { }
```

## Troubleshooting

### Endpoint 404 Errors

**Problem:** API returns 404 for generated endpoints.

**Solution:** Verify the endpoint in the generated controller matches your request:

```typescript
// Generated controller
@Controller('tg-api/users')  // ✓ Correct

// Your request
fetch('/tg-api/users')  // ✓ Matches
```

### Resource Not Found

**Problem:** React Admin resource not found.

**Solution:** Ensure resource name matches data provider mapping:

```typescript
// Resource
<Resource name="blog-posts" ... />  // ✓

// Data Provider
endpointMap['blog-posts'] = 'tg-api/blog-posts';  // ✓ Matches
```

### Import Errors

**Problem:** Cannot import generated classes.

**Solution:** Use the exact generated class name:

```typescript
// Generated class
export class BlogPostTgService { }

// Import
import { BlogPostTgService } from './blogPost.tg.service';  // ✓ Correct
```

## Next Steps

- **[Prisma Setup](./prisma-setup.md)** – Configure your schema
- **[Customization](./customization.md)** – Extend generated code
- **[API Reference](../api/generators.md)** – Understand the generation pipeline

