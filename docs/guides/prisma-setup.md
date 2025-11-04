# Prisma Schema Setup

Learn how to configure your Prisma schema for optimal code generation with TGraph Backend Generator.

## Model Annotation

Mark models for generation with the `@tg_form()` comment:

```prisma
// @tg_form()
model User {
  id    String @id @default(uuid())
  name  String
  email String @unique
}
```

Only models with `// @tg_form()` are processed. This gives you fine-grained control over what gets generated.

## Display Labels for Relations

Control how related records display in dropdowns and references with `@tg_label`:

```prisma
// @tg_label(name)
// @tg_form()
model User {
  id    String @id @default(uuid())
  name  String
  email String @unique
}

// @tg_form()
model Post {
  id       String @id @default(uuid())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
}
```

In the Post form, the author dropdown will display user names instead of IDs.

### Label Field Fallback

If no `@tg_label` is specified, the generator uses this heuristic:
1. `name`
2. `title`
3. `email`
4. `code`
5. `slug`
6. First non-ID string field
7. `id` (fallback)

## Field Directives

Field directives control how individual fields are generated. Place them in triple-slash comments immediately above the field:

```prisma
model User {
  id    String @id @default(uuid())
  name  String
  /// @tg_format(email)
  email String @unique
  /// @tg_format(url)
  avatar String?
  /// @tg_readonly
  ipAddress String?
}
```

See the [Field Directives Guide](./field-directives.md) for complete reference.

## Custom Validation

Add validation through inline comments using class-validator syntax:

### Max Length

```prisma
model User {
  firstName String    // @max(50)
  lastName  String    // @max(50)
  bio       String?   // @max(500)
}
```

Generates:

```typescript
export class CreateUserTgDto {
  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;
}
```

### Min Length

```prisma
model User {
  username String  // @min(3)
  password String  // @min(8)
}
```

### Exact Length

```prisma
model User {
  zipCode String  // @length(5)
}
```

### Pattern Validation

```prisma
model User {
  phone String  // @pattern(/^[0-9]{10}$/)
}
```

### Operation-Specific Validation

Apply validation only for specific operations:

```prisma
model User {
  password String  // @min(8, [create])
  bio      String? // @max(500, [create, update])
}
```

Valid operations: `create`, `update`.

## Enum Support

Enums are fully supported with automatic validation:

```prisma
// @tg_form()
model User {
  id     String @id @default(uuid())
  name   String
  role   Role   @default(USER)
  status Status @default(ACTIVE)
}

enum Role {
  USER
  AUTHOR
  ADMIN
}

enum Status {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

Generates:

**DTO:**
```typescript
export class CreateUserTgDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
```

**Dashboard:**
```tsx
<SelectInput
  source="role"
  choices={[
    { id: 'USER', name: 'USER' },
    { id: 'AUTHOR', name: 'AUTHOR' },
    { id: 'ADMIN', name: 'ADMIN' },
  ]}
/>
```

## Relations

### One-to-Many

```prisma
// @tg_label(name)
// @tg_form()
model User {
  id    String @id @default(uuid())
  name  String
  posts Post[]
}

// @tg_label(title)
// @tg_form()
model Post {
  id       String @id @default(uuid())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId String

  @@index([authorId])
}
```

Generates a `ReferenceInput` in the Post form for selecting the author.

### Many-to-Many

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

Generates `ReferenceArrayInput` for multi-select.

## Optional vs Required Fields

The generator respects Prisma's optionality:

```prisma
model User {
  required  String    // Required field
  optional  String?   // Optional field
  withDefault String @default("default")  // Has default (optional in create)
}
```

**Create DTO:**
```typescript
export class CreateUserTgDto {
  @IsString()
  @IsNotEmpty()
  required: string;

  @IsString()
  @IsOptional()
  optional?: string;

  @IsString()
  @IsOptional()
  withDefault?: string;
}
```

## Unique Constraints

Unique constraints are respected in generated services:

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
}
```

The generated service handles unique constraint violations:

```typescript
async create(dto: CreateUserTgDto): Promise<User> {
  try {
    return await this.prisma.user.create({ data: dto });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new ConflictException('Email already exists');
    }
    throw error;
  }
}
```

## Excluded Fields

Certain fields are automatically excluded from TG APIs:

- **Password fields** – Any field named `password`, `passwordHash`, `hashedPassword`
- **Internal fields** – System fields you mark as excluded

To manually exclude a field, don't use `@tg_form()` on that model or handle it in custom logic.

## DateTime Fields

DateTime fields are automatically handled:

```prisma
model Post {
  id          String    @id @default(uuid())
  title       String
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Dashboard:**
- `publishedAt` → `DateTimeInput` (user-editable)
- `createdAt` → Read-only display
- `updatedAt` → Auto-managed by Prisma

## JSON Fields

```prisma
model Settings {
  id       String @id @default(uuid())
  metadata Json?
}
```

Generates:
- **DTO:** `metadata?: any`
- **Dashboard:** `JsonInput` component with validation

## Default Values

Fields with defaults are optional in Create DTOs:

```prisma
model User {
  id        String   @id @default(uuid())
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

**Create DTO:**
```typescript
export class CreateUserTgDto {
  @IsEnum(Role)
  @IsOptional()
  role?: Role;  // Optional because it has a default

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;  // Optional

  // createdAt excluded - managed by Prisma
}
```

## Composite Indexes

While not directly affecting generation, composite indexes are respected:

```prisma
model Post {
  id       String @id @default(uuid())
  authorId String
  status   Status

  @@index([authorId, status])
}
```

The generated search queries leverage these indexes.

## Best Practices

### 1. Use Meaningful Names

```prisma
// Good
model BlogPost {
  id      String @id
  title   String
  content String
}

// Avoid
model BP {
  i  String @id
  t  String
  c  String
}
```

### 2. Add Label Hints

```prisma
// @tg_label(name)
// @tg_form()
model User {
  id   String @id
  name String
}
```

### 3. Document Complex Fields

```prisma
model User {
  /// @tg_format(url)
  /// User's profile photo URL
  avatar String?
}
```

### 4. Use Enums for Constrained Values

```prisma
// Good
enum Status {
  ACTIVE
  INACTIVE
}

model User {
  status Status @default(ACTIVE)
}

// Avoid
model User {
  status String @default("active")  // No validation
}
```

### 5. Add Validation in Comments

```prisma
model User {
  email    String @unique  // @pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  username String          // @min(3) @max(20)
}
```

### 6. Use Relations Instead of Raw IDs

```prisma
// Good
model Post {
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
}

// Avoid manually managing relations
```

## Example: Complete Model

```prisma
// @tg_label(name)
// @tg_form()
model User {
  id        String   @id @default(uuid())
  name      String   // @min(2) @max(100)
  /// @tg_format(email)
  email     String   @unique
  /// @tg_format(url)
  avatar    String?
  /// @tg_format(tel)
  phone     String?
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  posts     Post[]
  /// @tg_readonly
  ipAddress String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
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
  @@index([published, publishedAt])
}

enum Role {
  USER
  AUTHOR
  ADMIN
}
```

This generates a complete, production-ready admin system with validation, file uploads, and relation management.

## Next Steps

- **[Field Directives](./field-directives.md)** – Learn all available field directives
- **[Custom Validation](../recipes/custom-validation.md)** – Advanced validation patterns
- **[Naming Conventions](./naming-conventions.md)** – Understand how names are transformed

