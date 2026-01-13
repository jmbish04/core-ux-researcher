/**
 * @file ux-orchestrator.ts
 * @description
 * UX Research Orchestrator Agent - The Team Lead.
 * Receives user's Repo URL, decomposes tasks into sub-goals,
 * coordinates the RepoAnalyst, StyleScout, and Architect agents.
 */

import { Agent } from "agents";
import type {
  AgentPhase,
  UXResearchReport,
  UXResearchRequest,
} from "../zod-schema";

/**
 * Durable Object stub interface for RPC calls.
 * Using unknown return type for RPC methods as the actual types
 * are resolved at runtime based on the Durable Object implementation.
 */
interface DurableObjectStub {
  analyze: (
    requestId: string,
    repoUrl: string,
  ) => Promise<UXResearchReport["semanticMap"]>;
  scout: (
    requestId: string,
    semanticMap: UXResearchReport["semanticMap"],
    targetRegistries?: string[],
  ) => Promise<{
    moodBoard: string[];
    componentRecommendations: UXResearchReport["recommendedStack"];
  }>;
  synthesize: (
    requestId: string,
    semanticMap: UXResearchReport["semanticMap"],
    visualResearch: {
      moodBoard: string[];
      componentRecommendations: UXResearchReport["recommendedStack"];
    },
    payload: UXResearchRequest,
  ) => Promise<UXResearchReport>;
}

/**
 * State interface for the UX Orchestrator Agent.
 */
export interface UXOrchestratorState {
  requestId: string;
  repoUrl: string;
  userIntent?: string;
  phase: AgentPhase;
  progress: number;
  history: { role: string; content: string }[];
  logs: Array<{
    timestamp: string;
    level: "info" | "warn" | "error";
    message: string;
    data?: unknown;
  }>;
  // Sub-agent results
  semanticMap?: UXResearchReport["semanticMap"];
  visualResearch?: {
    moodBoard: string[];
    componentRecommendations: UXResearchReport["recommendedStack"];
  };
  finalReport?: UXResearchReport;
}

/**
 * UXOrchestratorAgent - The Team Lead for UX Research.
 *
 * Responsibilities:
 * 1. Receives the user's Repo URL
 * 2. Decomposes the task into sub-goals
 * 3. Manages state/memory across the lifecycle
 * 4. Coordinates the Swarm: RepoAnalyst -> StyleScout -> Architect
 */
export class UXOrchestratorAgent extends Agent<Env, UXOrchestratorState> {
  agentName = "UXOrchestratorAgent";

  /**
   * Initialize default state for a new research session.
   */
  private initializeState(
    requestId: string,
    repoUrl: string,
    userIntent?: string,
  ): UXOrchestratorState {
    return {
      requestId,
      repoUrl,
      userIntent,
      phase: "idle",
      progress: 0,
      history: [],
      logs: [],
    };
  }

  /**
   * Append a log entry and broadcast to connected clients.
   */
  private log(
    level: "info" | "warn" | "error",
    message: string,
    data?: unknown,
  ) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    const currentState = this.state!;
    this.setState({
      ...currentState,
      logs: [...(currentState.logs || []), entry],
    });

    // Broadcast to WebSocket clients
    this.broadcast("log", entry);
    console.log(`[${this.agentName}] [${level}] ${message}`);
  }

  /**
   * Update the current phase and broadcast to clients.
   */
  private setPhase(phase: AgentPhase, progress: number) {
    const currentState = this.state!;
    this.setState({
      ...currentState,
      phase,
      progress,
    });

    this.broadcast("phase", { phase, progress });
  }

  /**
   * Handle incoming HTTP requests.
   */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for real-time streaming
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected websocket", { status: 400 });
      }
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      this.ctx.acceptWebSocket(server);
      server.send(JSON.stringify({ type: "connected", agent: this.agentName }));
      return new Response(null, { status: 101, webSocket: client });
    }

    // Status endpoint
    if (url.pathname === "/status") {
      return Response.json({
        phase: this.state?.phase || "idle",
        progress: this.state?.progress || 0,
        logs: this.state?.logs || [],
      });
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Start the UX Research workflow.
   */
  async start(
    requestId: string,
    payload: UXResearchRequest,
  ): Promise<{ status: string }> {
    // Initialize state
    this.setState(
      this.initializeState(requestId, payload.repoUrl, payload.userIntent),
    );

    this.log("info", "🚀 Starting UX Research workflow", {
      repoUrl: payload.repoUrl,
    });
    this.setPhase("idle", 0);

    // Run the workflow asynchronously
    this.ctx.waitUntil(this.runWorkflow(requestId, payload));

    return { status: "started" };
  }

  /**
   * Main workflow orchestration.
   * Coordinates: RepoAnalyst -> StyleScout -> Architect
   */
  private async runWorkflow(requestId: string, payload: UXResearchRequest) {
    try {
      // Phase 1: Repository Analysis
      this.setPhase("analyzing_repo", 0.05);
      this.log("info", "📊 Phase 1: Analyzing repository structure...");

      const semanticMap = await this.runRepoAnalyst(requestId, payload.repoUrl);

      const currentState = this.state!;
      this.setState({ ...currentState, semanticMap });
      this.log(
        "info",
        `✅ Found ${semanticMap.tables.length} database tables`,
        { tables: semanticMap.tables.map((t) => t.name) },
      );

      // Phase 2: Visual Research
      this.setPhase("browsing_registries", 0.35);
      this.log("info", "🎨 Phase 2: Scouting component registries...");

      const visualResearch = await this.runStyleScout(
        requestId,
        semanticMap,
        payload.targetRegistries,
      );

      this.setState({ ...this.state!, visualResearch });
      this.log(
        "info",
        `📸 Captured ${visualResearch.moodBoard.length} screenshots`,
        {
          recommendations: visualResearch.componentRecommendations.length,
        },
      );

      // Phase 3: Architecture & Report Generation
      this.setPhase("synthesizing", 0.7);
      this.log("info", "🧠 Phase 3: Synthesizing architecture report...");

      const finalReport = await this.runArchitect(
        requestId,
        semanticMap,
        visualResearch,
        payload,
      );

      this.setState({ ...this.state!, finalReport });
      this.log("info", "📝 Generated final UX Research Report");

      // Complete
      this.setPhase("complete", 1.0);
      this.log("info", "🎉 UX Research workflow complete!");

      // Broadcast the final report
      this.broadcast("report", finalReport);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.setPhase("error", this.state?.progress || 0);
      this.log("error", `❌ Workflow failed: ${errorMessage}`, {
        error: errorMessage,
      });
    }
  }

  /**
   * Delegate to RepoAnalystAgent for backend analysis.
   */
  private async runRepoAnalyst(
    requestId: string,
    repoUrl: string,
  ): Promise<UXResearchReport["semanticMap"]> {
    this.log("info", "🔍 Delegating to RepoAnalyst...");

    // Get the RepoAnalyst Durable Object stub
    const analystId = this.env.REPO_ANALYST.idFromName(requestId);
    const analystStub = this.env.REPO_ANALYST.get(
      analystId,
    ) as DurableObjectStub;

    // Call the agent's analyze method via RPC
    const result = await analystStub.analyze(requestId, repoUrl);

    return result;
  }

  /**
   * Delegate to StyleScoutAgent for visual research.
   */
  private async runStyleScout(
    requestId: string,
    semanticMap: UXResearchReport["semanticMap"],
    targetRegistries?: string[],
  ): Promise<{
    moodBoard: string[];
    componentRecommendations: UXResearchReport["recommendedStack"];
  }> {
    this.log("info", "🎯 Delegating to StyleScout...");

    // Get the StyleScout Durable Object stub
    const scoutId = this.env.STYLE_SCOUT.idFromName(requestId);
    const scoutStub = this.env.STYLE_SCOUT.get(scoutId) as DurableObjectStub;

    // Call the agent's scout method via RPC
    const result = await scoutStub.scout(
      requestId,
      semanticMap,
      targetRegistries,
    );

    return result;
  }

  /**
   * Delegate to ArchitectAgent for report synthesis.
   */
  private async runArchitect(
    requestId: string,
    semanticMap: UXResearchReport["semanticMap"],
    visualResearch: {
      moodBoard: string[];
      componentRecommendations: UXResearchReport["recommendedStack"];
    },
    payload: UXResearchRequest,
  ): Promise<UXResearchReport> {
    this.log("info", "🏗️ Delegating to Architect...");

    // Get the Architect Durable Object stub
    const architectId = this.env.ARCHITECT.idFromName(requestId);
    const architectStub = this.env.ARCHITECT.get(
      architectId,
    ) as DurableObjectStub;

    // Call the agent's synthesize method via RPC
    const result = await architectStub.synthesize(
      requestId,
      semanticMap,
      visualResearch,
      payload,
    );

    return result;
  }

  /**
   * Handle WebSocket messages.
   */
  override async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ) {
    try {
      const text =
        typeof message === "string"
          ? message
          : new TextDecoder().decode(message);
      const obj = JSON.parse(text);

      if (obj?.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", ts: new Date().toISOString() }));
      } else if (obj?.type === "status") {
        ws.send(
          JSON.stringify({
            type: "status",
            phase: this.state?.phase || "idle",
            progress: this.state?.progress || 0,
          }),
        );
      }
    } catch {
      ws.send(JSON.stringify({ type: "ack" }));
    }
  }

  /**
   * Broadcast a message to all connected WebSocket clients.
   */
  override broadcast(type: string, payload: unknown) {
    this.ctx.getWebSockets().forEach((ws) => {
      try {
        ws.send(JSON.stringify({ type, payload }));
      } catch {
        // Ignore send errors for disconnected clients
      }
    });
  }
}
