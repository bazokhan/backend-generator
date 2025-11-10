import { buildFieldDirectiveMetadata, buildFieldDirectiveFile } from '../directives/field/field-directive-writer';
import type { PrismaModel } from '@tg-scripts/types';

const makeModel = (overrides: Partial<PrismaModel>): PrismaModel => ({
  name: 'Sample',
  fields: [],
  enums: [],
  moduleType: 'features',
  ...overrides,
});

describe('field directive writer', () => {
  it('builds metadata for directives on fields', () => {
    const models: PrismaModel[] = [
      makeModel({
        name: 'User',
        fields: [
          {
            name: 'email',
            type: 'String',
            isOptional: false,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            baseType: 'String',
            isEnum: false,
            tgFormat: 'email',
          },
          {
            name: 'image',
            type: 'String',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            baseType: 'String',
            isEnum: false,
            tgUpload: 'image',
          },
        ],
      }),
    ];

    const metadata = buildFieldDirectiveMetadata(models);
    expect(metadata).toEqual({
      users: {
        email: { format: 'email' },
        image: { upload: { type: 'image' } },
      },
    });
  });

  it('renders the generated file with stable JSON content', () => {
    const models: PrismaModel[] = [
      makeModel({
        name: 'AuditLog',
        fields: [
          {
            name: 'ip',
            type: 'String',
            isOptional: true,
            isArray: false,
            isId: false,
            isUnique: false,
            hasDefaultValue: false,
            customValidations: [],
            baseType: 'String',
            isEnum: false,
            tgReadOnly: true,
          },
        ],
      }),
    ];

    const fileContent = buildFieldDirectiveFile(models);
    expect(fileContent).toContain('AUTO-GENERATED FILE');
    expect(fileContent).toContain('"audit-logs"');
    expect(fileContent).toContain('"ip"');

    const jsonMatch = fileContent.match(/export const fieldDirectiveConfig = ([\s\S]+?) as const;/);
    expect(jsonMatch).not.toBeNull();
    expect(() => JSON.parse(jsonMatch![1])).not.toThrow();
  });
});
