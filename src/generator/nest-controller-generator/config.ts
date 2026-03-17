export const getList = (pascalCaseName: string, camelCaseName: string, namingSuffix: string) => `
  @Get()
  @PaginatedSearch<${pascalCaseName}>()
  @ApiOperation({ summary: 'Get all ${camelCaseName}s' })
  @ApiResponse({
    status: 200,
    description: 'List of all ${camelCaseName}s',
    type: PaginatedSearchResultDto<${pascalCaseName}>,
  })
  async getList(@Query() query: PaginatedSearchQueryDto) {
    const result = await this.${camelCaseName}${namingSuffix}Service.getList(query);
    return { data: result.data, total: result.total, page: result.page, limit: result.limit };
  }
`;

export const getOne = (pascalCaseName: string, camelCaseName: string, namingSuffix: string) => `
  @Get(':id')
  @ApiOperation({ summary: 'Get ${camelCaseName} by ID' })
  @ApiResponse({
    status: 200,
    description: '${pascalCaseName} found',
    type: ApiResponseDto<${pascalCaseName}>,
  })
  @ApiResponse({ status: 404, description: '${pascalCaseName} not found' })
  async getOne(@Param('id') id: string) {
    const item = await this.${camelCaseName}${namingSuffix}Service.getOne(id);
    return { data: item };
  }
`;

export const getMany = (pascalCaseName: string, camelCaseName: string, namingSuffix: string) => `
  @Get('many')
  @ApiOperation({ summary: 'Get multiple ${camelCaseName}s by IDs' })
  @ApiResponse({
    status: 200,
    description: '${pascalCaseName}s found',
    type: ApiResponseDto<${pascalCaseName}[]>,
  })
  async getMany(@Query('ids') ids: string) {
    const idArray = ids.split(',').filter(id => id.trim());
    const result = await this.${camelCaseName}${namingSuffix}Service.getMany(idArray);
    return result;
  }
`;

export const getManyReference = (pascalCaseName: string, camelCaseName: string, namingSuffix: string) => `
  @Get('reference/:target/:id')
  @PaginatedSearch<${pascalCaseName}>()
  @ApiOperation({ summary: 'Get ${camelCaseName}s by reference' })
  @ApiResponse({
    status: 200,
    description: '${pascalCaseName}s found',
    type: PaginatedSearchResultDto<${pascalCaseName}>,
  })
  async getManyReference(
    @Param('target') target: string,
    @Param('id') id: string,
    @Query() query: PaginatedSearchQueryDto,
  ) {
    const result = await this.${camelCaseName}${namingSuffix}Service.getManyReference(target, id, query);
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
`;

export const create = (pascalCaseName: string, camelCaseName: string, namingSuffix: string) => `
  @Post()
  @ApiOperation({ summary: 'Create a new ${camelCaseName}' })
  @ApiResponse({
    status: 201,
    description: '${pascalCaseName} created successfully',
    type: ApiResponseDto<${pascalCaseName}>,
  })
  async create(@Body() dto: Create${pascalCaseName}${namingSuffix}Dto) {
    const item = await this.${camelCaseName}${namingSuffix}Service.create(dto);
    return { data: item, message: '${pascalCaseName} created successfully' };
  }
`;

export const update = (pascalCaseName: string, camelCaseName: string, namingSuffix: string) => `
  @Put(':id')
  @ApiOperation({ summary: 'Update ${camelCaseName}' })
  @ApiResponse({
    status: 200,
    description: '${pascalCaseName} updated successfully',
    type: ApiResponseDto<${pascalCaseName}>,
  })
  @ApiResponse({ status: 404, description: '${pascalCaseName} not found' })
  async update(@Param('id') id: string, @Body() dto: Update${pascalCaseName}${namingSuffix}Dto) {
    const item = await this.${camelCaseName}${namingSuffix}Service.update(id, dto);
    return { data: item, message: '${pascalCaseName} updated successfully' };
  }
`;

export const updateMany = (pascalCaseName: string, camelCaseName: string, namingSuffix: string) => `
  @Put('many')
  @ApiOperation({ summary: 'Update multiple ${camelCaseName}s' })
  @ApiResponse({
    status: 200,
    description: '${pascalCaseName}s updated successfully',
    type: ApiResponseDto<${pascalCaseName}[]>,
  })
  async updateMany(@Body() body: { ids: string[]; data: Update${pascalCaseName}${namingSuffix}Dto }) {
    const result = await this.${camelCaseName}${namingSuffix}Service.updateMany(body.ids, body.data);
    return { data: result.data, message: '${pascalCaseName}s updated successfully' };
  }
`;

export const deleteOne = (pascalCaseName: string, camelCaseName: string, namingSuffix: string) => `
  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${camelCaseName}' })
  @ApiResponse({
    status: 200,
    description: '${pascalCaseName} deleted successfully',
    type: ApiResponseDto<{ message: string }>,
  })
  @ApiResponse({ status: 404, description: '${pascalCaseName} not found' })
  async deleteOne(@Param('id') id: string) {
    const result = await this.${camelCaseName}${namingSuffix}Service.deleteOne(id);
    return result;
  }
`;

export const deleteMany = (pascalCaseName: string, camelCaseName: string, namingSuffix: string) => `
  @Delete('many')
  @ApiOperation({ summary: 'Delete multiple ${camelCaseName}s' })
  @ApiResponse({
    status: 200,
    description: '${pascalCaseName}s deleted successfully',
    type: ApiResponseDto<{ message: string }[]>,
  })
  async deleteMany(@Body() body: { ids: string[] }) {
    const result = await this.${camelCaseName}${namingSuffix}Service.deleteMany(body.ids);
    return { data: result.data, message: '${pascalCaseName}s deleted successfully' };
  }
`;

interface ControllerImportOptions {
  pascalCaseName: string;
  camelCaseName: string;
  fileSuffix: string;
  namingSuffix: string;
  isAdmin: boolean;
  guardImports?: string;
  includeUseGuards?: boolean;
}

export const getControllerImportStatements = ({
  pascalCaseName,
  camelCaseName,
  fileSuffix,
  namingSuffix,
  isAdmin,
  guardImports,
  includeUseGuards,
}: ControllerImportOptions) => {
  const commonImports = ['Controller', 'Get', 'Post', 'Put', 'Delete', 'Body', 'Param', 'Query'];

  if (includeUseGuards) {
    commonImports.push('UseGuards');
  }

  const importLines: string[] = [
    `import { ${commonImports.join(', ')} } from '@nestjs/common';`,
    `import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';`,
  ];

  if (isAdmin) {
    importLines.push(`import { IsAdmin } from '@/decorators/is-admin.decorator';`);
  }

  if (guardImports && guardImports.trim().length > 0) {
    importLines.push(...guardImports.split('\n').filter((line) => line.trim().length > 0));
  }

  importLines.push(
    `import { PaginatedSearch } from '@/decorators/paginated-search.decorator';`,
    `import { ApiResponseDto } from '@/dtos/api-response.dto';`,
    `import { PaginatedSearchResultDto } from '@/dtos/paginated-search-result.dto';`,
    `import { PaginatedSearchQueryDto } from '@/dtos/paginated-search-query.dto';`,
    `import { ${pascalCaseName}${namingSuffix}Service } from './${camelCaseName}${fileSuffix ? `.${fileSuffix}` : ''}.service';`,
    `import { Create${pascalCaseName}${namingSuffix}Dto } from './create-${camelCaseName}${fileSuffix ? `.${fileSuffix}` : ''}.dto';`,
    `import { Update${pascalCaseName}${namingSuffix}Dto } from './update-${camelCaseName}${fileSuffix ? `.${fileSuffix}` : ''}.dto';`,
    `import { ${pascalCaseName} } from '@/generated/prisma';`,
  );

  return `\n${importLines.join('\n')}\n`;
};
