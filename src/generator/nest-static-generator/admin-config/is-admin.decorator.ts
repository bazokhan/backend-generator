// STEP 2
import type { GeneratorOptions, Guard } from '@tg-scripts/types';

export interface IsAdminDecoratorGeneratorOptions extends GeneratorOptions {
  guards: Guard[];
}

export const generateIsAdminDecorator = (options: IsAdminDecoratorGeneratorOptions) => `import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
${options.guards.map((guard) => `import { ${guard.name} } from '${guard.path}';`).join('\n')}

export function IsAdmin() {
  return applyDecorators(
    UseGuards(${options.guards.map((guard) => `${guard.name}`).join(', ')}),
    ApiBearerAuth(),
    ApiForbiddenResponse({ description: 'Forbidden - Admin access required' }),
  );
}
`;
