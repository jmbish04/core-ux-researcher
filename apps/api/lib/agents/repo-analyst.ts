/**
 * @file repo-analyst.ts
 * @description
 * RepoAnalystAgent - The Backend Expert.
 * Uses GitHub tools to recursively fetch file trees, read schema files,
 * and extract a semantic map of the application's data models and business logic.
 */

import { Agent } from "agents";
import { getOctokit } from "./tools/github/core";
import type { UXResearchReport } from "../zod-schema";

/**
 * State interface for the Repo Analyst Agent.
 */
export interface RepoAnalystState {
  requestId: string;
  repoUrl: string;
  owner: string;
  repo: string;
  fileTree: string[];
  schemaContent: string;
  apiRoutes: Array<{ path: string; method: string; description?: string }>;
}

/**
 * Patterns to identify schema files in a repository.
 */
const SCHEMA_PATTERNS = [
  /schema\.prisma$/i,
  /drizzle\.schema\.ts$/i,
  /schema\.ts$/i,
  /models\.ts$/i,
  /entities\.ts$/i,
  /migrations\//i,
];

/**
 * Patterns to identify API route files.
 */
const API_ROUTE_PATTERNS = [
  /routes?\//i,
  /api\//i,
  /routers?\//i,
  /controllers?\//i,
  /handlers?\//i,
];

/**
 * RepoAnalystAgent - Expert in backend code analysis.
 *
 * Responsibilities:
 * 1. Parse GitHub URL to extract owner/repo
 * 2. Fetch repository file tree
 * 3. Identify and read schema files (Prisma, Drizzle, etc.)
 * 4. Extract data models and relationships
 * 5. Map API routes to their handlers
 */
export class RepoAnalystAgent extends Agent<Env, RepoAnalystState> {
  agentName = "RepoAnalystAgent";

  /**
   * Parse a GitHub URL into owner and repo.
   */
  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub URL: ${url}`);
    }
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ""),
    };
  }

  /**
   * Handle incoming HTTP requests.
   */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/status") {
      return Response.json({
        requestId: this.state?.requestId,
        fileCount: this.state?.fileTree?.length || 0,
      });
    }

    return new Response("RepoAnalyst Agent Ready", { status: 200 });
  }

  /**
   * Main analysis entry point.
   * Analyzes a GitHub repository and returns a semantic map.
   */
  async analyze(
    requestId: string,
    repoUrl: string,
  ): Promise<UXResearchReport["semanticMap"]> {
    console.log(`[RepoAnalystAgent] Starting analysis for ${repoUrl}`);

    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const octokit = getOctokit(this.env);

    // Initialize state
    this.setState({
      requestId,
      repoUrl,
      owner,
      repo,
      fileTree: [],
      schemaContent: "",
      apiRoutes: [],
    });

    // Step 1: Fetch file tree
    console.log(`[RepoAnalystAgent] Fetching file tree for ${owner}/${repo}`);
    const fileTree = await this.fetchFileTree(octokit, owner, repo);
    this.setState({ ...this.state!, fileTree });
    console.log(`[RepoAnalystAgent] Found ${fileTree.length} files`);

    // Step 2: Find and read schema files
    console.log(`[RepoAnalystAgent] Searching for schema files...`);
    const schemaFiles = fileTree.filter((path) =>
      SCHEMA_PATTERNS.some((pattern) => pattern.test(path)),
    );
    console.log(`[RepoAnalystAgent] Found ${schemaFiles.length} schema files`);

    let schemaContent = "";
    for (const schemaPath of schemaFiles.slice(0, 5)) {
      try {
        const content = await this.fetchFileContent(octokit, owner, repo, schemaPath);
        schemaContent += `\n// --- ${schemaPath} ---\n${content}\n`;
      } catch (e) {
        console.warn(`[RepoAnalystAgent] Could not read ${schemaPath}: ${e}`);
      }
    }
    this.setState({ ...this.state!, schemaContent });

    // Step 3: Find API routes
    console.log(`[RepoAnalystAgent] Searching for API routes...`);
    const apiRouteFiles = fileTree.filter((path) =>
      API_ROUTE_PATTERNS.some((pattern) => pattern.test(path)),
    );
    
    const apiRoutes: RepoAnalystState["apiRoutes"] = [];
    for (const routePath of apiRouteFiles.slice(0, 10)) {
      try {
        const content = await this.fetchFileContent(octokit, owner, repo, routePath);
        const extractedRoutes = this.extractRoutesFromFile(routePath, content);
        apiRoutes.push(...extractedRoutes);
      } catch (e) {
        console.warn(`[RepoAnalystAgent] Could not read ${routePath}: ${e}`);
      }
    }
    this.setState({ ...this.state!, apiRoutes });
    console.log(`[RepoAnalystAgent] Found ${apiRoutes.length} API routes`);

    // Step 4: Parse schema to extract tables
    const tables = this.parseSchemaToTables(schemaContent);
    console.log(`[RepoAnalystAgent] Extracted ${tables.length} database tables`);

    return {
      tables,
      apiRoutes: apiRoutes.length > 0 ? apiRoutes : undefined,
    };
  }

  /**
   * Fetch the file tree of a repository.
   */
  private async fetchFileTree(
    octokit: ReturnType<typeof getOctokit>,
    owner: string,
    repo: string,
    path: string = "",
    depth: number = 0,
  ): Promise<string[]> {
    if (depth > 3) return []; // Limit recursion depth

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if (!Array.isArray(data)) {
        return [path];
      }

      const files: string[] = [];
      for (const item of data) {
        if (item.type === "file") {
          files.push(item.path);
        } else if (item.type === "dir" && !item.name.startsWith(".") && item.name !== "node_modules") {
          const subFiles = await this.fetchFileTree(octokit, owner, repo, item.path, depth + 1);
          files.push(...subFiles);
        }
      }

      return files;
    } catch (e) {
      console.warn(`[RepoAnalystAgent] Error fetching tree at ${path}: ${e}`);
      return [];
    }
  }

  /**
   * Fetch the content of a specific file.
   */
  private async fetchFileContent(
    octokit: ReturnType<typeof getOctokit>,
    owner: string,
    repo: string,
    path: string,
  ): Promise<string> {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data) || !("content" in data)) {
      throw new Error(`Path '${path}' is not a file`);
    }

    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  /**
   * Extract route definitions from a file.
   */
  private extractRoutesFromFile(
    filePath: string,
    content: string,
  ): Array<{ path: string; method: string; description?: string }> {
    const routes: Array<{ path: string; method: string; description?: string }> = [];

    // Match common route patterns
    const patterns = [
      // Express/Hono style: app.get('/path', ...)
      /\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      // tRPC style: procedure.query/mutation
      /(\w+):\s*(publicProcedure|protectedProcedure|procedure)\s*\.\s*(query|mutation)/gi,
      // Next.js API routes (file-based)
      /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[2] && match[1]) {
          routes.push({
            method: match[1].toUpperCase(),
            path: match[2],
          });
        } else if (match[3]) {
          // tRPC-style
          routes.push({
            method: match[3] === "query" ? "GET" : "POST",
            path: `/${filePath.replace(/\.(ts|js)$/, "")}/${match[1] || "procedure"}`,
          });
        }
      }
    }

    // Dedupe and return
    return routes.filter((r, i, arr) => 
      arr.findIndex(x => x.path === r.path && x.method === r.method) === i
    );
  }

  /**
   * Parse schema content to extract table definitions.
   */
  private parseSchemaToTables(
    schemaContent: string,
  ): Array<{ name: string; fields: string[]; relationships?: string[] }> {
    const tables: Array<{ name: string; fields: string[]; relationships?: string[] }> = [];

    // Prisma model pattern
    const prismaModelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = prismaModelRegex.exec(schemaContent)) !== null) {
      const modelName = match[1];
      const bodyContent = match[2];
      
      const fields: string[] = [];
      const relationships: string[] = [];
      
      const lines = bodyContent.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) continue;
        
        const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)/);
        if (fieldMatch) {
          fields.push(fieldMatch[1]);
          
          // Check for relations
          if (trimmed.includes("@relation") || /\[\]$/.test(fieldMatch[2])) {
            relationships.push(fieldMatch[1]);
          }
        }
      }
      
      tables.push({
        name: modelName,
        fields,
        relationships: relationships.length > 0 ? relationships : undefined,
      });
    }

    // Drizzle table pattern
    const drizzleTableRegex = /export\s+const\s+(\w+)\s*=\s*(?:pgTable|sqliteTable|mysqlTable)\s*\(\s*['"`](\w+)['"`]\s*,\s*\{([^}]+)\}/g;
    while ((match = drizzleTableRegex.exec(schemaContent)) !== null) {
      const tableName = match[2];
      const bodyContent = match[3];
      
      const fields: string[] = [];
      const fieldMatches = bodyContent.matchAll(/(\w+)\s*:/g);
      for (const fieldMatch of fieldMatches) {
        fields.push(fieldMatch[1]);
      }
      
      tables.push({
        name: tableName,
        fields,
      });
    }

    return tables;
  }
}
