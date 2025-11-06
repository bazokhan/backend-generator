import type { ComponentOverrides, ComponentImport } from '@tg-scripts/types';

/**
 * Component type categories
 */
export type ComponentCategory = 'form' | 'display';

/**
 * Supported component types for forms
 */
export type FormComponentType =
  | 'TextInput'
  | 'NumberInput'
  | 'BooleanInput'
  | 'DateTimeInput'
  | 'SelectInput'
  | 'ReferenceInput'
  | 'ReferenceArrayInput'
  | 'AutocompleteInput'
  | 'AutocompleteArrayInput'
  | 'JsonInput'
  | 'FileInput'
  | 'UrlInput';

/**
 * Supported component types for display
 */
export type DisplayComponentType =
  | 'TextField'
  | 'NumberField'
  | 'BooleanField'
  | 'DateField'
  | 'DateTimeField'
  | 'SelectField'
  | 'ReferenceField'
  | 'JsonField'
  | 'FileField'
  | 'UrlField';

/**
 * Default import path for React Admin components
 */
const DEFAULT_IMPORT_PATH = '@/components/admin';

/**
 * ComponentResolver handles resolution of React Admin components
 * with support for custom component overrides
 */
export class ComponentResolver {
  private readonly overrides: ComponentOverrides;

  constructor(overrides: ComponentOverrides = { form: {}, display: {} }) {
    this.overrides = overrides;
  }

  /**
   * Resolve a form component (input)
   * @param componentType The type of form component
   * @returns Component name and import path
   */
  resolveFormComponent(componentType: FormComponentType): ComponentImport {
    const override = this.overrides.form?.[componentType];
    
    if (override) {
      return {
        name: override.name,
        importPath: override.importPath,
      };
    }

    // Return default
    return {
      name: componentType,
      importPath: DEFAULT_IMPORT_PATH,
    };
  }

  /**
   * Resolve a display component (field)
   * @param componentType The type of display component
   * @returns Component name and import path
   */
  resolveDisplayComponent(componentType: DisplayComponentType): ComponentImport {
    const override = this.overrides.display?.[componentType];
    
    if (override) {
      return {
        name: override.name,
        importPath: override.importPath,
      };
    }

    // Return default
    return {
      name: componentType,
      importPath: DEFAULT_IMPORT_PATH,
    };
  }

  /**
   * Resolve multiple form components and return unique imports
   * @param componentTypes Array of component types
   * @returns Array of unique component imports
   */
  resolveFormComponents(componentTypes: FormComponentType[]): ComponentImport[] {
    const components = componentTypes.map((type) => this.resolveFormComponent(type));
    return this.deduplicateImports(components);
  }

  /**
   * Resolve multiple display components and return unique imports
   * @param componentTypes Array of component types
   * @returns Array of unique component imports
   */
  resolveDisplayComponents(componentTypes: DisplayComponentType[]): ComponentImport[] {
    const components = componentTypes.map((type) => this.resolveDisplayComponent(type));
    return this.deduplicateImports(components);
  }

  /**
   * Generate import statement for resolved components
   * Groups components by import path
   * @param components Array of resolved components
   * @returns Import statements as string
   */
  generateImports(components: ComponentImport[]): string {
    // Group components by import path
    const grouped = new Map<string, Set<string>>();
    
    for (const component of components) {
      if (!grouped.has(component.importPath)) {
        grouped.set(component.importPath, new Set());
      }
      grouped.get(component.importPath)!.add(component.name);
    }

    // Generate import statements
    const imports: string[] = [];
    for (const [importPath, names] of grouped) {
      const sortedNames = Array.from(names).sort();
      imports.push(`import { ${sortedNames.join(', ')} } from '${importPath}';`);
    }

    return imports.join('\n');
  }

  /**
   * Deduplicate component imports by name and path
   * @param components Array of component imports
   * @returns Deduplicated array
   */
  private deduplicateImports(components: ComponentImport[]): ComponentImport[] {
    const seen = new Set<string>();
    const result: ComponentImport[] = [];

    for (const component of components) {
      const key = `${component.name}:${component.importPath}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(component);
      }
    }

    return result;
  }

  /**
   * Check if a component type has an override
   * @param category Component category (form or display)
   * @param componentType Component type name
   * @returns True if component has a custom override
   */
  hasOverride(category: ComponentCategory, componentType: string): boolean {
    if (category === 'form') {
      return this.overrides.form?.[componentType as FormComponentType] !== undefined;
    } else {
      return this.overrides.display?.[componentType as DisplayComponentType] !== undefined;
    }
  }
}

