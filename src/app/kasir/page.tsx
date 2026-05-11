"use client";

import { useState } from "react";
import { CreditCard, Search, CheckCircle, Printer, ShieldCheck, Receipt } from "lucide-react";
import { mockResep } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ReceiptPrint } from "@/components/print/ReceiptPrint";

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

export default function KasirPage() {
  const [selectedResep, setSelectedResep] = useState<(typeof mockResep)[0] | null>(null);
  const readyResep = mockResep.filter((r) => r.status === "Siap");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-teal-400" /> Kasir Pembayaran
        </h1>
        <p className="text-slate-400 text-sm mt-1">Proses pembayaran resep yang telah divalidasi apoteker.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Queue */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/60 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Siap Dibayar</span>
            <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">{readyResep.length}</span>
          </div>
          <div className="p-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Cari pasien..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors" />
            </div>
          </div>
          <div className="divide-y divide-slate-800">
            {readyResep.length === 0 ? (
              <div className="py-10 text-center text-slate-600 text-sm">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Tidak ada antrian pembayaran
              </div>
            ) : (
              readyResep.map((r) => (
                <button key={r.id_resep} onClick={() => setSelectedResep(r)}
                  className={cn("w-full text-left px-4 py-3 hover:bg-slate-800/60 transition-all",
                    selectedResep?.id_resep === r.id_resep && "bg-teal-900/30 border-l-2 border-teal-500")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{r.nama_pasien}</p>
                      <p className="text-xs text-slate-500">{r.no_rekam_medis}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", r.total_bayar === 0 ? "text-teal-400" : "text-white")}>
                        {r.total_bayar === 0 ? "GRATIS" : formatRp(r.total_bayar)}
                      </p>
                      {r.status_bpjs && <span className="text-[10px] text-teal-400">BPJS</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Payment Panel */}
        {selectedResep ? (
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white">{selectedResep.nama_pasien}</h2>
                  <p className="text-xs text-slate-500">{selectedResep.no_rekam_medis} · {selectedResep.nama_dokter}</p>
                </div>
                {selectedResep.status_bpjs && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> BPJS Aktif
                  </span>
                )}
              </div>

              <div className="p-5 space-y-2">
                {selectedResep.detail.map((d) => (
                  <div key={d.id_obat} className="flex items-center justify-between py-2 border-b border-slate-800">
                    <div>
                      <p className="text-sm text-slate-200">{d.nama_obat}</p>
                      <p className="text-xs text-slate-500">{d.jumlah_diminta}x · {d.aturan_pakai}</p>
                    </div>
                    <div className="text-right">
                      {d.subtotal === 0 ? (
                        <div>
                          <p className="text-sm font-bold text-teal-400">Rp 0</p>
                          <p className="text-[10px] text-teal-500 flex items-center gap-0.5 justify-end">
                            <ShieldCheck className="w-2.5 h-2.5" /> BPJS Subsidi
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-slate-200">{formatRp(d.subtotal)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="px-5 pb-5">
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 text-sm">Total Pembayaran</span>
                    <span className={cn("text-3xl font-bold", selectedResep.total_bayar === 0 ? "text-teal-400" : "text-white")}>
                      {selectedResep.total_bayar === 0 ? "Rp 0" : formatRp(selectedResep.total_bayar)}
                    </span>
                  </div>
                  {selectedResep.status_bayar === "Gratis" && (
                    <p className="text-xs text-teal-400 text-right">Seluruh biaya ditanggung BPJS Kesehatan</p>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <button className="flex-1 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/40">
                    <CheckCircle className="w-5 h-5" />
                    {selectedResep.total_bayar === 0 ? "Konfirmasi Gratis (BPJS)" : "Konfirmasi Lunas"}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="py-3 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-all flex items-center gap-2">
                    <Printer className="w-4 h-4" /> Struk
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center">
            <div className="text-center text-slate-600 py-20">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Pilih antrian untuk memproses pembayaran</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Print Receipt */}
      <ReceiptPrint resep={selectedResep ?? mockResep[2]} />
    </div>
  );
}
