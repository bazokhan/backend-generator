// STEP 2
import type { GeneratorOptions } from '@tg-scripts/types';

export interface PaginationInterceptorGeneratorOptions extends GeneratorOptions {
  dtoPath: string;
  defaultLimit: number;
  defaultPage: number;
}

export const generatePaginationInterceptor = (options: PaginationInterceptorGeneratorOptions) =>
  `import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { PaginatedSearchResultDto } from '${options.dtoPath}';

export const DEFAULT_LIMIT = ${options.defaultLimit};

export const DEFAULT_PAGE = ${options.defaultPage};

@Injectable()
export class PaginationInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<PaginatedSearchResultDto<T>> {
    const httpRequest = context.switchToHttp().getRequest();
    const page = (httpRequest?.query?.page ?? DEFAULT_PAGE) as string;
    const limit = (httpRequest?.query?.limit ?? DEFAULT_LIMIT) as string;
    return next.handle().pipe(
      map((data: { data: T[]; total: number; page?: number; limit?: number }) => {
        return {
          data: data?.data ?? [],
          total: data?.total ?? 0,
          page: data?.page ?? parseInt(page, 10),
          limit: data?.limit ?? parseInt(limit, 10),
        };
      }),
    );
  }
}
`;
