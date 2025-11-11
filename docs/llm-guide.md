---
layout: default
title: LLM Integration Guide
nav_order: 20
---

# TGraph Backend Generator - LLM Integration Guide

**Version:** 0.0.3  
**Purpose:** This documentation is specifically designed for Large Language Models (LLMs) to understand and correctly use the @tgraph/backend-generator library.  
**Target:** AI assistants helping developers implement full-stack applications with NestJS and React Admin.

---

## LIBRARY OVERVIEW

**What this library does:**
- Generates complete NestJS backend APIs (controllers, services, DTOs) from Prisma schema files
- Generates complete React Admin dashboard pages (List, Edit, Create, Show, Studio)
- Provides static infrastructure files (guards, interceptors, decorators, utilities)
- Supports custom endpoints through adapters
- Maintains type safety from database to frontend

**Core principle:** 
- Generated files use `.tg.` naming convention (e.g., `user.tg.controller.ts`, `user.tg.service.ts`)
- Custom user code lives in separate files without `.tg.` (e.g., `user.service.ts`, `user.controller.ts`)
- Generated files can be safely regenerated; custom files are never touched

---

## INSTALLATION

### Step 1: Install Package

```bash
npm install --save-dev @tgraph/backend-generator
```

**Required peer dependencies:**
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/platform-express": "^10.0.0",
  "@nestjs/swagger": "^7.0.0",
  "@types/express": "^4.17.0",
  "@types/multer": "^1.4.0",
  "express": "^4.18.0",
  "multer": "^1.4.5-lts.1"
}
```

### Step 2: Initialize Configuration

```bash
npx tgraph init
```

This creates `tgraph.config.ts` in the project root.

**CRITICAL:** All commands require this configuration file to exist.

---

## CONFIGURATION FILE STRUCTURE

The configuration file (`tgraph.config.ts`) has the following structure:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  input: {
    prisma: {
      schemaPath: 'prisma/schema.prisma',
      servicePath: 'src/infrastructure/database/prisma.service.ts',
    },
    dashboard: {
      components: { form: {}, display: {} },
    },
  },
  output: {
    backend: {
      root: 'src/features',
      dtosPath: 'src/dtos/generated',
      modulesPaths: ['src/features', 'src/modules', 'src'],
      guardsPath: 'src/guards',
      decoratorsPath: 'src/decorators',
      interceptorsPath: 'src/interceptors',
      utilsPath: 'src/utils',
      appModulePath: 'src/app.module.ts',
    },
    dashboard: {
      enabled: true,
      updateDataProvider: true,
      root: 'src/dashboard/src',
      resourcesPath: 'src/dashboard/src/resources',
      swaggerJsonPath: 'src/dashboard/src/types/swagger.json',
      apiPath: 'src/dashboard/src/types/api.ts',
      appComponentPath: 'src/dashboard/src/App.tsx',
      dataProviderPath: 'src/dashboard/src/providers/dataProvider.ts',
    },
  },
  api: {
    suffix: '',
    prefix: 'tg-api',
    authenticationEnabled: true,
    requireAdmin: true,
    guards: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }],
    adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
  },
  behavior: {
    nonInteractive: false,
  },
};
```

---

## CLI COMMANDS REFERENCE

### Essential Commands

```bash
# Initialize configuration (MUST be run first)
npx tgraph init

# Check environment and configuration
npx tgraph doctor

# Preview changes without writing files
npx tgraph preflight

# Generate everything (API + Dashboard + DTOs)
npx tgraph all

# Generate only backend API
npx tgraph api

# Generate only dashboard
npx tgraph dashboard

# Generate only DTOs
npx tgraph dtos

# Generate static infrastructure files
npx tgraph static

# Generate dashboard API types from Swagger
npx tgraph types

# Generate Swagger JSON only
npx tgraph swagger
```

### Command Options

**Global flags (available on most commands):**
- `--config <path>` - Use a custom config file (default: `tgraph.config.ts`)
- `-y, --yes, --non-interactive` - Skip all prompts
- `-h, --help` - Display help output

**API / Dashboard / All commands:**
- `--public` - Temporarily generate controllers without authentication guards (mirrors `api.authenticationEnabled = false`)

**DTO command:**
- `--config <path>`
- `-y, --yes, --non-interactive`
- `-h, --help`

**Init command:**
- `--output <path>` - Custom file name (default: `tgraph.config.ts`)
- `--requireAdmin <true|false>` - Whether the scaffolded config should enable admin guards
- `-y, --yes, --non-interactive`
- `-h, --help`

**Static command:**
- `--list` - List available static modules
- `--include <names>` - Generate specific modules (comma-separated)
- `--cat <name>` - Preview a static file
- `--non-interactive`, `-y`, `--yes`
- `-h, --help`

**Types command:**
- `--skip-swagger` - Skip running the configured Swagger command
- `-h, --help`

**Doctor, preflight, adapters, swagger:** support `-h, --help` only.

---

## PRISMA SCHEMA ANNOTATION

### Model-Level Directives

**Mark models for generation:**
```prisma
// @tg_form()
model User {
  id    String @id @default(uuid())
  name  String
  email String @unique
}
```

**CRITICAL RULES:**
1. Only models with `// @tg_form()` are processed
2. Must be double-slash comment (`//`), not triple-slash (`///`)
3. Must appear immediately before the `model` keyword
4. Must have exact syntax: `@tg_form()`

**Set display label for relations:**
```prisma
// @tg_label(name)
// @tg_form()
model User {
  id    String @id @default(uuid())
  name  String
  email String @unique
}
```

**Label field fallback order (if no @tg_label specified):**
1. `name`
2. `title`
3. `email`
4. `code`
5. `slug`
6. First non-ID string field
7. `id` (final fallback)

### Field-Level Directives

**CRITICAL:** Field directives use triple-slash comments (`///`) and must appear immediately above the field.

**Available field directives:**

#### 1. @tg_format

Controls string formatting and validation.

```prisma
model User {
  /// @tg_format(email)
  email String @unique
  
  /// @tg_format(url)
  website String?
  
  /// @tg_format(password)
  password String
  
  /// @tg_format(tel)
  phone String?
}
```

**Supported formats:**
- `email` - Email validation, generates `@IsEmail()` decorator
- `url` - URL validation, generates `@IsUrl()` decorator
- `password` - Password input (hidden), generates `@MinLength(8)` by default
- `tel` - Telephone validation, generates phone regex pattern

**Generated DTO example:**
```typescript
export class CreateUserTgDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @Matches(/^[0-9+()\s-]+$/)
  @IsOptional()
  phone?: string;
}
```

**Generated React Admin input:**
```tsx
<TextInput source="email" type="email" required />
<TextInput source="website" type="url" />
<TextInput source="password" type="password" required />
<TextInput source="phone" type="tel" />
```

#### 2. @tg_upload

Enables file upload for string fields.

```prisma
model Product {
  /// @tg_upload(image)
  thumbnail String?
  
  /// @tg_upload(file)
  datasheet String?
}
```

**Supported types:**
- `image` - Image files with preview, generates `accept="image/*"`
- `file` - Any file type

**Generated React Admin input:**
```tsx
<FileInput source="thumbnail" accept="image/*">
  <ImageField source="src" title="title" />
</FileInput>

<FileInput source="datasheet">
  <FileField source="src" title="title" />
</FileInput>
```

**Upload workflow:**
1. User selects file in dashboard
2. Data provider detects File object
3. Uploads to `POST /upload` endpoint
4. Receives URL in response
5. Replaces File object with URL string
6. Submits to model API with URL string

**CRITICAL:** Backend must implement `POST /upload` endpoint:
```typescript
@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    // Save file and return URL
    return { url: `/uploads/${file.filename}` };
  }
}
```

#### 3. @tg_readonly

Marks field as read-only (displayed but not editable).

```prisma
model User {
  /// @tg_readonly
  ipAddress String?
  
  /// @tg_readonly
  userAgent String?
}
```

**Generated React Admin input:**
```tsx
<TextInput source="ipAddress" disabled readOnly />
<TextInput source="userAgent" disabled readOnly />
```

**Data provider behavior:**
- Read-only fields are automatically stripped from create/update payloads
- Prevents accidental modification of system-managed fields

### Inline Validation Comments

Add validation through inline comments:

```prisma
model User {
  username String  // @min(3) @max(20)
  email    String @unique  // @pattern(/^[^\s@]+@/)
  bio      String?  // @max(500)
  age      Int      // @min(18) @max(120)
  password String   // @min(8, [create])
}
```

**Supported validation directives:**
- `@min(n)` - Minimum length/value
- `@max(n)` - Maximum length/value
- `@length(n)` - Exact length
- `@pattern(/regex/)` - Regex pattern

**Operation-specific validation:**
```prisma
field String  // @min(8, [create])
field String  // @max(100, [create, update])
```

**Valid operations:** `create`, `update`

**Generated DTO:**
```typescript
export class CreateUserTgDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @Matches(/^[^\s@]+@/)
  @IsNotEmpty()
  email: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;

  @IsInt()
  @Min(18)
  @Max(120)
  @IsNotEmpty()
  age: number;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}
```

### Field Type Mapping

**String types:**
```prisma
name String       -> @IsString() @IsNotEmpty()
name String?      -> @IsString() @IsOptional()
name String @default("value") -> @IsString() @IsOptional()
```

**Number types:**
```prisma
age Int           -> @IsInt() @IsNotEmpty()
price Float       -> @IsNumber() @IsNotEmpty()
age Int?          -> @IsInt() @IsOptional()
```

**Boolean types:**
```prisma
active Boolean    -> @IsBoolean() @IsNotEmpty()
active Boolean?   -> @IsBoolean() @IsOptional()
active Boolean @default(true) -> @IsBoolean() @IsOptional()
```

**DateTime types:**
```prisma
createdAt DateTime         -> @IsDate() @IsNotEmpty()
createdAt DateTime?        -> @IsDate() @IsOptional()
createdAt DateTime @default(now()) -> Excluded from Create DTO
updatedAt DateTime @updatedAt -> Excluded from DTOs
```

**Enum types:**
```prisma
enum Role {
  USER
  ADMIN
}

role Role         -> @IsEnum(Role) @IsNotEmpty()
role Role?        -> @IsEnum(Role) @IsOptional()
role Role @default(USER) -> @IsEnum(Role) @IsOptional()
```

**JSON types:**
```prisma
metadata Json     -> metadata: any (no validation)
metadata Json?    -> metadata?: any
```

**Array types:**
```prisma
tags String[]     -> @IsArray() @IsString({ each: true }) @IsNotEmpty()
tags String[]?    -> @IsArray() @IsString({ each: true }) @IsOptional()
```

**Relation types:**
```prisma
author User @relation(fields: [authorId], references: [id])
authorId String   -> @IsString() @IsNotEmpty()
```

### Relation Handling

**One-to-many:**
```prisma
// @tg_label(name)
// @tg_form()
model User {
  id    String @id @default(uuid())
  name  String
  posts Post[]
}

// @tg_form()
model Post {
  id       String @id @default(uuid())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId String

  @@index([authorId])
}
```

**Generated React Admin input:**
```tsx
<ReferenceInput source="authorId" reference="users">
  <AutocompleteInput optionText="name" />
</ReferenceInput>
```

**Many-to-many:**
```prisma
// @tg_form()
model Post {
  id         String     @id @default(uuid())
  title      String
  categories Category[]
}

// @tg_form()
model Category {
  id    String @id @default(uuid())
  name  String
  posts Post[]
}
```

**Generated React Admin input:**
```tsx
<ReferenceArrayInput source="categoryIds" reference="categories">
  <AutocompleteArrayInput optionText="name" />
</ReferenceArrayInput>
```

---

## GENERATED FILE STRUCTURE

### Backend Files

For each model marked with `@tg_form()`, the following files are generated:

**Controller:** `src/features/{model-name}/{model-name}.tg.controller.ts`
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserTgService } from './user.tg.service';
import { CreateUserTgDto } from './create-user.tg.dto';
import { UpdateUserTgDto } from './update-user.tg.dto';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { AdminGuard } from '@/guards/admin.guard';
import { IsAdmin } from '@/decorators/is-admin.decorator';

@Controller('tg-api/users')
@UseGuards(JwtAuthGuard, AdminGuard)
@IsAdmin()
@ApiTags('users')
@ApiBearerAuth()
export class UserTgController {
  constructor(private readonly userTgService: UserTgService) {}

  @Get()
  async findAll(@Query() query: PaginationSearchDto) {
    return this.userTgService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userTgService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateUserTgDto) {
    return this.userTgService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserTgDto) {
    return this.userTgService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userTgService.remove(id);
  }
}
```

**Service:** `src/features/{model-name}/{model-name}.tg.service.ts`
```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserTgDto } from './create-user.tg.dto';
import { UpdateUserTgDto } from './update-user.tg.dto';

@Injectable()
export class UserTgService {
  constructor(private readonly prisma: PrismaService) {}

  private getSelectFields() {
    return {
      id: true,
      name: true,
      email: true,
      // ... all fields except relations (unless configured)
    };
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, search } = query;
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.getSelectFields(),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const item = await this.prisma.user.findUnique({
      where: { id },
      select: this.getSelectFields(),
    });
    if (!item) {
      throw new NotFoundException('User not found');
    }
    return item;
  }

  // Auto-generated unique field getter
  async getOneByEmail(email: string) {
    const item = await this.prisma.user.findUnique({
      where: { email },
      select: this.getSelectFields(),
    });
    if (!item) {
      throw new NotFoundException('User not found');
    }
    return item;
  }

  async create(dto: CreateUserTgDto) {
    try {
      return await this.prisma.user.create({
        data: dto,
        select: this.getSelectFields(),
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserTgDto) {
    await this.findOne(id); // Verify exists
    try {
      return await this.prisma.user.update({
        where: { id },
        data: dto,
        select: this.getSelectFields(),
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id); // Verify exists
    return await this.prisma.user.delete({
      where: { id },
      select: this.getSelectFields(),
    });
  }
}
```

**Create DTO:** `src/features/{model-name}/create-{model-name}.tg.dto.ts`
```typescript
import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserTgDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;
}
```

**Update DTO:** `src/features/{model-name}/update-{model-name}.tg.dto.ts`
```typescript
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserTgDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;
}
```

**Module:** `src/features/{model-name}/{model-name}.module.ts` (if doesn't exist)
```typescript
import { Module } from '@nestjs/common';
import { UserTgController } from './user.tg.controller';
import { UserTgService } from './user.tg.service';

@Module({
  controllers: [UserTgController],
  providers: [UserTgService],
  exports: [UserTgService],
})
export class UserModule {}
```

### Dashboard Files

For each model marked with `@tg_form()`, the following React Admin files are generated:

**List:** `src/dashboard/src/resources/{model-name-plural}/{ModelName}List.tsx`
```tsx
import { List, Datagrid, TextField, EmailField, DateField, EditButton } from 'react-admin';

export const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <EmailField source="email" />
      <DateField source="createdAt" />
      <EditButton />
    </Datagrid>
  </List>
);
```

**Edit:** `src/dashboard/src/resources/{model-name-plural}/{ModelName}Edit.tsx`
```tsx
import { Edit, SimpleForm, TextInput } from 'react-admin';

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="email" type="email" required />
      <TextInput source="bio" multiline />
    </SimpleForm>
  </Edit>
);
```

**Create:** `src/dashboard/src/resources/{model-name-plural}/{ModelName}Create.tsx`
```tsx
import { Create, SimpleForm, TextInput } from 'react-admin';

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="email" type="email" required />
      <TextInput source="bio" multiline />
    </SimpleForm>
  </Create>
);
```

**Show:** `src/dashboard/src/resources/{model-name-plural}/{ModelName}Show.tsx`
```tsx
import { Show, SimpleShowLayout, TextField, EmailField, DateField } from 'react-admin';

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="bio" />
      <DateField source="createdAt" />
    </SimpleShowLayout>
  </Show>
);
```

**Studio:** `src/dashboard/src/resources/{model-name-plural}/{ModelName}Studio.tsx`
```tsx
import { DatagridAGGrid } from '@react-admin/ra-datagrid-ag-grid';
import { List } from 'react-admin';

export const UserStudio = () => (
  <List>
    <DatagridAGGrid
      columnDefs={[
        { field: 'name', editable: true },
        { field: 'email', editable: true },
        { field: 'bio', editable: true },
      ]}
    />
  </List>
);
```

**Index:** `src/dashboard/src/resources/{model-name-plural}/index.ts`
```tsx
export { UserList } from './UserList';
export { UserEdit } from './UserEdit';
export { UserCreate } from './UserCreate';
export { UserShow } from './UserShow';
export { UserStudio } from './UserStudio';
```

### App.tsx Updates

The dashboard `App.tsx` is automatically updated with resource registrations:

```tsx
import { Admin, Resource } from 'react-admin';
import { UserList, UserEdit, UserCreate, UserShow } from './resources/users';
import dataProvider from './providers/dataProvider';

const App = () => (
  <Admin dataProvider={dataProvider}>
    <Resource
      name="users"
      list={UserList}
      edit={UserEdit}
      create={UserCreate}
      show={UserShow}
    />
  </Admin>
);

export default App;
```

### Field Directives Metadata

Field directives are exported to dashboard runtime:

**File:** `src/dashboard/src/providers/fieldDirectives.generated.ts`
```typescript
export const fieldDirectives = {
  users: {
    email: { tgFormat: 'email' },
    avatar: { tgUpload: 'image' },
    ipAddress: { tgReadOnly: true },
  },
  posts: {
    coverImage: { tgUpload: 'image' },
  },
};
```

---

## CUSTOM ADAPTERS

### Overview

Adapters provide a way to create custom endpoints without modifying generated controller files. They live in separate files and are automatically discovered during generation.

**Location:** `src/features/{model-name}/adapters/*.adapter.ts`

**Benefits:**
- No editing of generated files
- Automatic discovery and integration
- Full type safety with generics
- Auto-generated DTOs and validation
- OpenAPI documentation generated automatically

### Basic Adapter Structure

```typescript
// src/features/post/adapters/create-with-slug.adapter.ts
import { adapter } from '@/adapters/runtime';

// Define request body type for type safety
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
    
    // body is typed as CreatePostBody
    const slug = helpers.slugify(body.title);
    
    return {
      args: {
        ...body,
        slug,
      },
    };
  }
);
```

### Adapter Types

**JSON Adapter (most common):**
```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/endpoint',
    target: 'ServiceName.methodName',
  },
  async (ctx) => {
    // ctx.body contains parsed JSON
    return { args: { ...ctx.body } };
  }
);
```

**Multipart Adapter (for file uploads):**
```typescript
export default adapter.multipart(
  {
    method: 'POST',
    path: '/upload-image',
    target: 'PostService.update',
  },
  async (ctx) => {
    const { files, body, helpers } = ctx;
    
    const file = Array.isArray(files) ? files[0] : files;
    const url = await helpers.upload.minio(file, 'images');
    
    return {
      args: {
        id: body.id,
        imageUrl: url,
      },
    };
  }
);
```

### Configuration Options

**Required fields:**
```typescript
{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: '/endpoint',  // Must start with /
}
```

**Optional fields:**
```typescript
{
  target: 'ServiceName.methodName',  // Service method to call (or null to bypass)
  auth: 'JwtAuthGuard',              // Single guard
  auth: ['JwtAuthGuard', 'AdminGuard'],  // Multiple guards
  select: ['id', 'title'],           // Fields to return
  include: ['author'],               // Relations to include
  description: 'Description',        // OpenAPI description
  summary: 'Summary',                // OpenAPI summary
  tags: ['custom'],                  // OpenAPI tags
}
```

**CRITICAL:** Cannot use both `select` and `include` in the same adapter.

### Context API

The adapter handler receives a context object:

```typescript
async (ctx) => {
  // Request data
  ctx.url          // Full request URL
  ctx.params       // Route parameters: { id: '123' }
  ctx.query        // Query string: { page: '1' }
  ctx.body         // Parsed JSON body
  ctx.headers      // Request headers
  ctx.files        // Uploaded files (multipart only)
  
  // Authentication
  ctx.user         // Authenticated user from guard
  
  // Dependencies
  ctx.di.prisma    // PrismaService instance
  ctx.di.{service} // Other injected services
  
  // Utilities
  ctx.helpers.uuid()                // Generate UUID v4
  ctx.helpers.slugify(text)         // Convert to slug
  ctx.helpers.ext(filename)         // Get file extension
  ctx.helpers.pick(obj, keys)       // Pick object properties
  ctx.helpers.assert(condition, msg) // Assert condition
  ctx.helpers.upload.minio(file)    // Upload to MinIO (user-implemented)
  
  // Raw objects (advanced)
  ctx.req          // Express Request
  ctx.res          // Express Response
}
```

### TypeScript Generics for Type Safety

Provide explicit types for request body, query, and params:

```typescript
interface CreatePostBody {
  title: string;
  content: string;
}

interface PostQuery {
  published?: boolean;
  page?: string;
}

interface PostParams {
  id: string;
}

// Pass generic types: <TBody, TQuery, TParams>
export default adapter.json<CreatePostBody, PostQuery, PostParams>(
  {
    method: 'POST',
    path: '/:id',
    target: 'PostService.create',
  },
  async (ctx) => {
    // Fully typed - no 'any'!
    const title: string = ctx.body.title;       // ✓ Typed
    const published = ctx.query.published;      // ✓ Typed
    const id: string = ctx.params.id;           // ✓ Typed
    
    return { args: ctx.body };
  }
);
```

### Return Types

**Call service method:**
```typescript
return {
  args: {
    title: 'My Title',
    content: 'Content',
  },
};
```

**Direct response (bypass service):**
```typescript
return adapter.response(200, {
  success: true,
  message: 'Processed',
});
```

**Direct response with headers:**
```typescript
return adapter.response(
  201,
  { id: '123' },
  { 'X-Custom-Header': 'value' }
);
```

### Common Patterns

**External API integration:**
```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/sync-stripe',
  },
  async (ctx) => {
    const stripeCustomer = await stripe.customers.create({
      email: ctx.body.email,
    });
    
    await ctx.di.prisma.user.update({
      where: { id: ctx.body.userId },
      data: { stripeCustomerId: stripeCustomer.id },
    });
    
    return adapter.response(200, {
      success: true,
      customerId: stripeCustomer.id,
    });
  }
);
```

**Custom validation:**
```typescript
export default adapter.json(
  {
    method: 'POST',
    path: '/validate',
    target: 'UserService.create',
  },
  async (ctx) => {
    const { body, helpers, di } = ctx;
    
    helpers.assert(body.age >= 18, 'Must be 18 or older');
    
    const existing = await di.prisma.user.findUnique({
      where: { email: body.email },
    });
    helpers.assert(!existing, 'Email already registered');
    
    return { args: body };
  }
);
```

---

## STATIC FILES

The generator can create static infrastructure files:

```bash
npx tgraph static --list
```

**Available modules:**
- `admin.guard` - Admin role guard
- `feature-flag.guard` - Feature flag guard stub
- `is-admin.decorator` - IsAdmin decorator
- `paginated-search-query.dto` - Pagination query DTO
- `paginated-search-result.dto` - Pagination result DTO
- `api-response.dto` - Standard API response wrapper
- `pagination.interceptor` - Pagination interceptor
- `audit.interceptor` - Audit logging interceptor stub
- `paginated-search.decorator` - Paginated search decorator
- `paginated-search.util` - Pagination utilities
- `adapter.runtime` - Adapter runtime factory
- `adapter.types` - Adapter TypeScript types
- `adapter.helpers` - Adapter helper utilities
- `adapter.context` - Adapter context builder
- `generate.swagger` - Swagger generation script template

**Generate specific modules:**
```bash
npx tgraph static --include admin.guard,pagination.interceptor
```

**Generate all modules:**
```bash
npx tgraph static --yes
```

---

## TYPICAL WORKFLOW

### Initial Setup

1. Install package:
   ```bash
   npm install --save-dev @tgraph/backend-generator
   ```

2. Initialize configuration:
   ```bash
   npx tgraph init
   ```

3. Check environment:
   ```bash
   npx tgraph doctor
   ```

### Annotate Prisma Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// @tg_label(name)
// @tg_form()
model User {
  id        String   @id @default(uuid())
  name      String   // @min(2) @max(100)
  /// @tg_format(email)
  email     String   @unique
  /// @tg_upload(image)
  avatar    String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// @tg_label(title)
// @tg_form()
model Post {
  id          String    @id @default(uuid())
  title       String    // @min(5) @max(200)
  content     String
  published   Boolean   @default(false)
  author      User      @relation(fields: [authorId], references: [id])
  authorId    String
  /// @tg_upload(image)
  coverImage  String?
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId])
}

enum Role {
  USER
  AUTHOR
  ADMIN
}
```

### Generate Code

```bash
# Preview changes
npx tgraph preflight

# Generate everything
npx tgraph all

# Or generate selectively
npx tgraph api         # Backend only
npx tgraph dashboard   # Dashboard only
npx tgraph dtos        # DTOs only
```

### Generate Static Files

```bash
# Interactive selection
npx tgraph static

# Or generate specific modules
npx tgraph static --include admin.guard,pagination.interceptor,is-admin.decorator
```

### Generate Dashboard Types

```bash
# Generate Swagger JSON and TypeScript API client
npx tgraph types
```

### Test Generated API

```bash
# Start backend
npm run start:dev

# Test endpoints
curl -X GET http://localhost:3000/tg-api/users
curl -X POST http://localhost:3000/tg-api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Extend with Custom Logic

**Custom service:**
```typescript
// src/features/post/post.service.ts
import { Injectable } from '@nestjs/common';
import { PostTgService } from './post.tg.service';

@Injectable()
export class PostService extends PostTgService {
  async publish(id: string) {
    return this.prisma.post.update({
      where: { id },
      data: {
        published: true,
        publishedAt: new Date(),
      },
    });
  }
}
```

**Custom controller:**
```typescript
// src/features/post/post.controller.ts
import { Controller, Put, Param, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Put(':id/publish')
  async publish(@Param('id') id: string) {
    return this.postService.publish(id);
  }
}
```

**Custom adapter:**
```typescript
// src/features/post/adapters/publish.adapter.ts
import { adapter } from '@/adapters/runtime';

export default adapter.json(
  {
    method: 'PUT',
    path: '/:id/publish',
    auth: ['JwtAuthGuard', 'AdminGuard'],
    description: 'Publish a post',
  },
  async (ctx) => {
    const { params, di } = ctx;
    
    const post = await di.prisma.post.update({
      where: { id: params.id },
      data: {
        published: true,
        publishedAt: new Date(),
      },
    });
    
    return adapter.response(200, post);
  }
);
```

### Regenerate After Schema Changes

```bash
# Update Prisma schema
# Then regenerate
npx tgraph all

# Or regenerate specific parts
npx tgraph api
npx tgraph dashboard
```

---

## COMMON PATTERNS AND BEST PRACTICES

### Multiple API Configurations

Generate both admin and public APIs:

```bash
# Admin API with authentication
npx tgraph api --config tgraph.admin.config.ts

# Public API without authentication
npx tgraph api --public --config tgraph.public.config.ts
```

Set `api.suffix` inside each config file (for example `Admin` vs `Public`) to control class names and file suffixes.

### CI/CD Integration

```bash
# Non-interactive mode for CI
npx tgraph all --yes
```

### Monorepo Structure

Define a monorepo-specific config so every path stays accurate:

```typescript
// tgraph.mono.config.ts
import type { Config } from '@tgraph/backend-generator';
import { config as base } from './tgraph.config';

export const config: Config = {
  ...base,
  input: {
    ...base.input,
    prisma: {
      ...base.input.prisma,
      schemaPath: 'apps/api/prisma/schema.prisma',
      servicePath: 'apps/api/src/infrastructure/database/prisma.service.ts',
    },
  },
  output: {
    backend: {
      ...base.output.backend,
      root: 'apps/api/src/features',
      dtosPath: 'apps/api/src/dtos/generated',
      modulesPaths: ['apps/api/src/features', 'apps/api/src/modules'],
    },
    dashboard: {
      ...base.output.dashboard,
      root: 'apps/admin/src',
      resourcesPath: 'apps/admin/src/resources',
    },
  },
};
```

Run the generator with that config:

```bash
npx tgraph all --config tgraph.mono.config.ts
```

### File Upload Implementation

**Backend upload controller:**
```typescript
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
    })
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
```

### Unique Field Lookups

Generated services automatically include getters for unique fields:

```typescript
// Prisma schema
model User {
  email String @unique
  phone String @unique
}

// Generated service methods
async getOneByEmail(email: string) {
  const item = await this.prisma.user.findUnique({
    where: { email },
    select: this.getSelectFields(),
  });
  if (!item) {
    throw new NotFoundException('User not found');
  }
  return item;
}

async getOneByPhone(phone: string) {
  const item = await this.prisma.user.findUnique({
    where: { phone },
    select: this.getSelectFields(),
  });
  if (!item) {
    throw new NotFoundException('User not found');
  }
  return item;
}
```

### Relation Includes (Programmatic)

The CLI generates scalar selects by default. When you need relations in service responses, use the SDK and pass `relationsInclude` to `NestServiceGenerator`:

```typescript
import { NestServiceGenerator } from '@tgraph/backend-generator';

const services = new NestServiceGenerator({
  suffix: 'Admin',
  relationsInclude: ['author', 'comments'], // or 'all'
});
```

This instructs the generator to include relation selects with their inferred display fields.

---

## ERROR HANDLING AND TROUBLESHOOTING

### Common Issues

**Issue: Command not found**
```
Solution: Use npx prefix or install globally
npx tgraph all
OR
npm install -g @tgraph/backend-generator
```

**Issue: No configuration file found**
```
Solution: Initialize configuration first
npx tgraph init
```

**Issue: Schema not found**
```
Solution: Verify `input.prisma.schemaPath` in your config (point it to the correct .prisma file) and rerun the generator
npx tgraph api --config tgraph.config.ts
```

**Issue: Field directive not working**
```
Solution: Ensure triple-slash comments (///) for field directives
Correct:   /// @tg_format(email)
Incorrect: // @tg_format(email)
```

**Issue: Model-level directive not working**
```
Solution: Ensure double-slash comments (//) for model directives
Correct:   // @tg_form()
Incorrect: /// @tg_form()
```

**Issue: Adapter not discovered**
```
Solution: Verify file location and naming
- Location: src/features/{model}/adapters/*.adapter.ts
- Naming: must end with .adapter.ts
- Export: must use 'export default'
```

**Issue: Type errors in generated files**
```
Solution: Install required peer dependencies
npm install @nestjs/common @nestjs/swagger @types/express @types/multer
```

---

## CRITICAL RULES SUMMARY

1. **Model directives use double-slash (`//`)**
   - `// @tg_form()`
   - `// @tg_label(name)`

2. **Field directives use triple-slash (`///`)**
   - `/// @tg_format(email)`
   - `/// @tg_upload(image)`
   - `/// @tg_readonly`

3. **Inline validation uses double-slash (`//`)**
   - `field String  // @min(3) @max(20)`

4. **Generated files use `.tg.` naming**
   - `user.tg.controller.ts`
   - `user.tg.service.ts`
   - `create-user.tg.dto.ts`

5. **Custom files never use `.tg.` naming**
   - `user.service.ts`
   - `user.controller.ts`

6. **Configuration file must exist**
   - Run `tgraph init` first
   - Default name: `tgraph.config.ts`

7. **Adapters must be in correct location**
   - Path: `{modulePath}/adapters/*.adapter.ts`
   - Must export default

8. **Upload endpoint must be implemented**
   - Required for `@tg_upload` directive
   - Must respond with `{ url: string }`

9. **Cannot use both select and include**
   - In adapter config
   - In service method calls

10. **All commands require configuration file**
    - Except `tgraph init`
    - Except `tgraph --help`

---

## COMPLETE EXAMPLE

Here's a complete example from start to finish:

### 1. Install and Initialize

```bash
npm install --save-dev @tgraph/backend-generator
npx tgraph init
npx tgraph doctor
```

### 2. Create Prisma Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// @tg_label(name)
// @tg_form()
model User {
  id        String   @id @default(uuid())
  name      String   // @min(2) @max(100)
  /// @tg_format(email)
  email     String   @unique
  /// @tg_upload(image)
  avatar    String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// @tg_label(title)
// @tg_form()
model Post {
  id          String    @id @default(uuid())
  title       String    // @min(5) @max(200)
  content     String
  published   Boolean   @default(false)
  author      User      @relation(fields: [authorId], references: [id])
  authorId    String
  /// @tg_upload(image)
  coverImage  String?
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId])
}

enum Role {
  USER
  AUTHOR
  ADMIN
}
```

### 3. Generate Code

```bash
npx tgraph preflight  # Preview
npx tgraph all        # Generate
npx tgraph static     # Generate infrastructure
npx tgraph types      # Generate API client
```

### 4. Implement Upload Endpoint

```typescript
// src/features/upload/upload.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
    })
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`,
    };
  }
}
```

### 5. Create Custom Adapter

```typescript
// src/features/post/adapters/publish.adapter.ts
import { adapter } from '@/adapters/runtime';

export default adapter.json(
  {
    method: 'PUT',
    path: '/:id/publish',
    auth: ['JwtAuthGuard', 'AdminGuard'],
    description: 'Publish a post and set publish date',
  },
  async (ctx) => {
    const { params, di, helpers } = ctx;
    
    const post = await di.prisma.post.findUnique({
      where: { id: params.id },
    });
    
    helpers.assert(post, 'Post not found');
    helpers.assert(!post.published, 'Post already published');
    
    const updated = await di.prisma.post.update({
      where: { id: params.id },
      data: {
        published: true,
        publishedAt: new Date(),
      },
    });
    
    return adapter.response(200, {
      success: true,
      post: updated,
    });
  }
);
```

### 6. Regenerate to Include Adapter

```bash
npx tgraph api
```

### 7. Test API

```bash
# Start server
npm run start:dev

# Get all users
curl http://localhost:3000/tg-api/users \
  -H "Authorization: Bearer TOKEN"

# Create user
curl -X POST http://localhost:3000/tg-api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AUTHOR"
  }'

# Publish post
curl -X PUT http://localhost:3000/tg-api/posts/POST_ID/publish \
  -H "Authorization: Bearer TOKEN"
```

### 8. Start Dashboard

```bash
cd src/dashboard
npm run dev
```

Open http://localhost:5173 and test the dashboard.

---

## VERSION INFORMATION

**Current version:** 0.0.3  
**Node.js requirement:** >= 18.0.0  
**NPM requirement:** >= 9.0.0

**Peer dependencies:**
- @nestjs/common: ^10.0.0
- @nestjs/platform-express: ^10.0.0
- @nestjs/swagger: ^7.0.0
- @types/express: ^4.17.0
- @types/multer: ^1.4.0
- express: ^4.18.0
- multer: ^1.4.5-lts.1

---

## ADDITIONAL RESOURCES

**GitHub Repository:** https://github.com/trugraph/backend-generator  
**NPM Package:** https://www.npmjs.com/package/@tgraph/backend-generator  
**Documentation Site:** https://trugraph.github.io/backend-generator/  
**Issues:** https://github.com/trugraph/backend-generator/issues

---

## END OF GUIDE

This guide provides complete information for LLMs to understand and correctly use the @tgraph/backend-generator library. All syntax, patterns, and workflows have been documented with precision for machine parsing and understanding.

