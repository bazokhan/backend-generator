import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/prisma.service';

// AUTO-GENERATED IMPORTS START
// AUTO-GENERATED IMPORTS END

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
  // AUTO-GENERATED MODULE IMPORTS START
  imports: [],
  // AUTO-GENERATED MODULE IMPORTS END
})
export class AppModule {}
