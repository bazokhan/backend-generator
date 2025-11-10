---
layout: default
title: GitHub Releases
nav_order: 12
---

# GitHub Releases Guide

Complete guide for creating and managing GitHub releases for `@tgraph/backend-generator`.

## What are GitHub Releases?

GitHub Releases are:

- **Official distribution points** for your project versions
- **Communication channel** for changelog and updates
- **Asset hosting** for binaries and artifacts (if needed)
- **Version history** visible to users and contributors
- **Semantic versioning** integrated with git tags

Releases complement npm publishing by providing a user-friendly interface for version history and changelogs.

## Prerequisites

### Required

- Git repository on GitHub
- Git installed locally
- Write access to the repository
- Version tags following SemVer (e.g., `v0.0.3`, `v1.2.0`)

### Optional (for automation)

- GitHub CLI (`gh`) installed
- GitHub personal access token (for CI/CD)

## Installation

### GitHub CLI

The GitHub CLI (`gh`) enables automated release creation from the command line.

**Windows:**

```bash
# Using winget
winget install --id GitHub.cli

# Or using Chocolatey
choco install gh

# Or using Scoop
scoop install gh
```

**macOS:**

```bash
brew install gh
```

**Linux:**

```bash
# Debian/Ubuntu
sudo apt install gh

# Fedora/RHEL
sudo dnf install gh

# Arch
sudo pacman -S github-cli
```

### Authentication

First-time setup:

```bash
gh auth login
```

Follow the prompts to authenticate via browser or token.

Verify authentication:

```bash
gh auth status
```

## Creating Releases

### Method 1: Manual via GitHub Web Interface

Best for: First-time releases or when you want full control.

1. **Navigate to releases:**
   - Go to: `https://github.com/trugraph/backend-generator/releases`
   - Click **"Create a new release"**

2. **Choose a tag:**
   - Click **"Choose a tag"** dropdown
   - If tag exists: Select it (e.g., `v0.0.3`)
   - If new: Type `v0.0.3` and click **"Create new tag: v0.0.3 on publish"**

3. **Fill release information:**
   - **Release title:** `v0.0.3` or `Release 0.0.3`
   - **Description:** Copy/paste from `CHANGELOG.md`
   - Optional: Upload assets (binaries, documentation)

4. **Release options:**
   - ☑️ **Set as the latest release** (for stable releases)
   - ☐ Set as a pre-release (for alpha/beta versions)
   - ☐ Create a discussion (optional)

5. **Publish:**
   - Click **"Publish release"**

### Method 2: GitHub CLI (gh)

Best for: Quick releases and automation.

#### Basic Release

```bash
# Create release from existing tag
gh release create v0.0.3 \
  --title "v0.0.3" \
  --notes "Bug fixes and improvements"

# Create release with changelog file
gh release create v0.0.3 \
  --title "v0.0.3" \
  --notes-file CHANGELOG.md

# Auto-generate notes from commits
gh release create v0.0.3 --generate-notes
```

#### Release with Options

```bash
# Mark as latest release
gh release create v0.0.3 \
  --title "v0.0.3" \
  --notes-file CHANGELOG.md \
  --latest

# Pre-release (alpha, beta, rc)
gh release create v1.0.0-beta.1 \
  --title "v1.0.0-beta.1" \
  --notes-file CHANGELOG.md \
  --prerelease

# Draft release (not published yet)
gh release create v0.0.3 \
  --title "v0.0.3" \
  --notes-file CHANGELOG.md \
  --draft

# With discussion
gh release create v0.0.3 \
  --title "v0.0.3" \
  --notes-file CHANGELOG.md \
  --discussion-category "General"
```

#### Upload Assets

```bash
# Release with binary/tarball
gh release create v0.0.3 \
  --title "v0.0.3" \
  --notes-file CHANGELOG.md \
  dist/tgraph-linux-x64.tar.gz \
  dist/tgraph-darwin-x64.tar.gz
```

### Method 3: Automated npm Scripts (Recommended)

Best for: Consistent, repeatable releases.

This project includes automated release scripts in `package.json`:

```json
{
  "scripts": {
    "release": "npm run build && npm test && node scripts/release.js",
    "release:patch": "npm version patch && npm run release",
    "release:minor": "npm version minor && npm run release",
    "release:major": "npm version major && npm run release"
  }
}
```

#### Release Workflow

**For current version (already bumped):**

```bash
# If you already updated package.json to 0.0.3
git add .
git commit -m "feat: dynamic configuration system"
npm run release
```

**For new patch release (0.0.3 → 0.0.4):**

```bash
npm run release:patch
```

This automatically:

1. ✅ Bumps version in `package.json`
2. ✅ Creates git commit
3. ✅ Runs build (`npm run build`)
4. ✅ Runs tests (`npm test`)
5. ✅ Creates git tag (e.g., `v0.0.4`)
6. ✅ Pushes tag to GitHub
7. ✅ Creates GitHub release with CHANGELOG

**For new minor release (0.0.3 → 0.1.0):**

```bash
npm run release:minor
```

**For new major release (0.0.3 → 1.0.0):**

```bash
npm run release:major
```

### The Release Script

The project includes `scripts/release.js`:

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const { version } = require('../package.json');

const tag = `v${version}`;

console.log(`🚀 Creating release ${tag}...\n`);

try {
  // Check if tag already exists
  try {
    execSync(`git rev-parse ${tag}`, { stdio: 'ignore' });
    console.error(`❌ Tag ${tag} already exists.`);
    process.exit(1);
  } catch {
    // Tag doesn't exist, continue
  }

  // Create annotated tag
  execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' });

  // Push tag
  execSync(`git push origin ${tag}`, { stdio: 'inherit' });

  // Create GitHub release
  execSync(`gh release create ${tag} --title "${tag}" --notes-file CHANGELOG.md --latest`, {
    stdio: 'inherit',
  });

  console.log(`\n✅ Release ${tag} created!`);
} catch (error) {
  console.error(`\n❌ Release failed:`, error.message);
  process.exit(1);
}
```

## Managing Releases

### List Releases

```bash
# List all releases
gh release list

# List with more details
gh release list --limit 10

# View specific release
gh release view v0.0.3
```

### Edit Releases

```bash
# Update release notes
gh release edit v0.0.3 --notes-file CHANGELOG.md

# Change title
gh release edit v0.0.3 --title "Version 0.0.3 - Bug Fixes"

# Mark as latest
gh release edit v0.0.3 --latest

# Mark as pre-release
gh release edit v1.0.0-beta.1 --prerelease
```

### Delete Releases

```bash
# Delete release (keeps tag)
gh release delete v0.0.3

# Delete release and tag
gh release delete v0.0.3 --yes --cleanup-tag

# Delete tag only
git tag -d v0.0.3
git push origin :refs/tags/v0.0.3
```

### Download Assets

```bash
# Download release assets
gh release download v0.0.3

# Download specific asset
gh release download v0.0.3 --pattern "*.tar.gz"

# Download to specific directory
gh release download v0.0.3 --dir ./downloads
```

## Release Workflow Best Practices

### 1. Maintain CHANGELOG.md

Keep a detailed changelog following [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2025-11-10

### ✨ Added
- Dynamic configuration system
- Enhanced validation with suggestions
- Build improvements with tsc-alias

### 🔄 Changed
- **Breaking**: Configuration structure now uses nested objects
- **Breaking**: API configuration flattened

### 🐛 Fixed
- Fixed TypeScript path alias resolution
- Fixed CLI exit codes

### 🔧 Technical
- Added type safety for configuration metadata
- Improved test coverage

## [0.0.2] - 2025-11-03

### ✨ Added
- Preflight command
- Diagnostics command
- Non-interactive mode

[0.0.3]: https://github.com/trugraph/backend-generator/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/trugraph/backend-generator/releases/tag/v0.0.2
```

### 2. Version Numbering

Follow [Semantic Versioning (SemVer)](https://semver.org/):

**Format:** `MAJOR.MINOR.PATCH`

- **MAJOR (1.0.0):** Breaking changes
- **MINOR (0.1.0):** New features, backward compatible
- **PATCH (0.0.1):** Bug fixes, backward compatible

**Pre-release versions:**

- `1.0.0-alpha.1` - Early, unstable
- `1.0.0-beta.1` - Feature-complete, testing
- `1.0.0-rc.1` - Release candidate

### 3. Release Checklist

Before creating a release:

- [ ] **All tests pass** - `npm test`
- [ ] **Build succeeds** - `npm run build`
- [ ] **CHANGELOG updated** - Document all changes
- [ ] **Documentation updated** - README, docs/
- [ ] **Version bumped** - package.json version
- [ ] **Changes committed** - Clean git status
- [ ] **Tested locally** - `npm pack` and test
- [ ] **Breaking changes documented** - Migration guide if needed

### 4. Git Tagging Strategy

Use annotated tags:

```bash
# Good: Annotated tag with message
git tag -a v0.0.3 -m "Release v0.0.3"

# Bad: Lightweight tag (no message)
git tag v0.0.3
```

Push tags explicitly:

```bash
# Push single tag
git push origin v0.0.3

# Push all tags
git push --tags

# Push commits and tags together
git push && git push --tags
```

### 5. Release Notes Guidelines

**Structure:**

```markdown
## [0.0.3] - 2025-11-10

### ✨ Added
- List new features
- Use bullet points
- Be specific

### 🔄 Changed
- Document modifications
- Highlight breaking changes with **Breaking:** prefix
- Provide migration examples

### 🐛 Fixed
- List bug fixes
- Reference issue numbers (#123)

### 🔧 Technical
- Internal improvements
- Dependency updates
- Performance optimizations

### ⚠️ Breaking Changes
- Detail what breaks
- Explain how to migrate
- Provide code examples
```

**Writing Style:**

- ✅ "Added configuration validation with helpful suggestions"
- ✅ "Fixed CLI crash when config file is missing"
- ❌ "bug fix"
- ❌ "improvements"

**Link to Issues:**

```markdown
- Fixed dashboard generation crash (#234)
- Added custom adapter support (resolves #156)
```

### 6. Release Timing

**Regular releases:**

- Patch: Weekly or as needed for critical bugs
- Minor: Monthly or when features are ready
- Major: Quarterly or when breaking changes accumulate

**Coordinate with npm:**

If publishing to npm, create GitHub release **after** successful npm publish:

```bash
# 1. Publish to npm first
npm publish

# 2. Then create GitHub release
npm run release
```

Or automate both in CI/CD.

## Automation with GitHub Actions

### Automatic Release on Tag Push

Create `.github/workflows/release.yml`:

```yaml
name: Create GitHub Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    permissions:
      contents: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build project
        run: npm run build
      
      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist/**/*.js
            dist/**/*.d.ts
          body_path: CHANGELOG.md
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Usage:**

```bash
# Just push a tag
git tag -a v0.0.4 -m "Release v0.0.4"
git push origin v0.0.4

# GitHub Actions automatically creates the release
```

### Combined npm + GitHub Release

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    
    permissions:
      contents: write
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm test
      - run: npm run build
      
      # Publish to npm
      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      # Create GitHub Release
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          body_path: CHANGELOG.md
          draft: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Setup:**

1. Create npm access token at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Add to GitHub: Settings → Secrets → `NPM_TOKEN`
3. Push tags to trigger workflow

## Pre-release Management

### Creating Pre-releases

**Alpha (early, unstable):**

```bash
npm version prerelease --preid=alpha
# 0.0.3 → 0.0.4-alpha.0

git push && git push --tags

gh release create v0.0.4-alpha.0 \
  --title "v0.0.4-alpha.0" \
  --notes "Early preview of new features" \
  --prerelease
```

**Beta (feature-complete, testing):**

```bash
npm version prerelease --preid=beta
# 0.0.4-alpha.0 → 0.0.4-beta.0

gh release create v0.0.4-beta.0 \
  --title "v0.0.4-beta.0" \
  --notes "Beta release for testing" \
  --prerelease
```

**Release Candidate:**

```bash
npm version prerelease --preid=rc
# 0.0.4-beta.0 → 0.0.4-rc.0

gh release create v0.0.4-rc.0 \
  --title "v0.0.4-rc.0" \
  --notes "Release candidate" \
  --prerelease
```

### Promoting to Stable

```bash
npm version patch
# 0.0.4-rc.0 → 0.0.4

npm run release
```

## Troubleshooting

### Error: gh: command not found

**Cause:** GitHub CLI not installed

**Solution:**

```bash
# Windows
winget install --id GitHub.cli

# macOS
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh
```

### Error: HTTP 401: Bad credentials

**Cause:** Not authenticated with GitHub

**Solution:**

```bash
gh auth login
gh auth status
```

### Error: Tag already exists

**Cause:** Version tag already created

**Solution:**

```bash
# Delete local tag
git tag -d v0.0.3

# Delete remote tag
git push origin :refs/tags/v0.0.3

# Create new tag
git tag -a v0.0.3 -m "Release v0.0.3"
git push origin v0.0.3
```

### Error: Release already exists

**Cause:** GitHub release already created for tag

**Solution:**

```bash
# Delete release
gh release delete v0.0.3 --yes

# Recreate
gh release create v0.0.3 --notes-file CHANGELOG.md
```

### Error: Permission denied

**Cause:** No write access to repository

**Solution:**

- Verify you have write access to the repository
- Check organization membership
- Verify personal access token has correct scopes

## Integration with npm

### Coordinated Release Process

**Option 1: npm first, then GitHub**

```bash
# 1. Bump version
npm version patch

# 2. Publish to npm
npm publish

# 3. Create GitHub release
npm run release
```

**Option 2: Both together (automated)**

Use the `scripts/release.js` script that handles both:

```bash
npm run release:patch
```

### Version Consistency

Ensure versions match across:

- `package.json` - npm version
- Git tags - `v0.0.3`
- GitHub releases - `v0.0.3`
- CHANGELOG.md - `[0.0.3]`
- Documentation - Version references

## Best Practices Summary

1. **Always use semantic versioning** - MAJOR.MINOR.PATCH
2. **Maintain detailed CHANGELOG** - Document every change
3. **Test before releasing** - Build, test, and verify
4. **Use annotated git tags** - Include release message
5. **Write clear release notes** - Help users understand changes
6. **Highlight breaking changes** - Use **Breaking:** prefix
7. **Provide migration guides** - For major versions
8. **Automate when possible** - Reduce manual errors
9. **Keep npm and GitHub in sync** - Version consistency
10. **Communicate releases** - Announce to users

## Related Documentation

- **[Publishing to npm](./publishing.md)** - npm package publishing
- **[Contributing](./contributing.md)** - Contribution guidelines
- **[Versioning](./publishing.md#versioning-strategy)** - SemVer strategy
- **[CHANGELOG](../CHANGELOG.md)** - Project changelog

## Resources

- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

