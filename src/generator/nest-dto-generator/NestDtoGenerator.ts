import type { PrismaModel, DtoType } from '@tg-scripts/types';
import type { GeneratorOptions, IGenerator } from '@tg-scripts/types';
import { generateDtoImports, filterDtoFields, generateFieldDefinition } from '../utils';

export type GenerateDtoInput = {
  model: PrismaModel;
  dtoType: DtoType;
  enums: Map<string, string[]>;
};

export interface NestDtoGeneratorOptions extends GeneratorOptions {
  suffix: string;
}

export class NestDtoGenerator implements IGenerator<GenerateDtoInput, string> {
  private namingSuffix: string;
  constructor(options: NestDtoGeneratorOptions) {
    this.namingSuffix = options.suffix
      ? options.suffix.charAt(0).toUpperCase() + options.suffix.slice(1).toLowerCase()
      : '';
  }
  /**
   * Unified function to generate any DTO type
   * All DTO generation follows the same 4-step pattern:
   * 1. Filter/get fields based on DTO type
   * 2. Generate imports
   * 3. Generate field definitions
   * 4. Assemble the class
   */
  public generate(input: GenerateDtoInput): string {
    const { model, dtoType, enums } = input;
    // Step 1: Filter fields based on DTO type
    const fields = filterDtoFields(model.fields, dtoType);

    // Step 2: Generate imports
    const otherImports = generateDtoImports(model, fields, dtoType);
    const imports = `import { ApiProperty } from '@nestjs/swagger';${otherImports ? `\n${otherImports}` : ''}`;

    // Step 3: Generate field definitions
    const fieldDefinitions = fields
      .map((field) => generateFieldDefinition(field, dtoType, enums))
      .join(
        dtoType === 'response' ? '\n\n' : '\n', // Extra spacing for Response DTOs
      );

    // Step 4: Assemble the class
    const className =
      dtoType === 'response'
        ? `${model.name}ResponseDto`
        : dtoType === 'create'
          ? `Create${model.name}${this.namingSuffix}Dto`
          : `Update${model.name}${this.namingSuffix}Dto`;

    return `${imports}\n\nexport class ${className} {\n${fieldDefinitions}\n}\n`;
  }
}
