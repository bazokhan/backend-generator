import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export interface ExtractedType {
  name: string;
  properties: PropertyDefinition[];
  imports: ImportInfo[];
}

export interface PropertyDefinition {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  description?: string;
}

export interface ImportInfo {
  name: string;
  from: string;
  isTypeOnly: boolean;
}

/**
 * Extracts type definitions from TypeScript adapter files
 * Uses TypeScript Compiler API for accurate parsing
 */
export class TypeExtractor {
  /**
   * Extract the TBody type name from adapter call
   * 
   * @example
   * adapter.json<CreateProjectDto, any, any, Result>(...)
   * Returns: 'CreateProjectDto'
   */
  public extractTBodyTypeName(fileContent: string): string | null {
    console.log('[Type Extractor] Extracting TBody type name');
    
    // Pattern to match adapter.json<TBody, ...>( or adapter.multipart<TBody, ...>(
    const pattern = /adapter\.(json|multipart)\s*<\s*([^,<>]+)/;
    const match = fileContent.match(pattern);
    
    if (match && match[2]) {
      const typeName = match[2].trim();
      console.log('[Type Extractor] Found TBody type:', typeName);
      return typeName;
    }
    
    console.log('[Type Extractor] No TBody type found');
    return null;
  }

  /**
   * Extract type definition from file content
   * 
   * @param fileContent - Content of the adapter file
   * @param typeName - Name of the type to extract
   * @param adapterFilePath - Optional path to the adapter file for resolving imports
   * @returns Extracted type information or null
   */
  public extractTypeDefinition(
    fileContent: string,
    typeName: string,
    adapterFilePath?: string,
  ): ExtractedType | null {
    console.log('[Type Extractor] Extracting type definition for', typeName);
    
    // Create a TypeScript source file
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      fileContent,
      ts.ScriptTarget.Latest,
      true,
    );

    // Find imports
    const imports = this.extractImports(sourceFile);
    
    // Find the type definition (type, interface, or class)
    let typeNode: ts.TypeAliasDeclaration | ts.InterfaceDeclaration | ts.ClassDeclaration | null = null;
    
    const visit = (node: ts.Node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
        typeNode = node;
      } else if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
        typeNode = node;
      } else if (ts.isClassDeclaration(node) && node.name?.text === typeName) {
        typeNode = node;
      }
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    
    if (!typeNode) {
      console.log('[Type Extractor] Type definition not found:', typeName);
      return null;
    }

    // Extract properties from the type
    const properties = this.extractProperties(typeNode, sourceFile, fileContent, adapterFilePath);
    
    console.log('[Type Extractor] Extracted', properties.length, 'properties');
    
    return {
      name: typeName,
      properties,
      imports,
    };
  }

  /**
   * Extract imports from source file
   */
  private extractImports(sourceFile: ts.SourceFile): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    sourceFile.statements.forEach((statement) => {
      if (ts.isImportDeclaration(statement)) {
        const moduleSpecifier = statement.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const from = moduleSpecifier.text;
          const isTypeOnly = statement.importClause?.isTypeOnly ?? false;
          
          if (statement.importClause?.namedBindings) {
            if (ts.isNamedImports(statement.importClause.namedBindings)) {
              statement.importClause.namedBindings.elements.forEach((element) => {
                imports.push({
                  name: element.name.text,
                  from,
                  isTypeOnly: isTypeOnly || element.isTypeOnly,
                });
              });
            }
          }
        }
      }
    });
    
    return imports;
  }

  /**
   * Extract properties from type, interface, or class node
   */
  private extractProperties(
    node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration | ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
    fileContent: string,
    adapterFilePath?: string,
  ): PropertyDefinition[] {
    if (ts.isInterfaceDeclaration(node)) {
      return this.extractInterfaceProperties(node, sourceFile);
    } else if (ts.isTypeAliasDeclaration(node)) {
      return this.extractTypeAliasProperties(node, sourceFile, fileContent, adapterFilePath);
    } else if (ts.isClassDeclaration(node)) {
      return this.extractClassProperties(node, sourceFile);
    }
    
    return [];
  }

  /**
   * Extract properties from interface declaration
   */
  private extractInterfaceProperties(
    node: ts.InterfaceDeclaration,
    sourceFile: ts.SourceFile,
  ): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    
    node.members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.name) {
        const name = member.name.getText(sourceFile);
        const type = member.type ? member.type.getText(sourceFile) : 'any';
        const isOptional = member.questionToken !== undefined;
        const isArray = member.type ? ts.isArrayTypeNode(member.type) : false;
        
        properties.push({
          name,
          type,
          isOptional,
          isArray,
        });
      }
    });
    
    return properties;
  }

  /**
   * Extract properties from class declaration
   */
  private extractClassProperties(
    node: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
  ): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    
    node.members.forEach((member) => {
      if (ts.isPropertyDeclaration(member) && member.name) {
        const name = member.name.getText(sourceFile);
        const type = member.type ? member.type.getText(sourceFile) : 'any';
        const isOptional = member.questionToken !== undefined;
        const isArray = member.type ? ts.isArrayTypeNode(member.type) : false;
        
        properties.push({
          name,
          type,
          isOptional,
          isArray,
        });
      }
    });
    
    return properties;
  }

  /**
   * Extract properties from type alias
   * Handles Omit, Pick, intersection types, etc.
   */
  private extractTypeAliasProperties(
    node: ts.TypeAliasDeclaration,
    sourceFile: ts.SourceFile,
    fileContent: string,
    adapterFilePath?: string,
  ): PropertyDefinition[] {
    const typeNode = node.type;
    
    // Handle intersection types (A & B)
    if (ts.isIntersectionTypeNode(typeNode)) {
      return this.extractIntersectionProperties(typeNode, sourceFile, fileContent, adapterFilePath);
    }
    
    // Handle type references (Omit, Pick, etc.)
    if (ts.isTypeReferenceNode(typeNode)) {
      return this.extractTypeReferenceProperties(typeNode, sourceFile, fileContent, adapterFilePath);
    }
    
    // Handle object type literals
    if (ts.isTypeLiteralNode(typeNode)) {
      return this.extractTypeLiteralProperties(typeNode, sourceFile);
    }
    
    return [];
  }

  /**
   * Extract properties from intersection type (A & B & C)
   */
  private extractIntersectionProperties(
    node: ts.IntersectionTypeNode,
    sourceFile: ts.SourceFile,
    fileContent: string,
    adapterFilePath?: string,
  ): PropertyDefinition[] {
    const allProperties: PropertyDefinition[] = [];
    
    node.types.forEach((typeNode) => {
      if (ts.isTypeReferenceNode(typeNode)) {
        const props = this.extractTypeReferenceProperties(typeNode, sourceFile, fileContent, adapterFilePath);
        allProperties.push(...props);
      } else if (ts.isTypeLiteralNode(typeNode)) {
        const props = this.extractTypeLiteralProperties(typeNode, sourceFile);
        allProperties.push(...props);
      }
    });
    
    return allProperties;
  }

  /**
   * Extract properties from type reference (Omit, Pick, etc.)
   */
  private extractTypeReferenceProperties(
    node: ts.TypeReferenceNode,
    sourceFile: ts.SourceFile,
    fileContent: string,
    adapterFilePath?: string,
  ): PropertyDefinition[] {
    const typeName = node.typeName.getText(sourceFile);
    
    // Handle Omit<Type, Keys>
    if (typeName === 'Omit' && node.typeArguments && node.typeArguments.length >= 2) {
      return this.handleOmitType(node, sourceFile, fileContent, adapterFilePath);
    }
    
    // Handle Pick<Type, Keys>
    if (typeName === 'Pick' && node.typeArguments && node.typeArguments.length >= 2) {
      return this.handlePickType(node, sourceFile, fileContent, adapterFilePath);
    }
    
    // For other type references, try to find and extract the type
    // First check if it's in the current file
    let baseType = this.extractTypeDefinition(fileContent, typeName, adapterFilePath);
    
    // If not found and we have adapter file path, try to resolve from imports
    if (!baseType && adapterFilePath) {
      baseType = this.resolveImportedType(typeName, sourceFile, adapterFilePath);
    }
    
    return baseType?.properties || [];
  }

  /**
   * Resolve a type from an imported file
   */
  private resolveImportedType(
    typeName: string,
    sourceFile: ts.SourceFile,
    adapterFilePath: string,
  ): ExtractedType | null {
    // Find the import for this type
    const imports = this.extractImports(sourceFile);
    const importInfo = imports.find(imp => imp.name === typeName);
    
    if (!importInfo) {
      console.log('[Type Extractor] No import found for', typeName);
      return null;
    }
    
    // Resolve the imported file path
    const adapterDir = path.dirname(adapterFilePath);
    let importPath = importInfo.from;
    
    // Handle relative imports
    if (importPath.startsWith('.')) {
      importPath = path.resolve(adapterDir, importPath);
      
      // Try different extensions
      const extensions = ['.ts', '.tsx', '.d.ts', ''];
      let resolvedPath: string | null = null;
      
      for (const ext of extensions) {
        const testPath = importPath + ext;
        if (fs.existsSync(testPath)) {
          resolvedPath = testPath;
          break;
        }
      }
      
      if (!resolvedPath) {
        console.log('[Type Extractor] Could not resolve import path:', importInfo.from);
        return null;
      }
      
      // Read the imported file
      try {
        const importedContent = fs.readFileSync(resolvedPath, 'utf-8');
        console.log('[Type Extractor] Resolved import:', typeName, 'from', resolvedPath);
        return this.extractTypeDefinition(importedContent, typeName, resolvedPath);
      } catch (error) {
        console.log('[Type Extractor] Error reading imported file:', error);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Handle Omit<Type, Keys> type
   */
  private handleOmitType(
    node: ts.TypeReferenceNode,
    sourceFile: ts.SourceFile,
    fileContent: string,
    adapterFilePath?: string,
  ): PropertyDefinition[] {
    if (!node.typeArguments || node.typeArguments.length < 2) return [];
    
    const baseTypeNode = node.typeArguments[0];
    const keysNode = node.typeArguments[1];
    
    if (!baseTypeNode || !keysNode) return [];
    
    // Get base type name
    const baseTypeName = baseTypeNode.getText(sourceFile);
    
    // Get keys to omit
    const omittedKeys = this.extractLiteralKeys(keysNode, sourceFile);
    
    // Find base type definition (try current file first, then imports)
    let baseType = this.extractTypeDefinition(fileContent, baseTypeName, adapterFilePath);
    
    // If not found in current file, try to resolve from imports
    if (!baseType && adapterFilePath) {
      const tempSourceFile = ts.createSourceFile('temp.ts', fileContent, ts.ScriptTarget.Latest, true);
      baseType = this.resolveImportedType(baseTypeName, tempSourceFile, adapterFilePath);
    }
    
    if (!baseType) {
      console.log('[Type Extractor] Could not find base type for Omit:', baseTypeName);
      return [];
    }
    
    // Filter out omitted properties
    const result = baseType.properties.filter(prop => !omittedKeys.includes(prop.name));
    console.log('[Type Extractor] Omit<', baseTypeName, ',', omittedKeys.join(', '), '> resulted in', result.length, 'properties');
    return result;
  }

  /**
   * Handle Pick<Type, Keys> type
   */
  private handlePickType(
    node: ts.TypeReferenceNode,
    sourceFile: ts.SourceFile,
    fileContent: string,
    adapterFilePath?: string,
  ): PropertyDefinition[] {
    if (!node.typeArguments || node.typeArguments.length < 2) return [];
    
    const baseTypeNode = node.typeArguments[0];
    const keysNode = node.typeArguments[1];
    
    if (!baseTypeNode || !keysNode) return [];
    
    // Get base type name
    const baseTypeName = baseTypeNode.getText(sourceFile);
    
    // Get keys to pick
    const pickedKeys = this.extractLiteralKeys(keysNode, sourceFile);
    
    // Find base type definition (try current file first, then imports)
    let baseType = this.extractTypeDefinition(fileContent, baseTypeName, adapterFilePath);
    
    // If not found in current file, try to resolve from imports
    if (!baseType && adapterFilePath) {
      const tempSourceFile = ts.createSourceFile('temp.ts', fileContent, ts.ScriptTarget.Latest, true);
      baseType = this.resolveImportedType(baseTypeName, tempSourceFile, adapterFilePath);
    }
    
    if (!baseType) return [];
    
    // Keep only picked properties
    return baseType.properties.filter(prop => pickedKeys.includes(prop.name));
  }

  /**
   * Extract literal keys from union type ('key1' | 'key2' | 'key3')
   */
  private extractLiteralKeys(node: ts.TypeNode, sourceFile: ts.SourceFile): string[] {
    const keys: string[] = [];
    
    if (ts.isUnionTypeNode(node)) {
      node.types.forEach((typeNode) => {
        if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
          keys.push(typeNode.literal.text);
        }
      });
    } else if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) {
      keys.push(node.literal.text);
    }
    
    return keys;
  }

  /**
   * Extract properties from type literal ({ prop: type })
   */
  private extractTypeLiteralProperties(
    node: ts.TypeLiteralNode,
    sourceFile: ts.SourceFile,
  ): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    
    node.members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.name) {
        const name = member.name.getText(sourceFile);
        const type = member.type ? member.type.getText(sourceFile) : 'any';
        const isOptional = member.questionToken !== undefined;
        const isArray = member.type ? ts.isArrayTypeNode(member.type) : false;
        
        properties.push({
          name,
          type,
          isOptional,
          isArray,
        });
      }
    });
    
    return properties;
  }
}

