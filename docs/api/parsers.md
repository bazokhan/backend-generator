---
title: Parsers
---

# Parsers API

Parser classes convert files on disk into structured metadata that every generator consumes. They are exposed as deep exports under `dist/parser/...` for advanced customization or testing.

```typescript
import { PrismaSchemaParser } from '@tgraph/backend-generator/dist/parser/prisma-schema-parser/PrismaSchemaParser';
```

---

## PrismaSchemaParser

Parses a Prisma schema string and returns enriched models/enums. Only models decorated with `@tg_form()` are kept—this keeps generators focused on resources you explicitly opted in for.

### Constructor

```typescript
import { PrismaSchemaParser } from '@tgraph/backend-generator/dist/parser/prisma-schema-parser/PrismaSchemaParser';
import { PrismaFieldParser } from '@tgraph/backend-generator/dist/parser/prisma-field-parser/PrismaFieldParser';
import { PrismaRelationsParser } from '@tgraph/backend-generator/dist/parser/prisma-relation-parser/PrismaRelationsParser';

const parser = new PrismaSchemaParser(new PrismaFieldParser(), new PrismaRelationsParser());
```

### Methods

- `load(schema: string): void` – Stores the raw schema for parsing.
- `parse(): ParsedSchema<PrismaModel>` – Walks the schema line by line, tracks parser state, collects enums, and materializes Prisma models with relation metadata.
- `reset(): void` – Clears intermediate state so the parser can be reused.

### Behavior Highlights

- Triple-slash doc comments (`///`) are inspected for `@tg_form()` and `@tg_label()` directives.
- Models without `@tg_form()` are skipped automatically.
- Handles inline models (`model Foo { field String }`) and classic multi-line blocks.
- Delegates per-field parsing to `PrismaFieldParser` and relation enrichment to `PrismaRelationsParser`.

---

## PrismaFieldParser

Parses an individual Prisma model line and returns a `PrismaField` description.

### Capabilities

- Detects optional fields (`?`), arrays (`[]`), `@id`, `@unique`, and `@default`.
- Extracts `@relation()` metadata including `fields`/`references`.
- Discovers inline doc directives handled by the `fieldDirectiveManager` (e.g., `@tg_format(url)`).
- Parses custom validation comments such as `@max(50)` or `@required([create, update])`.
- Derives `baseType`, TypeScript types, search type hints, and flags for scalar/enum/relation fields.

### Usage

```typescript
import { PrismaFieldParser } from '@tgraph/backend-generator/dist/parser/prisma-field-parser/PrismaFieldParser';

const parser = new PrismaFieldParser();
const field = parser.parse('title String @unique', '/// @tg_format(title)');
if (field) {
  console.log(field.name, field.baseType, field.customValidations);
}
```

---

## PrismaRelationsParser

Enriches parsed models with metadata that is only available once every field is known.

### Methods

- `parse(parsed: ParsedSchema<PrismaModel>): void` – Mutates `parsed.models` in place and assigns derived properties.

### Responsibilities

- Marks `isRelation`, `isScalar`, `isEnum`, and `searchType` on fields.
- Identifies and annotates foreign key pairs (`icon` ↔ `iconId`).
- Computes `displayField` and `defaultSortBy` on every model so React Admin pages have sensible defaults.

---

## NestAppModuleParser

Specialized parser that understands `@Module()` decorators and the `imports: []` array inside `app.module.ts`. It powers `NestAppModuleUpdater`.

### Methods

- `parse(source: string): { tokens: string[]; moduleBounds: Bounds | null; importsBounds: Bounds | null }`

The returned `tokens` array represents sanitized items already present inside `imports: []`. The `Bounds` objects (start, end, content) help injector code build new strings without losing formatting.

### Usage

```typescript
import { NestAppModuleParser } from '@tgraph/backend-generator/dist/parser/nest-app-module-parser/NestAppModuleParser';

const parser = new NestAppModuleParser();
const { tokens, importsBounds } = parser.parse(appModuleSource);
console.log(tokens); // Existing imports array entries
```

---

## Parsed Data Structures

The parsers populate the shared interfaces defined in `src/types/index.d.ts`.

### PrismaModel

```typescript
interface PrismaModel {
  name: string;
  fields: PrismaField[];
  enums: string[];
  modulePath?: string; // Filled when ModulePathResolver finds a folder
  moduleType: string; // Folder key such as 'features'
  tgLabelField?: string; // From @tg_label()
  displayField?: string; // Computed label field for selects
  defaultSortBy?: string; // Computed default sort key
}
```

### PrismaField

```typescript
interface PrismaField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  isId: boolean;
  isUnique: boolean;
  hasDefaultValue: boolean;
  baseType: string;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  foreignKeyName?: string;
  customValidations: CustomValidation[];
  tsType?: string; // Non-enumerable property set at runtime
  searchType?: 'string' | 'number' | 'boolean' | 'date' | null;
  isRelation?: boolean;
  isScalar?: boolean;
  isEnum?: boolean;
  tgFormat?: 'url' | 'email' | 'password' | 'tel';
  tgUpload?: 'image' | 'file';
  tgReadOnly?: boolean;
  directives?: Record<string, Record<string, unknown>>;
}
```

### CustomValidation

```typescript
interface CustomValidation {
  decorator: string; // e.g., 'max', 'required'
  value: any; // decorator argument
  operations?: string[]; // target operations like ['create', 'update']
}
```

These structures flow directly into the generators, so any custom parser logic you add becomes available to the rest of the pipeline.

---

## Related Topics

- How generators use this metadata: [Generators API](./generators.md)
- Loading configuration and resolving project paths: [Utilities](./utilities.md)

### ParsedSchema

```typescript
interface ParsedSchema {
  models: PrismaModel[];
  enums: Map<string, string[]>;
}
```

---

## Parser Workflow

### Complete Parsing Workflow

```typescript
// 1. Parse schema
const schemaParser = new PrismaSchemaParser();
schemaParser.load(schemaContent);
const parsed = schemaParser.parse();

// 2. Enrich with relations
const relationsParser = new PrismaRelationsParser();
relationsParser.parse(parsed);

// 3. Models now have complete metadata
for (const model of parsed.models) {
  console.log(model.name);
  console.log(model.displayField);

  for (const field of model.fields) {
    if (field.isRelation) {
      console.log(`  ${field.name} -> ${field.type}`);
    }
  }
}
```

---

## Field Type Mapping

Parsers automatically map Prisma types to TypeScript types:

| Prisma Type | TypeScript Type | Search Type |
| ----------- | --------------- | ----------- |
| `String`    | `string`        | `'string'`  |
| `Int`       | `number`        | `'number'`  |
| `Float`     | `number`        | `'number'`  |
| `Decimal`   | `number`        | `'number'`  |
| `BigInt`    | `bigint`        | `'number'`  |
| `Boolean`   | `boolean`       | `'boolean'` |
| `DateTime`  | `Date`          | `'date'`    |
| `Json`      | `any`           | `null`      |
| `Bytes`     | `Buffer`        | `null`      |
| Enums       | Enum name       | `'string'`  |
| Relations   | Model name      | `null`      |

---

## Custom Validation Parsing

Parsers extract inline validation comments:

```prisma
model User {
  username String  // @min(3) @max(20)
  email    String  // @pattern(/^[^\s@]+@/)
  age      Int     // @min(18) @max(120)
}
```

Parsed as:

```typescript
{
  name: 'username',
  customValidations: [
    { decorator: '@Min', value: 3 },
    { decorator: '@Max', value: 20 },
  ]
}
```

---

## Field Directive Parsing

Parsers extract field directives from doc comments:

```prisma
/// @tg_format(email)
email String @unique

/// @tg_upload(image)
avatar String?

/// @tg_readonly
ipAddress String?
```

Parsed as:

```typescript
{
  name: 'email',
  tgFormat: 'email',
}

{
  name: 'avatar',
  tgUpload: 'image',
}

{
  name: 'ipAddress',
  tgReadOnly: true,
}
```

---

## Best Practices

### 1. Always Reset Between Parses

```typescript
const parser = new PrismaSchemaParser();

parser.load(schema1);
const parsed1 = parser.parse();

parser.reset(); // Important!

parser.load(schema2);
const parsed2 = parser.parse();
```

### 2. Handle Parse Errors

```typescript
try {
  const parser = new PrismaSchemaParser();
  parser.load(schemaContent);
  const parsed = parser.parse();
} catch (error) {
  console.error('Parse failed:', error.message);
}
```

### 3. Validate Parsed Data

```typescript
const parsed = parser.parse();

if (parsed.models.length === 0) {
  console.warn('No models found in schema');
}

for (const model of parsed.models) {
  if (!model.displayField) {
    console.warn(`No display field found for ${model.name}`);
  }
}
```

---

## Next Steps

- **[Generators API](./generators.md)** – Generator classes
- **[Utilities API](./utilities.md)** – Helper functions
- **[Configuration](./configuration.md)** – Configuration options
