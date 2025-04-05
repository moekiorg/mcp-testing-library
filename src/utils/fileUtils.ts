/**
 * File utilities for finding and manipulating test files
 */
import fs from 'fs';
import path from 'path';
import { minimatch } from 'minimatch';

/**
 * Find test files recursively in a directory
 *
 * @param dir - Directory to search in
 * @param pattern - Glob pattern to match files against
 * @param exclude - Comma-separated list of patterns to exclude
 * @returns Array of file paths matching the pattern
 */
export const findTestFiles = (dir: string, pattern: string, exclude: string): string[] => {
  const excludePatterns = exclude.split(',');
  const allFiles: string[] = [];

  const readDir = (currentDir: string): void => {
    try {
      const files = fs.readdirSync(currentDir);

      for (const file of files) {
        const filePath = path.join(currentDir, file);

        try {
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            // Skip directories that match exclude pattern
            const shouldExclude = excludePatterns.some((excludePattern) =>
              minimatch(filePath, excludePattern)
            );

            if (!shouldExclude) {
              readDir(filePath);
            }
          } else if (minimatch(filePath, pattern)) {
            allFiles.push(filePath);
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  };

  readDir(dir);
  return allFiles;
};

/**
 * Sort files by modification time (newest first)
 *
 * @param files - Array of file paths to sort
 * @returns Sorted array of file paths
 */
export const sortFilesByModTime = (files: string[]): string[] => {
  return [...files].sort((a, b) => {
    try {
      return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
    } catch (error) {
      return 0;
    }
  });
};
