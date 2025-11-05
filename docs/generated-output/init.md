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

The generated file is a TypeScript module exporting a typed `config` object with inline documentation. Values mirror `buildConfigTemplate()`:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
  isAdmin: true,
  updateDataProvider: true,
  nonInteractive: false,
};
```

All comments from the template are included verbatim to explain each option. No additional files are touched.
