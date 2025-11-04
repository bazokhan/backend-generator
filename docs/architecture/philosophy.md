# Philosophy & Principles

The design principles and philosophy behind TGraph Backend Generator.

## Core Philosophy

### Convention Over Configuration

TGraph Backend Generator embraces strong conventions to minimize configuration:

- Models in `src/features/` or `src/infrastructure/`
- Generated files use `.tg.` suffix
- REST endpoints follow `tg-api/{resource}` pattern
- Dashboard resources match API endpoints

**Benefit:** Zero-config generation for standard projects.

**Escape Hatch:** Full customization available when needed.

### Generate, Don't Replace

Generated code coexists with custom code:

```
src/features/user/
├── user.tg.service.ts      # Generated
├── user.service.ts          # Your custom code
├── user.tg.controller.ts    # Generated
└── user.controller.ts       # Your custom code
```

**Benefit:** Regenerate safely without losing customizations.

### Progressive Disclosure

Start simple, add complexity as needed:

1. **Level 1:** Basic schema → Full CRUD
2. **Level 2:** Add field directives for fine control
3. **Level 3:** Extend generated classes
4. **Level 4:** Use SDK for custom workflows

**Benefit:** Gentle learning curve, powerful when needed.

### Type Safety First

End-to-end TypeScript types from database to frontend:

```
Prisma Schema
    ↓
TypeScript DTOs
    ↓
NestJS API
    ↓
React Admin
```

**Benefit:** Catch errors at compile time, not runtime.

## Design Principles

### 1. Separation of Concerns

Each component has a single, well-defined responsibility:

- **Parsers** extract data
- **Generators** create code
- **Updaters** modify files
- **Directives** control behavior

**Anti-pattern:** Mixing parsing and generation logic.

### 2. Idempotency

Running generation multiple times produces the same result:

```bash
tgraph all  # First run
tgraph all  # Same output
tgraph all  # Still same
```

**Implementation:**

- Auto-generated sections are clearly marked
- Manual code is preserved
- File writes are atomic

### 3. Least Surprise

Generated code follows familiar patterns:

- NestJS best practices
- React Admin conventions
- Standard TypeScript patterns
- Common REST API design

**Benefit:** Generated code is immediately understandable.

### 4. Fail Fast, Fail Clearly

Errors are caught early with clear messages:

```
❌ Schema file not found: prisma/schema.prisma
💡 Make sure your schema exists at the specified path

❌ No module found for User
💡 Create module directory: src/features/user
```

**Implementation:**

- Validate inputs before generation
- Provide actionable error messages
- Suggest solutions

### 5. Composability

Components can be used independently:

```typescript
// Use parser alone
const parser = new PrismaSchemaParser();
const parsed = parser.parse();

// Use specific generator
const dtoGen = new DtoGenerator(config);
dtoGen.generate();

// Combine as needed
const custom = new CustomWorkflow(parser, dtoGen);
```

**Benefit:** Build custom pipelines easily.

## Technical Principles

### 1. Immutability

Parsed data structures are immutable after creation:

```typescript
interface PrismaField {
  readonly name: string;
  readonly type: string;
  // ...
}
```

**Benefit:** Predictable behavior, easier debugging.

### 2. Pure Functions

Generators use pure functions where possible:

```typescript
function generateDto(model: PrismaModel): string {
  // No side effects
  // Same input → same output
  return dtoCode;
}
```

**Benefit:** Testable, composable, predictable.

### 3. Single Source of Truth

Prisma schema is the single source of truth:

```
Prisma Schema (Source of Truth)
    ├─> Backend DTOs
    ├─> Services
    ├─> Controllers
    └─> Dashboard Components
```

**Benefit:** One place to update, everything stays in sync.

### 4. Graceful Degradation

System works even with partial data:

- Missing label hint → Use heuristic
- No custom validation → Use basic validation
- Module not found → Prompt to create

**Benefit:** Flexible, user-friendly.

## Code Generation Philosophy

### Why Code Generation?

**Benefits:**

- **Consistency** – All endpoints follow same patterns
- **Speed** – Generate in seconds vs. hours of manual work
- **Maintenance** – Update schema, regenerate everything
- **Type Safety** – Compiler catches breaking changes
- **Best Practices** – Generated code follows standards

**Trade-offs:**

- Learning curve for schema directives
- Less flexibility than manual code (mitigated by extension)
- Requires discipline to avoid editing generated files

### When NOT to Use Generation

Code generation is NOT appropriate for:

- Highly custom, one-off endpoints
- Complex business logic
- Performance-critical code paths
- Experimental features

**Solution:** Coexist generated and custom code.

### Generated vs. Custom Code

**Generated Code Is:**

- Predictable
- Consistent
- Safe to regenerate
- Follows conventions

**Custom Code Is:**

- Business-specific
- Flexible
- Preserved across regeneration
- Your competitive advantage

## Quality Principles

### 1. Clean Code

Generated code is readable and well-formatted:

```typescript
// Good - generated code
export class CreateUserTgDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// Not generated - unclear, inconsistent
export class Dto {
  constructor(
    public n,
    public e,
  ) {}
}
```

### 2. Minimal Dependencies

Only essential dependencies:

- `class-validator` for validation
- `@nestjs/common` for decorators
- `react-admin` for components

**Benefit:** Smaller bundle, fewer conflicts.

### 3. Standard Patterns

Use standard patterns everyone knows:

- REST for APIs
- DTO pattern for validation
- Service pattern for business logic
- Component pattern for UI

**Benefit:** Onboarding is easier.

### 4. Documentation as Code

Generated files include inline documentation:

```typescript
/**
 * Auto-generated DTO for creating User records.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * To customize, extend this class in a separate file.
 */
export class CreateUserTgDto {
  // ...
}
```

## User Experience Principles

### 1. Fast Feedback

Show progress and results immediately:

```
🚀 Generating API files...
✅ UserTgController created
✅ UserTgService created
✅ DTOs created
✅ Module updated
✅ AppModule updated
✨ Done!
```

### 2. Helpful Errors

Errors guide users to solutions:

```
❌ Failed to generate User API
💡 No module found at src/features/user
📝 Run: mkdir -p src/features/user
   Or answer 'y' when prompted to create it
```

### 3. Safe Defaults

Defaults work for 80% of cases:

- `isAdmin: true` – Most CRUD is admin-only
- `updateDataProvider: true` – Keep dashboard in sync
- `suffix: 'Tg'` – Clear, short suffix

**Escape Hatch:** All defaults are configurable.

### 4. Progressive Enhancement

Start simple, add features incrementally:

```prisma
// Start: Basic model
model User {
  id   String @id
  name String
}

// Add: Validation
model User {
  id   String @id
  name String  // @min(2) @max(50)
}

// Add: Directives
model User {
  id   String @id
  name String  // @min(2) @max(50)
  /// @tg_format(email)
  email String
}
```

## Future-Proof Principles

### 1. Extensibility

Easy to add new features:

- New directives
- New generators
- New output formats

### 2. Backward Compatibility

Changes don't break existing code:

- Sentinel comments preserve manual code
- Configuration is versioned
- Deprecations are clearly communicated

### 3. Open for Extension

Users can extend without forking:

```typescript
class CustomGenerator extends ApiGenerator {
  // Add your own logic
}
```

## Community Principles

### 1. Open Source Friendly

- Clear contribution guidelines
- Well-documented codebase
- Welcoming to contributors

### 2. User-Centric

Features driven by real user needs:

- Listen to feedback
- Prioritize common use cases
- Make the hard things easy

### 3. Sustainable

Built for long-term maintenance:

- Comprehensive tests
- Clear architecture
- Minimal complexity

## Next Steps

- **[Architecture Overview](./overview.md)** – System design
- **[Contributing](../contributing.md)** – Join the project
- **[SDK Reference](../sdk-reference.md)** – Build extensions
