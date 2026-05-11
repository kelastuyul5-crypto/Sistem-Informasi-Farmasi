"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronRight, User, Home, LogOut } from "lucide-react";
import { mockAlertSummary } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  pasien: "Data Pasien",
  resep: "E-Resep",
  buat: "Buat E-Resep",
  "validasi-resep": "Validasi Resep",
  inventori: "Inventori Batch",
  "master-obat": "Master Obat",
  kasir: "Kasir Pembayaran",
  laporan: "Laporan",
};

export function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const totalAlerts =
    mockAlertSummary.expiredCount +
    mockAlertSummary.expiringSoonCount +
    mockAlertSummary.lowStockCount;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        <Link href="/dashboard" className="text-slate-400 hover:text-teal-400 transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        {segments.map((seg, i) => (
          <span key={seg} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-slate-600" />
            {i === segments.length - 1 ? (
              <span className="text-slate-200 font-medium">
                {routeLabels[seg] ?? seg}
              </span>
            ) : (
              <Link
                href={"/" + segments.slice(0, i + 1).join("/")}
                className="text-slate-400 hover:text-teal-400 transition-colors"
              >
                {routeLabels[seg] ?? seg}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Alert Bell */}
        <Link
          href="/dashboard"
          className="relative w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-teal-400 hover:border-teal-500/50 transition-all group"
        >
          <Bell className="w-4 h-4 group-hover:animate-bounce" />
          {totalAlerts > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-900/50 animate-pulse">
              {totalAlerts}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700" />

        {/* User Profile + Logout Dropdown */}
        <div className="group relative">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-teal-500/40 transition-all cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-slate-200">
                {user?.name || "Memuat..."}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">
                {user?.role || "—"}
              </p>
            </div>
          </div>

          {/* Dropdown (hover) */}
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-slate-800 border border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-50">
            {/* User info panel */}
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || "—"}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {user?.hospital || "—"}
              </p>
            </div>
            {/* Logout button */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin flex-shrink-0" />
                    <span>Keluar...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>Keluar Sistem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

