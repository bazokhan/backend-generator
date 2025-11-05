---
layout: default
title: Troubleshooting
nav_order: 12
---

# Troubleshooting

Common issues and solutions when using TGraph Backend Generator.

## Quick Diagnostics

### Running System Diagnostics

**The first step when encountering any issue is to run the diagnostics command:**

```bash
tgraph doctor
```

This command checks:

- ✓ Configuration file validity
- ✓ Node.js version compatibility
- ✓ Prisma CLI installation
- ✓ Schema file existence and validity
- ✓ Project directory structure

**Example output:**

```
🔍 Running system diagnostics...

✓ Configuration
  ✓ Config file found: tgraph.config.ts
  ✓ Schema path configured: prisma/schema.prisma

✓ Environment
  ✓ Node version: 18.19.0 (>= 18.0.0 required)
  ✓ Prisma CLI installed

✓ Prisma Schema
  ✓ Schema file exists
  ✓ Schema is valid

✅ All checks passed!
💡 Run 'tgraph all' to start generating
```

**If diagnostics show errors:**

1. Follow the suggestions (💡) shown in the output
2. Fix the identified issues
3. Run `tgraph doctor` again to verify
4. Proceed with generation once all critical checks pass

---

## Installation Issues

### Command Not Found: `tgraph`

**Problem:** After installation, `tgraph` command is not recognized.

**Solutions:**

**1. If installed locally (project dependency):**

Use npx:

```bash
npx tgraph all
```

Or add to `package.json` scripts:

```json
{
  "scripts": {
    "generate": "tgraph all"
  }
}
```

Then run:

```bash
npm run generate
```

**2. If installed globally:**

Ensure npm global bin is in your PATH:

```bash
# Check global bin location
npm config get prefix

# Add to PATH (Linux/Mac - add to ~/.bashrc or ~/.zshrc)
export PATH=$PATH:$(npm config get prefix)/bin

# Windows
# Add the path manually in System Environment Variables
```

**3. Reinstall:**

```bash
npm uninstall -g @tgraph/backend-generator
npm install -g @tgraph/backend-generator
```

---

### Permission Denied

**Problem:** `EACCES` error during installation.

**Solution (Linux/Mac):**

```bash
# Option 1: Use sudo (not recommended for global installs)
sudo npm install -g @tgraph/backend-generator

# Option 2: Change npm's default directory (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
# Add export to ~/.bashrc or ~/.zshrc

npm install -g @tgraph/backend-generator
```

**Solution (Windows):**

Run terminal as Administrator, then:

```bash
npm install -g @tgraph/backend-generator
```

---

## Schema Issues

### Schema File Not Found

**Problem:**

```
❌ Schema file not found: prisma/schema.prisma
```

**Solutions:**

**1. Verify path:**

```bash
ls prisma/schema.prisma
```

**2. Specify correct path:**

```bash
tgraph all --schema path/to/your/schema.prisma
```

**3. Create schema:**

```bash
mkdir prisma
npx prisma init
```

---

### Invalid Prisma Syntax

**Problem:** Generator fails with parsing error.

**Solution:**

1. **Validate schema:**

```bash
npx prisma validate
```

2. **Format schema:**

```bash
npx prisma format
```

3. **Check for:**
   - Missing commas
   - Invalid field types
   - Unclosed braces
   - Invalid directive syntax

---

### No Models Found

**Problem:** Generator completes but creates nothing.

**Solution:**

Ensure models are marked with `// @tg_form()`:

```prisma
// ❌ Wrong - missing directive
model User {
  id   String @id
  name String
}

// ✅ Correct
// @tg_form()
model User {
  id   String @id
  name String
}
```

---

## Module Issues

### Module Not Found

**Problem:**

```
⚠️ No module found for User
Do you want to create the module directory for User? (y/n):
```

**Solutions:**

**1. Answer 'y' to create automatically**

**2. Create manually:**

```bash
mkdir -p src/features/user
```

**3. Or in infrastructure:**

```bash
mkdir -p src/infrastructure/user
```

---

### Module Update Fails

**Problem:** Module file exists but update fails.

**Solutions:**

**1. Check file permissions:**

```bash
chmod u+w src/features/user/user.module.ts
```

**2. Ensure valid TypeScript:**

Module file must be valid TypeScript. Check for syntax errors:

```bash
npx tsc --noEmit
```

**3. Backup and regenerate:**

```bash
cp src/features/user/user.module.ts src/features/user/user.module.ts.backup
# Fix issues, then regenerate
tgraph api
```

---

## Generation Issues

### TypeScript Errors After Generation

**Problem:** Generated code has TypeScript compilation errors.

**Solutions:**

**1. Install dependencies:**

```bash
npm install
npm install --save-dev @types/node
```

**2. Check tsconfig.json:**

Ensure these settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**3. Verify imports:**

Check that all imported types are available:

```bash
npm install class-validator class-transformer
npm install @nestjs/common @nestjs/core
```

---

### Generated Files Have Wrong Path

**Problem:** Files generated in unexpected locations.

**Solution:**

Check your configuration:

```typescript
// tgraph.config.ts
export const config = {
  schemaPath: 'prisma/schema.prisma', // ← Verify this
  dashboardPath: 'src/dashboard/src', // ← And this
  dtosPath: 'src/dtos/generated', // ← And this
  // ...
};
```

Override with CLI:

```bash
tgraph api --dtos src/features/user
```

---

### Formatting Fails

**Problem:** Generated code is not formatted.

**Solutions:**

**1. Install Prettier:**

```bash
npm install --save-dev prettier
```

**2. Create Prettier config:**

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**3. Format manually:**

```bash
npx prettier --write "src/**/*.ts"
```

---

## Dashboard Issues

### React Admin Components Don't Render

**Problem:** Dashboard pages are blank or error.

**Solutions:**

**1. Check imports:**

Verify imports in `App.tsx`:

```typescript
import { UserList, UserEdit, UserCreate, UserShow } from './resources/users';
```

**2. Verify resource registration:**

```typescript
<Resource
  name="users"
  list={UserList}
  edit={UserEdit}
  create={UserCreate}
  show={UserShow}
/>
```

**3. Check data provider:**

Ensure endpoint mapping exists:

```typescript
const endpointMap = {
  users: 'tg-api/users', // ← Must exist
};
```

---

### Field Directives Not Working

**Problem:** Upload or readonly directives ignored.

**Solutions:**

**1. Regenerate dashboard:**

```bash
tgraph dashboard
```

**2. Check fieldDirectives.generated.ts:**

```typescript
// Should contain your directives
export const fieldDirectives = {
  users: {
    avatar: { tgUpload: 'image' },
    ipAddress: { tgReadOnly: true },
  },
};
```

**3. Verify directive syntax:**

```prisma
// ❌ Wrong - double slash
// @tg_upload(image)
avatar String?

// ✅ Correct - triple slash
/// @tg_upload(image)
avatar String?
```

---

### Upload Not Working

**Problem:** File upload fails or sends File object to API.

**Solutions:**

**1. Verify upload endpoint exists:**

```typescript
// Must implement POST /upload
@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/${file.filename}` };
  }
}
```

**2. Check field directive:**

```prisma
/// @tg_upload(image)
avatar String?
```

**3. Regenerate:**

```bash
tgraph dashboard
```

---

## API Issues

### 404 on Generated Endpoints

**Problem:** API returns 404 for `/tg-api/users`.

**Solutions:**

**1. Check server is running:**

```bash
npm run start:dev
```

**2. Verify controller:**

```typescript
// Check this exists
@Controller('tg-api/users') // ← Must match request path
export class UserTgController {}
```

**3. Check AppModule:**

Ensure module is imported:

```typescript
@Module({
  imports: [
    // AUTO-GENERATED IMPORTS START
    UserModule, // ← Must be here
    // AUTO-GENERATED IMPORTS END
  ],
})
export class AppModule {}
```

**4. Restart server:**

```bash
# Stop and restart
npm run start:dev
```

---

### Authentication Fails

**Problem:** All requests return 401 Unauthorized.

**Solutions:**

**1. Check guards:**

Generated controllers require authentication:

```typescript
@Controller('tg-api/users')
@UseGuards(JwtAuthGuard, AdminGuard) // ← These must be implemented
export class UserTgController {}
```

**2. Implement guards:**

You must provide:

- `JwtAuthGuard` - JWT authentication
- `AdminGuard` - Admin role check

**3. Or generate without admin:**

```bash
tgraph api --no-admin
```

---

### Validation Errors

**Problem:** API rejects valid data.

**Solutions:**

**1. Check DTO validation:**

```typescript
// Generated DTO
export class CreateUserTgDto {
  @IsString()
  @IsNotEmpty() // ← Might be too strict
  name: string;
}
```

**2. Adjust validation in schema:**

```prisma
model User {
  name String  // Remove inline validation if too strict
}
```

**3. Test with minimal data:**

```bash
curl -X POST http://localhost:3000/tg-api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'  # Minimal payload
```

---

## CLI Issues

### Options Not Working

**Problem:** CLI flags are ignored.

**Solutions:**

**1. Check flag syntax:**

```bash
# ✅ Correct
tgraph api --suffix Admin

# ❌ Wrong
tgraph --suffix Admin api
```

Flags must come AFTER the command.

**2. Use equals syntax:**

```bash
tgraph api --suffix=Admin
```

**3. Check config file:**

CLI flags override config, but config must be valid:

```typescript
// tgraph.config.ts - must export 'config'
export const config: Config = {
  /* ... */
};
```

---

### Generation Hangs

**Problem:** Generator runs indefinitely without completing.

**Solutions:**

**1. Check for prompts:**

Look for user input prompts:

```
Do you want to create the module directory for User? (y/n):
```

Answer the prompt or create directory beforehand.

**2. Kill and restart:**

```bash
# Ctrl+C to kill
# Then run again
tgraph all
```

**3. Check for infinite loops:**

If it truly hangs, it's a bug. Report with:

- Your schema
- Command used
- Console output

---

## Performance Issues

### Generation is Slow

**Problem:** Generation takes very long time.

**Solutions:**

**1. Reduce model count:**

Only mark necessary models with `@tg_form()`.

**2. Check file system:**

Slow disk I/O can cause delays. Check available space:

```bash
df -h  # Linux/Mac
```

**3. Skip data provider updates:**

```bash
tgraph api --no-update-data-provider
```

---

## Diagnostic Command Reference

The `tgraph doctor` command is your first line of defense when troubleshooting. It performs comprehensive checks and provides actionable suggestions for common issues.

**When to use:**

- Before running generators for the first time
- When generation fails unexpectedly
- After updating Node.js, Prisma, or dependencies
- When setting up CI/CD pipelines
- When moving the project to a new machine

**What it doesn't check:**

- Database connectivity (use `npx prisma db pull` for that)
- NestJS application runtime errors
- React Admin dashboard runtime errors
- Authentication/authorization setup

For these issues, refer to the specific troubleshooting sections below.

---

## Getting More Help

### Check Documentation

- [Getting Started](./getting-started.md)
- [Guides](./guides/prisma-setup.md)
- [Recipes](./recipes/basic-crud.md)
- [API Reference](./api/generators.md)

### Search Issues

Check if someone else had the same problem:

- GitHub Issues: https://github.com/trugraph/backend-generator/issues
- Search closed issues too

### Ask for Help

If you can't find a solution:

1. **GitHub Discussions:** Best for questions
2. **GitHub Issues:** For bugs and features
3. **Email:** For sensitive matters

When asking, include:

- Exact error message
- Your Prisma schema (relevant parts)
- Command you ran
- Node/npm versions
- Operating system

### Report Bugs

When reporting bugs, include:

````markdown
**Description:**
Brief description of the bug

**To Reproduce:**

1. Step 1
2. Step 2
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**

- OS: [e.g., macOS 13.0]
- Node: [e.g., 18.0.0]
- npm: [e.g., 9.0.0]
- Package version: [e.g., 1.2.3]

**Schema:**

```prisma
// Relevant parts of your schema
```
````

**Command:**

```bash
tgraph all
```

**Error Output:**

```
[Paste full error here]
```

```

---

## Next Steps

- **[Getting Started](./getting-started.md)** – Start from scratch
- **[Contributing](./contributing.md)** – Help improve the tool
- **[GitHub Issues](https://github.com/trugraph/backend-generator/issues)** – Report bugs

```
