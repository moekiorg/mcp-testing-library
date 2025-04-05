/**
 * Common types and interfaces for the CLI commands
 */

/**
 * Base options for all CLI commands
 */
export interface BaseOptions {
  /** Enable verbose output */
  verbose: boolean;
  /** Enable colored output */
  color: boolean;
}

/**
 * Options for the test command
 */
export interface TestCommandOptions extends BaseOptions {
  /** Exclude patterns (comma-separated) */
  exclude: string;
  /** Test timeout in milliseconds */
  timeout: string;
  /** Test file pattern to match */
  pattern: string;
}

/**
 * Result of a test run
 */
export interface TestResult {
  /** Total number of tests */
  total: number;
  /** Number of passed tests */
  passed: number;
  /** Number of failed tests */
  failed: number;
  /** Total duration in milliseconds */
  duration: number;
}
