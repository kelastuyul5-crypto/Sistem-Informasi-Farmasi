"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, Plus, Search, CalendarDays, ChevronDown,
  Boxes, FileSpreadsheet, X, Loader2, Archive, AlertTriangle,
  CheckCircle2, Clock, Layers, Trash2, Scale
} from "lucide-react";
import {
  getBatchWithJoins, getSupplier, getObatList,
  insertPenerimaanBatch, archiveBatch, disposeBatch, adjustStockOpname,
  type ObatBatch,
} from "@/lib/supabase-queries";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────
function daysDiff(d: string) {
  return Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
}

function ExpiryBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft < 0)
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">Kadaluarsa</span>;
  if (daysLeft <= 12)
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600/30 text-red-400 border border-red-500/40 animate-pulse">Tidak Layak (Critical)</span>;
  if (daysLeft <= 30)
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">{daysLeft}h lagi</span>;
  if (daysLeft <= 90)
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">{daysLeft}h lagi</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">{daysLeft}h lagi</span>;
}

function StatusBatchBadge({ status }: { status: string }) {
  if (status === "ARCHIVED")
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">Diarsipkan</span>;
  if (status === "DISPOSED")
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">Dibuang</span>;
  return null;
}

// ── Batch number generator ─────────────────────────────────────────────────────
const emptyForm = { id_supplier: "", id_obat: "", nomor_batch: "", jumlah: 1, tgl_terima: "", tgl_kadaluarsa: "" };

function generateBatchNumber(existingBatches: { nomor_batch: string }[]): string {
  const year = new Date().getFullYear();
  const prefix = `BTH-${year}-`;
  const nums = existingBatches
    .map((b) => b.nomor_batch)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

// ── Tab definition ─────────────────────────────────────────────────────────────
type TabKey = "aktif" | "hampir" | "kadaluarsa" | "riwayat";

const TABS: { key: TabKey; label: string; icon: React.ReactNode; description: string }[] = [
  { key: "aktif",     label: "Stok Aktif",            icon: <CheckCircle2 className="w-4 h-4" />, description: "Sisa stok > 0 & exp > 30 hari" },
  { key: "hampir",    label: "Mendekati Kadaluarsa",  icon: <Clock className="w-4 h-4" />,        description: "Exp dalam 0–90 hari (Aktif)" },
  { key: "kadaluarsa",label: "Kadaluarsa / Habis",    icon: <AlertTriangle className="w-4 h-4" />,description: "Perlu penanganan (Aktif)" },
  { key: "riwayat",   label: "Riwayat & Pemusnahan",  icon: <Archive className="w-4 h-4" />,      description: "Batch yang sudah diarsipkan atau dimusnahkan" },
];

function filterBatches(batches: ObatBatch[], tab: TabKey): ObatBatch[] {
  switch (tab) {
    case "aktif":
      return batches.filter(b => b.sisa_stok > 0 && daysDiff(b.tgl_kadaluarsa) > 90 && b.status_batch === "ACTIVE");
    case "hampir":
      return batches.filter(b => {
        const d = daysDiff(b.tgl_kadaluarsa);
        return d >= 0 && d <= 90 && b.status_batch === "ACTIVE";
      });
    case "kadaluarsa":
      return batches.filter(b => (daysDiff(b.tgl_kadaluarsa) < 0 || b.sisa_stok === 0) && b.status_batch === "ACTIVE");
    case "riwayat":
      return batches.filter(b => b.status_batch !== "ACTIVE");
    default:
      return batches;
  }
}

// ── Tab count badges ───────────────────────────────────────────────────────────
function getTabCounts(batches: ObatBatch[]) {
  return {
    aktif:      batches.filter(b => b.sisa_stok > 0 && daysDiff(b.tgl_kadaluarsa) > 90 && b.status_batch === "ACTIVE").length,
    hampir:     batches.filter(b => { const d = daysDiff(b.tgl_kadaluarsa); return d >= 0 && d <= 90 && b.status_batch === "ACTIVE"; }).length,
    kadaluarsa: batches.filter(b => (daysDiff(b.tgl_kadaluarsa) < 0 || b.sisa_stok === 0) && b.status_batch === "ACTIVE").length,
    riwayat:    batches.filter(b => b.status_batch !== "ACTIVE").length,
  };
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function InventoriPage() {
  const [activeTab, setActiveTab]   = useState<TabKey>("aktif");
  const [showForm, setShowForm]     = useState(false);
  const [search, setSearch]         = useState("");
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState("");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [opnameBatch, setOpnameBatch] = useState<ObatBatch | null>(null);
  const [actualStock, setActualStock] = useState<number | "">("");
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: batches = [], isLoading } = useQuery({ queryKey: ["batch"], queryFn: getBatchWithJoins });
  const { data: suppliers = [] }           = useQuery({ queryKey: ["supplier"], queryFn: getSupplier });
  const { data: obatList = [] }            = useQuery({ queryKey: ["obat-raw"], queryFn: getObatList });

  const insertMutation = useMutation({
    mutationFn: insertPenerimaanBatch,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["batch"] }); 
      qc.invalidateQueries({ queryKey: ["obat"] }); 
      qc.invalidateQueries({ queryKey: ["notifications", "alerts"] });
      setShowForm(false); 
      setForm(emptyForm); 
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id_batch: string) => archiveBatch(id_batch),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["batch"] }); 
      qc.invalidateQueries({ queryKey: ["obat"] }); 
      qc.invalidateQueries({ queryKey: ["notifications", "alerts"] });
      setArchivingId(null); 
    },
    onError: (e: Error) => { alert(`Gagal mengarsipkan batch: ${e.message}`); setArchivingId(null); },
  });

  const disposeMutation = useMutation({
    mutationFn: (id_batch: string) => disposeBatch(id_batch),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["batch"] }); 
      qc.invalidateQueries({ queryKey: ["obat"] }); 
      qc.invalidateQueries({ queryKey: ["notifications", "alerts"] });
      setArchivingId(null); 
    },
    onError: (e: Error) => { alert(`Gagal membuang batch: ${e.message}`); setArchivingId(null); },
  });

  const opnameMutation = useMutation({
    mutationFn: ({ id_batch, new_stock }: { id_batch: string; new_stock: number }) => 
      adjustStockOpname(id_batch, new_stock, user?.id || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batch"] }); 
      qc.invalidateQueries({ queryKey: ["obat"] }); 
      qc.invalidateQueries({ queryKey: ["notifications", "alerts"] });
      setOpnameBatch(null);
    },
    onError: (e: Error) => alert(`Gagal melakukan opname: ${e.message}`),
  });

  function handleOpenForm() {
    const today = new Date().toISOString().split("T")[0];
    setForm({ ...emptyForm, nomor_batch: generateBatchNumber(batches), tgl_terima: today });
    setFormError("");
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.id_supplier || !form.id_obat || !form.nomor_batch || !form.tgl_terima || !form.tgl_kadaluarsa) {
      setFormError("Semua field wajib diisi."); return;
    }
    if (!user?.id) { setFormError("Anda belum login sebagai admin."); return; }
    insertMutation.mutate({
      id_supplier: form.id_supplier,
      id_admin: user.id,
      tgl_terima: form.tgl_terima,
      batches: [{ id_obat: form.id_obat, nomor_batch: form.nomor_batch, tgl_kadaluarsa: form.tgl_kadaluarsa, sisa_stok: Number(form.jumlah) }],
    });
  }

  function handleArchive(b: ObatBatch) {
    if (!confirm(`Arsipkan batch "${b.nomor_batch}" (${b.nama_obat})?\n\nBatch tidak akan muncul di stok aktif setelah diarsipkan.`)) return;
    setArchivingId(b.id_batch);
    archiveMutation.mutate(b.id_batch);
  }

  function handleDispose(b: ObatBatch) {
    if (!confirm(`BUANG / JADIKAN KADALUARSA batch "${b.nomor_batch}" (${b.nama_obat})?\n\nTindakan ini akan menolkan stok dan menandai obat sebagai tidak layak pakai.`)) return;
    setArchivingId(b.id_batch);
    disposeMutation.mutate(b.id_batch);
  }

  const counts  = getTabCounts(batches);
  const tabData = filterBatches(batches, activeTab);
  const filtered = tabData.filter(b =>
    b.nama_obat.toLowerCase().includes(search.toLowerCase()) ||
    b.nomor_batch.toLowerCase().includes(search.toLowerCase()) ||
    (b.nama_supplier ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-400" /> Inventori Batch Obat
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manajemen penerimaan obat berbasis batch dengan sistem FEFO.</p>
        </div>
        <button
          onClick={handleOpenForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-900/40"
        >
          <Plus className="w-4 h-4" /> Penerimaan Obat Baru
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Batch Aktif",           value: counts.aktif,      color: "text-teal-400",   bg: "from-teal-500/10"   },
          { label: "Mendekati Kadaluarsa",  value: counts.hampir,     color: "text-orange-400", bg: "from-orange-500/10" },
          { label: "Kadaluarsa / Habis",    value: counts.kadaluarsa, color: "text-red-400",    bg: "from-red-500/10"    },
          { label: "Total Riwayat & Arsip", value: counts.riwayat,    color: "text-slate-300",  bg: "from-slate-500/10"  },
        ].map(s => (
          <div key={s.label} className={cn("rounded-xl bg-gradient-to-br", s.bg, "to-transparent border border-slate-700/60 p-4 text-center")}>
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-900 border border-slate-700/60">
        {TABS.map(tab => {
          const count = counts[tab.key];
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              {tab.icon}
              <span className="hidden lg:inline">{tab.label}</span>
              <span className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold",
                isActive ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Active tab description ── */}
      <p className="text-xs text-slate-500 -mt-4">
        {TABS.find(t => t.key === activeTab)?.description}
      </p>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Cari nama obat, nomor batch, atau supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
          <Boxes className="w-5 h-5 text-teal-400" />
          <h2 className="font-semibold text-white">Daftar Batch (FEFO Order)</h2>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} batch</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                {["Nama Obat", "No. Batch", "Supplier", "Tgl Terima", "Tgl Kadaluarsa", "Sisa Stok", "Status", ...(activeTab !== "riwayat" ? ["Aksi"] : [])].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-5 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Boxes className="w-8 h-8 opacity-40" />
                      <p className="text-sm">Tidak ada batch ditemukan untuk filter ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(b => {
                  const dl = daysDiff(b.tgl_kadaluarsa);
                  const isZeroStock   = b.sisa_stok === 0;
                  const isExpired     = dl < 0;
                  const isArchived    = b.status_batch !== "ACTIVE";
                  const canArchive    = !isArchived;

                  return (
                    <tr
                      key={b.id_batch}
                      className={cn(
                        "border-b border-slate-800 transition-all duration-200",
                        // Visual hierarchy: dimmed rows for zero stock
                        isZeroStock || isArchived ? "opacity-50 grayscale" : "hover:bg-slate-800/40",
                        // Row tinting
                        !isZeroStock && isExpired && "bg-red-950/20",
                        !isZeroStock && !isExpired && dl >= 0 && dl <= 30 && "bg-orange-950/10",
                      )}
                    >
                      <td className="px-5 py-3 font-medium text-slate-200">{b.nama_obat}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-300">{b.nomor_batch}</td>
                      <td className="px-5 py-3 text-slate-400">{b.nama_supplier ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                        {b.tgl_terima ? new Date(b.tgl_terima).toLocaleDateString("id-ID") : "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-300 whitespace-nowrap">
                        {new Date(b.tgl_kadaluarsa).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("font-semibold", isExpired || isZeroStock ? "text-red-400" : "text-slate-200")}>
                          {b.sisa_stok}
                        </span>{" "}
                        <span className="text-xs text-slate-500">unit</span>
                      </td>
                      <td className="px-5 py-3">
                        {isArchived ? (
                          <StatusBatchBadge status={b.status_batch} />
                        ) : (
                          <ExpiryBadge daysLeft={dl} />
                        )}
                      </td>
                      {activeTab !== "riwayat" && (
                        <td className="px-5 py-3">
                          {canArchive ? (
                            <div className="flex items-center gap-2">
                              {/* Action: DISPOSE (Clinical Safety) */}
                              <button
                                onClick={() => handleDispose(b)}
                                disabled={archivingId === b.id_batch}
                                title="MUSNAHKAN: Paksa stok menjadi 0 dan tandai sebagai barang tidak layak pakai (Expired/Rusak)."
                                className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all border",
                                  dl <= 12 
                                    ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-900/40 animate-pulse" 
                                    : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white"
                                )}
                              >
                                {archivingId === b.id_batch ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Action: ARCHIVE (Housekeeping) */}
                              <button
                                onClick={() => handleArchive(b)}
                                disabled={archivingId === b.id_batch}
                                title="ARSIPKAN: Pindahkan ke riwayat tanpa mengubah jumlah stok. Digunakan untuk merapikan daftar (misal: stok sudah 0)."
                                className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all border",
                                  isZeroStock
                                    ? "bg-slate-700 text-white border-slate-600 shadow-md"
                                    : "bg-slate-800/40 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white"
                                )}
                              >
                                {archivingId === b.id_batch ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Archive className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Action: OPNAME (Stock Correction) */}
                              <button
                                onClick={() => { setOpnameBatch(b); setActualStock(b.sisa_stok); }}
                                disabled={archivingId === b.id_batch}
                                title="OPNAME: Sesuaikan jumlah fisik stok jika terjadi selisih."
                                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all border bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500 hover:text-white"
                              >
                                <Scale className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic px-2">— Non Aktif —</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Form Penerimaan ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h2 className="font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" /> Form Penerimaan Obat
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Supplier */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Supplier</label>
                <div className="relative">
                  <select
                    value={form.id_supplier}
                    onChange={e => setForm(f => ({ ...f, id_supplier: e.target.value }))}
                    className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => <option key={s.id_supplier} value={s.id_supplier}>{s.nama_supplier}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              {/* Nama Obat */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Obat</label>
                <div className="relative">
                  <select
                    value={form.id_obat}
                    onChange={e => setForm(f => ({ ...f, id_obat: e.target.value }))}
                    className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Pilih Obat --</option>
                    {obatList.map((o: any) => <option key={o.id_obat} value={o.id_obat}>{o.nama_obat} ({o.satuan})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              {/* Nomor Batch & Jumlah */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nomor Batch</label>
                  <input
                    type="text" placeholder="BTH-2025-001" value={form.nomor_batch}
                    onChange={e => setForm(f => ({ ...f, nomor_batch: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Jumlah (unit)</label>
                  <input
                    type="number" min={1} value={form.jumlah}
                    onChange={e => setForm(f => ({ ...f, jumlah: Number(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              {/* Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Tgl Terima
                  </label>
                  <input
                    type="date" value={form.tgl_terima}
                    onChange={e => setForm(f => ({ ...f, tgl_terima: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Tgl Kadaluarsa
                  </label>
                  <input
                    type="date" value={form.tgl_kadaluarsa}
                    onChange={e => setForm(f => ({ ...f, tgl_kadaluarsa: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              {formError && <p className="text-red-400 text-xs">{formError}</p>}
              <div className="flex gap-3">
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 font-semibold text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={insertMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {insertMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Form Opname ── */}
      {opnameBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 bg-slate-800/40">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" /> Penyesuaian Stok (Opname)
              </h2>
              <button onClick={() => setOpnameBatch(null)} className="text-slate-500 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-200">{opnameBatch.nama_obat}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{opnameBatch.nomor_batch}</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
                <span className="text-xs text-slate-400 uppercase font-semibold">Stok Sistem Saat Ini</span>
                <span className="text-lg font-bold text-slate-200">{opnameBatch.sisa_stok}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jumlah Fisik Sebenarnya</label>
                <input
                  type="number" min={0} value={actualStock}
                  onChange={e => setActualStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-base text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              {actualStock !== "" && Number(actualStock) !== opnameBatch.sisa_stok && (
                <div className={cn("p-3 rounded-lg border text-sm font-medium", Number(actualStock) > opnameBatch.sisa_stok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-orange-500/10 border-orange-500/30 text-orange-400")}>
                  Selisih Penyesuaian: {Number(actualStock) - opnameBatch.sisa_stok > 0 ? "+" : ""}{Number(actualStock) - opnameBatch.sisa_stok} unit
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button" onClick={() => setOpnameBatch(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 font-semibold text-sm"
                >Batal</button>
                <button
                  onClick={() => opnameMutation.mutate({ id_batch: opnameBatch.id_batch, new_stock: Number(actualStock) })}
                  disabled={actualStock === "" || Number(actualStock) === opnameBatch.sisa_stok || opnameMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/40"
                >
                  {opnameMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Opname
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
