---
layout: default
title: Static Files Generation
parent: Guides
nav_order: 6
---

# Static Files Generation

The `tgraph static` command generates essential backend infrastructure files including guards, decorators, DTOs, interceptors, and utilities. These files provide foundational functionality for your NestJS API.

---

## Overview

Static files are reusable backend components that support your generated controllers and services. Unlike model-specific files (controllers, services, DTOs), static files are generated once and can be customized for your application's specific needs.

**When to generate static files:**

- During initial project setup
- When adding new features that require additional infrastructure
- When you need to regenerate specific components after manual modifications
- As part of the `tgraph api` workflow (you'll be prompted)

---

## Available Static Modules

### Guards

**`admin.guard`** - `src/guards/admin.guard.ts`

Implements role-based access control for admin-only endpoints. Checks if the authenticated user has admin privileges.

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user?.role === 'ADMIN';
  }
}
```

**`feature-flag.guard`** - `src/guards/feature-flag.guard.ts`

A stub guard for feature flag checks. Wire it to your feature flag service.

```typescript
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: wire to your feature-flag service
    return true;
  }
}
```

### Decorators

**`is-admin.decorator`** - `src/decorators/is-admin.decorator.ts`

Endpoint-level decorator that marks routes as admin-only. Works in conjunction with guards to enforce admin access.

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserController {
  @Post()
  @IsAdmin()  // Explicitly marks this endpoint as admin-only
  create(@Body() dto: CreateUserDto) {
    // ...
  }
}
```

**`paginated-search.decorator`** - `src/decorators/paginated-search.decorator.ts`

Combines multiple decorators for paginated search endpoints. Automatically applies pagination interceptor and API documentation.

### DTOs

**`paginated-search-query.dto`** - `src/dtos/paginated-search-query.dto.ts`

Standard query parameters for paginated and searchable endpoints.

```typescript
export class PaginatedSearchQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
```

**`paginated-search-result.dto`** - `src/dtos/paginated-search-result.dto.ts`

Standard response structure for paginated results.

```typescript
export class PaginatedSearchResultDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**`api-response.dto`** - `src/dtos/api-response.dto.ts`

Wrapper for standardized API responses with success/error status and optional metadata.

```typescript
export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
```

### Interceptors

**`pagination.interceptor`** - `src/interceptors/pagination.interceptor.ts`

Automatically transforms service responses into paginated result format. Apply to search/list endpoints.

```typescript
@Controller('users')
export class UserController {
  @Get()
  @UseInterceptors(PaginationInterceptor)
  async search(@Query() query: PaginatedSearchQueryDto) {
    return this.userService.search(query);
  }
}
```

**`audit.interceptor`** - `src/interceptors/audit.interceptor.ts`

Stub interceptor for audit logging. Wire it to your logging service to track API requests.

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    const started = Date.now();
    return next.handle().pipe(
      tap(() => {
        // TODO: replace with your audit log sink
        // console.log('Audit:', { duration: Date.now() - started });
      }),
    );
  }
}
```

### Utilities

**`paginated-search.util`** - `src/utils/paginated-search.ts`

Helper functions for building Prisma queries with pagination, sorting, and searching.

```typescript
export function buildPaginatedQuery(
  query: PaginatedSearchQueryDto,
  searchFields: string[],
) {
  const { page, limit, search, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;
  
  return {
    skip,
    take: limit,
    where: search ? buildSearchWhere(search, searchFields) : {},
    orderBy: sortBy ? { [sortBy]: sortOrder } : {},
  };
}
```

---

## Usage

### Interactive Mode (Default)

Prompts you for each module individually:

```bash
tgraph static
```

**Output:**

```
Generate admin.guard? (y/n): y
Generate feature-flag.guard? (y/n): n
Generate is-admin.decorator? (y/n): y
...
✅ Static files generation completed
```

### List Available Modules

View all available static modules without generating:

```bash
tgraph static --list
```

**Output:**

```
Available static modules:
 - admin.guard
 - is-admin.decorator
 - paginated-search-query.dto
 - paginated-search-result.dto
 - api-response.dto
 - pagination.interceptor
 - paginated-search.decorator
 - paginated-search.util
 - feature-flag.guard
 - audit.interceptor
```

### Selective Generation

Generate only specific modules:

```bash
# Generate guards only
tgraph static --include admin.guard,feature-flag.guard

# Generate pagination utilities
tgraph static --include paginated-search-query.dto,paginated-search-result.dto,pagination.interceptor
```

### Non-Interactive Mode

Generate all modules without prompts (useful for CI/CD):

```bash
tgraph static --yes
```

---

## Configuration

Static files are generated to directories specified in your `tgraph.config.ts`:

```typescript
export const config: Config = {
  output: {
    backend: {
      staticFiles: {
        guards: 'src/guards',
        decorators: 'src/decorators',
        dtos: 'src/dtos',
        interceptors: 'src/interceptors',
        utils: 'src/utils',
      },
    },
  },
};
```

Adjust these paths to match your project structure. The generator will create directories if they don't exist.

---

## Integration with `tgraph api`

When you run `tgraph api`, you'll be prompted to generate static files:

```bash
tgraph api
```

**Prompt:**

```
Generate required static files (guards, dtos, utils)? (y/n): y
Generate admin.guard? (y/n): y
Generate is-admin.decorator? (y/n): y
...
```

Use `--yes` to auto-confirm in CI environments:

```bash
tgraph api --yes
```

---

## Customization

Static files are generated once and are meant to be customized for your application:

### 1. **Modify Generated Files**

After generation, edit the files to fit your needs:

```typescript
// src/guards/admin.guard.ts
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Custom logic: check database, cache, etc.
    return user?.permissions?.includes('ADMIN_ACCESS');
  }
}
```

### 2. **Regenerate Selectively**

If you've customized some files but need to regenerate others:

```bash
# Only regenerate DTOs, preserve custom guards
tgraph static --include paginated-search-query.dto,api-response.dto
```

### 3. **Skip Auto-Generation**

If you don't need static files during `tgraph api`:

```bash
# Answer 'n' when prompted, or use custom guards in config
tgraph api
# When prompted: Generate required static files? (y/n): n
```

---

## Common Workflows

### Initial Setup

```bash
# Generate all static files
tgraph static --yes

# Or during API generation
tgraph api --yes
```

### Adding New Feature Flags

```bash
# Generate the feature flag guard stub
tgraph static --include feature-flag.guard

# Customize it for your feature flag service
vim src/guards/feature-flag.guard.ts
```

### Adding Audit Logging

```bash
# Generate the audit interceptor stub
tgraph static --include audit.interceptor

# Wire it to your logging service
vim src/interceptors/audit.interceptor.ts

# Apply globally in main.ts
app.useGlobalInterceptors(new AuditInterceptor());
```

### Pagination Setup

```bash
# Generate pagination utilities
tgraph static --include paginated-search-query.dto,paginated-search-result.dto,pagination.interceptor,paginated-search.util

# Use in your service
import { buildPaginatedQuery } from '@/utils/paginated-search';
```

---

## File Regeneration

**Important:** Running `tgraph static` will **overwrite** existing files for selected modules. 

**Best practices:**

1. **Version control:** Commit files before regenerating
2. **Selective generation:** Use `--include` to regenerate only what's needed
3. **Custom files:** Keep custom implementations in separate files with different names

**Example:**

```bash
# Original generated file
src/guards/admin.guard.ts

# Your custom extension (won't be overwritten)
src/guards/admin-enhanced.guard.ts
```

---

## Integration with Generated Code

### Using Guards in Generated Controllers

Configure guards in your `tgraph.config.ts`:

```typescript
api: {
  authentication: {
    enabled: true,
    requireAdmin: true,
    guards: [
      { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
    ],
    adminGuards: [
      { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
    ],
  },
}
```

Generated controllers will automatically import and apply these guards:

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserAdminController {
  // ...
}
```

### Using DTOs in Generated Services

Generated services can leverage pagination DTOs:

```typescript
async search(query: PaginatedSearchQueryDto) {
  const { skip, take, where, orderBy } = buildPaginatedQuery(
    query,
    this.searchFields,
  );
  
  const [data, total] = await Promise.all([
    this.prisma.user.findMany({ skip, take, where, orderBy }),
    this.prisma.user.count({ where }),
  ]);
  
  return { data, total, page: query.page, limit: query.limit };
}
```

---

## Troubleshooting

### Files Not Generated

**Problem:** `tgraph static` completes but files are missing.

**Solutions:**

1. Check config paths exist:
   ```bash
   ls -la src/guards src/decorators src/dtos
   ```

2. Verify permissions:
   ```bash
   chmod -R u+w src/
   ```

3. Use `--include` to target specific modules:
   ```bash
   tgraph static --include admin.guard
   ```

### Import Errors After Generation

**Problem:** TypeScript errors about missing imports.

**Solutions:**

1. Ensure path aliases are configured in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["src/*"]
       }
     }
   }
   ```

2. Run TypeScript compiler:
   ```bash
   npx tsc --noEmit
   ```

3. Install missing dependencies:
   ```bash
   npm install
   ```

### Customizations Overwritten

**Problem:** Regeneration overwrote custom changes.

**Solutions:**

1. Use version control to restore:
   ```bash
   git checkout -- src/guards/admin.guard.ts
   ```

2. Use selective generation:
   ```bash
   # Only regenerate what's needed
   tgraph static --include pagination.interceptor
   ```

3. Keep customizations in separate files:
   ```typescript
   // src/guards/admin-custom.guard.ts (won't be overwritten)
   ```

---

## Next Steps

- **[Authentication Guards Guide](./authentication-guards.md)** - Configure and customize authentication
- **[API Reference](../api/generators.md)** - Generator implementation details
- **[CLI Reference](../cli-reference.md)** - Full command documentation

