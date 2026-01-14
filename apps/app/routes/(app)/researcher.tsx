/**
 * @file researcher.tsx
 * @description UX Researcher page - main interface for the autonomous research swarm.
 * Allows users to analyze GitHub repos and receive UX research reports.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import {
  Microscope,
  Github,
  ArrowRight,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import { AgentStreamPanel, ReportCanvas } from "@/components/researcher";

export const Route = createFileRoute("/(app)/researcher")({
  component: ResearcherPage,
});

type ViewState = "input" | "analyzing" | "report";

interface ResearchSession {
  requestId: string;
  websocketUrl: string;
  repoUrl: string;
}

function ResearcherPage() {
  const [viewState, setViewState] = useState<ViewState>("input");
  const [repoUrl, setRepoUrl] = useState("");
  const [userIntent, setUserIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [report, setReport] = useState<
    Parameters<typeof ReportCanvas>[0]["report"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartResearch = useCallback(async () => {
    if (!repoUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // In production, this would call the tRPC endpoint
      // For now, we simulate the API call
      const response = await fetch("/api/trpc/uxResearch.start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          userIntent: userIntent.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start research session");
      }

      const data = await response.json();

      setSession({
        requestId: data.result.data.requestId,
        websocketUrl: data.result.data.websocketUrl,
        repoUrl: repoUrl.trim(),
      });
      setViewState("analyzing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [repoUrl, userIntent]);

  const handleReportReady = useCallback(async () => {
    if (!session) return;

    try {
      // Fetch the final report
      const response = await fetch(
        `/api/trpc/uxResearch.report?input=${encodeURIComponent(
          JSON.stringify({ requestId: session.requestId }),
        )}`,
      );

      if (response.ok) {
        const data = await response.json();
        setReport(data.result.data);
        setViewState("report");
      }
    } catch (e) {
      console.error("Failed to fetch report:", e);
    }
  }, [session]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCopyPrompt = useCallback((_prompt: string) => {
    // Could integrate with toast notifications
    console.log("Copied prompt to clipboard");
  }, []);

  const handleNewSession = useCallback(() => {
    setViewState("input");
    setSession(null);
    setReport(null);
    setRepoUrl("");
    setUserIntent("");
    setError(null);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Microscope className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                UX Researcher
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Autonomous backend analysis & frontend architecture
              </p>
            </div>
          </div>

          {viewState !== "input" && (
            <button
              onClick={handleNewSession}
              className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              New Session
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewState === "input" && (
          <InputView
            repoUrl={repoUrl}
            setRepoUrl={setRepoUrl}
            userIntent={userIntent}
            setUserIntent={setUserIntent}
            onSubmit={handleStartResearch}
            loading={loading}
            error={error}
          />
        )}

        {viewState === "analyzing" && session && (
          <div className="h-full p-6">
            <AgentStreamPanel
              requestId={session.requestId}
              websocketUrl={session.websocketUrl}
              onReportReady={handleReportReady}
            />
          </div>
        )}

        {viewState === "report" && report && (
          <ReportCanvas report={report} onCopyPrompt={handleCopyPrompt} />
        )}
      </div>
    </div>
  );
}

interface InputViewProps {
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  userIntent: string;
  setUserIntent: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

function InputView({
  repoUrl,
  setRepoUrl,
  userIntent,
  setUserIntent,
  onSubmit,
  loading,
  error,
}: InputViewProps) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
            <Sparkles className="h-4 w-4" />
            Powered by Autonomous AI Agents
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Transform Backend Code into Frontend Specs
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Paste a GitHub repository URL and let our AI swarm analyze your
            database schemas, API routes, and business logic to generate user
            stories, wireframes, and component recommendations.
          </p>
        </div>

        {/* Input Form */}
        <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub Repository URL
              </div>
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Context (Optional)
              </div>
            </label>
            <textarea
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              placeholder="Describe your project, target users, or specific requirements..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={!repoUrl.trim() || loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              <>
                Analyze Repository
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4">
          <FeatureCard
            icon="🔍"
            title="Schema Analysis"
            description="Automatically detects Prisma, Drizzle, and SQL schemas"
          />
          <FeatureCard
            icon="🎨"
            title="Component Research"
            description="Scouts 90+ shadcn registries for best-fit components"
          />
          <FeatureCard
            icon="📝"
            title="Ready Prompts"
            description="Copy-paste prompts for AI coding assistants"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
        {title}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {description}
      </p>
    </div>
  );
}
