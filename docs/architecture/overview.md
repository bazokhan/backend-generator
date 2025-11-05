---
layout: default
title: Overview
parent: Architecture
nav_order: 1
---

# Architecture Overview

Understanding how TGraph Backend Generator works internally.

## System Architecture

TGraph Backend Generator is built on a modular, composable architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│              CLI Interface                   │
│     (src/bin/cli.ts ▸ CommandLineInterface)  │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┴────────────┐
       │                        │
┌──────▼──────┐        ┌───────▼────────┐
│  Generators  │        │   Parsers      │
│              │        │                │
│ ApiGenerator │        │ SchemaParser   │
│ Dashboard    │◄───────│ FieldParser    │
│ DtoGenerator │        │ RelationsParser│
└──────┬───────┘        └────────────────┘
       │
       │                ┌────────────────┐
       │                │   Directive    │
       │                │   System       │
       ├───────────────►│                │
       │                │ Format/Upload/ │
       │                │ ReadOnly       │
       │                └────────────────┘
       │
       │                ┌────────────────┐
       │                │   Updaters     │
       │                │                │
       └───────────────►│ AppModule      │
                        │ Module         │
                        │ DataProvider   │
                        └────────────────┘
```

## Core Components

### 1. Parsers

**Purpose:** Extract structured data from Prisma schemas and existing code.

**Components:**

- `PrismaSchemaParser` - Parses entire schema file
- `PrismaFieldParser` - Parses individual field declarations
- `PrismaRelationsParser` - Enriches schema with relation metadata
- `NestAppModuleParser` - Parses NestJS module files

**Flow:**

```
Prisma Schema → SchemaParser → ParsedSchema
                ↓
              FieldParser → PrismaField[]
                ↓
           RelationsParser → Enhanced Fields
```

### 2. Directive System

**Purpose:** Process field-level hints that control generation behavior.

**Components:**

- `BaseFieldDirective` - Abstract base class
- `TgFormatDirective` - Handles `@tg_format()`
- `TgUploadDirective` - Handles `@tg_upload()`
- `TgReadOnlyDirective` - Handles `@tg_readonly`
- `FieldDirectiveManager` - Coordinates all directives

**Flow:**

```
Field with Doc Comment
  ↓
FieldDirectiveManager.apply()
  ↓
Each Directive.applyMatch()
  ↓
Enhanced PrismaField
```

### 3. Generators

**Purpose:** Create code files from parsed schema data.

**Components:**

- `ApiGenerator` - Orchestrates backend generation
- `DashboardGenerator` - Orchestrates frontend generation
- `DtoGenerator` - Generates response DTOs
- `NestControllerGenerator` - Generates controllers
- `NestServiceGenerator` - Generates services
- `NestDtoGenerator` - Generates create/update DTOs
- `ReactComponentsGenerator` - Generates React Admin components

**Flow:**

```
ApiGenerator
  ├─> Parse Schema
  ├─> Resolve Module Paths
  ├─> Generate DTOs
  ├─> Generate Services
  ├─> Generate Controllers
  ├─> Update Modules
  └─> Update AppModule
```

### 4. Updaters

**Purpose:** Safely modify existing code files while preserving manual content.

**Components:**

- `NestAppModuleUpdater` - Updates app.module.ts
- `NestModuleUpdater` - Updates individual module files
- `DataProviderEndpointGenerator` - Updates data provider

**Strategy:**

- Use sentinel comments to mark auto-generated sections
- Parse existing code before modifying
- Preserve manual code outside sentinel comments
- Format generated code for consistency

### 5. Utilities

**Purpose:** Provide shared functionality across components.

**Components:**

- `ModulePathResolver` - Locates module directories
- Naming utilities - Consistent name transformations
- File system utilities - Safe file operations
- Formatting utilities - Code formatting via Prettier

## Generation Pipeline

### API Generation Pipeline

```
1. Parse Schema
   ├─> Read prisma/schema.prisma
   ├─> Extract models with @tg_form()
   ├─> Parse fields with directives
   └─> Build PrismaModel[]

2. Resolve Paths
   ├─> For each model:
   │   ├─> Check src/features/{kebab-name}
   │   ├─> Check src/infrastructure/{kebab-name}
   │   └─> Prompt to create if missing
   └─> Build ModulePathInfo[]

3. Generate DTOs
   ├─> For each model:
   │   ├─> Generate Create DTO
   │   │   ├─> Add class-validator decorators
   │   │   ├─> Apply custom validation
   │   │   └─> Write create-{model}.tg.dto.ts
   │   └─> Generate Update DTO
   │       ├─> Make all fields optional
   │       ├─> Apply validation
   │       └─> Write update-{model}.tg.dto.ts

4. Generate Services
   ├─> For each model:
   │   ├─> Generate CRUD methods
   │   ├─> Add pagination/search
   │   ├─> Handle unique constraints
   │   └─> Write {model}.tg.service.ts

5. Generate Controllers
   ├─> For each model:
   │   ├─> Generate REST endpoints
   │   ├─> Add guards based on isAdmin
   │   ├─> Add validation pipes
   │   └─> Write {model}.tg.controller.ts

6. Update Modules
   ├─> For each model:
   │   ├─> Read existing module file
   │   ├─> Add providers/controllers
   │   └─> Write updated module

7. Update AppModule
   ├─> Collect all module imports
   ├─> Update auto-generated section
   └─> Write app.module.ts

8. Update Data Provider (optional)
   ├─> Build endpoint mappings
   ├─> Update auto-generated section
   └─> Write dataProvider.ts
```

### Dashboard Generation Pipeline

```
1. Parse Schema
   (Same as API generation)

2. Generate Components
   ├─> For each model:
   │   ├─> Generate List
   │   │   ├─> Build Datagrid columns
   │   │   ├─> Add search/filter
   │   │   └─> Write {Model}List.tsx
   │   ├─> Generate Edit
   │   │   ├─> Build form inputs
   │   │   ├─> Handle relations
   │   │   └─> Write {Model}Edit.tsx
   │   ├─> Generate Create
   │   │   (Similar to Edit)
   │   ├─> Generate Show
   │   │   ├─> Build read-only fields
   │   │   └─> Write {Model}Show.tsx
   │   ├─> Generate Studio
   │   │   ├─> Build spreadsheet view
   │   │   └─> Write {Model}Studio.tsx
   │   └─> Generate Index
   │       └─> Write index.ts

3. Generate Field Directives
   ├─> Extract all directives
   ├─> Build metadata object
   └─> Write fieldDirectives.generated.ts

4. Update App.tsx
   ├─> Add resource imports
   ├─> Add Resource components
   ├─> Add studio routes
   └─> Write App.tsx
```

## Design Patterns

### 1. Strategy Pattern

Generators use strategy pattern for flexible code generation:

```typescript
interface IGenerator {
  generate(input: any): void | Promise<void>;
}

class ApiGenerator implements IGenerator {
  async generate() {
    // API-specific generation
  }
}

class DashboardGenerator implements IGenerator {
  async generate() {
    // Dashboard-specific generation
  }
}
```

### 2. Template Method Pattern

Base generators define the workflow, subclasses implement steps:

```typescript
abstract class BaseGenerator {
  async generate() {
    await this.parse();
    await this.validate();
    await this.createFiles();
    await this.format();
  }

  abstract parse(): Promise<void>;
  abstract validate(): Promise<void>;
  abstract createFiles(): Promise<void>;
}
```

### 3. Factory Pattern

Component generators create specific artifacts:

```typescript
class ReactComponentFactory {
  createList(model: PrismaModel): string {
    // Generate list component
  }

  createEdit(model: PrismaModel): string {
    // Generate edit component
  }
}
```

### 4. Observer Pattern

Directive system notifies components of field metadata:

```typescript
class FieldDirectiveManager {
  private directives: BaseFieldDirective[] = [];

  apply(field: PrismaField, sourceText: string): void {
    for (const directive of this.directives) {
      directive.apply(field, sourceText);
    }
  }
}
```

## Data Flow

### Prisma Schema → Generated Code

```
┌─────────────────┐
│ Prisma Schema   │
│ // @tg_form()   │
│ model User {    │
│   id String     │
│   name String   │
│ }               │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parsed Model    │
│ {               │
│   name: 'User', │
│   fields: [...] │
│ }               │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ Backend│ │ Frontend │
└────┬───┘ └────┬─────┘
     │          │
     ▼          ▼
  ┌────┐    ┌──────┐
  │DTOs│    │ List │
  │Svc │    │ Edit │
  │Ctrl│    │Create│
  └────┘    └──────┘
```

## Extension Points

### 1. Custom Directives

Add new field directives:

```typescript
class CustomDirective extends BaseFieldDirective {
  readonly name = 'tg_custom';
  readonly pattern = /@tg_custom\(([^)]+)\)/;

  applyMatch(field: PrismaField, match: RegExpMatchArray): void {
    field.customMetadata = match[1];
  }
}

// Register
FieldDirectiveManager.register(new CustomDirective());
```

### 2. Custom Generators

Create custom generators for specific needs:

```typescript
class ApiDocsGenerator implements IGenerator {
  async generate(models: PrismaModel[]) {
    // Generate API documentation
  }
}
```

### 3. Custom Updaters

Extend updaters for custom file modifications:

```typescript
class CustomModuleUpdater extends NestModuleUpdater {
  async update(path: string, updates: ModuleUpdates) {
    // Custom pre-processing
    await super.update(path, updates);
    // Custom post-processing
  }
}
```

## Next Steps

- **[Philosophy](./philosophy.md)** – Design principles
- **[Contributing](../contributing.md)** – Contribute to the project
- **[SDK Reference](../sdk-reference.md)** – Extend the system
