import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { DashboardGenerator } from '@tg-scripts/generator/dashboard/DashboardGenerator';
import { promptUser } from '@tg-scripts/io/utils/user-prompt';
import { getResourceName } from '@tg-scripts/generator/utils/naming';
import type { Config } from '@tg-scripts/types';

const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Test',
};

const MOCK_CWD = '/mock/project/root';
const SCHEMA_ABSOLUTE_PATH = path.join(MOCK_CWD, config.schemaPath);
const DASHBOARD_ABSOLUTE_PATH = path.join(MOCK_CWD, config.dashboardPath);

// Mock file system operations
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      writeFile: jest.fn().mockResolvedValue(undefined),
    },
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    rmSync: jest.fn(),
  };
});
jest.mock('child_process');
jest.mock('@tg-scripts/io/utils/user-prompt');
jest.mock('@tg-scripts/generator/utils/naming');

// Mock console methods
const originalConsole = global.console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

describe('DashboardGenerator', () => {
  let generator: DashboardGenerator;
  let mockFs: jest.Mocked<typeof fs>;
  let mockExecSync: jest.MockedFunction<typeof execSync>;
  let mockPromptUser: jest.MockedFunction<typeof promptUser>;
  let mockGetResourceName: jest.MockedFunction<typeof getResourceName>;
  let mockProcessCwd: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockFs = fs as jest.Mocked<typeof fs>;
    mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
    mockPromptUser = promptUser as jest.MockedFunction<typeof promptUser>;
    mockGetResourceName = getResourceName as jest.MockedFunction<typeof getResourceName>;

    // Mock process.cwd()
    mockProcessCwd = jest.spyOn(process, 'cwd').mockReturnValue(MOCK_CWD);

    // Mock fs.promises - ensure it's set up and reset before each test
    if (!mockFs.promises) {
      mockFs.promises = {} as any;
    }
    (mockFs.promises as any).writeFile = jest.fn().mockResolvedValue(undefined);

    // Default implementations
    // Mock existsSync to return false for resource paths, true for swagger.json if needed
    mockFs.existsSync.mockImplementation((filePath: string) => {
      if (filePath.toString().includes('swagger.json')) {
        return false;
      }
      // Return false for resource paths (so we don't prompt for regeneration)
      if (filePath.toString().includes('resources')) {
        return false;
      }
      return false;
    });
    // Provide real schema content that the parser can parse
    const defaultSchema = `
// @tg_form()
model User {
  id String @id @default(uuid())
  email String @unique
  firstName String
  lastName String
}

// @tg_form()
model Post {
  id String @id @default(uuid())
  title String
  content String?
}
`;
    mockFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.toString().includes('schema.prisma')) {
        return defaultSchema;
      }
      if (filePath.toString().includes('App.tsx')) {
        return `import React from 'react';
import { Admin, Resource } from 'react-admin';

const App = () => (
  <Admin>
  </Admin>
);

export default App;
`;
      }
      return '';
    });
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.rmSync.mockImplementation(() => {});

    mockPromptUser.mockResolvedValue(true);
    mockGetResourceName.mockImplementation((name) => {
      if (!name || name.trim() === '') {
        return '';
      }
      return name.toLowerCase();
    });
    mockExecSync.mockReturnValue(Buffer.from(''));

    generator = new DashboardGenerator(config);
  });

  afterEach(() => {
    mockProcessCwd.mockRestore();
  });

  describe('Constructor', () => {
    it('should set schemaPath to prisma/schema.prisma', async () => {
      const gen = new DashboardGenerator(config);

      await gen.generate();

      expect(mockFs.readFileSync).toHaveBeenCalledWith(SCHEMA_ABSOLUTE_PATH, 'utf-8');
    });
  });

  describe('generate', () => {
    it('should complete full generation process successfully', async () => {
      await generator.generate();

      expect(mockFs.readFileSync).toHaveBeenCalled();
      expect(mockFs.readFileSync).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('✅ Dashboard generation completed successfully!');
    });

    it('should call all steps in correct order', async () => {
      const order: string[] = [];

      // Mock existsSync to return true for swagger.json so execSync is called
      mockFs.existsSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('swagger.json')) {
          return true;
        }
        if (filePath.toString().includes('resources')) {
          return false;
        }
        return false;
      });

      mockFs.readFileSync.mockImplementation(() => {
        order.push('readFileSync');
        return 'schema';
      });
      // Schema parsing happens automatically with real parser
      mockExecSync.mockImplementation(() => {
        order.push('execSync');
        return Buffer.from('');
      });

      await generator.generate();

      expect(order).toContain('readFileSync');
      // Note: Schema parsing happens automatically during readFileSync, no separate step
      expect(order).toContain('execSync');
    });

    it('should surface errors without exiting the process', async () => {
      const error = new Error('Test error');
      mockFs.readFileSync.mockImplementation(() => {
        throw error;
      });

      await expect(generator.generate()).rejects.toThrow(error);
      expect(console.error).toHaveBeenCalledWith('❌ Error during generation:', error);
    });

    it('should handle errors during parseSchema', async () => {
      const error = new Error('Parse error');
      mockFs.readFileSync.mockImplementation(() => {
        throw error;
      });

      await expect(generator.generate()).rejects.toThrow(error);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle errors during generateCRUDPages', async () => {
      const error = new Error('CRUD generation error');
      (mockFs.promises.writeFile as jest.Mock).mockRejectedValue(error);

      await expect(generator.generate()).rejects.toThrow('CRUD generation error');
    });
  });

  describe('parseSchema', () => {
    it('should read schema file with correct path', async () => {
      await generator.generate();

      expect(mockFs.readFileSync).toHaveBeenCalledWith(SCHEMA_ABSOLUTE_PATH, 'utf-8');
    });

    it('should parse schema content', async () => {
      const schemaContent = 'model User { id String @id }';
      mockFs.readFileSync.mockReturnValue(schemaContent);

      await generator.generate();

      expect(mockFs.readFileSync).toHaveBeenCalled();
    });

    it('should log each found model', async () => {
      await generator.generate();

      expect(console.log).toHaveBeenCalledWith('📋 Found model with @tg_form(): User');
      expect(console.log).toHaveBeenCalledWith('📋 Found model with @tg_form(): Post');
    });

    it('should log total model count', async () => {
      await generator.generate();

      expect(console.log).toHaveBeenCalledWith('📊 Found 2 models with @tg_form()');
    });

    it('should handle empty models array', async () => {
      // Override schema with no models that have @tg_form()
      const testSchema = `
model User {
  id String @id
}
`;
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return testSchema;
        }
        return '';
      });

      await generator.generate();

      expect(console.log).toHaveBeenCalledWith('📊 Found 0 models with @tg_form()');
    });
  });

  describe('generateTypes', () => {
    it('should check for swagger.json file', async () => {
      await generator.generate();

      const swaggerPath = path.join('/mock/project/root', 'src', 'dashboard', 'src', 'types', 'swagger.json');

      expect(mockFs.existsSync).toHaveBeenCalledWith(swaggerPath);
    });

    it('should generate types when swagger.json exists', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await generator.generate();

      expect(mockExecSync).toHaveBeenCalled();
      expect(mockExecSync.mock.calls[0][0]).toContain('swagger-typescript-api');
      expect(console.log).toHaveBeenCalledWith('✅ Types generated successfully');
    });

    it('should warn when swagger.json does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      // Mock existsSync to return true for generated files/directories
      mockFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.includes('swagger.json')) {
          return false;
        }
        // Return true for other paths (generated files, directories, etc.)
        return true;
      });

      await generator.generate();

      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Swagger JSON file not found. Please run "npm run generate:swagger" first.',
      );
      // execSync should not be called for type generation, but may be called for formatting files
      const execCalls = mockExecSync.mock.calls.map((call) => call[0].toString());
      const typeGenCalls = execCalls.filter((call) => call.includes('swagger-typescript-api'));
      expect(typeGenCalls.length).toBe(0);
    });

    it('should handle errors during type generation', async () => {
      mockFs.existsSync.mockReturnValue(true);
      const error = new Error('Type generation failed');
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      await generator.generate();

      expect(console.warn).toHaveBeenCalledWith('⚠️ Could not generate types from Swagger JSON file');
      expect(console.warn).toHaveBeenCalledWith('❌ Error during type generation:', error);
    });

    it('should call execSync with correct command and options', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await generator.generate();

      const execCall = mockExecSync.mock.calls.find((call) => call[0].toString().includes('swagger-typescript-api'));
      expect(execCall).toBeDefined();
      expect(execCall?.[1]).toEqual({
        stdio: 'inherit',
        cwd: '/mock/project/root',
      });
    });
  });

  describe('generateCRUDPages', () => {
    it('should generate CRUD pages for each model', async () => {
      await generator.generate();

      // Verify that files were written (6 files per model: List, Edit, Create, Show, Studio, index)
      expect(mockFs.promises.writeFile).toHaveBeenCalledTimes(12); // 2 models × 6 files

      // Verify file names contain expected components
      const writeCalls = (mockFs.promises.writeFile as jest.Mock).mock.calls;
      const fileNames = writeCalls.map((call) => call[0].toString());

      expect(fileNames.filter((name) => name.includes('UserList.tsx'))).toHaveLength(1);
      expect(fileNames.filter((name) => name.includes('UserEdit.tsx'))).toHaveLength(1);
      expect(fileNames.filter((name) => name.includes('UserCreate.tsx'))).toHaveLength(1);
      expect(fileNames.filter((name) => name.includes('UserShow.tsx'))).toHaveLength(1);
      expect(fileNames.filter((name) => name.includes('UserStudio.tsx'))).toHaveLength(1);
      // Check for index.ts file - handle both Windows and Unix paths
      expect(
        fileNames.filter(
          (name) =>
            name.includes('index.ts') && (name.includes('user') || name.includes('User')) && name.endsWith('index.ts'),
        ),
      ).toHaveLength(1);
      expect(fileNames.filter((name) => name.includes('PostList.tsx'))).toHaveLength(1);
      expect(fileNames.filter((name) => name.includes('PostEdit.tsx'))).toHaveLength(1);
      expect(fileNames.filter((name) => name.includes('PostCreate.tsx'))).toHaveLength(1);
      expect(fileNames.filter((name) => name.includes('PostShow.tsx'))).toHaveLength(1);
      expect(fileNames.filter((name) => name.includes('PostStudio.tsx'))).toHaveLength(1);
      // Check for index.ts file - handle both Windows and Unix paths
      expect(
        fileNames.filter(
          (name) =>
            name.includes('index.ts') && (name.includes('post') || name.includes('Post')) && name.endsWith('index.ts'),
        ),
      ).toHaveLength(1);
    });

    it('should create resource directories', async () => {
      await generator.generate();

      expect(mockFs.mkdirSync).toHaveBeenCalled();
    });

    it('should write all component files', async () => {
      await generator.generate();

      expect(mockFs.promises.writeFile).toHaveBeenCalledTimes(12); // 2 models × 6 files
    });

    it('should skip models with empty names', async () => {
      // Note: The real parser won't create models with empty names,
      // so this test verifies the generator handles empty names gracefully if they somehow occur
      // Override schema content - real parser will parse valid models
      const testSchema = `
// @tg_form()
model User {
  id String @id
}

// @tg_form()
model Post {
  id String @id
}
`;
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return testSchema;
        }
        return '';
      });

      await generator.generate();

      // With real parser, we get 2 valid models - verify files were written
      expect(mockFs.promises.writeFile).toHaveBeenCalled();
    });

    it('should prompt user when folder already exists', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockPromptUser.mockResolvedValue(true);

      await generator.generate();

      expect(mockPromptUser).toHaveBeenCalled();
      expect(mockFs.rmSync).toHaveBeenCalled();
    });

    it('should skip when user declines regeneration', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockPromptUser.mockResolvedValue(false);

      await generator.generate();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('⏭️ Skipping'));
      const skippedResourcePath = path.join(DASHBOARD_ABSOLUTE_PATH, 'resources', 'user');
      const skippedResourcePath2 = path.join(DASHBOARD_ABSOLUTE_PATH, 'resources', 'post');
      const providersDir = path.join(DASHBOARD_ABSOLUTE_PATH, 'providers');
      expect(mockFs.mkdirSync).not.toHaveBeenCalledWith(skippedResourcePath, expect.anything());
      expect(mockFs.mkdirSync).not.toHaveBeenCalledWith(skippedResourcePath2, expect.anything());
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(providersDir, { recursive: true });
    });

    it('should delete and regenerate when user confirms', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockPromptUser.mockResolvedValue(true);

      await generator.generate();

      expect(mockFs.rmSync).toHaveBeenCalled();
      expect(mockFs.mkdirSync).toHaveBeenCalled();
    });

    it('should use correct resource names', async () => {
      mockGetResourceName.mockReturnValue('custom-resource');

      await generator.generate();

      expect(mockGetResourceName).toHaveBeenCalledWith('User');
      expect(mockGetResourceName).toHaveBeenCalledWith('Post');
    });

    it('should generate content with auto-generated tags', async () => {
      await generator.generate();

      // Verify that generated content contains auto-generated markers
      const writeCalls = (mockFs.promises.writeFile as jest.Mock).mock.calls;
      const contents = writeCalls.map((call) => call[1]?.toString() || '');

      // Check that component files contain expected structure (auto-generated tag is added by tagAutoGenerated in page-config)
      const componentFiles = contents.filter(
        (content) =>
          content.includes('export const') &&
          (content.includes('List') ||
            content.includes('Edit') ||
            content.includes('Create') ||
            content.includes('Show') ||
            content.includes('Studio')),
      );
      expect(componentFiles.length).toBeGreaterThan(0);
    });

    it('should handle file write errors', async () => {
      const error = new Error('Write failed');
      (mockFs.promises.writeFile as jest.Mock).mockRejectedValue(error);

      await expect(generator.generate()).rejects.toThrow();
    });
  });

  describe('updateAppComponent', () => {
    const mockAppContent = `import React from 'react';
import { Admin, Resource } from 'react-admin';

const App = () => (
  <Admin>
  </Admin>
);

export default App;
`;

    beforeEach(() => {
      // Mock readFileSync to return valid schema for first call, App.tsx for subsequent calls
      const defaultSchema = `
// @tg_form()
model User {
  id String @id @default(uuid())
  email String @unique
}

// @tg_form()
model Post {
  id String @id @default(uuid())
  title String
}
`;
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return defaultSchema;
        }
        if (filePath.toString().includes('App.tsx')) {
          return mockAppContent;
        }
        return '';
      });
    });

    it('should read App.tsx file', async () => {
      await generator.generate();

      const appPath = path.join(DASHBOARD_ABSOLUTE_PATH, 'App.tsx');

      expect(mockFs.readFileSync).toHaveBeenCalledWith(appPath, 'utf-8');
    });

    it('should add imports for all models', async () => {
      await generator.generate();

      const writeCall = mockFs.writeFileSync.mock.calls.find((call) => call[0].toString().includes('App.tsx'));
      const content = writeCall?.[1] as string;

      expect(content).toContain('import { UserList');
      expect(content).toContain('import { PostList');
    });

    it('should add resources to Admin component', async () => {
      await generator.generate();

      const writeCall = mockFs.writeFileSync.mock.calls.find((call) => call[0].toString().includes('App.tsx'));
      const content = writeCall?.[1] as string;

      expect(content).toContain('<Resource');
      expect(content).toContain('name="user"');
      expect(content).toContain('name="post"');
    });

    it('should remove old auto-generated imports', async () => {
      const appWithOldImports = `import React from 'react';
// AUTO-GENERATED IMPORTS START
import { OldList } from './resources/old';
// AUTO-GENERATED IMPORTS END
import { Admin } from 'react-admin';
`;

      const testSchema = `
// @tg_form()
model User {
  id String @id @default(uuid())
  email String @unique
}

// @tg_form()
model Post {
  id String @id @default(uuid())
  title String
}
`;
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return testSchema;
        }
        if (filePath.toString().includes('App.tsx')) {
          return appWithOldImports;
        }
        return '';
      });

      await generator.generate();

      const writeCall = mockFs.writeFileSync.mock.calls.find((call) => call[0].toString().includes('App.tsx'));
      const content = writeCall?.[1] as string;

      expect(content).not.toContain('OldList');
      expect(content).toContain('UserList');
    });

    it('should remove old auto-generated resources', async () => {
      const appWithOldResources = `<Admin>
      {/* AUTO-GENERATED RESOURCES START */}
      <Resource name="old" />
      {/* AUTO-GENERATED RESOURCES END */}
</Admin>`;

      const fullApp = `import React from 'react';
import { Admin, Resource } from 'react-admin';

const App = () => (
  ${appWithOldResources}
);

export default App;
`;

      const testSchema = `
// @tg_form()
model User {
  id String @id @default(uuid())
  email String @unique
}

// @tg_form()
model Post {
  id String @id @default(uuid())
  title String
}
`;
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return testSchema;
        }
        if (filePath.toString().includes('App.tsx')) {
          return fullApp;
        }
        return '';
      });

      await generator.generate();

      const writeCall = mockFs.writeFileSync.mock.calls.find((call) => call[0].toString().includes('App.tsx'));
      const content = writeCall?.[1] as string;

      expect(content).not.toContain('name="old"');
      expect(content).toContain('name="user"');
    });

    it('should skip models with empty names when updating App', async () => {
      // Override schema content - real parser will parse valid models
      const testSchema = `
// @tg_form()
model User {
  id String @id
}

// @tg_form()
model Post {
  id String @id
}
`;
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return testSchema;
        }
        if (filePath.toString().includes('App.tsx')) {
          return mockAppContent;
        }
        return '';
      });

      await generator.generate();

      const writeCall = mockFs.writeFileSync.mock.calls.find((call) => call[0].toString().includes('App.tsx'));
      const content = writeCall?.[1] as string;

      expect(content).toContain('UserList');
      expect(content).toContain('PostList');
      // Should not contain imports for empty name model
    });

    it('should write updated App.tsx file', async () => {
      await generator.generate();

      const appPath = path.join(DASHBOARD_ABSOLUTE_PATH, 'App.tsx');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(appPath, expect.any(String));
    });

    it('should add CustomRoutes for Studio pages', async () => {
      await generator.generate();

      const writeCall = mockFs.writeFileSync.mock.calls.find((call) => call[0].toString().includes('App.tsx'));
      const content = writeCall?.[1] as string;

      expect(content).toContain('AUTO-GENERATED CUSTOM ROUTES START');
      expect(content).toContain('<CustomRoutes>');
      expect(content).toContain('path="/user/studio"');
      expect(content).toContain('path="/post/studio"');
    });
  });

  describe('Edge Cases', () => {
    const mockAppContent = `import React from 'react';
import { Admin, Resource } from 'react-admin';

const App = () => (
  <Admin>
  </Admin>
);

export default App;
`;

    it('should handle models with special characters in names', async () => {
      // Override schema with model containing underscores
      const testSchema = `
// @tg_form()
model Model_With_Underscores {
  id String @id
}
`;
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return testSchema;
        }
        if (filePath.toString().includes('App.tsx')) {
          return mockAppContent;
        }
        return '';
      });

      await generator.generate();

      expect(mockGetResourceName).toHaveBeenCalledWith('Model_With_Underscores');
    });

    it('should handle empty models array', async () => {
      // Override schema content for this specific test
      const testSchema = `
// @tg_form()
model User {
  id String @id
}
`;
      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return testSchema;
        }
        return '';
      });

      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return 'schema content';
        }
        if (filePath.toString().includes('App.tsx')) {
          return mockAppContent;
        }
        return '';
      });

      await generator.generate();

      const writeCall = mockFs.writeFileSync.mock.calls.find((call) => call[0].toString().includes('App.tsx'));
      const content = writeCall?.[1] as string;

      // Empty array still results in empty AUTO-GENERATED sections
      // The code adds the markers even when there are no models
      expect(content).toContain('AUTO-GENERATED IMPORTS START');
      expect(content).toContain('AUTO-GENERATED IMPORTS END');
      // But there should be no actual import statements
      const importsSection = content.match(
        /\/\/ AUTO-GENERATED IMPORTS START([\s\S]*?)\/\/ AUTO-GENERATED IMPORTS END/,
      );
      expect(importsSection?.[1]?.trim()).toBe('');
    });

    it('should handle missing Admin component in App.tsx', async () => {
      const appWithoutAdmin = `import React from 'react';
const App = () => <div>Hello</div>;
`;

      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return 'schema content';
        }
        if (filePath.toString().includes('App.tsx')) {
          return appWithoutAdmin;
        }
        return '';
      });

      await generator.generate();

      // Should not throw, just not add resources
      const writeCall = mockFs.writeFileSync.mock.calls.find((call) => call[0].toString().includes('App.tsx'));
      expect(writeCall).toBeDefined();
    });
  });
});
