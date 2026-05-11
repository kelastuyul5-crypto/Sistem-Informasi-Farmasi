"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, ShieldCheck, AlertCircle } from "lucide-react";
import { getPasien } from "@/lib/supabase-queries";

function PasienTableSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700/60 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="border-b border-slate-700/40">
              <td className="px-4 py-3"><div className="h-3 bg-slate-800 rounded animate-pulse w-24" /></td>
              <td className="px-4 py-3"><div className="h-3 bg-slate-800 rounded animate-pulse w-36" /></td>
              <td className="px-4 py-3"><div className="h-3 bg-slate-800 rounded animate-pulse w-20" /></td>
              <td className="px-4 py-3"><div className="h-3 bg-slate-800 rounded animate-pulse w-16" /></td>
              <td className="px-4 py-3"><div className="h-3 bg-slate-800 rounded animate-pulse w-28" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PasienPage() {
  const [search, setSearch] = useState("");

  const { data: pasienList = [], isLoading, error } = useQuery({
    queryKey: ["pasien"],
    queryFn: getPasien,
  });

  const filtered = pasienList.filter(
    (p) =>
      p.nama_pasien.toLowerCase().includes(search.toLowerCase()) ||
      p.no_rekam_medis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-400" /> Data Pasien
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Daftar rekam medis dan profil pasien terdaftar.
          {!isLoading && (
            <span className="ml-2 text-teal-400 font-medium">{pasienList.length} pasien</span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Cari nama atau No. Rekam Medis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm">Gagal memuat data: {(error as Error).message}</p>
      )}

      {/* Table */}
      {isLoading ? (
        <PasienTableSkeleton />
      ) : (
        <div className="rounded-xl border border-slate-700/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700/60">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">No. Rekam Medis</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nama Pasien</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tgl Lahir</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Riwayat Alergi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500 text-sm">
                    Tidak ada pasien ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id_pasien}
                    className="bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.no_rekam_medis}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{p.nama_pasien}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(p.tgl_lahir).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      {p.status_bpjs ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          <ShieldCheck className="w-3 h-3" /> BPJS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs text-slate-500 border border-slate-700">Umum</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.riwayat_alergi ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {p.riwayat_alergi}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
