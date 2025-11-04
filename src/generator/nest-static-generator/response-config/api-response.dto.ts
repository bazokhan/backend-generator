export const generateApiResponseDto = () => `import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'The response data',
  })
  data: T;

  @ApiProperty({
    description: 'Optional success message',
    required: false,
  })
  message?: string | undefined;
}
`;
