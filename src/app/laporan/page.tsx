import { BarChart3, TrendingUp, FileDown, Calendar } from "lucide-react";
import { mockResep, mockObat } from "@/lib/mock-data";

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

const totalPendapatan = mockResep.filter((r) => r.status_bayar === "Lunas").reduce((s, r) => s + r.total_bayar, 0);
const totalGratisBpjs = mockResep.filter((r) => r.status_bayar === "Gratis").length;

export default function LaporanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-400" /> Laporan & Analitik
          </h1>
          <p className="text-slate-400 text-sm mt-1">Ringkasan transaksi, penjualan obat, dan penggunaan BPJS.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500">
            <option>Mei 2026</option><option>April 2026</option><option>Maret 2026</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-teal-500/50 text-slate-300 text-sm transition-all">
            <FileDown className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Transaksi", value: mockResep.length, sub: "resep diproses", icon: Calendar, color: "from-teal-600 to-cyan-700" },
          { label: "Pendapatan Umum", value: formatRp(totalPendapatan), sub: "pembayaran tunai/non-tunai", icon: TrendingUp, color: "from-blue-600 to-indigo-700" },
          { label: "Resep BPJS Gratis", value: totalGratisBpjs, sub: "ditanggung pemerintah", icon: BarChart3, color: "from-emerald-600 to-teal-700" },
          { label: "Obat Terlaris", value: "Paracetamol", sub: "450 unit terdistribusi", icon: TrendingUp, color: "from-violet-600 to-purple-700" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl bg-gradient-to-br ${card.color} p-5 shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-white/70 uppercase tracking-wider">{card.label}</p>
              <card.icon className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-white/60 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Mock Chart Placeholder */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 p-6">
        <h2 className="font-semibold text-white mb-4">Tren Transaksi Harian (Mei 2026)</h2>
        <div className="flex items-end gap-2 h-40">
          {[3, 7, 5, 9, 6, 11, 8, 4, 12, 7, 6, 9, 10, 5, 8, 13, 7, 9, 6, 11, 8, 10, 7, 5, 9, 12, 8, 6, 10, 7].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-teal-700 to-teal-400 hover:from-teal-600 hover:to-teal-300 transition-all cursor-pointer"
                style={{ height: `${(v / 13) * 100}%` }}
                title={`Hari ${i + 1}: ${v} transaksi`}
              />
              {(i + 1) % 5 === 0 && <span className="text-[8px] text-slate-600">{i + 1}</span>}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">Hari ke-</p>
      </div>

      {/* Resep Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/60">
          <h2 className="font-semibold text-white">Riwayat Transaksi Resep</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                {["ID Resep", "Pasien", "Dokter", "Total", "Status Bayar", "Status Resep"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockResep.map((r) => (
                <tr key={r.id_resep} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{r.id_resep.toUpperCase()}</td>
                  <td className="px-5 py-3 text-slate-200 font-medium">{r.nama_pasien}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{r.nama_dokter}</td>
                  <td className="px-5 py-3">
                    <span className={r.total_bayar === 0 ? "text-teal-400 font-semibold" : "text-slate-200 font-semibold"}>
                      {r.total_bayar === 0 ? "Rp 0 (BPJS)" : formatRp(r.total_bayar)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${r.status_bayar === "Gratis" ? "bg-teal-500/20 text-teal-300 border-teal-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}`}>
                      {r.status_bayar}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      r.status === "Selesai" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                      r.status === "Siap" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                      "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
