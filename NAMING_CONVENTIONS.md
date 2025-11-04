# Naming Conventions

This document describes the unified naming conventions used across backend and frontend code generation.

## Overview

All code generation scripts now use shared naming utilities from `src/scripts/naming-utils.ts` to ensure consistency.

## Conventions

### Model: `CustomFieldType`

| Context | Format | Example | Notes |
|---------|--------|---------|-------|
| **Prisma Model** | PascalCase | `CustomFieldType` | Original model name |
| **Backend API Endpoint** | kebab-case-plural | `/tg-api/custom-field-types` | REST best practice |
| **Frontend Resource Name** | kebab-case-plural | `custom-field-types` | Matches API endpoint |
| **Frontend Folder** | kebab-case-plural | `/resources/custom-field-types/` | Matches resource name |
| **File Names** | camelCase | `customFieldType.tg.service.ts` | TypeScript convention |

## Examples

```typescript
// Backend Controller
@Controller('tg-api/custom-field-types')  // ✅ kebab-case-plural
export class CustomFieldTypeBzController { }

// Frontend dataProvider
const endpointMap = {
  'custom-field-types': 'tg-api/custom-field-types'  // ✅ matches
};

// Frontend Resource
<Resource 
  name="custom-field-types"  // ✅ matches dataProvider key
  list={CustomFieldTypeList} 
/>
```

## Migration

To update existing code:

1. Regenerate backend controllers: `npm run generate:tg-api`
2. Regenerate frontend resources: `npm run dashboard:generate`
3. Backend endpoints will change from `tg-api/customFieldType` to `tg-api/custom-field-types`
4. Frontend resources will change from `customfieldtype` to `custom-field-types`
5. Update any hardcoded references to use the new format

## Utilities

All generation scripts use these functions from `src/scripts/naming-utils.ts`:

- `getApiEndpoint(modelName)` - Returns `/tg-api/kebab-case-plurals`
- `getResourceName(modelName)` - Returns `kebab-case-plurals`
- `toKebabCase(str)` - Converts PascalCase to kebab-case
- `pluralize(str)` - Simple English pluralization

