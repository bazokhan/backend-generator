---
layout: default
title: tgraph init
parent: Generated Output Reference
nav_order: 1
---

# `tgraph init`

## Output location

```text
./
└── tgraph.config.ts
```

- The file is always written to the current working directory (typically your project root).
- No folders are created as part of this command.

## Overwrite behaviour

- If either `tgraph.config.ts` or `tgraph.config.js` already exists, the command aborts and prints  
  `❌ Error: Configuration file already exists at '<path>'`. Nothing is written.
- When no config file is present, the template is written in full, replacing any previous partial file.

## Template contents

The generated file is a TypeScript module exporting a typed `config` object with inline documentation. Values are generated dynamically from `supportedConfigs`:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  input: {
    prisma: {
      schemaPath: 'prisma/schema.prisma',
      servicePath: 'src/infrastructure/database/prisma.service.ts',
    },
    dashboard: {
      components: { form: {}, display: {} },
    },
  },
  output: {
    backend: {
      root: 'src/features',
      dtosPath: 'src/dtos/generated',
      modulesPaths: ['src/features', 'src/modules', 'src'],
      guardsPath: 'src/guards',
      decoratorsPath: 'src/decorators',
      interceptorsPath: 'src/interceptors',
      utilsPath: 'src/utils',
      appModulePath: 'src/app.module.ts',
    },
    dashboard: {
      enabled: true,
      updateDataProvider: true,
      root: 'src/dashboard/src',
      resourcesPath: 'src/dashboard/src/resources',
      swaggerJsonPath: 'src/dashboard/src/types/swagger.json',
      apiPath: 'src/dashboard/src/types/api.ts',
      appComponentPath: 'src/dashboard/src/App.tsx',
      dataProviderPath: 'src/dashboard/src/providers/dataProvider.ts',
    },
  },
  api: {
    suffix: '',
    prefix: 'tg-api',
    authenticationEnabled: true,
    requireAdmin: true,
    guards: [{ name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' }],
    adminGuards: [{ name: 'AdminGuard', importPath: '@/guards/admin.guard' }],
  },
  behavior: {
    nonInteractive: false,
  },
};
```

All comments from the template are included verbatim to explain each option. No additional files are touched.
