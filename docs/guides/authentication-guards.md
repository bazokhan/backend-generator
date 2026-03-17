---
title: Authentication Guards
---

# Authentication Guards Guide

Learn how to configure authentication guards for generated NestJS controllers.

## Overview

TGraph allows you to configure which authentication guards are applied to generated controllers. This enables you to:

- Control access to API endpoints
- Implement custom authentication strategies
- Support multiple guard combinations
- Separate admin and public APIs

## Configuration

Guards are configured directly in the flat `UserConfig`:

```typescript
import type { UserConfig } from '@tgraph/backend-generator';

export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'tg-api',
  apiSuffix: 'Admin',

  // Whether to add authentication guards to controllers
  authenticationEnabled: true,

  // Whether endpoints require admin role
  requireAdmin: true,

  // Base guards (always applied when authenticationEnabled is true)
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],

  // Admin guards (only applied when requireAdmin is also true)
  adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
};
```

The `adminGuards` array separates authentication from authorization guards. When `requireAdmin` is `true`, guards from both arrays are combined and applied to controllers.

## Guard Interface

Each guard is defined by:

```typescript
interface Guard {
  name: string; // Guard class name (e.g., 'JwtAuthGuard')
  importPath: string; // Import path (e.g., '@/guards/jwt-auth.guard')
}
```

## Authentication Modes

### Mode 1: Admin Only (Default)

Requires JWT authentication AND admin role. Both `guards` and `adminGuards` are applied:

```typescript
export const config: UserConfig = {
  authenticationEnabled: true,
  requireAdmin: true,
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' },
  ],
  adminGuards: [
    { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
  ],
};
```

Generated controller:

```typescript
@Controller('tg-api/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserAdminController {
  // Both base guards and admin guards are applied
}
```

### Mode 2: Authenticated Users

Requires JWT authentication only. Only `guards` are applied:

```typescript
export const config: UserConfig = {
  authenticationEnabled: true,
  requireAdmin: false,
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' },
  ],
};
```

Generated controller:

```typescript
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  // Only base guards are applied; adminGuards are ignored
}
```

### Mode 3: Public (No Authentication)

No authentication required:

```typescript
export const config: UserConfig = {
  authenticationEnabled: false,
  requireAdmin: false,
  guards: [],
};
```

Generated controller:

```typescript
@Controller('api/users')
export class UserController {
  // No guards
}
```

### Mode 4: Temporary Public Override

Use the `--public` flag to override authentication settings for a single generation run:

```bash
tgraph api --public
```

This temporarily sets:

- `authentication.enabled = false`
- `authentication.requireAdmin = false`

Useful for generating public endpoints without editing your config file.

## Common Guard Configurations

### JWT + Admin Role

Standard setup for admin APIs:

```typescript
export const config: UserConfig = {
  authenticationEnabled: true,
  requireAdmin: true,
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' },
  ],
  adminGuards: [
    { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
  ],
};
```

**Result:** Both JwtAuthGuard and AdminGuard are applied to generated controllers.

### JWT Only

For authenticated user APIs (no admin requirement):

```typescript
export const config: UserConfig = {
  authenticationEnabled: true,
  requireAdmin: false,
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' },
  ],
};
```

**Result:** Only JwtAuthGuard is applied; adminGuards are ignored.

### API Key Authentication

```typescript
export const config: UserConfig = {
  authenticationEnabled: true,
  requireAdmin: false,
  guards: [
    { name: 'ApiKeyGuard', importPath: '@/guards/api-key.guard' },
  ],
};
```

### Multiple Guards

```typescript
export const config: UserConfig = {
  authenticationEnabled: true,
  requireAdmin: true,
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' },
    { name: 'TenantGuard', importPath: '@/guards/tenant.guard' },
  ],
  adminGuards: [
    { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
    { name: 'RoleGuard', importPath: '@/guards/role.guard' },
  ],
};
```

When `requireAdmin` is true, all four guards are applied. When false, only the two base guards are applied.

## Implementing Guards

### JWT Auth Guard

Basic JWT authentication guard:

```typescript
// src/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }
    return user;
  }
}
```

### Admin Guard

Role-based authorization guard:

```typescript
// src/guards/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@/generated/prisma';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user found in request');
    }

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
```

### API Key Guard

Custom API key authentication:

```typescript
// src/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const validKey = this.configService.get<string>('API_KEY');
    if (apiKey !== validKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
```

### Tenant Guard

Multi-tenancy guard:

```typescript
// src/guards/tenant.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.params.tenantId || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // Check if user belongs to the tenant
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant');
    }

    return true;
  }
}
```

## Multiple API Configurations

### Separate Admin and Public APIs

Create two config files:

**Admin API** (`tgraph.admin.config.ts`):

```typescript
export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiSuffix: 'Admin',
  apiPrefix: 'admin-api',
  authenticationEnabled: true,
  requireAdmin: true,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
  dashboard: { root: 'src/dashboard/src' },
};
```

**Public API** (`tgraph.public.config.ts`):

```typescript
export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiSuffix: 'Public',
  apiPrefix: 'api',
  authenticationEnabled: true,
  requireAdmin: false,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  dashboard: false,
};
```

**Alternative: Use --public flag**

Instead of creating a separate config file, you can use the `--public` flag:

```bash
# Generate admin API with authentication
tgraph api --config tgraph.config.ts --suffix Admin

# Generate public API without authentication
tgraph api --config tgraph.config.ts --suffix Public --public
```

Generate both APIs:

```bash
# Method 1: Using separate config files
tgraph api --config tgraph.admin.config.ts
tgraph api --config tgraph.public.config.ts

# Method 2: Using --public flag with single config
tgraph api --suffix Admin  # Uses config authentication settings
tgraph api --suffix Public --public  # Overrides to disable authentication
```

**Benefits of adminGuards separation:**

1. **Reusability:** Same config file can generate both admin and public APIs by changing `requireAdmin`
2. **Clarity:** Explicitly shows which guards are for authentication vs authorization
3. **Flexibility:** Easy to toggle admin mode without redefining the entire guard list

## Advanced Patterns

### Conditional Guards

Use different guards based on environment:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

export const config: Config = {
  api: {
    authentication: {
      enabled: !isDevelopment, // Disable in development
      requireAdmin: true,
      guards: isDevelopment
        ? [] // No guards in development
        : [
            { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
            { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
          ],
    },
  },
};
```

### Guard Composition

Combine multiple guard strategies:

```typescript
// src/guards/composite.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class CompositeGuard implements CanActivate {
  constructor(
    private jwtGuard: JwtAuthGuard,
    private apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try JWT first
    try {
      return await this.jwtGuard.canActivate(context);
    } catch {
      // Fall back to API key
      return await this.apiKeyGuard.canActivate(context);
    }
  }
}
```

Configure:

```typescript
authentication: {
  enabled: true,
  requireAdmin: false,
  guards: [
    { name: 'CompositeGuard', importPath: '@/guards/composite.guard' },
  ],
}
```

## Testing Guards

### Unit Testing

```typescript
// jwt-auth.guard.spec.ts
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should throw UnauthorizedException when user is not found', () => {
    expect(() => {
      guard.handleRequest(null, null);
    }).toThrow(UnauthorizedException);
  });

  it('should return user when authenticated', () => {
    const user = { id: '1', role: 'ADMIN' };
    expect(guard.handleRequest(null, user)).toBe(user);
  });
});
```

### Integration Testing

```typescript
// user.admin.controller.spec.ts
import { Test } from '@nestjs/testing';
import { UserAdminController } from './user.admin.controller';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { AdminGuard } from '@/guards/admin.guard';

describe('UserAdminController', () => {
  let controller: UserAdminController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserAdminController],
      providers: [
        // Mock services
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UserAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

## Best Practices

### 1. Use Environment-Specific Guards

```typescript
const guards =
  process.env.NODE_ENV === 'production'
    ? [
        { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
        { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
        { name: 'RateLimitGuard', importPath: '@/guards/rate-limit.guard' },
      ]
    : [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }];
```

### 2. Provide Clear Error Messages

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;

    if (!user) {
      throw new ForbiddenException('Authentication required. Please provide a valid token.');
    }

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required. Your current role does not have permission.');
    }

    return true;
  }
}
```

### 3. Log Guard Failures

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private logger: Logger) {
    super();
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${info?.message || 'Unknown error'}`);
      throw new UnauthorizedException('Invalid or missing authentication token');
    }
    return user;
  }
}
```

### 4. Separate Concerns

Keep authentication (who you are) separate from authorization (what you can do):

```typescript
// Authentication: JwtAuthGuard
// Authorization: AdminGuard, RoleGuard, etc.

authentication: {
  enabled: true,
  requireAdmin: true,
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },  // Auth
    { name: 'AdminGuard', importPath: '@/guards/admin.guard' },        // Authz
  ],
}
```

## Troubleshooting

### Guards Not Applied

If guards aren't being applied to controllers:

1. Check guard imports are correct
2. Verify guards are properly exported
3. Ensure guards are registered in your module
4. Regenerate with `tgraph api`

### Authentication Always Fails

If authentication always fails:

1. Check JWT strategy is configured
2. Verify token format is correct
3. Check guard order (authentication before authorization)
4. Review guard implementation logic

### Missing User in Request

If `request.user` is undefined:

1. Ensure JWT strategy attaches user to request
2. Check Passport configuration
3. Verify guards run in correct order

## Related

- [Configuration Reference](../api/configuration.md) - Full config options
- [Component Customization](./component-customization.md) - Customize components
- [Multiple APIs Recipe](../recipes/multiple-apis.md) - Admin + Public setup
