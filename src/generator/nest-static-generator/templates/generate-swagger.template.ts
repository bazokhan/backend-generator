export const generateSwaggerTemplate = `import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '{{appModuleImport}}';

const SWAGGER_JSON_PATH = path.join(
  process.cwd(),
  '{{swaggerJsonPath}}',
);

export async function generateSwaggerJson(): Promise<void> {
  console.log('🚀 Starting Swagger JSON generation...');
  
  try {
    console.log('📡 Creating NestJS application instance...');
    // Create a temporary NestJS application instance
    const app = await NestFactory.create(AppModule, {
      logger: false, // Disable logging to keep output clean
    });

    console.log('🔧 Configuring Swagger...');
    // Configure Swagger
    const config = new DocumentBuilder()
      .setTitle('{{title}}')
      .setDescription('{{description}}')
      .setVersion('{{version}}')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    console.log('💾 Saving Swagger JSON...');
    // Ensure the types directory exists
    const typesDir = path.dirname(SWAGGER_JSON_PATH);
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
      console.log(\`📁 Created directory: \${typesDir}\`);
    }

    // Write the JSON file
    fs.writeFileSync(SWAGGER_JSON_PATH, JSON.stringify(document, null, 2));
    console.log(\`💾 Saved Swagger JSON to: \${SWAGGER_JSON_PATH}\`);

    // Close the application
    await app.close();
    console.log('✅ Swagger JSON generation completed successfully!');
  } catch (error) {
    console.error('❌ Error during Swagger JSON generation:', error);
    console.log(
      '\\n💡 Make sure all dependencies are installed and the app module is properly configured',
    );
    process.exit(1);
  }
}

// Run the generator
// istanbul ignore next - CLI execution block, not testable in unit tests
if (!process.env.JEST_WORKER_ID && !process.env.NODE_ENV?.includes('test')) {
  generateSwaggerJson().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
`;
