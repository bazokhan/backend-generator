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
export type InputPrismaConfig = 'schemaPath' | 'servicePath';
export type InputDashboardConfig = 'components';
export type OutputBackendConfig =
  | 'root'
  | 'dtosPath'
  | 'modulesPaths'
  | 'guardsPath'
  | 'decoratorsPath'
  | 'dtosPath'
  | 'interceptorsPath'
  | 'utilsPath'
  | 'appModulePath';
export type OutputDashboardConfig =
  | 'enabled'
  | 'updateDataProvider'
  | 'dataProviderPath'
  | 'root'
  | 'appComponentPath'
  | 'resourcesPath'
  | 'swaggerJsonPath'
  | 'apiPath';
export type ApiConfig = 'suffix' | 'prefix' | 'authenticationEnabled' | 'requireAdmin' | 'guards' | 'adminGuards';
export type BehaviorConfig = 'nonInteractive';

type ConfigValue = string | string[] | boolean | Guard[] | ComponentOverrides;

export interface Config {
  input: {
    prisma: Record<InputPrismaConfig, ConfigValue>;
    dashboard: Record<InputDashboardConfig, ConfigValue>;
  };
  output: {
    backend: Record<OutputBackendConfig, ConfigValue>;
    dashboard: Record<OutputDashboardConfig, ConfigValue>;
  };
  api: Record<ApiConfig, ConfigValue>;
  behavior: Record<BehaviorConfig, ConfigValue>;
}

/**
 * Simplified user-facing configuration. Write this in tgraph.config.ts.
 * ConfigLoader normalizes it to the internal Config format with inferred defaults.
 */
export interface UserConfig {
  /** Path to Prisma schema. Default: 'prisma/schema.prisma' */
  schemaPath?: string;
  /** Path to PrismaService file. Default: '{srcRoot}/infrastructure/database/prisma.service.ts' */
  prismaServicePath?: string;
  /** Root source directory. All output paths are derived from this. Default: 'src' */
  srcRoot?: string;
  /** API route prefix. Default: 'tg-api' */
  apiPrefix?: string;
  /** Suffix for generated class names (e.g., 'Admin' -> UserAdminService). Default: '' */
  apiSuffix?: string;
  /** Guards applied to all generated controllers. Default: [] */
  guards?: Guard[];
  /** Additional guards applied only when requireAdmin is true. Default: [] */
  adminGuards?: Guard[];
  /** Add authentication guards to controllers. Default: true */
  authenticationEnabled?: boolean;
  /** Require admin role for all endpoints. Default: true */
  requireAdmin?: boolean;
  /** Dashboard config. Set to false to disable, or provide { root } to enable. */
  dashboard?: false | { root?: string };
  /** Auto-confirm all CLI prompts (for CI/CD). Default: false */
  nonInteractive?: boolean;
  /** Override: path to app.module.ts. Default: '{srcRoot}/app.module.ts' */
  appModulePath?: string;
  /** Override: path to generated DTOs directory. Default: '{srcRoot}/dtos/generated' */
  dtosPath?: string;
  /** Override: paths to search for existing modules. Default: ['{srcRoot}/features', '{srcRoot}/modules', '{srcRoot}'] */
  modulesPaths?: string[];
}

/**
 * Component import configuration for custom React Admin components
 */
export interface ComponentImport {
  name: string; // Component name, e.g., 'CustomTextField'
  importPath: string; // Import path, e.g., '@/components/custom/TextField'
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

export interface IParser {
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
  name: string; // Guard class name, e.g., 'JwtAuthGuard'
  importPath: string; // Import path, e.g., '@/guards/jwt-auth.guard'
}

export interface FieldDirective {
  readonly name: string;
  apply(field: PrismaField, sourceText: string): void;
  serialize?(field: PrismaField): Record<string, unknown> | undefined;
}

