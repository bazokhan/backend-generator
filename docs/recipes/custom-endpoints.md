---
title: Custom Endpoints
---

# Custom Endpoints Recipe

How to extend your generated API with custom endpoints for real-world use cases.

## Overview

TGraph generates standard CRUD endpoints. For custom business logic, create a plain NestJS controller or service that extends the generated one. Your custom code lives alongside the `.tg.` generated files and is never overwritten.

---

## Recipe 1: Extending the Generated Service

The cleanest pattern is to extend the generated service with custom methods:

```typescript
// src/features/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { UserAdminService } from './user.admin.service'; // generated

@Injectable()
export class UserService extends UserAdminService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async suspend(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { suspended: true },
    });
  }
}
```

---

## Recipe 2: Custom Controller Alongside Generated

Add a custom controller in the same module:

```typescript
// src/features/user/user.controller.ts
import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post(':id/suspend')
  async suspend(@Param('id') id: string) {
    return this.userService.suspend(id);
  }
}
```

Register it in the module alongside the generated controller:

```typescript
// src/features/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserAdminModule } from './user.admin.module'; // generated
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [UserAdminModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

---

## Recipe 3: Bulk Import Endpoint

```typescript
// src/features/user/user.controller.ts
import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(@UploadedFile() file: Express.Multer.File) {
    const records = parse(file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
    });

    const result = await this.prisma.user.createMany({
      data: records.map((r: any) => ({
        email: r.email,
        name: r.name,
        role: r.role || 'USER',
      })),
      skipDuplicates: true,
    });

    return { imported: result.count };
  }
}
```

---

## Recipe 4: External API Sync

```typescript
@Controller('api/developers')
@UseGuards(JwtAuthGuard)
export class DeveloperController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(':username/sync-github')
  async syncGithub(@Param('username') username: string) {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new NotFoundException('GitHub user not found');

    const data = await response.json();

    return this.prisma.developer.upsert({
      where: { githubUsername: username },
      create: {
        githubUsername: data.login,
        name: data.name,
        avatarUrl: data.avatar_url,
        followers: data.followers,
      },
      update: {
        name: data.name,
        avatarUrl: data.avatar_url,
        followers: data.followers,
        lastSyncedAt: new Date(),
      },
    });
  }
}
```

---

## Recipe 5: Promo Code Validation

```typescript
@Controller('api/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('validate-promo')
  async validatePromo(@Body() dto: { code: string; amount: number }) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!promo?.active) throw new BadRequestException('Invalid promo code');
    if (new Date() > promo.expiresAt) throw new BadRequestException('Promo code has expired');
    if (promo.usedCount >= promo.maxUses) throw new BadRequestException('Promo code exhausted');

    const discount = (dto.amount * promo.discount) / 100;
    return { discount, finalAmount: dto.amount - discount };
  }
}
```

---

## Best Practices

1. **Extend the generated service** rather than duplicating Prisma calls
2. **Keep custom controllers in their own file** (e.g., `user.controller.ts` vs generated `user.admin.controller.ts`)
3. **Register both in the same module** — the generated module and your custom one can coexist
4. **Custom files are never overwritten** — only `.tg.` files are regenerated

---

## Related

- [Extending Generated Code](./extending-generated-code.md) — patterns for wrapping generated services
- [Authentication Guards](../guides/authentication-guards.md) — securing your custom endpoints
- [Multiple APIs](./multiple-apis.md) — generating admin and public APIs
