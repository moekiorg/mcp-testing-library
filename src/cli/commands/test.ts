/**
 * Implementation of the test command
 */
import fs from 'fs';
import chalk from 'chalk';
import { TestCommandOptions, TestResult } from '../types';
import { findTestFiles, sortFilesByModTime, runTestFile } from '../../utils';

/**
 * Run tests with the given options and file paths
 * 
 * @param testFilePaths - Array of file paths to test
 * @param options - Test command options
 * @returns Promise resolving to the test results
 */
export const runTests = async (
  testFilePaths: string[], 
  options: TestCommandOptions
): Promise<TestResult> => {
  try {
    const { exclude, timeout, verbose, pattern, color = true } = options;
    
    // Disable chalk colors if --no-color flag is provided
    if (!color) {
      chalk.level = 0;
    }

    // Use provided test files or find them
    let filesToTest: string[] = [];
    
    if (testFilePaths.length > 0) {
      // Check if the arguments are files or patterns
      for (const fileOrPattern of testFilePaths) {
        if (fs.existsSync(fileOrPattern) && fs.statSync(fileOrPattern).isFile()) {
          filesToTest.push(fileOrPattern);
        } else {
          // Treat as a pattern
          const foundFiles = findTestFiles(process.cwd(), fileOrPattern, exclude);
          filesToTest.push(...foundFiles);
        }
      }
    } else {
      // Find all test files in the project
      filesToTest = findTestFiles(process.cwd(), pattern, exclude);
    }
    
    // Sort files by modification time (newest first)
    filesToTest = sortFilesByModTime(filesToTest);
    
    if (filesToTest.length === 0) {
      console.log(chalk.yellow('⚠️ No test files found'));
      return { total: 0, passed: 0, failed: 0, duration: 0 };
    }
    
    console.log(`${chalk.blue('🔍 Found')} ${chalk.bold(filesToTest.length.toString())} ${chalk.blue('test files')}`);
    if (verbose) {
      filesToTest.forEach(file => console.log(`  ${chalk.dim('-')} ${file}`));
    }
    
    let passed = 0;
    let failed = 0;
    
    const startTime = Date.now();
    
    // Run each test file
    for (const file of filesToTest) {
      const success = await runTestFile({
        filePath: file,
        timeoutMs: parseInt(timeout, 10),
        verbose,
        color
      });
      
      if (success) {
        passed++;
      } else {
        failed++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      total: filesToTest.length,
      passed,
      failed,
      duration
    };
  } catch (error: any) {
    console.error(`${chalk.red('💥 Error running tests:')} ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    
    // Return failed test result
    return {
      total: 0,
      passed: 0,
      failed: 1,
      duration: 0
    };
  }
};
