/**
 * @file zod-schema.ts
 * @description Zod schemas for request validation across the agent system.
 */

import { z } from "@hono/zod-openapi";

/**
 * Schema for contractor search criteria.
 */
export const ContractorSearchSchema = z.object({
  q: z.string().describe("Search query for contractor"),
  license: z.string().optional().describe("Contractor license number"),
});

/**
 * Schema for location-based search criteria.
 */
export const LocationSearchSchema = z.object({
  block: z.string().optional(),
  lot: z.string().optional(),
  streetNumber: z.string().optional(),
  streetName: z.string().optional(),
  zip: z.string().optional(),
  geoCircle: z
    .object({
      lat: z.number(),
      lon: z.number(),
      radiusMeters: z.number(),
    })
    .optional(),
});

/**
 * Schema for date range filtering.
 */
export const DateRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
});

/**
 * Primary request schema for data searches and agent workflows.
 */
export const SearchRequestSchema = z.object({
  mode: z
    .enum([
      "data_pull",
      "nl_analyst",
      "bulk_analysis",
      "ux_research",
    ])
    .default("data_pull"),
  query: z.string().optional().describe("Natural language query"),
  permitTypes: z
    .array(
      z.enum(["building", "plumbing", "electrical", "complaint", "addenda"]),
    )
    .optional()
    .default([]),
  location: LocationSearchSchema.optional(),
  contractors: z.array(ContractorSearchSchema).optional(),
  dateRange: DateRangeSchema.optional(),
  keywords: z.array(z.string()).optional(),
  includeInsights: z.boolean().optional().default(false),
  includeAnomalies: z.boolean().optional().default(false),
  pageSize: z.number().optional().default(100),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

/**
 * Schema for UX Research requests specifically.
 */
export const UXResearchRequestSchema = z.object({
  repoUrl: z.string().url().describe("GitHub repository URL to analyze"),
  userIntent: z.string().optional().describe("Optional user intent or context"),
  includeScreenshots: z.boolean().optional().default(true),
  targetRegistries: z.array(z.string()).optional(),
});

export type UXResearchRequest = z.infer<typeof UXResearchRequestSchema>;

/**
 * Schema for agent phase/status updates.
 */
export const AgentPhaseSchema = z.enum([
  "idle",
  "analyzing_repo",
  "scanning_schemas",
  "browsing_registries",
  "capturing_screenshots",
  "synthesizing",
  "generating_report",
  "complete",
  "error",
]);

export type AgentPhase = z.infer<typeof AgentPhaseSchema>;

/**
 * Schema for wireframe specifications.
 */
export const WireframeSpecSchema = z.object({
  screenName: z.string(),
  layout: z.enum(["single-column", "two-column", "dashboard", "form", "list"]),
  zones: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["header", "sidebar", "main", "footer", "card", "table", "chart", "form"]),
      dataSource: z.string().optional().describe("DB table or API route this maps to"),
      components: z.array(z.string()).optional(),
    }),
  ),
});

export type WireframeSpec = z.infer<typeof WireframeSpecSchema>;

/**
 * Schema for component recommendations.
 */
export const ComponentRecommendationSchema = z.object({
  registry: z.string().describe("Registry name (e.g., @magicui)"),
  componentName: z.string(),
  installCommand: z.string(),
  rationale: z.string(),
  screenshotUrl: z.string().optional(),
});

export type ComponentRecommendation = z.infer<typeof ComponentRecommendationSchema>;

/**
 * Schema for the final UX Research Report.
 */
export const UXResearchReportSchema = z.object({
  id: z.string(),
  repoUrl: z.string(),
  createdAt: z.string(),
  
  // Analysis Results
  semanticMap: z.object({
    tables: z.array(z.object({
      name: z.string(),
      fields: z.array(z.string()),
      relationships: z.array(z.string()).optional(),
    })),
    apiRoutes: z.array(z.object({
      path: z.string(),
      method: z.string(),
      description: z.string().optional(),
    })).optional(),
  }),
  
  // User Research
  targetAudience: z.string(),
  coreProblem: z.string(),
  context: z.enum(["internal-tool", "b2c", "b2b-saas", "marketplace", "portfolio", "other"]),
  
  // User Stories
  userStories: z.array(z.object({
    asA: z.string(),
    iWantTo: z.string(),
    soThat: z.string(),
    mappedTo: z.string().describe("DB table or API route"),
  })),
  
  // Wireframes
  wireframes: z.array(WireframeSpecSchema),
  
  // Component Stack
  recommendedStack: z.array(ComponentRecommendationSchema),
  
  // Coding Prompts
  codingPrompts: z.array(z.object({
    title: z.string(),
    prompt: z.string(),
  })),
});

export type UXResearchReport = z.infer<typeof UXResearchReportSchema>;
