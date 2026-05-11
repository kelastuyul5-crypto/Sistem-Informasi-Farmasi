"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageX, ClipboardList, TrendingDown, Calendar, Boxes } from "lucide-react";
import { getBatchWithJoins, getObatWithStok, getResepWithDetail } from "@/lib/supabase-queries";
import { cn } from "@/lib/utils";

function daysDiff(d: string) {
  return Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className={cn("relative rounded-xl border p-5 overflow-hidden hover:scale-[1.02] transition-transform", color)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: batches = [] } = useQuery({ queryKey: ["batch"], queryFn: getBatchWithJoins });
  const { data: obatList = [] } = useQuery({ queryKey: ["obat"], queryFn: getObatWithStok });
  const { data: resepList = [] } = useQuery({ queryKey: ["resep"], queryFn: getResepWithDetail });

  const expiredBatches = batches.filter(b => daysDiff(b.tgl_kadaluarsa) < 0);
  const soonBatches = batches.filter(b => { const d = daysDiff(b.tgl_kadaluarsa); return d >= 0 && d <= 90; });
  const alertBatches = [...expiredBatches, ...soonBatches].sort((a, b) => daysDiff(a.tgl_kadaluarsa) - daysDiff(b.tgl_kadaluarsa));
  const lowStock = obatList.filter(o => o.total_stok < o.stok_minimum);
  const pending = resepList.filter(r => r.status === "Menunggu");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Alert Center & Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Pantauan real-time stok kritis, kadaluarsa, dan resep menunggu validasi.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Batch Kadaluarsa" value={expiredBatches.length} icon={PackageX} color="bg-red-900/40 border-red-700/50" sub="Segera musnahkan" />
        <StatCard label="Hampir Kadaluarsa" value={soonBatches.length} icon={Calendar} color="bg-amber-900/40 border-amber-700/50" sub="≤ 90 hari lagi" />
        <StatCard label="Stok Kritis" value={lowStock.length} icon={TrendingDown} color="bg-orange-900/40 border-orange-700/50" sub="Di bawah minimum" />
        <StatCard label="Resep Menunggu" value={pending.length} icon={ClipboardList} color="bg-blue-900/40 border-blue-700/50" sub="Perlu validasi" />
      </div>

      {/* Expiry Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-white">Obat Hampir / Sudah Kadaluarsa</h2>
          <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">{alertBatches.length} batch</span>
        </div>
        {alertBatches.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">Tidak ada batch mendekati kadaluarsa. ✓</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700/40">
                {["Nama Obat","No. Batch","Supplier","Tgl Kadaluarsa","Sisa Stok","Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {alertBatches.map(b => {
                  const dl = daysDiff(b.tgl_kadaluarsa);
                  const expired = dl < 0;
                  return (
                    <tr key={b.id_batch} className={cn("border-b border-slate-800", expired ? "bg-red-950/50" : dl <= 30 ? "bg-orange-950/40" : "bg-amber-950/30")}>
                      <td className="px-5 py-3 font-medium text-slate-200">{b.nama_obat}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-300">{b.nomor_batch}</td>
                      <td className="px-5 py-3 text-slate-400">{b.nama_supplier ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-300">{new Date(b.tgl_kadaluarsa).toLocaleDateString("id-ID")}</td>
                      <td className="px-5 py-3 text-slate-300">{b.sisa_stok} unit</td>
                      <td className="px-5 py-3">
                        {expired
                          ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">● KADALUARSA</span>
                          : <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border", dl <= 30 ? "bg-orange-500/20 text-orange-300 border-orange-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30")}>● {dl} hari lagi</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low Stock */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
          <Boxes className="w-5 h-5 text-orange-400" />
          <h2 className="font-semibold text-white">Stok Kritis</h2>
          <span className="ml-auto text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">{lowStock.length} obat</span>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">Semua stok aman. ✓</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700/40">
                {["Nama Obat","Satuan","Stok Tersedia","Stok Minimum","Defisit"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {lowStock.map(o => (
                  <tr key={o.id_obat} className="border-b border-slate-800 bg-orange-950/20 hover:bg-orange-950/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-200">{o.nama_obat}</td>
                    <td className="px-5 py-3 text-slate-400">{o.satuan}</td>
                    <td className="px-5 py-3"><span className="font-bold text-red-400">{o.total_stok}</span></td>
                    <td className="px-5 py-3 text-slate-400">{o.stok_minimum}</td>
                    <td className="px-5 py-3"><span className="text-orange-400 font-semibold">-{o.stok_minimum - o.total_stok}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Resep */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
          <ClipboardList className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-white">Resep Menunggu Validasi</h2>
          <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">{pending.length} antrian</span>
        </div>
        {pending.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">Tidak ada resep menunggu. ✓</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {pending.map(r => (
              <div key={r.id_resep} className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors">
                <div>
                  <p className="font-medium text-slate-200">{r.nama_pasien}</p>
                  <p className="text-xs text-slate-500">{r.no_rekam_medis} · {r.nama_dokter}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                  {r.status_bpjs && <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">BPJS</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
