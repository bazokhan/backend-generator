import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { getResourceName } from './src/generator/utils';
import type { PrismaModel, Config } from '@tg-scripts/types';
import { promptUser, formatGeneratedFiles } from './src/io/utils';
import { PrismaFieldParser } from './src/parser/prisma-field-parser/PrismaFieldParser';
import { PrismaSchemaParser } from './src/parser/prisma-schema-parser/PrismaSchemaParser';
import { PrismaRelationsParser } from './src/parser/prisma-relation-parser/PrismaRelationsParser';
import { ReactComponentsGenerator } from './src/generator/react-components-generator/ReactComponentsGenerator';
import { config } from './config';
import { buildFieldDirectiveFile } from './src/directives/field/field-directive-writer';

export class DashboardGenerator {
  private schemaPath: string;
  private dashboardPath: string;
  private models: PrismaModel[] = [];
  private enums: Map<string, string[]> = new Map();

  private config: Config;
  private fieldParser: PrismaFieldParser;
  private fieldRelationsParser: PrismaRelationsParser;
  private schemaParser: PrismaSchemaParser;
  private reactComponentsGenerator: ReactComponentsGenerator;

  constructor(config: Config) {
    this.config = config;
    this.fieldParser = new PrismaFieldParser();
    this.fieldRelationsParser = new PrismaRelationsParser();
    this.schemaParser = new PrismaSchemaParser(this.fieldParser, this.fieldRelationsParser);
    this.reactComponentsGenerator = new ReactComponentsGenerator();
    this.schemaPath = this.config.schemaPath;
    this.dashboardPath = this.config.dashboardPath;
  }

  async generate(): Promise<void> {
    console.log('🚀 Starting dashboard page generation...');

    try {
      this.parseSchema();
      this.generateTypes();
      await this.generateCRUDPages();
      this.generateFieldDirectiveConfig();
      this.updateAppComponent();
      console.log('✅ Dashboard generation completed successfully!');
    } catch (error) {
      console.error('❌ Error during generation:', error);
      process.exit(1);
    }
  }

  private parseSchema(): void {
    console.log('📖 Parsing Prisma schema...');

    const schemaContent = fs.readFileSync(this.schemaPath, 'utf-8');
    this.schemaParser.load(schemaContent);
    const { models, enums } = this.schemaParser.parse();

    this.models = models;
    this.enums = enums;
    models.forEach((model) => {
      console.log(`📋 Found model with @tg_form(): ${model.name}`);
    });

    console.log(`📊 Found ${this.models.length} models with @tg_form()`);
  }

  private generateTypes(): void {
    console.log('🔧 Generating TypeScript types from Swagger...');

    const swaggerJsonPath = path.join(process.cwd(), 'src', 'dashboard', 'src', 'types', 'swagger.json');

    if (!fs.existsSync(swaggerJsonPath)) {
      console.warn('⚠️ Swagger JSON file not found. Please run "npm run generate:swagger" first.');
      return;
    }

    try {
      // Generate types from static Swagger JSON file
      const command = `npx swagger-typescript-api generate -p ${swaggerJsonPath} -o src/dashboard/src/types -n api.ts`;
      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('✅ Types generated successfully');

      // Format the generated api.ts file
      const apiTsPath = path.join(process.cwd(), 'src', 'dashboard', 'src', 'types', 'api.ts');
      if (fs.existsSync(apiTsPath)) {
        formatGeneratedFiles([apiTsPath], process.cwd());
        console.log('✅ api.ts formatted');
      }
    } catch (error) {
      console.warn('⚠️ Could not generate types from Swagger JSON file');
      console.warn('❌ Error during type generation:', error);
    }
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
      const resourcePath = path.join(this.dashboardPath, 'resources', resourceName);

      // Check if folder already exists
      if (fs.existsSync(resourcePath)) {
        const shouldRegenerate = await promptUser(
          `⚠️ Folder for ${model.name} already exists at: ${resourcePath}\n` +
            `Do you want to delete and regenerate it? (y/n): `,
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
        formatGeneratedFiles(allGeneratedFiles, process.cwd());
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
    const directivesPath = path.join(this.dashboardPath, 'providers', 'fieldDirectives.generated.ts');
    fs.mkdirSync(path.dirname(directivesPath), { recursive: true });
    const content = buildFieldDirectiveFile(this.models);
    fs.writeFileSync(directivesPath, content);
    formatGeneratedFiles([directivesPath], process.cwd());
  }

  private updateAppComponent(): void {
    console.log('🔄 Updating App component with new resources...');

    const appPath = path.join(this.dashboardPath, 'App.tsx');
    let appContent = fs.readFileSync(appPath, 'utf-8');

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

    fs.writeFileSync(appPath, appContent);

    // Format the updated App component
    formatGeneratedFiles([appPath], process.cwd());

    console.log('✅ App component updated with new resources');
  }
}

// Run the generator
// istanbul ignore next - CLI execution block, not testable in unit tests
if (!process.env.JEST_WORKER_ID && !process.env.NODE_ENV?.includes('test')) {
  const generator = new DashboardGenerator(config);
  generator.generate().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
