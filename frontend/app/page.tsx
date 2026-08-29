"use client";

import { useState } from "react";

interface Task {
  id: number;
  title: string;
  description?: string;
  depends_on?: number[];
  status: string;
}

interface ProjectResponse {
  project_id: string;
  tasks: Task[];
}

export default function Home() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<ProjectResponse | null>(null);

  const trimmedLength = brief.replace(/\s+/g, "").length;
  const isValidBrief = trimmedLength >= 15;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidBrief) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brief }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.detail || `Server error (${res.status})`
        );
      }

      const data: ProjectResponse = await res.json();
      setProjectData(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: number, currentStatus: string) => {
    if (!projectData) return;
    const newStatus = currentStatus === "pending" ? "done" : "pending";

    setProjectData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        ),
      };
    });

    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${projectData.project_id}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to update task status (${res.status})`);
      }
    } catch (err: unknown) {
      setProjectData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, status: currentStatus } : t
          ),
        };
      });

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update task status.");
      }
    }
  };

  const pendingTasks =
    projectData?.tasks.filter((t) => t.status === "pending") || [];
  const doneTasks = projectData?.tasks.filter((t) => t.status === "done") || [];

  return (
    <div className="min-h-screen text-[#0c1c38] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b-2 border-[#0c1c38] bg-[#f4f3ee] px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-black font-mono tracking-wider uppercase text-[#0c1c38]">
          FOREMAN <span className="text-xs font-normal text-slate-500 font-sans tracking-normal ml-2">Decompose any project brief into a live, trackable task board — automatically.</span>
        </h1>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-350 mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Brief Input Card */}
        <section className="bg-white border-2 border-[#0c1c38] p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="brief" className="text-xs font-mono font-bold uppercase text-[#0c1c38]">
                Project Brief
              </label>
              <span className="text-xs font-mono text-slate-500">
                {trimmedLength < 15 ? "Min 15 chars" : "Ready"}
              </span>
            </div>

            <textarea
              id="brief"
              rows={3}
              className="w-full bg-[#fcfcf9] border border-[#0c1c38]/60 p-3 text-[#0c1c38] placeholder-slate-400 text-sm focus:outline-none focus:border-[#0c1c38] rounded-none font-sans"
              placeholder="Describe your project brief..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              disabled={loading}
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500 font-mono">
                Describe your project in at least a sentence or two
              </span>
              <button
                type="submit"
                disabled={loading || !isValidBrief}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold text-xs uppercase border border-[#0c1c38] disabled:opacity-40 disabled:hover:bg-orange-600 disabled:cursor-not-allowed rounded-none"
              >
                {loading ? "Decomposing..." : "Submit Brief"}
              </button>
            </div>
          </form>
        </section>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-700 text-red-900 text-xs font-mono">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Empty State */}
        {!projectData && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[#0c1c38]/30 bg-white/40 min-h-75">
            <h3 className="text-xs font-mono font-bold text-[#0c1c38] uppercase tracking-wider">
              No Active Project Board
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mt-1 font-sans">
              Submit a brief above to generate tasks and dependencies.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-[#0c1c38] bg-white min-h-75">
            <div className="w-8 h-8 border-3 border-[#0c1c38] border-t-orange-600 animate-spin mb-3" />
            <p className="text-xs font-mono font-bold text-[#0c1c38] uppercase">
              Decomposing brief into work orders...
            </p>
          </div>
        )}

        {/* Active Kanban */}
        {projectData && !loading && (
          <section className="flex-1 flex flex-col gap-4">
            {/* Control Bar */}
            <div className="bg-white border-2 border-[#0c1c38] p-3 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#0c1c38]">
                ID: {projectData.project_id}
              </span>
              <a
                href={`${API_BASE_URL}/projects/${projectData.project_id}/summary-deck`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-[#0c1c38] hover:bg-[#152a50] text-white font-mono text-xs font-bold uppercase border border-[#0c1c38]"
              >
                Download Summary Deck (.pptx)
              </a>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              {/* Pending Tasks */}
              <div className="bg-[#fcfcf9] border-2 border-[#0c1c38] p-4 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#0c1c38]">
                  <h2 className="font-mono font-bold text-[#0c1c38] text-xs uppercase tracking-wider">
                    Pending ({pendingTasks.length})
                  </h2>
                </div>

                <div className="space-y-3 flex-1">
                  {pendingTasks.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-300 text-slate-500 text-xs font-mono">
                      No pending tasks
                    </div>
                  ) : (
                    pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white border-2 border-[#0c1c38] p-3.5 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                            <span className="font-mono text-xs font-bold text-[#0c1c38]">
                              #{task.id}
                            </span>
                            <span className="font-mono text-[10px] text-orange-800 font-bold uppercase bg-orange-50 px-1.5 py-0.5 border border-orange-200">
                              Pending
                            </span>
                          </div>
                          <h3 className="font-bold text-[#0c1c38] text-xs leading-snug">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className="px-3 py-1 bg-[#0c1c38] hover:bg-[#152a50] text-white font-mono text-xs font-bold uppercase border border-[#0c1c38]"
                          >
                            Mark Done
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Done Tasks */}
              <div className="bg-[#fcfcf9] border-2 border-[#0c1c38] p-4 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#0c1c38]">
                  <h2 className="font-mono font-bold text-[#0c1c38] text-xs uppercase tracking-wider">
                    Done ({doneTasks.length})
                  </h2>
                </div>

                <div className="space-y-3 flex-1">
                  {doneTasks.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-300 text-slate-500 text-xs font-mono">
                      No completed tasks
                    </div>
                  ) : (
                    doneTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white/80 border-2 border-slate-400 p-3.5 flex flex-col justify-between gap-3 opacity-80"
                      >
                        <div>
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                            <span className="font-mono text-xs font-bold text-slate-600">
                              #{task.id}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-800 font-bold uppercase bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                              Done
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-700 text-xs leading-snug line-through">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sans">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className="px-3 py-1 bg-[#f4f3ee] hover:bg-slate-200 text-[#0c1c38] font-mono text-xs font-bold uppercase border border-[#0c1c38]"
                          >
                            Mark Pending
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
