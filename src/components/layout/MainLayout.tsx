"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { useAuthGuard } from "@/lib/use-auth-guard";

/** Shimmer skeleton that mirrors the real layout — shown during auth init */
function LayoutSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar skeleton */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-700/50 flex flex-col">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
          <div className="w-9 h-9 rounded-lg bg-slate-700 animate-pulse" />
          <div className="space-y-1.5">
            <div className="w-24 h-3 rounded bg-slate-700 animate-pulse" />
            <div className="w-16 h-2 rounded bg-slate-800 animate-pulse" />
          </div>
        </div>
        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          <div className="w-20 h-2 rounded bg-slate-800 animate-pulse mx-2 mb-3" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-4 h-4 rounded bg-slate-700 animate-pulse" />
              <div
                className="h-3 rounded bg-slate-700 animate-pulse"
                style={{ width: `${60 + i * 8}px` }}
              />
            </div>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header skeleton */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-700/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-700 animate-pulse" />
            <div className="w-3 h-3 rounded bg-slate-800 animate-pulse" />
            <div className="w-24 h-3 rounded bg-slate-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 animate-pulse" />
            <div className="w-px h-6 bg-slate-700" />
            <div className="w-32 h-9 rounded-lg bg-slate-800 animate-pulse" />
          </div>
        </header>

        {/* Content skeleton */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="space-y-6">
            {/* Page title */}
            <div className="space-y-2">
              <div className="w-48 h-6 rounded-lg bg-slate-800 animate-pulse" />
              <div className="w-72 h-3 rounded bg-slate-800/60 animate-pulse" />
            </div>
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl bg-slate-900 border border-slate-700/50 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            {/* Content panels */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 h-64 rounded-xl bg-slate-900 border border-slate-700/50 animate-pulse" />
              <div className="h-64 rounded-xl bg-slate-900 border border-slate-700/50 animate-pulse" style={{ animationDelay: "150ms" }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuthGuard();

  const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");

  // Login page renders without layout shell
  if (isLoginPage) return <>{children}</>;

  // Show skeleton that mirrors the real layout (not a blank spinner)
  // isLoading resolves very quickly now — only during INITIAL_SESSION
  if (isLoading) return <LayoutSkeleton />;

  // No user after loading → useAuthGuard is redirecting to /login
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
