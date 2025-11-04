import type { PrismaField } from '@tg-scripts/types';
import { getResourceName } from '../../utils';

type ComponentFieldConfig = {
  components: string[];
  field: (field: PrismaField, enumValues?: string[]) => string;
};

export const ShowComponentRelationField: ComponentFieldConfig = {
  components: ['RecordField', 'ReferenceField'],
  field: (field: PrismaField) => {
    const indent = '      ';
    const reference = getResourceName(field.baseType);
    return `${indent}<RecordField source="${field.name}">\n${indent}  <ReferenceField source="${field.name}" reference="${reference}" link="show" />\n${indent}</RecordField>`;
  },
};

export const ShowComponentEnumField: ComponentFieldConfig = {
  components: ['RecordField', 'SelectField'],
  field: (field: PrismaField, enumValues?: string[]) => {
    const indent = '      ';
    if (!enumValues) throw new Error(`Enum values not found for ${field.baseType}`);
    const choices = enumValues.map((v) => `{ id: '${v}', name: '${v}' }`);
    return `${indent}<RecordField source="${field.name}">\n${indent}  <SelectField source="${field.name}" choices={[${choices.join(', ')}]} />\n${indent}</RecordField>`;
  },
};

export const ShowComponentDateTimeField: ComponentFieldConfig = {
  components: ['RecordField', 'DateField'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<RecordField source="${field.name}">\n${indent}  <DateField source="${field.name}" showTime={true} />\n${indent}</RecordField>`;
  },
};

export const ShowComponentBooleanField: ComponentFieldConfig = {
  components: ['RecordField', 'BooleanField'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<RecordField source="${field.name}">\n${indent}  <BooleanField source="${field.name}" />\n${indent}</RecordField>`;
  },
};

export const ShowComponentNumberField: ComponentFieldConfig = {
  components: ['RecordField', 'NumberField'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<RecordField source="${field.name}">\n${indent}  <NumberField source="${field.name}" />\n${indent}</RecordField>`;
  },
};

export const ShowComponentJsonField: ComponentFieldConfig = {
  components: ['RecordField', 'JsonField'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<RecordField source="${field.name}">\n${indent}  <JsonField source="${field.name}" />\n${indent}</RecordField>`;
  },
};

export const ShowComponentBytesField: ComponentFieldConfig = {
  components: ['RecordField', 'FileField'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<RecordField source="${field.name}">\n${indent}  <FileField source="${field.name}" />\n${indent}</RecordField>`;
  },
};

export const ShowComponentUrlField: ComponentFieldConfig = {
  components: ['RecordField', 'UrlField'],
  field: (field: PrismaField) => {
    const indent = '      ';
    return `${indent}<RecordField source="${field.name}">\n${indent}  <UrlField source="${field.name}" />\n${indent}</RecordField>`;
  },
};

export const ShowComponentStringField: ComponentFieldConfig = {
  components: ['RecordField', 'TextField'],
  field: (field: PrismaField) => {
    const indent = '      ';
    // Check if this is an image upload field
    if (field.tgUpload === 'image') {
      return `${indent}<RecordField source="${field.name}">\n${indent}  <ImageField source="${field.name}" />\n${indent}</RecordField>`;
    }
    return `${indent}<RecordField source="${field.name}">\n${indent}  <TextField source="${field.name}" />\n${indent}</RecordField>`;
  },
};
