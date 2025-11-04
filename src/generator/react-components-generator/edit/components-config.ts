import type { PrismaModel, PrismaField } from '@tg-scripts/types';
import { getResourceName } from '../../utils';

type ComponentFieldConfig = {
  components: string[];
  field: (
    field: PrismaField,
    enumValues?: string[],
    relatedModel?: PrismaModel,
    model?: PrismaModel,
    allModels?: PrismaModel[],
  ) => string;
};

type InputPropOptions = {
  source?: string | undefined;
  extra?: string[] | undefined;
};

const buildInputProps = (field: PrismaField, options: InputPropOptions = {}): string => {
  const props = [`source="${options.source ?? field.name}"`, ...(options.extra ?? [])];
  if (field.tgReadOnly) {
    props.push('disabled');
    props.push('readOnly');
  }
  return props.join(' ');
};

export const FormComponentRelationField: ComponentFieldConfig = {
  components: ['ReferenceInput', 'ReferenceArrayInput', 'AutocompleteInput', 'AutocompleteArrayInput'],
  field: (
    field: PrismaField,
    enumValues?: string[],
    relatedModel?: PrismaModel,
    model?: PrismaModel,
    allModels?: PrismaModel[],
  ) => {
    const indent = '      ';
    const reference = getResourceName(field.baseType);
    const optionText = (allModels?.find((m) => m.name === field.baseType) || model)?.displayField;
    if (field.isArray) {
      return `${indent}<ReferenceArrayInput ${buildInputProps(field)} reference="${reference}">\n${indent}  <AutocompleteArrayInput optionText="${optionText}" />\n${indent}</ReferenceArrayInput>`;
    }
    // Prefer binding to the foreign key (e.g., iconId) when available
    const fkName = field.foreignKeyName || field.name;
    return `${indent}<ReferenceInput ${buildInputProps(field, { source: fkName })} reference="${reference}">\n${indent}  <AutocompleteInput optionText="${optionText}" />\n${indent}</ReferenceInput>`;
  },
};

export const FormComponentEnumField: ComponentFieldConfig = {
  components: ['SelectInput'],
  field: (field: PrismaField, enumValues?: string[]) => {
    const indent = '      ';
    if (!enumValues) throw new Error(`Enum values not found for ${field.baseType}`);
    const choices = enumValues.map((v) => `{ id: '${v}', name: '${v}' }`);
    return `${indent}<SelectInput ${buildInputProps(field)} choices={[${choices.join(', ')}]} />`;
  },
};

export const FormComponentBooleanField: ComponentFieldConfig = {
  components: ['BooleanInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<BooleanInput ${buildInputProps(field)} />`;
  },
};

export const FormComponentNumberField: ComponentFieldConfig = {
  components: ['NumberInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<NumberInput ${buildInputProps(field)} />`;
  },
};

export const FormComponentDateTimeField: ComponentFieldConfig = {
  components: ['DateTimeInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<DateTimeInput ${buildInputProps(field)} />`;
  },
};

export const FormComponentJsonField: ComponentFieldConfig = {
  components: ['JsonInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<JsonInput ${buildInputProps(field)} />`;
  },
};

export const FormComponentBytesField: ComponentFieldConfig = {
  components: ['FileInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<FileInput ${buildInputProps(field)} />`;
  },
};

export const FormComponentUrlField: ComponentFieldConfig = {
  components: ['UrlInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<UrlInput ${buildInputProps(field)} />`;
  },
};

export const FormComponentEmailField: ComponentFieldConfig = {
  components: ['TextInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<TextInput ${buildInputProps(field, { extra: ['type="email"'] })} />`;
  },
};

export const FormComponentPasswordField: ComponentFieldConfig = {
  components: ['TextInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<TextInput ${buildInputProps(field, { extra: ['type="password"'] })} />`;
  },
};

export const FormComponentTelField: ComponentFieldConfig = {
  components: ['TextInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<TextInput ${buildInputProps(field, { extra: ['type="tel"'] })} />`;
  },
};

export const FormComponentStringField: ComponentFieldConfig = {
  components: ['TextInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<TextInput ${buildInputProps(field)} />`;
  },
};

export const FormComponentFileUploadField: ComponentFieldConfig = {
  components: ['FileInput'],
  field: (field: PrismaField) => {
    const indent = '      ';
    const accept = field.tgUpload === 'image' ? ' accept={{ "image/*": [] }}' : '';
    return `${indent}<FileInput ${buildInputProps(field)}${accept} />`;
  },
};
