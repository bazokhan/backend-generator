# Dashboard Generation Guide

This guide explains what the dashboard generator creates, how it maps Prisma schema fields to UX-friendly components, and how you can influence the output using Prisma comments. For a deep dive into every field-level directive, see [FIELD_DIRECTIVES.md](FIELD_DIRECTIVES.md).

## What gets generated

For each model annotated with `// @tg_form()` in `prisma/schema.prisma`, the generator creates under `src/dashboard/src/resources/<resource>/`:
- `<Model>List.tsx`: Table view with a Studio button
- `<Model>Edit.tsx`: Edit form using type-aware inputs
- `<Model>Create.tsx`: Create form using type-aware inputs
- `<Model>Show.tsx`: Read-only view with type-aware fields
- `<Model>Studio.tsx`: An excel-like editable grid page (per-resource)
- `index.ts`: Barrel exporting all above

The generator also updates `src/dashboard/src/App.tsx` to:
- Import the generated components
- Register `<Resource>` entries
- Register custom routes for each Studio page at `/<resource>/studio`

## Type-to-Component Mapping

The generator analyzes field types and hints to choose the best component. One component per type is used (DRY/SOLID), leveraging existing admin components.

- Boolean → `BooleanInput` (forms), `BooleanField` (show)
- Numbers (Int/Float/Decimal/BigInt) → `NumberInput` (forms), `NumberField` (show)
- DateTime → `DateTimeInput` (forms), `DateField` (show)
- String → `TextInput` (forms), `TextField` (show)
  - `@tg_format(url)` → `UrlInput` (forms), `UrlField` (show)
  - `@tg_format(email|password|tel)` → `TextInput` with the appropriate type
  - `@tg_upload(image|file)` → `FileInput` (with preview children if you add them)
- Json → `JsonInput` (validated textarea), `TextField` (show)
- Bytes → `FileInput` (forms), `FileField` (show)
- Enums → `SelectInput`/`SelectField` with `choices` derived from the enum values
- Relations:
  - To-one → `ReferenceInput` + `AutocompleteInput` with search; show uses `ReferenceField`
  - To-many → `ReferenceArrayInput` + `AutocompleteArrayInput`

## Relation Labels

To control how related records display in selectors and fields, add a model-level label hint above the referenced model:

```prisma
// @tg_label(name)
// @tg_form()
model User {
  id    String @id @default(uuid())
  name  String
  email String @unique
}
```

If missing, a heuristic is used: `name > title > email > code > slug > id`, or the first non-id `String` field.

## Per-field Hints (Doc Comments)

You can influence generated components with Prisma doc comments placed immediately above fields:

- `/// @tg_format(url|email|password|tel)` → fine-tune string input types and add matching `class-validator` decorators
- `/// @tg_upload(image|file)` → render upload input (with `accept="image/*"` for images) and let the dashboard upload the blob for you
- `/// @tg_readonly` → mark a field as truly read-only; forms render the input as disabled and the data provider strips it from mutations

Example:

```prisma
// @tg_form()
model Asset {
  id   String @id
  /// @tg_format(url)
  url  String
  /// @tg_upload(image)
  file String
}
```

## Studio Pages

Each resource has a Studio page (like Prisma Studio) at `/<resource>/studio`:
- Inline-friendly editing via a drawer form per row
- Add/Delete row controls
- Quick navigation back to Edit/Show using standard table row clicks

The Studio uses a reusable `DataSheet` component with per-column editors provided by a central `FieldFactory`. You can evolve this to true inline cells if needed.

## Customizing Further

- Components are generated using a central mapping. To change behavior globally, update:
  - `src/scripts/utils/generation-text/dashboard-components.ts`
  - Or author reusable inputs/fields under `src/dashboard/@/components/admin/` and reference them
- Field directive parsing lives in `src/scripts/utils/directives/field`. Add a new directive class there to affect every generation step.
- Runtime metadata for directives is emitted to `src/dashboard/src/providers/fieldDirectives.generated.ts` (auto-generated—do not edit it manually).

## Regenerating

- Ensure your backend Swagger JSON exists if you rely on type generation
- Run the dashboard generator script (see project README) – existing resource folders can be replaced

## Notes

- Generation remains opt-in per model via `// @tg_form()`
- New hints are optional and backward compatible
- The output aims for excellent UX by default, while remaining simple to customize
