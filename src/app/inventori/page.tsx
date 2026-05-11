"use client";

import { useState } from "react";
import {
  Package, Plus, Upload, Search, CalendarDays,
  ChevronDown, Boxes, FileSpreadsheet, X,
} from "lucide-react";
import { mockBatch, mockSupplier, mockObat } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function daysDiff(dateStr: string) {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft < 0)
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">Kadaluarsa</span>;
  if (daysLeft <= 30)
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">{daysLeft}h lagi</span>;
  if (daysLeft <= 90)
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">{daysLeft}h lagi</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">{daysLeft}h lagi</span>;
}

export default function InventoriPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const filtered = mockBatch.filter(
    (b) =>
      b.nama_obat.toLowerCase().includes(search.toLowerCase()) ||
      b.nomor_batch.toLowerCase().includes(search.toLowerCase()) ||
      b.nama_supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-400" /> Inventori Batch Obat
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manajemen penerimaan obat berbasis batch dengan sistem FEFO.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-900/40"
        >
          <Plus className="w-4 h-4" /> Penerimaan Obat Baru
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Batch Aktif", value: mockBatch.filter((b) => daysDiff(b.tgl_kadaluarsa) >= 0).length, color: "text-teal-400" },
          { label: "Batch Hampir Kadaluarsa", value: mockBatch.filter((b) => { const d = daysDiff(b.tgl_kadaluarsa); return d >= 0 && d <= 90; }).length, color: "text-amber-400" },
          { label: "Batch Kadaluarsa", value: mockBatch.filter((b) => daysDiff(b.tgl_kadaluarsa) < 0).length, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-slate-900 border border-slate-700/60 p-4 text-center">
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
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

      {/* Batch Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
          <Boxes className="w-5 h-5 text-teal-400" />
          <h2 className="font-semibold text-white">Daftar Batch (FEFO Order)</h2>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} batch ditemukan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                {["Nama Obat", "No. Batch", "Supplier", "Tgl Terima", "Tgl Kadaluarsa", "Sisa Stok", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => new Date(a.tgl_kadaluarsa).getTime() - new Date(b.tgl_kadaluarsa).getTime()).map((b) => {
                const dl = daysDiff(b.tgl_kadaluarsa);
                return (
                  <tr key={b.id_batch}
                    className={cn("border-b border-slate-800 hover:bg-slate-800/40 transition-colors",
                      dl < 0 && "bg-red-950/20",
                      dl >= 0 && dl <= 90 && "bg-amber-950/10")}>
                    <td className="px-5 py-3 font-medium text-slate-200">{b.nama_obat}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-300">{b.nomor_batch}</td>
                    <td className="px-5 py-3 text-slate-400">{b.nama_supplier}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(b.tgl_terima).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-3 text-slate-300">{new Date(b.tgl_kadaluarsa).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-3">
                      <span className={cn("font-semibold", dl < 0 ? "text-red-400" : "text-slate-200")}>{b.sisa_stok}</span>
                      <span className="text-xs text-slate-500 ml-1">unit</span>
                    </td>
                    <td className="px-5 py-3"><ExpiryBadge daysLeft={dl} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Penerimaan Obat Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h2 className="font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" /> Form Penerimaan Obat
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Supplier */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Supplier</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors">
                    <option value="">-- Pilih Supplier --</option>
                    {mockSupplier.map((s) => (
                      <option key={s.id_supplier} value={s.id_supplier}>{s.nama_supplier}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Obat */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama Obat</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors">
                    <option value="">-- Pilih Obat --</option>
                    {mockObat.map((o) => (
                      <option key={o.id_obat} value={o.id_obat}>{o.nama_obat} ({o.satuan})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Batch Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nomor Batch</label>
                  <input type="text" placeholder="e.g. KF-AMX-2601"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Jumlah (unit)</label>
                  <input type="number" placeholder="0" min={1}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Tgl Terima
                  </label>
                  <input type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Tgl Kadaluarsa
                  </label>
                  <input type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Upload Nota / Faktur Supplier</label>
                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-8 cursor-pointer transition-all",
                  selectedFile
                    ? "border-teal-500/50 bg-teal-950/20"
                    : "border-slate-700 hover:border-teal-500/50 hover:bg-slate-800/50"
                )}>
                  <input type="file" accept=".pdf,.jpg,.png" className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0]?.name ?? null)} />
                  <Upload className={cn("w-8 h-8", selectedFile ? "text-teal-400" : "text-slate-600")} />
                  <span className="text-sm text-slate-400">
                    {selectedFile ? <span className="text-teal-300 font-medium">{selectedFile}</span> : "Klik untuk upload PDF/JPG/PNG"}
                  </span>
                  <span className="text-xs text-slate-600">Maks. 10MB</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-700/60">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 font-semibold text-sm transition-all">
                Batal
              </button>
              <button className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-900/40">
                Simpan Penerimaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
