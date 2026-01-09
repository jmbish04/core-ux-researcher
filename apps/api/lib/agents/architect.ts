/**
 * @file architect.ts
 * @description
 * ArchitectAgent - The Synthesizer.
 * Combines backend logic and visual research to generate
 * the final UX Research Report with wireframes and coding prompts.
 */

import { Agent } from "agents";
import { queryGemini } from "../ai/providers/gemini";
import type {
  ComponentRecommendation,
  UXResearchReport,
  UXResearchRequest,
  WireframeSpec,
} from "../zod-schema";

/**
 * State interface for the Architect Agent.
 */
export interface ArchitectState {
  requestId: string;
  report: UXResearchReport | null;
}

/**
 * ArchitectAgent - Expert in synthesizing research into actionable specs.
 *
 * Responsibilities:
 * 1. Analyze semantic map and visual research
 * 2. Generate user intentionality report
 * 3. Create user stories mapped to database tables
 * 4. Design wireframe specifications
 * 5. Generate coding prompts for AI assistants
 */
export class ArchitectAgent extends Agent<Env, ArchitectState> {
  agentName = "ArchitectAgent";

  /**
   * Handle incoming HTTP requests.
   */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/status") {
      return Response.json({
        requestId: this.state?.requestId,
        hasReport: !!this.state?.report,
      });
    }

    if (url.pathname === "/report" && this.state?.report) {
      return Response.json(this.state.report);
    }

    return new Response("Architect Agent Ready", { status: 200 });
  }

  /**
   * Main synthesis entry point.
   * Generates the final UX Research Report.
   */
  async synthesize(
    requestId: string,
    semanticMap: UXResearchReport["semanticMap"],
    visualResearch: {
      moodBoard: string[];
      componentRecommendations: ComponentRecommendation[];
    },
    payload: UXResearchRequest,
  ): Promise<UXResearchReport> {
    console.log(`[ArchitectAgent] Starting synthesis for ${requestId}`);

    // Initialize state
    this.setState({
      requestId,
      report: null,
    });

    // Step 1: Infer user context and audience
    const userContext = await this.analyzeUserContext(
      semanticMap,
      payload.userIntent,
    );
    console.log(`[ArchitectAgent] Inferred context: ${userContext.context}`);

    // Step 2: Generate user stories
    const userStories = await this.generateUserStories(
      semanticMap,
      userContext,
    );
    console.log(
      `[ArchitectAgent] Generated ${userStories.length} user stories`,
    );

    // Step 3: Design wireframes
    const wireframes = await this.designWireframes(
      semanticMap,
      userContext,
      visualResearch,
    );
    console.log(`[ArchitectAgent] Designed ${wireframes.length} wireframes`);

    // Step 4: Generate coding prompts
    const codingPrompts = this.generateCodingPrompts(
      semanticMap,
      userStories,
      wireframes,
      visualResearch.componentRecommendations,
    );
    console.log(
      `[ArchitectAgent] Generated ${codingPrompts.length} coding prompts`,
    );

    // Assemble the final report
    const report: UXResearchReport = {
      id: requestId,
      repoUrl: payload.repoUrl,
      createdAt: new Date().toISOString(),
      semanticMap,
      targetAudience: userContext.targetAudience,
      coreProblem: userContext.coreProblem,
      context: userContext.context,
      userStories,
      wireframes,
      recommendedStack: visualResearch.componentRecommendations,
      codingPrompts,
    };

    this.setState({ ...this.state!, report });

    return report;
  }

  /**
   * Analyze user context from semantic map and intent.
   */
  private async analyzeUserContext(
    semanticMap: UXResearchReport["semanticMap"],
    userIntent?: string,
  ): Promise<{
    targetAudience: string;
    coreProblem: string;
    context: UXResearchReport["context"];
  }> {
    const tableNames = semanticMap.tables.map((t) => t.name).join(", ");
    const apiPaths =
      semanticMap.apiRoutes?.map((r) => r.path).join(", ") || "N/A";

    // Use AI to analyze context if available
    try {
      const prompt = `
Analyze this backend structure and determine:
1. Who is the target audience?
2. What core problem does this application solve?
3. What type of application is this?

DATABASE TABLES: ${tableNames}
API ROUTES: ${apiPaths}
USER INTENT: ${userIntent || "Not specified"}

Respond in JSON format:
{
  "targetAudience": "Brief description of target users",
  "coreProblem": "Core problem being solved",
  "context": "internal-tool" | "b2c" | "b2b-saas" | "marketplace" | "portfolio" | "other"
}`;

      const response = await queryGemini(
        this.env,
        prompt,
        "Analyze and respond with JSON only.",
      );
      const parsed = JSON.parse(
        response.replace(/```json\n?|\n?```/g, "").trim(),
      );

      return {
        targetAudience: parsed.targetAudience || "General users",
        coreProblem: parsed.coreProblem || "Managing data and workflows",
        context: parsed.context || "other",
      };
    } catch (e) {
      console.warn(
        `[ArchitectAgent] AI analysis failed, using heuristics: ${e}`,
      );
      return this.inferContextFromHeuristics(semanticMap);
    }
  }

  /**
   * Fallback heuristic analysis when AI is unavailable.
   */
  private inferContextFromHeuristics(
    semanticMap: UXResearchReport["semanticMap"],
  ): {
    targetAudience: string;
    coreProblem: string;
    context: UXResearchReport["context"];
  } {
    const tableNames = semanticMap.tables.map((t) => t.name.toLowerCase());

    if (
      tableNames.some((t) => /organization|team|subscription|billing/i.test(t))
    ) {
      return {
        targetAudience: "Business teams and organizations",
        coreProblem: "Managing team workflows and subscriptions",
        context: "b2b-saas",
      };
    }

    if (tableNames.some((t) => /product|order|cart/i.test(t))) {
      return {
        targetAudience: "Online shoppers",
        coreProblem: "Purchasing products online",
        context: "marketplace",
      };
    }

    if (tableNames.some((t) => /admin|internal|employee/i.test(t))) {
      return {
        targetAudience: "Internal team members",
        coreProblem: "Managing internal operations",
        context: "internal-tool",
      };
    }

    return {
      targetAudience: "General users",
      coreProblem: "Accessing and managing information",
      context: "other",
    };
  }

  /**
   * Generate user stories mapped to database tables.
   */
  private async generateUserStories(
    semanticMap: UXResearchReport["semanticMap"],
    userContext: { targetAudience: string; context: string },
  ): Promise<UXResearchReport["userStories"]> {
    const stories: UXResearchReport["userStories"] = [];

    // Generate stories for each major table
    for (const table of semanticMap.tables.slice(0, 8)) {
      const story = this.generateStoryForTable(table, userContext);
      if (story) {
        stories.push(story);
      }
    }

    return stories;
  }

  /**
   * Generate a user story for a specific table.
   */
  private generateStoryForTable(
    table: { name: string; fields: string[]; relationships?: string[] },
    _userContext: { targetAudience: string; context: string },
  ): UXResearchReport["userStories"][0] | null {
    // userContext is intentionally kept for future use
    void _userContext;
    const tableName = table.name.toLowerCase();
    const fields = table.fields.map((f) => f.toLowerCase());

    // User/Account tables
    if (/user|account|profile/i.test(tableName)) {
      return {
        asA: "registered user",
        iWantTo: "manage my profile and account settings",
        soThat: "I can keep my information up to date",
        mappedTo: table.name,
      };
    }

    // Organization/Team tables
    if (/organization|team|workspace/i.test(tableName)) {
      return {
        asA: "team admin",
        iWantTo: `manage ${tableName} members and settings`,
        soThat: "I can control access and configuration",
        mappedTo: table.name,
      };
    }

    // Product/Item tables
    if (/product|item|inventory/i.test(tableName)) {
      return {
        asA: "customer",
        iWantTo: "browse and search products",
        soThat: "I can find what I'm looking for",
        mappedTo: table.name,
      };
    }

    // Order/Transaction tables
    if (/order|transaction|purchase/i.test(tableName)) {
      return {
        asA: "customer",
        iWantTo: "view my order history",
        soThat: "I can track my purchases",
        mappedTo: table.name,
      };
    }

    // Message/Notification tables
    if (/message|notification|alert/i.test(tableName)) {
      return {
        asA: "user",
        iWantTo: "receive and manage notifications",
        soThat: "I stay informed about important updates",
        mappedTo: table.name,
      };
    }

    // Session/Auth tables
    if (/session|auth|token/i.test(tableName)) {
      return {
        asA: "user",
        iWantTo: "securely log in and manage sessions",
        soThat: "my account remains protected",
        mappedTo: table.name,
      };
    }

    // Generic table story
    if (fields.length >= 3) {
      return {
        asA: "user",
        iWantTo: `view and manage ${tableName.replace(/_/g, " ")}`,
        soThat: "I can access relevant information",
        mappedTo: table.name,
      };
    }

    return null;
  }

  /**
   * Design wireframe specifications based on analysis.
   */
  private async designWireframes(
    semanticMap: UXResearchReport["semanticMap"],
    _userContext: { targetAudience: string; context: string },
    _visualResearch: { componentRecommendations: ComponentRecommendation[] },
  ): Promise<WireframeSpec[]> {
    // userContext and visualResearch are intentionally kept for future use
    void _userContext;
    void _visualResearch;
    const wireframes: WireframeSpec[] = [];

    // Dashboard/Home screen
    wireframes.push({
      screenName: "Dashboard",
      layout: "dashboard",
      zones: [
        {
          id: "header",
          name: "Navigation Header",
          type: "header",
          components: ["Navbar", "UserMenu", "Search"],
        },
        {
          id: "sidebar",
          name: "Side Navigation",
          type: "sidebar",
          components: ["SidebarNav", "QuickLinks"],
        },
        {
          id: "main-metrics",
          name: "Key Metrics",
          type: "card",
          dataSource: semanticMap.tables[0]?.name || "metrics",
          components: ["StatCard", "TrendIndicator"],
        },
        {
          id: "main-chart",
          name: "Analytics Chart",
          type: "chart",
          dataSource: "analytics",
          components: ["AreaChart", "DateRangePicker"],
        },
        {
          id: "recent-activity",
          name: "Recent Activity",
          type: "table",
          dataSource: semanticMap.tables[0]?.name,
          components: ["DataTable", "Pagination"],
        },
      ],
    });

    // List/Table view for primary entity
    const primaryTable = semanticMap.tables[0];
    if (primaryTable) {
      wireframes.push({
        screenName: `${primaryTable.name} List`,
        layout: "list",
        zones: [
          {
            id: "header",
            name: "Page Header",
            type: "header",
            components: ["PageTitle", "CreateButton", "FilterBar"],
          },
          {
            id: "main-table",
            name: "Data Table",
            type: "table",
            dataSource: primaryTable.name,
            components: ["DataTable", "SortableColumns", "RowActions"],
          },
          {
            id: "pagination",
            name: "Pagination",
            type: "footer",
            components: ["Pagination", "ItemsPerPage"],
          },
        ],
      });
    }

    // Detail/Edit view
    if (primaryTable && primaryTable.fields.length > 3) {
      wireframes.push({
        screenName: `${primaryTable.name} Detail`,
        layout: "two-column",
        zones: [
          {
            id: "header",
            name: "Detail Header",
            type: "header",
            dataSource: primaryTable.name,
            components: ["Breadcrumb", "EntityTitle", "ActionButtons"],
          },
          {
            id: "main-content",
            name: "Main Information",
            type: "card",
            dataSource: primaryTable.name,
            components: ["FormFields", "ValidationMessages"],
          },
          {
            id: "sidebar-info",
            name: "Additional Info",
            type: "sidebar",
            dataSource: primaryTable.relationships?.[0] || primaryTable.name,
            components: ["InfoCard", "RelatedItems"],
          },
        ],
      });
    }

    // Settings screen
    wireframes.push({
      screenName: "Settings",
      layout: "single-column",
      zones: [
        {
          id: "header",
          name: "Settings Header",
          type: "header",
          components: ["PageTitle", "TabNavigation"],
        },
        {
          id: "settings-form",
          name: "Settings Form",
          type: "form",
          dataSource: "user",
          components: ["SettingsForm", "SaveButton", "ResetButton"],
        },
      ],
    });

    return wireframes;
  }

  /**
   * Generate coding prompts for AI assistants.
   */
  private generateCodingPrompts(
    semanticMap: UXResearchReport["semanticMap"],
    userStories: UXResearchReport["userStories"],
    wireframes: WireframeSpec[],
    recommendations: ComponentRecommendation[],
  ): UXResearchReport["codingPrompts"] {
    const tableNames = semanticMap.tables.map((t) => t.name).join(", ");
    const registryList = recommendations
      .map((r) => `${r.registry}: ${r.componentName}`)
      .join("\n");

    return [
      {
        title: "Project Setup & Theme Configuration",
        prompt: `# Project Setup Prompt

## Context
I'm building a React application with the following database structure:
${semanticMap.tables.map((t) => `- ${t.name}: ${t.fields.slice(0, 5).join(", ")}${t.fields.length > 5 ? "..." : ""}`).join("\n")}

## Task
1. Initialize a new Next.js/Vite project with TypeScript
2. Install and configure shadcn/ui with the following registries:
${registryList}

3. Set up the theme with:
   - Dark mode support using next-themes
   - Custom color palette matching modern SaaS design
   - Typography scale for headings and body text

4. Create the basic layout structure:
   - App shell with sidebar navigation
   - Header with user menu
   - Main content area with proper spacing

## Expected Output
- Complete project structure
- Configured tailwind.config.ts
- Basic layout components
- Theme provider setup`,
      },
      {
        title: "Feature Implementation - Core CRUD",
        prompt: `# Core Feature Implementation Prompt

## Context
Building on the project setup, I need to implement the core CRUD features for:
${userStories
  .slice(0, 4)
  .map((s) => `- As a ${s.asA}, I want to ${s.iWantTo} (${s.mappedTo})`)
  .join("\n")}

## Database Schema
${semanticMap.tables
  .slice(0, 4)
  .map(
    (t) => `
### ${t.name}
Fields: ${t.fields.join(", ")}
${t.relationships ? `Relations: ${t.relationships.join(", ")}` : ""}`,
  )
  .join("\n")}

## Wireframe Reference
${wireframes
  .slice(0, 2)
  .map(
    (w) => `
### ${w.screenName} (${w.layout})
Zones: ${w.zones.map((z) => z.name).join(", ")}`,
  )
  .join("\n")}

## Task
1. Create TypeScript types matching the database schema
2. Implement tRPC routers for CRUD operations:
   - List with pagination and filtering
   - Get single by ID
   - Create with validation
   - Update with optimistic updates
   - Delete with confirmation

3. Build the UI components:
   - Data table with sorting and filtering
   - Create/Edit form with validation
   - Detail view with related data

4. Add loading states, error handling, and toast notifications

## Expected Output
- Type definitions
- tRPC router implementation
- React components with proper state management
- Form validation using zod`,
      },
      {
        title: "Dashboard & Analytics",
        prompt: `# Dashboard Implementation Prompt

## Context
Creating the main dashboard view with analytics and metrics.

## Data Sources
Tables: ${tableNames}

## Wireframe
${wireframes.find((w) => w.screenName === "Dashboard") ? JSON.stringify(wireframes.find((w) => w.screenName === "Dashboard")?.zones, null, 2) : "See Dashboard wireframe above"}

## Task
1. Create metric cards showing key stats:
   - Total counts from main tables
   - Trend indicators (up/down arrows)
   - Percentage changes

2. Implement charts using Tremor or similar:
   - Area chart for time-series data
   - Bar chart for comparisons
   - Date range picker for filtering

3. Add recent activity feed:
   - Real-time updates if possible
   - Grouped by date
   - Action links to detail views

## Expected Output
- Dashboard page component
- Reusable metric card components
- Chart components with proper data fetching
- Activity feed with infinite scroll`,
      },
    ];
  }
}
