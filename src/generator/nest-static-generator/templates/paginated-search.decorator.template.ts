export const paginatedSearchDecoratorTemplate = `import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { PaginationInterceptor } from '{{interceptorPath}}';

export function PaginatedSearch<T = any>() {
  return applyDecorators(
    UseInterceptors(PaginationInterceptor),
  );
}
`;
