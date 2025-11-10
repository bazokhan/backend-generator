---
layout: default
title: Custom Adapters
parent: Guides
nav_order: 7
---

# Custom Adapters Guide

Learn how to create custom endpoints using adapters - lightweight transformation layers that extend your generated API without modifying controller or service files.

## Overview

Adapters provide a clean way to add custom endpoints to your generated API. They act as transformation or proxy layers between HTTP requests and your service methods, allowing you to:

- Transform request data before calling services
- Upload and process files
- Integrate with external APIs
- Create webhook receivers
- Bypass services entirely for custom logic

**Key Benefits:**

- **No generated file edits** - Adapters live in separate files
- **Automatic discovery** - Found and integrated during `tgraph api`
- **Full type safety** - TypeScript support throughout
- **Auto validation** - Generated DTOs with class-validator
- **OpenAPI docs** - Swagger documentation generated automatically

---

## When to Use Adapters

Use adapters when you need:

1. **Request transformation** - Convert data before service calls
2. **File processing** - Handle uploads with custom logic
3. **External integrations** - Call third-party APIs
4. **Custom validation** - Complex business rules
5. **Webhooks** - Receive and process external events

**Don't use adapters for:**

- Simple CRUD operations (use generated endpoints)
- Core business logic (put in services)
- Shared functionality (create utility functions)

---

## Creating Your First Adapter

### Step 1: Create Adapter File

Adapters live in `{modulePath}/adapters/*.adapter.ts`:

```typescript
// src/features/post/adapters/create-with-slug.adapter.ts
import { adapter } from '@/adapters/runtime';

// Define the request body type for full type safety
interface CreatePostBody {
  title: string;
  content: string;
}

export default adapter.json<CreatePostBody>(
  {
    method: 'POST',
    path: '/with-slug',
    target: 'PostService.create',
    auth: 'JwtAuthGuard',
  },
  async (ctx) => {
    const { body, helpers } = ctx;

    // body is now typed as CreatePostBody - get full IntelliSense!
    const slug = helpers.slugify(body.title); // ✓ body.title is string

    // Return args for service method
    return {
      args: {
        ...body,
        slug,
      },
    };
  },
);
```

### Step 2: Run Generator

```bash
tgraph api
```

The generator will:

1. Discover your adapter
2. Validate configuration
3. Generate input DTO
4. Inject endpoint into controller
5. Generate OpenAPI docs

### Step 3: Test Your Endpoint

```bash
curl -X POST http://localhost:3000/tg-api/posts/with-slug \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "Hello World", "content": "..."}'
```

Response:

```json
{
  "data": {
    "id": "...",
    "title": "Hello World",
    "slug": "hello-world",
    "content": "..."
  }
}
```

---

## Adapter Types

### JSON Adapters

For standard JSON requests:

```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/custom-endpoint',
    target: 'ServiceName.methodName',
  },
  async (ctx) => {
    // ctx.body contains parsed JSON
    return { args: { ...ctx.body } };
  },
);
```

### Multipart Adapters

For file uploads:

```typescript
export default adapter.multipart(
  {
    method: 'POST',
    path: '/upload-image',
    target: 'PostService.update',
  },
  async (ctx) => {
    const { files, body, helpers } = ctx;

    // files is Express.Multer.File or Express.Multer.File[]
    const file = Array.isArray(files) ? files[0] : files;

    // Upload to storage
    const url = await helpers.upload.minio(file, 'images');

    return {
      args: {
        id: body.id,
        imageUrl: url,
      },
    };
  },
);
```

---

## Configuration Options

### Required Fields

```typescript
{
  method: 'POST',      // HTTP method: GET, POST, PUT, DELETE, PATCH
  path: '/endpoint',   // Route path (relative to controller)
}
```

### Optional Fields

```typescript
{
  target: 'PostService.createOne',  // Service method to call (or null)
  auth: 'JwtAuthGuard',              // Guard(s) to apply
  select: ['id', 'title'],           // Fields to return
  include: ['author'],               // Relations to include
  description: 'Upload image',       // OpenAPI description
  summary: 'Upload post image',      // OpenAPI summary
  tags: ['images'],                  // OpenAPI tags
}
```

### Auth Configuration

Single guard:

```typescript
{
  auth: 'JwtAuthGuard',
}
```

Multiple guards:

```typescript
{
  auth: ['JwtAuthGuard', 'AdminGuard'],
}
```

No auth:

```typescript
{
  // Omit auth field
}
```

---

## Context API

The adapter handler receives a context object with everything you need:

```typescript
async (ctx) => {
  // URL and parameters
  ctx.url; // Full request URL
  ctx.params; // Route parameters: { id: '123' }
  ctx.query; // Query string: { page: '1' }

  // Request data
  ctx.body; // Parsed JSON body
  ctx.headers; // Request headers
  ctx.files; // Uploaded file(s) (multipart only)

  // User and auth
  ctx.user; // Authenticated user from guard

  // Dependencies
  ctx.di; // Dependency injection container
  ctx.di.prisma; // PrismaService instance

  // Helpers
  ctx.helpers; // Utility functions

  // Raw objects (advanced)
  ctx.req; // Express Request
  ctx.res; // Express Response
};
```

---

## Helper Functions

### uuid()

Generate UUID v4:

```typescript
const id = helpers.uuid();
// "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### slugify()

Convert to URL-friendly slug:

```typescript
const slug = helpers.slugify('Hello World!');
// "hello-world"
```

### ext()

Extract file extension:

```typescript
const extension = helpers.ext('image.jpg');
// "jpg"
```

### pick()

Select specific object properties:

```typescript
const subset = helpers.pick(user, ['id', 'email']);
// { id: '123', email: 'user@example.com' }
```

### assert()

Validate conditions:

```typescript
helpers.assert(user.age >= 18, 'Must be 18 or older');
helpers.assert(price > 0, 'Price must be positive');
```

Throws `BadRequestException` if condition is false.

### upload (user-implemented)

Upload utilities are placeholders. Implement your own:

```typescript
// In your codebase, create upload utilities
// src/adapters/helpers.ts

helpers.upload.minio = async (file, bucket = 'default') => {
  const minioClient = new Minio.Client({
    /* config */
  });
  const filename = `${uuid()}-${file.originalname}`;
  await minioClient.putObject(bucket, filename, file.buffer);
  return `https://cdn.example.com/${bucket}/${filename}`;
};
```

---

## Return Types

### Service Call

Return `{ args }` to call the target service:

```typescript
return {
  args: {
    title: 'My Title',
    content: 'My Content',
  },
};
```

The generator will call `ServiceName.methodName(args)`.

### Direct Response

Use `adapter.response()` to bypass the service:

```typescript
return adapter.response(200, {
  success: true,
  message: 'Processed successfully',
});
```

With custom headers:

```typescript
return adapter.response(
  201,
  { id: '123' },
  {
    'X-Custom-Header': 'value',
  },
);
```

---

## Response Shaping

### Select Fields

Return specific fields only:

```typescript
adapter.json(
  {
    method: 'GET',
    path: '/summary',
    target: 'PostService.getOne',
    select: ['id', 'title', 'createdAt'],
  },
  async (ctx) => {
    return { args: ctx.params.id };
  },
);
```

Response:

```json
{
  "data": {
    "id": "123",
    "title": "Hello",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Include Relations

Load related data:

```typescript
adapter.json(
  {
    method: 'GET',
    path: '/with-author',
    target: 'PostService.getOne',
    include: ['author', 'comments'],
  },
  async (ctx) => {
    return { args: ctx.params.id };
  },
);
```

**Note:** You cannot use both `select` and `include`.

---

## Advanced Patterns

### External API Integration

```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/sync-stripe',
  },
  async (ctx) => {
    const { body, di } = ctx;

    // Call external API
    const stripeCustomer = await stripe.customers.create({
      email: body.email,
    });

    // Save to database
    await di.prisma.user.update({
      where: { id: body.userId },
      data: { stripeCustomerId: stripeCustomer.id },
    });

    return adapter.response(200, {
      success: true,
      customerId: stripeCustomer.id,
    });
  },
);
```

### Webhook Receiver

```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/webhook/stripe',
  },
  async (ctx) => {
    const { body, headers } = ctx;

    // Verify signature
    const signature = headers['stripe-signature'];
    stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Process event
    await processStripeEvent(body);

    return adapter.response(200, { received: true });
  },
);
```

### Bulk Operations

```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/bulk-create',
  },
  async (ctx) => {
    const { body, di } = ctx;

    const results = await di.prisma.post.createMany({
      data: body.posts,
    });

    return adapter.response(201, {
      created: results.count,
    });
  },
);
```

### Custom Validation

```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/validate-and-create',
    target: 'UserService.create',
  },
  async (ctx) => {
    const { body, helpers, di } = ctx;

    // Custom validation
    helpers.assert(body.age >= 18, 'Must be 18 or older');
    helpers.assert(body.password.length >= 8, 'Password too short');

    // Check uniqueness
    const existing = await di.prisma.user.findUnique({
      where: { email: body.email },
    });
    helpers.assert(!existing, 'Email already registered');

    return { args: body };
  },
);
```

---

## Error Handling

Adapters throw standard NestJS exceptions:

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';

export default adapter.json({
  method: 'POST',
  path: '/custom',
}, async (ctx) => {
  if (!ctx.body.required Field) {
    throw new BadRequestException('Required field is missing');
  }

  const item = await ctx.di.prisma.item.findUnique({
    where: { id: ctx.body.id },
  });

  if (!item) {
    throw new NotFoundException('Item not found');
  }

  return { args: item };
});
```

---

## Testing Adapters

### Unit Testing

```typescript
describe('CreateWithSlug Adapter', () => {
  it('should generate slug from title', async () => {
    const ctx = {
      body: { title: 'Hello World', content: 'Test' },
      helpers: { slugify: (s: string) => s.toLowerCase().replace(/\s+/g, '-') },
    };

    const result = await adapterHandler(ctx);

    expect(result.args.slug).toBe('hello-world');
  });
});
```

### Integration Testing

```typescript
describe('POST /posts/with-slug', () => {
  it('should create post with slug', async () => {
    const response = await request(app.getHttpServer())
      .post('/tg-api/posts/with-slug')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Post', content: 'Content' })
      .expect(201);

    expect(response.body.data.slug).toBe('test-post');
  });
});
```

---

## Best Practices

### 1. Keep Adapters Focused

Each adapter should have a single, clear purpose:

✅ Good:

```typescript
// upload-avatar.adapter.ts - Clear purpose
// validate-promo-code.adapter.ts - Clear purpose
```

❌ Bad:

```typescript
// misc-operations.adapter.ts - Too vague
```

### 2. Use Descriptive Names

Name adapters after their action:

```typescript
// Good names
create-with-slug.adapter.ts
upload-featured-image.adapter.ts
sync-to-external-api.adapter.ts

// Bad names
custom1.adapter.ts
temp.adapter.ts
```

### 3. Validate Inputs

Always validate and assert expectations:

```typescript
helpers.assert(body.email, 'Email required');
helpers.assert(body.age >= 18, 'Must be 18+');
```

### 4. Document Complex Logic

Add comments for non-obvious operations:

```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/process',
    description: 'Process payment and send confirmation email',
    summary: 'Process Payment',
  },
  async (ctx) => {
    // 1. Charge payment via Stripe
    const charge = await stripe.charges.create(/* ... */);

    // 2. Update order status
    await ctx.di.prisma.order.update(/* ... */);

    // 3. Send confirmation email
    await sendEmail(/* ... */);

    return adapter.response(200, { orderId: charge.metadata.orderId });
  },
);
```

### 5. Handle Errors Gracefully

Provide clear error messages:

```typescript
try {
  const result = await externalAPI.call();
  return { args: result };
} catch (error) {
  throw new BadRequestException(`External API failed: ${error.message}`);
}
```

### 6. Leverage Dependency Injection

Access Prisma and custom services:

```typescript
async (ctx) => {
  const { di } = ctx;

  // Use Prisma
  const user = await di.prisma.user.findUnique({});

  // Use custom services (if injected)
  const result = await di.emailService.send({});
};
```

---

## TypeScript Typing

Adapters support full TypeScript type safety including generics for strong typing of request/response data.

### Type-Safe Context with Generics

By default, `ctx.body`, `ctx.query`, and `ctx.params` are typed as `any`. You can provide explicit types using generic parameters:

```typescript
interface CreatePostBody {
  title: string;
  content: string;
  authorId: string;
}

interface PostQuery {
  published?: boolean;
  page?: string;
}

interface PostParams {
  categoryId: string;
}

// Pass generic types: <TBody, TQuery, TParams>
export default adapter.json<CreatePostBody, PostQuery, PostParams>(
  {
    method: 'POST',
    path: '/:categoryId/posts',
    target: 'PostService.create',
  },
  async (ctx) => {
    // Now fully typed - no more 'any'!
    const title: string = ctx.body.title; // ✓ Typed as string
    const content: string = ctx.body.content; // ✓ Typed as string
    const published = ctx.query.published; // ✓ Typed as boolean | undefined
    const categoryId: string = ctx.params.categoryId; // ✓ Typed as string

    return { args: ctx.body };
  },
);
```

**Generic Parameter Order:**

1. `TBody` - Request body type (accessed via `ctx.body`)
2. `TQuery` - Query parameters (accessed via `ctx.query`)
3. `TParams` - Route parameters (accessed via `ctx.params`)

**You can provide 1, 2, or all 3 types:**

```typescript
// Body only
export default adapter.json<CreatePostBody>(
  {
    method: 'POST',
    path: '/posts',
    target: 'PostService.create',
  },
  async (ctx) => {
    ctx.body; // ✓ Typed as CreatePostBody
    ctx.query; // any
    ctx.params; // any
  },
);

// Body and query
export default adapter.json<CreatePostBody, PostQuery>(
  {
    method: 'POST',
    path: '/posts',
    target: 'PostService.create',
  },
  async (ctx) => {
    ctx.body; // ✓ Typed as CreatePostBody
    ctx.query; // ✓ Typed as PostQuery
    ctx.params; // any
  },
);

// All three types
export default adapter.json<CreatePostBody, PostQuery, PostParams>(
  {
    method: 'POST',
    path: '/:categoryId/posts',
    target: 'PostService.create',
  },
  async (ctx) => {
    ctx.body; // ✓ Typed as CreatePostBody
    ctx.query; // ✓ Typed as PostQuery
    ctx.params; // ✓ Typed as PostParams
  },
);
```

**Benefits:**

- **Full IntelliSense** - Get autocomplete for all properties
- **Type checking** - Catch errors at compile time
- **Better DTOs** - Generator can infer types for adapter DTOs
- **Documentation** - Types serve as inline documentation

### Synchronous vs Asynchronous Handlers

Adapters support both `async` and synchronous handlers:

```typescript
// Async handler (most common)
export default adapter.json(
  {
    method: 'POST',
    path: '/create',
    target: 'PostService.create',
  },
  async (ctx) => {
    await someAsyncOperation();
    return { args: ctx.body };
  },
);

// Synchronous handler (no TypeScript errors)
export default adapter.json(
  {
    method: 'POST',
    path: '/create',
    target: 'PostService.create',
  },
  (ctx) => {
    // No await needed - TypeScript won't complain
    return { args: ctx.body };
  },
);
```

**Note:** TypeScript allows both return types so you won't get errors when declaring `async` functions without `await`.

### Typing Helper Functions

The `helpers.assert()` function preserves TypeScript type guards:

```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/create',
    target: 'PostService.create',
  },
  async (ctx) => {
    const { body, helpers } = ctx;

    // Before assertion: body.title might be undefined
    helpers.assert(body.title, 'Title is required');
    // After assertion: TypeScript knows body.title is truthy

    const upperTitle = body.title.toUpperCase(); // ✓ No error

    return { args: { ...body, title: upperTitle } };
  },
);
```

**Important:** Don't explicitly type `helpers` as `typeof helpers` - this loses the assertion signature. Use `helpers` directly from the context.

### Type Safety Requirements

Ensure you have these packages installed in your project:

```bash
npm install --save-dev @types/express @types/multer
```

These provide type definitions for `Express.Request`, `Express.Response`, and `Multer.File` used in adapter templates.

---

## Troubleshooting

### Adapter Not Discovered

**Problem:** Adapter not showing up in generated controller.

**Solutions:**

1. Check file location: `{modulePath}/adapters/*.adapter.ts`
2. Verify file naming: `*.adapter.ts` or `*.adapter.js`
3. Run `tgraph api` to regenerate
4. Check console for parsing errors

### Validation Errors

**Problem:** Adapter validation fails during generation.

**Solutions:**

1. Check required fields: `method` and `path`
2. Verify path starts with `/`
3. Validate target format: `ServiceName.methodName`
4. Check select/include fields exist on model

### Type Errors

**Problem:** TypeScript errors in adapter code.

**Solutions:**

1. Install required type packages: `npm install --save-dev @types/express @types/multer`
2. Import types if needed: `import type { AdapterContext } from '@/adapters/types';`
3. Don't type `helpers` as `typeof helpers` - it loses assertion signatures
4. Check helper function signatures
5. Ensure adapter files are properly exported with `export default`

### File Upload Issues

**Problem:** Files not available in multipart adapter.

**Solutions:**

1. Use `adapter.multipart()` not `adapter.json()`
2. Check `Content-Type: multipart/form-data` header
3. Access files via `ctx.files`
4. Verify file field name matches interceptor config

---

## Migration Guide

### From Custom Controllers

**Before (custom controller):**

```typescript
@Controller('posts')
export class CustomPostController {
  @Post('with-slug')
  async createWithSlug(@Body() body: any) {
    const slug = slugify(body.title);
    return this.postService.create({ ...body, slug });
  }
}
```

**After (adapter):**

```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/with-slug',
    target: 'PostService.create',
  },
  async (ctx) => {
    const slug = ctx.helpers.slugify(ctx.body.title);
    return { args: { ...ctx.body, slug } };
  },
);
```

**Benefits:**

- No manual controller management
- Auto-generated validation
- OpenAPI docs included
- Consistent with generator patterns

---

## Next Steps

- [API Reference](../api/adapters.md) - Detailed API documentation
- [Recipes](../recipes/custom-endpoints.md) - More practical examples
- [Authentication Guards](./authentication-guards.md) - Securing endpoints
