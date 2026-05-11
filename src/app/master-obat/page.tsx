"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pill, ShieldCheck, TrendingDown, Plus, Search, X, Loader2 } from "lucide-react";
import { getObatWithStok, insertObat, type Obat } from "@/lib/supabase-queries";
import { cn } from "@/lib/utils";

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

const emptyForm = {
  nama_obat: "", satuan: "", stok_minimum: 0,
  harga_jual_normal: 0, ditanggung_bpjs: false,
};

export default function MasterObatPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const qc = useQueryClient();

  const { data: obatList = [], isLoading, error } = useQuery({
    queryKey: ["obat"],
    queryFn: getObatWithStok,
  });

  const mutation = useMutation({
    mutationFn: (data: Omit<Obat, "id_obat" | "total_stok">) => insertObat(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obat"] });
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const filtered = obatList.filter((o) =>
    o.nama_obat.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.nama_obat || !form.satuan) {
      setFormError("Nama obat dan satuan wajib diisi.");
      return;
    }
    mutation.mutate({
      nama_obat: form.nama_obat,
      satuan: form.satuan,
      stok_minimum: Number(form.stok_minimum),
      harga_jual_normal: Number(form.harga_jual_normal),
      ditanggung_bpjs: form.ditanggung_bpjs,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-400" /> Master Data Obat
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Kelola daftar obat, harga, dan ketentuan BPJS.
            {!isLoading && <span className="ml-2 text-teal-400 font-medium">{obatList.length} obat terdaftar</span>}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-900/40"
        >
          <Plus className="w-4 h-4" /> Tambah Obat
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Cari nama obat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40 bg-slate-800/50">
                {["Nama Obat", "Satuan", "Harga Normal", "Stok Min.", "Total Stok", "BPJS"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-slate-800 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr><td colSpan={6} className="px-5 py-6 text-red-400 text-sm">Gagal memuat data: {(error as Error).message}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Tidak ada obat ditemukan.</td></tr>
              ) : (
                filtered.map((o) => {
                  const isLow = o.total_stok < o.stok_minimum;
                  return (
                    <tr key={o.id_obat} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-200">{o.nama_obat}</td>
                      <td className="px-5 py-3 text-slate-400">{o.satuan}</td>
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">{formatRp(o.harga_jual_normal)}</td>
                      <td className="px-5 py-3 text-slate-400">{o.stok_minimum}</td>
                      <td className="px-5 py-3">
                        <span className={cn("font-semibold flex items-center gap-1", isLow ? "text-red-400" : "text-slate-200")}>
                          {isLow && <TrendingDown className="w-3.5 h-3.5" />}
                          {o.total_stok}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {o.ditanggung_bpjs ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            <ShieldCheck className="w-3 h-3" /> Ditanggung
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs text-slate-500 border border-slate-700">Umum</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h2 className="font-bold text-white flex items-center gap-2"><Pill className="w-4 h-4 text-teal-400" /> Tambah Obat Baru</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Obat *</label>
                <input type="text" value={form.nama_obat} onChange={(e) => setForm(f => ({ ...f, nama_obat: e.target.value }))} placeholder="cth: Amoksisilin 500mg"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Satuan *</label>
                  <input type="text" value={form.satuan} onChange={(e) => setForm(f => ({ ...f, satuan: e.target.value }))} placeholder="Tablet / Kapsul / Vial"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Stok Minimum</label>
                  <input type="number" min={0} value={form.stok_minimum} onChange={(e) => setForm(f => ({ ...f, stok_minimum: Number(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Harga Jual Normal (Rp)</label>
                <input type="number" min={0} value={form.harga_jual_normal} onChange={(e) => setForm(f => ({ ...f, harga_jual_normal: Number(e.target.value) }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.ditanggung_bpjs} onChange={(e) => setForm(f => ({ ...f, ditanggung_bpjs: e.target.checked }))} className="w-4 h-4 accent-teal-500" />
                <span className="text-sm text-slate-300">Ditanggung BPJS Kesehatan</span>
              </label>
              {formError && <p className="text-red-400 text-xs">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 font-semibold text-sm transition-all">Batal</button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
