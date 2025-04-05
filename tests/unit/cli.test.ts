/**
 * Tests for CLI module
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { createProgram } from '../../src/cli';
import * as testCommand from '../../src/cli/commands/test';
import * as utils from '../../src/utils';

// Mock dependencies
vi.mock('../../src/cli/commands/test', () => ({
  runTests: vi.fn(),
}));

vi.mock('../../src/utils', () => ({
  printTestSummary: vi.fn(),
  getPackageVersion: vi.fn().mockReturnValue('1.0.0'),
}));

describe('CLI', () => {
  let processExitSpy: vi.SpyInstance;
  let consoleErrorSpy: vi.SpyInstance;

  beforeEach(() => {
    // Mock process.exit to prevent tests from exiting
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      return undefined as never;
    });

    // Mock console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createProgram', () => {
    it('should create a commander program', () => {
      // Execute
      const program = createProgram();

      // Verify
      expect(program).toBeInstanceOf(Command);
      expect(program.name()).toBe('mcpt');
    });

    it('should register the test command with correct options', () => {
      // Execute
      const program = createProgram();

      // Verify
      const options = program.opts();
      expect(program.commands.length).toBe(0); // No subcommands

      // Parse arguments to see if options are registered
      program.parse(['node', 'cli.js', '--verbose']);

      // Verify default options
      expect(program.opts()).toEqual(
        expect.objectContaining({
          verbose: true,
        })
      );
    });

    it('should handle test command action with files', async () => {
      // Setup
      const mockRunTests = testCommand.runTests as unknown as vi.Mock;
      mockRunTests.mockResolvedValue({
        total: 10,
        passed: 9,
        failed: 1,
        duration: 5000,
      });

      // Execute
      const program = createProgram();
      await program.parseAsync(['node', 'cli.js', 'test/file.ts', '--verbose']);

      // Verify
      expect(mockRunTests).toHaveBeenCalledWith(
        ['test/file.ts'],
        expect.objectContaining({ verbose: true })
      );

      expect(utils.printTestSummary).toHaveBeenCalledWith(10, 9, 1, 5000);
      expect(processExitSpy).toHaveBeenCalledWith(1); // Exit code 1 for failures
    });

    it('should exit with code 0 when all tests pass', async () => {
      // Setup
      const mockRunTests = testCommand.runTests as unknown as vi.Mock;
      mockRunTests.mockResolvedValue({
        total: 10,
        passed: 10,
        failed: 0,
        duration: 5000,
      });

      // Execute
      const program = createProgram();
      await program.parseAsync(['node', 'cli.js']);

      // Verify
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle errors gracefully', async () => {
      // Setup
      const mockRunTests = testCommand.runTests as unknown as vi.Mock;
      mockRunTests.mockRejectedValue(new Error('Test error'));

      // Execute
      const program = createProgram();
      await program.parseAsync(['node', 'cli.js']);

      // Verify
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
