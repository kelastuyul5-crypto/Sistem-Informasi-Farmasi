"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { getResepWithDetail } from "@/lib/supabase-queries";
import { cn } from "@/lib/utils";

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

export default function LaporanPage() {
  const { data: resepList = [], isLoading } = useQuery({ 
    queryKey: ["resep"], 
    queryFn: getResepWithDetail 
  });

  const resepLunas = resepList.filter((r) => r.status === "Selesai" || r.total_bayar > 0 || (r.status_bpjs && r.status !== "Menunggu" && r.status !== "Ditolak"));
  
  // Calculate total revenue from finished/paid transactions
  const totalPendapatan = resepList.reduce((s, r) => s + (r.total_bayar ?? 0), 0);
  
  // Count free BPJS transactions
  const totalGratisBpjs = resepList.filter((r) => r.status_bpjs && r.total_bayar === 0 && r.status !== "Menunggu" && r.status !== "Ditolak").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-400" /> Laporan & Analitik
          </h1>
          <p className="text-slate-400 text-sm mt-1">Ringkasan transaksi, pendapatan kasir, dan penggunaan BPJS.</p>
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Transaksi", value: resepList.length, sub: "seluruh resep terdata", icon: Calendar, color: "from-teal-600 to-cyan-700" },
          { label: "Pendapatan Total", value: formatRp(totalPendapatan), sub: "pembayaran tunai/non-tunai", icon: TrendingUp, color: "from-blue-600 to-indigo-700" },
          { label: "Resep BPJS", value: totalGratisBpjs, sub: "transaksi disubsidi", icon: BarChart3, color: "from-emerald-600 to-teal-700" },
          { label: "Menunggu", value: resepList.filter(r => r.status === "Menunggu").length, sub: "butuh validasi", icon: TrendingUp, color: "from-violet-600 to-purple-700" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl bg-gradient-to-br ${card.color} p-5 shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-white/70 uppercase tracking-wider">{card.label}</p>
              <card.icon className="w-4 h-4 text-white/50" />
            </div>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white/50" />
            ) : (
              <>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-white/60 mt-1">{card.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Resep Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
          <h2 className="font-semibold text-white">Riwayat Transaksi Resep</h2>
          <span className="text-xs text-slate-500">{resepList.length} resep</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                {["Tanggal", "Pasien", "Dokter", "Total", "Status Bayar", "Status Resep"].map((h) => (
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
              ) : resepList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">Tidak ada data transaksi.</td>
                </tr>
              ) : (
                resepList.map((r) => {
                  const total = r.total_bayar ?? 0;
                  const isBpjsGratis = r.status_bpjs && r.detail.every(d => d.ditanggung_bpjs);
                  const isPaid = total > 0 || (isBpjsGratis && r.status !== "Menunggu" && r.status !== "Ditolak");
                  
                  return (
                    <tr key={r.id_resep} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-5 py-3 text-slate-200 font-medium">
                        {r.nama_pasien}
                        <br/><span className="text-xs text-slate-500 font-normal">{r.no_rekam_medis}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{r.nama_dokter}</td>
                      <td className="px-5 py-3">
                        {r.status === "Menunggu" ? (
                          <span className="text-slate-500 italic text-xs">Belum dihitung</span>
                        ) : (
                          <span className={cn("font-semibold", total === 0 ? "text-teal-400" : "text-slate-200")}>
                            {total === 0 ? "Rp 0 (BPJS)" : formatRp(total)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {r.status === "Menunggu" ? (
                          <span className="px-2 py-0.5 rounded-full text-xs text-slate-500 border border-slate-700">Belum diproses</span>
                        ) : (
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border", 
                            isPaid ? (total === 0 ? "bg-teal-500/20 text-teal-300 border-teal-500/30" : "bg-green-500/20 text-green-300 border-green-500/30") : "bg-slate-800 text-slate-400 border-slate-700"
                          )}>
                            {isPaid ? (total === 0 ? "Gratis (Subsidi)" : "Lunas") : "Belum Lunas"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border", 
                          r.status === "Selesai" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                          r.status === "Siap" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                          r.status === "Ditolak" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                          "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        )}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
