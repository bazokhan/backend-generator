---
layout: default
title: Adapters API
parent: API Reference
nav_order: 4
---

# Adapters API Reference

Complete reference for the custom adapter system in `@tgraph/backend-generator`.

---

## Factory Functions

### adapter.json()

Create a JSON-based adapter endpoint.

```typescript
adapter.json(config: AdapterConfig, handler: AdapterHandler): AdapterFactoryResult
```

**Parameters:**

- `config` - Configuration object for the endpoint
- `handler` - Async function that processes the request

**Returns:** `AdapterFactoryResult` with type `'json'`

**Example:**

```typescript
export default adapter.json({
  method: 'POST',
  path: '/custom',
  target: 'UserService.create',
  auth: 'JwtAuthGuard',
}, async (ctx) => {
  return { args: ctx.body };
});
```

---

### adapter.multipart()

Create a multipart/form-data adapter endpoint for file uploads.

```typescript
adapter.multipart(config: AdapterConfig, handler: AdapterHandler): AdapterFactoryResult
```

**Parameters:**

- `config` - Configuration object for the endpoint
- `handler` - Async function that processes the request

**Returns:** `AdapterFactoryResult` with type `'multipart'`

**Example:**

```typescript
export default adapter.multipart({
  method: 'POST',
  path: '/upload',
  target: 'UserService.update',
}, async (ctx) => {
  const file = Array.isArray(ctx.files) ? ctx.files[0] : ctx.files;
  const url = await ctx.helpers.upload.minio(file);
  return { args: { avatarUrl: url } };
});
```

---

### adapter.response()

Create a direct HTTP response without calling a service method.

```typescript
adapter.response(
  status: number,
  body: any,
  headers?: Record<string, string>
): AdapterDirectResponse
```

**Parameters:**

- `status` - HTTP status code (e.g., 200, 201, 400)
- `body` - Response body (will be JSON-serialized)
- `headers` - Optional custom response headers

**Returns:** `AdapterDirectResponse` object

**Example:**

```typescript
return adapter.response(201, {
  success: true,
  message: 'Created successfully'
}, {
  'X-Request-Id': ctx.helpers.uuid(),
});
```

---

## Configuration Types

### AdapterConfig

Configuration object for adapter endpoints.

```typescript
interface AdapterConfig {
  method: HttpMethod;              // Required
  path: string;                    // Required
  target?: string | null;          // Optional
  auth?: string | string[];        // Optional
  select?: string[];               // Optional
  include?: string[];              // Optional
  description?: string;            // Optional
  summary?: string;                // Optional
  tags?: string[];                 // Optional
}
```

**Fields:**

- `method` *(required)* - HTTP method: `'GET'`, `'POST'`, `'PUT'`, `'DELETE'`, or `'PATCH'`
- `path` *(required)* - Route path relative to controller base (must start with `/`)
- `target` - Service method to call in format `ServiceName.methodName`, or `null` to bypass
- `auth` - Guard name(s) to apply for authentication/authorization
- `select` - Array of field names to include in response (Prisma select)
- `include` - Array of relation names to include in response (Prisma include)
- `description` - Description for OpenAPI documentation
- `summary` - Summary for OpenAPI documentation
- `tags` - Tags for OpenAPI documentation

**Example:**

```typescript
{
  method: 'POST',
  path: '/with-validation',
  target: 'UserService.createOne',
  auth: ['JwtAuthGuard', 'AdminGuard'],
  select: ['id', 'email', 'createdAt'],
  summary: 'Create user with validation',
  description: 'Creates a new user after custom validation',
  tags: ['users', 'admin'],
}
```

---

### HttpMethod

Allowed HTTP methods.

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
```

---

### AdapterType

Type of adapter.

```typescript
type AdapterType = 'json' | 'multipart'
```

---

## Context Types

### AdapterContext

Context object passed to adapter handlers.

```typescript
interface AdapterContext<TBody = any, TQuery = any, TParams = any> {
  url: string;
  params: TParams;
  query: TQuery;
  headers: Record<string, string | string[] | undefined>;
  body: TBody;
  files?: Express.Multer.File | Express.Multer.File[];
  user?: any;
  req: Request;
  res: Response;
  di: AdapterDI;
  helpers: AdapterHelpers;
}
```

**Fields:**

- `url` - Full request URL
- `params` - Route parameters (e.g., `{ id: '123' }`)
- `query` - Query string parameters (e.g., `{ page: '1', limit: '10' }`)
- `headers` - Request headers
- `body` - Parsed request body (JSON or form data)
- `files` - Uploaded files (multipart adapters only)
- `user` - Authenticated user object (from guard/strategy)
- `req` - Raw Express Request object
- `res` - Raw Express Response object
- `di` - Dependency injection container
- `helpers` - Utility functions

**Example:**

```typescript
async (ctx: AdapterContext) => {
  const userId = ctx.params.id;
  const page = parseInt(ctx.query.page || '1');
  const email = ctx.body.email;
  const token = ctx.headers.authorization;
  const currentUser = ctx.user;
  
  return { args: { userId, email } };
}
```

---

### AdapterDI

Dependency injection container.

```typescript
interface AdapterDI {
  prisma: PrismaService;
  [key: string]: any;
}
```

**Fields:**

- `prisma` - PrismaService instance for database access
- `[key]` - Additional injected services (user-configurable)

**Example:**

```typescript
async (ctx) => {
  // Access Prisma
  const user = await ctx.di.prisma.user.findUnique({
    where: { id: ctx.params.id },
  });
  
  // Access custom services (if configured)
  await ctx.di.emailService.send({ to: user.email });
  
  return { args: user };
}
```

---

### AdapterHelpers

Utility functions available in context.

```typescript
interface AdapterHelpers {
  uuid(): string;
  slugify(text: string): string;
  ext(filename: string): string;
  pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
  assert(condition: any, message?: string): asserts condition;
  upload: {
    minio?(file: Express.Multer.File, bucket?: string): Promise<string>;
    local?(file: Express.Multer.File, directory?: string): Promise<string>;
    [key: string]: any;
  };
}
```

**Methods:**

#### uuid()

Generate a UUID v4.

```typescript
uuid(): string
```

**Returns:** UUID string

**Example:**

```typescript
const id = ctx.helpers.uuid();
// "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

#### slugify()

Convert string to URL-friendly slug.

```typescript
slugify(text: string): string
```

**Parameters:**

- `text` - Text to slugify

**Returns:** Slugified string

**Example:**

```typescript
const slug = ctx.helpers.slugify('Hello World! 2024');
// "hello-world-2024"
```

#### ext()

Extract file extension from filename.

```typescript
ext(filename: string): string
```

**Parameters:**

- `filename` - Filename to extract extension from

**Returns:** Extension without dot

**Example:**

```typescript
const extension = ctx.helpers.ext('document.pdf');
// "pdf"
```

#### pick()

Select specific properties from an object.

```typescript
pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>
```

**Parameters:**

- `obj` - Source object
- `keys` - Array of keys to pick

**Returns:** New object with only specified keys

**Example:**

```typescript
const user = { id: '1', email: 'user@example.com', password: 'hash' };
const safe = ctx.helpers.pick(user, ['id', 'email']);
// { id: '1', email: 'user@example.com' }
```

#### assert()

Assert a condition, throw BadRequestException if false.

```typescript
assert(condition: any, message?: string): asserts condition
```

**Parameters:**

- `condition` - Condition to assert
- `message` - Error message if assertion fails

**Throws:** `BadRequestException` if condition is falsy

**Example:**

```typescript
ctx.helpers.assert(ctx.body.age >= 18, 'Must be 18 or older');
ctx.helpers.assert(ctx.body.email, 'Email is required');
```

#### upload

Upload utilities (user-implemented).

```typescript
upload: {
  minio?(file: Express.Multer.File, bucket?: string): Promise<string>;
  local?(file: Express.Multer.File, directory?: string): Promise<string>;
  [key: string]: any;
}
```

**Note:** These are placeholders. Implement in `src/adapters/helpers.ts`:

```typescript
// src/adapters/helpers.ts
import { Minio } from 'minio';

helpers.upload.minio = async (file, bucket = 'default') => {
  const client = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
  
  const filename = `${uuid()}-${file.originalname}`;
  await client.putObject(bucket, filename, file.buffer);
  
  return `https://cdn.example.com/${bucket}/${filename}`;
};
```

---

## Result Types

### AdapterServiceCallResult

Result when calling a service method.

```typescript
interface AdapterServiceCallResult {
  args: any;
}
```

**Fields:**

- `args` - Arguments to pass to the target service method

**Example:**

```typescript
return {
  args: {
    email: ctx.body.email,
    password: hashedPassword,
  }
};
```

---

### AdapterDirectResponse

Result when bypassing service and responding directly.

```typescript
interface AdapterDirectResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
  __isDirectResponse: true;
}
```

**Fields:**

- `status` - HTTP status code
- `body` - Response body
- `headers` - Optional custom headers
- `__isDirectResponse` - Internal marker (do not set manually)

**Note:** Use `adapter.response()` to create this type.

**Example:**

```typescript
return adapter.response(200, {
  success: true,
  processedAt: new Date(),
});
```

---

### AdapterResult

Union of possible return types.

```typescript
type AdapterResult = AdapterServiceCallResult | AdapterDirectResponse
```

---

### AdapterHandler

Handler function signature.

```typescript
type AdapterHandler<TBody = any, TQuery = any, TParams = any> = (
  context: AdapterContext<TBody, TQuery, TParams>
) => Promise<AdapterResult>
```

**Parameters:**

- `context` - Adapter context with request data and utilities

**Returns:** Promise resolving to either service call result or direct response

**Example:**

```typescript
const handler: AdapterHandler = async (ctx) => {
  if (ctx.body.skipService) {
    return adapter.response(200, { skipped: true });
  }
  
  return { args: ctx.body };
};
```

---

## Parser Types

### AdapterDefinition

Parsed adapter file structure (internal).

```typescript
interface AdapterDefinition {
  filePath: string;
  name: string;
  type: AdapterType;
  config: AdapterConfig;
  handlerCode: string;
  inputDtoName?: string;
  outputType?: string;
}
```

**Note:** This type is primarily used internally by the generator.

---

## Advanced Usage

### Type-Safe Handlers

Use TypeScript generics for type safety:

```typescript
interface CreateUserBody {
  email: string;
  password: string;
  age: number;
}

interface UserParams {
  id: string;
}

export default adapter.json({
  method: 'POST',
  path: '/typed',
  target: 'UserService.create',
}, async (ctx: AdapterContext<CreateUserBody, any, UserParams>) => {
  // ctx.body is typed as CreateUserBody
  // ctx.params is typed as UserParams
  
  const email: string = ctx.body.email; // Type-safe
  const userId: string = ctx.params.id;  // Type-safe
  
  return { args: ctx.body };
});
```

---

### Custom DI Services

Extend the DI container with custom services:

```typescript
// In adapter context builder (src/adapters/context.ts)
export class AdapterContextBuilder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly stripeService: StripeService,
  ) {}

  build(req: Request, res: Response, files?: any): AdapterContext {
    return {
      // ... other fields
      di: {
        prisma: this.prisma,
        emailService: this.emailService,
        stripeService: this.stripeService,
      },
      // ... other fields
    };
  }
}
```

Then use in adapters:

```typescript
async (ctx) => {
  await ctx.di.emailService.send({ to: ctx.body.email });
  await ctx.di.stripeService.charge({ amount: ctx.body.amount });
  
  return { args: ctx.body };
}
```

---

### Error Handling

Throw standard NestJS exceptions:

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

export default adapter.json({
  method: 'POST',
  path: '/with-errors',
}, async (ctx) => {
  if (!ctx.body.email) {
    throw new BadRequestException('Email is required');
  }
  
  if (!ctx.user) {
    throw new UnauthorizedException('Authentication required');
  }
  
  if (ctx.user.role !== 'admin') {
    throw new ForbiddenException('Admin access required');
  }
  
  const existing = await ctx.di.prisma.user.findUnique({
    where: { email: ctx.body.email },
  });
  
  if (existing) {
    throw new ConflictException('Email already exists');
  }
  
  return { args: ctx.body };
});
```

---

## Validation

The generator creates DTOs automatically, but you can also create custom DTOs:

### Custom DTO

Create alongside your adapter:

```typescript
// src/features/user/adapters/create-validated-input.dto.ts
import { IsEmail, IsString, MinLength, IsInt, Min } from 'class-validator';

export class CreateValidatedInputDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsInt()
  @Min(18)
  age: number;
}
```

Reference in generated controller (or regenerate after creating DTO).

---

## Generator Integration

### Discovery Process

1. Generator scans `{modulePath}/adapters/*.adapter.ts`
2. Parser extracts configuration and handler code
3. Validator checks configuration and field references
4. DTO generator creates input DTOs (if needed)
5. Controller generator injects endpoints
6. OpenAPI generator adds documentation

### File Structure

```
src/
└── features/
    └── user/
        ├── adapters/
        │   ├── create-with-password.adapter.ts
        │   ├── upload-avatar.adapter.ts
        │   └── custom-endpoint.adapter.ts
        ├── user.module.ts
        ├── user.tg.controller.ts  # Adapters injected here
        └── user.tg.service.ts
```

### Generated Code

The generator adds to your controller:

```typescript
@Controller('users')
export class UserTgController {
  constructor(
    private readonly userTgService: UserTgService,
    private readonly prisma: PrismaService,  // Added for adapters
  ) {}

  // ... standard CRUD endpoints ...

  // Adapter endpoint (generated)
  @Post('/with-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create user with hashed password' })
  @ApiResponse({ status: 201 })
  async createWithPassword(
    @Body() body: CreateWithPasswordInputDto,
    @Query() query: any,
    @Param() params: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const contextBuilder = new AdapterContextBuilder(this.prisma);
    const context = contextBuilder.build(req, res);
    
    const adapterModule = await import('./adapters/create-with-password.adapter');
    const result = await adapterModule.default.handler(context);
    
    if ('__isDirectResponse' in result && result.__isDirectResponse) {
      res.status(result.status);
      if (result.headers) {
        for (const [key, value] of Object.entries(result.headers)) {
          res.setHeader(key, value);
        }
      }
      return result.body;
    }
    
    const serviceResult = await this.userTgService.create(result.args);
    return { data: serviceResult };
  }
}
```

---

## See Also

- [Custom Adapters Guide](../guides/custom-adapters.md) - Comprehensive usage guide
- [Custom Endpoints Recipe](../recipes/custom-endpoints.md) - Practical examples
- [Authentication Guards](../guides/authentication-guards.md) - Securing adapters


