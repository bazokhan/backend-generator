---
layout: default
title: Dashboard Types Generation
parent: Guides
nav_order: 7
---

# Dashboard Types Generation

Generate type-safe TypeScript API clients for your React Admin dashboard from Swagger/OpenAPI specifications. The `tgraph types` command automates the workflow of generating `swagger.json` and converting it to TypeScript types.

---

## Overview

Your React Admin dashboard needs type-safe API clients to communicate with your NestJS backend. The types generation workflow:

1. **Generate Swagger JSON** - Run your configured swagger command (e.g., `npm run generate:swagger`)
2. **Generate TypeScript Types** - Convert `swagger.json` to `api.ts` using `swagger-typescript-api`
3. **Use in Dashboard** - Import typed API clients in your React components

**Benefits:**

- Type safety for API requests and responses
- Autocomplete for API endpoints and parameters
- Compile-time error detection
- Self-documenting API client
- Automatic synchronization with backend changes

---

## Quick Start

### 1. Configure Swagger Generation

Add a swagger generation script to your backend `package.json`:

```json
{
  "scripts": {
    "generate:swagger": "nest start --entryFile swagger-generator"
  }
}
```

Or configure a custom command in `tgraph.config.ts`:

```typescript
export const config: Config = {
  output: {
    dashboard: {
      root: 'src/dashboard/src',
      resources: 'src/dashboard/src/resources',
      swagger: {
        command: 'npm run docs:swagger',
        jsonPath: 'src/dashboard/src/types/swagger.json',
      },
    },
  },
};
```

### 2. Generate Types

```bash
# Generate swagger.json and api.ts
tgraph types

# Or skip swagger regeneration if it's already up to date
tgraph types --skip-swagger
```

### 3. Use in Dashboard

```typescript
// src/dashboard/src/components/UserList.tsx
import { Api } from '../types/api';

const api = new Api({ baseUrl: 'http://localhost:3000' });

export const UserList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.users.usersControllerFindAll().then(data => {
      setUsers(data.data);  // Fully typed!
    });
  }, []);

  return <div>{/* ... */}</div>;
};
```

---

## Commands

### `tgraph types`

Generate dashboard API types from swagger.json.

```bash
tgraph types [options]
```

**Options:**

- `-c, --config <path>` - Path to configuration file
- `--skip-swagger` - Skip running the swagger generation command

**What it does:**

1. Runs the configured swagger command (unless `--skip-swagger`)
2. Reads `swagger.json` from the configured path
3. Generates `api.ts` in `<dashboardRoot>/types/`
4. Exits with error if swagger.json is missing

**Examples:**

```bash
# Full workflow: swagger generation → types
tgraph types

# Only generate types (swagger.json already exists)
tgraph types --skip-swagger

# Use custom config
tgraph types --config tgraph.public.config.ts
```

### `tgraph swagger`

Run only the swagger generation command without generating types.

```bash
tgraph swagger [options]
```

**Options:**

- `-c, --config <path>` - Path to configuration file

**Example:**

```bash
# Only regenerate swagger.json
tgraph swagger
```

**Use case:** When you want to update swagger.json for inspection but don't need to regenerate TypeScript types yet.

---

## Configuration

### Dashboard Swagger Settings

Configure swagger generation in `tgraph.config.ts`:

```typescript
export const config: Config = {
  output: {
    dashboard: {
      root: 'src/dashboard/src',
      resources: 'src/dashboard/src/resources',
      swagger: {
        // Command to run for generating swagger.json
        command: 'npm run generate:swagger',

        // Path to swagger.json (relative to workspace root)
        jsonPath: 'src/dashboard/src/types/swagger.json',
      },
    },
  },
};
```

**Defaults:**

- `command`: `'npm run generate:swagger'`
- `jsonPath`: `'<dashboardRoot>/types/swagger.json'`

### Multiple Configurations

For different environments or APIs:

```typescript
// tgraph.admin.config.ts
export const config: Config = {
  output: {
    dashboard: {
      root: 'src/admin-dashboard/src',
      swagger: {
        command: 'npm run swagger:admin',
        jsonPath: 'src/admin-dashboard/src/types/swagger.json',
      },
    },
  },
};

// tgraph.public.config.ts
export const config: Config = {
  output: {
    dashboard: {
      root: 'src/public-dashboard/src',
      swagger: {
        command: 'npm run swagger:public',
        jsonPath: 'src/public-dashboard/src/types/swagger.json',
      },
    },
  },
};
```

Run them explicitly:

```bash
tgraph types --config tgraph.admin.config.ts
tgraph types --config tgraph.public.config.ts
```

---

## Swagger Setup

### NestJS Swagger Configuration

Create a swagger generator script in your backend:

```typescript
// src/swagger-generator.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateSwagger() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Backend API for dashboard')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.join(__dirname, '../src/dashboard/src/types/swagger.json');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ Swagger JSON generated: ${outputPath}`);
  process.exit(0);
}

generateSwagger();
```

### Package.json Script

```json
{
  "scripts": {
    "generate:swagger": "ts-node src/swagger-generator.ts"
  }
}
```

### Annotate Your Controllers

Use Swagger decorators for better type generation:

```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users list', type: [UserDto] })
  @Get()
  async findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }
}
```

---

## Generated API Client

### Structure

The generated `api.ts` file contains:

```typescript
// src/dashboard/src/types/api.ts
export class Api<SecurityDataType = unknown> {
  public users: UsersApi<SecurityDataType>;
  public posts: PostsApi<SecurityDataType>;
  // ... other resources

  constructor(config: ApiConfig<SecurityDataType>) {
    this.users = new UsersApi(config);
    this.posts = new PostsApi(config);
  }
}

export class UsersApi<SecurityDataType = unknown> {
  usersControllerFindAll(params?: RequestParams): Promise<UserDto[]> {
    /* ... */
  }
  usersControllerFindOne(id: string, params?: RequestParams): Promise<UserDto> {
    /* ... */
  }
  usersControllerCreate(data: CreateUserDto, params?: RequestParams): Promise<UserDto> {
    /* ... */
  }
  // ... other methods
}

// Type definitions
export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
}
```

### Usage in Dashboard

#### Basic Usage

```typescript
import { Api } from '../types/api';

const api = new Api({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

// GET /users
const users = await api.users.usersControllerFindAll();

// GET /users/:id
const user = await api.users.usersControllerFindOne('123');

// POST /users
const newUser = await api.users.usersControllerCreate({
  email: 'john@example.com',
  name: 'John Doe',
  password: 'secret',
});
```

#### With Authentication

```typescript
const api = new Api({
  baseUrl: 'http://localhost:3000',
  securityWorker: async (securityData) => {
    const token = localStorage.getItem('token');
    return token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
  },
});
```

#### React Hook

```typescript
import { useEffect, useState } from 'react';
import { Api, UserDto } from '../types/api';

const api = new Api({ baseUrl: 'http://localhost:3000' });

export const useUsers = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api.users
      .usersControllerFindAll()
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { users, loading, error };
};
```

#### React Admin Data Provider

```typescript
import { DataProvider } from 'react-admin';
import { Api } from '../types/api';

const api = new Api({
  baseUrl: process.env.REACT_APP_API_URL,
});

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const response = await api[resource].findAll({
      page,
      limit: perPage,
      sortBy: field,
      sortOrder: order.toLowerCase(),
    });

    return {
      data: response.data,
      total: response.total,
    };
  },

  getOne: async (resource, params) => {
    const data = await api[resource].findOne(params.id);
    return { data };
  },

  create: async (resource, params) => {
    const data = await api[resource].create(params.data);
    return { data };
  },

  // ... other methods
};
```

---

## Workflow Integration

### Development Workflow

```bash
# 1. Update backend models/controllers
vim prisma/schema.prisma
vim src/users/users.controller.ts

# 2. Generate backend code
tgraph api

# 3. Run swagger generation
npm run generate:swagger

# 4. Generate dashboard types
tgraph types --skip-swagger

# 5. Update dashboard components
vim src/dashboard/src/resources/users/UserList.tsx
```

### Automated Workflow

Add to `package.json`:

```json
{
  "scripts": {
    "generate": "npm run generate:api && npm run generate:types",
    "generate:api": "tgraph api",
    "generate:swagger": "ts-node src/swagger-generator.ts",
    "generate:types": "tgraph types",
    "dev": "npm run generate && concurrently \"npm run start:dev\" \"npm run dashboard:dev\""
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/generate.yml
name: Generate Code
on: [push]

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - run: npm ci

      - name: Generate Backend
        run: tgraph api --yes

      - name: Generate Swagger
        run: npm run generate:swagger

      - name: Generate Types
        run: tgraph types --skip-swagger

      - name: Check for changes
        run: git diff --exit-code || echo "Generated files changed"
```

---

## Troubleshooting

### Missing swagger.json

**Problem:**

```
❌ Missing swagger.json. Please generate swagger before running tgraph types.
Expected at: src/dashboard/src/types/swagger.json
```

**Solutions:**

1. Run swagger generation first:

   ```bash
   npm run generate:swagger
   tgraph types --skip-swagger
   ```

2. Check swagger command is configured correctly:

   ```typescript
   swagger: {
     command: 'npm run generate:swagger',  // Must match package.json
   }
   ```

3. Verify swagger generator creates file in correct location:
   ```typescript
   // src/swagger-generator.ts
   const outputPath = path.join(__dirname, '../src/dashboard/src/types/swagger.json');
   ```

### Swagger Command Fails

**Problem:**

```
❌ Failed to run swagger command: npm run generate:swagger
```

**Solutions:**

1. Verify the command works standalone:

   ```bash
   npm run generate:swagger
   ```

2. Check script exists in `package.json`:

   ```json
   {
     "scripts": {
       "generate:swagger": "ts-node src/swagger-generator.ts"
     }
   }
   ```

3. Ensure dependencies are installed:
   ```bash
   npm install @nestjs/swagger swagger-ui-express
   ```

### Type Generation Errors

**Problem:** `swagger-typescript-api` fails to generate types.

**Solutions:**

1. Install `swagger-typescript-api`:

   ```bash
   npm install -D swagger-typescript-api
   ```

2. Validate swagger.json:

   ```bash
   npx swagger-cli validate src/dashboard/src/types/swagger.json
   ```

3. Check for malformed swagger spec - ensure all DTOs are properly decorated:

   ```typescript
   import { ApiProperty } from '@nestjs/swagger';

   export class UserDto {
     @ApiProperty()
     id: string;

     @ApiProperty()
     email: string;
   }
   ```

### Import Errors in Dashboard

**Problem:** Can't import from `../types/api`.

**Solutions:**

1. Ensure types were generated:

   ```bash
   ls -la src/dashboard/src/types/api.ts
   ```

2. Run type generation:

   ```bash
   tgraph types
   ```

3. Check TypeScript compiler:
   ```bash
   cd src/dashboard
   npm run build
   ```

### Outdated Types

**Problem:** Types don't match current API.

**Solutions:**

1. Regenerate everything:

   ```bash
   tgraph api
   npm run generate:swagger
   tgraph types --skip-swagger
   ```

2. Add to git hooks:
   ```bash
   # .husky/pre-commit
   #!/bin/sh
   npm run generate:swagger
   tgraph types --skip-swagger
   git add src/dashboard/src/types/api.ts
   ```

---

## Best Practices

### 1. Version Control

Commit generated `api.ts`:

```bash
git add src/dashboard/src/types/api.ts
git commit -m "Update API types"
```

**Why:** Ensures type consistency across the team and in CI/CD.

### 2. Swagger Annotations

Use comprehensive Swagger decorators:

```typescript
@ApiTags('users')
@Controller('users')
export class UsersController {
  @ApiOperation({ summary: 'Search users with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated users',
    type: PaginatedSearchResultDto<UserDto>,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get('search')
  async search(@Query() query: PaginatedSearchQueryDto) {
    return this.usersService.search(query);
  }
}
```

### 3. Automation

Add to npm scripts for convenience:

```json
{
  "scripts": {
    "sync": "tgraph api && tgraph types",
    "dev": "npm run sync && npm start"
  }
}
```

### 4. Type Safety

Leverage generated types in your dashboard:

```typescript
import { UserDto, CreateUserDto, UpdateUserDto } from '../types/api';

// Forms are type-safe
const handleSubmit = (data: CreateUserDto) => {
  api.users.create(data);
};

// State is type-safe
const [users, setUsers] = useState<UserDto[]>([]);
```

### 5. Separate Public/Admin APIs

Generate separate type clients:

```bash
# Admin API types
tgraph types --config tgraph.admin.config.ts

# Public API types
tgraph types --config tgraph.public.config.ts
```

---

## Next Steps

- **[CLI Reference](../cli-reference.md)** - Full `tgraph types` documentation
- **[Configuration](../api/configuration.md)** - Swagger configuration options
- **[Static Files Guide](./static-files.md)** - Generate supporting infrastructure
