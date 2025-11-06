export const apiResponseDtoTemplate = `export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;

  constructor(data?: T, message?: string, error?: string) {
    this.success = !error;
    this.data = data;
    this.message = message;
    this.error = error;
  }

  static ok<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(data, message);
  }

  static error<T = never>(error: string): ApiResponseDto<T> {
    return new ApiResponseDto(undefined as any, undefined, error);
  }
}
`;

