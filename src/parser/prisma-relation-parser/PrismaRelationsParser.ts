import type { PrismaModel, ParsedSchema, PrismaField } from '@tg-scripts/types';
import type { IPrismaRelationsParser } from '@tg-scripts/types';

// Scalar base types supported by Prisma that map to simple DTO primitives
const SCALAR_BASE_TYPES = new Set([
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'Json',
  'Decimal',
  'BigInt',
  'Bytes',
]);

function isRelation(field: PrismaField, modelNames: Set<string>): boolean {
  const base = field.baseType;
  if (modelNames.has(base)) return true;
  return !!(field.relationName || field.relationFromFields || field.relationToFields);
}

function isScalar(field: PrismaField, enums: Map<string, string[]>, modelNames: Set<string>): boolean {
  const base = field.baseType;
  if (isRelation(field, modelNames)) return false;
  if (isEnum(field, enums)) return false;
  return SCALAR_BASE_TYPES.has(base);
}

function isEnum(field: PrismaField, enums: Map<string, string[]>): boolean {
  return enums.has(field.baseType);
}

/**
 * Compute search type for paginated search queries based on Prisma baseType
 * Returns null for fields that cannot be searched (Json, relations)
 */
function computeSearchType(baseType: string, isRelation: boolean): 'string' | 'number' | 'boolean' | 'date' | null {
  // Exclude JSON fields and relations as they can't use 'contains'
  if (baseType === 'Json' || isRelation) {
    return null;
  }

  // Map baseType to search type
  switch (baseType) {
    case 'String':
      return 'string';
    case 'Int':
    case 'Float':
    case 'BigInt':
    case 'Decimal':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'DateTime':
      return 'date';
    default:
      // For enums and other types, default to string
      return 'string';
  }
}

function resolveDisplayField(model: PrismaModel): string {
  if (model.tgLabelField) return model.tgLabelField;
  // Priority candidates
  const candidates = ['name', 'title', 'label', 'slug', 'email', 'code'];
  for (const c of candidates) {
    const f = model.fields.find((x) => x.name === c);
    if (f && f.baseType === 'String' && !f.isId) return c;
  }
  // First non-id, non-array String field, preferring ones not ending with Id
  const stringFields = model.fields.filter((f) => f.baseType === 'String' && !f.isId && !f.isArray);
  const preferred = stringFields.find((f) => !f.name.toLowerCase().endsWith('id'));
  if (preferred) return preferred.name;
  if (stringFields.length > 0) return stringFields[0]?.name ?? 'id';
  return 'id';
}

/**
 * Compute default sort field for paginated queries.
 * Prefers timestamp, then createdAt, then id (all models have id).
 */
function resolveDefaultSortBy(model: PrismaModel): string {
  const hasTimestamp = model.fields.some((f) => f.name === 'timestamp');
  const hasCreatedAt = model.fields.some((f) => f.name === 'createdAt');
  if (hasTimestamp) return 'timestamp';
  if (hasCreatedAt) return 'createdAt';
  return 'id'; // All Prisma models have an id field
}

/**
 * Infer the foreign key field name for a given relation field using the
 * Prisma convention: relation field name + "Id" (e.g., icon -> iconId).
 * Returns the FK name only if a matching scalar field exists on the model.
 */
function getForeignKeyFieldName(relationField: PrismaField, model: PrismaModel): string | null {
  // Only applicable for relation fields that are not arrays
  const candidate = `${relationField.name}Id`;
  const fkField = model.fields.find((f) => f.name === candidate);
  if (!fkField) return null;

  // Ensure the FK field is not a relation and is a primitive scalar
  const baseType = fkField.baseType;
  const isPrimitive = SCALAR_BASE_TYPES.has(baseType);
  const looksLikeRelation = !!(fkField.relationName || fkField.relationFromFields || fkField.relationToFields);
  if (isPrimitive && !looksLikeRelation && !fkField.isArray) {
    return candidate;
  }
  return null;
}

export class PrismaRelationsParser implements IPrismaRelationsParser<PrismaModel> {
  public parse(parsedSchema: ParsedSchema<PrismaModel>): void {
    const { models, enums } = parsedSchema;
    const modelNames = new Set(models.map((m) => m.name));

    // Annotate fields with relation, scalar flags, and foreign key names
    // Note: baseType is already set during field parsing
    for (const model of models) {
      // First pass: mark relation fields and their foreign keys
      for (const field of model.fields) {
        const fieldIsRelation = isRelation(field, modelNames);
        Object.defineProperty(field, 'isRelation', {
          value: fieldIsRelation,
          writable: true,
          configurable: true,
          enumerable: false,
        });
        Object.defineProperty(field, 'isScalar', {
          value: isScalar(field, enums, modelNames),
          writable: true,
          configurable: true,
          enumerable: false,
        });
        Object.defineProperty(field, 'isEnum', {
          value: isEnum(field, enums),
          writable: true,
          configurable: true,
          enumerable: false,
        });
        // Compute and attach search type for paginated search queries
        const searchType = computeSearchType(field.baseType, fieldIsRelation);
        Object.defineProperty(field, 'searchType', {
          value: searchType,
          writable: true,
          configurable: true,
          enumerable: false,
        });
        // Compute foreign key name for non-array relation fields
        // Also mark the scalar FK field at the same time
        if (fieldIsRelation && !field.isArray) {
          const fkName = getForeignKeyFieldName(field, model);
          if (fkName) {
            Object.defineProperty(field, 'foreignKeyName', {
              value: fkName,
              writable: true,
              configurable: true,
              enumerable: false,
            });
            const fkField = model.fields.find((f) => f.name === fkName);
            if (fkField) {
              const fkIsRelation = isRelation(fkField, modelNames);
              if (!fkIsRelation) {
                Object.defineProperty(fkField, 'foreignKeyName', {
                  value: fkName,
                  writable: true,
                  configurable: true,
                  enumerable: false,
                });
              }
            }
          }
        }
      }

      // Compute resolved display field once per model
      Object.defineProperty(model, 'displayField', {
        value: resolveDisplayField(model),
        writable: true,
        configurable: true,
        enumerable: false,
      });

      // Compute default sort field for paginated queries
      Object.defineProperty(model, 'defaultSortBy', {
        value: resolveDefaultSortBy(model),
        writable: true,
        configurable: true,
        enumerable: false,
      });
    }
  }
}
