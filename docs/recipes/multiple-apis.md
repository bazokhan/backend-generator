---
title: Multiple APIs (Admin + Public)
---

# Multiple APIs Recipe

Generate separate Admin and Public APIs from the same Prisma schema with different authentication and suffixes.

## Use Case

You want to generate two APIs:

1. **Admin API** - Full CRUD access with admin-only authentication
2. **Public API** - Limited read access for authenticated users

## Prerequisites

- Prisma schema configured
- Authentication guards implemented (`JwtAuthGuard`, `AdminGuard`)
- TGraph installed

## Configuration Files

### 1. Admin API Configuration

Create `tgraph.admin.config.ts`:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  input: {
    schemaPath: 'prisma/schema.prisma',
    prismaService: 'src/infrastructure/database/prisma.service.ts',
  },

  output: {
    backend: {
      dtos: 'src/dtos/admin',
      modules: {
        searchPaths: ['src/features', 'src/modules', 'src'],
        defaultRoot: 'src/features',
      },
      staticFiles: {
        guards: 'src/guards',
        decorators: 'src/decorators',
        dtos: 'src/dtos',
        interceptors: 'src/interceptors',
        utils: 'src/utils',
      },
    },
    dashboard: {
      root: 'src/dashboard/src',
      resources: 'src/dashboard/src/resources',
    },
  },

  api: {
    suffix: 'Admin',
    prefix: 'admin-api',
    authentication: {
      enabled: true,
      requireAdmin: true,
      guards: [
        { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
        { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
      ],
    },
  },

  dashboard: {
    enabled: true,
    updateDataProvider: true,
    components: { form: {}, display: {} },
  },

  behavior: {
    nonInteractive: false,
  },
};
```

### 2. Public API Configuration

Create `tgraph.public.config.ts`:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  input: {
    schemaPath: 'prisma/schema.prisma',
    prismaService: 'src/infrastructure/database/prisma.service.ts',
  },

  output: {
    backend: {
      dtos: 'src/dtos/public',
      modules: {
        searchPaths: ['src/features', 'src/modules', 'src'],
        defaultRoot: 'src/features',
      },
      staticFiles: {
        guards: 'src/guards',
        decorators: 'src/decorators',
        dtos: 'src/dtos',
        interceptors: 'src/interceptors',
        utils: 'src/utils',
      },
    },
    dashboard: {
      root: 'src/dashboard/src',
      resources: 'src/dashboard/src/resources',
    },
  },

  api: {
    suffix: 'Public',
    prefix: 'api',
    authentication: {
      enabled: true,
      requireAdmin: false, // Any authenticated user
      guards: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }],
    },
  },

  dashboard: {
    enabled: false, // No dashboard for public API
    updateDataProvider: false,
    components: { form: {}, display: {} },
  },

  behavior: {
    nonInteractive: false,
  },
};
```

## Generation

Generate both APIs:

```bash
# Generate admin API
tgraph api --config tgraph.admin.config.ts

# Generate public API
tgraph api --config tgraph.public.config.ts

# Generate dashboard (using admin config)
tgraph dashboard --config tgraph.admin.config.ts
```

## Generated Structure

```
your-project/
├── src/
│   ├── features/
│   │   └── user/
│   │       ├── user.admin.controller.ts    # Admin API
│   │       ├── user.admin.service.ts
│   │       ├── user.public.controller.ts   # Public API
│   │       ├── user.public.service.ts
│   │       └── user.module.ts
│   ├── dtos/
│   │   ├── admin/                          # Admin DTOs
│   │   │   └── user-response.admin.dto.ts
│   │   └── public/                         # Public DTOs
│   │       └── user-response.public.dto.ts
│   └── app.module.ts
└── tgraph.admin.config.ts
└── tgraph.public.config.ts
```

## API Endpoints

### Admin API

```typescript
// user.admin.controller.ts
@Controller('admin-api/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserAdminController {
  // Full CRUD
  @Get() list() {}
  @Get(':id') getOne() {}
  @Post() create() {}
  @Put(':id') update() {}
  @Delete(':id') delete() {}
}
```

Routes:

- `GET /admin-api/users` - List all users
- `GET /admin-api/users/:id` - Get user by ID
- `POST /admin-api/users` - Create user
- `PUT /admin-api/users/:id` - Update user
- `DELETE /admin-api/users/:id` - Delete user

### Public API

```typescript
// user.public.controller.ts
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UserPublicController {
  // Read-only
  @Get() list() {}
  @Get(':id') getOne() {}
}
```

Routes:

- `GET /api/users` - List users (public info only)
- `GET /api/users/:id` - Get user by ID (public info only)

## Customization

### Limit Public API Endpoints

Modify the public service to return only public fields:

```typescript
// user.public.service.ts
export class UserPublicService {
  async findAll(): Promise<UserPublicDto[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        // Exclude sensitive fields like email, phone
      },
    });
    return users;
  }
}
```

### Add Rate Limiting to Public API

Add rate limiting guard to public config:

```typescript
// tgraph.public.config.ts
api: {
  authentication: {
    enabled: true,
    requireAdmin: false,
    guards: [
      { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
      { name: 'RateLimitGuard', importPath: '@/guards/rate-limit.guard' },
    ],
  },
}
```

### Separate Admin and Public DTOs

Ensure different DTOs for admin and public:

```typescript
// Admin DTO (includes sensitive fields)
export class UserAdminDto {
  id: string;
  name: string;
  email: string; // Sensitive
  phone: string; // Sensitive
  role: Role; // Sensitive
  createdAt: Date;
}

// Public DTO (only public fields)
export class UserPublicDto {
  id: string;
  name: string;
  avatar: string;
  // No sensitive fields
}
```

## NPM Scripts

Add scripts to `package.json` for easy generation:

```json
{
  "scripts": {
    "generate:admin": "tgraph api --config tgraph.admin.config.ts",
    "generate:public": "tgraph api --config tgraph.public.config.ts",
    "generate:dashboard": "tgraph dashboard --config tgraph.admin.config.ts",
    "generate:all": "npm run generate:admin && npm run generate:public && npm run generate:dashboard"
  }
}
```

Usage:

```bash
npm run generate:all
```

## Testing

### Admin API Test

```typescript
describe('UserAdminController (e2e)', () => {
  it('should create user (admin only)', async () => {
    const adminToken = getAdminToken();

    const response = await request(app.getHttpServer())
      .post('/admin-api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });

  it('should reject non-admin users', async () => {
    const userToken = getUserToken();

    await request(app.getHttpServer())
      .post('/admin-api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'John', email: 'john@example.com' })
      .expect(403);
  });
});
```

### Public API Test

```typescript
describe('UserPublicController (e2e)', () => {
  it('should list users (authenticated)', async () => {
    const userToken = getUserToken();

    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should not allow write operations', async () => {
    const userToken = getUserToken();

    await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'John' })
      .expect(404); // Route doesn't exist
  });
});
```

## Best Practices

### 1. Use Consistent Suffixes

Maintain consistent naming across your project:

- Admin: `Admin` suffix, `admin-api` prefix
- Public: `Public` suffix, `api` prefix

### 2. Separate DTO Directories

Keep DTOs separate to avoid conflicts:

```
src/dtos/
├── admin/        # Admin API DTOs
├── public/       # Public API DTOs
└── shared/       # Shared/common DTOs
```

### 3. Document API Differences

Add Swagger documentation:

```typescript
// user.admin.controller.ts
@ApiTags('Admin - Users')
@ApiBearerAuth()
@ApiSecurity('admin-role')
export class UserAdminController {}

// user.public.controller.ts
@ApiTags('Public - Users')
@ApiBearerAuth()
export class UserPublicController {}
```

### 4. Version Your APIs

Consider API versioning:

```typescript
// Admin API
api: {
  prefix: 'v1/admin-api',
}

// Public API
api: {
  prefix: 'v1/api',
}
```

## Advanced: Three-Tier API

Generate three APIs with different access levels:

### Admin API

- Full CRUD
- Admin role required
- All fields accessible

### Partner API

- Read + limited write
- Partner role required
- Most fields accessible

### Public API

- Read only
- Basic authentication
- Public fields only

Create three config files following the same pattern.

## Related

- [Configuration Reference](../api/configuration.md) - Full config options
- [Authentication Guards](../guides/authentication-guards.md) - Configure guards
- [Custom Components](./custom-components.md) - Customize dashboard
