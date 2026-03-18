import * as path from 'path';

export const getList = (camelCaseName: string, searchableFields: string, defaultSortBy: string = 'id') => `
  async getList(query: PaginatedSearchQueryDto) {
    return paginatedSearch({
      prisma: this.prisma,
      model: '${camelCaseName}',
      query,
      fieldsToSearch: [${searchableFields}],
      defaultSortBy: '${defaultSortBy}',
    });
  }
`;

export const getOne = (pascalCaseName: string, camelCaseName: string) => `
  async getOne(id: string, select?: any, include?: any) {
    const queryOptions: any = { where: { id } };
    if (include) { queryOptions.include = include; } else { queryOptions.select = select ?? this.getSelectFields(); }
    const item = await this.prisma.${camelCaseName}.findUnique(queryOptions);

    if (!item) {
      throw new NotFoundException('${pascalCaseName} not found');
    }

    return item;
  }
`;

export const getMany = (camelCaseName: string) => `
  async getMany(ids: string[], select?: any, include?: any) {
    const queryOptions: any = { where: { id: { in: ids } } };
    if (include) { queryOptions.include = include; } else { queryOptions.select = select ?? this.getSelectFields(); }
    const items = await this.prisma.${camelCaseName}.findMany(queryOptions);

    return { data: items };
  }
`;

export const getManyReference = (camelCaseName: string, searchableFields: string, defaultSortBy: string = 'id') => `
  async getManyReference(target: string, id: string, query: PaginatedSearchQueryDto) {
    // This is a simplified implementation - you may need to customize based on your relations
    return paginatedSearch({
      prisma: this.prisma,
      model: '${camelCaseName}',
      query,
      fieldsToSearch: [${searchableFields}],
      defaultSortBy: '${defaultSortBy}',
    });
  }
`;

export const create = (
  pascalCaseName: string,
  camelCaseName: string,
  uniqueFields: Array<{ name: string }>,
  namingSuffix: string,
) => {
  const uniqueChecks = generateUniqueChecks(pascalCaseName, camelCaseName, uniqueFields, false);
  return `
  async create(dto: Create${pascalCaseName}${namingSuffix}Dto, select?: any, include?: any) {
    // Check unique constraints
    ${uniqueChecks}

    const createOptions: any = { data: dto };
    if (include) { createOptions.include = include; } else { createOptions.select = select ?? this.getSelectFields(); }
    const item = await this.prisma.${camelCaseName}.create(createOptions);

    return item;
  }
`;
};

export const update = (
  pascalCaseName: string,
  camelCaseName: string,
  uniqueFields: Array<{ name: string }>,
  namingSuffix: string,
) => {
  const uniqueChecks = generateUniqueChecks(pascalCaseName, camelCaseName, uniqueFields, true);
  return `
  async update(id: string, dto: Update${pascalCaseName}${namingSuffix}Dto, select?: any, include?: any) {
    await this.getOne(id); // Check if exists

    // Check unique constraints for update
    ${uniqueChecks}

    const updateOptions: any = { where: { id }, data: dto };
    if (include) { updateOptions.include = include; } else { updateOptions.select = select ?? this.getSelectFields(); }
    const item = await this.prisma.${camelCaseName}.update(updateOptions);

    return item;
  }
`;
};

export const updateMany = (pascalCaseName: string, namingSuffix: string) => `
  async updateMany(ids: string[], dto: Update${pascalCaseName}${namingSuffix}Dto) {
    const items = await Promise.all(
      ids.map(id => this.update(id, dto))
    );

    return { data: items };
  }
`;

export const deleteOne = (pascalCaseName: string, camelCaseName: string) => `
  async deleteOne(id: string) {
    await this.getOne(id); // Check if exists

    await this.prisma.${camelCaseName}.delete({
      where: { id },
    });

    return { message: '${pascalCaseName} deleted successfully' };
  }
`;

export const deleteMany = () => `
  async deleteMany(ids: string[]) {
    const items = await Promise.all(
      ids.map(id => this.deleteOne(id))
    );

    return { data: items };
  }
`;

export const getSelectFields = (fields: string[], relationSelects: string[] = []) => {
  const fieldSelects = fields.map((field) => `${field}: true`).join(',\n      ');
  const relations = relationSelects.length > 0 ? `,\n      ${relationSelects.join(',\n      ')}` : '';

  return `
  private getSelectFields() {
    return {
      ${fieldSelects}${relations},
    };
  }
`;
};

export const generateUniqueChecks = (
  pascalCaseName: string,
  camelCaseName: string,
  fields: Array<{ name: string }>,
  isUpdate = false,
) => {
  if (fields.length === 0) return '';

  return fields
    .map((field) => {
      const condition = isUpdate
        ? `{ ${field.name}: dto.${field.name}, id: { not: id } }`
        : `{ ${field.name}: dto.${field.name} }`;

      return `const existing${field.name} = await this.prisma.${camelCaseName}.findFirst({
      where: ${condition},
    });

    if (existing${field.name}) {
      throw new ConflictException('${pascalCaseName} with this ${field.name} already exists');
    }`;
    })
    .join('\n\n    ');
};

export const getImportStatements = (
  pascalCaseName: string,
  camelCaseName: string,
  hasUniqueFields: boolean,
  fileSuffix: string,
  namingSuffix: string,
  options?: {
    serviceFilePath?: string;
    dtosPath?: string;
    utilsPath?: string;
    workspaceRoot?: string;
    prismaServicePath?: string;
  },
) => {
  // Require all path information - fail fast if not provided
  if (!options?.serviceFilePath) {
    throw new Error(
      'Service generator requires serviceFilePath to compute import paths. ' +
        'This is a configuration error in the generator setup.',
    );
  }

  if (!options?.dtosPath) {
    throw new Error(
      'Service generator requires dtosPath (output.backend.staticFiles.dtos) to compute import paths. ' +
        'Please ensure this is configured in your tgraph.config file.',
    );
  }

  if (!options?.utilsPath) {
    throw new Error(
      'Service generator requires utilsPath (output.backend.staticFiles.utils) to compute import paths. ' +
        'Please ensure this is configured in your tgraph.config file.',
    );
  }

  if (!options?.workspaceRoot) {
    throw new Error(
      'Service generator requires workspaceRoot to compute import paths. ' +
        'This is a configuration error in the generator setup.',
    );
  }

  const serviceDir = path.dirname(options.serviceFilePath);

  // Compute relative path to paginated-search-query.dto.ts
  const dtosFile = path.join(options.workspaceRoot, options.dtosPath, 'paginated-search-query.dto.ts');
  let paginatedSearchQueryDtoImport = path.relative(serviceDir, dtosFile).replace(/\\/g, '/').replace(/\.ts$/, '');
  if (!paginatedSearchQueryDtoImport.startsWith('.')) {
    paginatedSearchQueryDtoImport = './' + paginatedSearchQueryDtoImport;
  }

  // Compute relative path to paginated-search.ts
  const utilsFile = path.join(options.workspaceRoot, options.utilsPath, 'paginated-search.ts');
  let paginatedSearchImport = path.relative(serviceDir, utilsFile).replace(/\\/g, '/').replace(/\.ts$/, '');
  if (!paginatedSearchImport.startsWith('.')) {
    paginatedSearchImport = './' + paginatedSearchImport;
  }

  // Compute relative path to prisma.service.ts
  if (!options?.prismaServicePath) {
    throw new Error(
      'Service generator requires prismaServicePath (input.prismaService) to compute import paths. ' +
        'Please ensure this is configured in your tgraph.config file.',
    );
  }

  const prismaFile = path.join(options.workspaceRoot, options.prismaServicePath);
  let prismaServiceImport = path.relative(serviceDir, prismaFile).replace(/\\/g, '/').replace(/\.ts$/, '');
  if (!prismaServiceImport.startsWith('.')) {
    prismaServiceImport = './' + prismaServiceImport;
  }

  return `
import { Injectable, NotFoundException${hasUniqueFields ? ', ConflictException' : ''} } from '@nestjs/common';
import { PrismaService } from '${prismaServiceImport}';
import { PaginatedSearchQueryDto } from '${paginatedSearchQueryDtoImport}';
import { paginatedSearch } from '${paginatedSearchImport}';
import { Create${pascalCaseName}${namingSuffix}Dto } from './create-${camelCaseName}${fileSuffix ? `.${fileSuffix}` : ''}.dto';
import { Update${pascalCaseName}${namingSuffix}Dto } from './update-${camelCaseName}${fileSuffix ? `.${fileSuffix}` : ''}.dto';`;
};
