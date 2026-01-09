/**
 * @file ux-research.ts
 * @description tRPC router for UX Research endpoints.
 * Provides API for starting research sessions, checking status,
 * and retrieving reports.
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../lib/trpc.js";
import { UXResearchRequestSchema } from "../lib/zod-schema.js";

export const uxResearchRouter = router({
  /**
   * Start a new UX Research session.
   * Analyzes a GitHub repository and generates a UX research report.
   */
  start: protectedProcedure
    .input(UXResearchRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const requestId = crypto.randomUUID();

      // Get the UX Orchestrator Durable Object
      const orchestratorId = (ctx.env as any).UX_ORCHESTRATOR.idFromName(requestId);
      const orchestratorStub = (ctx.env as any).UX_ORCHESTRATOR.get(orchestratorId);

      // Start the research workflow
      const result = await (orchestratorStub as any).start(requestId, input);

      return {
        requestId,
        status: result.status,
        websocketUrl: `/api/ux-research/${requestId}/ws`,
      };
    }),

  /**
   * Get the status of a research session.
   */
  status: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Get the UX Orchestrator Durable Object
      const orchestratorId = (ctx.env as any).UX_ORCHESTRATOR.idFromName(input.requestId);
      const orchestratorStub = (ctx.env as any).UX_ORCHESTRATOR.get(orchestratorId);

      // Fetch status from the DO
      const response = await (orchestratorStub as any).fetch(
        new Request(`https://internal/status`),
      );

      if (!response.ok) {
        return { status: "unknown", progress: 0 };
      }

      return response.json();
    }),

  /**
   * Get the final research report.
   */
  report: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Get the Architect Durable Object (stores the final report)
      const architectId = (ctx.env as any).ARCHITECT.idFromName(input.requestId);
      const architectStub = (ctx.env as any).ARCHITECT.get(architectId);

      // Fetch report from the DO
      const response = await (architectStub as any).fetch(
        new Request(`https://internal/report`),
      );

      if (!response.ok) {
        return null;
      }

      return response.json();
    }),

  /**
   * List recent research sessions for the current user.
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // TODO: Query from database once persistence is added
      return {
        sessions: [],
        nextCursor: null,
      };
    }),

  /**
   * Generate a scaffolding prompt from a report.
   * Creates a copy-paste ready prompt for coding agents.
   */
  generatePrompt: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        promptType: z.enum(["setup", "feature", "dashboard", "full"]).default("full"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Get the report first
      const architectId = (ctx.env as any).ARCHITECT.idFromName(input.requestId);
      const architectStub = (ctx.env as any).ARCHITECT.get(architectId);

      const response = await (architectStub as any).fetch(
        new Request(`https://internal/report`),
      );

      if (!response.ok) {
        throw new Error("Report not found");
      }

      const report = await response.json();

      // Generate the prompt based on type
      if (input.promptType === "full") {
        const fullPrompt = generateFullPrompt(report);
        return { prompt: fullPrompt };
      }

      const promptIndex =
        input.promptType === "setup" ? 0 :
        input.promptType === "feature" ? 1 : 2;

      const prompt = report.codingPrompts?.[promptIndex]?.prompt || "";
      return { prompt };
    }),
});

/**
 * Generate a full scaffolding prompt from a UX Research report.
 */
function generateFullPrompt(report: any): string {
  const sections: string[] = [];

  sections.push(`# UX Research Report: Frontend Scaffolding
Generated: ${report.createdAt}
Repository: ${report.repoUrl}

## Project Context
- **Target Audience:** ${report.targetAudience}
- **Core Problem:** ${report.coreProblem}
- **Application Type:** ${report.context}

## Database Schema Summary`);

  for (const table of report.semanticMap?.tables || []) {
    sections.push(`### ${table.name}
Fields: ${table.fields.join(", ")}${table.relationships ? `\nRelationships: ${table.relationships.join(", ")}` : ""}`);
  }

  sections.push(`\n## User Stories`);
  for (const story of report.userStories || []) {
    sections.push(`- As a **${story.asA}**, I want to **${story.iWantTo}** so that **${story.soThat}** _(Mapped to: ${story.mappedTo})_`);
  }

  sections.push(`\n## Recommended Component Stack`);
  for (const rec of report.recommendedStack || []) {
    sections.push(`### ${rec.registry} - ${rec.componentName}
\`\`\`bash
${rec.installCommand}
\`\`\`
_${rec.rationale}_`);
  }

  sections.push(`\n## Wireframe Specifications`);
  for (const wireframe of report.wireframes || []) {
    sections.push(`### ${wireframe.screenName} (${wireframe.layout})
Zones:`);
    for (const zone of wireframe.zones || []) {
      sections.push(`- **${zone.name}** (${zone.type}): ${zone.components?.join(", ") || "N/A"}`);
    }
  }

  sections.push(`\n---\n## Coding Prompts\n`);
  for (const prompt of report.codingPrompts || []) {
    sections.push(`### ${prompt.title}\n\n${prompt.prompt}\n`);
  }

  return sections.join("\n");
}
