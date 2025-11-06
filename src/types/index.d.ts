export interface ModulePathInfo {
  path: string;
  type: string;
  folderName: string;
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
  moduleType: string;
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

/**
 * Main configuration interface for TGraph Backend Generator
 */
export interface Config {
  // Input sources
  input: {
    schemaPath: string;
    prismaService: string;  // Path to PrismaService file (e.g., 'src/infrastructure/database/prisma.service.ts')
  };
  
  // Output destinations
  output: {
    backend: {
      dtos: string;
      modules: {
        searchPaths: string[];      // e.g., ['src/features', 'src/modules', 'src']
        defaultRoot: string;         // Where to create new modules: 'src/features'
      };
      staticFiles: {
        guards: string;              // e.g., 'src/guards'
        decorators: string;          // e.g., 'src/decorators'
        dtos: string;                // e.g., 'src/dtos'
        interceptors: string;        // e.g., 'src/interceptors'
        utils: string;               // e.g., 'src/utils'
      };
    };
    dashboard: {
      root: string;                  // e.g., 'src/dashboard/src'
      resources: string;             // e.g., 'src/dashboard/src/resources'
    };
  };
  
  // API generation settings
  api: {
    suffix: string;                  // e.g., 'Admin', 'Public', 'Tg'
    prefix: string;                  // e.g., 'tg-api', 'api'
    authentication: {
      enabled: boolean;              // Add auth guards?
      requireAdmin: boolean;         // Admin-only endpoints?
      guards: Guard[];               // Configurable guard list
    };
  };
  
  // Dashboard generation settings
  dashboard: {
    enabled: boolean;                // Generate dashboard?
    updateDataProvider: boolean;     // Auto-update data provider?
    components: ComponentOverrides;  // Override React Admin components
  };
  
  // Behavior flags
  behavior: {
    nonInteractive: boolean;
  };
  
  // Advanced path overrides (optional)
  paths?: {
    appModule?: string;
    dataProvider?: string;
    appComponent?: string;
  };
}

/**
 * Component import configuration for custom React Admin components
 */
export interface ComponentImport {
  name: string;                      // Component name, e.g., 'CustomTextField'
  importPath: string;                // Import path, e.g., '@/components/custom/TextField'
}

/**
 * Component overrides for React Admin dashboard generation
 */
export interface ComponentOverrides {
  // Form/Input components
  form?: {
    TextInput?: ComponentImport;
    NumberInput?: ComponentImport;
    BooleanInput?: ComponentImport;
    DateTimeInput?: ComponentImport;
    SelectInput?: ComponentImport;
    ReferenceInput?: ComponentImport;
    ReferenceArrayInput?: ComponentImport;
    AutocompleteInput?: ComponentImport;
    AutocompleteArrayInput?: ComponentImport;
    JsonInput?: ComponentImport;
    FileInput?: ComponentImport;
    UrlInput?: ComponentImport;
  };
  // Display components
  display?: {
    TextField?: ComponentImport;
    NumberField?: ComponentImport;
    BooleanField?: ComponentImport;
    DateField?: ComponentImport;
    DateTimeField?: ComponentImport;
    SelectField?: ComponentImport;
    ReferenceField?: ComponentImport;
    JsonField?: ComponentImport;
    FileField?: ComponentImport;
    UrlField?: ComponentImport;
  };
}

/**
 * @deprecated Use the new Config structure instead
 * Kept for reference during migration
 */
export interface ProjectPathsConfig {
  appModule?: string;
  moduleRoots?: Record<string, string[]>;
  dashboard?: {
    appComponent?: string;
    dataProvider?: string;
  };
}

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

/**
 * Authentication guard configuration
 */
export interface Guard {
  name: string;                      // Guard class name, e.g., 'JwtAuthGuard'
  importPath: string;                // Import path, e.g., '@/guards/jwt-auth.guard'
}

export interface FieldDirective {
  readonly name: string;
  apply(field: PrismaField, sourceText: string): void;
  serialize?(field: PrismaField): Record<string, unknown> | undefined;
}
