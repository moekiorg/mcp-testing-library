import fs from 'fs';
import path from 'path';
import { minimatch } from 'minimatch';
import { spawn } from 'child_process';

interface RunnerOptions {
  exclude?: string;
  pattern?: string;
  timeoutMs?: number;
  verbose?: boolean;
}

// Parse command line arguments
const parseArgs = (): RunnerOptions & { testFilePaths: string[] } => {
  const args = process.argv.slice(2);
  const options: RunnerOptions = {
    exclude: '**/node_modules/**,**/dist/**',
    pattern: '**/*.test.{js,ts}',
    timeoutMs: 30000,
    verbose: false,
  };

  const testFilePaths: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--exclude' && i + 1 < args.length) {
      options.exclude = args[++i];
    } else if (arg === '--timeout' && i + 1 < args.length) {
      options.timeoutMs = parseInt(args[++i], 10);
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (!arg.startsWith('--')) {
      // Assume it's a file or pattern
      testFilePaths.push(arg);
    }
  }

  return { ...options, testFilePaths };
};

// Find test files recursively
const findTestFiles = (dir: string, pattern: string, exclude: string): string[] => {
  const excludePatterns = exclude.split(',');
  const allFiles: string[] = [];

  const readDir = (currentDir: string) => {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        readDir(filePath);
      } else if (
        minimatch(filePath, pattern) &&
        !excludePatterns.some((excludePattern) => minimatch(filePath, excludePattern))
      ) {
        allFiles.push(filePath);
      }
    }
  };

  readDir(dir);
  return allFiles;
};

// Run a single test file
const runTestFile = (filePath: string, timeoutMs: number, verbose: boolean): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running test: ${filePath}`);

    const startTime = Date.now();
    const extension = path.extname(filePath);

    // Use ts-node for .ts files, node for .js files
    const command = extension === '.ts' ? 'ts-node' : 'node';
    const args = [extension === '.ts' ? '--esm' : '', filePath].filter(Boolean);

    if (verbose) {
      console.log(`📋 Command: ${command} ${args.join(' ')}`);
    }

    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--experimental-specifier-resolution=node' },
    });

    const timer = setTimeout(() => {
      console.error(`⏱️ Test timed out after ${timeoutMs}ms: ${filePath}`);
      child.kill();
      resolve(false);
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;

      if (code === 0) {
        console.log(`✅ Test passed (${duration}ms): ${filePath}`);
        resolve(true);
      } else {
        console.error(`❌ Test failed (${duration}ms): ${filePath}`);
        resolve(false);
      }
    });
  });
};

// Main function
const main = async () => {
  try {
    const { exclude, pattern, timeoutMs, verbose, testFilePaths } = parseArgs();

    // Use provided test files or find them
    let filesToTest: string[] = [];

    if (testFilePaths.length > 0) {
      // Check if the arguments are files or patterns
      for (const fileOrPattern of testFilePaths) {
        if (fs.existsSync(fileOrPattern) && fs.statSync(fileOrPattern).isFile()) {
          filesToTest.push(fileOrPattern);
        } else {
          // Treat as a pattern
          const foundFiles = findTestFiles(process.cwd(), fileOrPattern, exclude || '');
          filesToTest.push(...foundFiles);
        }
      }
    } else {
      // Find all test files in the project
      filesToTest = findTestFiles(process.cwd(), pattern || '**/*.test.{js,ts}', exclude || '');
    }

    if (filesToTest.length === 0) {
      console.log('⚠️ No test files found');
      process.exit(0);
    }

    console.log(`🔍 Found ${filesToTest.length} test files`);
    if (verbose) {
      filesToTest.forEach((file) => console.log(`  - ${file}`));
    }

    let passed = 0;
    let failed = 0;

    const startTime = Date.now();

    for (const file of filesToTest) {
      const success = await runTestFile(file, timeoutMs || 30000, verbose || false);
      if (success) {
        passed++;
      } else {
        failed++;
      }
    }

    const totalDuration = Date.now() - startTime;

    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${filesToTest.length}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Duration: ${totalDuration}ms`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('💥 Error running tests:', error);
    process.exit(1);
  }
};

// Run the main function
main();
