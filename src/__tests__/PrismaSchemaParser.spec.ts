import { PrismaSchemaParser } from '../parser/prisma-schema-parser/PrismaSchemaParser';
import { PrismaFieldParser } from '../parser/prisma-field-parser/PrismaFieldParser';
import { PrismaRelationsParser } from '../parser/prisma-relation-parser/PrismaRelationsParser';

const schema = `/**
 * This is a comment
 */

generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  USER
  ADMIN
}

// @tg_form()
// @tg_label(email)
model User {
  id        String    @id @default(uuid())
  firstName String
  lastName  String
  password  String
  email     String    @unique
  image     String?
  role      Role      @default(USER)
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt

  @@index([email])
}`;

describe('PrismaSchemaParser', () => {
  let parser: PrismaSchemaParser;

  beforeEach(() => {
    parser = new PrismaSchemaParser(new PrismaFieldParser(), new PrismaRelationsParser());
  });

  describe('loadSchema and parseSchema', () => {
    it('should load schema without errors', () => {
      expect(() => parser.load(schema)).not.toThrow();
    });

    it('should parse schema and return models and enums', () => {
      parser.load(schema);
      const result = parser.parse();

      expect(result).toHaveProperty('models');
      expect(result).toHaveProperty('enums');
      expect(Array.isArray(result.models)).toBe(true);
      expect(result.enums instanceof Map).toBe(true);
    });

    it('should parse enum Role with values USER and ADMIN', () => {
      parser.load(schema);
      const { enums } = parser.parse();

      expect(enums.has('Role')).toBe(true);
      expect(enums.get('Role')).toEqual(['USER', 'ADMIN']);
    });

    it('should parse model User with @tg_form() annotation', () => {
      parser.load(schema);
      const { models } = parser.parse();

      expect(models.length).toBe(1);
      expect(models[0].name).toBe('User');
      expect(models[0].tgLabelField).toBe('email');
    });

    it('should parse all fields from User model', () => {
      parser.load(schema);
      const { models } = parser.parse();

      const userModel = models[0];
      expect(userModel.fields.length).toBe(9);

      // Check id field
      const idField = userModel.fields.find((f) => f.name === 'id');
      expect(idField).toBeDefined();
      expect(idField?.type).toBe('String');
      expect(idField?.isId).toBe(true);
      expect(idField?.hasDefaultValue).toBe(true);

      // Check firstName field
      const firstNameField = userModel.fields.find((f) => f.name === 'firstName');
      expect(firstNameField).toBeDefined();
      expect(firstNameField?.type).toBe('String');
      expect(firstNameField?.isOptional).toBe(false);

      // Check email field
      const emailField = userModel.fields.find((f) => f.name === 'email');
      expect(emailField).toBeDefined();
      expect(emailField?.type).toBe('String');
      expect(emailField?.isUnique).toBe(true);

      // Check image field (optional)
      const imageField = userModel.fields.find((f) => f.name === 'image');
      expect(imageField).toBeDefined();
      expect(imageField?.type).toBe('String');
      expect(imageField?.isOptional).toBe(true);

      // Check role field (enum type)
      const roleField = userModel.fields.find((f) => f.name === 'role');
      expect(roleField).toBeDefined();
      expect(roleField?.type).toBe('Role');
      expect(roleField?.hasDefaultValue).toBe(true);

      // Check updatedAt field (optional)
      const updatedAtField = userModel.fields.find((f) => f.name === 'updatedAt');
      expect(updatedAtField).toBeDefined();
      expect(updatedAtField?.type).toBe('DateTime');
      expect(updatedAtField?.isOptional).toBe(true);
    });

    it('should track enums used in model fields', () => {
      parser.load(schema);
      const { models } = parser.parse();

      const userModel = models[0];
      expect(userModel.enums).toContain('Role');
      expect(userModel.enums.length).toBe(1);
    });

    it('should skip models without @tg_form() annotation', () => {
      const schemaWithoutTgForm = `
enum Status {
  ACTIVE
  INACTIVE
}

model Post {
  id String @id
  title String
}
`;

      parser.load(schemaWithoutTgForm);
      const { models } = parser.parse();

      expect(models.length).toBe(0);
    });

    it('should ignore model-level directives (@@index)', () => {
      parser.load(schema);
      const { models } = parser.parse();

      const userModel = models[0];
      // Should not have @@index as a field
      const indexField = userModel.fields.find((f) => f.name.startsWith('@@'));
      expect(indexField).toBeUndefined();
    });

    it('should handle multi-line comments correctly', () => {
      parser.load(schema);
      const { models, enums } = parser.parse();

      // Multi-line comment at the top should not affect parsing
      expect(enums.has('Role')).toBe(true);
      expect(models.length).toBe(1);
    });

    it('should handle single-line comments correctly', () => {
      parser.load(schema);
      const { models } = parser.parse();

      // Comments with @tg_form() and @tg_label() should be parsed
      expect(models[0].name).toBe('User');
      expect(models[0].tgLabelField).toBe('email');
    });

    it('should set moduleType to features by default', () => {
      parser.load(schema);
      const { models } = parser.parse();

      expect(models[0].moduleType).toBe('');
    });

    it('should parse fields with complex modifiers', () => {
      parser.load(schema);
      const { models } = parser.parse();

      const createdAtField = models[0].fields.find((f) => f.name === 'createdAt');
      expect(createdAtField?.hasDefaultValue).toBe(true);
      expect(createdAtField?.isOptional).toBe(false);
    });
  });

  describe('field-level directives (triple-slash comments)', () => {
    it('should parse @tg_format directive', () => {
      const schemaWithFormat = `
// @tg_form()
model User {
  id String @id
  /// @tg_format(url)
  website String
  /// @tg_format(email)
  email String
  /// @tg_format(password)
  password String
  /// @tg_format(tel)
  phone String
}
`;

      parser.load(schemaWithFormat);
      const { models } = parser.parse();

      const websiteField = models[0].fields.find((f) => f.name === 'website');
      const emailField = models[0].fields.find((f) => f.name === 'email');
      const passwordField = models[0].fields.find((f) => f.name === 'password');
      const phoneField = models[0].fields.find((f) => f.name === 'phone');

      expect(websiteField?.tgFormat).toBe('url');
      expect(emailField?.tgFormat).toBe('email');
      expect(passwordField?.tgFormat).toBe('password');
      expect(phoneField?.tgFormat).toBe('tel');
    });

    it('should parse @tg_upload directive', () => {
      const schemaWithUpload = `
// @tg_form()
model Asset {
  id String @id
  /// @tg_upload(image)
  image String
  /// @tg_upload(file)
  document String
}
`;

      parser.load(schemaWithUpload);
      const { models } = parser.parse();

      const imageField = models[0].fields.find((f) => f.name === 'image');
      const documentField = models[0].fields.find((f) => f.name === 'document');

      expect(imageField?.tgUpload).toBe('image');
      expect(documentField?.tgUpload).toBe('file');
    });

    it('should parse @tg_readonly directive', () => {
      const schemaWithReadonly = `
// @tg_form()
model Post {
  id String @id
  /// @tg_readonly
  createdAt DateTime @default(now())
  /// @tg_readonly
  updatedAt DateTime? @updatedAt
}
`;

      parser.load(schemaWithReadonly);
      const { models } = parser.parse();

      const createdAtField = models[0].fields.find((f) => f.name === 'createdAt');
      const updatedAtField = models[0].fields.find((f) => f.name === 'updatedAt');

      expect(createdAtField?.tgReadOnly).toBe(true);
      expect(updatedAtField?.tgReadOnly).toBe(true);
    });

    it('should handle multiple directives on a single field', () => {
      const schemaWithMultiple = `
// @tg_form()
model Asset {
  id String @id
  /// @tg_format(url) @tg_readonly
  url String
}
`;

      parser.load(schemaWithMultiple);
      const { models } = parser.parse();

      const urlField = models[0].fields.find((f) => f.name === 'url');

      expect(urlField?.tgFormat).toBe('url');
      expect(urlField?.tgReadOnly).toBe(true);
    });

    it('should handle multi-line triple-slash comments', () => {
      const schemaWithMultiLine = `
// @tg_form()
model Asset {
  id String @id
  /// This is a description
  /// @tg_format(url)
  /// that spans multiple lines
  url String
}
`;

      parser.load(schemaWithMultiLine);
      const { models } = parser.parse();

      const urlField = models[0].fields.find((f) => f.name === 'url');

      expect(urlField?.tgFormat).toBe('url');
    });

    it('should ignore triple-slash comments outside of models', () => {
      const schemaWithOutsideComment = `
/// This comment is outside a model
enum Status {
  ACTIVE
}

// @tg_form()
model User {
  id String @id
  /// @tg_format(email)
  email String
}
`;

      parser.load(schemaWithOutsideComment);
      const { models, enums } = parser.parse();

      expect(enums.has('Status')).toBe(true);
      const emailField = models[0].fields.find((f) => f.name === 'email');
      expect(emailField?.tgFormat).toBe('email');
    });

    it('should not apply directives when triple-slash comment does not contain them', () => {
      const schemaWithoutDirectives = `
// @tg_form()
model User {
  id String @id
  /// Just a regular comment
  name String
}
`;

      parser.load(schemaWithoutDirectives);
      const { models } = parser.parse();

      const nameField = models[0].fields.find((f) => f.name === 'name');

      expect(nameField?.tgFormat).toBeUndefined();
      expect(nameField?.tgUpload).toBeUndefined();
      expect(nameField?.tgReadOnly).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty schema', () => {
      parser.load('');
      const { models, enums } = parser.parse();

      expect(models.length).toBe(0);
      expect(enums.size).toBe(0);
    });

    it('should handle schema with only enums', () => {
      const enumOnlySchema = `
enum Color {
  RED
  BLUE
  GREEN
}
`;

      parser.load(enumOnlySchema);
      const { models, enums } = parser.parse();

      expect(models.length).toBe(0);
      expect(enums.has('Color')).toBe(true);
      expect(enums.get('Color')).toEqual(['RED', 'BLUE', 'GREEN']);
    });

    it('should handle schema with only models (no @tg_form)', () => {
      const modelOnlySchema = `
model Test {
  id String @id
}
`;

      parser.load(modelOnlySchema);
      const { models } = parser.parse();

      expect(models.length).toBe(0);
    });

    it('should handle empty enum', () => {
      const emptyEnumSchema = `
enum Empty {
}

// @tg_form()
model Test {
  id String @id
}
`;

      parser.load(emptyEnumSchema);
      const { enums } = parser.parse();

      expect(enums.has('Empty')).toBe(true);
      expect(enums.get('Empty')).toEqual([]);
    });

    it('should handle enum with single value', () => {
      const singleEnumSchema = `
enum Single {
  ONE
}

// @tg_form()
model Test {
  id String @id
}
`;

      parser.load(singleEnumSchema);
      const { enums } = parser.parse();

      expect(enums.has('Single')).toBe(true);
      expect(enums.get('Single')).toEqual(['ONE']);
    });

    it('should handle optional field types correctly', () => {
      parser.load(schema);
      const { models } = parser.parse();

      const optionalFields = models[0].fields.filter((f) => f.isOptional);
      const optionalFieldNames = optionalFields.map((f) => f.name);

      expect(optionalFieldNames).toContain('image');
      expect(optionalFieldNames).toContain('updatedAt');
    });

    it('should not parse fields as optional when type has no question mark', () => {
      parser.load(schema);
      const { models } = parser.parse();

      const requiredFields = models[0].fields.filter((f) => !f.isOptional);
      const requiredFieldNames = requiredFields.map((f) => f.name);

      expect(requiredFieldNames).toContain('id');
      expect(requiredFieldNames).toContain('firstName');
      expect(requiredFieldNames).toContain('email');
    });
  });

  describe('snapshots', () => {
    it('should snapshot a parsed schema with enums and relations', () => {
      parser.load(schema);
      const result = parser.parse();
      const snapshot = {
        models: result.models,
        enums: Object.fromEntries(Array.from(result.enums.entries()).sort()),
      };
      expect(snapshot).toMatchSnapshot();
    });
  });
});
