import {
  AlertTriangle,
  PackageX,
  ClipboardList,
  TrendingDown,
  Calendar,
  Boxes,
} from "lucide-react";
import { mockBatch, mockObat, mockResep, mockAlertSummary } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function daysDiff(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className={cn("relative rounded-xl border p-5 overflow-hidden group hover:scale-[1.02] transition-transform", color)}>
      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-white to-transparent" />
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
  const expiryBatches = mockBatch
    .map((b) => ({ ...b, daysLeft: daysDiff(b.tgl_kadaluarsa) }))
    .filter((b) => b.daysLeft <= 90)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const lowStockObat = mockObat.filter((o) => o.total_stok < o.stok_minimum);
  const pendingResep = mockResep.filter((r) => r.status === "Menunggu");

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Alert Center & Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Pantauan real-time stok kritis, kadaluarsa, dan resep menunggu validasi.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Batch Kadaluarsa"
          value={mockAlertSummary.expiredCount}
          icon={PackageX}
          color="bg-red-900/40 border-red-700/50"
          sub="Segera musnahkan"
        />
        <StatCard
          label="Hampir Kadaluarsa"
          value={mockAlertSummary.expiringSoonCount}
          icon={Calendar}
          color="bg-amber-900/40 border-amber-700/50"
          sub="≤ 90 hari lagi"
        />
        <StatCard
          label="Stok Kritis"
          value={mockAlertSummary.lowStockCount}
          icon={TrendingDown}
          color="bg-orange-900/40 border-orange-700/50"
          sub="Di bawah minimum"
        />
        <StatCard
          label="Resep Menunggu"
          value={mockAlertSummary.pendingResepCount}
          icon={ClipboardList}
          color="bg-blue-900/40 border-blue-700/50"
          sub="Perlu validasi"
        />
      </div>

      {/* Expiry Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-white">Obat Hampir / Sudah Kadaluarsa</h2>
          <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
            {expiryBatches.length} batch
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                {["Nama Obat", "No. Batch", "Supplier", "Tgl Kadaluarsa", "Sisa Stok", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expiryBatches.map((b) => {
                const expired = b.daysLeft < 0;
                const critical = b.daysLeft >= 0 && b.daysLeft <= 30;
                return (
                  <tr
                    key={b.id_batch}
                    className={cn(
                      "border-b border-slate-800 transition-colors",
                      expired
                        ? "bg-red-950/50 hover:bg-red-950/70"
                        : critical
                        ? "bg-orange-950/40 hover:bg-orange-950/60"
                        : "bg-amber-950/30 hover:bg-amber-950/50"
                    )}
                  >
                    <td className="px-5 py-3 font-medium text-slate-200">{b.nama_obat}</td>
                    <td className="px-5 py-3 font-mono text-slate-300 text-xs">{b.nomor_batch}</td>
                    <td className="px-5 py-3 text-slate-400">{b.nama_supplier}</td>
                    <td className="px-5 py-3 text-slate-300">{new Date(b.tgl_kadaluarsa).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-3 text-slate-300">{b.sisa_stok} unit</td>
                    <td className="px-5 py-3">
                      {expired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                          ● KADALUARSA
                        </span>
                      ) : critical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          ● {b.daysLeft} hari lagi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ● {b.daysLeft} hari lagi
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
          <Boxes className="w-5 h-5 text-orange-400" />
          <h2 className="font-semibold text-white">Stok Kritis</h2>
          <span className="ml-auto text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
            {lowStockObat.length} obat
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                {["Nama Obat", "Satuan", "Stok Tersedia", "Stok Minimum", "Defisit", "BPJS"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lowStockObat.map((o) => (
                <tr key={o.id_obat} className="border-b border-slate-800 bg-orange-950/20 hover:bg-orange-950/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-200">{o.nama_obat}</td>
                  <td className="px-5 py-3 text-slate-400">{o.satuan}</td>
                  <td className="px-5 py-3">
                    <span className="font-bold text-red-400">{o.total_stok}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{o.stok_minimum}</td>
                  <td className="px-5 py-3">
                    <span className="text-orange-400 font-semibold">-{o.stok_minimum - o.total_stok}</span>
                  </td>
                  <td className="px-5 py-3">
                    {o.ditanggung_bpjs ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        Ditanggung
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs text-slate-500 border border-slate-700">
                        Umum
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Resep Quick View */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
          <ClipboardList className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-white">Resep Menunggu Validasi</h2>
          <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
            {pendingResep.length} antrian
          </span>
        </div>
        <div className="divide-y divide-slate-800">
          {pendingResep.map((r) => (
            <div key={r.id_resep} className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors">
              <div>
                <p className="font-medium text-slate-200">{r.nama_pasien}</p>
                <p className="text-xs text-slate-500">{r.no_rekam_medis} · {r.nama_dokter}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                {r.status_bpjs && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">BPJS</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
