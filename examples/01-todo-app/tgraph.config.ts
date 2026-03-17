import type { UserConfig } from '@tgraph/backend-generator';

export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  apiPrefix: 'api',
  apiSuffix: '',
  authenticationEnabled: false,
  requireAdmin: false,
  guards: [],
  dashboard: false,
  nonInteractive: true,
};
