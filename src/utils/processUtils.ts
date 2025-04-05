/**
 * Process utilities for running tests and handling processes
 */
import { spawnSync, SpawnSyncOptions } from 'child_process';
import path from 'path';
import chalk from 'chalk';

/**
 * Options for running a test file
 */
export interface TestRunOptions {
  /** Path to the test file */
  filePath: string;
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Enable verbose output */
  verbose: boolean;
  /** Enable colored output */
  color: boolean;
}

/**
 * Run a single test file
 * 
 * @param options - Test run options
 * @returns Promise resolving to true if the test passed, false otherwise
 */
export const runTestFile = ({
  filePath,
  timeoutMs,
  verbose,
  color = true
}: TestRunOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log(`\n${chalk.cyan('🧪 Running test:')} ${chalk.bold(filePath)}`);
    
    const startTime = Date.now();
    const extension = path.extname(filePath);
    
    // Use ts-node for .ts files, node for .js files
    const command = extension === '.ts' ? 'ts-node' : 'node';
    const args = [
      '--experimental-specifier-resolution=node',
      extension === '.ts' ? '--esm' : '',
      filePath
    ].filter(Boolean) as string[];
    
    if (verbose) {
      console.log(`${chalk.blue('📋 Command:')} ${chalk.dim(command)} ${chalk.dim(args.join(' '))}`);
    }

    const spawnOptions: SpawnSyncOptions = {
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_OPTIONS: '--experimental-specifier-resolution=node',
        FORCE_COLOR: color ? '1' : '0' // Force color in child process
      },
      timeout: timeoutMs
    };
    
    const child = spawnSync('npx', [command, ...args], spawnOptions);
    
    const duration = Date.now() - startTime;
    const formattedDuration = chalk.yellow(`${duration}ms`);
    
    if (child.status === 0) {
      console.log(`${chalk.green('✅ Test passed')} (${formattedDuration}): ${chalk.bold(filePath)}`);
      resolve(true);
    } else if (child.error && child.error.name === 'ETIMEDOUT') {
      console.error(`${chalk.red('⏱️ Test timed out')} after ${formattedDuration}: ${chalk.bold(filePath)}`);
      resolve(false);
    } else {
      console.error(`${chalk.red('❌ Test failed')} (${formattedDuration}): ${chalk.bold(filePath)}`);
      resolve(false);
    }
  });
};

/**
 * Print a test summary to the console
 * 
 * @param total - Total number of tests
 * @param passed - Number of passed tests
 * @param failed - Number of failed tests
 * @param duration - Total duration in milliseconds
 */
export const printTestSummary = (
  total: number,
  passed: number,
  failed: number,
  duration: number
): void => {
  console.log(`\n${chalk.magenta('📊 Test Summary:')}`);
  console.log(`   ${chalk.blue('Total:')} ${chalk.bold(total)}`);
  console.log(`   ${chalk.green('Passed:')} ${chalk.bold(passed)}`);
  
  if (failed > 0) {
    console.log(`   ${chalk.red('Failed:')} ${chalk.bold(failed)}`);
  } else {
    console.log(`   ${chalk.dim('Failed:')} ${chalk.bold(0)}`);
  }
  
  console.log(`   ${chalk.yellow('Duration:')} ${chalk.bold(duration)}ms`);
  
  if (failed > 0) {
    console.log(`\n${chalk.red('❌ Some tests failed!')}`);
  } else {
    console.log(`\n${chalk.green('✅ All tests passed!')}`);
  }
};
