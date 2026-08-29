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

  const pendingTasks =
    projectData?.tasks.filter((t) => t.status === "pending") || [];
  const doneTasks = projectData?.tasks.filter((t) => t.status === "done") || [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8 max-w-6xl mx-auto">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-slate-800">Foreman</h1>
        <p className="text-slate-600 mt-1">
          Decompose project briefs into tasks automatically
        </p>
      </header>

      {/* Brief Form */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="brief"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Project Brief
          </label>
          <textarea
            id="brief"
            rows={4}
            className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 mb-1"
            placeholder="Paste your project brief here (e.g., 'Build a real estate mobile app with map view...')"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mb-4">
            Describe your project in at least a sentence or two
          </p>
          <button
            type="submit"
            disabled={loading || !isValidBrief}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Decomposing Brief..." : "Submit Brief"}
          </button>
        </form>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading Skeleton / State */}
      {loading && (
        <div className="p-8 text-center text-slate-600 bg-white rounded-lg border border-slate-200 shadow-sm mb-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="mt-4 text-sm font-medium">
            Decomposing brief with AI...
          </p>
        </div>
      )}

      {/* Project Results & Kanban Board */}
      {projectData && !loading && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                Project ID
              </span>
              <p className="text-sm font-mono text-slate-700">
                {projectData.project_id}
              </p>
            </div>
            <a
              href={`http://localhost:8000/projects/${projectData.project_id}/summary-deck`}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
            >
              Download Summary Deck (.pptx)
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Column */}
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-700 text-lg">Pending</h2>
                <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {pendingTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingTasks.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No pending tasks</p>
                ) : (
                  pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-4 rounded border border-slate-200 shadow-sm hover:shadow transition-shadow"
                    >
                      <div className="text-xs text-blue-600 font-semibold mb-1">
                        Task #{task.id}
                      </div>
                      <h3 className="font-medium text-slate-800 text-sm">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-700 text-lg">Done</h2>
                <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {doneTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {doneTasks.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No completed tasks</p>
                ) : (
                  doneTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-4 rounded border border-slate-200 shadow-sm opacity-75"
                    >
                      <div className="text-xs text-slate-500 font-semibold mb-1">
                        Task #{task.id}
                      </div>
                      <h3 className="font-medium text-slate-800 text-sm line-through">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
