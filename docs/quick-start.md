# Quick Start

Build a complete blog system with users and posts in under 5 minutes.

## Step 1: Set Up Your Prisma Schema

Add these models to `prisma/schema.prisma`:

```prisma
// @tg_form()
// @tg_label(name)
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  /// @tg_format(url)
  avatar    String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// @tg_form()
// @tg_label(title)
model Post {
  id          String    @id @default(uuid())
  title       String
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

Key features:
- `// @tg_form()` – Marks models for generation
- `// @tg_label(name)` – Sets the display field for relations
- `/// @tg_format(url)` – Validates URL fields
- `/// @tg_upload(image)` – Enables image upload

## Step 2: Generate Everything

Run the generator:

```bash
tgraph all
```

This creates:
- 4 controllers (User, Post with full CRUD)
- 4 services with Prisma integration
- 8 DTOs (Create + Update for each model)
- 8 React Admin pages (List, Edit, Create, Show for each)
- 2 Studio pages for bulk editing

## Step 3: Review Generated API

The generator created two complete REST APIs:

### User API (`/tg-api/users`)

```typescript
// src/features/user/user.tg.controller.ts
@Controller('tg-api/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserTgController {
  @Get()
  async findAll(@Query() query: PaginationSearchDto) {
    // Paginated list with search
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Get by ID
  }

  @Post()
  async create(@Body() dto: CreateUserTgDto) {
    // Create user
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserTgDto) {
    // Update user
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // Delete user
  }
}
```

### Post API (`/tg-api/posts`)

Same structure with relation support – filtering by `authorId`.

## Step 4: Review Generated DTOs

DTOs include validation from your schema:

```typescript
// src/features/user/create-user.tg.dto.ts
export class CreateUserTgDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
```

Notice:
- `@IsEmail()` from `@unique` constraint
- `@IsUrl()` from `@tg_format(url)` directive
- `@IsEnum()` for enum fields
- `@IsOptional()` for nullable fields

## Step 5: Review Dashboard Pages

Check the generated React Admin resources:

```tsx
// src/dashboard/src/resources/users/UserList.tsx
export const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <EmailField source="email" />
      <UrlField source="avatar" />
      <SelectField source="role" choices={roleChoices} />
      <DateField source="createdAt" />
      <EditButton />
    </Datagrid>
  </List>
);
```

```tsx
// src/dashboard/src/resources/posts/PostEdit.tsx
export const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="content" multiline required />
      <BooleanInput source="published" />
      <ReferenceInput source="authorId" reference="users">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <FileInput source="coverImage" accept="image/*">
        <ImageField source="src" title="title" />
      </FileInput>
      <DateTimeInput source="publishedAt" />
    </SimpleForm>
  </Edit>
);
```

Notice:
- Automatic relation handling with `ReferenceInput`
- File upload for `coverImage` (from `@tg_upload(image)`)
- Type-appropriate inputs (Boolean, DateTime, etc.)

## Step 6: Test the API

Start your server:

```bash
npm run start:dev
```

Create a user:

```bash
curl -X POST http://localhost:3000/tg-api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AUTHOR"
  }'
```

List users:

```bash
curl http://localhost:3000/tg-api/users?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 7: Test the Dashboard

Start the dashboard:

```bash
cd src/dashboard
npm run dev
```

Open http://localhost:5173 and:

1. Navigate to `/users` – See the user list
2. Click "Create" – Add a new user with the form
3. Navigate to `/posts` – Create a post
4. Upload a cover image – The file will be uploaded automatically
5. Select an author from the dropdown – Search-enabled autocomplete
6. Navigate to `/users/studio` – Bulk edit users in spreadsheet mode

## Step 8: Customize

Extend the generated code with your custom logic:

```typescript
// src/features/post/post.service.ts
import { PostTgService } from './post.tg.service';

@Injectable()
export class PostService extends PostTgService {
  async publish(id: string): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data: {
        published: true,
        publishedAt: new Date(),
      },
    });
  }

  async getPublishedPosts(): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: { published: true },
      include: { author: true },
      orderBy: { publishedAt: 'desc' },
    });
  }
}
```

The generated `.tg.` files remain unchanged and can be regenerated safely.

## Step 9: Add Custom Endpoint

Create a custom controller alongside the generated one:

```typescript
// src/features/post/post.controller.ts
import { PostService } from './post.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('published')
  async getPublished() {
    return this.postService.getPublishedPosts();
  }

  @Put(':id/publish')
  @UseGuards(AdminGuard)
  async publish(@Param('id') id: string) {
    return this.postService.publish(id);
  }
}
```

## What You've Built

In 5 minutes, you created:

- **2 complete REST APIs** with pagination, search, and filtering
- **8 validated DTOs** with email, URL, and enum validation
- **8 admin pages** with relation support and file uploads
- **2 studio pages** for bulk editing
- **Type safety** from database to frontend

## Next Steps

- **[Field Directives](./guides/field-directives.md)** – Learn all available directives
- **[Custom Validation](./recipes/custom-validation.md)** – Add complex validation rules
- **[Extending Generated Code](./recipes/extending-generated-code.md)** – Advanced patterns
- **[File Uploads](./recipes/file-uploads.md)** – Configure upload handling

## Regenerating After Changes

When you modify your schema:

```bash
# Regenerate everything
tgraph all

# Or selectively
tgraph api        # Backend only
tgraph dashboard  # Frontend only
```

Generated files (`.tg.*`) are overwritten, but your custom code remains untouched.

