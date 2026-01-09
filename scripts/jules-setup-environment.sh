#!/bin/bash

# --- 1. Fix Repo Configuration for pnpm ---
echo "🔧 Migrating repo configuration to pnpm..."

# Remove "packageManager": "bun..." from package.json to allow pnpm to run
if [ -f package.json ]; then
  jq 'del(.packageManager)' package.json > package.json.tmp && mv package.json.tmp package.json
fi

# Generate pnpm-workspace.yaml from the existing workspaces field (if missing)
if [ ! -f "pnpm-workspace.yaml" ] && [ -f package.json ]; then
  echo "packages:" > pnpm-workspace.yaml
  jq -r '.workspaces[]' package.json | sed 's/^/  - /' >> pnpm-workspace.yaml
fi

# --- 2. Install Project Dependencies ---
echo "📦 Installing project dependencies with pnpm..."
pnpm install

# --- 3. Install Tooling Dependencies ---
# ADDED -w flag to fix ERR_PNPM_ADDING_TO_ROOT
echo "➕ Installing @modelcontextprotocol/sdk and tsx..."
pnpm add -w -D @modelcontextprotocol/sdk tsx

# --- 4. Create 'scripts/ask-cloudflare.ts' ---
if [ ! -f "scripts/ask-cloudflare.ts" ]; then
  echo "🛠️  Creating scripts/ask-cloudflare.ts..."
  mkdir -p scripts
  cat << 'EOF' > scripts/ask-cloudflare.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function askCloudflare() {
  const query = process.argv[2];
  if (!query) {
    console.error("\n❌ Usage: pnpm exec tsx scripts/ask-cloudflare.ts \"Your question here\"");
    process.exit(1);
  }

  console.log(`\n🔍 Asking Cloudflare Docs: "${query}"...`);

  const transport = new StdioClientTransport({
    command: "pnpm", 
    args: ["dlx", "mcp-remote", "https://docs.mcp.cloudflare.com/mcp"],
  });

  const client = new Client(
    { name: "jules-docs-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    
    const tools = await client.listTools();
    const toolName = tools.tools.find(t => t.name === "ask" || t.name === "search")?.name;

    if (!toolName) throw new Error("Could not find search tool on Cloudflare MCP.");

    const result = await client.callTool({
      name: toolName,
      arguments: { question: query, query: query },
    });

    // @ts-ignore
    const answer = result.content.find(c => c.type === "text")?.text;
    
    console.log("\n--- 💡 Cloudflare Docs Answer ---\n");
    console.log(answer || "No answer found.");
    console.log("\n-------------------------------\n");

  } catch (error) {
    console.error("\n❌ Error querying Cloudflare docs:", error);
  } finally {
    process.exit(0);
  }
}

askCloudflare();
EOF
else
  echo "✅ scripts/ask-cloudflare.ts already exists."
fi

# --- 5. Validation ---
echo "✅ Environment Ready."
echo "👉 Try it: pnpm exec tsx scripts/ask-cloudflare.ts 'How do I use D1?'"
