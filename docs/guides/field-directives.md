---
layout: default
title: Field Directives
parent: Guides
nav_order: 2
---

# Field Directives

Field directives are special comments that control how individual fields are generated across the entire toolchain: backend DTOs, services, and React Admin components.

## Overview

Directives are placed in triple-slash comments (`///`) immediately above a field:

```prisma
model User {
  id    String @id @default(uuid())
  /// @tg_format(email)
  email String @unique
  /// @tg_upload(image)
  avatar String?
  /// @tg_readonly
  ipAddress String?
}
```

## Available Directives

### @tg_format

Controls string field formatting and validation.

**Syntax:**

```prisma
/// @tg_format(email|url|password|tel)
```

**Supported formats:**

- `email` – Email validation and email input
- `url` – URL validation and URL input
- `password` – Password input (hidden)
- `tel` – Telephone validation and tel input

**Example:**

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

**Generated DTO:**

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

**Generated Dashboard Input:**

```tsx
<TextInput source="email" type="email" required />
<TextInput source="website" type="url" />
<TextInput source="password" type="password" required />
<TextInput source="phone" type="tel" />
```

---

### @tg_upload

Enables file upload functionality for string fields that store file paths or URLs.

**Syntax:**

```prisma
/// @tg_upload(image|file)
```

**Supported types:**

- `image` – Image files with preview (adds `accept="image/*"`)
- `file` – Any file type

**Example:**

```prisma
model Product {
  id          String @id @default(uuid())
  name        String
  /// @tg_upload(image)
  thumbnail   String?
  /// @tg_upload(file)
  datasheet   String?
}
```

**Generated Dashboard Input:**

```tsx
// For image
<FileInput source="thumbnail" accept="image/*">
  <ImageField source="src" title="title" />
</FileInput>

// For file
<FileInput source="datasheet">
  <FileField source="src" title="title" />
</FileInput>
```

**Data Provider Behavior:**

When a form is submitted:

1. The `FileInput` value (a File object) is detected
2. The file is uploaded to `POST /upload` endpoint
3. The response URL replaces the File object
4. The model API receives a simple string URL

**Backend DTO:**

```typescript
export class CreateProductTgDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  thumbnail?: string; // Receives URL string

  @IsString()
  @IsOptional()
  datasheet?: string; // Receives URL string
}
```

**Note:** You must implement `POST /upload` endpoint in your backend:

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

---

### @tg_readonly

Marks a field as read-only, preventing it from being edited in forms.

**Syntax:**

```prisma
/// @tg_readonly
```

**Example:**

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  /// @tg_readonly
  ipAddress String?
  /// @tg_readonly
  userAgent String?
  createdAt DateTime @default(now())
}
```

**Generated Dashboard Input:**

```tsx
<TextInput source="name" required />
<TextInput source="email" type="email" required />
<TextInput source="ipAddress" disabled readOnly />
<TextInput source="userAgent" disabled readOnly />
```

**Data Provider Behavior:**

Read-only fields are stripped from create/update payloads:

```typescript
// User tries to submit
{ name: 'John', email: 'john@example.com', ipAddress: '1.2.3.4' }

// Data provider sends
{ name: 'John', email: 'john@example.com' }
// ipAddress is removed
```

**Use Cases:**

- Audit fields (IP address, user agent)
- Computed fields
- System-managed fields
- Historical data

---

## Combining Directives

You can combine multiple directives on the same field:

```prisma
model User {
  /// @tg_format(url)
  /// @tg_readonly
  profileUrl String?
}
```

This creates a URL field that is displayed but cannot be edited.

---

## Inline Validation Comments

In addition to field directives, you can add validation through inline comments:

```prisma
model User {
  username String  // @min(3) @max(20)
  /// @tg_format(email)
  email    String @unique  // @pattern(/^[^\s@]+@/)
  bio      String?  // @max(500)
}
```

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
}
```

See [Prisma Setup Guide](./prisma-setup.md#custom-validation) for all validation options.

---

## Generated Metadata

Field directives are exported to the dashboard at runtime:

**File:** `src/dashboard/src/providers/fieldDirectives.generated.ts`

```typescript
export const fieldDirectives = {
  users: {
    email: { tgFormat: 'email' },
    avatar: { tgUpload: 'image' },
    ipAddress: { tgReadOnly: true },
  },
  products: {
    thumbnail: { tgUpload: 'image' },
    datasheet: { tgUpload: 'file' },
  },
};
```

This file is auto-generated—never edit it manually. Regenerate with:

```bash
tgraph dashboard
```

---

## Directive Processing

Directives are processed in this order:

1. **Parse** – `PrismaFieldParser` extracts directives from comments
2. **Enrich** – Directives decorate the `PrismaField` object
3. **Generate Backend** – DTO and service generators read directive metadata
4. **Generate Frontend** – Component generators create appropriate inputs
5. **Export Metadata** – Runtime metadata is written to `fieldDirectives.generated.ts`
6. **Runtime** – Data provider enforces upload and read-only behavior

---

## Examples

### User Profile with Avatar Upload

```prisma
// @tg_label(name)
// @tg_form()
model User {
  id       String  @id @default(uuid())
  name     String  // @min(2) @max(100)
  /// @tg_format(email)
  email    String  @unique
  /// @tg_upload(image)
  avatar   String?
  /// @tg_format(url)
  website  String?
  bio      String? // @max(500)
}
```

### Product with Multiple Files

```prisma
// @tg_form()
model Product {
  id          String  @id @default(uuid())
  name        String  // @min(3) @max(200)
  description String
  /// @tg_upload(image)
  thumbnail   String?
  /// @tg_upload(image)
  gallery     String[] // Multiple images
  /// @tg_upload(file)
  manual      String?
  price       Float
}
```

### Audit Trail

```prisma
// @tg_form()
model Order {
  id          String   @id @default(uuid())
  orderNumber String   @unique
  amount      Float
  status      Status   @default(PENDING)
  /// @tg_readonly
  ipAddress   String?
  /// @tg_readonly
  userAgent   String?
  /// @tg_readonly
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Best Practices

### 1. Use @tg_format for Semantic Fields

```prisma
// Good
/// @tg_format(email)
email String

// Less ideal
email String  // No semantic validation
```

### 2. Combine @tg_upload with Optional

```prisma
// Good - uploads are usually optional
/// @tg_upload(image)
avatar String?

// Avoid - required uploads are harder to test
/// @tg_upload(image)
avatar String
```

### 3. Mark System Fields as @tg_readonly

```prisma
// Good
/// @tg_readonly
ipAddress String?

/// @tg_readonly
lastLoginAt DateTime?

// Avoid - users shouldn't edit these
ipAddress String?
```

### 4. Document Complex Directives

```prisma
/// Profile photo uploaded to S3
/// @tg_upload(image)
avatar String?

/// User's personal website
/// @tg_format(url)
website String?
```

---

## Troubleshooting

### Directive Not Applied

**Problem:** Directive doesn't affect generation.

**Solution:** Ensure you use triple-slash comments (`///`), not double-slash (`//`):

```prisma
// Wrong
// @tg_format(email)
email String

// Correct
/// @tg_format(email)
email String
```

### Upload Not Working

**Problem:** File upload fails or sends File object to API.

**Solution:**

1. Verify `POST /upload` endpoint exists
2. Check `fieldDirectives.generated.ts` includes your field
3. Ensure data provider is configured correctly

### Read-only Field Still Editable

**Problem:** Field marked `@tg_readonly` can still be edited.

**Solution:**

1. Regenerate dashboard: `tgraph dashboard`
2. Verify `fieldDirectives.generated.ts` contains the field
3. Check data provider is using the directive metadata

---

## Next Steps

- **[Prisma Setup](./prisma-setup.md)** – Learn about model-level directives
- **[Customization](./customization.md)** – Extend generated components
- **[File Uploads Recipe](../recipes/file-uploads.md)** – Complete upload implementation
