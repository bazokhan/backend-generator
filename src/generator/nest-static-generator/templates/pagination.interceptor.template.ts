export const paginationInterceptorTemplate = `import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedSearchResultDto } from '{{dtoPath}}';

@Injectable()
export class PaginationInterceptor<T = any> implements NestInterceptor<T, PaginatedSearchResultDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<PaginatedSearchResultDto<T>> {
    const request = context.switchToHttp().getRequest();
    const page = parseInt(request.query.page) || {{defaultPage}};
    const limit = parseInt(request.query.limit) || {{defaultLimit}};

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'data' in data && 'total' in data) {
          // If the data already has the pagination structure, use it
          const { data: items, total, page: responsePage, limit: responseLimit } = data as any;
          return new PaginatedSearchResultDto(items, total, responsePage || page, responseLimit || limit);
        }
        if (Array.isArray(data)) {
          // If it's just an array, wrap it
          return new PaginatedSearchResultDto(data, data.length, page, limit);
        }
        return data;
      }),
    );
  }
}
`;
