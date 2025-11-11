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
    console.log('[Adapter DTO Gen] Generating DTO for', input.adapter.name);
    
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
    // If we have extracted type information, generate a proper DTO
    if (adapter.bodyType && adapter.bodyType.properties.length > 0) {
      return this.generateTypedDto(className, adapter);
    }

    // Otherwise, generate a generic DTO
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
   * Generate a typed DTO from extracted type information
   */
  private generateTypedDto(className: string, adapter: AdapterDefinition): string {
    if (!adapter.bodyType) return this.generateJsonDto(className, adapter);

    const { bodyType } = adapter;
    const imports = new Set<string>([
      "import { ApiProperty } from '@nestjs/swagger';",
      "import { IsOptional, IsString, IsNumber, IsBoolean, IsArray } from 'class-validator';",
    ]);

    // Add imports from the original type definition
    bodyType.imports.forEach((imp) => {
      if (!imp.isTypeOnly) {
        imports.add(`import { ${imp.name} } from '${imp.from}';`);
      }
    });

    const importsStr = Array.from(imports).join('\n');

    // Generate properties
    const properties = bodyType.properties.map((prop) => {
      const decorators: string[] = [];
      
      // Add ApiProperty decorator
      const apiPropOptions: string[] = [];
      if (prop.description) {
        apiPropOptions.push(`description: '${prop.description}'`);
      }
      if (prop.type !== 'any') {
        apiPropOptions.push(`type: '${this.getSwaggerType(prop.type)}'`);
      }
      if (prop.isOptional) {
        apiPropOptions.push('required: false');
      }
      
      decorators.push(`  @ApiProperty(${apiPropOptions.length > 0 ? `{ ${apiPropOptions.join(', ')} }` : '()'})`);
      
      // Add validation decorators
      if (prop.isOptional) {
        decorators.push('  @IsOptional()');
      }
      
      const validator = this.getValidatorDecorator(prop.type, prop.isArray);
      if (validator) {
        decorators.push(`  @${validator}`);
      }

      // Generate property declaration
      const optionalModifier = prop.isOptional ? '?' : '';
      const typeAnnotation = prop.isArray ? `${prop.type}[]` : prop.type;
      
      return `${decorators.join('\n')}\n  ${prop.name}${optionalModifier}: ${typeAnnotation};`;
    }).join('\n\n');

    return `${importsStr}

/**
 * Input DTO for ${adapter.name} adapter
 * Generated from type: ${bodyType.name}
 */
export class ${className} {
${properties}
}
`;
  }

  /**
   * Get Swagger type for TypeScript type
   */
  private getSwaggerType(tsType: string): string {
    if (tsType.includes('string')) return 'string';
    if (tsType.includes('number')) return 'number';
    if (tsType.includes('boolean')) return 'boolean';
    if (tsType.includes('Date')) return 'string'; // ISO date string
    return 'object';
  }

  /**
   * Get class-validator decorator for type
   */
  private getValidatorDecorator(tsType: string, isArray: boolean): string | null {
    if (isArray) return 'IsArray()';
    if (tsType.includes('string')) return 'IsString()';
    if (tsType.includes('number')) return 'IsNumber()';
    if (tsType.includes('boolean')) return 'IsBoolean()';
    return null;
  }

  /**
   * Get import statements for DTO
   */
  private getImports(includeFileValidation: boolean): string {
    const imports = ["import { ApiProperty } from '@nestjs/swagger';"];

    if (includeFileValidation) {
      imports.push("import { IsOptional, IsString } from 'class-validator';");
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
  public generateAll(adapters: AdapterDefinition[], modelName: string): Map<string, string> {
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
    const kebabName = adapter.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

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
