---
title: Basic CRUD
---

# Basic CRUD Recipe

Generate a complete CRUD system from a Prisma model in minutes.

## Goal

Create a fully functional blog post management system with:

- REST API endpoints
- Validated DTOs
- Admin dashboard pages
- Search and pagination

## Prerequisites

- TGraph Backend Generator installed
- NestJS project initialized
- Prisma configured

## Step 1: Define the Model

Add to `prisma/schema.prisma`:

```prisma
// @tg_label(title)
// @tg_form()
model Post {
  id          String    @id @default(uuid())
  title       String
  content     String
  published   Boolean   @default(false)
  publishedAt DateTime?
  viewCount   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([published, publishedAt])
}
```

## Step 2: Run Migration

Apply the schema to your database:

```bash
npx prisma migrate dev --name add_post
```

## Step 3: Generate Code

Run the generator:

```bash
tgraph all
```

## Step 4: What You Get

### Backend Files

**Controller** (`post.tg.controller.ts`):

```typescript
@Controller('tg-api/posts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PostTgController {
  constructor(private readonly postService: PostTgService) {}

  @Get()
  async findAll(@Query() query: PaginationSearchDto) {
    return this.postService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePostTgDto) {
    return this.postService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePostTgDto) {
    return this.postService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.postService.remove(id);
  }
}
```

**Create DTO** (`create-post.tg.dto.ts`):

```typescript
export class CreatePostTgDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  publishedAt?: Date;

  @IsInt()
  @IsOptional()
  viewCount?: number;
}
```

**Update DTO** (`update-post.tg.dto.ts`):

```typescript
export class UpdatePostTgDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  publishedAt?: Date;

  @IsInt()
  @IsOptional()
  viewCount?: number;
}
```

**Service** (`post.tg.service.ts`):

```typescript
@Injectable()
export class PostTgService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePostTgDto): Promise<Post> {
    return this.prisma.post.create({ data: dto });
  }

  async findAll(query: PaginationSearchDto): Promise<PaginatedResponse<Post>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async update(id: string, dto: UpdatePostTgDto): Promise<Post> {
    await this.findOne(id);
    return this.prisma.post.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Post> {
    await this.findOne(id);
    return this.prisma.post.delete({ where: { id } });
  }
}
```

### Dashboard Files

**List** (`PostList.tsx`):

```tsx
export const PostList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="title" />
      <TextField source="content" />
      <BooleanField source="published" />
      <DateField source="publishedAt" />
      <NumberField source="viewCount" />
      <DateField source="createdAt" />
      <EditButton />
    </Datagrid>
  </List>
);
```

**Edit** (`PostEdit.tsx`):

```tsx
export const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="content" multiline required />
      <BooleanInput source="published" />
      <DateTimeInput source="publishedAt" />
      <NumberInput source="viewCount" />
    </SimpleForm>
  </Edit>
);
```

**Create** (`PostCreate.tsx`):

```tsx
export const PostCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="content" multiline required />
      <BooleanInput source="published" />
      <DateTimeInput source="publishedAt" />
      <NumberInput source="viewCount" />
    </SimpleForm>
  </Create>
);
```

## Step 5: Test the API

Start your server:

```bash
npm run start:dev
```

### Create a Post

```bash
curl -X POST http://localhost:3000/tg-api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "published": true
  }'
```

### List Posts

```bash
curl http://localhost:3000/tg-api/posts?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
{
  "data": [
    {
      "id": "uuid-here",
      "title": "My First Post",
      "content": "This is the content...",
      "published": true,
      "publishedAt": null,
      "viewCount": 0,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Search Posts

```bash
curl "http://localhost:3000/tg-api/posts?search=first&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Single Post

```bash
curl http://localhost:3000/tg-api/posts/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Post

```bash
curl -X PUT http://localhost:3000/tg-api/posts/uuid-here \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "viewCount": 100
  }'
```

### Delete Post

```bash
curl -X DELETE http://localhost:3000/tg-api/posts/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 6: Test the Dashboard

Start your dashboard:

```bash
cd src/dashboard
npm run dev
```

Navigate to http://localhost:5173/posts

You can:

- View all posts in a table
- Search posts by title or content
- Sort by any column
- Click a row to edit
- Click "Create" to add a new post
- Click "Delete" to remove a post

## Step 7: Add Validation

Enhance your model with validation:

```prisma
// @tg_label(title)
// @tg_form()
model Post {
  id          String    @id @default(uuid())
  title       String    // @min(5) @max(200)
  content     String    // @min(20)
  published   Boolean   @default(false)
  publishedAt DateTime?
  viewCount   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

Regenerate:

```bash
tgraph dtos
```

Now the DTOs include validation:

```typescript
export class CreatePostTgDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @IsNotEmpty()
  title: string;

  @IsString()
  @MinLength(20)
  @IsNotEmpty()
  content: string;

  // ...
}
```

## Customization Examples

### Add Custom Endpoint

Create `post.service.ts`:

```typescript
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

  async incrementViewCount(id: string): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async getPublishedPosts(): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    });
  }
}
```

Create `post.controller.ts`:

```typescript
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

  @Put(':id/view')
  async incrementView(@Param('id') id: string) {
    return this.postService.incrementViewCount(id);
  }
}
```

Update `post.module.ts`:

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [PostTgController, PostController],
  providers: [PostTgService, PostService],
  exports: [PostService],
})
export class PostModule {}
```

### Customize Dashboard List

Create `PostListCustom.tsx`:

```tsx
export const PostListCustom = () => {
  const filters = [<TextInput source="q" label="Search" alwaysOn />, <BooleanInput source="published" />];

  return (
    <List filters={filters}>
      <Datagrid rowClick="edit">
        <TextField source="title" />
        <FunctionField label="Preview" render={(record: any) => record.content?.substring(0, 100) + '...'} />
        <BooleanField source="published" />
        <NumberField source="viewCount" />
        <DateField source="createdAt" showTime />
        <EditButton />
        <ShowButton />
      </Datagrid>
    </List>
  );
};
```

## Next Steps

- **[File Uploads](./file-uploads.md)** – Add image uploads
- **[Custom Validation](./custom-validation.md)** – Complex validation rules
- **[Extending Generated Code](./extending-generated-code.md)** – Advanced patterns
