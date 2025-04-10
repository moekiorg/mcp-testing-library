import { mcpt, expect } from 'mcp-testing-library';

mcpt(
  {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/kawakami/Documents/notes'],
    env: {
      FOO: 'BAR',
    },
  },
  async ({ tools, isMethodExist }) => {
    expect(tools.length).to.eq(11);
    expect(await isMethodExist('get-prompt')).to.eq(false);
  }
);
