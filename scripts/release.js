#!/usr/bin/env node

const { execSync } = require('child_process');
const { version } = require('../package.json');

const tag = `v${version}`;

console.log(`🚀 Creating release ${tag}...\n`);

try {
  // Check if tag already exists
  try {
    execSync(`git rev-parse ${tag}`, { stdio: 'ignore' });
    console.error(`❌ Tag ${tag} already exists. Please bump version first.`);
    process.exit(1);
  } catch {
    // Tag doesn't exist, continue
  }

  // Create annotated tag
  console.log(`📌 Creating tag ${tag}...`);
  execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' });

  // Push tag
  console.log(`⬆️  Pushing tag to remote...`);
  execSync(`git push origin ${tag}`, { stdio: 'inherit' });

  // Create GitHub release
  console.log(`🎉 Creating GitHub release...`);
  execSync(`gh release create ${tag} --title "${tag}" --notes-file CHANGELOG.md --latest`, {
    stdio: 'inherit',
  });

  console.log(`\n✅ Release ${tag} created successfully!`);
  console.log(`   View at: https://github.com/trugraph/backend-generator/releases/tag/${tag}`);
} catch (error) {
  console.error(`\n❌ Release failed:`, error.message);
  process.exit(1);
}

