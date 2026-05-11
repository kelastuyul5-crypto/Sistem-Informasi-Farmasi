"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  X,
  PackageX,
  Clock,
  TrendingDown,
  CheckCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";

// ── Sub-components ────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: AppNotification["type"] }) {
  if (type === "EXPIRED" || type === "UNFIT")
    return (
      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
        <PackageX className="w-4 h-4 text-red-400" />
      </div>
    );
  if (type === "EXPIRING_SOON")
    return (
      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
        <Clock className="w-4 h-4 text-amber-400" />
      </div>
    );
  return (
    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
      <TrendingDown className="w-4 h-4 text-orange-400" />
    </div>
  );
}

function notifTitle(n: AppNotification): string {
  if (n.type === "EXPIRED") return "Batch Kadaluarsa";
  if (n.type === "UNFIT") return "TIDAK LAYAK (Kritis)";
  if (n.type === "EXPIRING_SOON") return "Hampir Kadaluarsa";
  return "Stok Kritis";
}

function notifBody(n: AppNotification): string {
  if (n.type === "EXPIRED") {
    const days = Math.abs(n.daysLeft!);
    return `${n.namaObat} (${n.nomorBatch}) sudah kadaluarsa ${days} hari lalu`;
  }
  if (n.type === "UNFIT") {
    return `${n.namaObat} (${n.nomorBatch}) sisa ${n.daysLeft} hari. BLOKIR OTOMATIS.`;
  }
  if (n.type === "EXPIRING_SOON") {
    return `${n.namaObat} (${n.nomorBatch}) kadaluarsa dalam ${n.daysLeft} hari`;
  }
  return `${n.namaObat}: stok ${n.currentStok} unit (min: ${n.minimumStok})`;
}

function notifColor(type: AppNotification["type"]) {
  if (type === "EXPIRED" || type === "UNFIT") return "border-l-red-500 bg-red-500/5";
  if (type === "EXPIRING_SOON") return "border-l-amber-500 bg-amber-500/5";
  return "border-l-orange-500 bg-orange-500/5";
}

function NotifItem({
  notif,
  onDismiss,
}: {
  notif: AppNotification;
  onDismiss: (key: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b border-slate-700/40 last:border-0 border-l-2 transition-colors hover:bg-slate-700/20",
        notifColor(notif.type)
      )}
    >
      <NotifIcon type={notif.type} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-300">{notifTitle(notif)}</p>
        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{notifBody(notif)}</p>
      </div>
      <button
        onClick={() => onDismiss(notif.key)}
        title="Tutup notifikasi"
        className="flex-shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-600/50 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function NotificationPanel({ isOpen, onClose, onToggle }: NotificationPanelProps) {
  const { notifications, unreadCount, isLoading, dismiss, dismissAll } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={onToggle}
        className={cn(
          "relative w-9 h-9 rounded-lg bg-slate-800 border flex items-center justify-center transition-all group",
          isOpen
            ? "border-teal-500/60 text-teal-400"
            : "border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-500/50",
          unreadCount > 0 && !isOpen && "animate-[wiggle_2s_ease-in-out_infinite]"
        )}
      >
        <Bell className={cn("w-4 h-4", !isOpen && "group-hover:animate-bounce")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-900/50 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/40 z-50 overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-semibold text-slate-200">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={dismissAll}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-teal-400 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tandai semua
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Memuat...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">Semua beres! Tidak ada notifikasi.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem key={n.key} notif={n} onDismiss={dismiss} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-700/60 bg-slate-800/40">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Lihat semua di Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
