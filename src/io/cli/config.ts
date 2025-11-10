import type { Config, Guard, ComponentOverrides } from '../../types';

/**
 * Supported configuration entry with metadata for validation and generation
 */
export interface SupportedConfigEntry {
  name: string;
  type: 'string' | 'string[]' | 'boolean' | 'object' | 'Guard[]';
  description: string;
  comment?: string; // Multi-line comment for config template generation
  required: boolean;
  section: string;
  fullPath: string;
  defaultValue: any;
  example: any;
  suggestion?: string; // Helpful suggestion for validation errors
}

// Extract all possible config paths from the Config interface
type ConfigPaths =
  | 'input.prisma.schemaPath'
  | 'input.prisma.servicePath'
  | 'input.dashboard.components'
  | 'output.backend.root'
  | 'output.backend.dtosPath'
  | 'output.backend.modulesPaths'
  | 'output.backend.guardsPath'
  | 'output.backend.decoratorsPath'
  | 'output.backend.interceptorsPath'
  | 'output.backend.utilsPath'
  | 'output.backend.appModulePath'
  | 'output.dashboard.enabled'
  | 'output.dashboard.updateDataProvider'
  | 'output.dashboard.root'
  | 'output.dashboard.appComponentPath'
  | 'output.dashboard.resourcesPath'
  | 'output.dashboard.swaggerJsonPath'
  | 'output.dashboard.apiPath'
  | 'output.dashboard.dataProviderPath'
  | 'api.suffix'
  | 'api.prefix'
  | 'api.authenticationEnabled'
  | 'api.requireAdmin'
  | 'api.guards'
  | 'api.adminGuards'
  | 'behavior.nonInteractive';

// Type to ensure supportedConfigs covers all paths
type SupportedConfigsArray = ReadonlyArray<SupportedConfigEntry & { fullPath: ConfigPaths }>;

export const supportedConfigs: SupportedConfigsArray = [
  /** PRISMA INPUT */
  {
    name: 'prismaSchemaPath',
    type: 'string',
    description: 'Path to the Prisma schema file to be parsed and used as input for the generator',
    comment: 'Path to your Prisma schema file',
    required: true,
    section: 'input.prisma',
    fullPath: 'input.prisma.schemaPath',
    defaultValue: 'prisma/schema.prisma',
    example: 'prisma/schema.prisma',
    suggestion: "Set 'input.prisma.schemaPath' in your configuration file. Run 'npx prisma init' to create a schema.",
  },
  {
    name: 'prismaServicePath',
    type: 'string',
    description: 'Path to the PrismaService file to be used for generating correct imports',
    comment: 'Path to your PrismaService file (used for generating correct imports)',
    required: true,
    section: 'input.prisma',
    fullPath: 'input.prisma.servicePath',
    defaultValue: 'src/infrastructure/database/prisma.service.ts',
    example: 'src/modules/database/prisma.service.ts',
    suggestion:
      "Set 'input.prisma.servicePath' to the path of your PrismaService file (e.g., 'src/infrastructure/database/prisma.service.ts')",
  },

  /** DASHBOARD INPUT */
  {
    name: 'dashboardComponents',
    type: 'object',
    description:
      'Override React Admin components, paths to files to be used for the components (to generate correct imports)',
    comment: 'Override default React Admin components',
    required: false,
    section: 'input.dashboard',
    fullPath: 'input.dashboard.components',
    defaultValue: { form: {}, display: {} },
    example: { form: {}, display: {} },
    suggestion: 'Provide component defaults, even if they are empty objects: { form: {}, display: {} }',
  },

  /** BACKEND OUTPUT */
  {
    name: 'backendRootPath',
    type: 'string',
    description: 'Path to the root directory where the generated backend will be stored',
    comment: 'Default directory for creating new modules',
    required: true,
    section: 'output.backend',
    fullPath: 'output.backend.root',
    defaultValue: 'src/features',
    example: 'src/features',
    suggestion: 'Set a directory where new modules should be created (e.g., src/features)',
  },
  {
    name: 'backendAppModulePath',
    type: 'string',
    description: 'Path to the AppModule file to be used for generating correct imports',
    comment: 'NestJS root module (auto-discovered if not specified)',
    required: false,
    section: 'output.backend',
    fullPath: 'output.backend.appModulePath',
    defaultValue: (values: { backendRootPath: string }) => `${values.backendRootPath}/app.module.ts`,
    example: 'src/app.module.ts',
    suggestion: 'Override auto-discovery by specifying the path to app.module.ts',
  },
  {
    name: 'backendModulesPaths',
    type: 'string[]',
    description: 'The paths for the generated modules (search to update or use the first one to generate new modules)',
    comment: 'Directories to search for existing modules (in order of priority)',
    required: false,
    section: 'output.backend',
    fullPath: 'output.backend.modulesPaths',
    defaultValue: (values: { backendRootPath: string }) => [
      `${values.backendRootPath}/features`,
      `${values.backendRootPath}/modules`,
      values.backendRootPath,
    ],
    example: ['src/features', 'src/modules', 'src'],
    suggestion:
      "Provide at least one directory where existing NestJS modules can be discovered. Example: ['src/features', 'src/modules', 'src']",
  },
  {
    name: 'backendDtosPath',
    type: 'string',
    description: 'Path to the directory where the generated DTOs will be stored',
    comment: 'Where to generate DTOs',
    required: false,
    section: 'output.backend',
    fullPath: 'output.backend.dtosPath',
    defaultValue: (values: { backendRootPath: string }) => `${values.backendRootPath}/dtos/generated`,
    example: 'src/dtos/generated',
    suggestion: "Set 'output.backend.dtosPath' to the directory where DTOs should be generated",
  },
  {
    name: 'backendGuardsPath',
    type: 'string',
    description: 'Path to the directory where the generated guards will be stored',
    comment: 'Guards directory',
    required: false,
    section: 'output.backend',
    fullPath: 'output.backend.guardsPath',
    defaultValue: (values: { backendRootPath: string }) => `${values.backendRootPath}/guards`,
    example: 'src/guards',
    suggestion: "Set 'output.backend.guardsPath' to the directory for guard files (e.g., 'src/guards')",
  },
  {
    name: 'backendDecoratorsPath',
    type: 'string',
    description: 'Path to the directory where the generated decorators will be stored',
    comment: 'Decorators directory',
    required: false,
    section: 'output.backend',
    fullPath: 'output.backend.decoratorsPath',
    defaultValue: (values: { backendRootPath: string }) => `${values.backendRootPath}/decorators`,
    example: 'src/decorators',
    suggestion: "Set 'output.backend.decoratorsPath' to the directory for decorator files (e.g., 'src/decorators')",
  },
  {
    name: 'backendInterceptorsPath',
    type: 'string',
    description: 'Path to the directory where the generated interceptors will be stored',
    comment: 'Interceptors directory',
    required: false,
    section: 'output.backend',
    fullPath: 'output.backend.interceptorsPath',
    defaultValue: (values: { backendRootPath: string }) => `${values.backendRootPath}/interceptors`,
    example: 'src/interceptors',
    suggestion:
      "Set 'output.backend.interceptorsPath' to the directory for interceptor files (e.g., 'src/interceptors')",
  },
  {
    name: 'backendUtilsPath',
    type: 'string',
    description: 'Path to the directory where the generated utils will be stored',
    comment: 'Utils directory',
    required: false,
    section: 'output.backend',
    fullPath: 'output.backend.utilsPath',
    defaultValue: (values: { backendRootPath: string }) => `${values.backendRootPath}/utils`,
    example: 'src/utils',
    suggestion: "Set 'output.backend.utilsPath' to the directory for utility files (e.g., 'src/utils')",
  },

  /** DASHBOARD OUTPUT */
  {
    name: 'dashboardEnabled',
    type: 'boolean',
    description: 'Whether to generate the dashboard',
    comment: 'Whether to generate dashboard resources',
    required: false,
    section: 'output.dashboard',
    fullPath: 'output.dashboard.enabled',
    defaultValue: true,
    example: true,
    suggestion: 'Enable dashboard generation to create React Admin resources',
  },
  {
    name: 'dashboardRootPath',
    type: 'string',
    description: 'Path to the root directory where the generated dashboard will be stored',
    comment: 'Root directory of your React Admin dashboard',
    required: true,
    section: 'output.dashboard',
    fullPath: 'output.dashboard.root',
    defaultValue: 'src/dashboard/src',
    example: 'src/dashboard/src',
    suggestion: 'Set the root of your React Admin dashboard',
  },
  {
    name: 'dashboarAppComponentPath',
    type: 'string',
    description: 'Path to the App component file to be used for generating correct imports',
    comment: 'React Admin App component (auto-discovered if not specified)',
    required: false,
    section: 'output.dashboard',
    fullPath: 'output.dashboard.appComponentPath',
    defaultValue: (values: { dashboardRootPath: string }) => `${values.dashboardRootPath}/App.tsx`,
    example: 'src/dashboard/src/App.tsx',
    suggestion: 'Override auto-discovery by specifying the path to App.tsx',
  },
  {
    name: 'dashboardResourcesPath',
    type: 'string',
    description: 'Path to the directory where the generated dashboard resources will be stored',
    comment: 'Where to generate dashboard resource folders',
    required: false,
    section: 'output.dashboard',
    fullPath: 'output.dashboard.resourcesPath',
    defaultValue: (values: { dashboardRootPath: string }) => `${values.dashboardRootPath}/resources`,
    example: 'src/dashboard/src/resources',
    suggestion: 'Set the directory where dashboard resources should be generated',
  },
  {
    name: 'dashboardSwaggerJsonPath',
    type: 'string',
    description: 'Path to output the generated swagger.json file',
    comment: 'Path to the swagger.json file relative to project root',
    required: false,
    section: 'output.dashboard',
    fullPath: 'output.dashboard.swaggerJsonPath',
    defaultValue: (values: { dashboardRootPath: string }) => `${values.dashboardRootPath}/types/swagger.json`,
    example: 'src/dashboard/src/types/swagger.json',
    suggestion: 'Specify the path where swagger.json should be generated',
  },
  {
    name: 'dashboardApiPath',
    type: 'string',
    description: 'Path to output the generated api.ts file',
    comment: 'Path to the generated api.ts file relative to project root',
    required: false,
    section: 'output.dashboard',
    fullPath: 'output.dashboard.apiPath',
    defaultValue: (values: { dashboardRootPath: string }) => `${values.dashboardRootPath}/types/api.ts`,
    example: 'src/dashboard/src/types/api.ts',
    suggestion: 'Specify the path where api.ts types should be generated',
  },
  {
    name: 'dashboardDataProvider',
    type: 'string',
    description: 'Path to the data provider file to be used for generating correct imports',
    comment: 'React Admin data provider file (auto-discovered if not specified)',
    required: false,
    section: 'output.dashboard',
    fullPath: 'output.dashboard.dataProviderPath',
    defaultValue: (values: { dashboardRootPath: string }) => `${values.dashboardRootPath}/providers/dataProvider.ts`,
    example: 'src/dashboard/src/providers/dataProvider.ts',
    suggestion: 'Override auto-discovery by specifying the path to dataProvider.ts',
  },
  {
    name: 'dashboardUpdateDataProvider',
    type: 'boolean',
    description: 'Whether to update the data provider with new endpoint mappings',
    comment: 'Automatically update data provider with new endpoint mappings',
    required: false,
    section: 'output.dashboard',
    fullPath: 'output.dashboard.updateDataProvider',
    defaultValue: true,
    example: true,
    suggestion: 'Enable to automatically update endpoint mappings in dataProvider',
  },

  /** API OUTPUT - This section is used both for backend and dashboard */
  {
    name: 'apiSuffix',
    type: 'string',
    description: 'Suffix for the generated API classes',
    comment:
      'Suffix for generated classes (e.g., "Admin" -> UserAdminService)\n    Use different suffixes for different APIs (e.g., "Admin", "Public")',
    required: false,
    section: 'api',
    fullPath: 'api.suffix',
    defaultValue: '',
    example: 'Admin',
    suggestion:
      "Set 'api.suffix' to control generated class names (use '' for none or a PascalCase value like 'Admin')",
  },
  {
    name: 'apiPrefix',
    type: 'string',
    description: 'API route prefix',
    comment: 'API route prefix (e.g., "tg-api" -> /tg-api/users)\n    Use different prefixes to separate multiple APIs',
    required: false,
    section: 'api',
    fullPath: 'api.prefix',
    defaultValue: 'tg-api',
    example: 'tg-api',
    suggestion: 'Set the route prefix used for generated controllers (e.g., tg-api)',
  },
  {
    name: 'apiAuthenticationEnabled',
    type: 'boolean',
    description: 'Whether to add authentication guards to generated controllers',
    comment: 'Whether to add authentication guards to generated controllers',
    required: false,
    section: 'api',
    fullPath: 'api.authenticationEnabled',
    defaultValue: true,
    example: true,
    suggestion: 'Enable authentication to add guards to generated controllers',
  },
  {
    name: 'apiRequireAdmin',
    type: 'boolean',
    description: 'Whether endpoints require admin role',
    comment: 'Whether endpoints require admin role (affects guard configuration)',
    required: false,
    section: 'api',
    fullPath: 'api.requireAdmin',
    defaultValue: true,
    example: true,
    suggestion: 'Set to true to require admin role for all generated endpoints',
  },
  {
    name: 'apiGuards',
    type: 'Guard[]',
    description: 'Guards to apply to generated controllers',
    comment: 'List of guards to apply to controllers\n    When authentication.enabled is true, these guards are added',
    required: false,
    section: 'api',
    fullPath: 'api.guards',
    defaultValue: [],
    example: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }],
    suggestion:
      "Define guards to be applied to generated controllers. Example: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }]",
  },
  {
    name: 'apiAdminGuards',
    type: 'Guard[]',
    description: 'Additional guards for admin-only endpoints',
    comment: 'Additional guards applied only when requireAdmin is true',
    required: false,
    section: 'api',
    fullPath: 'api.adminGuards',
    defaultValue: [],
    example: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
    suggestion:
      "Define additional guards for admin endpoints. Example: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }]",
  },

  /** BEHAVIOR */
  {
    name: 'nonInteractive',
    type: 'boolean',
    description: 'Whether to run the generator in non-interactive mode',
    comment: 'Automatically answer "yes" to all prompts (useful for CI/CD)',
    required: false,
    section: 'behavior',
    fullPath: 'behavior.nonInteractive',
    defaultValue: false,
    example: true,
    suggestion: "Add 'behavior.nonInteractive' to control prompt defaults",
  },
] as const;
