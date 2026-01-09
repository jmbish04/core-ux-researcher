/**
 * @file style-scout.ts
 * @description
 * StyleScoutAgent - The Visual Researcher.
 * Uses browser rendering to browse component registries,
 * capture screenshots, and build a visual mood board.
 */

import { Agent } from "agents";
import type { ComponentRecommendation, UXResearchReport } from "../zod-schema";

/**
 * State interface for the Style Scout Agent.
 */
export interface StyleScoutState {
  requestId: string;
  visitedUrls: string[];
  screenshots: string[];
  recommendations: ComponentRecommendation[];
}

/**
 * Registry information for component libraries.
 */
interface RegistryInfo {
  name: string;
  url: string;
  category: string;
  description: string;
}

/**
 * Database of known shadcn component registries.
 * This would ideally be stored in Vectorize or D1 for querying.
 */
const COMPONENT_REGISTRIES: RegistryInfo[] = [
  {
    name: "@magicui",
    url: "https://magicui.design",
    category: "creative",
    description: "150+ free and open-source animated components for landing pages",
  },
  {
    name: "@aceternity",
    url: "https://ui.aceternity.com",
    category: "creative",
    description: "Modern component library with unique animations and effects",
  },
  {
    name: "@shadcnblocks",
    url: "https://shadcnblocks.com",
    category: "general",
    description: "Hundreds of extra blocks for shadcn/ui",
  },
  {
    name: "@origin-ui",
    url: "https://originui.com",
    category: "general",
    description: "Beautiful, copy-paste UI components",
  },
  {
    name: "@cult-ui",
    url: "https://www.cult-ui.com",
    category: "creative",
    description: "Curated set of headless and composable components with Framer Motion",
  },
  {
    name: "@tremor",
    url: "https://www.tremor.so",
    category: "functional",
    description: "React components for dashboards and data visualization",
  },
  {
    name: "@plate",
    url: "https://platejs.org",
    category: "functional",
    description: "AI-powered rich text editor for React",
  },
  {
    name: "@assistant-ui",
    url: "https://www.assistant-ui.com",
    category: "ai",
    description: "React primitives for AI chat interfaces",
  },
  {
    name: "@supabase",
    url: "https://supabase.com/ui",
    category: "functional",
    description: "Components that connect to Supabase backend",
  },
  {
    name: "@clerk",
    url: "https://clerk.com",
    category: "functional",
    description: "Authentication and user management components",
  },
  {
    name: "@8bitcn",
    url: "https://www.8bitcn.com",
    category: "retro",
    description: "8-bit styled retro components",
  },
  {
    name: "@retroui",
    url: "https://retroui.dev",
    category: "retro",
    description: "Neobrutalism styled components",
  },
  {
    name: "@kokonutui",
    url: "https://kokonutui.com",
    category: "creative",
    description: "Stunning components with Tailwind CSS and Motion",
  },
  {
    name: "@billingsdk",
    url: "https://billingsdk.com",
    category: "functional",
    description: "React components for SaaS billing and payments",
  },
  {
    name: "@lytenyte",
    url: "https://www.1771technologies.com",
    category: "functional",
    description: "High performance data grid component",
  },
];

/**
 * StyleScoutAgent - Expert in visual component research.
 *
 * Responsibilities:
 * 1. Analyze the semantic map to understand data needs
 * 2. Query registry database to find relevant components
 * 3. Browse registry demo pages using browser rendering
 * 4. Capture screenshots for mood board
 * 5. Generate component recommendations
 */
export class StyleScoutAgent extends Agent<Env, StyleScoutState> {
  agentName = "StyleScoutAgent";

  /**
   * Handle incoming HTTP requests.
   */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/status") {
      return Response.json({
        requestId: this.state?.requestId,
        visitedCount: this.state?.visitedUrls?.length || 0,
        screenshotCount: this.state?.screenshots?.length || 0,
      });
    }

    return new Response("StyleScout Agent Ready", { status: 200 });
  }

  /**
   * Main scouting entry point.
   * Analyzes semantic map and researches visual components.
   */
  async scout(
    requestId: string,
    semanticMap: UXResearchReport["semanticMap"],
    targetRegistries?: string[],
  ): Promise<{
    moodBoard: string[];
    componentRecommendations: ComponentRecommendation[];
  }> {
    console.log(`[StyleScoutAgent] Starting visual research for ${requestId}`);

    // Initialize state
    this.setState({
      requestId,
      visitedUrls: [],
      screenshots: [],
      recommendations: [],
    });

    // Step 1: Infer project context from semantic map
    const projectContext = this.inferProjectContext(semanticMap);
    console.log(`[StyleScoutAgent] Inferred context: ${projectContext.type}`);

    // Step 2: Select relevant registries
    const selectedRegistries = this.selectRegistries(projectContext, targetRegistries);
    console.log(`[StyleScoutAgent] Selected ${selectedRegistries.length} registries`);

    // Step 3: Generate component recommendations based on data needs
    const recommendations = this.generateRecommendations(semanticMap, selectedRegistries, projectContext);
    
    // Step 4: Capture screenshots (if browser rendering is available)
    const screenshots = await this.captureScreenshots(selectedRegistries);

    this.setState({
      ...this.state!,
      recommendations,
      screenshots,
    });

    return {
      moodBoard: screenshots,
      componentRecommendations: recommendations,
    };
  }

  /**
   * Infer project context from semantic map.
   */
  private inferProjectContext(semanticMap: UXResearchReport["semanticMap"]): {
    type: "saas" | "ecommerce" | "dashboard" | "portfolio" | "social" | "general";
    features: string[];
  } {
    const tableNames = semanticMap.tables.map((t) => t.name.toLowerCase());
    const allFields = semanticMap.tables.flatMap((t) => t.fields.map((f) => f.toLowerCase()));
    const features: string[] = [];

    // SaaS indicators
    if (
      tableNames.some((t) => /subscription|billing|plan|organization|team|tenant/i.test(t)) ||
      allFields.some((f) => /stripe|plan_id|subscription/i.test(f))
    ) {
      features.push("billing", "multi-tenant");
      return { type: "saas", features };
    }

    // E-commerce indicators
    if (
      tableNames.some((t) => /product|order|cart|payment|inventory/i.test(t))
    ) {
      features.push("products", "checkout");
      return { type: "ecommerce", features };
    }

    // Dashboard indicators
    if (
      tableNames.some((t) => /metric|analytics|report|log|event/i.test(t))
    ) {
      features.push("charts", "metrics");
      return { type: "dashboard", features };
    }

    // Social indicators
    if (
      tableNames.some((t) => /post|comment|follow|like|friend|message/i.test(t))
    ) {
      features.push("feed", "profiles");
      return { type: "social", features };
    }

    // Default: general with common features
    if (tableNames.some((t) => /user|account|session/i.test(t))) {
      features.push("auth");
    }

    return { type: "general", features };
  }

  /**
   * Select relevant registries based on project context.
   */
  private selectRegistries(
    context: { type: string; features: string[] },
    targetRegistries?: string[],
  ): RegistryInfo[] {
    // If specific registries are requested, filter to those
    if (targetRegistries && targetRegistries.length > 0) {
      return COMPONENT_REGISTRIES.filter((r) =>
        targetRegistries.some((t) => r.name.includes(t) || r.url.includes(t)),
      );
    }

    // Otherwise, select based on context
    const selected: RegistryInfo[] = [];

    // Always include general-purpose registries
    selected.push(
      ...COMPONENT_REGISTRIES.filter((r) => r.category === "general").slice(0, 2),
    );

    // Add context-specific registries
    switch (context.type) {
      case "saas":
        selected.push(
          ...COMPONENT_REGISTRIES.filter(
            (r) => r.name.includes("billing") || r.name.includes("clerk") || r.category === "functional",
          ).slice(0, 3),
        );
        break;
      case "dashboard":
        selected.push(
          ...COMPONENT_REGISTRIES.filter(
            (r) => r.name.includes("tremor") || r.description.includes("dashboard") || r.description.includes("chart"),
          ).slice(0, 3),
        );
        break;
      case "ecommerce":
        selected.push(
          ...COMPONENT_REGISTRIES.filter(
            (r) => r.description.includes("ecommerce") || r.category === "functional",
          ).slice(0, 3),
        );
        break;
      default:
        // Add creative registries for general projects
        selected.push(
          ...COMPONENT_REGISTRIES.filter((r) => r.category === "creative").slice(0, 2),
        );
    }

    // Dedupe
    return [...new Map(selected.map((r) => [r.name, r])).values()];
  }

  /**
   * Generate component recommendations based on data structure.
   */
  private generateRecommendations(
    semanticMap: UXResearchReport["semanticMap"],
    registries: RegistryInfo[],
    context: { type: string; features: string[] },
  ): ComponentRecommendation[] {
    const recommendations: ComponentRecommendation[] = [];

    // Core UI registry recommendation
    const coreRegistry = registries.find((r) => r.category === "general") || registries[0];
    if (coreRegistry) {
      recommendations.push({
        registry: coreRegistry.name,
        componentName: "Base Components",
        installCommand: `npx shadcn add ${coreRegistry.name.replace("@", "")}/button ${coreRegistry.name.replace("@", "")}/card`,
        rationale: `${coreRegistry.description} - Perfect foundation for your ${context.type} project.`,
      });
    }

    // Table component for data-heavy apps
    const hasLargeTables = semanticMap.tables.some((t) => t.fields.length > 5);
    if (hasLargeTables) {
      const gridRegistry = registries.find((r) => r.description.includes("grid") || r.description.includes("table"));
      if (gridRegistry) {
        recommendations.push({
          registry: gridRegistry.name,
          componentName: "Data Grid",
          installCommand: `npx shadcn add ${gridRegistry.name.replace("@", "")}/data-table`,
          rationale: `Your schema has tables with many fields. A powerful data grid will help users manage complex data.`,
        });
      }
    }

    // Dashboard components for analytics
    if (context.type === "dashboard" || context.features.includes("metrics")) {
      const dashboardRegistry = registries.find((r) => r.name.includes("tremor") || r.description.includes("dashboard"));
      if (dashboardRegistry) {
        recommendations.push({
          registry: dashboardRegistry.name,
          componentName: "Charts & Metrics",
          installCommand: `npx shadcn add ${dashboardRegistry.name.replace("@", "")}/area-chart ${dashboardRegistry.name.replace("@", "")}/bar-chart`,
          rationale: `Analytics and metric tables detected. Tremor provides excellent charting components.`,
        });
      }
    }

    // Auth components
    if (context.features.includes("auth") || semanticMap.tables.some((t) => /user|account/i.test(t.name))) {
      recommendations.push({
        registry: "@clerk",
        componentName: "Authentication",
        installCommand: "npm install @clerk/nextjs",
        rationale: "User/Account tables detected. Clerk provides drop-in authentication UI.",
      });
    }

    // AI/Chat components
    if (semanticMap.tables.some((t) => /message|chat|conversation/i.test(t.name))) {
      const aiRegistry = registries.find((r) => r.category === "ai");
      if (aiRegistry) {
        recommendations.push({
          registry: aiRegistry.name,
          componentName: "Chat Interface",
          installCommand: `npx shadcn add ${aiRegistry.name.replace("@", "")}/chat`,
          rationale: "Message/Chat tables detected. This registry provides AI-ready chat components.",
        });
      }
    }

    // Creative components for landing pages
    const creativeRegistry = registries.find((r) => r.category === "creative");
    if (creativeRegistry) {
      recommendations.push({
        registry: creativeRegistry.name,
        componentName: "Hero & Effects",
        installCommand: `npx shadcn add ${creativeRegistry.name.replace("@", "")}/hero ${creativeRegistry.name.replace("@", "")}/sparkles`,
        rationale: `${creativeRegistry.description} - Great for making your landing page stand out.`,
      });
    }

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  /**
   * Capture screenshots of registry demos.
   * Uses Cloudflare Browser Rendering API if available.
   */
  private async captureScreenshots(registries: RegistryInfo[]): Promise<string[]> {
    const screenshots: string[] = [];

    // Check if browser rendering is available
    if (!this.env.CF_BROWSER_RENDER_TOKEN) {
      console.log("[StyleScoutAgent] Browser rendering not available, skipping screenshots");
      return screenshots;
    }

    // Capture screenshots for each registry (limited to 3)
    for (const registry of registries.slice(0, 3)) {
      try {
        const screenshotUrl = await this.captureRegistryScreenshot(registry.url);
        if (screenshotUrl) {
          screenshots.push(screenshotUrl);
          this.setState({
            ...this.state!,
            visitedUrls: [...(this.state?.visitedUrls || []), registry.url],
            screenshots: [...(this.state?.screenshots || []), screenshotUrl],
          });
        }
      } catch (e) {
        console.warn(`[StyleScoutAgent] Failed to capture ${registry.url}: ${e}`);
      }
    }

    return screenshots;
  }

  /**
   * Capture a screenshot of a single URL using Browser Rendering API.
   */
  private async captureRegistryScreenshot(url: string): Promise<string | null> {
    try {
      // Use Cloudflare Browser Rendering MCP
      const response = await fetch("https://browser.mcp.cloudflare.com/screenshot", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.env.CF_BROWSER_RENDER_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          viewport: { width: 1280, height: 720 },
          fullPage: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Screenshot API returned ${response.status}`);
      }

      const result = await response.json() as { screenshotUrl?: string };
      return result.screenshotUrl || null;
    } catch (e) {
      console.warn(`[StyleScoutAgent] Screenshot capture failed: ${e}`);
      return null;
    }
  }
}
