/**
 * @file AgentStreamPanel.tsx
 * @description Streaming panel that shows real-time logs from the UX Research agents.
 * Displays phase updates, progress, and log messages in a Jules-like interface.
 */

import { useEffect, useState, useRef } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Palette,
  Brain,
  FileText,
  Microscope,
} from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: unknown;
}

interface AgentStreamPanelProps {
  requestId: string;
  websocketUrl?: string;
  onReportReady?: () => void;
}

type Phase =
  | "idle"
  | "analyzing_repo"
  | "scanning_schemas"
  | "browsing_registries"
  | "capturing_screenshots"
  | "synthesizing"
  | "generating_report"
  | "complete"
  | "error";

const phaseIcons: Record<Phase, React.ReactNode> = {
  idle: <Microscope className="h-4 w-4" />,
  analyzing_repo: <Search className="h-4 w-4 animate-pulse" />,
  scanning_schemas: <FileText className="h-4 w-4 animate-pulse" />,
  browsing_registries: <Palette className="h-4 w-4 animate-pulse" />,
  capturing_screenshots: <Palette className="h-4 w-4 animate-pulse" />,
  synthesizing: <Brain className="h-4 w-4 animate-pulse" />,
  generating_report: <FileText className="h-4 w-4 animate-pulse" />,
  complete: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
};

const phaseLabels: Record<Phase, string> = {
  idle: "Initializing...",
  analyzing_repo: "🔍 Analyzing Repository...",
  scanning_schemas: "📊 Scanning Database Schemas...",
  browsing_registries: "🎨 Browsing Component Registries...",
  capturing_screenshots: "📸 Capturing Screenshots...",
  synthesizing: "🧠 Synthesizing Architecture...",
  generating_report: "📝 Generating Report...",
  complete: "✅ Analysis Complete",
  error: "❌ Error Occurred",
};

export function AgentStreamPanel({
  requestId,
  websocketUrl,
  onReportReady,
}: AgentStreamPanelProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!websocketUrl) return;

    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Connected to research session",
        },
      ]);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "phase":
            setPhase(data.payload.phase);
            setProgress(data.payload.progress);
            break;
          case "log":
            setLogs((prev) => [...prev, data.payload]);
            break;
          case "progress":
            setProgress(data.payload.progress);
            break;
          case "report":
            setPhase("complete");
            setProgress(1);
            onReportReady?.();
            break;
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level: "error",
          message: "WebSocket connection error",
        },
      ]);
    };

    return () => {
      ws.close();
    };
  }, [websocketUrl, onReportReady]);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            {phaseIcons[phase]}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{phaseLabels[phase]}</h3>
            <p className="text-xs text-slate-400">
              Session: {requestId.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-slate-500"
            }`}
          />
          <span className="text-xs text-slate-400">
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 bg-slate-800">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1 text-right">
          {Math.round(progress * 100)}% complete
        </p>
      </div>

      {/* Log Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`flex gap-2 ${
              log.level === "error"
                ? "text-red-400"
                : log.level === "warn"
                  ? "text-yellow-400"
                  : "text-slate-300"
            }`}
          >
            <span className="text-slate-500 shrink-0">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span>{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />

        {phase !== "complete" && phase !== "error" && (
          <div className="flex items-center gap-2 text-slate-400 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
