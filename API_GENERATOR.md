# Auto-Generated TG API System

This system automatically generates complete NestJS TG (Business) APIs and React Admin dashboard pages from Prisma schema models marked with `@tg_form()`.

## Overview

The auto-generation pipeline consists of three main scripts:

1. **Swagger JSON Generator** - Fetches API documentation from running server
2. **TG API Generator** - Creates NestJS controllers, services, and DTOs
3. **Dashboard Generator** - Creates React Admin pages

## Usage

### Quick Start

```bash
# Generate everything in one command
npm run dashboard:full-generate
```

### Step by Step

```bash
# 1. Start your NestJS server
npm run start:dev

# 2. Generate Swagger JSON (in another terminal)
npm run swagger:generate

# 3. Generate TG API files
npm run tg:generate

# 4. Generate dashboard pages
npm run dashboard:generate
```

## Prisma Schema Setup

Add the `@tg_form()` decorator to models you want to auto-generate:

```prisma
// @tg_form()
model User {
  id        String    @id @default(uuid())
  firstName String    // @max(50)
  lastName  String    // @max(50)
  email     String    @unique
  password  String    // Will be excluded from TG API
  role      Role      @default(USER)
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt

  @@index([email])
}

enum Role {
  USER
  ADMIN
}
```

## Custom Validation Decorators

You can add custom validation decorators in Prisma schema comments:

```prisma
model User {
  firstName String    // @max(50) - Maximum 50 characters
  lastName  String    // @min(2) - Minimum 2 characters
  email     String    // @pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) - Email pattern
  age       Int       // @min(18) - Minimum age 18
  bio       String?   // @max(500, [create, update]) - Max 500 chars only for create/update
}
```

### Supported Decorators

- `@max(N)` - Maximum length/value
- `@min(N)` - Minimum length/value  
- `@length(N)` - Exact length
- `@pattern(/regex/)` - Regex pattern
- `@max(N, [create, update])` - Operation-specific validation

## Generated Files

For each model with `@tg_form()`, the system generates:

### NestJS Files (in module directory)
- `create-{model}.tg.dto.ts` - Create DTO with validation
- `update-{model}.tg.dto.ts` - Update DTO with validation
- `{model}.tg.service.ts` - Service with all CRUD operations
- `{model}.tg.controller.ts` - Controller with REST endpoints

### React Admin Files (in dashboard)
- `{Model}List.tsx` - List view
- `{Model}Edit.tsx` - Edit form
- `{Model}Create.tsx` - Create form
- `{Model}Show.tsx` - Show view

## TG API Endpoints

Generated controllers provide these endpoints:

```
GET    /tg-api/{model}              - List with pagination/search
GET    /tg-api/{model}/:id          - Get by ID
GET    /tg-api/{model}/many         - Get multiple by IDs
GET    /tg-api/{model}/reference/:target/:id - Get by reference
POST   /tg-api/{model}              - Create
PUT    /tg-api/{model}/:id          - Update
PUT    /tg-api/{model}/many         - Update multiple
DELETE /tg-api/{model}/:id          - Delete
DELETE /tg-api/{model}/many         - Delete multiple
```

## Module Requirements

The system looks for existing modules in:
- `src/features/{modelName}/`
- `src/infrastructure/{modelName}/`

If no module exists, you'll be prompted to create one.

## DataProvider Integration

The system automatically updates `src/dashboard/src/providers/dataProvider.ts` to map resources to TG API endpoints:

```typescript
const endpointMap: Record<string, string> = {
  'users': 'tg-api/users',
  'featureflags': 'tg-api/featureflags',
  // Custom endpoints
  'feature-flags': 'admin/feature-flags',
};
```

## Features

- **Admin-only access** - All TG endpoints require admin authentication
- **Comprehensive validation** - From Prisma schema + custom decorators
- **Unique constraint handling** - Automatic conflict detection
- **Password exclusion** - Sensitive fields excluded from TG API
- **Enum support** - Full enum validation and type safety
- **Relation support** - Basic relation handling
- **Search functionality** - Paginated search on string fields
- **Error handling** - Proper HTTP status codes and messages

## Customization

### Extending TG Services

You can extend the generated TG services with custom business logic:

```typescript
// In your custom service
@Injectable()
export class UsersService extends UsersBzService {
  async createWithCustomLogic(dto: CreateUserDto) {
    // Custom logic before creation
    const result = await super.create(dto);
    // Custom logic after creation
    return result;
  }
}
```

### Custom DTOs

Create your own DTOs alongside the TG ones:

```typescript
// create-user.dto.ts (your custom DTO)
export class CreateUserDto {
  // Your custom fields and validation
}

// create-user.tg.dto.ts (auto-generated TG DTO)
export class CreateUserBzDto {
  // Auto-generated fields and validation
}
```

## Troubleshooting

### Server Not Running
```
❌ Failed to fetch Swagger JSON: fetch failed
💡 Make sure your NestJS server is running on http://localhost:3000
   Run: npm run start:dev
```

### Module Not Found
```
⚠️ No module found for UserModel
Do you want to create the module directory for UserModel? (y/n):
```

### Swagger JSON Missing
```
⚠️ Swagger JSON file not found. Please run "npm run swagger:generate" first.
```

## File Naming Convention

All auto-generated files use the `.tg.` naming convention to distinguish them from manually created files:

- `*.tg.dto.ts` - Auto-generated DTOs
- `*.tg.service.ts` - Auto-generated services  
- `*.tg.controller.ts` - Auto-generated controllers

This ensures they can be safely regenerated without affecting your custom code.
