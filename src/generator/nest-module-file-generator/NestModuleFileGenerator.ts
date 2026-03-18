import type { PrismaModel } from '@tg-scripts/types';
import type { GeneratorOptions, IGenerator } from '@tg-scripts/types';
import { toCamelCase } from '../utils';

export interface ModuleGenerateOptions {
  prismaServiceImportPath?: string;
}

export class NestModuleFileGenerator implements IGenerator<PrismaModel, string> {
  private fileSuffix: string;
  private namingSuffix: string;
  constructor(options: GeneratorOptions) {
    this.fileSuffix = options.suffix ? options.suffix.toLowerCase() : '';
    this.namingSuffix = options.suffix
      ? options.suffix.charAt(0).toUpperCase() + options.suffix.slice(1).toLowerCase()
      : '';
  }
  public generate(model: PrismaModel, options?: ModuleGenerateOptions): string {
    const pascalCaseName = model.name;
    const camelCaseName = toCamelCase(model.name);
    const moduleName = `${pascalCaseName}Module`;
    const controllerName = `${pascalCaseName}${this.namingSuffix}Controller`;
    const serviceName = `${pascalCaseName}${this.namingSuffix}Service`;
    const controllerFileName = this.fileSuffix ? `${camelCaseName}.${this.fileSuffix}.controller` : `${camelCaseName}.controller`;
    const serviceFileName = this.fileSuffix ? `${camelCaseName}.${this.fileSuffix}.service` : `${camelCaseName}.service`;

    const prismaImport = options?.prismaServiceImportPath
      ? `\nimport { PrismaService } from '${options.prismaServiceImportPath}';`
      : '';
    const prismaProvider = options?.prismaServiceImportPath ? ', PrismaService' : '';

    return `import { Module } from '@nestjs/common';
import { ${controllerName} } from './${controllerFileName}';
import { ${serviceName} } from './${serviceFileName}';${prismaImport}

@Module({
  controllers: [${controllerName}],
  providers: [${serviceName}${prismaProvider}],
  exports: [${serviceName}],
})
export class ${moduleName} {}
`;
  }
}
