---
title: Component Customization
---

# Component Customization Guide

Learn how to customize React Admin components used in generated dashboard pages.

## Overview

TGraph generates React Admin pages with default components from `@/components/admin`. You can override these components to use your own custom implementations, allowing you to:

- Apply custom styling
- Add business logic
- Integrate third-party component libraries
- Maintain consistent UI across your application

## Component Categories

Components are organized into two categories:

1. **Form Components** - Used in Create and Edit pages (inputs)
2. **Display Components** - Used in List and Show pages (fields)

## Available Component Overrides

### Form Components (Inputs)

| Component                | Used For                 | Default Import       |
| ------------------------ | ------------------------ | -------------------- |
| `TextInput`              | String fields            | `@/components/admin` |
| `NumberInput`            | Numeric fields           | `@/components/admin` |
| `BooleanInput`           | Boolean fields           | `@/components/admin` |
| `DateTimeInput`          | DateTime fields          | `@/components/admin` |
| `SelectInput`            | Enum fields              | `@/components/admin` |
| `ReferenceInput`         | Relation fields (single) | `@/components/admin` |
| `ReferenceArrayInput`    | Relation fields (array)  | `@/components/admin` |
| `AutocompleteInput`      | Autocomplete (single)    | `@/components/admin` |
| `AutocompleteArrayInput` | Autocomplete (array)     | `@/components/admin` |
| `JsonInput`              | JSON fields              | `@/components/admin` |
| `FileInput`              | File uploads             | `@/components/admin` |
| `UrlInput`               | URL fields               | `@/components/admin` |

### Display Components (Fields)

| Component        | Used For        | Default Import       |
| ---------------- | --------------- | -------------------- |
| `TextField`      | String fields   | `@/components/admin` |
| `NumberField`    | Numeric fields  | `@/components/admin` |
| `BooleanField`   | Boolean fields  | `@/components/admin` |
| `DateField`      | Date fields     | `@/components/admin` |
| `DateTimeField`  | DateTime fields | `@/components/admin` |
| `SelectField`    | Enum fields     | `@/components/admin` |
| `ReferenceField` | Relation fields | `@/components/admin` |
| `JsonField`      | JSON fields     | `@/components/admin` |
| `FileField`      | File fields     | `@/components/admin` |
| `UrlField`       | URL fields      | `@/components/admin` |

## Configuration

Override components in your `tgraph.config.ts`:

```typescript
export const config: Config = {
  // ... other config

  dashboard: {
    enabled: true,
    updateDataProvider: true,
    components: {
      // Form components (used in Create/Edit pages)
      form: {
        TextInput: {
          name: 'CustomTextInput',
          importPath: '@/components/inputs/TextInput',
        },
        NumberInput: {
          name: 'CustomNumberInput',
          importPath: '@/components/inputs/NumberInput',
        },
      },

      // Display components (used in List/Show pages)
      display: {
        TextField: {
          name: 'CustomTextField',
          importPath: '@/components/fields/TextField',
        },
      },
    },
  },
};
```

## Examples

### Example 1: Custom Styled Text Input

Create a custom text input with Tailwind styling:

```typescript
// src/components/inputs/TextInput.tsx
import React from 'react';
import { useInput, InputProps } from 'react-admin';

export const CustomTextInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {props.label}
      </label>
      <input
        {...field}
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {fieldState.error && (
        <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
      )}
    </div>
  );
};
```

Configure in `tgraph.config.ts`:

```typescript
dashboard: {
  components: {
    form: {
      TextInput: {
        name: 'CustomTextInput',
        importPath: '@/components/inputs/TextInput'
      },
    },
  },
}
```

### Example 2: Third-Party Component Library

Integrate Material-UI components:

```typescript
// src/components/inputs/NumberInput.tsx
import React from 'react';
import { useInput, InputProps } from 'react-admin';
import { TextField } from '@mui/material';

export const MuiNumberInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);

  return (
    <TextField
      {...field}
      type="number"
      label={props.label}
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
      fullWidth
      margin="normal"
      variant="outlined"
    />
  );
};
```

Configure:

```typescript
dashboard: {
  components: {
    form: {
      NumberInput: {
        name: 'MuiNumberInput',
        importPath: '@/components/inputs/NumberInput'
      },
    },
  },
}
```

### Example 3: Custom Field with Validation

Add custom validation logic:

```typescript
// src/components/inputs/EmailInput.tsx
import React from 'react';
import { useInput, InputProps } from 'react-admin';

export const EmailInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput({
    ...props,
    validate: (value) => {
      if (!value) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Invalid email format';
      }
      // Check for company domain
      if (value && !value.endsWith('@company.com')) {
        return 'Must use company email';
      }
      return undefined;
    },
  });

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {props.label}
      </label>
      <input
        {...field}
        type="email"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="user@company.com"
      />
      {fieldState.error && (
        <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
      )}
    </div>
  );
};
```

Use the text input override for email fields:

```typescript
dashboard: {
  components: {
    form: {
      TextInput: {
        name: 'EmailInput',
        importPath: '@/components/inputs/EmailInput'
      },
    },
  },
}
```

### Example 4: Custom Display Field

Create a custom field with formatting:

```typescript
// src/components/fields/CurrencyField.tsx
import React from 'react';
import { useRecordContext, FieldProps } from 'react-admin';

export const CurrencyField: React.FC<FieldProps> = (props) => {
  const record = useRecordContext();
  const value = record?.[props.source];

  if (value === null || value === undefined) {
    return <span className="text-gray-400">—</span>;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

  return <span className="font-medium text-green-600">{formatted}</span>;
};
```

Configure for number fields:

```typescript
dashboard: {
  components: {
    display: {
      NumberField: {
        name: 'CurrencyField',
        importPath: '@/components/fields/CurrencyField'
      },
    },
  },
}
```

## Component Requirements

Custom components must follow React Admin's component interface:

### Form Component Requirements

```typescript
import { InputProps } from 'react-admin';

interface CustomInputProps extends InputProps {
  source: string;       // Field name
  label?: string;       // Display label
  disabled?: boolean;   // Disable input
  readOnly?: boolean;   // Read-only mode
}

export const CustomInput: React.FC<CustomInputProps> = (props) => {
  // Must use useInput hook
  const { field, fieldState } = useInput(props);

  // Return JSX with field spread
  return <input {...field} />;
};
```

### Display Component Requirements

```typescript
import { FieldProps } from 'react-admin';

interface CustomFieldProps extends FieldProps {
  source: string;     // Field name
  label?: string;     // Display label
}

export const CustomField: React.FC<CustomFieldProps> = (props) => {
  // Must use useRecordContext hook
  const record = useRecordContext();
  const value = record?.[props.source];

  // Return JSX with value
  return <span>{value}</span>;
};
```

## Best Practices

### 1. Maintain Component Interface

Always accept and use the same props as React Admin components:

```typescript
// ✅ Good
export const CustomInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);
  return <input {...field} />;
};

// ❌ Bad - doesn't accept InputProps
export const CustomInput = () => {
  return <input />;
};
```

### 2. Handle All Field States

Support all field states (error, touched, dirty):

```typescript
export const CustomInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);

  return (
    <div>
      <input
        {...field}
        className={fieldState.error ? 'border-red-500' : 'border-gray-300'}
      />
      {fieldState.error && (
        <span className="text-red-600">{fieldState.error.message}</span>
      )}
      {fieldState.dirty && <span className="text-blue-500">Modified</span>}
    </div>
  );
};
```

### 3. Support Disabled and ReadOnly

Respect the disabled and readOnly props:

```typescript
export const CustomInput: React.FC<InputProps> = (props) => {
  const { field } = useInput(props);

  return (
    <input
      {...field}
      disabled={props.disabled}
      readOnly={props.readOnly}
    />
  );
};
```

### 4. Provide Consistent Styling

Maintain visual consistency across all custom components:

```typescript
// Create a shared styles object
const inputStyles = {
  base: 'w-full px-3 py-2 border rounded-md',
  normal: 'border-gray-300',
  error: 'border-red-500',
  disabled: 'bg-gray-100 cursor-not-allowed',
};

export const CustomInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);

  const className = [
    inputStyles.base,
    fieldState.error ? inputStyles.error : inputStyles.normal,
    props.disabled ? inputStyles.disabled : '',
  ].join(' ');

  return <input {...field} className={className} />;
};
```

### 5. Test with Different Field Types

Test custom components with various field configurations:

```typescript
// Test with required fields
<CustomInput source="name" label="Name" required />

// Test with optional fields
<CustomInput source="nickname" label="Nickname" />

// Test with disabled state
<CustomInput source="id" label="ID" disabled />

// Test with default values
<CustomInput source="status" label="Status" defaultValue="active" />
```

## Troubleshooting

### Component Not Being Used

If your custom component isn't being used after configuration:

1. **Check the import path** - Ensure it matches your project structure
2. **Verify the component name** - Must match the exported name
3. **Regenerate pages** - Run `tgraph dashboard` to apply changes
4. **Check console** - Look for import errors in browser console

### TypeScript Errors

If you get TypeScript errors:

```typescript
// Add proper type imports
import type { InputProps } from 'react-admin';

// Extend props if needed
interface CustomInputProps extends InputProps {
  customProp?: string;
}

export const CustomInput: React.FC<CustomInputProps> = (props) => {
  // ...
};
```

### Component Not Rendering

If the component renders but doesn't work:

1. **Check useInput hook** - Must be called with props
2. **Spread field object** - `<input {...field} />`
3. **Check value handling** - Some inputs need special handling (checkboxes, selects)

## Advanced Usage

### Conditional Component Logic

```typescript
export const ConditionalInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);
  const record = useRecordContext();

  // Show different input based on another field
  if (record?.type === 'email') {
    return <input {...field} type="email" />;
  }

  return <input {...field} type="text" />;
};
```

### Composite Components

```typescript
export const AddressInput: React.FC<InputProps> = (props) => {
  return (
    <div className="space-y-2">
      <TextInput source={`${props.source}.street`} label="Street" />
      <TextInput source={`${props.source}.city`} label="City" />
      <TextInput source={`${props.source}.zip`} label="ZIP" />
    </div>
  );
};
```

## Related

- [Configuration Reference](../api/configuration.md) - Full config options
- [Authentication Guards](./authentication-guards.md) - Configure guards
- [Field Directives](./field-directives.md) - Control field generation
