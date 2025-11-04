# Field Directives

Field-level `@tg_*` directives let you fine-tune how Prisma schema fields are treated across the entire toolchain: dashboard generation, NestJS DTOs/services, and the React Admin data provider. This document describes every supported field directive and how the directive engine works so you can confidently extend it.

## How field directives are processed

1. **Parser** – `PrismaFieldParser` collects triple-slash doc comments and inline comments, then runs them through the directive registry located at `src/scripts/utils/directives/field`. Each directive is implemented as a small class (extending `BaseFieldDirective`) that knows how to mutate the parsed `PrismaField`.
2. **Shared metadata** – Directives decorate the `PrismaField` object (e.g., `tgFormat`, `tgUpload`, `tgReadOnly`). The dashboard generator also serializes the directive metadata into `src/dashboard/src/providers/fieldDirectives.generated.ts`, so the React Admin app can react at runtime (e.g., data uploads, read-only enforcement).
3. **Generators** – React component generators, DTO generators, and data-provider helpers all consume the parsed metadata so one directive automatically affects every generation step.

To add a new directive:

1. Create a directive class in `src/scripts/utils/directives/field/directives/`.
2. Register it in `FieldDirectiveManager` (`src/scripts/utils/directives/field/FieldDirectiveManager.ts`).
3. If the directive needs runtime behavior (e.g., in the dashboard), emit the necessary metadata in `buildFieldDirectiveFile`.
4. Update whichever generators or runtime helpers should react to the new directive.

Because every directive funnels through the same manager, you only touch a single class per directive to parse schema hints.

## Directive reference

| Directive | Syntax | Dashboard behavior | API / DTO behavior | Notes |
|-----------|--------|--------------------|--------------------|-------|
| `@tg_format` | `/// @tg_format(url \| email \| password \| tel)` | Switches the generated input component (`UrlInput`, `TextInput type="email/password/tel"`). | Adds matching `class-validator` decorators (`@IsEmail()`, `@IsUrl()`, or a phone-number pattern) to create/update DTOs. | Use to refine string semantics without changing Prisma scalar types. |
| `@tg_upload` | `/// @tg_upload(image \| file)` | Generates a `<FileInput>` (with `accept="image/*"` for images). | Dashboard data provider automatically uploads `FileInput` blobs through `POST /upload` and replaces the payload with the returned URL string before calling the model API. | Backend DTOs remain simple strings (URL or filename). No manual upload wiring needed. |
| `@tg_readonly` | `/// @tg_readonly` | Generated create/edit forms render the field as disabled/read-only. The data provider strips the field from create/update payloads. | Prevents accidental writes even if someone removes the `disabled` attribute in DevTools. | Ideal for audit fields (e.g., IP, user agent) that should never be editable from the dashboard. |

### `@tg_format(...)`

Supported arguments: `url`, `email`, `password`, `tel`.

- **Dashboard**: The edit/create generators select the appropriate React Admin input. For example, `@tg_format(email)` renders `<TextInput source="email" type="email" />`.
- **DTOs**: `class-validator` decorators are added automatically. `email` and `url` include `@IsEmail()`/`@IsUrl()`, and `tel` adds a permissive phone-number pattern via `@Matches(/^[0-9+()\s-]+$/)`.
- **Swagger**: Because DTOs carry richer metadata, the generated Swagger spec reflects the new validation rules.

### `@tg_upload(image|file)`

- **Dashboard**: Forms render `<FileInput>` for the field. `image` inputs automatically add `accept="image/*"`. You can still include preview children manually if desired.
- **Data provider**: When the dashboard submits a record, any value coming from a `FileInput` is uploaded to `POST /upload` first. The helper rewrites the field value to the returned URL (or filename) before issuing the actual model mutation, so the NestJS API continues to receive a simple string.
- **Backend**: DTOs remain `string` or `string | null`; you store whatever URL/path your `UploadService` returned.

### `@tg_readonly`

- **Dashboard**: Generated inputs are rendered with `disabled readOnly`, signalling to users that the value is informational only.
- **Data provider**: The field is stripped from create/update payloads, guaranteeing that even API clients embedded in the dashboard cannot modify it.

### Generated runtime metadata

Every time you run `npm run generate:dashboard`, the generator emits `src/dashboard/src/providers/fieldDirectives.generated.ts`. This file maps each resource to the directives applied on its fields. The React Admin data provider imports it to decide which fields should be uploaded, skipped, or otherwise transformed at runtime. Treat this file as auto-generated—edit the Prisma schema, not the file.

## Extending the system

1. **Add a directive class** – Drop a new file under `src/scripts/utils/directives/field/directives/` that extends `BaseFieldDirective`. Set a regex `pattern` and implement `applyMatch` to mutate the `PrismaField`.
2. **Register it** – Import the directive in `FieldDirectiveManager` and add it to the registry array.
3. **Expose metadata** – If the directive needs to be visible in the dashboard, include it when building the directive metadata file (`buildFieldDirectiveFile`).
4. **React to it** – Update the relevant generator (React components, DTOs, services, etc.) or runtime helper (e.g., data provider) to act on the new metadata.

Thanks to this structure, a new schema hint typically requires changing just one small directive class plus whatever feature actually uses the hint—no more scattering regexes across multiple files.
