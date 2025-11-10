import * as fs from 'fs';
import * as path from 'path';
import type { AdapterDefinition } from '@tg-scripts/types';
import type { PrismaModel } from '@tg-scripts/types';

/**
 * Parser for discovering and loading adapter files
 *
 * Adapters are discovered in the {modulePath}/adapters/*.adapter.ts directory
 */
export class AdapterParser {
  /**
   * Discover adapter files for a given model
   *
   * @param model - Prisma model to find adapters for
   * @returns Array of discovered adapter files
   */
  public discoverAdapters(model: PrismaModel): string[] {
    if (!model.modulePath) {
      return [];
    }

    const adaptersPath = path.join(model.modulePath, 'adapters');

    // Check if adapters directory exists
    if (!fs.existsSync(adaptersPath)) {
      return [];
    }

    try {
      const files = fs.readdirSync(adaptersPath);
      return files
        .filter((file) => file.endsWith('.adapter.ts') || file.endsWith('.adapter.js'))
        .map((file) => path.join(adaptersPath, file));
    } catch (error) {
      console.warn(`Warning: Could not read adapters directory for ${model.name}:`, error);
      return [];
    }
  }

  /**
   * Parse an adapter file and extract its configuration and handler code
   *
   * @param adapterFilePath - Path to the adapter file
   * @param workspaceRoot - Project root directory
   * @returns Parsed adapter definition or null if parsing fails
   */
  public async parseAdapter(adapterFilePath: string, workspaceRoot: string): Promise<AdapterDefinition | null> {
    try {
      // Get adapter name from filename
      const fileName = path.basename(adapterFilePath);
      const adapterName = this.extractAdapterName(fileName);

      // Read the file content
      const fileContent = fs.readFileSync(adapterFilePath, 'utf-8');

      // Extract configuration and type using regex patterns
      const adapterInfo = this.extractAdapterInfo(fileContent);

      if (!adapterInfo) {
        console.warn(`Warning: Could not extract adapter info from ${adapterFilePath}`);
        return null;
      }

      return {
        filePath: adapterFilePath,
        name: adapterName,
        type: adapterInfo.type,
        config: adapterInfo.config,
        handlerCode: adapterInfo.handlerCode,
      };
    } catch (error) {
      console.warn(`Warning: Failed to parse adapter ${adapterFilePath}:`, error);
      return null;
    }
  }

  /**
   * Extract adapter name from filename
   *
   * @param fileName - Adapter filename
   * @returns Adapter name in PascalCase
   *
   * @example
   * extractAdapterName('upload-image.adapter.ts') => 'UploadImage'
   */
  private extractAdapterName(fileName: string): string {
    // Remove .adapter.ts or .adapter.js extension
    const nameWithoutExt = fileName.replace(/\.adapter\.(ts|js)$/, '');

    // Convert kebab-case to PascalCase
    return nameWithoutExt
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Extract adapter configuration, type, and handler code from file content
   * Uses regex to avoid runtime dependency issues
   */
  private extractAdapterInfo(fileContent: string): {
    type: 'json' | 'multipart';
    config: any;
    handlerCode: string;
  } | null {
    // Pattern to match: adapter.json({ config }, async (ctx) => { ... })
    // or: adapter.multipart({ config }, async (ctx) => { ... })
    const adapterPattern =
      /adapter\.(json|multipart)\s*\(\s*(\{[\s\S]*?\})\s*,\s*(async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\})\s*\)/;

    const match = fileContent.match(adapterPattern);

    if (!match) {
      return null;
    }

    const [, type, configStr, handlerStr] = match;

    if (!type || !configStr || !handlerStr) {
      console.warn('Incomplete adapter match - missing type, config, or handler');
      return null;
    }

    try {
      // Parse the config object (safely evaluate it)
      const config = this.parseConfigObject(configStr);

      return {
        type: type as 'json' | 'multipart',
        config,
        handlerCode: handlerStr.trim(),
      };
    } catch (error) {
      console.warn('Failed to parse adapter config:', error);
      return null;
    }
  }

  /**
   * Parse configuration object from string
   * This is a simple parser that handles basic object literals
   */
  private parseConfigObject(configStr: string): any {
    try {
      // Remove comments
      const cleaned = configStr.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

      // Try to evaluate as JSON5-like object
      // Convert single quotes to double quotes for JSON parsing
      const jsonLike = cleaned
        .replace(/'/g, '"')
        .replace(/(\w+):/g, '"$1":') // Add quotes to keys
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

      return JSON.parse(jsonLike);
    } catch {
      // Fallback: try to extract key-value pairs manually
      return this.parseConfigManually(configStr);
    }
  }

  /**
   * Manually parse config object by extracting key-value pairs
   */
  private parseConfigManually(configStr: string): any {
    const config: any = {};

    // Extract method
    const methodMatch = configStr.match(/method:\s*['"](\w+)['"]/);
    if (methodMatch) config.method = methodMatch[1];

    // Extract path
    const pathMatch = configStr.match(/path:\s*['"]([^'"]+)['"]/);
    if (pathMatch) config.path = pathMatch[1];

    // Extract target
    const targetMatch = configStr.match(/target:\s*['"]([^'"]+)['"]/);
    if (targetMatch) config.target = targetMatch[1];

    // Extract auth (string or array)
    const authMatch = configStr.match(/auth:\s*['"]([^'"]+)['"]/);
    if (authMatch && authMatch[1]) {
      config.auth = authMatch[1];
    } else {
      const authArrayMatch = configStr.match(/auth:\s*\[([^\]]+)\]/);
      if (authArrayMatch && authArrayMatch[1]) {
        config.auth = authArrayMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
      }
    }

    // Extract select (array)
    const selectMatch = configStr.match(/select:\s*\[([^\]]+)\]/);
    if (selectMatch && selectMatch[1]) {
      config.select = selectMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
    }

    // Extract include (array)
    const includeMatch = configStr.match(/include:\s*\[([^\]]+)\]/);
    if (includeMatch && includeMatch[1]) {
      config.include = includeMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
    }

    // Extract description
    const descMatch = configStr.match(/description:\s*['"]([^'"]+)['"]/);
    if (descMatch) config.description = descMatch[1];

    // Extract summary
    const summaryMatch = configStr.match(/summary:\s*['"]([^'"]+)['"]/);
    if (summaryMatch) config.summary = summaryMatch[1];

    return config;
  }

  /**
   * Parse all adapters for a given model
   *
   * @param model - Prisma model
   * @param workspaceRoot - Project root directory
   * @returns Array of parsed adapter definitions
   */
  public async parseAdapters(model: PrismaModel, workspaceRoot: string): Promise<AdapterDefinition[]> {
    const adapterFiles = this.discoverAdapters(model);

    if (adapterFiles.length === 0) {
      return [];
    }

    const adapters: AdapterDefinition[] = [];

    for (const filePath of adapterFiles) {
      const adapter = await this.parseAdapter(filePath, workspaceRoot);
      if (adapter) {
        adapters.push(adapter);
      }
    }

    return adapters;
  }
}
