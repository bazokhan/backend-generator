import { PrismaFieldParser } from './PrismaFieldParser';
import { PrismaSchemaParser } from '../prisma-schema-parser/PrismaSchemaParser';
import { PrismaRelationsParser } from '../prisma-relation-parser/PrismaRelationsParser';

describe('PrismaFieldParser', () => {
  describe('valid field parsing', () => {
    it('should parse a simple field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('name String');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('name');
      expect(result!.type).toBe('String');
      expect(result!.isOptional).toBe(false);
    });

    it('should parse an optional field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('name String?');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('name');
      expect(result!.type).toBe('String');
      expect(result!.isOptional).toBe(true);
    });

    it('should parse array field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('tags String[]');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('tags');
      expect(result!.type).toBe('String[]');
      expect(result!.isArray).toBe(true);
    });

    it('should parse @id field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('id String @id');

      expect(result).not.toBeNull();
      expect(result!.isId).toBe(true);
    });

    it('should parse @unique field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('email String @unique');

      expect(result).not.toBeNull();
      expect(result!.isUnique).toBe(true);
    });

    it('should parse @default field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('id String @default(uuid())');

      expect(result).not.toBeNull();
      expect(result!.hasDefaultValue).toBe(true);
    });

    it('should parse Int field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('age Int');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('Int');
    });

    it('should parse Float field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('score Float');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('Float');
    });

    it('should parse Boolean field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('active Boolean');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('Boolean');
    });

    it('should parse DateTime field', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('createdAt DateTime');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('DateTime');
    });
  });

  describe('invalid field parsing', () => {
    it('should return null for comment line', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('// This is a comment');

      expect(result).toBeNull();
    });

    it('should return null for empty line', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('');

      expect(result).toBeNull();
    });

    it('should return null for whitespace only', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('   ');

      expect(result).toBeNull();
    });

    it('should return null for line with only name', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('name');

      expect(result).toBeNull();
    });
  });

  describe('@relation parsing', () => {
    it('should parse @relation with name', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('user User @relation("PostToUser")');

      expect(result).not.toBeNull();
      expect(result!.relationName).toBe('PostToUser');
    });

    it('should parse @relation with fields and references', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('user User @relation(fields: [userId], references: [id])');

      expect(result).not.toBeNull();
      expect(result!.relationFromFields).toEqual(['userId']);
      expect(result!.relationToFields).toEqual(['id']);
    });

    it('should handle multiple fields in @relation', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('user User @relation(fields: [userId, tenantId], references: [id, tenantId])');

      expect(result).not.toBeNull();
      expect(result!.relationFromFields).toEqual(['userId', 'tenantId']);
      expect(result!.relationToFields).toEqual(['id', 'tenantId']);
    });
  });

  describe('custom validation parsing', () => {
    it('should parse @max validation', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('name String // @max(50)');

      expect(result).not.toBeNull();
      expect(result!.customValidations).toHaveLength(1);
      expect(result!.customValidations[0].decorator).toBe('max');
      expect(result!.customValidations[0].value).toBe('50');
    });

    it('should parse @min validation', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('age Int // @min(18)');

      expect(result).not.toBeNull();
      expect(result!.customValidations).toHaveLength(1);
      expect(result!.customValidations[0].decorator).toBe('min');
      expect(result!.customValidations[0].value).toBe('18');
    });

    it('should parse @length validation', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('code String // @length(5)');

      expect(result).not.toBeNull();
      expect(result!.customValidations).toHaveLength(1);
      expect(result!.customValidations[0].decorator).toBe('length');
    });

    it('should parse @pattern validation', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('phone String // @pattern("^[0-9]+$")');

      expect(result).not.toBeNull();
      expect(result!.customValidations).toHaveLength(1);
      expect(result!.customValidations[0].decorator).toBe('pattern');
    });

    it('should parse multiple validations', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('name String // @min(3) @max(50)');

      expect(result).not.toBeNull();
      expect(result!.customValidations).toHaveLength(2);
      expect(result!.customValidations[0].decorator).toBe('min');
      expect(result!.customValidations[1].decorator).toBe('max');
    });

    it('should parse validation with operations', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('name String // @max(50, [create, update])');

      expect(result).not.toBeNull();
      expect(result!.customValidations[0].operations).toEqual(['create', 'update']);
    });

    it('should parse validation with only create operation', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('email String // @required([create])');

      expect(result).not.toBeNull();
      expect(result!.customValidations[0].operations).toEqual(['create']);
    });
  });

  describe('directive parsing', () => {
    it('applies doc comment directives', () => {
      const parser = new PrismaFieldParser();
      const field = parser.parse('website String', '@tg_format(url)');

      expect(field?.tgFormat).toBe('url');
      expect(field?.directives?.tg_format).toEqual({ type: 'url' });
    });

    it('applies inline directives', () => {
      const parser = new PrismaFieldParser();
      const field = parser.parse('image String? // @tg_upload(image)');

      expect(field?.tgUpload).toBe('image');
      expect(field?.directives?.tg_upload).toEqual({ type: 'image' });
    });

    it('merges doc comment and inline directives', () => {
      const parser = new PrismaFieldParser();
      const field = parser.parse('ip String // @tg_readonly', '@tg_format(url)');

      expect(field?.tgFormat).toBe('url');
      expect(field?.tgReadOnly).toBe(true);
      expect(field?.directives).toEqual({
        tg_format: { type: 'url' },
        tg_readonly: { enabled: true },
      });
    });
  });

  describe('complex field combinations', () => {
    it('should parse field with all modifiers', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('email String? @unique @default("test@example.com")');

      expect(result).not.toBeNull();
      expect(result!.isOptional).toBe(true);
      expect(result!.isUnique).toBe(true);
      expect(result!.hasDefaultValue).toBe(true);
    });

    it('should parse field with @id and @default', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('id String @id @default(uuid())');

      expect(result).not.toBeNull();
      expect(result!.isId).toBe(true);
      expect(result!.hasDefaultValue).toBe(true);
    });

    it('should parse field with custom validation and modifiers', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('name String @unique // @max(50)');

      expect(result).not.toBeNull();
      expect(result!.isUnique).toBe(true);
      expect(result!.customValidations).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle field with multiple words in name', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('firstName String');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('firstName');
    });

    it('should handle field with underscores in name', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('user_id String');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('user_id');
    });

    it('should handle field with numbers in name', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('field2 String');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('field2');
    });

    it('should handle complex @default value', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('createdAt DateTime @default(now())');

      expect(result).not.toBeNull();
      expect(result!.hasDefaultValue).toBe(true);
    });

    it('should handle array of enums', () => {
      const parser = new PrismaFieldParser();
      const result = parser.parse('tags Status[]');

      expect(result).not.toBeNull();
      expect(result!.isArray).toBe(true);
      expect(result!.type).toBe('Status[]');
    });
  });

  describe('snapshots', () => {
    it('should snapshot a parsed schema with enums and relations', () => {
      const schema = `
        enum Status {
          ACTIVE
          INACTIVE
        }

        // @tg_form()
        model Post {
          id        String   @id @default(uuid())
          name      String?
          email     String?  @unique @default("test@example.com") // @max(50, [create, update])
          tags      Status[]
          userId    String
          user      User     @relation(fields: [userId], references: [id])
        }
      `;

      const parser = new PrismaSchemaParser(new PrismaFieldParser(), new PrismaRelationsParser());
      parser.load(schema);
      const result = parser.parse();
      const snapshot = {
        models: result.models,
        enums: Object.fromEntries(Array.from(result.enums.entries()).sort()),
      };
      expect(snapshot).toMatchSnapshot();
    });

    it('should snapshot representative parseField outputs', () => {
      const lines = [
        'id String @id @default(uuid())',
        'email String? @unique @default("x")',
        'user User @relation("PostToUser")',
        'user User @relation(fields: [userId, tenantId], references: [id, tenantId])',
        'name String // @max(50, [create, update])',
        'email String // @required([create])',
        'tags Status[]',
        'createdAt DateTime @default(now())',
      ];
      const parser = new PrismaFieldParser();
      const parsed = lines.map((l) => parser.parse(l));
      expect(parsed).toMatchSnapshot();
    });
  });

  describe('TypeScript type mapping (tsType)', () => {
    it('maps scalar primitives to TS types', () => {
      const p = new PrismaFieldParser();
      expect(p.parse('title String')!.tsType).toBe('string');
      expect(p.parse('age Int')!.tsType).toBe('number');
      expect(p.parse('score Float')!.tsType).toBe('number');
      expect(p.parse('active Boolean')!.tsType).toBe('boolean');
      expect(p.parse('createdAt DateTime')!.tsType).toBe('string');
      expect(p.parse('data Json')!.tsType).toBe('any');
    });

    it('keeps enums and relations as-is', () => {
      const p = new PrismaFieldParser();
      expect(p.parse('status Status')!.tsType).toBe('Status');
      expect(p.parse('user User')!.tsType).toBe('User');
    });

    it('handles optional and arrays', () => {
      const p = new PrismaFieldParser();
      expect(p.parse('description String?')!.tsType).toBe('string');
      expect(p.parse('tags String[]')!.tsType).toBe('string[]');
      expect(p.parse('priorities Status[]')!.tsType).toBe('Status[]');
    });
  });
});
