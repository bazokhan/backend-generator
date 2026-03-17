---
title: File Uploads
---

# File Upload Recipe

Implement image and file uploads with automatic upload handling in your forms.

## Goal

Create a product model with:

- Image thumbnail upload
- Multiple product images (gallery)
- PDF datasheet upload
- Automatic upload integration

## Step 1: Create Upload Endpoint

First, implement a file upload endpoint in your backend:

```typescript
// src/infrastructure/storage/upload.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
```

**Configure static file serving** in `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3000);
}
bootstrap();
```

## Step 2: Define the Model with Upload Directives

```prisma
// @tg_label(name)
// @tg_form()
model Product {
  id          String   @id @default(uuid())
  name        String   // @min(3) @max(200)
  description String
  /// @tg_upload(image)
  thumbnail   String?
  /// @tg_upload(image)
  images      String[]
  /// @tg_upload(file)
  datasheet   String?
  price       Float
  stock       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Key directives:

- `/// @tg_upload(image)` – Image upload with preview
- `/// @tg_upload(file)` – Generic file upload

## Step 3: Generate Code

```bash
tgraph all
```

## Step 4: What You Get

### Backend DTOs

The DTOs remain simple strings (they receive URLs after upload):

```typescript
// create-product.tg.dto.ts
export class CreateProductTgDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  datasheet?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsInt()
  @IsOptional()
  stock?: number;
}
```

### Dashboard Components

**Create Form** (`ProductCreate.tsx`):

```tsx
export const ProductCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline required />

      {/* Single image upload with preview */}
      <FileInput source="thumbnail" accept="image/*">
        <ImageField source="src" title="title" />
      </FileInput>

      {/* Multiple image upload */}
      <FileInput source="images" multiple accept="image/*">
        <ImageField source="src" title="title" />
      </FileInput>

      {/* Generic file upload */}
      <FileInput source="datasheet">
        <FileField source="src" title="title" />
      </FileInput>

      <NumberInput source="price" required />
      <NumberInput source="stock" />
    </SimpleForm>
  </Create>
);
```

**Edit Form** (`ProductEdit.tsx`):

```tsx
export const ProductEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline required />

      <FileInput source="thumbnail" accept="image/*">
        <ImageField source="src" title="title" />
      </FileInput>

      <FileInput source="images" multiple accept="image/*">
        <ImageField source="src" title="title" />
      </FileInput>

      <FileInput source="datasheet">
        <FileField source="src" title="title" />
      </FileInput>

      <NumberInput source="price" required />
      <NumberInput source="stock" />
    </SimpleForm>
  </Edit>
);
```

### Field Directives Metadata

The generator creates `fieldDirectives.generated.ts`:

```typescript
export const fieldDirectives = {
  products: {
    thumbnail: { tgUpload: 'image' },
    images: { tgUpload: 'image' },
    datasheet: { tgUpload: 'file' },
  },
};
```

## Step 5: How Upload Works

When a user submits a form with file inputs:

1. **User selects file** – Browser File object is added to form
2. **Form submission** – Data provider detects File objects
3. **Upload phase** – Each file is uploaded to `POST /upload`
4. **Response** – Upload endpoint returns `{ url: '/uploads/...' }`
5. **Field replacement** – File object is replaced with URL string
6. **API call** – Model API receives clean DTO with URL strings

**Data Provider Logic** (automatically generated):

```typescript
// Pseudo-code showing the process
const create = async (resource, { data }) => {
  // Detect upload fields
  const directives = fieldDirectives[resource] || {};

  for (const [field, directive] of Object.entries(directives)) {
    if (directive.tgUpload && data[field]) {
      if (data[field] instanceof File) {
        // Upload file
        const formData = new FormData();
        formData.append('file', data[field]);

        const response = await fetch('/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        // Replace File with URL
        data[field] = result.url;
      }
    }
  }

  // Now call the actual API with clean data
  return httpClient.post(`/tg-api/${resource}`, data);
};
```

## Step 6: Test the Upload

### From Dashboard

1. Navigate to `/products/create`
2. Fill in the form fields
3. Click "Choose file" for thumbnail
4. Select an image
5. See the preview appear
6. Click "Save"
7. The file uploads automatically and product is created

### Programmatically

**Upload file first:**

```bash
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

Response:

```json
{
  "url": "/uploads/file-1234567890.jpg",
  "filename": "file-1234567890.jpg",
  "mimetype": "image/jpeg",
  "size": 102400
}
```

**Create product with URL:**

```bash
curl -X POST http://localhost:3000/tg-api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Premium Widget",
    "description": "High-quality widget",
    "thumbnail": "/uploads/file-1234567890.jpg",
    "price": 99.99,
    "stock": 100
  }'
```

## Advanced Patterns

### S3 Upload

Use AWS S3 for production uploads:

```typescript
// upload.controller.ts
import { S3 } from 'aws-sdk';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION,
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const key = `uploads/${Date.now()}-${file.originalname}`;

    await this.s3
      .putObject({
        Bucket: process.env.AWS_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
      .promise();

    const url = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      url,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
```

### Image Processing

Add image processing with Sharp:

```typescript
import * as sharp from 'sharp';

@Post()
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Process image
  const processed = await sharp(file.buffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 90 })
    .toBuffer();

  // Generate thumbnail
  const thumbnail = await sharp(file.buffer)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Save both versions
  const timestamp = Date.now();
  const mainPath = `uploads/${timestamp}-main.jpg`;
  const thumbPath = `uploads/${timestamp}-thumb.jpg`;

  await fs.promises.writeFile(mainPath, processed);
  await fs.promises.writeFile(thumbPath, thumbnail);

  return {
    url: `/${mainPath}`,
    thumbnail: `/${thumbPath}`,
    mimetype: 'image/jpeg',
    size: processed.length,
  };
}
```

### File Validation

Add custom validation:

```typescript
@Post()
@UseInterceptors(
  FileInterceptor('file', {
    fileFilter: (req, file, callback) => {
      // Only allow images
      if (!file.mimetype.match(/^image\//)) {
        return callback(new Error('Only image files are allowed'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }),
)
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Upload logic
}
```

### Multiple File Types

Create specialized endpoints:

```typescript
@Post('image')
@UseInterceptors(
  FileInterceptor('file', {
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }),
)
async uploadImage(@UploadedFile() file: Express.Multer.File) {
  // Image-specific processing
}

@Post('document')
@UseInterceptors(
  FileInterceptor('file', {
    fileFilter: documentFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  }),
)
async uploadDocument(@UploadedFile() file: Express.Multer.File) {
  // Document-specific processing
}
```

### Custom Upload Component

Create a custom upload component with drag-and-drop:

```tsx
// ProductImageUpload.tsx
import { useInput } from 'react-admin';
import { useDropzone } from 'react-dropzone';

export const ProductImageUpload = ({ source }: { source: string }) => {
  const { field } = useInput({ source });

  const onDrop = (acceptedFiles: File[]) => {
    field.onChange(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      style={% raw %}{{
        border: '2px dashed #ccc',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
      }}{% endraw %}
    >
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the image here...</p> : <p>Drag and drop an image, or click to select</p>}
      {field.value && (
        <img
          src={typeof field.value === 'string' ? field.value : URL.createObjectURL(field.value)}
          alt="Preview"
          style={% raw %}{{ maxWidth: '200px', marginTop: '10px' }}{% endraw %}
        />
      )}
    </div>
  );
};

// Use in form
<ProductImageUpload source="thumbnail" />;
```

## Best Practices

### 1. Always Validate File Types

```typescript
fileFilter: (req, file, callback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedMimes.includes(file.mimetype)) {
    return callback(new Error('Invalid file type'), false);
  }
  callback(null, true);
};
```

### 2. Set Size Limits

```typescript
limits: {
  fileSize: 5 * 1024 * 1024, // 5MB for images
  fileSize: 10 * 1024 * 1024, // 10MB for documents
}
```

### 3. Use Unique Filenames

```typescript
filename: (req, file, callback) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  callback(null, uniqueSuffix + extname(file.originalname));
};
```

### 4. Clean Up Old Files

Implement cleanup when updating/deleting:

```typescript
async update(id: string, dto: UpdateProductTgDto): Promise<Product> {
  const product = await this.findOne(id);

  // If thumbnail changed, delete old one
  if (dto.thumbnail && product.thumbnail !== dto.thumbnail) {
    await this.deleteFile(product.thumbnail);
  }

  return super.update(id, dto);
}

private async deleteFile(url: string): Promise<void> {
  const filePath = join(__dirname, '..', '..', url);
  await fs.promises.unlink(filePath).catch(() => {});
}
```

### 5. Secure Upload Endpoint

```typescript
@Controller('upload')
@UseGuards(JwtAuthGuard) // Require authentication
export class UploadController {
  // Only authenticated users can upload
}
```

## Troubleshooting

### Upload Returns 404

**Problem:** `POST /upload` returns 404.

**Solution:** Ensure `UploadController` is registered in a module:

```typescript
@Module({
  controllers: [UploadController],
})
export class StorageModule {}
```

### File Too Large Error

**Problem:** Upload fails with "File too large" error.

**Solution:** Increase limit in `FileInterceptor`:

```typescript
limits: {
  fileSize: 10 * 1024 * 1024, // 10MB
}
```

### Preview Not Showing

**Problem:** Image preview doesn't appear in form.

**Solution:** Ensure `fieldDirectives.generated.ts` includes your field and regenerate:

```bash
tgraph dashboard
```

## Next Steps

- **[Custom Validation](./custom-validation.md)** – Validate uploaded files
- **[Extending Generated Code](./extending-generated-code.md)** – Add custom upload logic
- **[Field Directives Guide](../guides/field-directives.md)** – Learn all directives
