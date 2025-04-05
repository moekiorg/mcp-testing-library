#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import chalk from 'chalk';

// Get package version from package.json
const getPackageVersion = () => {
  try {
    // Since this file is in src/bin, we need to look for package.json in the parent directory
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson.version || '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
};

// Configure the CLI program
const program = new Command();
program
  .name('mcpt')
  .description('A CLI tool for running Model Context Protocol (MCP) tests')
  .version(getPackageVersion())
  .option(
    '-e, --exclude <patterns>',
    'Exclude files matching the pattern (comma-separated)',
    '**/node_modules/**,**/dist/**'
  )
  .option('-t, --timeout <ms>', 'Set test timeout in milliseconds', '30000')
  .option('-v, --verbose', 'Show more detailed output')
  .option('--pattern <glob>', 'Test file pattern to match', '**/*.test.{js,ts}')
  .option('--no-color', 'Disable colored output')
  .argument('[files...]', 'Specific test files to run')
  .action((files, options) => runTests(files, options));

// Find test files recursively
const findTestFiles = (dir, pattern, exclude) => {
  const excludePatterns = exclude.split(',');
  const allFiles = [];

  const readDir = (currentDir) => {
    try {
      const files = fs.readdirSync(currentDir);

      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Skip directories that match exclude pattern
          const shouldExclude = excludePatterns.some((excludePattern) =>
            filePath.includes(excludePattern.replace(/\*/g, ''))
          );

          if (!shouldExclude) {
            readDir(filePath);
          }
        } else if (file.match(/\.test\.(js|ts)$/)) {
          allFiles.push(filePath);
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
  };

  readDir(dir);
  return allFiles;
};

// Run a single test file
const runTestFile = (filePath, timeoutMs, verbose, useColor = true) => {
  return new Promise((resolve) => {
    console.log(`\n${chalk.cyan('🧪 Running test:')} ${chalk.bold(filePath)}`);

    const startTime = Date.now();
    const extension = path.extname(filePath);

    // Use ts-node for .ts files, node for .js files
    const command = extension === '.ts' ? 'ts-node' : 'node';
    const args = [extension === '.ts' ? '--esm' : '', filePath].filter(Boolean);

    if (verbose) {
      console.log(
        `${chalk.blue('📋 Command:')} ${chalk.dim(command)} ${chalk.dim(args.join(' '))}`
      );
    }

    const child = spawnSync('npx', [command, ...args], {
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: useColor ? '1' : '0', // Force color in child process
      },
      timeout: parseInt(timeoutMs, 10),
    });

    const duration = Date.now() - startTime;
    const formattedDuration = chalk.yellow(`${duration}ms`);

    if (child.status === 0) {
      console.log(
        `${chalk.green('✅ Test passed')} (${formattedDuration}): ${chalk.bold(filePath)}`
      );
      resolve(true);
    } else if (child.error && child.error.name === 'ETIMEDOUT') {
      console.error(
        `${chalk.red('⏱️ Test timed out')} after ${formattedDuration}: ${chalk.bold(filePath)}`
      );
      resolve(false);
    } else {
      console.error(
        `${chalk.red('❌ Test failed')} (${formattedDuration}): ${chalk.bold(filePath)}`
      );
      resolve(false);
    }
  });
};

// Main function to run tests
const runTests = async (testFilePaths, options) => {
  try {
    const { exclude, timeout, verbose, pattern, color = true } = options;

    // Disable chalk colors if --no-color flag is provided
    if (!color) {
      chalk.level = 0;
    }

    // Use provided test files or find them
    let filesToTest = [];

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
    filesToTest.sort((a, b) => {
      try {
        return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
      } catch (error) {
        return 0;
      }
    });

    if (filesToTest.length === 0) {
      console.log(chalk.yellow('⚠️ No test files found'));
      process.exit(0);
    }

    console.log(
      `${chalk.blue('🔍 Found')} ${chalk.bold(filesToTest.length.toString())} ${chalk.blue('test files')}`
    );
    if (verbose) {
      filesToTest.forEach((file) => console.log(`  ${chalk.dim('-')} ${file}`));
    }

    let passed = 0;
    let failed = 0;

    const startTime = Date.now();

    for (const file of filesToTest) {
      const success = await runTestFile(file, timeout, verbose, color);
      if (success) {
        passed++;
      } else {
        failed++;
      }
    }

    const totalDuration = Date.now() - startTime;

    console.log(`\n${chalk.magenta('📊 Test Summary:')}`);
    console.log(`   ${chalk.blue('Total:')} ${chalk.bold(filesToTest.length.toString())}`);
    console.log(`   ${chalk.green('Passed:')} ${chalk.bold(passed.toString())}`);

    if (failed > 0) {
      console.log(`   ${chalk.red('Failed:')} ${chalk.bold(failed.toString())}`);
    } else {
      console.log(`   ${chalk.dim('Failed:')} ${chalk.bold('0')}`);
    }

    console.log(`   ${chalk.yellow('Duration:')} ${chalk.bold(totalDuration.toString())}ms`);

    if (failed > 0) {
      console.log(`\n${chalk.red('❌ Some tests failed!')}`);
    } else {
      console.log(`\n${chalk.green('✅ All tests passed!')}`);
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`${chalk.red('💥 Error running tests:')} ${error.message}`);
    process.exit(1);
  }
};

// Run the CLI
program.parse();
