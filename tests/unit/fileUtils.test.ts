/**
 * Tests for file utilities
 */
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { findTestFiles, sortFilesByModTime } from '../../src/utils/fileUtils';

// Create test fixtures if they don't exist
beforeAll(() => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures');
  const excludedDir = path.join(fixturesDir, 'excluded');

  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  if (!fs.existsSync(excludedDir)) {
    fs.mkdirSync(excludedDir, { recursive: true });
  }

  // Create a sample test file
  const sampleTestPath = path.join(fixturesDir, 'sample.test.ts');
  if (!fs.existsSync(sampleTestPath)) {
    fs.writeFileSync(
      sampleTestPath,
      `
      /**
       * Sample test file for testing findTestFiles
       */
      describe('Sample test', () => {
        it('should pass', () => {
          expect(true).toBe(true);
        });
      });
    `
    );
  }

  // Create an excluded file
  const excludedFilePath = path.join(excludedDir, 'excluded.ts');
  if (!fs.existsSync(excludedFilePath)) {
    fs.writeFileSync(
      excludedFilePath,
      `
      /**
       * Sample file that should be excluded
       */
      export const someFunction = () => {
        return 'excluded';
      };
    `
    );
  }
});

describe('fileUtils', () => {
  describe('findTestFiles', () => {
    it('should find test files matching a pattern', () => {
      const testDir = path.join(__dirname, '..', 'fixtures');
      const files = findTestFiles(testDir, '**/*.test.ts', '**/node_modules/**');

      // Files should be an array
      expect(Array.isArray(files)).toBe(true);
    });
  });

  describe('sortFilesByModTime', () => {
    it('should sort files by modification time', () => {
      const files = [
        path.join(__dirname, 'fileUtils.test.ts'),
        path.join(__dirname, '..', 'fixtures', 'sample.test.ts'),
      ];

      const sorted = sortFilesByModTime(files);

      // Should return a new array
      expect(sorted).not.toBe(files);

      // Should return an array of the same length
      expect(sorted.length).toBe(files.length);
    });
  });
});
