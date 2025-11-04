import type { GeneratedModuleFolder } from '@tg-scripts/types';
import { NestAppModuleUpdater } from './NestAppModuleUpdater';

describe('NestAppModuleUpdater', () => {
  let updater: NestAppModuleUpdater;

  beforeEach(() => {
    updater = new NestAppModuleUpdater();
  });

  describe('parseImportEntries', () => {
    it('should parse single import statement', () => {
      const block = `import { UserModule } from './features/user/user.module';`;
      const result = updater.parseImportEntries(block);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserModule');
      expect(result[0].line).toContain('import { UserModule }');
    });

    it('should parse multiple import statements', () => {
      const block = `import { UserModule } from './features/user/user.module';
import { AuthModule } from './features/auth/auth.module';`;
      const result = updater.parseImportEntries(block);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('UserModule');
      expect(result[1].name).toBe('AuthModule');
    });

    it('should handle imports with different quote types', () => {
      const block = `import { UserModule } from "./features/user/user.module";
import { AuthModule } from './features/auth/auth.module';`;
      const result = updater.parseImportEntries(block);

      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty block', () => {
      const result = updater.parseImportEntries('');
      expect(result).toEqual([]);
    });

    it('should handle imports without semicolon', () => {
      const block = `import { UserModule } from './features/user/user.module'`;
      const result = updater.parseImportEntries(block);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserModule');
    });

    it('should handle complex import with spaces', () => {
      const block = `import   {   CustomFieldTypeModule   }   from   './features/custom-field-type/customFieldType.module'   ;`;
      const result = updater.parseImportEntries(block);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('CustomFieldTypeModule');
    });
  });

  describe('buildImportStatement', () => {
    it('should build import statement for features module', () => {
      const result = updater.buildImportStatement('User', 'features');
      expect(result.name).toBe('UserModule');
      expect(result.line).toBe("import { UserModule } from './features/user/user.module';");
    });

    it('should build import statement for infrastructure module', () => {
      const result = updater.buildImportStatement('Database', 'infrastructure');
      expect(result.name).toBe('DatabaseModule');
      expect(result.line).toBe("import { DatabaseModule } from './infrastructure/database/database.module';");
    });

    it('should handle compound model names', () => {
      const result = updater.buildImportStatement('CustomFieldType', 'features');
      expect(result.name).toBe('CustomFieldTypeModule');
      expect(result.line).toBe(
        "import { CustomFieldTypeModule } from './features/custom-field-type/customFieldType.module';",
      );
    });
  });

  describe('mergeImportEntries', () => {
    it('should merge entries without duplicates', () => {
      const existing = [
        {
          name: 'UserModule',
          line: "import { UserModule } from './user.module';",
        },
      ];
      const newEntries = [
        {
          name: 'AuthModule',
          line: "import { AuthModule } from './auth.module';",
        },
      ];

      const result = updater.mergeImportEntries(existing, newEntries);

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.name)).toEqual(['UserModule', 'AuthModule']);
    });

    it('should deduplicate by name', () => {
      const existing = [
        {
          name: 'UserModule',
          line: "import { UserModule } from './user.module';",
        },
      ];
      const newEntries = [
        {
          name: 'UserModule',
          line: "import { UserModule } from './user2.module';",
        },
      ];

      const result = updater.mergeImportEntries(existing, newEntries);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserModule');
      expect(result[0].line).toBe("import { UserModule } from './user.module';");
    });

    it('should handle empty existing entries', () => {
      const existing: Array<{ name: string; line: string }> = [];
      const newEntries = [
        {
          name: 'UserModule',
          line: "import { UserModule } from './user.module';",
        },
      ];

      const result = updater.mergeImportEntries(existing, newEntries);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserModule');
    });

    it('should handle empty new entries', () => {
      const existing = [
        {
          name: 'UserModule',
          line: "import { UserModule } from './user.module';",
        },
      ];
      const newEntries: Array<{ name: string; line: string }> = [];

      const result = updater.mergeImportEntries(existing, newEntries);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UserModule');
    });
  });

  describe('findImportBlock', () => {
    it('should find existing import block', () => {
      const content = `// AUTO-GENERATED IMPORTS START
import { UserModule } from './features/user/user.module';
import { AuthModule } from './features/auth/auth.module';
// AUTO-GENERATED IMPORTS END`;
      const result = updater.findImportBlock(content);

      expect(result).not.toBeNull();
      expect(result?.block).toContain('UserModule');
      expect(result?.block).toContain('AuthModule');
    });

    it('should return null if block not found', () => {
      const content = `import { UserModule } from './features/user/user.module';`;
      const result = updater.findImportBlock(content);

      expect(result).toBeNull();
    });

    it('should handle block with whitespace', () => {
      const content = `// AUTO-GENERATED IMPORTS START


// AUTO-GENERATED IMPORTS END`;
      const result = updater.findImportBlock(content);

      expect(result).not.toBeNull();
      expect(result?.block.trim()).toBe('');
    });
  });

  describe('findLastImportStatement', () => {
    it('should find last import statement', () => {
      const content = `import { Module } from '@nestjs/common';
import { AppService } from './app.service';
export class App {}`;
      const result = updater.findLastImportStatement(content);

      expect(result).not.toBeNull();
      expect(result?.index).toBeGreaterThan(-1);
      expect(content.substring(result!.index, result!.index + result!.length)).toContain('AppService');
    });

    it('should return null if no imports found', () => {
      const content = `export class App {}`;
      const result = updater.findLastImportStatement(content);

      expect(result).toBeNull();
    });

    it('should handle single import', () => {
      const content = `import { Module } from '@nestjs/common';
export class App {}`;
      const result = updater.findLastImportStatement(content);

      expect(result).not.toBeNull();
    });

    it('should handle imports with different quote styles', () => {
      const content = `import { Module } from "@nestjs/common";
import { AppService } from './app.service';`;
      const result = updater.findLastImportStatement(content);

      expect(result).not.toBeNull();
    });
  });

  describe('insertImportBlock', () => {
    it('should insert block after last import', () => {
      const content = `import { Module } from '@nestjs/common';
export class App {}`;
      const importsBlock = `// AUTO-GENERATED IMPORTS START
import { UserModule } from './user.module';
// AUTO-GENERATED IMPORTS END`;
      const result = updater.insertImportBlock(content, importsBlock, 40);

      expect(result).toContain(importsBlock);
      expect(result.indexOf(importsBlock)).toBeGreaterThan(result.indexOf('@nestjs/common'));
    });

    it('should insert block at beginning when position is null', () => {
      const content = `export class App {}`;
      const importsBlock = `// AUTO-GENERATED IMPORTS START
// AUTO-GENERATED IMPORTS END`;
      const result = updater.insertImportBlock(content, importsBlock, null);

      expect(result).toMatch(/^\/\/ AUTO-GENERATED IMPORTS START/m);
    });
  });

  describe('mergeModuleNames', () => {
    it('should merge and deduplicate module names', () => {
      const previous = ['UserModule', 'AuthModule'];
      const newModules = ['ProjectModule', 'UserModule'];

      const result = updater.mergeModuleNames(previous, newModules);

      expect(result).toHaveLength(3);
      expect(result).toContain('UserModule');
      expect(result).toContain('AuthModule');
      expect(result).toContain('ProjectModule');
    });

    it('should handle empty arrays', () => {
      const result = updater.mergeModuleNames([], []);

      expect(result).toEqual([]);
    });

    it('should handle all new modules', () => {
      const result = updater.mergeModuleNames([], ['UserModule', 'AuthModule']);

      expect(result).toEqual(['UserModule', 'AuthModule']);
    });
  });

  describe('cleanArrayTokens', () => {
    it('should clean tokens and add commas correctly', () => {
      const tokens = ['UserModule', 'AuthModule', 'ProjectModule'];
      const result = updater.cleanArrayTokens(tokens);

      expect(result[0]).toBe('UserModule,');
      expect(result[1]).toBe('AuthModule,');
      expect(result[2]).toBe('ProjectModule');
    });

    it('should remove trailing commas', () => {
      const tokens = ['UserModule,', 'AuthModule,', 'ProjectModule'];
      const result = updater.cleanArrayTokens(tokens);

      expect(result[0]).toBe('UserModule,');
      expect(result[1]).toBe('AuthModule,');
      expect(result[2]).toBe('ProjectModule');
    });

    it('should handle single token', () => {
      const tokens = ['UserModule'];
      const result = updater.cleanArrayTokens(tokens);

      expect(result[0]).toBe('UserModule');
      expect(result.length).toBe(1);
    });

    it('should trim whitespace', () => {
      const tokens = ['  UserModule  ', '  AuthModule  '];
      const result = updater.cleanArrayTokens(tokens);

      expect(result[0]).toBe('UserModule,');
      expect(result[1]).toBe('AuthModule');
    });
  });

  describe('buildImportsArrayContent', () => {
    it('should build content with tokens and modules', () => {
      const filteredTokens = ['ConfigModule', 'JwtModule'];
      const moduleNames = ['UserModule', 'AuthModule'];

      const result = updater.buildImportsArrayContent(filteredTokens, moduleNames);

      expect(result).toContain('ConfigModule');
      expect(result).toContain('JwtModule');
      expect(result).toContain('// AUTO-GENERATED MODULES START');
      expect(result).toContain('UserModule');
      expect(result).toContain('AuthModule');
    });

    it('should build content with only tokens', () => {
      const filteredTokens = ['ConfigModule', 'JwtModule'];
      const moduleNames: string[] = [];

      const result = updater.buildImportsArrayContent(filteredTokens, moduleNames);

      expect(result).toContain('ConfigModule');
      expect(result).not.toContain('AUTO-GENERATED MODULES');
    });

    it('should build content with only modules', () => {
      const filteredTokens: string[] = [];
      const moduleNames = ['UserModule'];

      const result = updater.buildImportsArrayContent(filteredTokens, moduleNames);

      expect(result).toContain('// AUTO-GENERATED MODULES START');
      expect(result).toContain('UserModule');
    });

    it('should handle empty inputs', () => {
      const result = updater.buildImportsArrayContent([], []);

      expect(result).toBe('');
    });
  });

  describe('updateImportStatements', () => {
    const mods: Array<{ name: string; moduleType: GeneratedModuleFolder }> = [{ name: 'Auth', moduleType: 'features' }];

    it('should update existing import block', () => {
      const content = `import { Module } from '@nestjs/common';
// AUTO-GENERATED IMPORTS START
import { UserModule } from './features/user/user.module';
// AUTO-GENERATED IMPORTS END`;

      const result = updater.updateImportStatements(content, mods);

      expect(result).toContain('AuthModule');
      expect(result).toContain('UserModule');
      expect(result).toContain('// AUTO-GENERATED IMPORTS START');
    });

    it('should create new import block if none exists', () => {
      const content = `import { Module } from '@nestjs/common';
export class App {}`;

      const result = updater.updateImportStatements(content, mods);

      expect(result).toContain('// AUTO-GENERATED IMPORTS START');
      expect(result).toContain('AuthModule');
    });

    it('should merge multiple modules', () => {
      const content = `import { Module } from '@nestjs/common';`;
      const multipleMods: Array<{ name: string; moduleType: GeneratedModuleFolder }> = [
        { name: 'User', moduleType: 'features' },
        { name: 'Auth', moduleType: 'features' },
      ];

      const result = updater.updateImportStatements(content, multipleMods);

      expect(result).toContain('UserModule');
      expect(result).toContain('AuthModule');
    });

    it('should handle content with no imports when adding new imports', () => {
      const content = `export class AppModule {}`;

      const result = updater.updateImportStatements(content, [{ name: 'User', moduleType: 'features' }]);

      expect(result).toContain('UserModule');
      expect(result).toMatch(/^\/\/ AUTO-GENERATED IMPORTS START/m);
    });
  });

  describe('updateImportsArray', () => {
    it('should update imports array with new modules', () => {
      const content = `@Module({
  imports: [
    ConfigModule,
    // AUTO-GENERATED MODULES START
    UserModule,
    // AUTO-GENERATED MODULES END
  ]
})`;
      const mods: Array<{ name: string; moduleType: GeneratedModuleFolder }> = [
        { name: 'Auth', moduleType: 'features' },
      ];

      const result = updater.updateImportsArray(content, mods);

      expect(result).toContain('AuthModule');
      expect(result).toContain('UserModule');
      expect(result).toContain('ConfigModule');
    });

    it('should preserve existing non-auto-generated imports', () => {
      const content = `@Module({
  imports: [ConfigModule, JwtModule]
})`;
      const mods: Array<{ name: string; moduleType: GeneratedModuleFolder }> = [
        { name: 'User', moduleType: 'features' },
      ];

      const result = updater.updateImportsArray(content, mods);

      expect(result).toContain('ConfigModule');
      expect(result).toContain('JwtModule');
      expect(result).toContain('UserModule');
    });

    it('should return original content if module decorator not found', () => {
      const content = `export class AppModule {}`;
      const mods: Array<{ name: string; moduleType: GeneratedModuleFolder }> = [
        { name: 'User', moduleType: 'features' },
      ];

      const result = updater.updateImportsArray(content, mods);

      expect(result).toBe(content);
    });

    it('should return original content if imports array bounds not found', () => {
      const content = `@Module({
  controllers: [AppController]
})`;
      const mods: Array<{ name: string; moduleType: GeneratedModuleFolder }> = [
        { name: 'User', moduleType: 'features' },
      ];

      const result = updater.updateImportsArray(content, mods);

      expect(result).toBe(content);
    });
  });

  describe('Integration and snapshot tests', () => {
    it('should match snapshot for complete AppModule update flow', () => {
      const content = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// AUTO-GENERATED IMPORTS START
import { UserModule } from './features/user/user.module';
// AUTO-GENERATED IMPORTS END

@Module({
  imports: [
    ConfigModule.forRoot(),
    // AUTO-GENERATED MODULES START
    UserModule,
    // AUTO-GENERATED MODULES END
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}`;

      const mods: Array<{ name: string; moduleType: GeneratedModuleFolder }> = [
        { name: 'Auth', moduleType: 'features' },
        { name: 'Project', moduleType: 'features' },
      ];

      let result = updater.updateImportStatements(content, mods);
      result = updater.updateImportsArray(result, mods);

      expect(result).toMatchSnapshot();
    });

    it('should handle real-world AppModule structure', () => {
      const realAppModule = `import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HealthModule } from './infrastructure/health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';
// AUTO-GENERATED IMPORTS START
import { UserModule } from './features/user/user.module';
// AUTO-GENERATED IMPORTS END

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    DatabaseModule,
    // AUTO-GENERATED MODULES START
    UserModule,
    // AUTO-GENERATED MODULES END
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}`;

      const mods: Array<{ name: string; moduleType: GeneratedModuleFolder }> = [
        { name: 'CustomFieldType', moduleType: 'features' },
        { name: 'ProjectInstance', moduleType: 'features' },
      ];

      let result = updater.updateImportStatements(realAppModule, mods);
      result = updater.updateImportsArray(result, mods);

      expect(result).toMatchSnapshot();
    });
  });
});
