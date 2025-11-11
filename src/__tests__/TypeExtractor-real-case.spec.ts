import { TypeExtractor } from '../parser/adapter-parser/TypeExtractor';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('TypeExtractor - Real Case Scenario', () => {
  let extractor: TypeExtractor;
  let tempDir: string;

  beforeEach(() => {
    extractor = new TypeExtractor();
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adapter-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should extract Omit type from imported DTO', () => {
    // Create the base DTO file (create-projectInstance.dto.ts)
    const baseDtoContent = `
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateProjectInstanceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  projectTypeId: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsBoolean()
  active: boolean;
}
`;

    const baseDtoPath = path.join(tempDir, 'create-projectInstance.dto.ts');
    fs.writeFileSync(baseDtoPath, baseDtoContent);

    // Create adapters directory
    const adaptersDir = path.join(tempDir, 'adapters');
    fs.mkdirSync(adaptersDir);

    // Create the adapter file
    const adapterContent = `
import { adapter } from '@tgraph/backend-generator/adapters';
import { CreateProjectInstanceDto } from '../create-projectInstance.dto';

type CreateProjectWithSlugDto = Omit<
  CreateProjectInstanceDto,
  'projectTypeId' | 'slug'
>;

export default adapter.json<
  CreateProjectWithSlugDto,
  any,
  any,
  CreateProjectInstanceDto
>(
  {
    method: 'POST',
    path: '/project',
    target: 'ProjectInstanceService.create',
  },
  async (ctx) => {
    const { body } = ctx;
    const helpers: typeof ctx.helpers = ctx.helpers;
    await Promise.resolve();
    helpers.assert(body.name, 'Name is required');
    const slug = helpers.slugify(body.name);
    return {
      ...body,
      slug,
      projectTypeId: 'cmhdupp4y0001luv07mgfu7pr',
    };
  },
);
`;

    const adapterPath = path.join(adaptersDir, 'create-project.adapter.ts');
    fs.writeFileSync(adapterPath, adapterContent);

    // Extract the type name
    const typeName = extractor.extractTBodyTypeName(adapterContent);
    expect(typeName).toBe('CreateProjectWithSlugDto');

    // Extract the type definition
    const extracted = extractor.extractTypeDefinition(adapterContent, typeName!, adapterPath);

    // Debug output
    console.log('Extracted:', JSON.stringify(extracted, null, 2));

    expect(extracted).not.toBeNull();
    expect(extracted?.name).toBe('CreateProjectWithSlugDto');
    
    // Should have properties: name, description, active (NOT projectTypeId or slug)
    expect(extracted?.properties).toHaveLength(3);
    
    const propertyNames = extracted?.properties.map(p => p.name) || [];
    expect(propertyNames).toContain('name');
    expect(propertyNames).toContain('description');
    expect(propertyNames).toContain('active');
    expect(propertyNames).not.toContain('projectTypeId');
    expect(propertyNames).not.toContain('slug');

    // Check property details
    const nameProperty = extracted?.properties.find(p => p.name === 'name');
    expect(nameProperty).toBeDefined();
    expect(nameProperty?.type).toBe('string');
    expect(nameProperty?.isOptional).toBe(false);

    const descProperty = extracted?.properties.find(p => p.name === 'description');
    expect(descProperty).toBeDefined();
    expect(descProperty?.isOptional).toBe(true);
  });
});

