export interface StaticTemplateOptions {
  rolesEnumName: string;
  prismaGeneratedPath: string;
  adminRole: string;
  defaultLimit: number;
  defaultPage: number;
};

export const defaultStaticGeneratorOptions: StaticTemplateOptions = {
  rolesEnumName: 'Role',
  prismaGeneratedPath: '@/generated/prisma',
  adminRole: 'ADMIN',
  defaultLimit: 10,
  defaultPage: 1,
};
