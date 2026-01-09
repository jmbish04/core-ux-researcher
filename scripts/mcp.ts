import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { execa } from "execa";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(__dirname);
const $ = execa({ cwd: rootDir });

/**
 * Model Context Protocol (MCP) server.
 *
 * @see https://modelcontextprotocol.org
 * @see https://code.visualstudio.com/docs/copilot/chat/mcp-servers
 */
const server = new McpServer({
  name: "React Starter Kit",
  version: "0.0.0",
});

// This is just an example of a custom command that can be executed
// from the MCP client (e.g., VS Code, GitHub Copilot, etc.).
server.tool(
  "eslint",
  "Lint JavaScript and TypeScript files with ESLint",
  {
    filename: z.string(),
  },
  async function lint({ filename }) {
    const cmd = await $`pnpm run eslint ${filename}`;
    return {
      content: [{ type: "text", text: cmd.stdout }],
    };
  },
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
