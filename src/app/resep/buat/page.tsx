"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserCheck, PlusCircle, Trash2, AlertTriangle, CheckCircle, ShieldCheck, Stethoscope, FileText, Loader2 } from "lucide-react";
import { getPasien, getObatWithStok, submitResep, type Pasien, type Obat } from "@/lib/supabase-queries";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type CartItem = { id_obat: string; nama_obat: string; satuan: string; jumlah: number; aturan_pakai: string; harga_jual_normal: number; ditanggung_bpjs: boolean; };

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

export default function BuatResepPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const [pasienSearch, setPasienSearch] = useState("");
  const [showPasienDropdown, setShowPasienDropdown] = useState(false);
  const [obatSearch, setObatSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [allergyWarnings, setAllergyWarnings] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: pasienList = [] } = useQuery({ queryKey: ["pasien"], queryFn: getPasien });
  const { data: obatList = [] } = useQuery({ queryKey: ["obat"], queryFn: getObatWithStok });

  const mutation = useMutation({
    mutationFn: submitResep,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resep"] });
      setCart([]); setSelectedPasien(null); setPasienSearch("");
      setAllergyWarnings([]); setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    },
    onError: (e: Error) => setSubmitError(e.message),
  });

  const filteredPasien = pasienList.filter(p =>
    p.nama_pasien.toLowerCase().includes(pasienSearch.toLowerCase()) ||
    p.no_rekam_medis.toLowerCase().includes(pasienSearch.toLowerCase())
  );
  const filteredObat = obatList.filter(o => o.nama_obat.toLowerCase().includes(obatSearch.toLowerCase()));

  function handleSelectPasien(p: Pasien) {
    setSelectedPasien(p); setPasienSearch(p.nama_pasien);
    setShowPasienDropdown(false); setCart([]); setAllergyWarnings([]);
  }

  function handleAddObat(o: Obat) {
    if (!selectedPasien) return;
    if (cart.find(c => c.id_obat === o.id_obat)) return;
    // Allergy check (Rule 1)
    const alergi = (selectedPasien.riwayat_alergi ?? "").toLowerCase();
    if (alergi && o.nama_obat.toLowerCase().split(" ").some(w => alergi.includes(w.replace(/[^a-z]/g, "")))) {
      setAllergyWarnings(prev => prev.includes(o.nama_obat) ? prev : [...prev, o.nama_obat]);
    }
    setCart(prev => [...prev, { id_obat: o.id_obat, nama_obat: o.nama_obat, satuan: o.satuan, jumlah: 10, aturan_pakai: "3x1 setelah makan", harga_jual_normal: o.harga_jual_normal, ditanggung_bpjs: o.ditanggung_bpjs }]);
    setObatSearch("");
  }

  function removeFromCart(id: string) {
    const item = cart.find(c => c.id_obat === id);
    setCart(prev => prev.filter(c => c.id_obat !== id));
    if (item) setAllergyWarnings(prev => prev.filter(n => n !== item.nama_obat));
  }

  function updateCart(id: string, field: "jumlah" | "aturan_pakai", val: string | number) {
    setCart(prev => prev.map(c => c.id_obat === id ? { ...c, [field]: val } : c));
  }

  const isBpjs = selectedPasien?.status_bpjs;
  const totalEstimasi = cart.reduce((sum, i) => sum + (isBpjs && i.ditanggung_bpjs ? 0 : i.harga_jual_normal) * i.jumlah, 0);

  function handleKirimResep() {
    if (!selectedPasien || !cart.length || !user) return;
    setSubmitError("");
    mutation.mutate({
      id_dokter: user.id,
      id_pasien: selectedPasien.id_pasien,
      status_bpjs: selectedPasien.status_bpjs,
      items: cart.map((c) => ({
        id_obat: c.id_obat,
        jumlah_diminta: c.jumlah,
        aturan_pakai: c.aturan_pakai,
        harga_jual_normal: c.harga_jual_normal,
        ditanggung_bpjs: c.ditanggung_bpjs,
      })),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Stethoscope className="w-6 h-6 text-teal-400" /> Buat E-Resep</h1>
        <p className="text-slate-400 text-sm mt-1">{user?.name ?? "Dokter"} — {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {submitSuccess && (
        <div className="rounded-xl bg-green-950/60 border-2 border-green-500/50 p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-300 font-semibold text-sm">Resep berhasil dikirim ke apoteker!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Patient Selector */}
          <div className="rounded-xl bg-slate-900 border border-slate-700/60 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4 text-teal-400" /> Pilih Pasien</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Cari nama pasien atau No. RM..." value={pasienSearch}
                onChange={e => { setPasienSearch(e.target.value); setShowPasienDropdown(true); }}
                onFocus={() => setShowPasienDropdown(true)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500" />
              {showPasienDropdown && pasienSearch && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-52 overflow-y-auto">
                  {filteredPasien.map(p => (
                    <button key={p.id_pasien} onClick={() => handleSelectPasien(p)} className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0">
                      <p className="text-sm font-medium text-slate-200">{p.nama_pasien}</p>
                      <p className="text-xs text-slate-500">{p.no_rekam_medis} {p.status_bpjs && <span className="ml-2 text-teal-400">· BPJS Aktif</span>}</p>
                    </button>
                  ))}
                  {filteredPasien.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">Pasien tidak ditemukan.</p>}
                </div>
              )}
            </div>
            {selectedPasien && (
              <div className="mt-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/40 flex flex-wrap gap-4">
                <div><p className="text-[10px] text-slate-500 uppercase">No. RM</p><p className="text-sm text-slate-200 font-mono">{selectedPasien.no_rekam_medis}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Tgl Lahir</p><p className="text-sm text-slate-200">{new Date(selectedPasien.tgl_lahir).toLocaleDateString("id-ID")}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Status BPJS</p>
                  <p className={cn("text-sm font-semibold", selectedPasien.status_bpjs ? "text-teal-400" : "text-slate-400")}>
                    {selectedPasien.status_bpjs ? `✓ Aktif (${selectedPasien.no_bpjs})` : "Non-BPJS"}
                  </p>
                </div>
                {selectedPasien.riwayat_alergi && (
                  <div><p className="text-[10px] text-slate-500 uppercase">Riwayat Alergi</p><p className="text-sm text-red-400 font-medium">{selectedPasien.riwayat_alergi}</p></div>
                )}
              </div>
            )}
          </div>

          {allergyWarnings.length > 0 && (
            <div className="rounded-xl bg-red-950/60 border-2 border-red-500/60 p-4 flex items-start gap-3 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300 text-sm">⚠ PERINGATAN ALERGI TERDETEKSI!</p>
                {allergyWarnings.map(name => (
                  <p key={name} className="text-xs text-red-400 mt-0.5">Pasien memiliki riwayat alergi terhadap: <strong>{name}</strong></p>
                ))}
              </div>
            </div>
          )}

          {/* Medicine Search */}
          <div className="rounded-xl bg-slate-900 border border-slate-700/60 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Search className="w-4 h-4 text-teal-400" /> Tambah Obat ke Resep</h2>
            <input type="text" placeholder={selectedPasien ? "Cari nama obat..." : "Pilih pasien terlebih dahulu"} value={obatSearch}
              disabled={!selectedPasien} onChange={e => setObatSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 disabled:opacity-40" />
            {obatSearch && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredObat.map(o => (
                  <button key={o.id_obat} onClick={() => handleAddObat(o)}
                    className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500/50 rounded-lg transition-all text-left group">
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-teal-300">{o.nama_obat}</p>
                      <p className="text-xs text-slate-500">{o.satuan} · Stok: {o.total_stok}</p>
                    </div>
                    <div className="text-right">
                      {o.ditanggung_bpjs && <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 block mb-1">BPJS</span>}
                      <PlusCircle className="w-4 h-4 text-teal-500 ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="rounded-xl bg-slate-900 border border-slate-700/60 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-700/60 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            <h2 className="font-semibold text-white">Keranjang Resep</h2>
            <span className="ml-auto text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{cart.length} item</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                <FileText className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Belum ada obat ditambahkan</p>
              </div>
            ) : (
              cart.map(item => {
                const harga = isBpjs && item.ditanggung_bpjs ? 0 : item.harga_jual_normal;
                return (
                  <div key={item.id_obat} className="px-5 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200">{item.nama_obat}</p>
                        {item.ditanggung_bpjs && isBpjs && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded mt-0.5">
                            <ShieldCheck className="w-3 h-3" /> BPJS Gratis
                          </span>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item.id_obat)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2">
                      <input type="number" value={item.jumlah} min={1} onChange={e => updateCart(item.id_obat, "jumlah", Number(e.target.value))}
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500" />
                      <input type="text" value={item.aturan_pakai} onChange={e => updateCart(item.id_obat, "aturan_pakai", e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500" />
                    </div>
                    <p className="text-xs text-right text-slate-400">Subtotal: <span className={cn("font-semibold", harga === 0 ? "text-teal-400" : "text-slate-200")}>{harga === 0 ? "Rp 0 (Subsidi)" : formatRp(harga * item.jumlah)}</span></p>
                  </div>
                );
              })
            )}
          </div>
          {cart.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-700/60 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Estimasi Total</span>
                <span className={cn("font-bold", totalEstimasi === 0 ? "text-teal-400" : "text-white")}>
                  {totalEstimasi === 0 ? "Gratis (BPJS)" : formatRp(totalEstimasi)}
                </span>
              </div>
              {submitError && <p className="text-red-400 text-xs">{submitError}</p>}
              <button onClick={handleKirimResep} disabled={mutation.isPending}
                className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/40 disabled:opacity-60">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Kirim Resep ke Apoteker
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
