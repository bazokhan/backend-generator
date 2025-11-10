import {
  findMatchingDelimiter,
  findMatchingBrace,
  findMatchingBracket,
  findMatchingParenthesis,
  parseStringToArray,
} from '../parser/utils/character-parsers';

describe('findMatchingDelimiter', () => {
  it('should find matching braces', () => {
    const content = '{ { { } } }';
    const result = findMatchingDelimiter(content, 0, '{', '}');
    expect(result).toBe(content.length - 1);
  });

  it('should find matching brackets', () => {
    const content = '[ [ [ ] ] ]';
    const result = findMatchingDelimiter(content, 0, '[', ']');
    expect(result).toBe(content.length - 1);
  });

  it('should find matching parentheses', () => {
    const content = '( ( ( ) ) )';
    const result = findMatchingDelimiter(content, 0, '(', ')');
    expect(result).toBe(content.length - 1);
  });

  it('should handle nested delimiters', () => {
    const content = '{ foo { bar } baz }';
    const result = findMatchingDelimiter(content, 0, '{', '}');
    expect(result).toBe(content.length - 1);
  });

  it('should return -1 when no match found', () => {
    const content = '{ { }';
    const result = findMatchingDelimiter(content, 0, '{', '}');
    expect(result).toBe(-1);
  });

  it('should handle start from middle', () => {
    const content = '{ { { } } }';
    const result = findMatchingDelimiter(content, 2, '{', '}');
    // Starting from index 2 (second {), it matches the second }
    expect(result).toBe(8); // Position of matching closing brace
  });

  it('should handle complex nesting', () => {
    const content = 'const x = { a: [1, 2, { b: 3 }] };';
    const openIndex = content.indexOf('{');
    const result = findMatchingDelimiter(content, openIndex, '{', '}');
    expect(result).toBeGreaterThan(openIndex);
  });

  it('should handle string with delimiters', () => {
    const content = 'const text = "value { } text"; { real }';
    const lastBrace = content.lastIndexOf('{');
    const result = findMatchingDelimiter(content, lastBrace, '{', '}');
    expect(result).toBe(content.length - 1);
  });
});

describe('findMatchingBrace', () => {
  it('should find matching brace', () => {
    const content = '{ content }';
    const result = findMatchingBrace(content, 0);
    expect(result).toBe(content.length - 1);
  });

  it('should handle nested braces', () => {
    const content = '{ outer { inner } }';
    const result = findMatchingBrace(content, 0);
    expect(result).toBe(content.length - 1);
  });
});

describe('findMatchingBracket', () => {
  it('should find matching bracket', () => {
    const content = '[ items ]';
    const result = findMatchingBracket(content, 0);
    expect(result).toBe(content.length - 1);
  });

  it('should handle nested brackets', () => {
    const content = '[ outer [ inner ] ]';
    const result = findMatchingBracket(content, 0);
    expect(result).toBe(content.length - 1);
  });
});

describe('findMatchingParenthesis', () => {
  it('should find matching parenthesis', () => {
    const content = '( expression )';
    const result = findMatchingParenthesis(content, 0);
    expect(result).toBe(content.length - 1);
  });

  it('should handle nested parentheses', () => {
    const content = '( outer ( inner ) )';
    const result = findMatchingParenthesis(content, 0);
    expect(result).toBe(content.length - 1);
  });
});

describe('parseStringToArray', () => {
  describe('Simple cases', () => {
    it('should parse simple comma-separated values', () => {
      const result = parseStringToArray('a, b, c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle values without spaces', () => {
      const result = parseStringToArray('a,b,c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle mixed whitespace', () => {
      const result = parseStringToArray('a , b ,  c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle single element', () => {
      const result = parseStringToArray('a');
      expect(result).toEqual(['a']);
    });

    it('should handle empty string', () => {
      const result = parseStringToArray('');
      expect(result).toEqual([]);
    });

    it('should handle only whitespace', () => {
      const result = parseStringToArray('   ');
      expect(result).toEqual([]);
    });
  });

  describe('String literals', () => {
    it('should handle double-quoted strings with commas', () => {
      const result = parseStringToArray('a, "b, c, d", e');
      expect(result).toEqual(['a', '"b, c, d"', 'e']);
    });

    it('should handle single-quoted strings with commas', () => {
      const result = parseStringToArray("a, 'b, c, d', e");
      expect(result).toEqual(['a', "'b, c, d'", 'e']);
    });

    it('should handle mixed quote types', () => {
      const result = parseStringToArray('a, "b, c", \'d, e\', f');
      expect(result).toEqual(['a', '"b, c"', "'d, e'", 'f']);
    });

    it('should handle empty strings', () => {
      const result = parseStringToArray('a, "", b');
      expect(result).toEqual(['a', '""', 'b']);
    });

    it('should handle escaped quotes', () => {
      const result = parseStringToArray('a, "b\\"c", d');
      expect(result).toEqual(['a', '"b\\"c"', 'd']);
    });

    it('should handle strings with nested quotes', () => {
      const result = parseStringToArray('a, "hello\'world", b');
      expect(result).toEqual(['a', '"hello\'world"', 'b']);
    });
  });

  describe('Nested objects', () => {
    it('should handle object with simple properties', () => {
      const result = parseStringToArray('a, { x: 1, y: 2 }, b');
      expect(result).toEqual(['a', '{ x: 1, y: 2 }', 'b']);
    });

    it('should handle object with string values containing commas', () => {
      const result = parseStringToArray('a, { name: "John, Doe", age: 30 }, b');
      expect(result).toEqual(['a', '{ name: "John, Doe", age: 30 }', 'b']);
    });

    it('should handle nested objects', () => {
      const result = parseStringToArray('a, { x: { a: 1, b: 2 }, y: 3 }, b');
      expect(result).toEqual(['a', '{ x: { a: 1, b: 2 }, y: 3 }', 'b']);
    });

    it('should handle multiple nested levels', () => {
      const result = parseStringToArray('a, { x: { a: { b: 1, c: 2 }, d: 3 }, y: 4 }, b');
      expect(result).toEqual(['a', '{ x: { a: { b: 1, c: 2 }, d: 3 }, y: 4 }', 'b']);
    });

    it('should handle object at the start', () => {
      const result = parseStringToArray('{ x: 1 }, b, c');
      expect(result).toEqual(['{ x: 1 }', 'b', 'c']);
    });

    it('should handle object at the end', () => {
      const result = parseStringToArray('a, b, { x: 1 }');
      expect(result).toEqual(['a', 'b', '{ x: 1 }']);
    });

    it('should handle multiple objects', () => {
      const result = parseStringToArray('{ a: 1 }, { b: 2 }, { c: 3 }');
      expect(result).toEqual(['{ a: 1 }', '{ b: 2 }', '{ c: 3 }']);
    });
  });

  describe('Nested arrays', () => {
    it('should handle array with simple values', () => {
      const result = parseStringToArray('a, [1, 2, 3], b');
      expect(result).toEqual(['a', '[1, 2, 3]', 'b']);
    });

    it('should handle nested arrays with commas', () => {
      const result = parseStringToArray('a, [[1, 2], [3, 4]], b');
      expect(result).toEqual(['a', '[[1, 2], [3, 4]]', 'b']);
    });

    it('should handle arrays with objects', () => {
      const result = parseStringToArray('a, [{ x: 1 }, { y: 2 }], b');
      expect(result).toEqual(['a', '[{ x: 1 }, { y: 2 }]', 'b']);
    });

    it('should handle multiple nested levels in arrays', () => {
      const result = parseStringToArray('a, [[[1, 2], 3], [4, [5, 6]]], b');
      expect(result).toEqual(['a', '[[[1, 2], 3], [4, [5, 6]]]', 'b']);
    });
  });

  describe('Nested parentheses', () => {
    it('should handle parentheses with commas', () => {
      const result = parseStringToArray('a, (1, 2, 3), b');
      expect(result).toEqual(['a', '(1, 2, 3)', 'b']);
    });

    it('should handle nested parentheses', () => {
      const result = parseStringToArray('a, ((1, 2), (3, 4)), b');
      expect(result).toEqual(['a', '((1, 2), (3, 4))', 'b']);
    });
  });

  describe('Mixed nesting', () => {
    it('should handle object with array', () => {
      const result = parseStringToArray('a, { x: [1, 2, 3], y: 4 }, b');
      expect(result).toEqual(['a', '{ x: [1, 2, 3], y: 4 }', 'b']);
    });

    it('should handle array with objects', () => {
      const result = parseStringToArray('a, [{ x: 1 }, { y: 2 }], b');
      expect(result).toEqual(['a', '[{ x: 1 }, { y: 2 }]', 'b']);
    });

    it('should handle object with nested object containing array', () => {
      const result = parseStringToArray('a, { x: { y: [1, 2] } }, b');
      expect(result).toEqual(['a', '{ x: { y: [1, 2] } }', 'b']);
    });

    it('should handle mixed brackets, braces, and parentheses', () => {
      const result = parseStringToArray('a, { x: [1, (2, 3)] }, b');
      expect(result).toEqual(['a', '{ x: [1, (2, 3)] }', 'b']);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle module imports format', () => {
      const result = parseStringToArray('UsersModule, AuthModule, { provide: APP_FILTER }');
      expect(result).toEqual(['UsersModule', 'AuthModule', '{ provide: APP_FILTER }']);
    });

    it('should handle complex object with mixed types', () => {
      const result = parseStringToArray('a, { name: "John, Jr.", tags: ["tag1", "tag2"], id: (1 + 2) }, b');
      expect(result).toEqual(['a', '{ name: "John, Jr.", tags: ["tag1", "tag2"], id: (1 + 2) }', 'b']);
    });

    it('should handle TypeScript interface-like structures', () => {
      const result = parseStringToArray('{ controller: UserController }, { service: UserService }, PrismaService');
      expect(result).toEqual(['{ controller: UserController }', '{ service: UserService }', 'PrismaService']);
    });

    it('should handle function call arguments', () => {
      const result = parseStringToArray('logger, { level: "debug" }, ["file1", "file2"]');
      expect(result).toEqual(['logger', '{ level: "debug" }', '["file1", "file2"]']);
    });
  });

  describe('Edge cases', () => {
    it('should handle consecutive commas', () => {
      const result = parseStringToArray('a,,b');
      expect(result).toEqual(['a', 'b']);
    });

    it('should handle leading comma', () => {
      const result = parseStringToArray(',a,b');
      expect(result).toEqual(['a', 'b']);
    });

    it('should handle trailing comma', () => {
      const result = parseStringToArray('a,b,');
      // Empty string at the end is filtered out
      expect(result).toEqual(['a', 'b']);
    });

    it('should handle newlines', () => {
      const result = parseStringToArray('a,\nb,\nc');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle tabs', () => {
      const result = parseStringToArray('a,\tb,\tc');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle mixed whitespace including newlines', () => {
      const result = parseStringToArray('a,\n  b,\n  c');
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Complex examples', () => {
    it('should handle deeply nested structures', () => {
      const result = parseStringToArray('a, { x: { y: { z: [1, { a: [2, 3] }] } } }, b');
      expect(result).toEqual(['a', '{ x: { y: { z: [1, { a: [2, 3] }] } } }', 'b']);
    });

    it('should handle multiple top-level elements with various structures', () => {
      const result = parseStringToArray('Module1, { x: 1 }, Module2, [a, b], Module3, "string, with, commas"');
      expect(result).toEqual(['Module1', '{ x: 1 }', 'Module2', '[a, b]', 'Module3', '"string, with, commas"']);
    });

    it('should handle real NestJS module imports structure', () => {
      const content = `Import1Module,
    Import2Module,
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }`;
      const result = parseStringToArray(content);
      expect(result).toEqual([
        'Import1Module',
        'Import2Module',
        '{ provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }',
      ]);
    });
  });

  describe('Unbalanced braces/parentheses/brackets', () => {
    it('should handle unmatched opening brace', () => {
      const result = parseStringToArray('a, { x: 1, b');
      expect(result).toEqual(['a', '{ x: 1, b']);
    });

    it('should handle unmatched closing brace', () => {
      const result = parseStringToArray('a, x: 1 }, b');
      // With no opening brace, depth stays at 0, so the comma after "1 }" splits
      expect(result).toEqual(['a', 'x: 1 }', 'b']);
    });

    it('should handle only opening brace', () => {
      const result = parseStringToArray('a, { x: 1, b, c');
      expect(result).toEqual(['a', '{ x: 1, b, c']);
    });
  });

  describe('String edge cases', () => {
    it('should handle string with escaped quote', () => {
      const result = parseStringToArray('a, "b\\"c", d');
      // The quote inside is escaped, so the string is "b\"c"
      expect(result).toEqual(['a', '"b\\"c"', 'd']);
    });

    it('should handle string with escaped backslash', () => {
      const result = parseStringToArray('a, "b\\", c');
      // Single backslash before quote: odd number means quote is escaped
      // So the string continues and never properly closes
      expect(result).toEqual(['a', '"b\\", c']);
    });

    it('should handle string with only quotes', () => {
      const result = parseStringToArray('a, "\'", b');
      expect(result).toEqual(['a', '"\'"', 'b']);
    });
  });

  describe('Performance and special characters', () => {
    it('should handle Unicode characters', () => {
      const result = parseStringToArray('a, "héllo", b, "世界"');
      expect(result).toEqual(['a', '"héllo"', 'b', '"世界"']);
    });

    it('should handle special characters in values', () => {
      const result = parseStringToArray('a, b@c, d#e, f$g');
      expect(result).toEqual(['a', 'b@c', 'd#e', 'f$g']);
    });
  });

  describe('Complex real-world snapshot tests', () => {
    it('should handle complex NestJS module imports array with async configurations', () => {
      const complexImports = `ConfigModule.forRoot({
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
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
    DatabaseModule,
    CacheModule,
    StorageModule,
    AuditModule,
    GuardsModule,
    FeatureFlagsModule,
    EmailModule,
    UploadModule,
    UsersModule,
    AuthModule,
    AuditLogModule,
    IconModule,
    TranslationModule,
    ProjectTypeModule,
    ProjectInstanceModule,
    CustomFieldTypeModule,
    CustomFieldInstanceModule,
    UnitTypeModule,
    UnitInstanceModule`;

      expect(parseStringToArray(complexImports)).toMatchSnapshot();
    });

    it('should handle module imports with provider configurations', () => {
      const providers = `AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    FeatureFlagGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }`;

      expect(parseStringToArray(providers)).toMatchSnapshot();
    });

    it('should handle complex TypeScript module configuration', () => {
      const config = `ConfigModule.forRootAsync({
      imports: [DatabaseModule],
      useFactory: async (db: DatabaseService) => {
        return {
          secret: process.env.JWT_SECRET,
          expiresIn: '1h',
        };
      },
      inject: [DatabaseService],
    }),
    LoggerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        level: config.get('LOG_LEVEL'),
      }),
      inject: [ConfigService],
    }),
    SimpleModule`;

      expect(parseStringToArray(config)).toMatchSnapshot();
    });
  });
});

describe('Comment handling', () => {
  describe('Single-line comments', () => {
    it('should ignore single-line comments', () => {
      const result = parseStringToArray('a, // comment\nb, c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle single-line comments at the start', () => {
      const result = parseStringToArray('// comment\na, b, c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle single-line comments at the end', () => {
      const result = parseStringToArray('a, b, c // comment');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle multiple single-line comments', () => {
      const result = parseStringToArray('a, // comment 1\nb, // comment 2\nc');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle single-line comments with Windows line endings', () => {
      const result = parseStringToArray('a, // comment\r\nb, c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle single-line comments with Mac line endings', () => {
      const result = parseStringToArray('a, // comment\rb, c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle the AUTO-GENERATED MODULES case', () => {
      const result = parseStringToArray(
        'ConfigModule,\n// AUTO-GENERATED MODULES START\n    UserModule,\n// AUTO-GENERATED MODULES END',
      );
      expect(result).toEqual(['ConfigModule', 'UserModule']);
    });

    it('should handle single-line comments between elements', () => {
      const result = parseStringToArray('Module1,\n// This is a comment\nModule2,\n// Another comment\nModule3');
      expect(result).toEqual(['Module1', 'Module2', 'Module3']);
    });

    it('should not treat // inside strings as comments', () => {
      const result = parseStringToArray('a, "http://example.com", b');
      expect(result).toEqual(['a', '"http://example.com"', 'b']);
    });

    it('should not treat // inside objects as comments', () => {
      const result = parseStringToArray('a, { url: "http://example.com" }, b');
      expect(result).toEqual(['a', '{ url: "http://example.com" }', 'b']);
    });
  });

  describe('Multi-line comments', () => {
    it('should ignore multi-line comments', () => {
      const result = parseStringToArray('a, /* comment */ b, c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle multi-line comments spanning multiple lines', () => {
      const result = parseStringToArray('a, /* comment\non multiple\nlines */ b, c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle multi-line comments at the start', () => {
      const result = parseStringToArray('/* comment */ a, b, c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle multi-line comments at the end', () => {
      const result = parseStringToArray('a, b, c /* comment */');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle multiple multi-line comments', () => {
      const result = parseStringToArray('a, /* comment 1 */ b, /* comment 2 */ c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should not treat /* inside strings as comments', () => {
      const result = parseStringToArray('a, "/* not a comment */", b');
      expect(result).toEqual(['a', '"/* not a comment */"', 'b']);
    });

    it('should not treat /* inside objects as comments', () => {
      const result = parseStringToArray('a, { path: "/* route */" }, b');
      expect(result).toEqual(['a', '{ path: "/* route */" }', 'b']);
    });
  });

  describe('Mixed comments', () => {
    it('should handle both single-line and multi-line comments', () => {
      const result = parseStringToArray('a, // single line\nb, /* multi line */ c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle comments with complex structures', () => {
      const result = parseStringToArray(
        'ConfigModule,\n// AUTO-GENERATED MODULES START\nUserModule,\n/* Another comment */\nAuthModule,\n// AUTO-GENERATED MODULES END',
      );
      expect(result).toEqual(['ConfigModule', 'UserModule', 'AuthModule']);
    });

    it('should handle comments with nested objects and arrays', () => {
      const result = parseStringToArray(
        'Module1,\n// Comment before object\n{ x: [1, 2, 3] },\n/* Comment after object */\nModule2',
      );
      expect(result).toEqual(['Module1', '{ x: [1, 2, 3] }', 'Module2']);
    });
  });

  describe('Edge cases with comments', () => {
    it('should handle comment immediately after comma', () => {
      const result = parseStringToArray('a, // comment\nb');
      expect(result).toEqual(['a', 'b']);
    });

    it('should handle comment immediately before comma', () => {
      const result = parseStringToArray('a // comment\n, b');
      expect(result).toEqual(['a', 'b']);
    });

    it('should handle empty content after comment', () => {
      const result = parseStringToArray('a, // comment\nb, // another comment');
      expect(result).toEqual(['a', 'b']);
    });

    it('should handle only comments', () => {
      const result = parseStringToArray('// comment 1\n// comment 2');
      expect(result).toEqual([]);
    });

    it('should handle comments with whitespace only', () => {
      const result = parseStringToArray('  // comment\n  /* comment */  ');
      expect(result).toEqual([]);
    });

    it('should handle unclosed multi-line comment gracefully', () => {
      const result = parseStringToArray('a, /* unclosed comment\nb, c');
      // The function should still parse what it can
      expect(result).toEqual(['a']);
    });

    it('should handle comment delimiters in strings correctly', () => {
      const result = parseStringToArray('a, "// not a comment", b, \'/* also not */\', c');
      expect(result).toEqual(['a', '"// not a comment"', 'b', "'/* also not */'", 'c']);
    });
  });
});

describe('Integration tests', () => {
  it('should work with real TypeScript code', () => {
    const content = `@Module({
        imports: [SomeModule],
        controllers: [Controller],
        providers: [Service],
      })`;

    const moduleIndex = content.indexOf('@Module');
    const braceIndex = content.indexOf('{', moduleIndex);
    const matchingBrace = findMatchingBrace(content, braceIndex);

    expect(matchingBrace).toBeGreaterThan(braceIndex);
    expect(matchingBrace).toBe(content.length - 2); // the index of the previous to last character
    // Verify the content between braces is correct
    expect(content.substring(braceIndex + 1, matchingBrace)).toContain('imports:');
    expect(content.substring(braceIndex + 1, matchingBrace)).toContain('controllers:');
    expect(content.substring(braceIndex + 1, matchingBrace)).toContain('providers:');
  });
});
