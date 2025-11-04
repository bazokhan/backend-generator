// STEP 4
export const generatePaginatedSearchQueryDto = () => `import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, Min, Max, IsString, IsInt } from 'class-validator';

export class PaginatedSearchQueryDto {
  @ApiProperty({
    description: 'The number of items to return',
    required: false,
    default: 10,
    example: 10,
  })
  @IsInt()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @Min(1)
  @Max(1000)
  limit?: string | undefined;

  @ApiProperty({
    description: 'The page number',
    required: false,
    default: 1,
    example: 1,
  })
  @IsInt()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @Min(1)
  page?: string | undefined;

  @ApiProperty({
    description: 'The search text',
    example: 'John',
    required: false,
    default: '',
  })
  @IsString()
  @IsOptional()
  search?: string | undefined;

  @ApiProperty({
    description: 'The sort order',
    example: 'asc',
    required: false,
    default: 'asc',
  })
  @IsString()
  @IsOptional()
  sort?: 'asc' | 'desc';

  @ApiProperty({
    description: 'The field to sort by',
    example: 'name',
    required: false,
    default: 'name',
  })
  @IsString()
  @IsOptional()
  sortBy?: string | undefined;
}
`;
