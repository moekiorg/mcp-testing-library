# MCP Testing Library

A CLI tool for running Model Context Protocol (MCP) tests.

## Features

- CLI tool for running MCP tests
- Supports running individual test files or test patterns
- Configurable test timeout and exclusion patterns
- Verbose mode for detailed output
- Written in TypeScript with full type support
- Compatible with the Model Context Protocol SDK
- Colorful test output for better readability
- Comprehensive test coverage

## Installation

### Global Installation

You can install the package globally:

```bash
npm install -g mcpt
```

Or use it directly with npx:

```bash
npx mcpt
```

### Local Installation

To install as a development dependency in your project:

```bash
npm install --save-dev mcpt
```

### Development Setup

To contribute to the project:

```bash
# Clone the repository
git clone https://github.com/yourusername/mcpt.git
cd mcpt

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Command Line Options

```
Usage: mcpt [options] [test-files...]

Options:
  -v, --version             output version number
  -e, --exclude <patterns>  Exclude files matching the pattern (comma-separated)
                           (default: "**/node_modules/**,**/dist/**")
  -t, --timeout <ms>        Set test timeout in milliseconds (default: "30000")
  --pattern <glob>          Test file pattern to match (default: "**/*.test.{js,ts}")
  --no-color                Disable colored output
  -h, --help                display help for command
```

### Examples

Run all tests in the project:

```bash
mcpt
```

Run a specific test file:

```bash
mcpt sample/index.test.ts
```

Run tests with a longer timeout:

```bash
mcpt --timeout 10000
```

Run tests without color output:

```bash
mcpt --no-color
```

Exclude specific directories:

```bash
mcpt --exclude "**/node_modules/**,**/dist/**,**/build/**"
```

## Using in Code

You can also use the MCP test utilities directly in your code:

```typescript
import { mcpt, expect } from 'mcpt';

// Test a filesystem MCP server
mcpt(
  {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/directory'],
  },
  async ({ tools, prompts, resources, isMethodExist }) => {
    expect(tools.length).to.be.greaterThan(0);
    expect(await isMethodExist('list-tools')).to.eq(true);

    // More assertions...
  }
);
```

## License

MIT
