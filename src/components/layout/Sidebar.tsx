"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardCheck,
  Package,
  Pill,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type Role = "dokter" | "admin";

const dokterNav = [
  { label: "Antrean Pasien", href: "/pasien", icon: Users },
  { label: "Buat E-Resep", href: "/resep/buat", icon: FileText },
];


const adminNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Validasi Resep", href: "/validasi-resep", icon: ClipboardCheck },
  { label: "Inventori Batch", href: "/inventori", icon: Package },
  { label: "Master Obat", href: "/master-obat", icon: Pill },
  { label: "Kasir Pembayaran", href: "/kasir", icon: CreditCard },
  { label: "Laporan", href: "/laporan", icon: BarChart3 },
  { label: "Kartu Stok", href: "/laporan/kartu-stok", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || "admin";
  const nav = role === "dokter" ? dokterNav : adminNav;

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-slate-900 border-r border-slate-700/50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-teal-900/40 overflow-hidden">
          <img src="/icon.png" alt="PharmaCare" className="w-full h-full object-contain p-0.5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight">PharmaCare</p>
            <p className="text-[10px] text-slate-400 leading-tight">Clinical System</p>
          </div>
        )}
      </div>



      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-2 mb-2">
            {role === "dokter" ? "Menu Dokter" : "Menu Admin Farmasi"}
          </p>
        )}
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "bg-teal-600/20 text-teal-400 border border-teal-500/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  active ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:bg-teal-600 hover:text-white transition-all shadow-md"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
