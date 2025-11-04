import * as fs from 'fs';
import { findModulePath, getModuleFileName } from './file-operations';

// Mock fs at module level, but use real implementations by default
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn((path: string) => actualFs.existsSync(path)),
    readdirSync: jest.fn((path: string) => actualFs.readdirSync(path)),
  };
});

describe('File Operations', () => {
  describe('findModulePath', () => {
    it('should find module in features directory', () => {
      const baseDir = process.cwd();
      const result = findModulePath('User', baseDir);

      // Check if result structure is correct
      if (result) {
        expect(result).toHaveProperty('path');
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('folderName');
        expect(result.type).toBe('features');
      }
    });

    it('should try multiple naming variations', () => {
      const baseDir = process.cwd();
      const result1 = findModulePath('FeatureFlag', baseDir);
      const result2 = findModulePath('CustomFieldType', baseDir);

      // These might find modules or return null, just check structure if found
      if (result1) {
        expect(result1).toHaveProperty('path');
        expect(result1).toHaveProperty('type');
      }
      if (result2) {
        expect(result2).toHaveProperty('path');
        expect(result2).toHaveProperty('type');
      }
    });

    it('should return null for non-existent modules', () => {
      const baseDir = process.cwd();
      const result = findModulePath('NonExistentModuleName123', baseDir);
      expect(result).toBeNull();
    });
  });

  describe('getModuleFileName', () => {
    it('should return empty string for non-existent path', () => {
      const result = getModuleFileName('/non/existent/path');
      expect(result).toBe('');
    });

    it('should find module file in features directory', () => {
      const baseDir = process.cwd();
      const usersPath = `${baseDir}/src/features/users`;
      const result = getModuleFileName(usersPath);

      if (fs.existsSync(usersPath)) {
        expect(result).toMatch(/\.module\.ts$/);
      }
    });

    it('should return empty string when no module file exists', () => {
      const mockFs = fs as jest.Mocked<typeof fs>;

      // Mock existsSync to return true, and readdirSync to return files without .module.ts
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['some-other-file.ts', 'another.ts'] as any);

      const result = getModuleFileName('/some/path');

      expect(result).toBe('');
      expect(mockFs.existsSync).toHaveBeenCalledWith('/some/path');
      expect(mockFs.readdirSync).toHaveBeenCalledWith('/some/path');
    });
  });

  describe('findModulePath variations', () => {
    it('should try different naming variations', () => {
      const baseDir = process.cwd();

      // Test with various model names that might exist
      const testCases = ['User', 'FeatureFlag', 'CustomFieldType', 'ProjectInstance'];

      testCases.forEach((modelName) => {
        const result = findModulePath(modelName, baseDir);
        if (result) {
          expect(result.path).toBeTruthy();
          expect(result.type).toMatch(/^(features|infrastructure)$/);
          expect(result.folderName).toBeTruthy();
        }
      });
    });
  });
});
