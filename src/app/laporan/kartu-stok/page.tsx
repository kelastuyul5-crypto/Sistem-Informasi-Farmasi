"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search, ChevronDown, Printer, Activity, Box } from "lucide-react";
import { getObatWithStok, getKartuStok } from "@/lib/supabase-queries";
import { cn } from "@/lib/utils";

export default function KartuStokPage() {
  const [selectedObatId, setSelectedObatId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  const { data: obatList = [], isLoading: loadingObat } = useQuery({ 
    queryKey: ["obat"], 
    queryFn: getObatWithStok 
  });

  const { data: mutasiList = [], isLoading: loadingMutasi } = useQuery({
    queryKey: ["kartu-stok", selectedObatId, month, year],
    queryFn: () => getKartuStok(selectedObatId, month, year),
    enabled: !!selectedObatId
  });

  const selectedObat = obatList.find(o => o.id_obat === selectedObatId);

  // Filter for dropdown search
  const filteredObat = obatList.filter(o => 
    o.nama_obat.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelectObat(id: string, name: string) {
    setSelectedObatId(id);
    setSearch(name);
    setShowDropdown(false);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header - Hidden on Print */}
      <div className="flex items-start justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-400" /> Laporan Kartu Stok
          </h1>
          <p className="text-slate-400 text-sm mt-1">Lacak riwayat mutasi masuk, keluar, dan opname per item obat.</p>
        </div>
        {selectedObat && (
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all border border-slate-700 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Cetak Kartu Stok
          </button>
        )}
      </div>

      {/* Selector - Hidden on Print */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 p-5 no-print relative z-20">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Pilih Obat untuk Ditampilkan</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder={loadingObat ? "Memuat data obat..." : "Ketik nama obat..."}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              
              {showDropdown && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-30">
                  {filteredObat.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-500">Obat tidak ditemukan.</p>
                  ) : (
                    filteredObat.map(o => (
                      <button
                        key={o.id_obat}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectObat(o.id_obat, o.nama_obat)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0 flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-200">{o.nama_obat}</p>
                          <p className="text-xs text-slate-500">{o.satuan}</p>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium border",
                          o.total_stok < o.stok_minimum 
                            ? "bg-red-500/10 text-red-400 border-red-500/30" 
                            : "bg-teal-500/10 text-teal-400 border-teal-500/30"
                        )}>
                          Sisa: {o.total_stok}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Bulan</label>
            <div className="relative">
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">1 Tahun Penuh</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={(i + 1).toString()}>
                    {new Date(2000, i, 1).toLocaleDateString("id-ID", { month: "long" })}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="w-full md:w-32">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Tahun</label>
            <div className="relative">
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y.toString()}>{y}</option>;
                })}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Print View & Table Area */}
      {selectedObat ? (
        <div id="print-area" className="rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden print:bg-white print:border-none print:text-black">
          
          {/* Document Header (Visible heavily on print) */}
          <div className="p-6 border-b border-slate-700/60 print:border-black">
            <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
              <h2 className="text-xl font-bold uppercase tracking-widest">Apotek RS. Sejahtera Medika</h2>
              <p className="text-sm">Jl. Kesehatan No. 1, Jakarta | Telp: (021) 555-0100</p>
              <h3 className="text-lg font-bold mt-4 underline underline-offset-4">KARTU STOK OBAT</h3>
              <p className="text-sm mt-1 font-semibold">
                Periode: {month === "ALL" 
                  ? `Tahun ${year}` 
                  : new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </p>
            </div>
            
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                  <Box className="w-5 h-5 text-teal-400 print:hidden" /> {selectedObat.nama_obat}
                </h2>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-slate-400 print:text-black">
                    <span className="inline-block w-24">Satuan</span>: <span className="font-medium text-slate-200 print:text-black">{selectedObat.satuan}</span>
                  </p>
                  <p className="text-sm text-slate-400 print:text-black">
                    <span className="inline-block w-24">Stok Minimum</span>: <span className="font-medium text-slate-200 print:text-black">{selectedObat.stok_minimum}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 print:text-black uppercase tracking-wider mb-1">Stok Sistem Saat Ini</p>
                <p className={cn(
                  "text-3xl font-bold", 
                  selectedObat.total_stok < selectedObat.stok_minimum ? "text-red-400 print:text-black" : "text-teal-400 print:text-black"
                )}>
                  {selectedObat.total_stok}
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm print:text-xs">
              <thead>
                <tr className="border-b border-slate-700/40 print:border-black print:border-b-2 bg-slate-800/50 print:bg-transparent">
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 print:text-black uppercase">Tanggal & Waktu</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 print:text-black uppercase">No. Batch</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 print:text-black uppercase">Keterangan</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-400 print:text-black uppercase">Masuk (+)</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-400 print:text-black uppercase">Keluar (-)</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 print:text-black uppercase">Referensi ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-black">
                {loadingMutasi ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Memuat riwayat mutasi...</td></tr>
                ) : mutasiList.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Belum ada riwayat pergerakan stok untuk obat ini pada periode yang dipilih.</td></tr>
                ) : (
                  mutasiList.map((m) => {
                    const isMasuk = m.jenis_mutasi === "Masuk";
                    const isOpname = m.jenis_mutasi === "Opname";
                    
                    // Opname difference logic: if jumlah is positive, it's an addition (Masuk). If negative, it's deduction (Keluar).
                    // For standard Keluar_Resep or Expired, jumlah is stored as positive but acts as Keluar.
                    let inQty = 0;
                    let outQty = 0;

                    if (isMasuk) {
                      inQty = m.jumlah;
                    } else if (isOpname) {
                      if (m.jumlah > 0) inQty = m.jumlah;
                      else outQty = Math.abs(m.jumlah);
                    } else {
                      // Keluar_Resep, Expired
                      outQty = Math.abs(m.jumlah);
                    }

                    return (
                      <tr key={m.id_mutasi} className="hover:bg-slate-800/30 print:hover:bg-transparent transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-slate-400 print:text-black whitespace-nowrap">
                          {new Date(m.created_at).toLocaleString("id-ID", { 
                            year: "numeric", month: "2-digit", day: "2-digit", 
                            hour: "2-digit", minute: "2-digit" 
                          })}
                        </td>
                        <td className="px-5 py-3 text-slate-300 print:text-black font-mono text-xs">
                          {m.batch.nomor_batch}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-semibold print:border-none print:px-0 print:py-0 print:bg-transparent",
                            isMasuk ? "bg-green-500/20 text-green-300" :
                            m.jenis_mutasi === "Keluar_Resep" ? "bg-blue-500/20 text-blue-300" :
                            isOpname ? "bg-purple-500/20 text-purple-300" :
                            "bg-red-500/20 text-red-300"
                          )}>
                            {m.jenis_mutasi === "Keluar_Resep" ? "Penjualan (Resep)" : m.jenis_mutasi}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {inQty > 0 ? <span className="font-bold text-green-400 print:text-black">+{inQty}</span> : <span className="text-slate-600 print:text-gray-400">-</span>}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {outQty > 0 ? <span className="font-bold text-red-400 print:text-black">-{outQty}</span> : <span className="text-slate-600 print:text-gray-400">-</span>}
                        </td>
                        <td className="px-5 py-3 text-slate-500 print:text-black font-mono text-[10px] break-all max-w-[150px]">
                          {m.id_referensi_transaksi ? m.id_referensi_transaksi.split("-")[0] + "..." : "Manual"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Signature Block (Hidden on Screen, Visible on Print) */}
          <div className="hidden print:block mt-12 w-full">
            <div className="flex justify-end pr-12">
              <div className="text-center">
                <p className="text-sm mb-16">Jakarta, {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
                <p className="text-sm font-bold underline">Apoteker Penanggung Jawab</p>
                <p className="text-xs mt-1">SIPA: 19900101/SIPA/2026/001</p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="rounded-xl bg-slate-900/50 border border-slate-800 border-dashed p-12 text-center flex flex-col items-center justify-center no-print">
          <Activity className="w-12 h-12 text-slate-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-400">Belum ada obat yang dipilih</h3>
          <p className="text-sm text-slate-500 mt-1">Pilih obat pada kotak pencarian di atas untuk melihat riwayat mutasi.</p>
        </div>
      )}
    </div>
  );
}
