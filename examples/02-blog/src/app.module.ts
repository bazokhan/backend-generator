import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from './infrastructure/database/prisma.service';
import { AuthModule } from './auth/auth.module';

// AUTO-GENERATED IMPORTS START
// AUTO-GENERATED IMPORTS END

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    // AUTO-GENERATED MODULE IMPORTS START
    // AUTO-GENERATED MODULE IMPORTS END
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
