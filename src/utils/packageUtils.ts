/**
 * Package utilities for working with package information
 */
import fs from 'fs';
import path from 'path';

/**
 * Find the root directory of the project (where package.json is located)
 *
 * @param startDir - Directory to start searching from
 * @returns The path to the project root
 * @throws Error if project root is not found
 */
export const findProjectRoot = (startDir: string): string => {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    // Go up one directory
    currentDir = path.dirname(currentDir);
  }
  throw new Error('Could not find project root (package.json)');
};

/**
 * Get the package version from package.json
 *
 * @param packageDir - Directory containing package.json
 * @returns The version string from package.json, or '0.0.0' if not found
 */
export const getPackageVersion = (packageDir?: string): string => {
  try {
    // If packageDir is not provided, use the current directory
    const dir = packageDir || process.cwd();
    const packageJsonPath = path.join(dir, 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson.version || '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
};

/**
 * Get the package name from package.json
 *
 * @param packageDir - Directory containing package.json
 * @returns The name string from package.json, or 'unknown' if not found
 */
export const getPackageName = (packageDir?: string): string => {
  try {
    // If packageDir is not provided, use the current directory
    const dir = packageDir || process.cwd();
    const packageJsonPath = path.join(dir, 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson.name || 'unknown';
  } catch (error) {
    return 'unknown';
  }
};
