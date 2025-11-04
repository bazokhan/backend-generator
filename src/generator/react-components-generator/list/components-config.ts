import type { PrismaModel, PrismaField } from '@tg-scripts/types';
import { getResourceName } from '../../utils';

type ComponentFieldConfig = {
  components: string[];
  field: (field: PrismaField, enumValues?: string[], relatedModel?: PrismaModel) => string;
};

export const ListComponentRelationField: ComponentFieldConfig = {
  components: ['DataTable', 'ReferenceField', 'TextField'],
  field: (field: PrismaField, enumValues?: string[], relatedModel?: PrismaModel) => {
    if (!relatedModel) throw new Error(`Related model not found for ${field.baseType}`);
    const reference = getResourceName(field.baseType);
    return `<DataTable.Col source="${field.foreignKeyName}">
          <ReferenceField source="${field.foreignKeyName}" reference="${reference}">
            <TextField source="${relatedModel.displayField}" />
          </ReferenceField>
        </DataTable.Col>`;
  },
};

export const ListComponentEnumField: ComponentFieldConfig = {
  components: ['DataTable', 'SelectField'],
  field: (field: PrismaField, enumValues?: string[]) => {
    if (!enumValues) throw new Error(`Enum values not found for ${field.baseType}`);
    const choices = enumValues.map((v) => `{ id: '${v}', name: '${v}' }`);
    return `<DataTable.Col source="${field.name}">
      <SelectField source="${field.name}" choices={[${choices.join(', ')}]} />
    </DataTable.Col>`;
  },
};

export const ListComponentDateTimeField: ComponentFieldConfig = {
  components: ['DataTable', 'DateField'],
  field: (field: PrismaField) => {
    return `<DataTable.Col source="${field.name}">
      <DateField source="${field.name}" />
    </DataTable.Col>`;
  },
};

export const ListComponentBooleanField: ComponentFieldConfig = {
  components: ['DataTable', 'BooleanField'],
  field: (field: PrismaField) => {
    return `<DataTable.Col source="${field.name}">
      <BooleanField source="${field.name}" />
    </DataTable.Col>`;
  },
};

export const ListComponentNumberField: ComponentFieldConfig = {
  components: ['DataTable', 'NumberField'],
  field: (field: PrismaField) => {
    return `<DataTable.Col source="${field.name}">
      <NumberField source="${field.name}" />
    </DataTable.Col>`;
  },
};

export const ListComponentJsonField: ComponentFieldConfig = {
  components: ['DataTable', 'JsonField'],
  field: (field: PrismaField) => {
    return `<DataTable.Col source="${field.name}">
      <JsonField source="${field.name}" />
    </DataTable.Col>`;
  },
};

export const ListComponentBytesField: ComponentFieldConfig = {
  components: ['DataTable', 'FileField'],
  field: (field: PrismaField) => {
    return `<DataTable.Col source="${field.name}">
      <FileField source="${field.name}" />
    </DataTable.Col>`;
  },
};

export const ListComponentStringField: ComponentFieldConfig = {
  components: ['DataTable', 'TextField'],
  field: (field: PrismaField) => {
    return `<DataTable.Col source="${field.name}">
      <TextField source="${field.name}" />
    </DataTable.Col>`;
  },
};

export const ListComponentUrlField: ComponentFieldConfig = {
  components: ['DataTable', 'UrlField'],
  field: (field: PrismaField) => {
    return `<DataTable.Col source="${field.name}">
      <UrlField source="${field.name}" />
    </DataTable.Col>`;
  },
};
