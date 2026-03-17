---
title: Contributing
---

# Contributing Guide

Thank you for considering contributing to TGraph Backend Generator!

## Getting Started

### Prerequisites

- Node.js 18.0.0 or newer
- npm 9.x or newer
- Git
- A code editor (VS Code recommended)

### Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**

```bash
git clone https://github.com/trugraph/backend-generator.git
cd backend-generator
```

3. **Install dependencies:**

```bash
npm install
```

4. **Build the project:**

```bash
npm run build
```

5. **Run tests:**

```bash
npm test
```

## Project Structure

```
backend-generator/
├── src/
│   ├── bin/                  # CLI entry points
│   ├── config/               # Default configuration exports
│   ├── generator/            # Code generators
│   │   ├── api/
│   │   │   ├── ApiGenerator.ts
│   │   │   └── __tests__/ApiGenerator.spec.ts
│   │   ├── dashboard/
│   │   │   ├── DashboardGenerator.ts
│   │   │   └── __tests__/DashboardGenerator.spec.ts
│   │   └── dto/
│   │       ├── DtoGenerator.ts
│   │       └── __tests__/DtoGenerator.spec.ts
│   ├── io/                   # CLI + filesystem utilities
│   ├── parser/               # Schema parsers
│   └── types/                # Shared type declarations
├── __mocks__/                # Test mocks
├── __snapshots__/            # Jest snapshots
├── coverage/                 # Coverage reports
├── dist/                     # Build output
├── docs/                     # Documentation
├── jest.config.mjs
├── package.json
└── tsconfig.json
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:

- `feature/` – New features
- `fix/` – Bug fixes
- `docs/` – Documentation changes
- `refactor/` – Code refactoring
- `test/` – Test additions or fixes

### 2. Make Changes

Follow the coding standards (see below).

### 3. Write Tests

All new features and bug fixes should include tests:

```typescript
// example.spec.ts
describe('MyFeature', () => {
  it('should do something', () => {
    const result = myFeature();
    expect(result).toBe(expected);
  });
});
```

Run tests:

```bash
npm test
```

> **Tip:** End-to-end smoke tests for the CLI live in `src/io/cli/__tests__/CommandLineInterface.e2e.spec.ts`.  
> They require Node 18 or newer (matching the engines in `package.json`) and spin up temporary workspaces under `__tmp__/`. Run them explicitly with:
>
> ```bash
> npx jest src/io/cli/__tests__/CommandLineInterface.e2e.spec.ts
> ```

Update snapshots if needed:

```bash
npm test -- --updateSnapshot
```

### 4. Build and Test

```bash
npm run build
npm test
```

### 5. Commit Your Changes

Use conventional commit messages:

```bash
git add .
git commit -m "feat: add new field directive for phone numbers"
# or
git commit -m "fix: resolve module path resolution issue"
# or
git commit -m "docs: update field directives guide"
```

Commit message format:

- `feat:` – New feature
- `fix:` – Bug fix
- `docs:` – Documentation changes
- `style:` – Code style changes (formatting, etc.)
- `refactor:` – Code refactoring
- `test:` – Test additions or changes
- `chore:` – Build process or auxiliary tool changes

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide explicit types for function parameters and returns
- Avoid `any` type when possible
- Use interfaces for object shapes

**Good:**

```typescript
interface Config {
  schemaPath: string;
  suffix: string;
}

function generate(config: Config): Promise<void> {
  // Implementation
}
```

**Bad:**

```typescript
function generate(config: any) {
  // Implementation
}
```

### Naming Conventions

- **Classes:** PascalCase (`ApiGenerator`)
- **Functions:** camelCase (`generateService`)
- **Variables:** camelCase (`modelName`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_SUFFIX`)
- **Interfaces:** PascalCase with `I` prefix for generic interfaces (`IGenerator`)

### File Organization

- One class per file
- File name matches class name
- Group related files in directories
- Include tests next to source files

```
src/generator/
├── nest-service-generator/
│   ├── NestServiceGenerator.ts
│   ├── NestServiceGenerator.spec.ts
│   ├── config.ts
│   └── __snapshots__/
```

### Comments and Documentation

- Add JSDoc comments to public APIs
- Use inline comments sparingly (code should be self-documenting)
- Document complex algorithms
- Explain "why" not "what"

**Good:**

```typescript
/**
 * Generates a NestJS service with CRUD operations.
 * Handles pagination, search, and unique constraint errors.
 *
 * @param model - The parsed Prisma model
 * @param config - Generation configuration
 * @returns Generated service code as string
 */
export function generateService(model: PrismaModel, config: Config): string {
  // Implementation
}
```

### Error Handling

- Use descriptive error messages
- Provide actionable guidance
- Include context in errors

**Good:**

```typescript
if (!fs.existsSync(schemaPath)) {
  throw new Error(
    `Schema file not found: ${schemaPath}\n` + `Make sure your Prisma schema exists at the specified path.`,
  );
}
```

**Bad:**

```typescript
if (!fs.existsSync(schemaPath)) {
  throw new Error('File not found');
}
```

## Testing

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = component.method(input);

      // Assert
      expect(result).toBe(expected);
    });

    it('should handle edge case', () => {
      // Test edge case
    });
  });
});
```

### Snapshot Testing

Use snapshots for generated code:

```typescript
it('should generate correct service code', () => {
  const code = generateService(testModel, testConfig);
  expect(code).toMatchSnapshot();
});
```

Update snapshots when intentionally changing output:

```bash
npm test -- --updateSnapshot
```

### Test Coverage

Aim for high test coverage:

- New features should have tests
- Bug fixes should include regression tests
- Critical paths should have comprehensive tests

Check coverage:

```bash
npm test -- --coverage
```

## Adding New Features

### 1. New Field Directive

To add a new field directive (e.g., `@tg_currency`):

1. Create directive class:

```typescript
// src/directives/field/directives/TgCurrencyDirective.ts
import { BaseFieldDirective } from '../BaseFieldDirective';
import { PrismaField } from '@tg-scripts/types';

export class TgCurrencyDirective extends BaseFieldDirective {
  readonly name = 'tg_currency';
  readonly pattern = /@tg_currency\(([^)]+)\)/;

  applyMatch(field: PrismaField, match: RegExpMatchArray): void {
    field.tgCurrency = match[1] as 'USD' | 'EUR' | 'GBP';
  }

  serialize(field: PrismaField): Record<string, unknown> | undefined {
    if (field.tgCurrency) {
      return { tgCurrency: field.tgCurrency };
    }
    return undefined;
  }
}
```

2. Register in manager:

```typescript
// src/directives/field/FieldDirectiveManager.ts
import { TgCurrencyDirective } from './directives/TgCurrencyDirective';

export class FieldDirectiveManager {
  private static directives = [
    new TgFormatDirective(),
    new TgUploadDirective(),
    new TgReadOnlyDirective(),
    new TgCurrencyDirective(), // Add here
  ];
}
```

3. Add to types:

```typescript
// types.d.ts
export interface PrismaField {
  // ... existing fields
  tgCurrency?: 'USD' | 'EUR' | 'GBP';
}
```

4. Update generators to use the directive

5. Write tests

6. Update documentation

### 2. New Generator

To add a new generator:

1. Create generator class:

```typescript
// src/generator/my-generator/MyGenerator.ts
import { IGenerator, Config } from '@tg-scripts/types';

export class MyGenerator implements IGenerator {
  constructor(private config: Config) {}

  async generate(): Promise<void> {
    // Implementation
  }
}
```

2. Export in index.ts:

```typescript
export { MyGenerator } from './src/generator/my-generator/MyGenerator';
```

3. Add CLI command (if applicable)

4. Write tests

5. Update documentation

## Documentation

### When to Update Documentation

Update documentation when:

- Adding new features
- Changing existing behavior
- Fixing bugs that affect usage
- Adding new directives or generators

### Documentation Structure

- `docs/index.md` – Overview and navigation
- `docs/getting-started.md` – Installation and first use
- `docs/guides/` – In-depth guides
- `docs/recipes/` – Practical examples
- `docs/api/` – API reference
- `docs/architecture/` – System design

### Writing Good Documentation

- Start with the user's goal
- Provide complete examples
- Explain edge cases
- Include troubleshooting
- Use clear, concise language

## Pull Request Process

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Commit messages follow convention

### Pull Request Template

```markdown
## Description

Brief description of the changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How was this tested?

## Checklist

- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Maintainers review your PR
2. Address feedback if any
3. Once approved, maintainer merges
4. Your contribution is released!

## Release Process

Releases follow semantic versioning:

- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy toward others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## Getting Help

- **Documentation:** Check the docs first
- **Issues:** Search existing issues on GitHub
- **Discussions:** Start a discussion for questions
- **Email:** Contact maintainers directly for sensitive matters

## Recognition

Contributors are recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project README

Thank you for contributing! 🎉

## Next Steps

- **[Architecture Overview](./architecture/overview.md)** – Understand the system
- **[Philosophy](./architecture/philosophy.md)** – Learn the principles
- **[API Reference](./api/generators.md)** – Technical details
