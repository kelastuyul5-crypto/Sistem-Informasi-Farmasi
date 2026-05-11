"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/lib/auth-context";

const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifType = "EXPIRED" | "UNFIT" | "EXPIRING_SOON" | "LOW_STOCK";

export interface AppNotification {
  /** Unique key: "batch::{id_batch}" | "low::{id_obat}" */
  key: string;
  type: NotifType;
  namaObat: string;
  nomorBatch?: string;
  daysLeft?: number;        // negative = already expired
  tglKadaluarsa?: string;
  currentStok?: number;
  minimumStok?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysDiff(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchAlerts(): Promise<AppNotification[]> {
  const notifications: AppNotification[] = [];

  // 1. Expiry alerts — fetch all active batches
  const { data: batches, error: bErr } = await supabase
    .from("obat_batch")
    .select("id_batch, nomor_batch, tgl_kadaluarsa, sisa_stok, id_obat, obat(nama_obat)")
    .gt("sisa_stok", 0)
    .order("tgl_kadaluarsa", { ascending: true });

  if (bErr) console.error("[useNotifications] batch fetch:", bErr.message);

  for (const b of batches ?? []) {
    const dl = daysDiff(b.tgl_kadaluarsa);
    const namaObat = (b.obat as any)?.nama_obat ?? "—";

    if (dl < 0) {
      notifications.push({
        key: `batch::${b.id_batch}`,
        type: "EXPIRED",
        namaObat,
        nomorBatch: b.nomor_batch,
        daysLeft: dl,
        tglKadaluarsa: b.tgl_kadaluarsa,
      });
    } else if (dl <= 12) {
      notifications.push({
        key: `batch::${b.id_batch}`,
        type: "UNFIT",
        namaObat,
        nomorBatch: b.nomor_batch,
        daysLeft: dl,
        tglKadaluarsa: b.tgl_kadaluarsa,
      });
    } else if (dl <= 90) {
      notifications.push({
        key: `batch::${b.id_batch}`,
        type: "EXPIRING_SOON",
        namaObat,
        nomorBatch: b.nomor_batch,
        daysLeft: dl,
        tglKadaluarsa: b.tgl_kadaluarsa,
      });
    }
  }

  // 2. Low-stock alerts — aggregate per obat
  const { data: obatList, error: oErr } = await supabase
    .from("obat")
    .select("id_obat, nama_obat, stok_minimum");
  if (oErr) console.error("[useNotifications] obat fetch:", oErr.message);

  const { data: batchStock } = await supabase
    .from("obat_batch")
    .select("id_obat, sisa_stok");

  const stokMap: Record<string, number> = {};
  for (const b of batchStock ?? []) {
    stokMap[b.id_obat] = (stokMap[b.id_obat] ?? 0) + b.sisa_stok;
  }

  for (const o of obatList ?? []) {
    const total = stokMap[o.id_obat] ?? 0;
    if (total < o.stok_minimum) {
      notifications.push({
        key: `low::${o.id_obat}`,
        type: "LOW_STOCK",
        namaObat: o.nama_obat,
        currentStok: total,
        minimumStok: o.stok_minimum,
      });
    }
  }

  return notifications;
}

async function fetchDismissedKeys(adminId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("notifikasi_dismissed")
    .select("notif_key")
    .eq("admin_id", adminId);
  return new Set((data ?? []).map((r) => r.notif_key));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { user, supabaseUser } = useAuth();
  const qc = useQueryClient();
  const userId = supabaseUser?.id;

  const alertsQuery = useQuery({
    queryKey: ["notifications", "alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
    staleTime: 60 * 1000,
  });

  const dismissedQuery = useQuery({
    queryKey: ["notifications", "dismissed", userId],
    queryFn: () => (userId ? fetchDismissedKeys(userId) : Promise.resolve(new Set<string>())),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  // Active notifications = alerts minus dismissed
  const allAlerts = alertsQuery.data ?? [];
  const dismissedSet = dismissedQuery.data ?? new Set<string>();
  const notifications = allAlerts.filter((n) => !dismissedSet.has(n.key));
  const unreadCount = notifications.length;

  // ── Dismiss one notification ──
  const dismissMutation = useMutation({
    mutationFn: async (notifKey: string) => {
      if (!userId) return;
      await supabase.from("notifikasi_dismissed").upsert(
        { notif_key: notifKey, admin_id: userId },
        { onConflict: "notif_key,admin_id" }
      );
    },
    onMutate: async (notifKey: string) => {
      // Optimistic update: add to dismissed set immediately
      qc.setQueryData<Set<string>>(
        ["notifications", "dismissed", userId],
        (old) => new Set([...(old ?? []), notifKey])
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications", "dismissed", userId] });
    },
  });

  // ── Dismiss all ──
  const dismissAllMutation = useMutation({
    mutationFn: async () => {
      if (!userId || notifications.length === 0) return;
      const rows = notifications.map((n) => ({
        notif_key: n.key,
        admin_id: userId,
      }));
      await supabase
        .from("notifikasi_dismissed")
        .upsert(rows, { onConflict: "notif_key,admin_id" });
    },
    onMutate: async () => {
      // Optimistic: mark all current notifications as dismissed
      const allKeys = notifications.map((n) => n.key);
      qc.setQueryData<Set<string>>(
        ["notifications", "dismissed", userId],
        (old) => new Set([...(old ?? []), ...allKeys])
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications", "dismissed", userId] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading: alertsQuery.isLoading || dismissedQuery.isLoading,
    dismiss: (key: string) => dismissMutation.mutate(key),
    dismissAll: () => dismissAllMutation.mutate(),
  };
}
