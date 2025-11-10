---
layout: default
title: Custom Endpoints
parent: Recipes
nav_order: 5
---

# Custom Endpoints Recipe

Practical examples of creating custom endpoints using adapters.

## Goal

Learn how to extend your generated API with custom endpoints for real-world use cases:

1. **Image upload with transformation**
2. **Webhook receiver**
3. **Bulk import endpoint**
4. **External API proxy**
5. **Custom validation endpoint**

---

## Recipe 1: Image Upload with Transformation

### Use Case

Upload a product image, resize it, upload to storage, and create the product in one request.

### Prisma Schema

```prisma
// @tg_form()
model Product {
  id          String   @id @default(uuid())
  name        String
  description String
  imageUrl    String?
  thumbnailUrl String?
  price       Float
  createdAt   DateTime @default(now())
}
```

### Step 1: Install Dependencies

```bash
npm install sharp minio
```

### Step 2: Create Upload Helper

```typescript
// src/adapters/helpers.ts
import { Minio } from 'minio';
import sharp from 'sharp';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

helpers.upload.minio = async (file: Express.Multer.File, bucket: string = 'products') => {
  const filename = `${helpers.uuid()}-${file.originalname}`;

  // Upload original
  await minioClient.putObject(bucket, filename, file.buffer, file.size, {
    'Content-Type': file.mimetype,
  });

  return `https://${process.env.MINIO_ENDPOINT}/${bucket}/${filename}`;
};

helpers.upload.thumbnail = async (file: Express.Multer.File, bucket: string = 'products') => {
  const filename = `thumb-${helpers.uuid()}.webp`;

  // Resize to thumbnail
  const thumbnail = await sharp(file.buffer).resize(200, 200, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();

  await minioClient.putObject(bucket, filename, thumbnail, thumbnail.length, {
    'Content-Type': 'image/webp',
  });

  return `https://${process.env.MINIO_ENDPOINT}/${bucket}/${filename}`;
};
```

### Step 3: Create Adapter

```typescript
// src/features/product/adapters/create-with-image.adapter.ts
import { adapter } from '@/adapters/runtime';

export default adapter.multipart(
  {
    method: 'POST',
    path: '/with-image',
    target: 'ProductService.create',
    auth: 'JwtAuthGuard',
    summary: 'Create product with image upload',
    description: 'Upload product image, generate thumbnail, and create product',
  },
  async (ctx) => {
    const { body, files, helpers } = ctx;

    // Validate
    helpers.assert(files, 'Image file is required');
    helpers.assert(body.name, 'Product name is required');
    helpers.assert(body.price, 'Price is required');

    const file = Array.isArray(files) ? files[0] : files;

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    helpers.assert(allowedTypes.includes(file.mimetype), 'Only JPEG, PNG, and WebP images are allowed');

    // Upload full image and thumbnail in parallel
    const [imageUrl, thumbnailUrl] = await Promise.all([
      helpers.upload.minio(file, 'products'),
      helpers.upload.thumbnail(file, 'products'),
    ]);

    return {
      args: {
        name: body.name,
        description: body.description || '',
        price: parseFloat(body.price),
        imageUrl,
        thumbnailUrl,
      },
    };
  },
);
```

### Step 4: Test

```bash
curl -X POST http://localhost:3000/tg-api/products/with-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Premium Widget" \
  -F "description=High quality product" \
  -F "price=99.99" \
  -F "file=@/path/to/image.jpg"
```

---

## Recipe 2: Webhook Receiver

### Use Case

Receive and process Stripe webhooks for payment updates.

### Prisma Schema

```prisma
// @tg_form()
model Order {
  id            String   @id @default(uuid())
  userId        String
  amount        Float
  status        String   // pending, paid, failed
  stripePaymentId String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}
```

### Step 1: Create Webhook Adapter

```typescript
// src/features/order/adapters/stripe-webhook.adapter.ts
import { adapter } from '@/adapters/runtime';
import Stripe from 'stripe';
import { BadRequestException } from '@nestjs/common';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default adapter.json(
  {
    method: 'POST',
    path: '/webhook/stripe',
    // No auth - Stripe signature verification instead
    summary: 'Stripe webhook receiver',
    description: 'Processes Stripe payment events',
  },
  async (ctx) => {
    const { body, headers, di } = ctx;

    // Verify Stripe signature
    const signature = headers['stripe-signature'];
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        JSON.stringify(body),
        signature as string,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update order status
        await di.prisma.order.update({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'paid' },
        });

        console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update order status
        await di.prisma.order.update({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'failed' },
        });

        console.log(`❌ Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return adapter.response(200, { received: true });
  },
);
```

### Step 2: Register Webhook in Stripe

```bash
stripe listen --forward-to http://localhost:3000/tg-api/orders/webhook/stripe
```

### Step 3: Test

```bash
stripe trigger payment_intent.succeeded
```

---

## Recipe 3: Bulk Import Endpoint

### Use Case

Import multiple users from a CSV file.

### Prisma Schema

```prisma
// @tg_form()
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      String   @default("user")
  createdAt DateTime @default(now())
}
```

### Step 1: Install CSV Parser

```bash
npm install csv-parse
```

### Step 2: Create Bulk Import Adapter

```typescript
// src/features/user/adapters/bulk-import.adapter.ts
import { adapter } from '@/adapters/runtime';
import { parse } from 'csv-parse/sync';
import { BadRequestException } from '@nestjs/common';

export default adapter.multipart(
  {
    method: 'POST',
    path: '/bulk-import',
    auth: ['JwtAuthGuard', 'AdminGuard'],
    summary: 'Bulk import users from CSV',
    description: 'Upload CSV file with user data (email, name, role)',
  },
  async (ctx) => {
    const { files, helpers, di } = ctx;

    helpers.assert(files, 'CSV file is required');

    const file = Array.isArray(files) ? files[0] : files;

    // Validate CSV file
    helpers.assert(file.mimetype === 'text/csv' || helpers.ext(file.originalname) === 'csv', 'File must be a CSV');

    // Parse CSV
    const csvContent = file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    helpers.assert(records.length > 0, 'CSV file is empty');
    helpers.assert(records.length <= 1000, 'Maximum 1000 users per import');

    // Validate required columns
    const requiredColumns = ['email', 'name'];
    const firstRecord = records[0];
    for (const col of requiredColumns) {
      helpers.assert(col in firstRecord, `Missing required column: ${col}`);
    }

    // Prepare user data
    const users = records.map((record: any, index: number) => {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(record.email)) {
        throw new BadRequestException(`Invalid email at row ${index + 2}: ${record.email}`);
      }

      return {
        email: record.email.toLowerCase().trim(),
        name: record.name.trim(),
        role: record.role || 'user',
        id: helpers.uuid(),
      };
    });

    // Check for duplicate emails in CSV
    const emails = users.map((u) => u.email);
    const duplicates = emails.filter((e, i) => emails.indexOf(e) !== i);
    helpers.assert(duplicates.length === 0, `Duplicate emails in CSV: ${duplicates.join(', ')}`);

    // Check for existing emails in database
    const existing = await di.prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });

    if (existing.length > 0) {
      const existingEmails = existing.map((u) => u.email).join(', ');
      throw new BadRequestException(`These emails already exist: ${existingEmails}`);
    }

    // Bulk insert
    const result = await di.prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    return adapter.response(201, {
      success: true,
      imported: result.count,
      total: records.length,
    });
  },
);
```

### Step 3: Test

Create test CSV file (`users.csv`):

```csv
email,name,role
john@example.com,John Doe,user
jane@example.com,Jane Smith,admin
bob@example.com,Bob Johnson,user
```

Upload:

```bash
curl -X POST http://localhost:3000/tg-api/users/bulk-import \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "file=@users.csv"
```

---

## Recipe 4: External API Proxy

### Use Case

Fetch GitHub user data and sync to local database.

### Prisma Schema

```prisma
// @tg_form()
model Developer {
  id            String   @id @default(uuid())
  githubUsername String  @unique
  githubId      Int?
  name          String?
  bio           String?
  avatarUrl     String?
  followers     Int      @default(0)
  repos         Int      @default(0)
  lastSyncedAt  DateTime?
  createdAt     DateTime @default(now())
}
```

### Step 1: Create GitHub Sync Adapter

```typescript
// src/features/developer/adapters/sync-github.adapter.ts
import { adapter } from '@/adapters/runtime';
import { NotFoundException } from '@nestjs/common';

export default adapter.json(
  {
    method: 'POST',
    path: '/sync-github',
    auth: 'JwtAuthGuard',
    summary: 'Sync developer from GitHub',
    description: 'Fetch GitHub user data and create/update developer profile',
  },
  async (ctx) => {
    const { body, helpers, di } = ctx;

    helpers.assert(body.githubUsername, 'GitHub username is required');

    // Fetch from GitHub API
    const response = await fetch(`https://api.github.com/users/${body.githubUsername}`, {
      headers: {
        'User-Agent': 'TGraph-App',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundException(`GitHub user not found: ${body.githubUsername}`);
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const githubData = await response.json();

    // Check if developer exists
    const existing = await di.prisma.developer.findUnique({
      where: { githubUsername: body.githubUsername },
    });

    const data = {
      githubUsername: githubData.login,
      githubId: githubData.id,
      name: githubData.name || githubData.login,
      bio: githubData.bio,
      avatarUrl: githubData.avatar_url,
      followers: githubData.followers,
      repos: githubData.public_repos,
      lastSyncedAt: new Date(),
    };

    if (existing) {
      // Update existing
      const updated = await di.prisma.developer.update({
        where: { id: existing.id },
        data,
      });

      return adapter.response(200, {
        data: updated,
        message: 'Developer profile updated',
      });
    } else {
      // Create new
      const created = await di.prisma.developer.create({
        data: { id: helpers.uuid(), ...data },
      });

      return adapter.response(201, {
        data: created,
        message: 'Developer profile created',
      });
    }
  },
);
```

### Step 2: Test

```bash
curl -X POST http://localhost:3000/tg-api/developers/sync-github \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"githubUsername": "torvalds"}'
```

---

## Recipe 5: Custom Validation Endpoint

### Use Case

Validate promo code before creating an order.

### Prisma Schema

```prisma
// @tg_form()
model PromoCode {
  id          String   @id @default(uuid())
  code        String   @unique
  discount    Float    // percentage 0-100
  maxUses     Int
  usedCount   Int      @default(0)
  expiresAt   DateTime
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// @tg_form()
model Order {
  id           String   @id @default(uuid())
  userId       String
  amount       Float
  discount     Float    @default(0)
  promoCodeId  String?
  createdAt    DateTime @default(now())

  user      User      @relation(fields: [userId], references: [id])
  promoCode PromoCode? @relation(fields: [promoCodeId], references: [id])
}
```

### Step 1: Create Validation Adapter

```typescript
// src/features/order/adapters/create-with-promo.adapter.ts
import { adapter } from '@/adapters/runtime';
import { BadRequestException } from '@nestjs/common';

export default adapter.json(
  {
    method: 'POST',
    path: '/with-promo',
    target: 'OrderService.create',
    auth: 'JwtAuthGuard',
    summary: 'Create order with promo code',
    description: 'Validate promo code and apply discount',
  },
  async (ctx) => {
    const { body, user, helpers, di } = ctx;

    helpers.assert(body.amount, 'Amount is required');
    helpers.assert(body.amount > 0, 'Amount must be positive');

    let discount = 0;
    let promoCodeId = null;

    // Validate promo code if provided
    if (body.promoCode) {
      const promoCode = await di.prisma.promoCode.findUnique({
        where: { code: body.promoCode.toUpperCase() },
      });

      // Validation checks
      if (!promoCode) {
        throw new BadRequestException('Invalid promo code');
      }

      if (!promoCode.active) {
        throw new BadRequestException('Promo code is no longer active');
      }

      if (new Date() > new Date(promoCode.expiresAt)) {
        throw new BadRequestException('Promo code has expired');
      }

      if (promoCode.usedCount >= promoCode.maxUses) {
        throw new BadRequestException('Promo code has reached its usage limit');
      }

      // Calculate discount
      discount = (body.amount * promoCode.discount) / 100;
      promoCodeId = promoCode.id;

      // Increment usage count
      await di.prisma.promoCode.update({
        where: { id: promoCode.id },
        data: { usedCount: promoCode.usedCount + 1 },
      });
    }

    const finalAmount = body.amount - discount;

    return {
      args: {
        userId: user.id,
        amount: finalAmount,
        discount,
        promoCodeId,
      },
    };
  },
);
```

### Step 2: Test

```bash
# Without promo code
curl -X POST http://localhost:3000/tg-api/orders/with-promo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 100}'

# With promo code
curl -X POST http://localhost:3000/tg-api/orders/with-promo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 100, "promoCode": "SAVE20"}'
```

---

## Advanced: Combining Multiple Patterns

### Use Case

Create a product with image upload, external API sync, and validation.

```typescript
// src/features/product/adapters/create-advanced.adapter.ts
import { adapter } from '@/adapters/runtime';
import { BadRequestException } from '@nestjs/common';

export default adapter.multipart(
  {
    method: 'POST',
    path: '/advanced',
    target: 'ProductService.create',
    auth: ['JwtAuthGuard', 'AdminGuard'],
    summary: 'Advanced product creation',
    description: 'Upload image, validate with external API, and create product',
  },
  async (ctx) => {
    const { body, files, helpers, di } = ctx;

    // 1. Validate inputs
    helpers.assert(body.name, 'Product name is required');
    helpers.assert(body.price, 'Price is required');
    helpers.assert(files, 'Product image is required');

    const price = parseFloat(body.price);
    helpers.assert(price > 0, 'Price must be positive');

    // 2. Check for duplicate product name
    const existing = await di.prisma.product.findFirst({
      where: { name: body.name },
    });

    if (existing) {
      throw new BadRequestException(`Product "${body.name}" already exists`);
    }

    // 3. Validate with external pricing API
    const pricingResponse = await fetch('https://api.example.com/validate-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: body.category, price }),
    });

    if (!pricingResponse.ok) {
      throw new BadRequestException('Price validation failed');
    }

    const pricingData = await pricingResponse.json();
    if (!pricingData.valid) {
      throw new BadRequestException(
        `Invalid price for category. Suggested range: $${pricingData.min}-$${pricingData.max}`,
      );
    }

    // 4. Upload and process image
    const file = Array.isArray(files) ? files[0] : files;
    const [imageUrl, thumbnailUrl] = await Promise.all([
      helpers.upload.minio(file, 'products'),
      helpers.upload.thumbnail(file, 'products'),
    ]);

    // 5. Generate slug
    const slug = helpers.slugify(body.name);

    return {
      args: {
        name: body.name,
        slug,
        description: body.description || '',
        category: body.category,
        price,
        imageUrl,
        thumbnailUrl,
      },
    };
  },
);
```

---

## Next Steps

- [Custom Adapters Guide](../guides/custom-adapters.md) - Comprehensive usage guide
- [Adapters API Reference](../api/adapters.md) - Complete API documentation
- [Authentication Guards](../guides/authentication-guards.md) - Securing your adapters
