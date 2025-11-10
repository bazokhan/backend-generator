---
layout: default
title: Publishing
nav_order: 11
---

# Publishing Guide

Guide for publishing and maintaining `@tgraph/backend-generator` on npm.

## Prerequisites

- npm account (create at [npmjs.com](https://www.npmjs.com/signup))
- npm organization `@tgraph` (or your chosen org name)
- Write access to the organization
- Node.js 18+ installed
- Git repository set up

## Initial Setup

### 1. Create npm Organization

If `@tgraph` doesn't exist:

```bash
npm login
npm org create tgraph
```

Or use the npm website to create an organization.

### 2. Configure Package

Your `package.json` is already configured:

```json
{
  "name": "@tgraph/backend-generator",
  "version": "1.0.0",
  "description": "CLI toolkit for generating NestJS APIs, DTOs, and React Admin dashboards from Prisma schemas.",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "tgraph": "dist/cli.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "prepare": "npm run build",
    "test": "jest"
  },
  "license": "ISC"
}
```

### 3. Update Package Information

Add these fields to `package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/trugraph/backend-generator.git"
  },
  "bugs": {
    "url": "https://github.com/trugraph/backend-generator/issues"
  },
  "homepage": "https://github.com/trugraph/backend-generator#readme",
  "keywords": ["prisma", "nestjs", "react-admin", "code-generator", "crud", "typescript", "cli"],
  "author": "Your Name <your.email@example.com>",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## Pre-Publish Checklist

Complete this checklist before your first publish:

### Required Files

- [ ] **LICENSE file** - Create ISC license file in root
- [ ] **README.md** - Complete and up-to-date ✓
- [ ] **.gitignore** - Includes `*.tgz` and `package/`
- [ ] **.npmignore** (optional) - See below for recommended content

### Code Quality

- [ ] **Build succeeds** - Run `npm run build` without errors
- [ ] **Tests pass** - Run `npm test` with all tests passing
- [ ] **No TypeScript errors** - Run `npx tsc --noEmit`
- [ ] **Source maps disabled** - Set `sourceMap: false` in tsconfig.json

### Package Configuration

- [ ] **Version set** - Start with `0.0.1` or `1.0.0`
- [ ] **Author filled** - Add your name in package.json
- [ ] **Repository URLs** - GitHub URLs are correct
- [ ] **Keywords added** - For npm discoverability
- [ ] **Engines specified** - Node/npm version requirements
- [ ] **Files array** - Only includes `dist/`

### Testing

- [ ] **Pack locally** - Run `npm pack` and inspect contents
- [ ] **Extract and verify** - Check what files are included
- [ ] **Test installation** - Install packed version in test project
- [ ] **CLI works** - Run `tgraph --help` in test project
- [ ] **Imports work** - Test SDK imports in test project

### Repository

- [ ] **Git repository created** - On GitHub/GitLab
- [ ] **All changes committed** - Clean working directory
- [ ] **Tag created** - `git tag v0.0.1`
- [ ] **Pushed to remote** - `git push && git push --tags`

### npm Setup

- [ ] **npm account** - Created at npmjs.com
- [ ] **Logged in** - Run `npm login`
- [ ] **Organization created** - `@tgraph` org exists
- [ ] **Access verified** - Run `npm org ls tgraph`
- [ ] **Write permissions** - You're a member of @tgraph

### Recommended: .npmignore

Create `.npmignore` in root:

```
# Source files
*.ts
!*.d.ts
tsconfig.json
jest.config.mjs

# Tests
*.spec.ts
__mocks__/
__snapshots__/
coverage/

# Development
.github/
docs/
.prettierrc
.eslintrc

# Keep only README
*.md
!README.md

# Git
.git
.gitignore
```

This ensures only production files are published.

### Local Testing Process

1. **Build:**

   ```bash
   npm run build
   ```

2. **Pack:**

   ```bash
   npm pack
   # Creates @tgraph-backend-generator-0.0.1.tgz
   ```

3. **Extract and inspect:**

   ```bash
   tar -xzf @tgraph-backend-generator-0.0.1.tgz
   cd package
   ls -la
   # Verify only dist/ and README.md are present
   ```

4. **Test in another project:**

   ```bash
   cd ../test-project
   npm install ../backend-generator/@tgraph-backend-generator-0.0.1.tgz

   # Test CLI
   npx tgraph --help

   # Test SDK
   node -e "const { ApiGenerator } = require('@tgraph/backend-generator'); console.log('✓ Import works');"
   ```

5. **Clean up test artifacts:**
   ```bash
   rm @tgraph-backend-generator-0.0.1.tgz
   rm -rf package/
   ```

## Publishing Workflow

### First Time Publish

1. **Complete pre-publish checklist above** ✓

2. **Login to npm:**

```bash
npm login
```

2. **Verify configuration:**

```bash
npm whoami
npm org ls tgraph
```

3. **Test build:**

```bash
npm run build
npm test
```

4. **Test package locally:**

```bash
npm pack
# Creates @tgraph-backend-generator-1.0.0.tgz

# Install in test project
cd ../test-project
npm install ../backend-generator/@tgraph-backend-generator-1.0.0.tgz
tgraph --help
```

5. **Publish:**

```bash
npm publish --access public
```

Note: The first publish of a scoped package requires `--access public`.

### Subsequent Publishes

1. **Update version:**

```bash
npm version patch  # 1.0.0 → 1.0.1
# or
npm version minor  # 1.0.1 → 1.1.0
# or
npm version major  # 1.1.0 → 2.0.0
```

This automatically:

- Updates `package.json` version
- Creates a git commit
- Creates a git tag

2. **Build and test:**

```bash
npm run build
npm test
```

3. **Publish:**

```bash
npm publish
```

4. **Push to GitHub:**

```bash
git push && git push --tags
```

## Versioning Strategy

Follow [Semantic Versioning (SemVer)](https://semver.org/):

### MAJOR (x.0.0)

Breaking changes that require user action:

**Examples:**

- Changing configuration structure
- Removing exported functions
- Changing CLI command names
- Changing generated code structure significantly

```bash
npm version major
# 1.5.3 → 2.0.0
```

### MINOR (1.x.0)

New features, backward compatible:

**Examples:**

- Adding new field directives
- Adding new CLI options
- Adding new generators
- Enhancing existing features without breaking changes

```bash
npm version minor
# 1.5.3 → 1.6.0
```

### PATCH (1.0.x)

Bug fixes, backward compatible:

**Examples:**

- Fixing generation bugs
- Improving error messages
- Updating documentation
- Performance improvements

```bash
npm version patch
# 1.5.3 → 1.5.4
```

## Pre-release Versions

For testing before official release:

### Alpha

Very early, unstable:

```bash
npm version prerelease --preid=alpha
# 1.0.0 → 1.0.1-alpha.0

npm publish --tag alpha
```

Users install with:

```bash
npm install @tgraph/backend-generator@alpha
```

### Beta

Feature-complete, testing:

```bash
npm version prerelease --preid=beta
# 1.0.0 → 1.0.1-beta.0

npm publish --tag beta
```

### Release Candidate

Final testing before release:

```bash
npm version prerelease --preid=rc
# 1.0.0 → 1.0.1-rc.0

npm publish --tag rc
```

### Promote to Latest

When ready:

```bash
npm version patch  # Remove pre-release tag
npm publish  # Publishes as latest
```

## Release Checklist

Before each release:

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Git committed and tagged
- [ ] Tested in real project
- [ ] Breaking changes documented (if any)

## Maintaining CHANGELOG

Keep a `CHANGELOG.md` file:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- New features in development

### Changed

- Changes to existing functionality

### Fixed

- Bug fixes

## [1.1.0] - 2025-01-15

### Added

- Added @tg_currency directive for currency fields
- Added custom module path resolution

### Fixed

- Fixed module updater edge case with empty files
- Improved error messages for missing schemas

## [1.0.0] - 2025-01-01

### Added

- Initial release
- API generation for NestJS
- Dashboard generation for React Admin
- DTO generation
- Field directives (@tg_format, @tg_upload, @tg_readonly)
```

## GitHub Releases

Create GitHub releases to match npm versions. For detailed instructions, see **[GitHub Releases Guide](./github-releases.md)**.

**Quick method:**

```bash
# Manual
gh release create v1.1.0 --title "v1.1.0" --notes-file CHANGELOG.md --latest

# Automated (recommended)
npm run release:minor  # Bumps version, publishes, creates release
```

**Web interface:**

1. Go to GitHub repository
2. Click "Releases" → "Draft a new release"
3. Choose the version tag (e.g., `v1.1.0`)
4. Title: "Version 1.1.0"
5. Description: Copy from CHANGELOG.md
6. Publish release

## Automation

### GitHub Actions for Publishing

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci

      - run: npm test

      - run: npm run build

      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setup:

1. Create npm access token:
   - Go to npmjs.com → Account → Access Tokens
   - Generate new token (Automation)
   - Copy token

2. Add to GitHub secrets:
   - GitHub repo → Settings → Secrets
   - New secret: `NPM_TOKEN`
   - Paste token

3. Publish by pushing tags:

```bash
npm version minor
git push && git push --tags
# GitHub Actions automatically publishes
```

## Package Distribution Tags

Manage dist-tags:

```bash
# List tags
npm dist-tag ls @tgraph/backend-generator

# Add tag
npm dist-tag add @tgraph/backend-generator@1.5.0 legacy

# Remove tag
npm dist-tag rm @tgraph/backend-generator legacy
```

Common tags:

- `latest` (default)
- `next` (upcoming major version)
- `beta` (beta releases)
- `alpha` (alpha releases)
- `legacy` (old stable version)

## Deprecating Versions

Mark old versions as deprecated:

```bash
npm deprecate @tgraph/backend-generator@1.0.0 "This version has critical bugs. Please upgrade to 1.1.0+"
```

## Unpublishing

**Warning:** Only unpublish within 72 hours of publishing.

```bash
npm unpublish @tgraph/backend-generator@1.0.0
```

After 72 hours, only deprecation is allowed.

## Monitoring

### Download Statistics

View stats:

```bash
npm view @tgraph/backend-generator

# More detailed
npm info @tgraph/backend-generator
```

Or visit: https://www.npmjs.com/package/@tgraph/backend-generator

### Issues and Feedback

Monitor:

- npm package page comments
- GitHub issues
- GitHub discussions
- Twitter mentions (if applicable)

## Security

### Reporting Vulnerabilities

Set up security policy in `SECURITY.md`:

```markdown
# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities to: security@example.com

Do not open public issues for security vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |
```

### npm Audit

Run regularly:

```bash
npm audit

# Fix automatically
npm audit fix
```

## Best Practices

### 1. Test Before Publishing

Always test in a real project:

```bash
npm pack
cd ../test-project
npm install ../backend-generator/@tgraph-backend-generator-*.tgz
tgraph all
# Verify everything works
```

### 2. Keep Documentation in Sync

Before publishing:

- Update README.md
- Update docs/
- Update CHANGELOG.md
- Update version numbers in docs

### 3. Backward Compatibility

Maintain backward compatibility:

- Don't remove features without deprecation period
- Don't change default behavior in minor versions
- Provide migration guides for major versions

### 4. Clear Communication

When releasing:

- Write clear changelog entries
- Highlight breaking changes
- Provide upgrade guides
- Announce on relevant channels

### 5. Version Locking

Use exact versions in examples:

```bash
npm install @tgraph/backend-generator@1.2.3
```

Not:

```bash
npm install @tgraph/backend-generator@^1.2.3
```

## Troubleshooting

### Publish Fails: 403 Forbidden

**Cause:** No access to organization

**Solution:**

```bash
npm org ls tgraph
# Add yourself if missing
npm org add YOUR_USERNAME tgraph
```

### Publish Fails: Package Already Exists

**Cause:** Version already published

**Solution:**

```bash
npm version patch  # Bump version
npm publish
```

### Can't Unpublish

**Cause:** 72-hour window passed

**Solution:** Use deprecation instead:

```bash
npm deprecate @tgraph/backend-generator@1.0.0 "Deprecated message"
```

## Next Steps

- **[Contributing Guide](./contributing.md)** – Contribute to the project
- **[Architecture](./architecture/overview.md)** – Understand the system
- **[Troubleshooting](./troubleshooting.md)** – Common issues
