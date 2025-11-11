import { TypeExtractor } from '../parser/adapter-parser/TypeExtractor';

describe('TypeExtractor', () => {
  let extractor: TypeExtractor;

  beforeEach(() => {
    extractor = new TypeExtractor();
  });

  describe('extractTBodyTypeName', () => {
    it('should extract TBody type from adapter.json call', () => {
      const fileContent = `
        export default adapter.json<CreateProjectDto, any, any, Result>({
          method: 'POST',
          path: '/project',
          target: 'ProjectService.create',
        }, async (ctx) => {
          return ctx.body;
        });
      `;

      const typeName = extractor.extractTBodyTypeName(fileContent);
      expect(typeName).toBe('CreateProjectDto');
    });

    it('should extract TBody type from adapter.multipart call', () => {
      const fileContent = `
        export default adapter.multipart<UploadImageDto>({
          method: 'POST',
          path: '/upload',
        }, async (ctx) => {
          return { url: 'test' };
        });
      `;

      const typeName = extractor.extractTBodyTypeName(fileContent);
      expect(typeName).toBe('UploadImageDto');
    });

    it('should handle whitespace variations', () => {
      const fileContent = `
        export default adapter.json< CreateProjectDto , any , any >({...}, async (ctx) => {});
      `;

      const typeName = extractor.extractTBodyTypeName(fileContent);
      expect(typeName).toBe('CreateProjectDto');
    });

    it('should return null if no type found', () => {
      const fileContent = `
        export default adapter.json({...}, async (ctx) => {});
      `;

      const typeName = extractor.extractTBodyTypeName(fileContent);
      expect(typeName).toBeNull();
    });
  });

  describe('extractTypeDefinition', () => {
    it('should extract interface definition', () => {
      const fileContent = `
        interface CreateProjectDto {
          name: string;
          description?: string;
          tags: string[];
        }

        export default adapter.json<CreateProjectDto>({...}, async (ctx) => {});
      `;

      const extracted = extractor.extractTypeDefinition(fileContent, 'CreateProjectDto');

      expect(extracted).not.toBeNull();
      expect(extracted?.name).toBe('CreateProjectDto');
      expect(extracted?.properties).toHaveLength(3);
      
      const nameProperty = extracted?.properties.find(p => p.name === 'name');
      expect(nameProperty).toEqual({
        name: 'name',
        type: 'string',
        isOptional: false,
        isArray: false,
      });

      const descProperty = extracted?.properties.find(p => p.name === 'description');
      expect(descProperty?.isOptional).toBe(true);

      const tagsProperty = extracted?.properties.find(p => p.name === 'tags');
      expect(tagsProperty?.isArray).toBe(true);
    });

    it('should extract type alias with object literal', () => {
      const fileContent = `
        type CreateProjectDto = {
          name: string;
          slug: string;
          active: boolean;
        };

        export default adapter.json<CreateProjectDto>({...}, async (ctx) => {});
      `;

      const extracted = extractor.extractTypeDefinition(fileContent, 'CreateProjectDto');

      expect(extracted).not.toBeNull();
      expect(extracted?.properties).toHaveLength(3);
      expect(extracted?.properties.find(p => p.name === 'active')?.type).toBe('boolean');
    });

    it('should handle Omit type', () => {
      const fileContent = `
        interface BaseDto {
          id: string;
          name: string;
          description: string;
          createdAt: Date;
        }

        type CreateDto = Omit<BaseDto, 'id' | 'createdAt'>;

        export default adapter.json<CreateDto>({...}, async (ctx) => {});
      `;

      const extracted = extractor.extractTypeDefinition(fileContent, 'CreateDto');

      expect(extracted).not.toBeNull();
      expect(extracted?.properties).toHaveLength(2);
      expect(extracted?.properties.find(p => p.name === 'name')).toBeDefined();
      expect(extracted?.properties.find(p => p.name === 'description')).toBeDefined();
      expect(extracted?.properties.find(p => p.name === 'id')).toBeUndefined();
      expect(extracted?.properties.find(p => p.name === 'createdAt')).toBeUndefined();
    });

    it('should handle Pick type', () => {
      const fileContent = `
        interface BaseDto {
          id: string;
          name: string;
          description: string;
          createdAt: Date;
        }

        type UpdateNameDto = Pick<BaseDto, 'name' | 'description'>;

        export default adapter.json<UpdateNameDto>({...}, async (ctx) => {});
      `;

      const extracted = extractor.extractTypeDefinition(fileContent, 'UpdateNameDto');

      expect(extracted).not.toBeNull();
      expect(extracted?.properties).toHaveLength(2);
      expect(extracted?.properties.find(p => p.name === 'name')).toBeDefined();
      expect(extracted?.properties.find(p => p.name === 'description')).toBeDefined();
      expect(extracted?.properties.find(p => p.name === 'id')).toBeUndefined();
    });

    it('should handle intersection types', () => {
      const fileContent = `
        type BaseDto = {
          name: string;
          description: string;
        };

        type CreateDto = BaseDto & {
          slug: string;
          projectTypeId: string;
        };

        export default adapter.json<CreateDto>({...}, async (ctx) => {});
      `;

      const extracted = extractor.extractTypeDefinition(fileContent, 'CreateDto');

      expect(extracted).not.toBeNull();
      expect(extracted?.properties).toHaveLength(4);
      expect(extracted?.properties.map(p => p.name)).toEqual(
        expect.arrayContaining(['name', 'description', 'slug', 'projectTypeId'])
      );
    });

    it('should handle complex type with Omit and intersection', () => {
      const fileContent = `
        import { CreateProjectInstanceDto } from '../create-projectInstance.dto';

        type CreateProjectWithSlugDto = Omit<
          CreateProjectInstanceDto,
          'projectTypeId' | 'slug'
        > & {
          slug: string;
        };

        export default adapter.json<CreateProjectWithSlugDto>({...}, async (ctx) => {});
      `;

      // Mock the CreateProjectInstanceDto definition
      const fileContentWithBase = `
        interface CreateProjectInstanceDto {
          name: string;
          description: string;
          projectTypeId: string;
          slug: string;
          active: boolean;
        }

        type CreateProjectWithSlugDto = Omit<
          CreateProjectInstanceDto,
          'projectTypeId' | 'slug'
        > & {
          slug: string;
        };

        export default adapter.json<CreateProjectWithSlugDto>({...}, async (ctx) => {});
      `;

      const extracted = extractor.extractTypeDefinition(fileContentWithBase, 'CreateProjectWithSlugDto');

      expect(extracted).not.toBeNull();
      expect(extracted?.properties).toHaveLength(4);
      
      // Should have: name, description, active (from base after Omit), slug (from intersection)
      expect(extracted?.properties.map(p => p.name)).toEqual(
        expect.arrayContaining(['name', 'description', 'active', 'slug'])
      );
      expect(extracted?.properties.find(p => p.name === 'projectTypeId')).toBeUndefined();
    });

    it('should extract imports', () => {
      const fileContent = `
        import { CreateProjectInstanceDto } from '../create-projectInstance.dto';
        import type { SomeType } from '../types';

        type CreateDto = CreateProjectInstanceDto & {
          extra: string;
        };

        export default adapter.json<CreateDto>({...}, async (ctx) => {});
      `;

      const extracted = extractor.extractTypeDefinition(fileContent, 'CreateDto');

      expect(extracted).not.toBeNull();
      expect(extracted?.imports).toHaveLength(2);
      expect(extracted?.imports).toEqual(
        expect.arrayContaining([
          { name: 'CreateProjectInstanceDto', from: '../create-projectInstance.dto', isTypeOnly: false },
          { name: 'SomeType', from: '../types', isTypeOnly: true },
        ])
      );
    });

    it('should return null for non-existent type', () => {
      const fileContent = `
        type SomeOtherType = { value: string };
      `;

      const extracted = extractor.extractTypeDefinition(fileContent, 'NonExistentType');
      expect(extracted).toBeNull();
    });
  });
});

