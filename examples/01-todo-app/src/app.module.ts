import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/prisma.service';

// AUTO-GENERATED IMPORTS START
import { TodoModule } from './todo/todo.module';
// AUTO-GENERATED IMPORTS END

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
  imports: [
    // AUTO-GENERATED MODULES START
    TodoModule,
    // AUTO-GENERATED MODULES END
  ],
})
export class AppModule {}
