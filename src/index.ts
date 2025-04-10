/**
 * MCP Test Library
 *
 * A testing library for Model Context Protocol implementations
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Resource, Tool, Prompt } from '@modelcontextprotocol/sdk/types';
export { expect } from './testing/expect';

/**
 * Options for mcpt
 */
export interface mcptOptions {
  /** Command to run (e.g., 'npx') */
  command: string;
  /** Arguments for the command */
  args: string[];
  /** Environment variables */
  env: Record<string, string> | undefined;
}

/**
 * The callback type for the mcpt function
 */
export type mcptCallback = (context: {
  /** The MCP client */
  client: Client;
  /** Available tools */
  tools: Tool[];
  /** Available prompts */
  prompts: Prompt[];
  /** Available resources */
  resources: Resource[];
  /** Check if a method exists */
  isMethodExist: (name: string) => Promise<boolean>;
}) => Promise<void>;

/**
 * Run a test against an MCP implementation
 *
 * @param options - The options for the test
 * @param callback - The callback to run with the MCP client
 * @returns A promise that resolves when the test is complete
 */
export const mcpt = async (
  { command, args, env }: mcptOptions,
  callback: mcptCallback
): Promise<void> => {
  console.log(`🚀 Starting mcpt with command: ${command}`);

  const transport = new StdioClientTransport({ command, args, env });

  const client = new Client(
    {
      name: 'mcpt',
      version: '1.0.0',
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
      },
    }
  );

  await client.connect(transport);

  let tools: Tool[] = [];
  let resources: Resource[] = [];
  let prompts: Prompt[] = [];

  try {
    tools = (await client.listTools()).tools;
  } catch (e) {
    console.log('No tools available');
  }

  try {
    resources = (await client.listResources()).resources;
  } catch (e) {
    console.log('No resources available');
  }

  try {
    prompts = (await client.listPrompts()).prompts;
  } catch (e) {
    console.log('No prompts available');
  }

  const isMethodExist = async (name: string): Promise<boolean> => {
    try {
      await client.request({ method: name }, {} as any);
      return true;
    } catch {
      return false;
    }
  };

  try {
    await callback({ client, tools, resources, prompts, isMethodExist });
  } finally {
    await client.close();
  }
};

// Export CLI utilities for programmatic use
export * from './cli/types';
export { createProgram } from './cli';
export * from './utils';
