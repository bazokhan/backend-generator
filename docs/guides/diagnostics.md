---
layout: default
title: System Diagnostics
parent: Guides
nav_order: 5
description: "Using tgraph doctor to validate your environment and troubleshoot issues"
---

# System Diagnostics with `tgraph doctor`

The `tgraph doctor` command is a comprehensive diagnostic tool that validates your development environment, configuration, and project setup before code generation. It helps catch issues early with actionable suggestions.

## Table of Contents

1. [Overview](#overview)
2. [When to Use](#when-to-use)
3. [Running Diagnostics](#running-diagnostics)
4. [Understanding Results](#understanding-results)
5. [Diagnostic Categories](#diagnostic-categories)
6. [Exit Codes](#exit-codes)
7. [Common Issues](#common-issues)
8. [CI/CD Integration](#cicd-integration)

---

## Overview

The `doctor` command performs comprehensive checks across four main categories:

1. **Configuration** - Validates config file and required fields
2. **Environment** - Checks Node.js version and Prisma CLI
3. **Prisma Schema** - Validates schema file and syntax
4. **Project Paths** - Checks directory structure

Each check produces results with three severity levels:

- ✓ **OK** - Check passed successfully
- ⚠️ **Warning** - Issue detected but not critical
- ❌ **Error** - Critical issue that must be fixed

---

## When to Use

### Recommended Use Cases

**1. First-Time Setup**

Run diagnostics after installing the package and before generating code:

```bash
npm install --save-dev @tgraph/backend-generator
tgraph init
tgraph doctor  # ← Validate before generation
tgraph all
```

**2. Troubleshooting**

When generation fails or produces unexpected results:

```bash
# Generation failed
tgraph all
# ❌ Error...

# Run diagnostics to identify the issue
tgraph doctor
```

**3. After Environment Changes**

When you've updated Node.js, Prisma, or moved the project:

```bash
# After updating Node.js
nvm use 18
tgraph doctor  # Verify compatibility

# After cloning repository on new machine
git clone <repo>
npm install
tgraph doctor  # Validate setup
```

**4. CI/CD Validation**

Add to your CI pipeline to catch issues before deployment:

```yaml
# .github/workflows/validate.yml
- name: Validate TGraph setup
  run: npx tgraph doctor
```

---

## Running Diagnostics

### Basic Usage

```bash
tgraph doctor
```

The command runs all diagnostic checks and displays grouped results.

### Working Without Config

The `doctor` command can run even if you haven't created a configuration file yet. It will report the missing config as an error:

```bash
# Fresh project without config
tgraph doctor

# Output will show:
# ❌ Configuration
#   ❌ No configuration file found
#      💡 Run 'tgraph init' to create a configuration file
```

This allows you to validate your environment (Node.js, Prisma) before setting up TGraph.

---

## Understanding Results

### Success Output

When all checks pass:

```
🔍 Running system diagnostics...

✓ Configuration
  ✓ Config file found: tgraph.config.ts
  ✓ Schema path configured: prisma/schema.prisma
  ✓ Dashboard path configured: src/dashboard/src
  ✓ DTOs path configured: src/dtos/generated
  ✓ Suffix configured: "Tg"

✓ Environment
  ✓ Node version: 18.19.0 (>= 18.0.0 required)
  ✓ Prisma CLI installed

✓ Prisma Schema
  ✓ Schema file exists
  ✓ Schema is valid

✓ Project Paths
  ✓ Dashboard directory exists: src/dashboard/src
  ✓ DTOs directory exists: src/dtos/generated
  ✓ Source directory exists: src/

✅ All checks passed!
💡 Run 'tgraph all' to start generating
```

### Warning Output

When warnings are present but no errors:

```
🔍 Running system diagnostics...

✓ Configuration
  ✓ Config file found: tgraph.config.ts
  ⚠️ Suffix 'myCustom' is not PascalCase
     💡 Use PascalCase format (e.g., 'Tg', 'Admin', 'Public')

✓ Environment
  ✓ Node version: 18.19.0 (>= 18.0.0 required)
  ✓ Prisma CLI installed

⚠️ Project Paths
  ⚠️ Dashboard directory does not exist: src/dashboard/src
     💡 Directory will be created during generation
  ✓ DTOs directory exists: src/dtos/generated

✅ All critical checks passed! (2 warnings)
💡 Run 'tgraph all' to start generating
```

Warnings don't block generation - they're informational or will be handled automatically.

### Error Output

When errors are detected:

```
🔍 Running system diagnostics...

❌ Configuration
  ❌ No configuration file found
     💡 Run 'tgraph init' to create a configuration file

✓ Environment
  ❌ Node version v16.14.0 is below required 18.0.0
     💡 Upgrade Node.js to version 18.0.0 or higher

❌ Prisma Schema
  ❌ Schema file not found: prisma/schema.prisma
     💡 Run 'npx prisma init' to create a schema

❌ Diagnostics failed! Please fix the errors above before running generation.
💡 Run 'tgraph doctor' again after making changes to verify the fixes.
```

Each error includes a suggestion (💡) for how to resolve it.

---

## Diagnostic Categories

### 1. Configuration

Validates your `tgraph.config.ts` or `tgraph.config.js` file.

**Checks:**

- ✓ Config file exists
- ✓ Required fields present (`schemaPath`, `dashboardPath`, `dtosPath`, `suffix`)
- ✓ Field values are valid
- ⚠️ Suffix follows PascalCase convention

**Common Issues:**

```typescript
// ❌ Missing required field
export const config = {
  schemaPath: 'prisma/schema.prisma',
  // Missing dashboardPath
};

// ✅ All required fields
export const config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Tg',
};
```

### 2. Environment

Checks your Node.js version and Prisma CLI installation.

**Checks:**

- ✓ Node.js version >= 18.0.0
- ✓ Prisma CLI is installed

**Common Issues:**

**Outdated Node.js:**

```bash
# Check your version
node --version
# v16.14.0

# Upgrade using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

**Missing Prisma CLI:**

```bash
# Install Prisma
npm install prisma --save-dev

# Verify installation
npx prisma --version
```

### 3. Prisma Schema

Validates your Prisma schema file.

**Checks:**

- ✓ Schema file exists at configured path
- ✓ Schema file has content (not empty)
- ✓ Schema syntax is valid (runs `prisma validate`)

**Common Issues:**

**Schema not found:**

```bash
# Create Prisma schema
npx prisma init

# Or check your config path
# tgraph.config.ts
export const config = {
  schemaPath: 'prisma/schema.prisma', // ← Verify this path
  // ...
};
```

**Invalid schema syntax:**

```bash
# Validate manually
npx prisma validate

# Fix syntax errors in schema.prisma
```

**Empty schema:**

```prisma
// ⚠️ Warning: Schema file is empty

// Add at least a generator and datasource
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Project Paths

Checks if configured directories exist.

**Checks:**

- ✓/⚠️ Dashboard directory exists
- ✓/⚠️ DTOs directory exists
- ✓/⚠️ Source directory (`src/`) exists

**Note:** Missing directories generate warnings, not errors. TGraph will create them during generation.

**Directory Structure:**

```
your-project/
├── src/                    # ← Should exist (NestJS project)
│   ├── dashboard/src/      # ← Will be created if missing
│   └── dtos/generated/     # ← Will be created if missing
├── prisma/
│   └── schema.prisma
└── tgraph.config.ts
```

---

## Exit Codes

The `doctor` command returns different exit codes based on results:

| Exit Code | Meaning | Description |
|-----------|---------|-------------|
| `0` | Success | All checks passed or only warnings present |
| `1` | Failure | One or more critical errors detected |

**Usage in Scripts:**

```bash
# Stop if diagnostics fail
if ! tgraph doctor; then
  echo "Fix errors before generating"
  exit 1
fi

tgraph all
```

---

## Common Issues

### "Config file not found"

**Problem:**

```
❌ No configuration file found
```

**Solution:**

```bash
tgraph init
```

Creates `tgraph.config.ts` with default values.

---

### "Schema file not found"

**Problem:**

```
❌ Schema file not found: prisma/schema.prisma
```

**Solutions:**

**1. Create schema:**

```bash
npx prisma init
```

**2. Update config path:**

```typescript
// tgraph.config.ts
export const config = {
  schemaPath: 'database/schema.prisma', // ← Custom path
  // ...
};
```

---

### "Node version is below required"

**Problem:**

```
❌ Node version v16.14.0 is below required 18.0.0
```

**Solution:**

```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Verify
node --version
# v18.19.0
```

---

### "Prisma CLI not found"

**Problem:**

```
❌ Prisma CLI not found
```

**Solution:**

```bash
# Install Prisma
npm install prisma --save-dev

# Or install globally
npm install -g prisma

# Verify
npx prisma --version
```

---

### "Schema validation failed"

**Problem:**

```
❌ Schema validation failed
```

**Solution:**

```bash
# Run Prisma validation for details
npx prisma validate

# Common issues:
# - Syntax errors (missing commas, braces)
# - Invalid field types
# - Incorrect relation syntax

# Fix errors in schema.prisma
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Validate TGraph Setup
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run diagnostics
        run: npx tgraph doctor
      
      - name: Generate code
        run: npx tgraph all
```

### GitLab CI

```yaml
validate:
  stage: validate
  image: node:18
  script:
    - npm ci
    - npx tgraph doctor
    - npx tgraph all
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
npx tgraph doctor || exit 1
```

---

## Best Practices

### 1. Run Before Generation

Always run diagnostics before generating code:

```bash
tgraph doctor && tgraph all
```

### 2. Add to CI Pipeline

Catch issues early by validating in CI:

```yaml
- run: npx tgraph doctor
- run: npx tgraph all
```

### 3. After Environment Changes

Run diagnostics after:
- Updating Node.js
- Updating Prisma
- Cloning to a new machine
- Switching branches with config changes

### 4. Document Project Setup

Include in your project README:

```markdown
## Setup

1. Install dependencies: `npm install`
2. Validate setup: `npx tgraph doctor`
3. Generate code: `npx tgraph all`
```

### 5. Fix Warnings

While warnings don't block generation, fix them when possible:
- Use PascalCase for `suffix`
- Create directories before generation (optional)
- Keep schema file non-empty

---

## Troubleshooting the Diagnostic Tool

### Doctor Command Fails to Run

**Problem:** `tgraph doctor` itself crashes or hangs.

**Solutions:**

1. **Update package:**

```bash
npm update @tgraph/backend-generator
```

2. **Clear npm cache:**

```bash
npm cache clean --force
npm install
```

3. **Check Node.js:**

```bash
node --version  # Should be 18.0.0 or higher
```

### False Positives

**Problem:** Diagnostic reports issues that don't actually exist.

**Solutions:**

1. **Verify manually:**

```bash
# Check if file actually exists
ls -la prisma/schema.prisma

# Verify Prisma works
npx prisma validate
```

2. **Check file permissions:**

```bash
# Ensure files are readable
chmod +r prisma/schema.prisma
chmod +r tgraph.config.ts
```

3. **Report bug:**

If diagnostics are incorrect, please [report an issue](https://github.com/trugraph/backend-generator/issues) with:
- Full diagnostic output
- Your config file
- Your environment (OS, Node version)

---

## Next Steps

- **[CLI Reference](../cli-reference.md)** - Complete CLI documentation
- **[Troubleshooting](../troubleshooting.md)** - Common issues and solutions
- **[Configuration](../api/configuration.md)** - Configuration options
- **[Getting Started](../getting-started.md)** - Initial setup guide

---

## Summary

The `tgraph doctor` command is your first line of defense when troubleshooting issues:

✅ **Use it to:**
- Validate setup before generation
- Troubleshoot generation failures
- Verify environment after changes
- Validate CI/CD configurations

✅ **It checks:**
- Configuration file validity
- Node.js version compatibility
- Prisma CLI installation
- Schema file and syntax
- Project directory structure

✅ **Each error includes:**
- Clear description of the issue
- Actionable suggestion (💡)
- Severity indicator (✓/⚠️/❌)

Run `tgraph doctor` early and often to catch issues before they cause problems!

