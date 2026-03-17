---
title: Custom Components
---

# Custom Components Recipe

Override the default React Admin components that TGraph generates with your own custom implementations.

## Overview

TGraph supports component overrides via `tgraph.config.ts`. When configured, the generator will use your custom component instead of the default React Admin one wherever that field type appears.

## Step 1: Configure Overrides

```typescript
// tgraph.config.ts
import type { UserConfig } from '@tgraph/backend-generator';

export const config: UserConfig = {
  schemaPath: 'prisma/schema.prisma',
  srcRoot: 'src',
  // Component overrides applied during dashboard generation
  components: {
    form: {
      TextInput: {
        name: 'RichTextInput',
        importPath: '@/components/custom/RichTextInput',
      },
      FileInput: {
        name: 'ImageUploadInput',
        importPath: '@/components/custom/ImageUploadInput',
      },
    },
    display: {
      TextField: {
        name: 'HighlightedTextField',
        importPath: '@/components/custom/HighlightedTextField',
      },
    },
  },
};
```

After running `tgraph dashboard`, the generated pages will import `RichTextInput` instead of the default `TextInput` wherever a text field appears.

## Step 2: Create Your Custom Components

Create the component files referenced in the config:

### Custom Text Input with Character Count

```ts
// src/dashboard/src/components/custom/CharCountTextInput.ts
import { useInput } from 'react-admin';

// Usage: <CharCountTextInput source="description" label="Description" maxLength={200} />
export function CharCountTextInput(props: {
  source: string;
  label?: string;
  maxLength?: number;
}) {
  const { field } = useInput(props);
  const maxLength = props.maxLength ?? 100;
  const charCount = (field.value as string)?.length ?? 0;

  // Return JSX rendering a labeled input with char count display
  // Replace default TextInput with this component in tgraph.config.ts:
  // form: { TextInput: { name: 'CharCountTextInput', importPath: '@/components/custom/CharCountTextInput' } }
  return null; // Implement with your JSX
}
```

### Currency Input

```ts
// src/dashboard/src/components/custom/CurrencyInput.ts
import { useInput } from 'react-admin';

export function CurrencyInput(props: {
  source: string;
  label?: string;
  currency?: string;
}) {
  const { field } = useInput(props);
  const currency = props.currency ?? 'USD';

  // Render a number input with currency symbol prefix
  // Formats value as currency on blur, parses on change
  return null; // Implement with your JSX
}
```

### Image Upload with Preview

```ts
// src/dashboard/src/components/custom/ImageUploadInput.ts
import { useInput } from 'react-admin';

export function ImageUploadInput(props: {
  source: string;
  label?: string;
  maxSize?: number;
}) {
  const { field } = useInput(props);

  // Render file input with drag-and-drop and preview
  // Use in config: form: { FileInput: { name: 'ImageUploadInput', importPath: '...' } }
  return null; // Implement with your JSX
}
```

## Step 3: Regenerate Dashboard

```bash
tgraph dashboard
```

The generator will use your custom components wherever the overridden field types appear.

## Generated Output

With overrides configured, the generated pages look like:

```ts
// src/dashboard/src/resources/users/UserCreate.ts (generated)
// Auto-generated - do not edit
import { CharCountTextInput } from '@/components/custom/CharCountTextInput';
import { CurrencyInput } from '@/components/custom/CurrencyInput';

// Components are imported from your custom paths instead of 'react-admin'
```

## Per-Field Customization

For one-off field customizations without global overrides, extend the generated component:

```ts
// src/dashboard/src/resources/users/UserCreate.ts (custom, NOT generated)
// Import the generated component
export { UserCreate as UserCreateGenerated } from './UserCreate.tg';

// Override specific fields
export function UserCreate() {
  // Use the generated form but swap out specific inputs
}
```

## Tips

- **Global overrides** (via `tgraph.config.ts`) apply to every instance of that field type across all generated resources
- **Per-resource overrides** are done by extending the generated component in a non-`.tg.` file
- Generated files use the `.tg.` suffix and can always be regenerated safely
- Custom component files are never touched by the generator

## Related

- [Component Customization Guide](../guides/component-customization.md) — full documentation on customization options
- [Extending Generated Code](./extending-generated-code.md) — patterns for extending generated files
