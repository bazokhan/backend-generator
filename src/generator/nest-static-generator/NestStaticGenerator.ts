import type { GeneratorOptions, IGenerator } from '@tg-scripts/types';
import { generateAdminGuard } from './admin-config/admin.guard';
import * as fs from 'fs';
import { generateIsAdminDecorator } from './admin-config/is-admin.decorator';
import { defaultStaticGeneratorOptions } from './config';
import { generatePaginatedSearchQueryDto } from './pagiantion-search-config/paginated-search-query.dto';
import { generatePaginatedSearchResultDto } from './pagiantion-search-config/paginated-search-result.dto';
import { generatePaginatedSearchDecorator } from './pagiantion-search-config/paginated-search.decorator';
import { generatePaginationInterceptor } from './pagiantion-search-config/pagiantion.interceptor';
import { generateApiResponseDto } from './response-config/api-response.dto';
import { formatGeneratedFiles } from '../../io/utils';

export class NestStaticGenerator implements IGenerator<GeneratorOptions, void> {
  public async generate(options: GeneratorOptions = defaultStaticGeneratorOptions): Promise<void> {
    const {
      rolesEnumName,
      prismaGeneratedPath,
      adminRole,
      guards,
      dtoPath,
      defaultLimit,
      defaultPage,
      interceptorPath,
      decoratorPath,
      queryDtoPath,
      apiResponseDtoPath,
      adminGuardPath,
      isAdminDecoratorPath,
    } = options;
    /** Admin Config */
    const adminGuard = generateAdminGuard({
      rolesEnumName,
      prismaGeneratedPath,
      adminRole,
    });
    const isAdminDecorator = generateIsAdminDecorator({
      guards,
    });
    /** Paginated Search Config */
    const paginatedSearchResultDto = generatePaginatedSearchResultDto();
    const paginationInterceptor = generatePaginationInterceptor({
      dtoPath,
      defaultLimit,
      defaultPage,
    });
    const paginatedSearchDecorator = generatePaginatedSearchDecorator({
      interceptorPath,
    });
    const paginatedSearchQueryDto = generatePaginatedSearchQueryDto();
    /** Api Response Config */
    const apiResponseDto = generateApiResponseDto();

    /** Async writing files */
    await Promise.all([
      fs.promises.writeFile(this.getFilePath(adminGuardPath), adminGuard),
      fs.promises.writeFile(this.getFilePath(isAdminDecoratorPath), isAdminDecorator),
      fs.promises.writeFile(this.getFilePath(dtoPath), paginatedSearchResultDto),
      fs.promises.writeFile(this.getFilePath(interceptorPath), paginationInterceptor),
      fs.promises.writeFile(this.getFilePath(decoratorPath), paginatedSearchDecorator),
      fs.promises.writeFile(this.getFilePath(queryDtoPath), paginatedSearchQueryDto),
      fs.promises.writeFile(this.getFilePath(apiResponseDtoPath), apiResponseDto),
    ]);

    formatGeneratedFiles(
      [
        adminGuardPath,
        isAdminDecoratorPath,
        dtoPath,
        interceptorPath,
        decoratorPath,
        queryDtoPath,
        apiResponseDtoPath,
      ].map((path) => this.getFilePath(path)),
      process.cwd(),
    );
  }

  private getFilePath(path: string): string {
    return path.replace('@', 'src').replace(/(\/|\\)/g, '\\') + '.ts';
  }
}
