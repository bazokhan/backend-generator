export type GeneratedModuleFolder = 'features' | 'infrastructure';

export interface ModulePathInfo {
  path: string;
  type: GeneratedModuleFolder;
  folderName: string;
}

export interface PrismaModel {
  name: string;
  fields: PrismaField[];
  enums: string[];
  // Optional: preferred display label for references, from // @tg_label(fieldName)
  tgLabelField?: string | undefined;
}

export interface PrismaField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  isId: boolean;
  isUnique: boolean;
  hasDefaultValue: boolean;
  // Derived type information (filled by parser enrichment)
  baseType: string;
  // Parsed TypeScript type for this field, without ResponseDto mapping.
  // Scalars are mapped to TS primitives; enums/relations stay as-is. Includes array suffix when applicable.
  tsType?: string | undefined;
  // Search type for paginated search queries ('string' | 'number' | 'boolean' | 'date' | null)
  // null indicates the field cannot be searched (Json, relations)
  searchType?: 'string' | 'number' | 'boolean' | 'date' | null;
  isRelation?: boolean;
  isScalar?: boolean;
  isEnum?: boolean;
  relationName?: string | undefined;
  relationFromFields?: string[] | undefined;
  relationToFields?: string[] | undefined;
  // Foreign key field name for non-array relation fields (e.g., 'iconId' for 'icon' relation)
  foreignKeyName?: string | undefined;
  customValidations: CustomValidation[];
  // Optional per-field generation hints parsed from Prisma doc comments
  tgFormat?: 'url' | 'email' | 'password' | 'tel';
  tgUpload?: 'image' | 'file';
  tgReadOnly?: boolean;
  directives?: Record<string, Record<string, unknown>>;
}

export interface CustomValidation {
  decorator: string;
  value: any;
  operations?: string[] | undefined;
}

export interface PrismaModel {
  name: string;
  fields: PrismaField[];
  enums: string[];
  modulePath?: string | undefined;
  moduleType: GeneratedModuleFolder;
  // Preferred display label field for relation optionText
  tgLabelField?: string | undefined;
  // Resolved display label field after parsing (falls back to heuristic)
  displayField?: string | undefined;
  // Default field for sorting in paginated queries (prefers timestamp, then createdAt, then id)
  defaultSortBy?: string | undefined;
}

export type ParsedSchema<T = any> = {
  models: T[];
  enums: Map<string, string[]>;
};

/**
 * DTO type options for field filtering and generation
 */
export type DtoType = 'response' | 'create' | 'update';

export interface Config {
  schemaPath: string;
  dashboardPath: string;
  dtosPath: string;
  suffix: string;
  isAdmin?: boolean;
  updateDataProvider?: boolean;
}

import type { ParsedSchema } from '@tg-scripts/types';

interface IParser {
  parse(input?: any): any;
}

/**
 * Interface for a field parser
 * @template T - The type of the fields
 * @method parse - Parse a single field line from a Prisma model
 * @param {string} line - The line to parse
 * @param {string} docComment - The doc comment to parse
 * @returns {T | null} - The parsed field or null if the line doesn't represent a valid field
 */
export interface IPrismaFieldParser<T = any> extends IParser {
  parse(line: string, docComment?: string): T | null;
}

/**
 * Interface for a schema parser
 * @template T - The type of the models
 * @method load - Load the schema into memory
 * @param {string} schema - The schema to load into memory
 * @returns {void}
 * @method parse - Parse the schema into models and enums
 * @returns {ParsedSchema<T>} - The parsed schema
 * @method reset - Reset the parser to its initial state
 * @returns {void}
 */
export interface IPrismaSchemaParser<T = any> extends IParser {
  load(schema: string): void;
  parse(): ParsedSchema<T>;
  reset(): void;
}

/**
 * Interface for a field relations parser
 * @template T - The type of the models
 * @method parse - Parse the field relations
 * @param {ParsedSchema<T>} parsedSchema - The parsed schema
 * @returns {void}
 */
export interface IPrismaRelationsParser<T = any> extends IParser {
  parse(parsedSchema: ParsedSchema<T>): void;
}

/**
 * Interface for a generator
 * @template T - The type of the generated output
 * @template U - The type of the input
 * @method generate - Generate the output
 * @param {U} input - The input to generate the output (usually a parsed schema or a single model)
 * @returns {T | Promise<T>} - The generated output (usually string content)
 */
export interface IGenerator<U = any, T = any> {
  generate(input?: U, options?: GeneratorOptions): T | Promise<T> | void;
}

export interface GeneratorOptions {
  [key: string]: any;
}

export type Guard = {
  name: string;
  path: string;
};

export interface FieldDirective {
  readonly name: string;
  apply(field: PrismaField, sourceText: string): void;
  serialize?(field: PrismaField): Record<string, unknown> | undefined;
}