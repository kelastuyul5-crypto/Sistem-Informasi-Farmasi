import { Pill, ShieldCheck, TrendingDown, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { mockObat } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

export default function MasterObatPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-400" /> Master Data Obat
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola daftar obat, harga, dan ketentuan BPJS.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-900/40">
          <Plus className="w-4 h-4" /> Tambah Obat
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" placeholder="Cari nama obat..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors" />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40 bg-slate-800/50">
                {["Nama Obat", "Satuan", "Harga Normal", "Stok Minimum", "Total Stok", "BPJS", "Aksi"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockObat.map((o) => {
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
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-teal-600/30 hover:text-teal-400 text-slate-400 transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-red-600/30 hover:text-red-400 text-slate-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
