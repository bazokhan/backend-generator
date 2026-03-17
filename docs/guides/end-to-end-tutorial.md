---
title: End-to-End Tutorial
---

# End-to-End Tutorial

Build a brand-new NestJS API, spin up a React Admin dashboard, install TGraph, and scaffold both stacks in one go. The whole flow fits on a single page so you can follow along during a lunch break.

> **Prerequisites:** Node.js ≥ 18, npm ≥ 9, the Nest CLI (`npm install -g @nestjs/cli`), and `npx` (ships with npm).

---

## 1. Scaffold the Workspace

```bash
mkdir tgraph-demo && cd tgraph-demo
nest new api --package-manager npm --skip-git
cd api
npx create-react-app dashboard --template typescript
```

You now have a Nest project in `api/` and a React Admin-ready frontend under `api/dashboard/`.

---

## 2. Add Prisma and a Sample Schema

```bash
cd api
npm install prisma @prisma/client
npx prisma init
nest g module prisma
nest g service prisma/prisma --flat
```

Edit `prisma/schema.prisma` so it exposes at least one model tagged with `@tg_form()`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

/// @tg_form()
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  status      Status   @default(DRAFT)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Status {
  DRAFT
  ACTIVE
  COMPLETE
}
```

Run at least one migration so Prisma creates the SQLite/Postgres file you plan to use (or skip this step when just testing the generator).

Replace the generated `src/prisma/prisma.service.ts` with a minimal Prisma bridge and export it from `prisma.module.ts`:

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// src/prisma/prisma.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Finally, import `PrismaModule` inside `src/app.module.ts` so Nest can inject `PrismaService` anywhere.

---

## 3. Prepare the React Admin Dashboard Folder

Create a minimal data provider stub under `dashboard/src/providers/dataProvider.ts`:

```typescript
// dashboard/src/providers/dataProvider.ts
import simpleRestProvider from 'ra-data-simple-rest';

const endpointMap: Record<string, string> = {
  // Auto-generated API endpoints land here
};

export const dataProvider = simpleRestProvider('/tg-api', {
  // let React Admin append /<resource>
});
```

Update `dashboard/src/App.tsx` so React Admin boots without components yet:

```tsx
import { Admin, Resource } from 'react-admin';
import { dataProvider } from './providers/dataProvider';

export const App = () => <Admin dataProvider={dataProvider}>{/* Resources injected by TGraph go here */}</Admin>;

export default App;
```

Install React Admin dependencies once:

```bash
cd dashboard
npm install react-admin ra-data-simple-rest @mui/material @emotion/react @emotion/styled
cd ..
```

---

## 4. Install TGraph and Create the Config

Still inside `api/`:

```bash
npm install --save-dev @tgraph/backend-generator
npx tgraph init
```

Replace the generated `tgraph.config.ts` with settings that match the folders you just created:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  input: {
    schemaPath: 'prisma/schema.prisma',
    prismaService: 'src/prisma/prisma.service.ts',
  },
  output: {
    backend: {
      dtos: 'src/dtos/generated',
      modules: {
        searchPaths: ['src/features', 'src/modules', 'src'],
        defaultRoot: 'src/features',
      },
      staticFiles: {
        guards: 'src/guards',
        decorators: 'src/decorators',
        dtos: 'src/dtos',
        interceptors: 'src/interceptors',
        utils: 'src/utils',
      },
    },
    dashboard: {
      root: 'dashboard/src',
      resources: 'dashboard/src/resources',
    },
  },
  api: {
    suffix: 'Admin',
    prefix: 'tg-api',
    authentication: {
      enabled: true,
      requireAdmin: true,
      guards: [
        { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
        { name: 'AdminGuard', importPath: '@/guards/admin.guard' },
      ],
    },
  },
  dashboard: {
    enabled: true,
    updateDataProvider: true,
    components: { form: {}, display: {} },
  },
  behavior: {
    nonInteractive: false,
  },
  paths: {
    appModule: 'src/app.module.ts',
    dataProvider: 'dashboard/src/providers/dataProvider.ts',
    appComponent: 'dashboard/src/App.tsx',
  },
};
```

Feel free to adjust the module search paths if you prefer `src/features` or `src/modules`.

---

## 5. Run the Generators

Generate everything in one go:

```bash
npx tgraph all
```

or run the commands individually:

```bash
npx tgraph api
npx tgraph dashboard
npx tgraph dtos
```

During the API phase the CLI will:

- Parse `Project` from the Prisma schema.
- Create a Nest module under `src/app/project`.
- Generate controller, service, and DTO files with the `Admin` suffix.
- Update `src/app.module.ts` with fresh imports.
- Refresh the React Admin data provider endpoint map.

During the dashboard phase it will:

- Scaffold `dashboard/src/resources/projects` with List/Edit/Create/Show/Studio pages.
- Add `<Resource name="projects" list={ProjectList} ... />` entries to `dashboard/src/App.tsx`.
- Regenerate `dashboard/src/providers/fieldDirectives.generated.ts`.

DTO generation drops `project-response.dto.ts` under `src/dtos/generated`.

---

## 6. Boot Everything

Open two terminals from `api/`:

```bash
# Terminal 1 – Nest backend
npm run start:dev

# Terminal 2 – React Admin
cd dashboard
npm start
```

Hit `http://localhost:3000` (React) and `http://localhost:3001/tg-api/projects` (Nest) to confirm both sides are alive. React Admin will already list the generated `Project` resource; once you seed data, the pages will light up automatically.

---

## Where to Go Next

1. Customize React Admin components via `dashboard.components` overrides.
2. Add more `@tg_form()` models and re-run `npx tgraph api dashboard`.
3. Run `npx tgraph doctor` before commits to catch missing folders early.
