import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { ComponentOverrides, Config, PrismaModel } from '@tg-scripts/types';
import { formatGeneratedFiles, promptUser } from '../../io/utils';
import { ProjectPathResolver } from '../../io/project-paths/ProjectPathResolver';
import { buildFieldDirectiveFile } from '../../directives/field/field-directive-writer';
import { PrismaFieldParser } from '../../parser/prisma-field-parser/PrismaFieldParser';
import { PrismaRelationsParser } from '../../parser/prisma-relation-parser/PrismaRelationsParser';
import { PrismaSchemaParser } from '../../parser/prisma-schema-parser/PrismaSchemaParser';
import { ReactComponentsGenerator } from '../react-components-generator/ReactComponentsGenerator';
import { getResourceName } from '../utils/naming';

export class DashboardGenerator {
  private appComponentPath: string | null;
  private readonly config: Config;
  private readonly dashboardAbsolutePath: string;
  private readonly dashboardPath: string;
  private enums: Map<string, string[]> = new Map();
  private readonly fieldParser: PrismaFieldParser;
  private readonly fieldRelationsParser: PrismaRelationsParser;
  private models: PrismaModel[] = [];
  private readonly nonInteractive: boolean;
  private readonly projectPathResolver: ProjectPathResolver;
  private readonly reactComponentsGenerator: ReactComponentsGenerator;
  private readonly schemaAbsolutePath: string;
  private readonly schemaParser: PrismaSchemaParser;
  private readonly schemaPath: string;
  private readonly workspaceRoot: string;
  private readonly swaggerJsonPath: string;
  private readonly swaggerCommand: string;
  constructor(config: Config) {
    this.config = config;
    this.fieldParser = new PrismaFieldParser();
    this.fieldRelationsParser = new PrismaRelationsParser();
    this.schemaParser = new PrismaSchemaParser(this.fieldParser, this.fieldRelationsParser);
    this.reactComponentsGenerator = new ReactComponentsGenerator(
      config.input.dashboard.components as ComponentOverrides,
    );
    this.workspaceRoot = process.cwd();
    this.projectPathResolver = new ProjectPathResolver(config, { workspaceRoot: this.workspaceRoot });
    this.schemaPath = this.config.input.prisma.schemaPath as string;
    this.schemaAbsolutePath = path.isAbsolute(this.schemaPath)
      ? this.schemaPath
      : path.join(this.workspaceRoot, this.schemaPath);
    this.dashboardPath = this.config.output.dashboard.root as string;
    this.dashboardAbsolutePath = this.projectPathResolver.getDashboardRoot();
    this.nonInteractive = config.behavior.nonInteractive as boolean;
    this.appComponentPath = this.projectPathResolver.resolveDashboardAppComponentPath();
    this.swaggerCommand = 'npm run generate:swagger';
    const configuredSwaggerPath = this.config.output.dashboard.swaggerJsonPath as string;
    const resolvedSwaggerPath = configuredSwaggerPath
      ? path.isAbsolute(configuredSwaggerPath)
        ? configuredSwaggerPath
        : path.join(this.workspaceRoot, configuredSwaggerPath)
      : path.join(this.dashboardAbsolutePath, 'types', 'swagger.json');
    this.swaggerJsonPath = resolvedSwaggerPath;
  }

  private async generateCRUDPages(): Promise<void> {
    console.log('📝 Generating CRUD pages...');

    const allGeneratedFiles: string[] = [];

    for (const model of this.models) {
      // Skip models with empty names
      if (!model.name || model.name.trim() === '') {
        console.warn(`⚠️ Skipping model with empty name`);
        continue;
      }

      const resourceName = getResourceName(model.name);
      const resourcePath = path.join(this.dashboardAbsolutePath, 'resources', resourceName);
      const displayPath = this.toWorkspaceRelative(resourcePath);

      // Check if folder already exists
      if (fs.existsSync(resourcePath)) {
        const shouldRegenerate = await promptUser(
          `⚠️ Folder for ${model.name} already exists at: ${displayPath}\n` +
            `Do you want to delete and regenerate it? (y/n): `,
          {
            autoConfirm: this.nonInteractive,
            defaultValue: true,
          },
        );

        if (shouldRegenerate) {
          console.log(`🗑️ Deleting existing folder for ${model.name}...`);
          fs.rmSync(resourcePath, { recursive: true, force: true });
        } else {
          console.log(`⏭️ Skipping ${model.name}...`);
          continue;
        }
      }

      // Create resource directory
      fs.mkdirSync(resourcePath, { recursive: true });

      // Generate components
      const pages = this.reactComponentsGenerator.generate({
        pages: ['list', 'edit', 'create', 'show', 'studio', 'index'],
        model,
        parsedSchema: { models: this.models, enums: this.enums },
      });

      const filePaths = Object.values(pages).map((page) => path.join(resourcePath, page.fileName));

      await Promise.all(
        Object.values(pages).map((page) => fs.promises.writeFile(path.join(resourcePath, page.fileName), page.content)),
      );

      // Collect file paths for batch formatting
      allGeneratedFiles.push(...filePaths);

      console.log(`✅ Generated CRUD pages for ${model.name}`);
    }

    // Format all generated files at once
    if (allGeneratedFiles.length > 0) {
      console.log('🎨 Formatting generated files...');
      try {
        formatGeneratedFiles(allGeneratedFiles, this.workspaceRoot);
        console.log('✅ All files formatted');
      } catch {
        console.warn(
          '⚠️ Some files could not be formatted. This is usually due to file locks. Generated files are still valid.',
        );
      }
    }
  }

  private generateFieldDirectiveConfig(): void {
    console.log('🧭 Generating field directive configuration...');
    const directivesPath = path.join(this.dashboardAbsolutePath, 'providers', 'fieldDirectives.generated.ts');
    fs.mkdirSync(path.dirname(directivesPath), { recursive: true });
    const content = buildFieldDirectiveFile(this.models);
    fs.writeFileSync(directivesPath, content);
    formatGeneratedFiles([directivesPath], this.workspaceRoot);
  }

  private generateTypes(): void {
    console.log('🔧 Generating TypeScript types from Swagger...');

    const swaggerJsonPath = this.swaggerJsonPath;

    if (!fs.existsSync(swaggerJsonPath)) {
      console.warn(
        `⚠️ Swagger JSON file not found. Please run "${this.swaggerCommand}" first or configure dashboard.swagger`,
      );
      return;
    }

    try {
      // Generate types from static Swagger JSON file
      const outputDir = path.join(this.dashboardAbsolutePath, 'types');
      const command = `npx swagger-typescript-api generate -p "${swaggerJsonPath}" -o "${outputDir}" -n api.ts`;
      execSync(command, {
        stdio: 'inherit',
        cwd: this.workspaceRoot,
      });
      console.log('✅ Types generated successfully');

      // Format the generated api.ts file
      const apiTsPath = path.join(outputDir, 'api.ts');
      if (fs.existsSync(apiTsPath)) {
        formatGeneratedFiles([apiTsPath], this.workspaceRoot);
        console.log('✅ api.ts formatted');
      }
    } catch (error) {
      console.warn('⚠️ Could not generate types from Swagger JSON file');
      console.warn('❌ Error during type generation:', error);
    }
  }

  private parseSchema(): void {
    console.log('📖 Parsing Prisma schema...');

    const schemaContent = fs.readFileSync(this.schemaAbsolutePath, 'utf-8');
    this.schemaParser.load(schemaContent);
    const { models, enums } = this.schemaParser.parse();

    this.models = models;
    this.enums = enums;
    models.forEach((model) => {
      console.log(`📋 Found model with @tg_form(): ${model.name}`);
    });

    console.log(`📊 Found ${this.models.length} models with @tg_form()`);
  }

  private toWorkspaceRelative(targetPath: string): string {
    const relativePath = path.relative(this.workspaceRoot, targetPath);
    if (!relativePath || relativePath.startsWith('..')) {
      return targetPath;
    }

    return relativePath;
  }

  private updateAppComponent(): void {
    console.log('🔄 Updating App component with new resources...');

    const resolvedAppPath = this.appComponentPath ?? this.projectPathResolver.resolveDashboardAppComponentPath();
    this.appComponentPath = resolvedAppPath;

    if (!resolvedAppPath) {
      console.warn('⚠️ Could not locate App component. Skipping automatic App.tsx updates.');
      console.warn('   Configure config.paths.appComponent if your entrypoint lives elsewhere.');
      return;
    }

    if (!fs.existsSync(resolvedAppPath)) {
      console.warn(`⚠️ App component file not found at ${resolvedAppPath}. Skipping update.`);
      console.warn('   Configure config.paths.appComponent if your entrypoint lives elsewhere.');
      return;
    }

    let appContent = fs.readFileSync(resolvedAppPath, 'utf-8');

    // Remove ALL existing auto-generated imports blocks (using global flag)
    appContent = appContent.replace(/\/\/ AUTO-GENERATED IMPORTS START[\s\S]*?\/\/ AUTO-GENERATED IMPORTS END\n?/g, '');

    // Remove ALL existing auto-generated resources blocks (including comments)
    appContent = appContent.replace(
      /\{\/\* AUTO-GENERATED RESOURCES START \*\/\}[\s\S]*?\{\/\* AUTO-GENERATED RESOURCES END \*\/\}\n?/g,
      '',
    );

    // Remove ALL existing auto-generated custom routes blocks
    appContent = appContent.replace(
      /\{\/\* AUTO-GENERATED CUSTOM ROUTES START \*\/\}[\s\S]*?\{\/\* AUTO-GENERATED CUSTOM ROUTES END \*\/\}\n?/g,
      '',
    );

    // Add new imports (skip models with empty names)
    const imports = this.models
      .filter((model) => model.name && model.name.trim() !== '')
      .map((model) => {
        const resourceName = getResourceName(model.name);
        return `import { ${model.name}List, ${model.name}Edit, ${model.name}Create, ${model.name}Show, ${model.name}Studio } from './resources/${resourceName}';`;
      })
      .join('\n');

    // Ensure CustomRoutes and Route imports (only if we have models to import)
    const ensureImports = imports
      ? `import { CustomRoutes } from 'react-admin';\nimport { Route } from 'react-router';`
      : '';

    // Find the last import and add after it
    const lastImportMatch = appContent.match(/(import[^;]+;)(?=\n(?!import))/);
    if (lastImportMatch) {
      const lastImportIndex = appContent.indexOf(lastImportMatch[0]) + lastImportMatch[0].length;
      const importsContent = imports ? `\n${imports}\n${ensureImports}` : '';
      appContent =
        appContent.slice(0, lastImportIndex) +
        `\n// AUTO-GENERATED IMPORTS START${importsContent}\n// AUTO-GENERATED IMPORTS END` +
        appContent.slice(lastImportIndex);
    }

    // Add resources (skip models with empty names)
    const resources = this.models
      .filter((model) => model.name && model.name.trim() !== '')
      .map((model) => {
        const resourceName = getResourceName(model.name);
        return `      <Resource 
        name="${resourceName}" 
        list={${model.name}List} 
        edit={${model.name}Edit} 
        create={${model.name}Create} 
        show={${model.name}Show} 
      />`;
      })
      .join('\n');

    // Add custom routes for studios
    const customRoutes = this.models
      .filter((model) => model.name && model.name.trim() !== '')
      .map((model) => {
        const resourceName = getResourceName(model.name);
        return `          <Route path="/${resourceName}/studio" element={<${model.name}Studio />} />`;
      })
      .join('\n');

    // Find the Admin component and add resources and custom routes inside it
    const adminMatch = appContent.match(/(<Admin[^>]*>)([\s\S]*?)(<\/Admin>)/);
    if (adminMatch) {
      // Place resources and custom routes at the end, before the closing tag
      const newAdminContent = `\n      {/* AUTO-GENERATED RESOURCES START */}\n${resources}\n      {/* AUTO-GENERATED RESOURCES END */}\n      {/* AUTO-GENERATED CUSTOM ROUTES START */}\n      <CustomRoutes>\n${customRoutes}\n      </CustomRoutes>\n      {/* AUTO-GENERATED CUSTOM ROUTES END */}\n    `;
      appContent = appContent.replace(adminMatch[0], adminMatch[1] + newAdminContent + adminMatch[3]);
    }

    fs.writeFileSync(resolvedAppPath, appContent);

    // Format the updated App component
    formatGeneratedFiles([resolvedAppPath], this.workspaceRoot);

    console.log('✅ App component updated with new resources');
  }

  async generate(): Promise<void> {
    console.log('🚀 Starting dashboard page generation...');

    try {
      this.parseSchema();
      await this.generateCRUDPages();
      this.generateFieldDirectiveConfig();
      this.updateAppComponent();
      console.log('✅ Dashboard generation completed successfully!');
    } catch (error) {
      console.error('❌ Error during generation:', error);
      throw error;
    }
  }
}
