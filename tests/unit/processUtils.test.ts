/**
 * Tests for process utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import { runTestFile, printTestSummary } from '../../src/utils/processUtils';

// Mock modules
vi.mock('child_process', () => ({
  spawnSync: vi.fn(),
}));

vi.mock('chalk', () => ({
  default: {
    level: 3,
    cyan: vi.fn((text) => text),
    blue: vi.fn((text) => text),
    green: vi.fn((text) => text),
    red: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    magenta: vi.fn((text) => text),
    dim: vi.fn((text) => text),
    bold: vi.fn((text) => text),
  },
}));

describe('processUtils', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset Date.now to return consistent values for testing
    let time = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      time += 100;
      return time;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('runTestFile', () => {
    it('should run a test file and return true when test passes', async () => {
      // Setup
      const mockSpawnSync = spawnSync as any;
      mockSpawnSync.mockReturnValue({ status: 0 });

      // Execute
      const result = await runTestFile({
        filePath: '/test/file.test.ts',
        timeoutMs: 5000,
        verbose: false,
        color: true,
      });

      // Verify
      expect(result).toBe(true);
      expect(mockSpawnSync).toHaveBeenCalledWith(
        'npx',
        ['ts-node', '--experimental-specifier-resolution=node', '--esm', '/test/file.test.ts'],
        expect.objectContaining({
          timeout: 5000,
        })
      );
      expect(console.log).toHaveBeenCalled();
    });

    it('should return false when test fails', async () => {
      // Setup
      const mockSpawnSync = spawnSync as any;
      mockSpawnSync.mockReturnValue({ status: 1 });

      // Execute
      const result = await runTestFile({
        filePath: '/test/file.test.ts',
        timeoutMs: 5000,
        verbose: false,
        color: true,
      });

      // Verify
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should return false when test times out', async () => {
      // Setup
      const mockSpawnSync = spawnSync as any;
      mockSpawnSync.mockReturnValue({
        status: null,
        error: { name: 'ETIMEDOUT' },
      });

      // Execute
      const result = await runTestFile({
        filePath: '/test/file.test.ts',
        timeoutMs: 5000,
        verbose: false,
        color: true,
      });

      // Verify
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should disable colors when color is false', async () => {
      // Setup
      const mockSpawnSync = spawnSync as any;
      mockSpawnSync.mockReturnValue({ status: 0 });

      // Execute
      await runTestFile({
        filePath: '/test/file.test.ts',
        timeoutMs: 5000,
        verbose: false,
        color: false,
      });

      // Verify
      expect(mockSpawnSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          env: expect.objectContaining({
            FORCE_COLOR: '0',
          }),
        })
      );
    });
  });

  describe('printTestSummary', () => {
    it('should print test summary', () => {
      // Execute
      printTestSummary(10, 8, 2, 5000);

      // Verify
      expect(console.log).toHaveBeenCalledTimes(6); // Header + 4 stats + failed message
    });

    it('should show success message when no failures', () => {
      // Execute
      printTestSummary(10, 10, 0, 5000);

      // Verify
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('All tests passed'));
    });
  });
});
