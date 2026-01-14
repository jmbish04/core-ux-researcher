/**
 * @file ReportCanvas.tsx
 * @description Interactive report canvas with split view.
 * Left panel: Structured report in Markdown.
 * Right panel: Mockup viewer for wireframe preview.
 */

import { useState } from "react";
import {
  Copy,
  ExternalLink,
  Layout,
  FileText,
  Code,
  Sparkles,
  ChevronRight,
} from "lucide-react";

/** Maximum characters to show in prompt preview before truncation */
const PROMPT_PREVIEW_MAX_CHARS = 500;

interface UserStory {
  asA: string;
  iWantTo: string;
  soThat: string;
  mappedTo: string;
}

interface WireframeZone {
  id: string;
  name: string;
  type: string;
  dataSource?: string;
  components?: string[];
}

interface WireframeSpec {
  screenName: string;
  layout: string;
  zones: WireframeZone[];
}

interface ComponentRecommendation {
  registry: string;
  componentName: string;
  installCommand: string;
  rationale: string;
  screenshotUrl?: string;
}

interface CodingPrompt {
  title: string;
  prompt: string;
}

interface UXResearchReport {
  id: string;
  repoUrl: string;
  createdAt: string;
  semanticMap: {
    tables: Array<{ name: string; fields: string[]; relationships?: string[] }>;
    apiRoutes?: Array<{ path: string; method: string; description?: string }>;
  };
  targetAudience: string;
  coreProblem: string;
  context: string;
  userStories: UserStory[];
  wireframes: WireframeSpec[];
  recommendedStack: ComponentRecommendation[];
  codingPrompts: CodingPrompt[];
}

interface ReportCanvasProps {
  report: UXResearchReport;
  onCopyPrompt?: (prompt: string) => void;
}

type Tab = "overview" | "stories" | "wireframes" | "stack" | "prompts";

export function ReportCanvas({ report, onCopyPrompt }: ReportCanvasProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedWireframe, setSelectedWireframe] =
    useState<WireframeSpec | null>(report.wireframes[0] || null);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(
    null,
  );

  const handleCopyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPromptIndex(index);
    onCopyPrompt?.(prompt);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "stories",
      label: "User Stories",
      icon: <ChevronRight className="h-4 w-4" />,
    },
    {
      id: "wireframes",
      label: "Wireframes",
      icon: <Layout className="h-4 w-4" />,
    },
    { id: "stack", label: "Stack", icon: <Sparkles className="h-4 w-4" /> },
    { id: "prompts", label: "Prompts", icon: <Code className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-full bg-white dark:bg-slate-950">
      {/* Left Panel - Report Content */}
      <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && <OverviewTab report={report} />}

          {activeTab === "stories" && (
            <UserStoriesTab stories={report.userStories} />
          )}

          {activeTab === "wireframes" && (
            <WireframesTab
              wireframes={report.wireframes}
              selected={selectedWireframe}
              onSelect={setSelectedWireframe}
            />
          )}

          {activeTab === "stack" && (
            <StackTab recommendations={report.recommendedStack} />
          )}

          {activeTab === "prompts" && (
            <PromptsTab
              prompts={report.codingPrompts}
              onCopy={handleCopyPrompt}
              copiedIndex={copiedPromptIndex}
            />
          )}
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-[400px] flex flex-col bg-slate-50 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            Wireframe Preview
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selectedWireframe?.screenName || "Select a wireframe"}
          </p>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {selectedWireframe ? (
            <WireframePreview wireframe={selectedWireframe} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Select a wireframe to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ report }: { report: UXResearchReport }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            UX Research Report
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Generated: {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
        <a
          href={report.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          View Repository
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Target Audience
          </p>
          <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
            {report.targetAudience}
          </p>
        </div>
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Application Type
          </p>
          <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
            {report.context}
          </p>
        </div>
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Database Tables
          </p>
          <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
            {report.semanticMap.tables.length}
          </p>
        </div>
      </div>

      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
          Core Problem
        </p>
        <p className="text-slate-700 dark:text-slate-300">
          {report.coreProblem}
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Detected Schema
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {report.semanticMap.tables.map((table) => (
            <div
              key={table.name}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              <p className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                {table.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {table.fields.length} fields
                {table.relationships &&
                  ` • ${table.relationships.length} relations`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserStoriesTab({ stories }: { stories: UserStory[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-700 dark:text-slate-300">
        User Stories ({stories.length})
      </h3>
      {stories.map((story) => (
        <div
          key={`${story.asA}-${story.mappedTo}`}
          className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <p className="text-slate-700 dark:text-slate-300">
            As a <strong>{story.asA}</strong>, I want to{" "}
            <strong>{story.iWantTo}</strong> so that{" "}
            <strong>{story.soThat}</strong>
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Mapped to: <code className="font-mono">{story.mappedTo}</code>
          </p>
        </div>
      ))}
    </div>
  );
}

function WireframesTab({
  wireframes,
  selected,
  onSelect,
}: {
  wireframes: WireframeSpec[];
  selected: WireframeSpec | null;
  onSelect: (w: WireframeSpec) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-700 dark:text-slate-300">
        Wireframe Specifications ({wireframes.length})
      </h3>
      {wireframes.map((wireframe) => (
        <button
          key={wireframe.screenName}
          onClick={() => onSelect(wireframe)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            selected?.screenName === wireframe.screenName
              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {wireframe.screenName}
            </p>
            <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">
              {wireframe.layout}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {wireframe.zones.length} zones:{" "}
            {wireframe.zones.map((z) => z.name).join(", ")}
          </p>
        </button>
      ))}
    </div>
  );
}

function StackTab({
  recommendations,
}: {
  recommendations: ComponentRecommendation[];
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-700 dark:text-slate-300">
        Recommended Component Stack
      </h3>
      {recommendations.map((rec) => (
        <div
          key={`${rec.registry}-${rec.componentName}`}
          className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-indigo-600 dark:text-indigo-400">
              {rec.registry}
            </p>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {rec.componentName}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            {rec.rationale}
          </p>
          <code className="block p-2 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto">
            {rec.installCommand}
          </code>
        </div>
      ))}
    </div>
  );
}

function PromptsTab({
  prompts,
  onCopy,
  copiedIndex,
}: {
  prompts: CodingPrompt[];
  onCopy: (prompt: string, index: number) => void;
  copiedIndex: number | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300">
          Coding Prompts
        </h3>
        <p className="text-xs text-slate-500">
          Copy and paste into your AI coding assistant
        </p>
      </div>
      {prompts.map((prompt, i) => (
        <div
          key={prompt.title}
          className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {prompt.title}
            </p>
            <button
              onClick={() => onCopy(prompt.prompt, i)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              <Copy className="h-3 w-3" />
              {copiedIndex === i ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-48">
            {prompt.prompt.slice(0, PROMPT_PREVIEW_MAX_CHARS)}...
          </pre>
        </div>
      ))}
    </div>
  );
}

function WireframePreview({ wireframe }: { wireframe: WireframeSpec }) {
  const layoutClass =
    wireframe.layout === "two-column"
      ? "grid grid-cols-3 gap-2"
      : wireframe.layout === "dashboard"
        ? "grid grid-cols-4 gap-2"
        : "flex flex-col gap-2";

  return (
    <div className="space-y-3">
      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {wireframe.screenName}
        </p>
        <p className="text-xs text-slate-500">Layout: {wireframe.layout}</p>
      </div>

      <div className={`${layoutClass} min-h-[300px]`}>
        {wireframe.zones.map((zone) => (
          <div
            key={zone.id}
            className={`p-3 bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg ${
              zone.type === "header"
                ? "col-span-full"
                : zone.type === "sidebar"
                  ? "col-span-1"
                  : zone.type === "main"
                    ? "col-span-2"
                    : ""
            }`}
          >
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {zone.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">Type: {zone.type}</p>
            {zone.dataSource && (
              <p className="text-xs text-indigo-500 mt-1">
                Data: {zone.dataSource}
              </p>
            )}
            {zone.components && zone.components.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {zone.components.slice(0, 3).map((comp) => (
                  <span
                    key={comp}
                    className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
