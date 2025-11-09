import type { AdapterDefinition } from '@tg-scripts/types';
import type { IGenerator } from '@tg-scripts/types';

export interface AdapterDtoGeneratorInput {
  adapter: AdapterDefinition;
  modelName: string;
}

/**
 * Generator for adapter input DTOs
 * 
 * Creates DTO classes with validation decorators for adapter endpoints
 */
export class AdapterDtoGenerator implements IGenerator<AdapterDtoGeneratorInput, string> {
  /**
   * Generate input DTO for an adapter
   * 
   * @param input - Adapter and model information
   * @returns Generated DTO class code
   */
  public generate(input: AdapterDtoGeneratorInput): string {
    const { adapter, modelName } = input;
    const dtoClassName = `${adapter.name}InputDto`;

    // For multipart adapters, generate a DTO that expects files
    if (adapter.type === 'multipart') {
      return this.generateMultipartDto(dtoClassName, adapter);
    }

    // For JSON adapters, generate a simple DTO
    return this.generateJsonDto(dtoClassName, adapter);
  }

  /**
   * Generate DTO for JSON-based adapters
   */
  private generateJsonDto(className: string, adapter: AdapterDefinition): string {
    const imports = this.getImports(false);

    return `${imports}

/**
 * Input DTO for ${adapter.name} adapter
 * 
 * Note: This is a generic DTO. You can create a custom DTO in the same directory
 * and reference it in your adapter if you need specific validation.
 */
export class ${className} {
  /**
   * Request body data
   * Define specific properties based on your adapter's needs
   */
  [key: string]: any;
}
`;
  }

  /**
   * Generate DTO for multipart/form-data adapters
   */
  private generateMultipartDto(className: string, adapter: AdapterDefinition): string {
    const imports = this.getImports(true);

    return `${imports}

/**
 * Input DTO for ${adapter.name} adapter (multipart/form-data)
 * 
 * Note: Files are handled separately via @UploadedFile() or @UploadedFiles()
 * This DTO represents the non-file fields from the multipart request
 */
export class ${className} {
  /**
   * Form data fields
   * Define specific properties based on your adapter's needs
   */
  [key: string]: any;
}
`;
  }

  /**
   * Get import statements for DTO
   */
  private getImports(includeFileValidation: boolean): string {
    const imports = [
      "import { ApiProperty } from '@nestjs/swagger';",
    ];

    if (includeFileValidation) {
      imports.push(
        "import { IsOptional, IsString } from 'class-validator';"
      );
    }

    return imports.join('\n');
  }

  /**
   * Generate all DTOs for multiple adapters
   * 
   * @param adapters - Array of adapter definitions
   * @param modelName - Associated model name
   * @returns Map of DTO filename to content
   */
  public generateAll(
    adapters: AdapterDefinition[],
    modelName: string
  ): Map<string, string> {
    const dtos = new Map<string, string>();

    for (const adapter of adapters) {
      const fileName = this.getDtoFileName(adapter);
      const content = this.generate({ adapter, modelName });
      dtos.set(fileName, content);
    }

    return dtos;
  }

  /**
   * Get DTO filename for an adapter
   * 
   * @param adapter - Adapter definition
   * @returns DTO filename (e.g., 'upload-image-input.dto.ts')
   */
  public getDtoFileName(adapter: AdapterDefinition): string {
    // Convert PascalCase adapter name to kebab-case
    const kebabName = adapter.name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();

    return `${kebabName}-input.dto.ts`;
  }

  /**
   * Get DTO class name for an adapter
   * 
   * @param adapter - Adapter definition
   * @returns DTO class name (e.g., 'UploadImageInputDto')
   */
  public getDtoClassName(adapter: AdapterDefinition): string {
    return `${adapter.name}InputDto`;
  }
}

