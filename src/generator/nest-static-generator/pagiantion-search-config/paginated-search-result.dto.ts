// STEP 1
export const generatePaginatedSearchResultDto = () =>
  `import { ApiProperty } from '@nestjs/swagger';

export class PaginatedSearchResultDto<T> {
  @ApiProperty({
    description: 'The data',
    example: [],
  })
  data: T[];

  @ApiProperty({
    description: 'The total number of items',
    example: 10,
  })
  total: number;

  @ApiProperty({
    description: 'The page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'The number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Optional success message',
    required: false,
  })
  message?: string | undefined;
}
`;
