import type { UserConfig } from '@tgraph/backend-generator';

export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'admin-api',
  apiSuffix: 'Admin',
  authenticationEnabled: true,
  requireAdmin: true,
  guards: [{ name: 'JwtAuthGuard', importPath: '@/auth/jwt-auth.guard' }],
  adminGuards: [{ name: 'RolesGuard', importPath: '@/auth/roles.guard' }],
  dashboard: { root: 'src/dashboard/src' },
  nonInteractive: true,
};
