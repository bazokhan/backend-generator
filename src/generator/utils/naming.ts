/**
 * Shared naming utilities for code generation
 * Ensures consistent naming across backend and frontend generation
 */

/**
 * Convert PascalCase to kebab-case
 * Example: CustomFieldType -> custom-field-type
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Convert PascalCase to camelCase
 * Example: CustomFieldType -> customFieldType
 */
export function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Simple pluralization
 * Example: type -> types, field -> fields
 */
export function pluralize(str: string): string {
  // Check compound endings first (ch, sh before s, z)
  if (str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  // Handle words ending in x or s
  if (str.endsWith('x') || str.endsWith('s')) {
    return str + 'es';
  }
  // Handle words ending in z - add zes
  if (str.endsWith('z')) {
    return str + 'es';
  }
  // Handle consonant + y
  if (str.endsWith('y') && str.length > 1 && !'aeiou'.includes(str[str.length - 2] ?? '')) {
    return str.slice(0, -1) + 'ies';
  }
  return str + 's';
}

/**
 * Get the resource name for React Admin
 * Uses kebab-case with plural form
 * Example: CustomFieldType -> custom-field-types
 */
export function getResourceName(modelName: string): string {
  const kebab = toKebabCase(modelName);
  return pluralize(kebab);
}

/**
 * Get the file name base (lowercase with hyphens)
 * Example: CustomFieldType -> customFieldType
 */
export function getFileNameBase(modelName: string): string {
  return toCamelCase(modelName);
}
