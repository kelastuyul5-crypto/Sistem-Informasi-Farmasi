"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Search, CalendarDays, ChevronDown, Boxes, FileSpreadsheet, X, Upload, Loader2 } from "lucide-react";
import { getBatchWithJoins, getSupplier, getObatList, insertPenerimaanBatch } from "@/lib/supabase-queries";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function daysDiff(d: string) { return Math.floor((new Date(d).getTime() - Date.now()) / 86400000); }
function ExpiryBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft < 0) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">Kadaluarsa</span>;
  if (daysLeft <= 30) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">{daysLeft}h lagi</span>;
  if (daysLeft <= 90) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">{daysLeft}h lagi</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">{daysLeft}h lagi</span>;
}

const emptyForm = { id_supplier: "", id_obat: "", nomor_batch: "", jumlah: 1, tgl_terima: "", tgl_kadaluarsa: "" };

export default function InventoriPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: batches = [], isLoading } = useQuery({ queryKey: ["batch"], queryFn: getBatchWithJoins });
  const { data: suppliers = [] } = useQuery({ queryKey: ["supplier"], queryFn: getSupplier });
  const { data: obatList = [] } = useQuery({ queryKey: ["obat-raw"], queryFn: getObatList });

  const mutation = useMutation({
    mutationFn: insertPenerimaanBatch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["batch"] }); setShowForm(false); setForm(emptyForm); },
    onError: (e: Error) => setFormError(e.message),
  });

  const filtered = batches.filter(b =>
    b.nama_obat.toLowerCase().includes(search.toLowerCase()) ||
    b.nomor_batch.toLowerCase().includes(search.toLowerCase()) ||
    (b.nama_supplier ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const active = batches.filter(b => daysDiff(b.tgl_kadaluarsa) >= 0).length;
  const soon = batches.filter(b => { const d = daysDiff(b.tgl_kadaluarsa); return d >= 0 && d <= 90; }).length;
  const expired = batches.filter(b => daysDiff(b.tgl_kadaluarsa) < 0).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.id_supplier || !form.id_obat || !form.nomor_batch || !form.tgl_terima || !form.tgl_kadaluarsa) {
      setFormError("Semua field wajib diisi."); return;
    }
    if (!user?.id) { setFormError("Anda belum login sebagai admin."); return; }
    mutation.mutate({
      id_supplier: form.id_supplier,
      id_admin: user.id,
      tgl_terima: form.tgl_terima,
      batches: [{ id_obat: form.id_obat, nomor_batch: form.nomor_batch, tgl_kadaluarsa: form.tgl_kadaluarsa, sisa_stok: Number(form.jumlah) }],
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Package className="w-6 h-6 text-teal-400" /> Inventori Batch Obat</h1>
          <p className="text-slate-400 text-sm mt-1">Manajemen penerimaan obat berbasis batch dengan sistem FEFO.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-900/40">
          <Plus className="w-4 h-4" /> Penerimaan Obat Baru
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Batch Aktif", value: active, color: "text-teal-400" }, { label: "Hampir Kadaluarsa", value: soon, color: "text-amber-400" }, { label: "Batch Kadaluarsa", value: expired, color: "text-red-400" }].map(s => (
          <div key={s.label} className="rounded-xl bg-slate-900 border border-slate-700/60 p-4 text-center">
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" placeholder="Cari nama obat, nomor batch, atau supplier..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors" />
      </div>

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
                {["Nama Obat","No. Batch","Supplier","Tgl Terima","Tgl Kadaluarsa","Sisa Stok","Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    {[...Array(7)].map((_, j) => <td key={j} className="px-5 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse w-20" /></td>)}
                  </tr>
                ))
              ) : filtered.map(b => {
                const dl = daysDiff(b.tgl_kadaluarsa);
                return (
                  <tr key={b.id_batch} className={cn("border-b border-slate-800 hover:bg-slate-800/40 transition-colors", dl < 0 && "bg-red-950/20", dl >= 0 && dl <= 90 && "bg-amber-950/10")}>
                    <td className="px-5 py-3 font-medium text-slate-200">{b.nama_obat}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-300">{b.nomor_batch}</td>
                    <td className="px-5 py-3 text-slate-400">{b.nama_supplier ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-400">{b.tgl_terima ? new Date(b.tgl_terima).toLocaleDateString("id-ID") : "—"}</td>
                    <td className="px-5 py-3 text-slate-300">{new Date(b.tgl_kadaluarsa).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-3"><span className={cn("font-semibold", dl < 0 ? "text-red-400" : "text-slate-200")}>{b.sisa_stok}</span> <span className="text-xs text-slate-500">unit</span></td>
                    <td className="px-5 py-3"><ExpiryBadge daysLeft={dl} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h2 className="font-bold text-white flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-teal-400" /> Form Penerimaan Obat</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Supplier</label>
                <div className="relative">
                  <select value={form.id_supplier} onChange={e => setForm(f => ({ ...f, id_supplier: e.target.value }))}
                    className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500">
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => <option key={s.id_supplier} value={s.id_supplier}>{s.nama_supplier}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Obat</label>
                <div className="relative">
                  <select value={form.id_obat} onChange={e => setForm(f => ({ ...f, id_obat: e.target.value }))}
                    className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500">
                    <option value="">-- Pilih Obat --</option>
                    {obatList.map((o: any) => <option key={o.id_obat} value={o.id_obat}>{o.nama_obat} ({o.satuan})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nomor Batch</label>
                  <input type="text" placeholder="BTH-2025-001" value={form.nomor_batch} onChange={e => setForm(f => ({ ...f, nomor_batch: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Jumlah (unit)</label>
                  <input type="number" min={1} value={form.jumlah} onChange={e => setForm(f => ({ ...f, jumlah: Number(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Tgl Terima</label>
                  <input type="date" value={form.tgl_terima} onChange={e => setForm(f => ({ ...f, tgl_terima: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Tgl Kadaluarsa</label>
                  <input type="date" value={form.tgl_kadaluarsa} onChange={e => setForm(f => ({ ...f, tgl_kadaluarsa: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              {formError && <p className="text-red-400 text-xs">{formError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 font-semibold text-sm">Batal</button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
                  {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
