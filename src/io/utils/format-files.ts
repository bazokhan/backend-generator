import { execSync } from 'child_process';

/**
 * Format a generated file using Prettier
 */
export function formatGeneratedFile(filePath: string, baseDir: string): void {
  try {
    execSync(`npx prettier --write "${filePath}"`, {
      stdio: 'pipe',
      cwd: baseDir,
    });
  } catch (error) {
    console.warn(`⚠️ Could not format ${filePath}:`, error);
  }
}

/**
 * Format multiple generated files at once using Prettier
 * This is more efficient than formatting files individually
 */
export function formatGeneratedFiles(filePaths: string[], baseDir: string): void {
  if (filePaths.length === 0) {
    return;
  }

  try {
    // Format all files in a single Prettier call
    const filesToFormat = filePaths.map((p) => `"${p}"`).join(' ');
    execSync(`npx prettier --write ${filesToFormat}`, {
      stdio: 'pipe',
      cwd: baseDir,
    });
  } catch (error) {
    console.warn(`⚠️ Could not format files:`, error);
    // Fall back to formatting individually
    filePaths.forEach((filePath) => {
      formatGeneratedFile(filePath, baseDir);
    });
  }
}
