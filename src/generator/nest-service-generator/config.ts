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
  async getOne(id: string) {
    const item = await this.prisma.${camelCaseName}.findUnique({
      where: { id },
      select: this.getSelectFields(),
    });

    if (!item) {
      throw new NotFoundException('${pascalCaseName} not found');
    }

    return item;
  }
`;

export const getMany = (camelCaseName: string) => `
  async getMany(ids: string[]) {
    const items = await this.prisma.${camelCaseName}.findMany({
      where: { id: { in: ids } },
      select: this.getSelectFields(),
    });

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
  async create(dto: Create${pascalCaseName}${namingSuffix}Dto) {
    // Check unique constraints
    ${uniqueChecks}

    const item = await this.prisma.${camelCaseName}.create({
      data: dto,
      select: this.getSelectFields(),
    });

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
  async update(id: string, dto: Update${pascalCaseName}${namingSuffix}Dto) {
    await this.getOne(id); // Check if exists

    // Check unique constraints for update
    ${uniqueChecks}

    const item = await this.prisma.${camelCaseName}.update({
      where: { id },
      data: dto,
      select: this.getSelectFields(),
    });

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

export const getSelectFields = (fields: string[]) => `
  private getSelectFields() {
    return {
      ${fields.map((field) => `${field}: true`).join(',\n      ')},
    };
  }
`;

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
) => {
  return `
import { Injectable, NotFoundException${hasUniqueFields ? ', ConflictException' : ''} } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PaginatedSearchQueryDto } from '@/dtos/paginated-search-query.dto';
import { paginatedSearch } from '@/utils/paginated-search';
import { Create${pascalCaseName}${namingSuffix}Dto } from './create-${camelCaseName}${fileSuffix ? `.${fileSuffix}` : ''}.dto';
import { Update${pascalCaseName}${namingSuffix}Dto } from './update-${camelCaseName}${fileSuffix ? `.${fileSuffix}` : ''}.dto';`;
};
