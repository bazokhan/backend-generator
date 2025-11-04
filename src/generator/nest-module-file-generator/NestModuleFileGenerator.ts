import type { PrismaModel } from '@tg-scripts/types';
import type { GeneratorOptions, IGenerator } from '@tg-scripts/types';
import { toCamelCase } from '../utils';

export class NestModuleFileGenerator implements IGenerator<PrismaModel, string> {
  private namingSuffix: string;
  private fileSuffix: string;
  constructor(options: GeneratorOptions) {
    this.fileSuffix = options.suffix ? options.suffix.toLowerCase() : '';
    this.namingSuffix = options.suffix
      ? options.suffix.charAt(0).toUpperCase() + options.suffix.slice(1).toLowerCase()
      : '';
  }
  public generate(model: PrismaModel): string {
    const pascalCaseName = model.name;
    const camelCaseName = toCamelCase(model.name);
    const moduleName = `${pascalCaseName}Module`;
    const controllerName = `${pascalCaseName}${this.namingSuffix}Controller`;
    const serviceName = `${pascalCaseName}${this.namingSuffix}Service`;
    const controllerFileName = `${camelCaseName}.${this.fileSuffix}.controller`;
    const serviceFileName = `${camelCaseName}.${this.fileSuffix}.service`;

    return `import { Module } from '@nestjs/common';
    import { ${controllerName} } from './${controllerFileName}';
    import { ${serviceName} } from './${serviceFileName}';

    @Module({
      controllers: [${controllerName}],
      providers: [${serviceName}],
      exports: [${serviceName}],
    })
    export class ${moduleName} {}
    `;
  }
}
