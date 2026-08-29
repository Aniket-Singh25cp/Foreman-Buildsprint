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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidBrief) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brief }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.detail || `Server error (Status: ${res.status})`
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

    // Optimistic update
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
        `http://localhost:8000/projects/${projectData.project_id}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to update task status (Status: ${res.status})`);
      }
    } catch (err: unknown) {
      // Revert optimistic update on failure
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
      {/* Top Header - Blueprint Header Sheet Format */}
      <header className="border-b-2 border-[#0c1c38] bg-[#f4f3ee]/95 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-3.5 h-3.5 bg-orange-600 border border-[#0c1c38] shrink-0" />
          <div>
            <h1 className="text-xl font-black font-mono tracking-wider uppercase text-[#0c1c38] leading-none">
              FOREMAN <span className="text-xs font-normal text-slate-500 font-sans tracking-normal ml-1">/// Project Orchestration</span>
            </h1>
            <p className="text-[11px] font-mono text-slate-600 mt-0.5 uppercase tracking-wide">
              SPECIFICATION DECOMPOSITION & JOB SITE WORK ORDERS
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-[#0c1c38] border border-[#0c1c38] bg-white px-3 py-1.5 flex items-center gap-4 shrink-0">
          <span>GATEWAY: <strong className="text-emerald-700">ONLINE</strong></span>
          <span className="text-slate-400">|</span>
          <span>MODEL: <strong>GEMINI-3.6-FLASH</strong></span>
        </div>
      </header>

      {/* Main Container - Blueprint Workspace */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Project Brief Input Block - Styled like a Job Spec Header */}
        <section className="bg-white border-2 border-[#0c1c38] p-6 relative">
          <div className="absolute top-0 right-0 bg-[#0c1c38] text-white text-[10px] font-mono font-bold uppercase px-3 py-1">
            SPECIFICATION BRIEF FORM
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between border-b border-[#0c1c38]/20 pb-2">
              <label
                htmlFor="brief"
                className="text-xs font-mono font-bold uppercase tracking-wider text-[#0c1c38] flex items-center gap-2"
              >
                <span>[01] PROJECT SCOPE BRIEF</span>
              </label>
              <span className="text-xs font-mono">
                {trimmedLength < 15 ? (
                  <span className="text-amber-700 font-semibold">REQUIREMENT: MIN 15 CHARACTERS</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">VALIDATED FOR SUBMISSION</span>
                )}
              </span>
            </div>

            <textarea
              id="brief"
              rows={3}
              className="w-full bg-[#fcfcf9] border border-[#0c1c38]/60 p-4 text-[#0c1c38] placeholder-slate-400 text-sm focus:outline-none focus:border-[#0c1c38] focus:ring-1 focus:ring-[#0c1c38] font-sans rounded-none"
              placeholder="Describe your project specification in detail (e.g., 'Build an enterprise inventory management backend with real-time stock tracking, audit logging, and automated supplier reorders')..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              disabled={loading}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <p className="text-xs text-slate-600 font-mono">
                * Describe your project in at least a sentence or two
              </p>
              <button
                type="submit"
                disabled={loading || !isValidBrief}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold text-xs uppercase tracking-wider border border-[#0c1c38] disabled:opacity-40 disabled:hover:bg-orange-600 disabled:cursor-not-allowed transition-colors shrink-0 rounded-none shadow-[2px_2px_0px_0px_#0c1c38]"
              >
                {loading ? "DECOMPOSING SPECIFICATION..." : "GENERATE WORK ORDERS"}
              </button>
            </div>
          </form>
        </section>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-700 text-red-900 text-sm flex items-start gap-3 font-mono">
            <span className="text-red-700 font-bold text-base">[ERROR]</span>
            <div>
              <p className="font-bold uppercase tracking-wide">SYSTEM EXECUTION FAILURE</p>
              <p className="text-xs text-red-800 mt-1 font-sans">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State - Job Site Blueprint Graphic Placeholder */}
        {!projectData && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-[#0c1c38]/30 bg-white/60 min-h-[380px]">
            <div className="w-12 h-12 border-2 border-[#0c1c38] bg-[#f4f3ee] flex items-center justify-center font-mono font-bold text-lg mb-4 text-[#0c1c38]">
              📐
            </div>
            <h3 className="text-sm font-mono font-bold text-[#0c1c38] uppercase tracking-wider">
              NO ACTIVE WORK ORDERS DEPLOYED
            </h3>
            <p className="text-xs text-slate-600 max-w-md mt-2 leading-relaxed">
              Submit your project scope brief above. The Foreman engine will break down your requirements into sequenced work orders with explicit task dependency tracking.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center border-2 border-[#0c1c38] bg-white min-h-[380px]">
            <div className="w-10 h-10 border-4 border-[#0c1c38] border-t-orange-600 rounded-none animate-spin mb-4" />
            <h3 className="text-sm font-mono font-bold text-[#0c1c38] uppercase tracking-wider">
              ANALYZING SPECIFICATION BRIEF & DECOMPOSING TASKS...
            </h3>
            <p className="text-xs font-mono text-slate-500 mt-2">
              LATENTSTACK LLM GATEWAY PROCESSING
            </p>
          </div>
        )}

        {/* Active Kanban / Work Order Cards */}
        {projectData && !loading && (
          <section className="flex-1 flex flex-col gap-6">
            {/* Project Header Bar */}
            <div className="bg-white border-2 border-[#0c1c38] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold uppercase text-[#0c1c38] bg-[#f4f3ee] border border-[#0c1c38] px-2.5 py-1">
                  PROJECT ID: {projectData.project_id}
                </span>
              </div>
              <a
                href={`http://localhost:8000/projects/${projectData.project_id}/summary-deck`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#0c1c38] hover:bg-[#152a50] text-white font-mono text-xs font-bold uppercase tracking-wider border border-[#0c1c38] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
              >
                <span>↓ DOWNLOAD SUMMARY DECK (.PPTX)</span>
              </a>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
              {/* Pending Work Orders */}
              <div className="bg-[#fcfcf9] border-2 border-[#0c1c38] p-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-5 border-b-2 border-[#0c1c38]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 bg-orange-600 border border-[#0c1c38]"></span>
                    <h2 className="font-mono font-black text-[#0c1c38] text-sm tracking-wider uppercase">
                      PENDING WORK ORDERS
                    </h2>
                  </div>
                  <span className="font-mono font-bold text-xs bg-orange-100 text-orange-950 border border-orange-600 px-3 py-0.5">
                    COUNT: {pendingTasks.length}
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  {pendingTasks.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-300 text-slate-500 text-xs font-mono">
                      [ ALL WORK ORDERS COMPLETED ]
                    </div>
                  ) : (
                    pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white border-2 border-[#0c1c38] p-4 flex flex-col justify-between gap-4 shadow-[3px_3px_0px_0px_#0c1c38]"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                            <span className="font-mono text-xs font-bold text-[#0c1c38] bg-[#f4f3ee] px-2 py-0.5 border border-[#0c1c38]/40">
                              WO-#{task.id}
                            </span>
                            <span className="font-mono text-[10px] text-orange-800 font-bold uppercase tracking-wider bg-orange-50 border border-orange-300 px-2 py-0.5">
                              STATUS: PENDING
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-[#0c1c38] text-sm leading-snug">
                            {task.title}
                          </h3>
                          
                          {task.description && (
                            <p className="text-xs text-slate-700 mt-2 leading-relaxed font-sans">
                              {task.description}
                            </p>
                          )}

                          {task.depends_on && task.depends_on.length > 0 && (
                            <div className="mt-3 text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
                              PREREQUISITE TASKS: {task.depends_on.map((id) => `WO-#${id}`).join(", ")}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex justify-end">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className="px-4 py-1.5 bg-[#0c1c38] hover:bg-[#152a50] text-white font-mono text-xs font-bold uppercase tracking-wider border border-[#0c1c38] transition-colors"
                          >
                            [✓] MARK DONE
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Completed Work Orders */}
              <div className="bg-[#fcfcf9] border-2 border-[#0c1c38] p-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-5 border-b-2 border-[#0c1c38]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 bg-emerald-700 border border-[#0c1c38]"></span>
                    <h2 className="font-mono font-black text-[#0c1c38] text-sm tracking-wider uppercase">
                      COMPLETED WORK ORDERS
                    </h2>
                  </div>
                  <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-950 border border-emerald-700 px-3 py-0.5">
                    COUNT: {doneTasks.length}
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  {doneTasks.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-300 text-slate-500 text-xs font-mono">
                      [ NO COMPLETED WORK ORDERS ]
                    </div>
                  ) : (
                    doneTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white/80 border-2 border-slate-400 p-4 flex flex-col justify-between gap-4 opacity-90"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-300">
                              WO-#{task.id}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-800 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-300 px-2 py-0.5">
                              STATUS: SIGNED OFF
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-slate-700 text-sm leading-snug line-through">
                            {task.title}
                          </h3>
                          
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-sans">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex justify-end">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className="px-4 py-1.5 bg-[#f4f3ee] hover:bg-slate-200 text-[#0c1c38] font-mono text-xs font-bold uppercase tracking-wider border border-[#0c1c38] transition-colors"
                          >
                            [↺] REOPEN TASK
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
