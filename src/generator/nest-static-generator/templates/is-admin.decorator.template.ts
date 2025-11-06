export const isAdminDecoratorTemplate = `import { applyDecorators, UseGuards } from '@nestjs/common';
{{guardImports}}

export function IsAdmin() {
  return applyDecorators(
    UseGuards({{guardNames}}),
  );
}
`;

