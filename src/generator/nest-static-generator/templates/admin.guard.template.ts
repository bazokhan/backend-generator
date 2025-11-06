export const adminGuardTemplate = `import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { {{rolesEnumName}} } from '{{prismaGeneratedPath}}';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const httpRequest = context.switchToHttp().getRequest();
    return httpRequest.user?.role === {{rolesEnumName}}.{{adminRole}};
  }
}
`;

