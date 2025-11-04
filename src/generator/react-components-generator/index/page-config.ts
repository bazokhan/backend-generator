import type { PrismaModel } from '@tg-scripts/types';
import type { ParsedSchema } from '@tg-scripts/types';

/**
 * Generate index file content
 */
export function indexPage(model: PrismaModel, _parsedSchema: ParsedSchema<PrismaModel>): string {
  return `export { ${model.name}List } from './${model.name}List';
export { ${model.name}Edit } from './${model.name}Edit';
export { ${model.name}Create } from './${model.name}Create';
export { ${model.name}Show } from './${model.name}Show';
export { ${model.name}Studio } from './${model.name}Studio';
`;
}

