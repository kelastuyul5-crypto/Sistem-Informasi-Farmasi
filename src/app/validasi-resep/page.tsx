"use client";

import { useState } from "react";
import {
  ClipboardCheck, ChevronRight, ShieldCheck, CreditCard,
  CheckCircle, XCircle, Clock, User, Printer,
} from "lucide-react";
import { mockResep } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type ResepStatus = "Menunggu" | "Siap" | "Selesai" | "Ditolak";

const statusConfig: Record<ResepStatus, { label: string; color: string }> = {
  Menunggu: { label: "Menunggu", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  Siap: { label: "Siap Diambil", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  Selesai: { label: "Selesai", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  Ditolak: { label: "Ditolak", color: "bg-red-500/20 text-red-300 border-red-500/30" },
};

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

export default function ValidasiResepPage() {
  const [selectedResep, setSelectedResep] = useState<(typeof mockResep)[0] | null>(mockResep[0]);
  const [catatan, setCatatan] = useState("");

  const pending = mockResep.filter((r) => r.status === "Menunggu");
  const others = mockResep.filter((r) => r.status !== "Menunggu");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-teal-400" /> Validasi Resep & Kasir
        </h1>
        <p className="text-slate-400 text-sm mt-1">Verifikasi resep dokter dan proses pembayaran pasien.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Prescription Queue */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pending */}
          <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/60 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Antrian Menunggu</span>
              <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">{pending.length}</span>
            </div>
            <div className="divide-y divide-slate-800">
              {pending.map((r) => (
                <button key={r.id_resep} onClick={() => setSelectedResep(r)}
                  className={cn("w-full text-left px-4 py-3 hover:bg-slate-800/60 transition-all flex items-center gap-3",
                    selectedResep?.id_resep === r.id_resep && "bg-teal-900/30 border-l-2 border-teal-500")}>
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{r.nama_pasien}</p>
                    <p className="text-xs text-slate-500 truncate">{r.no_rekam_medis} · {r.detail.length} obat</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {r.status_bpjs && <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 block mb-1">BPJS</span>}
                    <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Others */}
          <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/60">
              <span className="text-sm font-semibold text-slate-400">Riwayat Hari Ini</span>
            </div>
            <div className="divide-y divide-slate-800">
              {others.map((r) => {
                const cfg = statusConfig[r.status as ResepStatus];
                return (
                  <button key={r.id_resep} onClick={() => setSelectedResep(r)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-800/40 transition-colors flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{r.nama_pasien}</p>
                      <p className="text-xs text-slate-500 truncate">{r.no_rekam_medis}</p>
                    </div>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0", cfg.color)}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Checkout Panel */}
        {selectedResep ? (
          <div className="lg:col-span-3 rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-700/60">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-white text-lg">{selectedResep.nama_pasien}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedResep.no_rekam_medis} · {selectedResep.nama_dokter}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedResep.status_bpjs && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" /> BPJS Aktif
                    </span>
                  )}
                  <span className={cn("px-2 py-1 rounded-lg text-xs font-semibold border", statusConfig[selectedResep.status as ResepStatus].color)}>
                    {statusConfig[selectedResep.status as ResepStatus].label}
                  </span>
                </div>
              </div>
            </div>

            {/* Medicine List */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40">
                    {["Nama Obat", "Aturan Pakai", "Jml", "Harga Satuan", "Subtotal"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedResep.detail.map((d) => (
                    <tr key={d.id_obat} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-200">{d.nama_obat}</p>
                        {d.ditanggung_bpjs && selectedResep.status_bpjs && (
                          <span className="inline-flex items-center gap-1 text-[10px] mt-0.5 px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/20">
                            <ShieldCheck className="w-2.5 h-2.5" /> BPJS Subsidi
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{d.aturan_pakai}</td>
                      <td className="px-5 py-3 text-slate-300">{d.jumlah_diminta}</td>
                      <td className="px-5 py-3">
                        {d.harga_final === 0 ? (
                          <span className="font-semibold text-teal-400">Rp 0</span>
                        ) : (
                          <span className="text-slate-300">{formatRp(d.harga_final)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {d.subtotal === 0 ? (
                          <span className="font-bold text-teal-400">Rp 0 ✓</span>
                        ) : (
                          <span className="font-semibold text-slate-200">{formatRp(d.subtotal)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Catatan Apoteker */}
            <div className="px-5 py-3 border-t border-slate-700/60">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Catatan Apoteker</label>
              <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2}
                placeholder="Tambahkan catatan jika diperlukan..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none transition-colors" />
            </div>

            {/* Total & Actions */}
            <div className="px-5 py-4 border-t border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total Pembayaran</span>
                <div className="text-right">
                  <span className={cn("text-2xl font-bold", selectedResep.total_bayar === 0 ? "text-teal-400" : "text-white")}>
                    {selectedResep.total_bayar === 0 ? "Rp 0" : formatRp(selectedResep.total_bayar)}
                  </span>
                  {selectedResep.status_bayar === "Gratis" && (
                    <p className="text-xs text-teal-400 mt-0.5">Ditanggung BPJS — Gratis</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-lg border border-red-700/60 text-red-400 hover:bg-red-950/40 font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Tolak Resep
                </button>
                <button className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/40">
                  <CheckCircle className="w-4 h-4" /> Validasi & Proses
                </button>
                <button className="py-2.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-all flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center">
            <div className="text-center text-slate-600 py-20">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Pilih resep dari antrian untuk melihat detail</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
