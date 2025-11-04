import type { GeneratorOptions } from '@tg-scripts/types';

export const defaultStaticGeneratorOptions: GeneratorOptions = {
  rolesEnumName: 'Role',
  prismaGeneratedPath: '@/generated/prisma',
  adminRole: 'ADMIN',
  adminGuardPath: '@/guards/admin.guard',
  isAdminDecoratorPath: '@/decorators/is-admin.decorator',
  guards: [
    {
      name: 'JwtAuthGuard',
      path: '@/guards/jwt-auth.guard',
    },
    {
      name: 'AdminGuard',
      path: '@/guards/admin.guard',
    },
  ],
  dtoPath: '@/dtos/paginated-search-result.dto',
  defaultLimit: 10,
  defaultPage: 1,
  interceptorPath: '@/interceptors/pagiantion.interceptor',
  decoratorPath: '@/decorators/paginated-search.decorator',
  queryDtoPath: '@/dtos/paginated-search-query.dto',
  apiResponseDtoPath: '@/dtos/api-response.dto',
};
