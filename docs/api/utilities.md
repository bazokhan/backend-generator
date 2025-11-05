---
layout: default
title: Utilities
parent: API Reference
nav_order: 3
---

# Utilities API

Helper functions and utility classes for code generation.

## ModulePathResolver

Locates and resolves NestJS module paths in your project.

### Constructor

```typescript
new ModulePathResolver();
```

### Methods

#### `resolve(modelName: string): Promise<ModulePathInfo | null>`

Finds the module directory for a given model name.

**Parameters:**

- `modelName` - PascalCase model name (e.g., 'User', 'BlogPost')

**Returns:**

```typescript
interface ModulePathInfo {
  path: string; // e.g., 'src/features/user'
  type: 'features' | 'infrastructure';
  folderName: string; // e.g., 'user'
}
```

**Search Order:**

1. `src/features/{kebab-case-name}/`
2. `src/infrastructure/{kebab-case-name}/`

**Example:**

```typescript
const resolver = new ModulePathResolver();

const userModule = await resolver.resolve('User');
// { path: 'src/features/user', type: 'features', folderName: 'user' }

const postModule = await resolver.resolve('BlogPost');
// { path: 'src/features/blog-post', type: 'features', folderName: 'blog-post' }
```

---

## NestAppModuleUpdater

Updates `app.module.ts` with auto-generated imports while preserving manual code.

### Constructor

```typescript
new NestAppModuleUpdater();
```

### Methods

#### `update(modules: Array<{ name: string; path: string }>): Promise<void>`

Updates AppModule with the given module imports.

**Parameters:**

- `modules` - Array of module names and paths

**Example:**

```typescript
const updater = new NestAppModuleUpdater();

await updater.update([
  { name: 'UserModule', path: './features/user/user.module' },
  { name: 'PostModule', path: './features/post/post.module' },
]);
```

**Behavior:**

- Creates `// AUTO-GENERATED IMPORTS START/END` comments if missing
- Replaces content between sentinel comments
- Preserves all manual imports and code
- Formats generated code

**Generated Section:**

```typescript
// AUTO-GENERATED IMPORTS START
import { UserModule } from './features/user/user.module';
import { PostModule } from './features/post/post.module';
// AUTO-GENERATED IMPORTS END

@Module({
  imports: [
    // Manual imports preserved
    ConfigModule,
    // AUTO-GENERATED IMPORTS START
    UserModule,
    PostModule,
    // AUTO-GENERATED IMPORTS END
  ],
})
export class AppModule {}
```

---

## NestModuleUpdater

Updates individual module files with providers and controllers.

### Constructor

```typescript
new NestModuleUpdater();
```

### Methods

#### `update(modulePath: string, updates: ModuleUpdates): Promise<void>`

Updates a module file with new providers/controllers.

**Parameters:**

- `modulePath` - Path to module file
- `updates` - Object containing providers, controllers, imports, exports

```typescript
interface ModuleUpdates {
  providers?: string[];
  controllers?: string[];
  imports?: string[];
  exports?: string[];
}
```

**Example:**

```typescript
const updater = new NestModuleUpdater();

await updater.update('src/features/user/user.module.ts', {
  providers: ['UserTgService', 'UserService'],
  controllers: ['UserTgController', 'UserController'],
  exports: ['UserService'],
});
```

**Behavior:**

- Preserves existing providers/controllers
- Adds new ones without duplicates
- Maintains module structure
- Formats generated code

---

## DataProviderEndpointGenerator

Updates React Admin data provider with endpoint mappings.

### Constructor

```typescript
new DataProviderEndpointGenerator();
```

### Methods

#### `update(resources: Array<{ name: string; endpoint: string }>): Promise<void>`

Updates the data provider endpoint map.

**Parameters:**

- `resources` - Array of resource names and endpoint paths

**Example:**

```typescript
const generator = new DataProviderEndpointGenerator();

await generator.update([
  { name: 'users', endpoint: 'tg-api/users' },
  { name: 'posts', endpoint: 'tg-api/posts' },
  { name: 'comments', endpoint: 'tg-api/comments' },
]);
```

**Generated Section:**

```typescript
const endpointMap: Record<string, string> = {
  // Manual mappings preserved
  'feature-flags': 'admin/feature-flags',

  // AUTO-GENERATED MAPPINGS START
  users: 'tg-api/users',
  posts: 'tg-api/posts',
  comments: 'tg-api/comments',
  // AUTO-GENERATED MAPPINGS END
};
```

---

## Naming Utilities

Internal utilities for consistent naming transformations.

### `toKebabCase(str: string): string`

Converts PascalCase to kebab-case.

```typescript
toKebabCase('User'); // 'user'
toKebabCase('BlogPost'); // 'blog-post'
toKebabCase('CustomFieldType'); // 'custom-field-type'
```

### `pluralize(str: string): string`

Simple English pluralization.

```typescript
pluralize('user'); // 'users'
pluralize('post'); // 'posts'
pluralize('category'); // 'categories'
pluralize('person'); // 'people'
```

### `getApiEndpoint(modelName: string): string`

Returns the API endpoint path.

```typescript
getApiEndpoint('User'); // 'tg-api/users'
getApiEndpoint('BlogPost'); // 'tg-api/blog-posts'
getApiEndpoint('CustomFieldType'); // 'tg-api/custom-field-types'
```

### `getResourceName(modelName: string): string`

Returns the frontend resource name.

```typescript
getResourceName('User'); // 'users'
getResourceName('BlogPost'); // 'blog-posts'
getResourceName('CustomFieldType'); // 'custom-field-types'
```

---

## Formatting Utilities

### `formatGeneratedFile(filePath: string): Promise<void>`

Formats a single file using Prettier.

```typescript
await formatGeneratedFile('src/features/user/user.tg.service.ts');
```

### `formatGeneratedFiles(filePaths: string[]): Promise<void>`

Formats multiple files in parallel.

```typescript
await formatGeneratedFiles([
  'src/features/user/user.tg.service.ts',
  'src/features/user/user.tg.controller.ts',
  'src/features/user/create-user.tg.dto.ts',
]);
```

---

## User Prompt Utilities

### `promptUser(question: string, options?: PromptUserOptions): Promise<boolean>`

Prompts the user for a yes/no confirmation. When `options.autoConfirm` is enabled, the prompt resolves immediately without waiting for input—perfect for CI pipelines.

```typescript
const shouldCreate = await promptUser('Create module directory for User? (y/n): ', {
  autoConfirm: config.nonInteractive,
  defaultValue: true,
});

if (shouldCreate) {
  await createModuleDirectory('user');
}
```

```typescript
interface PromptUserOptions {
  autoConfirm?: boolean;
  defaultValue?: boolean;
}
```

### `promptYesNo(question: string): Promise<boolean>`

Prompts for yes/no answer.

```typescript
const shouldCreate = await promptYesNo('Create module directory?');
if (shouldCreate) {
  await createModuleDirectory('user');
}
```

---

## File System Utilities

### `ensureDirectoryExists(dirPath: string): Promise<void>`

Creates directory if it doesn't exist.

```typescript
await ensureDirectoryExists('src/features/user');
```

### `writeGeneratedFile(filePath: string, content: string): Promise<void>`

Writes file and formats it.

```typescript
await writeGeneratedFile('src/features/user/user.tg.service.ts', serviceContent);
```

### `readFile(filePath: string): Promise<string>`

Reads file content.

```typescript
const content = await readFile('src/app.module.ts');
```

---

## Best Practices

### 1. Use Updaters for Safe Modifications

Always use updater classes instead of direct file manipulation:

```typescript
// Good
const updater = new NestAppModuleUpdater();
await updater.update(modules);

// Bad - manual string manipulation
let content = fs.readFileSync('app.module.ts', 'utf-8');
content += `import { UserModule } from './features/user/user.module';\n`;
fs.writeFileSync('app.module.ts', content);
```

### 2. Format Generated Code

Always format generated files:

```typescript
const filePath = 'src/features/user/user.tg.service.ts';
fs.writeFileSync(filePath, content);
await formatGeneratedFile(filePath);
```

### 3. Handle Errors

```typescript
try {
  const resolver = new ModulePathResolver();
  const modulePath = await resolver.resolve('User');

  if (!modulePath) {
    console.warn('Module not found, creating...');
    await ensureDirectoryExists('src/features/user');
  }
} catch (error) {
  console.error('Resolution failed:', error);
}
```

### 4. Validate Paths

```typescript
const modulePath = await resolver.resolve('User');

if (!modulePath) {
  throw new Error('Module path could not be resolved');
}

if (!fs.existsSync(modulePath.path)) {
  throw new Error(`Module directory does not exist: ${modulePath.path}`);
}
```

---

## Next Steps

- **[Generators API](./generators.md)** – Generator classes
- **[Parsers API](./parsers.md)** – Schema parsing
- **[Configuration](./configuration.md)** – Configuration options
