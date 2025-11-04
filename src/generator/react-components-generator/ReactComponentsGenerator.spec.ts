import { ReactComponentsGenerator } from './ReactComponentsGenerator';
import {
  FormComponentRelationField,
  FormComponentEnumField,
  FormComponentBooleanField,
  FormComponentNumberField,
  FormComponentDateTimeField,
  FormComponentJsonField,
  FormComponentBytesField,
  FormComponentUrlField,
  FormComponentEmailField,
  FormComponentPasswordField,
  FormComponentTelField,
  FormComponentFileUploadField,
  FormComponentStringField,
} from './edit/components-config';
import {
  ShowComponentRelationField,
  ShowComponentEnumField,
  ShowComponentDateTimeField,
  ShowComponentBooleanField,
  ShowComponentNumberField,
  ShowComponentJsonField,
  ShowComponentBytesField,
  ShowComponentUrlField,
  ShowComponentStringField,
} from './show/components-config';
import {
  ListComponentRelationField,
  ListComponentEnumField,
  ListComponentDateTimeField,
  ListComponentBooleanField,
  ListComponentNumberField,
  ListComponentJsonField,
  ListComponentBytesField,
  ListComponentUrlField,
  ListComponentStringField,
} from './list/components-config';
import type { PrismaModel, PrismaField } from '@tg-scripts/types';
import { PrismaRelationsParser } from '../../parser/prisma-relation-parser/PrismaRelationsParser';

function makeField(partial: Partial<PrismaField>): PrismaField {
  // Compute baseType from type (remove [] and ?)
  const type = partial.type || 'String';
  let computedBaseType = type.trim();
  computedBaseType = computedBaseType.replace(/\?$/, '');
  computedBaseType = computedBaseType.replace(/\[\]$/, '');

  return {
    name: 'field',
    type: 'String',
    isOptional: false,
    isArray: false,
    isId: false,
    isUnique: false,
    hasDefaultValue: false,
    customValidations: [],
    ...partial,
    // Always set baseType - use provided one or compute from type
    baseType: partial.baseType ?? computedBaseType,
  };
}

function makeModel(name: string, fields: PrismaField[]): PrismaModel {
  // Compute displayField (first non-id String field, or 'id')
  let displayField = 'id';
  for (const field of fields) {
    if (field.baseType === 'String' && !field.isId && !field.isArray) {
      displayField = field.name;
      break;
    }
  }

  return {
    name,
    fields,
    enums: [],
    moduleType: 'features' as any,
    displayField,
  };
}

const createMockField = (name: string, type: string, isId = false, isEnum = false): PrismaField => {
  // Compute baseType from type (remove [] and ?)
  let baseType = type.trim();
  baseType = baseType.replace(/\?$/, '');
  baseType = baseType.replace(/\[\]$/, '');

  return {
    name,
    type,
    isOptional: false,
    isArray: false,
    isId,
    isUnique: false,
    hasDefaultValue: false,
    customValidations: [],
    baseType,
    isEnum,
  };
};

const createMockModel = (name: string): PrismaModel => ({
  name,
  fields: [],
  enums: [],
  modulePath: `/path/to/${name.toLowerCase()}`,
  moduleType: 'features',
  displayField: 'id',
});

const emptyEnums = new Map<string, string[]>();

describe('ReactComponentsGenerator', () => {
  const generator = new ReactComponentsGenerator();

  describe('relation FK handling', () => {
    const iconModel = makeModel('Icon', [
      makeField({ name: 'id', type: 'String', isId: true }),
      makeField({ name: 'name', type: 'String' }),
    ]);

    const projectTypeModel = makeModel('ProjectType', [
      makeField({ name: 'key', type: 'String' }),
      makeField({
        name: 'icon',
        type: 'Icon',
        relationName: 'IconOnProjectType',
        isRelation: true,
        foreignKeyName: 'iconId',
      }),
      makeField({ name: 'iconId', type: 'String' }),
    ]);

    const allModels = [projectTypeModel, iconModel];
    const enums = new Map<string, string[]>();

    // Run parser to set isRelation, foreignKeyName, etc.
    const parser = new PrismaRelationsParser();
    parser.parse({ models: allModels, enums });

    it('binds ReferenceInput to the foreign key when available', () => {
      const relationField = projectTypeModel.fields.find((f) => f.name === 'icon')!;
      const code = FormComponentRelationField.field(relationField, undefined, iconModel, projectTypeModel, allModels);
      expect(code).toContain('ReferenceInput');
      expect(code).toContain('source="iconId"');
      expect(code).toContain('reference="icons"');
    });

    it('ComponentCreate uses ReferenceInput on *_Id and does not include duplicate TextInput', () => {
      const result = generator.generate({
        pages: ['create'],
        model: projectTypeModel,
        parsedSchema: { models: allModels, enums },
      });

      const code = result.create?.content || '';
      expect(code).toContain('<ReferenceInput');
      expect(code).toContain('source="iconId"');
      expect(code).not.toContain('<TextInput source="iconId"');
    });

    it('falls back to relation field name if FK does not exist', () => {
      const modelNoFk = makeModel('Post', [
        makeField({ name: 'title', type: 'String' }),
        makeField({ name: 'author', type: 'User', relationName: 'UserOnPost', isRelation: true }),
      ]);
      const userModel = makeModel('User', [makeField({ name: 'id', type: 'String', isId: true })]);
      const code = FormComponentRelationField.field(
        modelNoFk.fields.find((f) => f.name === 'author')!,
        undefined,
        userModel,
        modelNoFk,
        [modelNoFk, userModel],
      );
      expect(code).toContain('ReferenceInput');
      expect(code).toContain('source="author"');
    });
  });

  describe('List component generation', () => {
    it('should generate list component for simple model', () => {
      const model = createMockModel('User');
      model.fields = [
        createMockField('name', 'String'),
        createMockField('email', 'String'),
        createMockField('role', 'Role'),
      ];

      const result = generator.generate({
        pages: ['list'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.list?.content || '';
      expect(content).toContain('export const UserList');
      expect(content).toContain('<DataTable>');
      expect(content).toContain('<DataTable.Col source="name">');
      expect(content).toContain('<TextField source="name" />');
      expect(content).toContain('<DataTable.Col source="email">');
      expect(content).toContain('<TextField source="email" />');
      expect(content).toContain('<DataTable.Col source="role">');
      expect(content).toContain('<TextField source="role" />');
      expect(result.list?.fileName).toBe('UserList.tsx');
    });

    it('should exclude id fields from list', () => {
      const model = createMockModel('Product');
      model.fields = [
        createMockField('id', 'String', true),
        createMockField('name', 'String'),
        createMockField('price', 'Int'),
      ];

      const result = generator.generate({
        pages: ['list'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.list?.content || '';
      expect(content).not.toContain('source="id"');
      expect(content).toContain('source="name"');
      expect(content).toContain('source="price"');
    });

    it('should match snapshot', () => {
      const model = createMockModel('Project');
      model.fields = [
        createMockField('id', 'String', true),
        createMockField('title', 'String'),
        createMockField('description', 'String'),
        createMockField('status', 'String'),
      ];

      const result = generator.generate({
        pages: ['list'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      expect(result.list?.content).toMatchSnapshot();
    });
  });

  describe('Edit component generation', () => {
    it('should generate edit component with correct imports', () => {
      const model = createMockModel('User');
      model.fields = [
        createMockField('name', 'String'),
        createMockField('email', 'String'),
        createMockField('active', 'Boolean'),
      ];

      const result = generator.generate({
        pages: ['edit'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.edit?.content || '';
      expect(content).toContain('export const UserEdit');
      expect(content).toContain('BooleanInput');
      expect(content).toContain('<Edit>');
      expect(content).toContain('<SimpleForm>');
      expect(result.edit?.fileName).toBe('UserEdit.tsx');
    });

    it('should exclude timestamp fields', () => {
      const model = createMockModel('Post');
      model.fields = [
        createMockField('title', 'String'),
        createMockField('createdAt', 'DateTime'),
        createMockField('updatedAt', 'DateTime'),
      ];

      const result = generator.generate({
        pages: ['edit'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.edit?.content || '';
      expect(content).not.toContain('source="createdAt"');
      expect(content).not.toContain('source="updatedAt"');
    });

    it('should match snapshot', () => {
      const model = createMockModel('Task');
      model.fields = [
        createMockField('title', 'String'),
        createMockField('completed', 'Boolean'),
        createMockField('dueDate', 'DateTime'),
      ];

      const result = generator.generate({
        pages: ['edit'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      expect(result.edit?.content).toMatchSnapshot();
    });
  });

  describe('Create component generation', () => {
    it('should generate create component', () => {
      const model = createMockModel('Category');
      model.fields = [createMockField('name', 'String'), createMockField('description', 'String')];

      const result = generator.generate({
        pages: ['create'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.create?.content || '';
      expect(content).toContain('export const CategoryCreate');
      expect(content).toContain('<Create>');
      expect(result.create?.fileName).toBe('CategoryCreate.tsx');
    });

    it('should match snapshot', () => {
      const model = createMockModel('Comment');
      model.fields = [createMockField('content', 'String'), createMockField('published', 'Boolean')];

      const result = generator.generate({
        pages: ['create'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      expect(result.create?.content).toMatchSnapshot();
    });
  });

  describe('Show component generation', () => {
    it('should generate show component with all fields', () => {
      const model = createMockModel('Product');
      model.fields = [
        createMockField('name', 'String'),
        createMockField('price', 'Int'),
        createMockField('inStock', 'Boolean'),
        createMockField('createdAt', 'DateTime'),
      ];

      const result = generator.generate({
        pages: ['show'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.show?.content || '';
      expect(content).toContain('export const ProductShow');
      expect(content).toContain('<Show>');
      expect(content).toContain('DateField');
      expect(content).toContain('BooleanField');
      expect(result.show?.fileName).toBe('ProductShow.tsx');
    });

    it('should match snapshot', () => {
      const model = createMockModel('Invoice');
      model.fields = [
        createMockField('number', 'String'),
        createMockField('amount', 'Float'),
        createMockField('paid', 'Boolean'),
        createMockField('createdAt', 'DateTime'),
      ];

      const result = generator.generate({
        pages: ['show'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      expect(result.show?.content).toMatchSnapshot();
    });
  });

  describe('Studio component generation', () => {
    it('should generate studio component', () => {
      const model = createMockModel('Product');
      model.fields = [
        createMockField('id', 'String', true),
        createMockField('name', 'String'),
        createMockField('price', 'Int'),
      ];

      const result = generator.generate({
        pages: ['studio'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.studio?.content || '';
      expect(content).toContain('export const ProductStudio');
      expect(content).toContain('<List title="Product Studio">');
      expect(content).toContain('<DataSheet');
      expect(result.studio?.fileName).toBe('ProductStudio.tsx');
    });
  });

  describe('Form field components', () => {
    it('should generate BooleanInput for boolean fields', () => {
      const field = createMockField('active', 'Boolean');
      const model = createMockModel('X');
      const result = generator.generate({
        pages: ['edit'],
        model: { ...model, fields: [field] },
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.edit?.content || '';
      expect(content).toContain('<BooleanInput');
      expect(content).toContain('source="active"');
    });

    it('should generate DateTimeInput for DateTime', () => {
      const field = createMockField('startDate', 'DateTime');
      const model = createMockModel('X');
      const result = generator.generate({
        pages: ['edit'],
        model: { ...model, fields: [field] },
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.edit?.content || '';
      expect(content).toContain('<DateTimeInput');
    });

    it('should generate TextInput for String fields', () => {
      const field = createMockField('name', 'String');
      const model = createMockModel('X');
      const result = generator.generate({
        pages: ['edit'],
        model: { ...model, fields: [field] },
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.edit?.content || '';
      expect(content).toContain('<TextInput');
      expect(content).toContain('source="name"');
    });
  });

  describe('Show field components', () => {
    it('should generate DateField for DateTime fields', () => {
      const field = createMockField('createdAt', 'DateTime');
      const model = createMockModel('X');
      const result = generator.generate({
        pages: ['show'],
        model: { ...model, fields: [field] },
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.show?.content || '';
      expect(content).toContain('<DateField');
    });

    it('should generate BooleanField for Boolean fields', () => {
      const field = createMockField('published', 'Boolean');
      const model = createMockModel('X');
      const result = generator.generate({
        pages: ['show'],
        model: { ...model, fields: [field] },
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.show?.content || '';
      expect(content).toContain('<BooleanField');
    });

    it('should generate TextField for String fields', () => {
      const field = createMockField('title', 'String');
      const model = createMockModel('X');
      const result = generator.generate({
        pages: ['show'],
        model: { ...model, fields: [field] },
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.show?.content || '';
      expect(content).toContain('<TextField');
    });
  });

  describe('index page generation', () => {
    it('should generate index file with all exports', () => {
      const model = createMockModel('Post');
      const result = generator.generate({
        pages: ['index'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.index?.content || '';
      expect(content).toContain('export { PostList }');
      expect(content).toContain('export { PostEdit }');
      expect(content).toContain('export { PostCreate }');
      expect(content).toContain('export { PostShow }');
      expect(content).toContain('export { PostStudio }');
      expect(result.index?.fileName).toBe('index.ts');
    });

    it('should match snapshot', () => {
      const model = createMockModel('Article');
      const result = generator.generate({
        pages: ['index'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });
      expect(result.index?.content).toMatchSnapshot();
    });
  });

  describe('Component field configs', () => {
    describe('FormComponentRelationField', () => {
      it('should handle relations with foreign keys', () => {
        const iconModel = makeModel('Icon', [makeField({ name: 'name', type: 'String' })]);
        const field = makeField({
          name: 'icon',
          type: 'Icon',
          isRelation: true,
          foreignKeyName: 'iconId',
        });
        const result = FormComponentRelationField.field(field, undefined, iconModel, undefined, [iconModel]);
        expect(result).toContain('ReferenceInput');
        expect(result).toContain('source="iconId"');
      });
    });

    describe('ShowComponentRelationField', () => {
      it('should generate ReferenceField for relations', () => {
        const field = makeField({
          name: 'author',
          type: 'User',
          isRelation: true,
        });
        const result = ShowComponentRelationField.field(field);
        expect(result).toContain('ReferenceField');
        expect(result).toContain('link="show"');
      });
    });

    describe('ListComponentRelationField', () => {
      it('should generate DataTable.Col with ReferenceField for relations', () => {
        const userModel = makeModel('User', [makeField({ name: 'name', type: 'String' })]);
        const field = makeField({
          name: 'author',
          type: 'User',
          isRelation: true,
          foreignKeyName: 'authorId',
        });
        const result = ListComponentRelationField.field(field, undefined, userModel);
        expect(result).toContain('<DataTable.Col');
        expect(result).toContain('ReferenceField');
      });
    });
  });

  describe('Integration tests', () => {
    it('should generate complete resource components for User', () => {
      const model: PrismaModel = {
        name: 'User',
        fields: [
          createMockField('id', 'String', true),
          createMockField('name', 'String'),
          createMockField('email', 'String'),
          createMockField('active', 'Boolean'),
          createMockField('createdAt', 'DateTime'),
        ],
        enums: [],
        modulePath: '/src/features/users',
        moduleType: 'features',
        displayField: 'name',
      };

      const result = generator.generate({
        pages: ['list', 'edit', 'create', 'show', 'studio', 'index'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const list = result.list?.content || '';
      const edit = result.edit?.content || '';
      const create = result.create?.content || '';
      const show = result.show?.content || '';
      const index = result.index?.content || '';

      expect(list).toContain('UserList');
      expect(edit).toContain('UserEdit');
      expect(create).toContain('UserCreate');
      expect(show).toContain('UserShow');
      expect(index).toContain('UserList');

      // Verify fields are handled correctly
      expect(edit).not.toContain('source="id"'); // Should not contain id field
      expect(edit).not.toContain('source="createdAt"'); // Should not contain createdAt field
      expect(list).not.toContain('source="id"'); // Should not contain id field

      // Verify boolean fields use correct components
      expect(edit).toContain('BooleanInput');
      expect(show).toContain('BooleanField');

      // Verify file names
      expect(result.list?.fileName).toBe('UserList.tsx');
      expect(result.edit?.fileName).toBe('UserEdit.tsx');
      expect(result.create?.fileName).toBe('UserCreate.tsx');
      expect(result.show?.fileName).toBe('UserShow.tsx');
      expect(result.studio?.fileName).toBe('UserStudio.tsx');
    });

    it('should use JsonField in generated Show component for Json fields', () => {
      const model = createMockModel('Product');
      model.fields = [
        createMockField('id', 'String', true),
        createMockField('name', 'String'),
        createMockField('metadata', 'Json'),
      ];

      const result = generator.generate({
        pages: ['show'],
        model,
        parsedSchema: { models: [model], enums: emptyEnums },
      });

      const content = result.show?.content || '';
      expect(content).toContain('JsonField');
      expect(content).toContain('import');
      expect(content).toContain('JsonField');
      expect(content).toContain('<JsonField source="metadata" />');
    });
  });

  describe('Snapshot tests - comprehensive field type coverage', () => {
    describe('Edit component snapshots', () => {
      it('should snapshot Edit component with all field types', () => {
        const model = createMockModel('Comprehensive');
        model.fields = [
          createMockField('id', 'String', true),
          createMockField('stringField', 'String'),
          createMockField('booleanField', 'Boolean'),
          createMockField('intField', 'Int'),
          createMockField('floatField', 'Float'),
          createMockField('decimalField', 'Decimal'),
          createMockField('bigIntField', 'BigInt'),
          createMockField('dateTimeField', 'DateTime'),
          createMockField('jsonField', 'Json'),
          createMockField('bytesField', 'Bytes'),
          { ...createMockField('urlField', 'String'), tgFormat: 'url' as const },
          { ...createMockField('emailField', 'String'), tgFormat: 'email' as const },
          { ...createMockField('passwordField', 'String'), tgFormat: 'password' as const },
          { ...createMockField('telField', 'String'), tgFormat: 'tel' as const },
          { ...createMockField('uploadField', 'String'), tgUpload: 'file' as const },
          createMockField('enumField', 'Status', false, true),
          createMockField('createdAt', 'DateTime'),
          createMockField('updatedAt', 'DateTime'),
        ];

        const result = generator.generate({
          pages: ['edit'],
          model,
          parsedSchema: { models: [model], enums: new Map([['Status', ['ACTIVE', 'INACTIVE']]]) },
        });

        expect(result.edit?.content).toMatchSnapshot();
      });

      it('should snapshot Edit component with relation fields', () => {
        const userModel = makeModel('User', [makeField({ name: 'name', type: 'String' })]);
        const categoryModel = makeModel('Category', [makeField({ name: 'name', type: 'String' })]);
        const model = makeModel('Post', [
          makeField({ name: 'title', type: 'String' }),
          makeField({
            name: 'author',
            type: 'User',
            relationName: 'PostToUser',
            isRelation: true,
            foreignKeyName: 'authorId',
          }),
          makeField({ name: 'authorId', type: 'String' }),
          makeField({
            name: 'category',
            type: 'Category',
            relationName: 'PostToCategory',
            isRelation: true,
            foreignKeyName: 'categoryId',
          }),
          makeField({ name: 'categoryId', type: 'String' }),
        ]);

        const parser = new PrismaRelationsParser();
        parser.parse({ models: [model, userModel, categoryModel], enums: emptyEnums });

        const result = generator.generate({
          pages: ['edit'],
          model,
          parsedSchema: { models: [model, userModel, categoryModel], enums: emptyEnums },
        });

        expect(result.edit?.content).toMatchSnapshot();
      });
    });

    describe('Create component snapshots', () => {
      it('should snapshot Create component with all field types', () => {
        const model = createMockModel('ComprehensiveCreate');
        model.fields = [
          createMockField('id', 'String', true),
          createMockField('stringField', 'String'),
          createMockField('booleanField', 'Boolean'),
          createMockField('intField', 'Int'),
          createMockField('floatField', 'Float'),
          createMockField('decimalField', 'Decimal'),
          createMockField('bigIntField', 'BigInt'),
          createMockField('dateTimeField', 'DateTime'),
          createMockField('jsonField', 'Json'),
          createMockField('bytesField', 'Bytes'),
          { ...createMockField('urlField', 'String'), tgFormat: 'url' as const },
          { ...createMockField('emailField', 'String'), tgFormat: 'email' as const },
          { ...createMockField('passwordField', 'String'), tgFormat: 'password' as const },
          { ...createMockField('telField', 'String'), tgFormat: 'tel' as const },
          { ...createMockField('uploadField', 'String'), tgUpload: 'file' as const },
          createMockField('enumField', 'Status', false, true),
          createMockField('createdAt', 'DateTime'),
          createMockField('updatedAt', 'DateTime'),
        ];

        const result = generator.generate({
          pages: ['create'],
          model,
          parsedSchema: { models: [model], enums: new Map([['Status', ['ACTIVE', 'INACTIVE']]]) },
        });

        expect(result.create?.content).toMatchSnapshot();
      });
    });

    describe('List component snapshots', () => {
      it('should snapshot List component with all field types', () => {
        const model = createMockModel('ComprehensiveList');
        model.fields = [
          createMockField('id', 'String', true),
          createMockField('stringField', 'String'),
          createMockField('booleanField', 'Boolean'),
          createMockField('intField', 'Int'),
          createMockField('floatField', 'Float'),
          createMockField('decimalField', 'Decimal'),
          createMockField('bigIntField', 'BigInt'),
          createMockField('dateTimeField', 'DateTime'),
          createMockField('jsonField', 'Json'),
          createMockField('bytesField', 'Bytes'),
          { ...createMockField('urlField', 'String'), tgFormat: 'url' as const },
          createMockField('enumField', 'Status', false, true),
        ];

        const result = generator.generate({
          pages: ['list'],
          model,
          parsedSchema: { models: [model], enums: new Map([['Status', ['ACTIVE', 'INACTIVE']]]) },
        });

        expect(result.list?.content).toMatchSnapshot();
      });

      it('should snapshot List component with relation fields', () => {
        const userModel = makeModel('User', [makeField({ name: 'name', type: 'String' })]);
        const model = makeModel('Post', [
          makeField({ name: 'title', type: 'String' }),
          makeField({
            name: 'author',
            type: 'User',
            relationName: 'PostToUser',
            isRelation: true,
            foreignKeyName: 'authorId',
          }),
          makeField({ name: 'authorId', type: 'String' }),
        ]);

        const parser = new PrismaRelationsParser();
        parser.parse({ models: [model, userModel], enums: emptyEnums });

        const result = generator.generate({
          pages: ['list'],
          model,
          parsedSchema: { models: [model, userModel], enums: emptyEnums },
        });

        expect(result.list?.content).toMatchSnapshot();
      });
    });

    describe('Show component snapshots', () => {
      it('should snapshot Show component with all field types', () => {
        const model = createMockModel('ComprehensiveShow');
        model.fields = [
          createMockField('id', 'String', true),
          createMockField('stringField', 'String'),
          createMockField('booleanField', 'Boolean'),
          createMockField('intField', 'Int'),
          createMockField('floatField', 'Float'),
          createMockField('decimalField', 'Decimal'),
          createMockField('bigIntField', 'BigInt'),
          createMockField('dateTimeField', 'DateTime'),
          createMockField('jsonField', 'Json'),
          createMockField('bytesField', 'Bytes'),
          { ...createMockField('urlField', 'String'), tgFormat: 'url' as const },
          createMockField('enumField', 'Status', false, true),
          createMockField('createdAt', 'DateTime'),
          createMockField('updatedAt', 'DateTime'),
        ];

        const result = generator.generate({
          pages: ['show'],
          model,
          parsedSchema: { models: [model], enums: new Map([['Status', ['ACTIVE', 'INACTIVE']]]) },
        });

        expect(result.show?.content).toMatchSnapshot();
      });

      it('should snapshot Show component with relation fields', () => {
        const userModel = makeModel('User', [makeField({ name: 'name', type: 'String' })]);
        const categoryModel = makeModel('Category', [makeField({ name: 'name', type: 'String' })]);
        const model = makeModel('Post', [
          makeField({ name: 'id', type: 'String', isId: true }),
          makeField({ name: 'title', type: 'String' }),
          makeField({
            name: 'author',
            type: 'User',
            relationName: 'PostToUser',
            isRelation: true,
          }),
          makeField({
            name: 'category',
            type: 'Category',
            relationName: 'PostToCategory',
            isRelation: true,
          }),
        ]);

        const parser = new PrismaRelationsParser();
        parser.parse({ models: [model, userModel, categoryModel], enums: emptyEnums });

        const result = generator.generate({
          pages: ['show'],
          model,
          parsedSchema: { models: [model, userModel, categoryModel], enums: emptyEnums },
        });

        expect(result.show?.content).toMatchSnapshot();
      });
    });

    describe('Component field config snapshots', () => {
      it('should snapshot all form field configs', () => {
        const userModel = makeModel('User', [makeField({ name: 'name', type: 'String' })]);
        const enumValues = ['ACTIVE', 'INACTIVE', 'PENDING'];

        const relationField = makeField({
          name: 'author',
          type: 'User',
          isRelation: true,
          foreignKeyName: 'authorId',
        });

        const enumField = makeField({ name: 'status', type: 'Status', isEnum: true });

        expect(
          FormComponentRelationField.field(relationField, undefined, userModel, undefined, [userModel]),
        ).toMatchSnapshot();
        expect(FormComponentEnumField.field(enumField, enumValues)).toMatchSnapshot();
        expect(FormComponentBooleanField.field(makeField({ name: 'active', type: 'Boolean' }))).toMatchSnapshot();
        expect(FormComponentNumberField.field(makeField({ name: 'age', type: 'Int' }))).toMatchSnapshot();
        expect(FormComponentDateTimeField.field(makeField({ name: 'createdAt', type: 'DateTime' }))).toMatchSnapshot();
        expect(FormComponentJsonField.field(makeField({ name: 'metadata', type: 'Json' }))).toMatchSnapshot();
        expect(FormComponentBytesField.field(makeField({ name: 'attachment', type: 'Bytes' }))).toMatchSnapshot();
        expect(
          FormComponentUrlField.field({ ...makeField({ name: 'website', type: 'String' }), tgFormat: 'url' as const }),
        ).toMatchSnapshot();
        expect(
          FormComponentEmailField.field({
            ...makeField({ name: 'email', type: 'String' }),
            tgFormat: 'email' as const,
          }),
        ).toMatchSnapshot();
        expect(
          FormComponentPasswordField.field({
            ...makeField({ name: 'password', type: 'String' }),
            tgFormat: 'password' as const,
          }),
        ).toMatchSnapshot();
        expect(
          FormComponentTelField.field({ ...makeField({ name: 'phone', type: 'String' }), tgFormat: 'tel' as const }),
        ).toMatchSnapshot();
        expect(
          FormComponentFileUploadField.field({
            ...makeField({ name: 'file', type: 'String' }),
            tgUpload: 'file' as const,
          }),
        ).toMatchSnapshot();
        expect(FormComponentStringField.field(makeField({ name: 'name', type: 'String' }))).toMatchSnapshot();
      });

      it('marks read-only fields as disabled inputs', () => {
        const field = {
          ...makeField({ name: 'ip', type: 'String' }),
          tgReadOnly: true as const,
        };

        const output = FormComponentStringField.field(field);
        expect(output).toContain('disabled');
        expect(output).toContain('readOnly');
      });

      it('adds accept attribute for image uploads', () => {
        const uploadField = {
          ...makeField({ name: 'avatar', type: 'String' }),
          tgUpload: 'image' as const,
        };

        const output = FormComponentFileUploadField.field(uploadField);
        expect(output).toContain('accept={{ \"image/*\": [] }}');
      });

      it('should snapshot all show field configs', () => {
        const enumValues = ['ACTIVE', 'INACTIVE'];

        expect(
          ShowComponentRelationField.field(makeField({ name: 'author', type: 'User', isRelation: true })),
        ).toMatchSnapshot();
        expect(
          ShowComponentEnumField.field(makeField({ name: 'status', type: 'Status', isEnum: true }), enumValues),
        ).toMatchSnapshot();
        expect(ShowComponentDateTimeField.field(makeField({ name: 'createdAt', type: 'DateTime' }))).toMatchSnapshot();
        expect(ShowComponentBooleanField.field(makeField({ name: 'active', type: 'Boolean' }))).toMatchSnapshot();
        expect(ShowComponentNumberField.field(makeField({ name: 'age', type: 'Int' }))).toMatchSnapshot();
        expect(ShowComponentJsonField.field(makeField({ name: 'metadata', type: 'Json' }))).toMatchSnapshot();
        expect(ShowComponentBytesField.field(makeField({ name: 'attachment', type: 'Bytes' }))).toMatchSnapshot();
        expect(
          ShowComponentUrlField.field({ ...makeField({ name: 'website', type: 'String' }), tgFormat: 'url' as const }),
        ).toMatchSnapshot();
        expect(ShowComponentStringField.field(makeField({ name: 'name', type: 'String' }))).toMatchSnapshot();
      });

      it('should snapshot all list field configs', () => {
        const userModel = makeModel('User', [makeField({ name: 'name', type: 'String' })]);
        const enumValues = ['ACTIVE', 'INACTIVE'];

        const relationField = makeField({
          name: 'author',
          type: 'User',
          isRelation: true,
          foreignKeyName: 'authorId',
        });

        expect(ListComponentRelationField.field(relationField, undefined, userModel)).toMatchSnapshot();
        expect(
          ListComponentEnumField.field(makeField({ name: 'status', type: 'Status', isEnum: true }), enumValues),
        ).toMatchSnapshot();
        expect(ListComponentDateTimeField.field(makeField({ name: 'createdAt', type: 'DateTime' }))).toMatchSnapshot();
        expect(ListComponentBooleanField.field(makeField({ name: 'active', type: 'Boolean' }))).toMatchSnapshot();
        expect(ListComponentNumberField.field(makeField({ name: 'age', type: 'Int' }))).toMatchSnapshot();
        expect(ListComponentJsonField.field(makeField({ name: 'metadata', type: 'Json' }))).toMatchSnapshot();
        expect(ListComponentBytesField.field(makeField({ name: 'attachment', type: 'Bytes' }))).toMatchSnapshot();
        expect(
          ListComponentUrlField.field({ ...makeField({ name: 'website', type: 'String' }), tgFormat: 'url' as const }),
        ).toMatchSnapshot();
        expect(ListComponentStringField.field(makeField({ name: 'name', type: 'String' }))).toMatchSnapshot();
      });
    });
  });
});
