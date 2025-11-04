// STEP 3
import type { GeneratorOptions } from '@tg-scripts/types';

export interface PaginatedSearchDecoratorGeneratorOptions extends GeneratorOptions {
  interceptorPath: string;
}

export const generatePaginatedSearchDecorator = (options: PaginatedSearchDecoratorGeneratorOptions) =>
  `import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { PaginationInterceptor } from '${options.interceptorPath}';

export function PaginatedSearch<T = any>() {
  return applyDecorators(UseInterceptors(PaginationInterceptor<T>));
}
`;
