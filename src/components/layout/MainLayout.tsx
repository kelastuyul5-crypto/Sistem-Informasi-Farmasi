"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { useAuthGuard } from "@/lib/use-auth-guard";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuthGuard();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="w-10 h-10 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      </div>
    );
  }

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
