/**
 * CLI module for the MCP test tool
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { TestCommandOptions } from './types';
import { runTests } from './commands/test';
import { printTestSummary } from '../utils';
import { getPackageVersion } from '../utils/packageUtils';

/**
 * Create and configure the CLI program
 *
 * @returns Configured Commander program
 */
export const createProgram = (): Command => {
  const program = new Command();

  program
    .name('mcpt')
    .description('A CLI tool for running Model Context Protocol (MCP) tests')
    .version(getPackageVersion(), '-v, --version')
    .option(
      '-e, --exclude <patterns>',
      'Exclude files matching the pattern (comma-separated)',
      '**/node_modules/**,**/dist/**'
    )
    .option('-t, --timeout <ms>', 'Set test timeout in milliseconds', '30000')
    .option('--verbose', 'Show more detailed output')
    .option('--pattern <glob>', 'Test file pattern to match', '**/*.test.{js,ts}')
    .option('--no-color', 'Disable colored output')
    .argument('[files...]', 'Specific test files to run')
    .action(async (files: string[], options: TestCommandOptions) => {
      try {
        const results = await runTests(files, options);
        printTestSummary(results.total, results.passed, results.failed, results.duration);
        process.exit(results.failed > 0 ? 1 : 0);
      } catch (error: any) {
        console.error(`${chalk.red('=� Error:')} ${error.message}`);
        if (options.verbose) {
          console.error(error);
        }
        process.exit(1);
      }
    });

  return program;
};
