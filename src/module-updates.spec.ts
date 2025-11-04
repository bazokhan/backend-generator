import {
  generateModuleImportStatements,
  addImportsToModule,
  addToArrayInModule,
  findArrayInModule,
} from './module-updates';

describe('Module Updates', () => {
  const namingSuffix = 'Tg';
  const fileSuffix = 'tg';
  describe('generateTgImportStatements', () => {
    it('should generate correct import statements for simple model name', () => {
      const result = generateModuleImportStatements('User', 'user', namingSuffix, fileSuffix);
      expect(result.controllerImport).toBe("import { UserTgController } from './user.tg.controller';");
      expect(result.serviceImport).toBe("import { UserTgService } from './user.tg.service';");
    });

    it('should generate correct import statements for compound model name', () => {
      const result = generateModuleImportStatements('CustomFieldType', 'customFieldType', namingSuffix, fileSuffix);
      expect(result.controllerImport).toBe(
        "import { CustomFieldTypeTgController } from './customFieldType.tg.controller';",
      );
      expect(result.serviceImport).toBe("import { CustomFieldTypeTgService } from './customFieldType.tg.service';");
    });

    it('should generate correct import statements for model with multiple words', () => {
      const result = generateModuleImportStatements('ProjectInstance', 'projectInstance', namingSuffix, fileSuffix);
      expect(result.controllerImport).toBe(
        "import { ProjectInstanceTgController } from './projectInstance.tg.controller';",
      );
      expect(result.serviceImport).toBe("import { ProjectInstanceTgService } from './projectInstance.tg.service';");
    });
  });

  describe('findArrayInModule', () => {
    it('should find controllers array in module', () => {
      const content = `@Module({
  controllers: [AppController, UserController],
  providers: [AppService]
})`;
      const result = findArrayInModule(content, 'controllers');
      expect(result).not.toBeNull();
      expect(result?.start).toBeGreaterThan(-1);
      expect(result?.end).toBeGreaterThan(result!.start);
    });

    it('should find providers array in module', () => {
      const content = `@Module({
  controllers: [AppController],
  providers: [AppService, UserService]
})`;
      const result = findArrayInModule(content, 'providers');
      expect(result).not.toBeNull();
      expect(result?.start).toBeGreaterThan(-1);
      expect(result?.end).toBeGreaterThan(result!.start);
    });

    it('should return null if module decorator not found', () => {
      const content = `export class AppModule {}`;
      const result = findArrayInModule(content, 'controllers');
      expect(result).toBeNull();
    });

    it('should return null if array not found in module', () => {
      const content = `@Module({
  controllers: [AppController]
})`;
      const result = findArrayInModule(content, 'providers');
      expect(result).toBeNull();
    });

    it('should return null if module brace is unmatched', () => {
      const content = `@Module({
  controllers: [AppController]`;
      const result = findArrayInModule(content, 'controllers');
      expect(result).toBeNull();
    });

    it('should return null if array keyword not found', () => {
      const content = `@Module({
  imports: [ConfigModule]
})`;
      const result = findArrayInModule(content, 'controllers');
      expect(result).toBeNull();
    });

    it('should return null if array bracket not found', () => {
      const content = `@Module({
  controllers:
  providers: [AppService]
})`;
      const result = findArrayInModule(content, 'controllers');
      expect(result).toBeNull();
    });

    it('should return null if array bracket is unmatched', () => {
      const content = `@Module({
  controllers: [AppController
})`;
      const result = findArrayInModule(content, 'controllers');
      expect(result).toBeNull();
    });

    it('should handle nested structures correctly', () => {
      const content = `@Module({
  controllers: [{ controller: AppController }],
  providers: [AppService]
})`;
      const result = findArrayInModule(content, 'controllers');
      expect(result).not.toBeNull();
    });

    it('should handle empty arrays', () => {
      const content = `@Module({
  controllers: [],
  providers: [AppService]
})`;
      const result = findArrayInModule(content, 'controllers');
      expect(result).not.toBeNull();
      const arrayContent = content.substring(result!.start + 1, result!.end);
      expect(arrayContent.trim()).toBe('');
    });
  });

  describe('addImportsToModule', () => {
    it('should add imports when they do not exist', () => {
      const content = `import { AppService } from './app.service';

export class AppModule {}`;
      const imports = [
        "import { UserTgController } from './user.tg.controller';",
        "import { UserTgService } from './user.tg.service';",
      ];
      const result = addImportsToModule(content, imports);

      expect(result).toContain(imports[0]);
      expect(result).toContain(imports[1]);
      expect(result).toContain('import { AppService }');
    });

    it('should not duplicate existing imports', () => {
      const content = `import { AppService } from './app.service';
import { UserTgController } from './user.tg.controller';

export class AppModule {}`;
      const imports = [
        "import { UserTgController } from './user.tg.controller';",
        "import { UserTgService } from './user.tg.service';",
      ];
      const result = addImportsToModule(content, imports);

      const matches = (result.match(/UserTgController/g) || []).length;
      expect(matches).toBe(1); // Should only appear once
      expect(result).toContain(imports[1]); // New import should be added
    });

    it('should add imports at the beginning when no imports exist', () => {
      const content = `export class AppModule {}`;
      const imports = ["import { UserTgController } from './user.tg.controller';"];
      const result = addImportsToModule(content, imports);

      expect(result).toMatch(/^import \{ UserTgController \}/m);
    });

    it('should handle import statements with invalid format', () => {
      const content = `import { AppService } from './app.service';

export class AppModule {}`;
      const imports = ['invalid import statement format', 'also invalid'];
      const result = addImportsToModule(content, imports);

      // Should still add invalid imports (defensive: if we can't parse, add it)
      expect(result).toContain('invalid import statement format');
      expect(result).toContain('also invalid');
    });

    it('should add imports after last import statement', () => {
      const content = `import { AppService } from './app.service';
import { AppController } from './app.controller';

export class AppModule {}`;
      const imports = ["import { UserTgController } from './user.tg.controller';"];
      const result = addImportsToModule(content, imports);

      expect(result.indexOf(imports[0])).toBeGreaterThan(result.indexOf('import { AppController }'));
    });

    it('should return original content if all imports already exist', () => {
      const content = `import { UserTgController } from './user.tg.controller';
import { UserTgService } from './user.tg.service';

export class AppModule {}`;
      const imports = [
        "import { UserTgController } from './user.tg.controller';",
        "import { UserTgService } from './user.tg.service';",
      ];
      const result = addImportsToModule(content, imports);

      expect(result).toBe(content);
    });
  });

  describe('addToArrayInModule', () => {
    it('should add item to empty controllers array', () => {
      const content = `@Module({
  controllers: [],
  providers: [AppService]
})`;
      const result = addToArrayInModule(content, 'controllers', ['UserTgController']);

      expect(result).toContain('UserTgController');
      expect(result).toMatch(/controllers:\s*\[UserTgController\]/);
    });

    it('should add item to existing controllers array', () => {
      const content = `@Module({
  controllers: [AppController],
  providers: [AppService]
})`;
      const result = addToArrayInModule(content, 'controllers', ['UserTgController']);

      expect(result).toContain('UserTgController');
      expect(result).toContain('AppController');
      expect(result).toMatch(/controllers:\s*\[AppController,\s*UserTgController\]/);
    });

    it('should not duplicate existing items', () => {
      const content = `@Module({
  controllers: [AppController, UserTgController],
  providers: [AppService]
})`;
      const result = addToArrayInModule(content, 'controllers', ['UserTgController']);

      const matches = (result.match(/UserTgController/g) || []).length;
      expect(matches).toBe(1);
    });

    it('should add multiple items to array', () => {
      const content = `@Module({
  controllers: [AppController],
  providers: [AppService]
})`;
      const result = addToArrayInModule(content, 'controllers', ['UserTgController', 'ProjectTgController']);

      expect(result).toContain('UserTgController');
      expect(result).toContain('ProjectTgController');
      expect(result).toContain('AppController');
    });

    it('should handle providers array', () => {
      const content = `@Module({
  controllers: [AppController],
  providers: [AppService]
})`;
      const result = addToArrayInModule(content, 'providers', ['UserTgService']);

      expect(result).toContain('UserTgService');
      expect(result).toMatch(/providers:\s*\[AppService,\s*UserTgService\]/);
    });

    it('should return original content if array not found', () => {
      const content = `@Module({
  controllers: [AppController]
})`;
      const result = addToArrayInModule(content, 'providers', ['UserTgService']);

      expect(result).toBe(content);
    });

    it('should return original content if all items already exist', () => {
      const content = `@Module({
  controllers: [UserTgController]
})`;
      const result = addToArrayInModule(content, 'controllers', ['UserTgController']);

      expect(result).toBe(content);
    });

    it('should handle complex nested structures', () => {
      const content = `@Module({
  controllers: [{ provide: APP_CONTROLLER, useClass: AppController }],
  providers: [AppService]
})`;
      const result = addToArrayInModule(content, 'controllers', ['UserTgController']);

      expect(result).toContain('UserTgController');
      expect(result).toContain('APP_CONTROLLER');
    });
  });

  describe('Integration and snapshot tests', () => {
    it('should match snapshot for complete module update flow', () => {
      const content = `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}`;

      const imports = generateModuleImportStatements('User', 'user', namingSuffix, fileSuffix);
      let result = addImportsToModule(content, [imports.controllerImport, imports.serviceImport]);
      result = addToArrayInModule(result, 'controllers', ['UserTgController']);
      result = addToArrayInModule(result, 'providers', ['UserTgService']);

      expect(result).toMatchSnapshot();
    });

    it('should handle real-world module structure', () => {
      const realModule = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService],
  exports: []
})
export class AppModule {}`;

      const imports = generateModuleImportStatements('CustomFieldType', 'customFieldType', namingSuffix, fileSuffix);
      let result = addImportsToModule(realModule, [imports.controllerImport, imports.serviceImport]);
      result = addToArrayInModule(result, 'controllers', ['CustomFieldTypeTgController']);
      result = addToArrayInModule(result, 'providers', ['CustomFieldTypeTgService']);

      expect(result).toMatchSnapshot();
    });
  });
});
