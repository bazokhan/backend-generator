---
layout: default
title: Custom Components
parent: Recipes
nav_order: 7
---

# Custom Components Recipe

Create and use custom React Admin components in generated dashboard pages.

## Use Case

Replace default React Admin components with custom implementations to:
- Match your design system
- Add business logic
- Integrate third-party libraries
- Improve user experience

## Step 1: Create Component Directory

```bash
mkdir -p src/dashboard/src/components/custom
```

## Step 2: Create Custom Components

### Custom Text Input with Character Count

```typescript
// src/dashboard/src/components/custom/CharCountTextInput.tsx
import React, { useState } from 'react';
import { useInput, InputProps } from 'react-admin';

export const CharCountTextInput: React.FC<InputProps & { maxLength?: number }> = (props) => {
  const { field, fieldState } = useInput(props);
  const [charCount, setCharCount] = useState(field.value?.length || 0);
  const maxLength = props.maxLength || 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharCount(e.target.value.length);
    field.onChange(e);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {props.label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        {...field}
        onChange={handleChange}
        type="text"
        maxLength={maxLength}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
          ${fieldState.error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
          ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        disabled={props.disabled}
        readOnly={props.readOnly}
      />
      
      <div className="mt-1 flex justify-between items-center">
        {fieldState.error && (
          <span className="text-sm text-red-600">{fieldState.error.message}</span>
        )}
        <span className={`text-sm ml-auto ${charCount > maxLength * 0.9 ? 'text-red-600' : 'text-gray-500'}`}>
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
};
```

### Custom Currency Input

```typescript
// src/dashboard/src/components/custom/CurrencyInput.tsx
import React from 'react';
import { useInput, InputProps } from 'react-admin';

export const CurrencyInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numValue || 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    field.onChange(value ? parseFloat(value) : 0);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {props.label}
      </label>
      
      <div className="relative">
        <span className="absolute left-3 top-2 text-gray-500">$</span>
        <input
          {...field}
          onChange={handleChange}
          type="text"
          inputMode="decimal"
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </div>
      
      {fieldState.error && (
        <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
      )}
      
      {field.value > 0 && (
        <p className="mt-1 text-sm text-gray-500">
          Formatted: {formatCurrency(field.value)}
        </p>
      )}
    </div>
  );
};
```

### Custom Image Upload with Preview

```typescript
// src/dashboard/src/components/custom/ImageUploadInput.tsx
import React, { useState } from 'react';
import { useInput, InputProps } from 'react-admin';

export const ImageUploadInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);
  const [preview, setPreview] = useState<string>(field.value || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Set field value (you might want to upload to server here)
      field.onChange(file);
    }
  };

  const handleRemove = () => {
    setPreview('');
    field.onChange(null);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {props.label}
      </label>
      
      <div className="space-y-2">
        {preview && (
          <div className="relative inline-block">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-32 h-32 object-cover rounded-md border-2 border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1
                         hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
        />
      </div>
      
      {fieldState.error && (
        <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
      )}
    </div>
  );
};
```

### Custom Status Badge Field

```typescript
// src/dashboard/src/components/custom/StatusBadgeField.tsx
import React from 'react';
import { useRecordContext, FieldProps } from 'react-admin';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800',
};

export const StatusBadgeField: React.FC<FieldProps> = (props) => {
  const record = useRecordContext();
  const value = record?.[props.source];

  if (!value) {
    return <span className="text-gray-400">—</span>;
  }

  const colorClass = statusColors[value.toLowerCase()] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
      {value.toUpperCase()}
    </span>
  );
};
```

## Step 3: Configure Components

Update `tgraph.config.ts`:

```typescript
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  // ... other config
  
  dashboard: {
    enabled: true,
    updateDataProvider: true,
    components: {
      form: {
        TextInput: {
          name: 'CharCountTextInput',
          importPath: '@/components/custom/CharCountTextInput'
        },
        NumberInput: {
          name: 'CurrencyInput',
          importPath: '@/components/custom/CurrencyInput'
        },
        FileInput: {
          name: 'ImageUploadInput',
          importPath: '@/components/custom/ImageUploadInput'
        },
      },
      display: {
        TextField: {
          name: 'StatusBadgeField',
          importPath: '@/components/custom/StatusBadgeField'
        },
      },
    },
  },
};
```

## Step 4: Generate Dashboard

```bash
tgraph dashboard
```

## Step 5: Verify Generated Code

Check generated files use your custom components:

```typescript
// src/dashboard/src/resources/users/UserCreate.tsx
import React from 'react';
import { CharCountTextInput, CurrencyInput, ImageUploadInput } from '@/components/custom/CharCountTextInput';
import { Create, SimpleForm } from '@/components/admin';

export const UserCreate: React.FC = () => (
  <Create>
    <SimpleForm>
      <CharCountTextInput source="name" label="Name" />
      <CurrencyInput source="salary" label="Salary" />
      <ImageUploadInput source="avatar" label="Avatar" />
    </SimpleForm>
  </Create>
);
```

## Advanced Examples

### Multi-Select with Chips

```typescript
// src/dashboard/src/components/custom/ChipSelectInput.tsx
import React from 'react';
import { useInput, InputProps } from 'react-admin';

interface ChipSelectInputProps extends InputProps {
  choices: Array<{ id: string; name: string }>;
}

export const ChipSelectInput: React.FC<ChipSelectInputProps> = (props) => {
  const { field } = useInput(props);
  const selectedValues = field.value || [];

  const toggleValue = (id: string) => {
    const newValues = selectedValues.includes(id)
      ? selectedValues.filter((v: string) => v !== id)
      : [...selectedValues, id];
    field.onChange(newValues);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {props.label}
      </label>
      
      <div className="flex flex-wrap gap-2">
        {props.choices.map((choice) => {
          const isSelected = selectedValues.includes(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => toggleValue(choice.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${isSelected 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {choice.name}
              {isSelected && (
                <span className="ml-2">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

### Rich Text Editor

{% raw %}
```typescript
// src/dashboard/src/components/custom/RichTextInput.tsx
import React from 'react';
import { useInput, InputProps } from 'react-admin';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export const RichTextInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {props.label}
      </label>
      
      <ReactQuill
        value={field.value || ''}
        onChange={field.onChange}
        theme="snow"
        modules={{
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ],
        }}
      />
      
      {fieldState.error && (
        <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
      )}
    </div>
  );
};
```
{% endraw %}

Install dependencies:

```bash
npm install react-quill
npm install --save-dev @types/react-quill
```

### Date Range Picker

```typescript
// src/dashboard/src/components/custom/DateRangeInput.tsx
import React from 'react';
import { useInput, InputProps } from 'react-admin';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const DateRangeInput: React.FC<InputProps> = (props) => {
  const { field } = useInput(props);
  const [startDate, endDate] = field.value || [null, null];

  const handleChange = (dates: [Date | null, Date | null]) => {
    field.onChange(dates);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {props.label}
      </label>
      
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        dateFormat="yyyy-MM-dd"
        placeholderText="Select date range"
      />
    </div>
  );
};
```

## Testing Custom Components

### Unit Test

```typescript
// CharCountTextInput.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CharCountTextInput } from './CharCountTextInput';
import { Form } from 'react-admin';

describe('CharCountTextInput', () => {
  it('displays character count', () => {
    render(
      <Form>
        <CharCountTextInput source="name" label="Name" maxLength={10} />
      </Form>
    );

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('shows error when exceeding max length', () => {
    render(
      <Form>
        <CharCountTextInput source="name" label="Name" maxLength={5} />
      </Form>
    );

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'Hello World' } });

    // Input should be truncated
    expect(input.value).toBe('Hello');
  });
});
```

## Best Practices

### 1. Consistent Component Interface

Always accept and use React Admin's props:

```typescript
export const CustomInput: React.FC<InputProps> = (props) => {
  const { field, fieldState } = useInput(props);
  // ... implementation
};
```

### 2. Error Handling

Always display validation errors:

```typescript
{fieldState.error && (
  <p className="text-red-600">{fieldState.error.message}</p>
)}
```

### 3. Accessibility

Add proper labels and ARIA attributes:

```typescript
<label htmlFor={props.source} className="...">
  {props.label}
</label>
<input
  id={props.source}
  aria-label={props.label}
  aria-invalid={!!fieldState.error}
  {...field}
/>
```

### 4. Responsive Design

Make components mobile-friendly:

```typescript
<div className="mb-4 w-full md:w-1/2 lg:w-1/3">
  {/* Component content */}
</div>
```

### 5. Loading States

Show loading indicators for async operations:

```typescript
{isLoading && (
  <div className="flex items-center gap-2">
    <span className="spinner" />
    <span>Loading...</span>
  </div>
)}
```

## Component Library

Create an index file for easy imports:

```typescript
// src/dashboard/src/components/custom/index.ts
export { CharCountTextInput } from './CharCountTextInput';
export { CurrencyInput } from './CurrencyInput';
export { ImageUploadInput } from './ImageUploadInput';
export { StatusBadgeField } from './StatusBadgeField';
export { ChipSelectInput } from './ChipSelectInput';
export { RichTextInput } from './RichTextInput';
export { DateRangeInput } from './DateRangeInput';
```

Update config to use index imports:

```typescript
dashboard: {
  components: {
    form: {
      TextInput: {
        name: 'CharCountTextInput',
        importPath: '@/components/custom'  // Import from index
      },
    },
  },
}
```

## Related

- [Component Customization Guide](../guides/component-customization.md) - Detailed guide
- [Configuration Reference](../api/configuration.md) - Full config options
- [Multiple APIs](./multiple-apis.md) - Generate multiple APIs

