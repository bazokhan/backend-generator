import type { UserConfig } from '@tgraph/backend-generator';

export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'tg-api',
  apiSuffix: 'Admin',
  authenticationEnabled: true,
  requireAdmin: false,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  dashboard: { root: 'src/dashboard/src' },
  nonInteractive: true,
};
