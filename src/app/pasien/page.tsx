import { Users, Search, Plus, ShieldCheck, AlertCircle } from "lucide-react";
import { mockPasien } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function PasienPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-400" /> Data Pasien
          </h1>
          <p className="text-slate-400 text-sm mt-1">Daftar rekam medis dan profil pasien terdaftar.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-900/40">
          <Plus className="w-4 h-4" /> Pasien Baru
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" placeholder="Cari nama atau No. Rekam Medis..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockPasien.map((p) => (
          <div key={p.id_pasien}
            className="rounded-xl bg-slate-900 border border-slate-700/60 p-5 hover:border-teal-500/40 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white group-hover:text-teal-300 transition-colors">{p.nama_pasien}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{p.no_rekam_medis}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {p.status_bpjs ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <ShieldCheck className="w-3 h-3" /> BPJS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs text-slate-500 border border-slate-700">Umum</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500 uppercase tracking-wider text-[10px]">Tgl Lahir</p>
                <p className="text-slate-300 mt-0.5">{new Date(p.tgl_lahir).toLocaleDateString("id-ID")}</p>
              </div>
              {p.no_bpjs && (
                <div>
                  <p className="text-slate-500 uppercase tracking-wider text-[10px]">No. BPJS</p>
                  <p className="text-slate-300 mt-0.5 font-mono">{p.no_bpjs}</p>
                </div>
              )}
              {p.riwayat_alergi && (
                <div className="col-span-2">
                  <p className="text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400" /> Riwayat Alergi
                  </p>
                  <p className="text-red-400 mt-0.5 font-medium">{p.riwayat_alergi}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
