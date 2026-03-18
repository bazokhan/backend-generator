import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from './infrastructure/database/prisma.service';
import { AuthModule } from './auth/auth.module';

// AUTO-GENERATED IMPORTS START
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { OrderItemModule } from './order-item/orderItem.module';
// AUTO-GENERATED IMPORTS END

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    // AUTO-GENERATED MODULES START
    UserModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    OrderItemModule,
    // AUTO-GENERATED MODULES END
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
