// STEP 1
import type { GeneratorOptions } from '@tg-scripts/types';

export interface AdminGuardGeneratorOptions extends GeneratorOptions {
  rolesEnumName: string;
  prismaGeneratedPath: string;
  adminRole: string;
}

export const generateAdminGuard = (
  options: AdminGuardGeneratorOptions,
) => `import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ${options.rolesEnumName} } from '${options.prismaGeneratedPath}';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const httpRequest = context.switchToHttp().getRequest();
    return httpRequest.user?.role === ${options.rolesEnumName}.${options.adminRole};
  }
}
`;
