import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type Pasien = {
  id_pasien: string;
  no_rekam_medis: string;
  nama_pasien: string;
  tgl_lahir: string;
  riwayat_alergi: string | null;
  status_bpjs: boolean;
  no_bpjs: string | null;
  created_at: string;
};

export type Obat = {
  id_obat: string;
  nama_obat: string;
  satuan: string;
  stok_minimum: number;
  harga_jual_normal: number;
  ditanggung_bpjs: boolean;
  total_stok: number; // computed from SUM(obat_batch.sisa_stok)
};

export type StatusBatch = 'ACTIVE' | 'ARCHIVED' | 'DISPOSED';

export type ObatBatch = {
  id_batch: string;
  id_obat: string;
  id_penerimaan: string;
  nomor_batch: string;
  tgl_kadaluarsa: string;
  sisa_stok: number;
  status_batch: StatusBatch;
  // JOINed fields
  nama_obat: string;
  satuan: string;
  nama_supplier: string | null;
  tgl_terima: string | null;
};

export type Supplier = {
  id_supplier: string;
  nama_supplier: string;
  kontak: string | null;
  alamat: string | null;
};

export type DetailResep = {
  id_detail_resep: string;
  id_resep: string;
  id_obat: string;
  jumlah_diminta: number;
  aturan_pakai: string;
  harga_final: number | null;
  subtotal: number | null;
  nama_obat: string;
  satuan: string;
  ditanggung_bpjs: boolean;
};

export type Resep = {
  id_resep: string;
  id_dokter: string;
  id_pasien: string;
  id_admin: string | null;
  status: "Menunggu" | "Siap" | "Selesai" | "Ditolak";
  catatan_apoteker: string | null;
  created_at: string;
  // JOINed
  nama_pasien: string;
  no_rekam_medis: string;
  status_bpjs: boolean;
  no_bpjs: string | null;
  nama_dokter: string;
  detail: DetailResep[];
  total_bayar: number;
};

// ── QUERIES ───────────────────────────────────────────────────────────────────

export async function getPasien(): Promise<Pasien[]> {
  const { data, error } = await supabase
    .from("pasien")
    .select("*")
    .order("nama_pasien", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getObatWithStok(): Promise<Obat[]> {
  // Fetch obat list
  const { data: obatList, error: err1 } = await supabase
    .from("obat")
    .select("*")
    .order("nama_obat", { ascending: true });
  if (err1) throw new Error(err1.message);

  // Fetch batch sums — only ACTIVE and not near expiry (Rule 12 days)
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + 12);
  const thresholdStr = thresholdDate.toISOString().split("T")[0];

  const { data: batchData, error: err2 } = await supabase
    .from("obat_batch")
    .select("id_obat, sisa_stok")
    .eq("status_batch", "ACTIVE")
    .gt("tgl_kadaluarsa", thresholdStr);
  if (err2) throw new Error(err2.message);

  // Compute total_stok per obat
  const stokMap: Record<string, number> = {};
  for (const b of batchData ?? []) {
    stokMap[b.id_obat] = (stokMap[b.id_obat] ?? 0) + b.sisa_stok;
  }

  return (obatList ?? []).map((o) => ({
    ...o,
    total_stok: stokMap[o.id_obat] ?? 0,
  }));
}

export async function getObatList() {
  const { data, error } = await supabase
    .from("obat")
    .select("*")
    .order("nama_obat");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBatchWithJoins(): Promise<ObatBatch[]> {
  const { data, error } = await supabase
    .from("obat_batch")
    .select(`
      *,
      obat ( nama_obat, satuan ),
      penerimaan_obat ( tgl_terima, supplier ( nama_supplier ) )
    `)
    .order("tgl_kadaluarsa", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((b: any) => ({
    id_batch: b.id_batch,
    id_obat: b.id_obat,
    id_penerimaan: b.id_penerimaan,
    nomor_batch: b.nomor_batch,
    tgl_kadaluarsa: b.tgl_kadaluarsa,
    sisa_stok: b.sisa_stok,
    status_batch: (b.status_batch ?? 'ACTIVE') as StatusBatch,
    nama_obat: b.obat?.nama_obat ?? "—",
    satuan: b.obat?.satuan ?? "—",
    nama_supplier: b.penerimaan_obat?.supplier?.nama_supplier ?? null,
    tgl_terima: b.penerimaan_obat?.tgl_terima ?? null,
  }));
}

export async function archiveBatch(id_batch: string): Promise<void> {
  const { error } = await supabase.rpc("archive_batch", { p_id_batch: id_batch });
  if (error) throw new Error(error.message);
}

export async function disposeBatch(id_batch: string): Promise<void> {
  const { error } = await supabase.rpc("dispose_batch", { p_id_batch: id_batch });
  if (error) throw new Error(error.message);
}

export async function getSupplier(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("supplier")
    .select("*")
    .order("nama_supplier");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getResepWithDetail(): Promise<Resep[]> {
  const { data, error } = await supabase
    .from("resep")
    .select(`
      *,
      pasien ( nama_pasien, no_rekam_medis, status_bpjs, no_bpjs ),
      dokter ( nama_dokter ),
      detail_resep (
        *,
        obat ( nama_obat, satuan, ditanggung_bpjs )
      ),
      pembayaran ( total_bayar )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id_resep: r.id_resep,
    id_dokter: r.id_dokter,
    id_pasien: r.id_pasien,
    id_admin: r.id_admin,
    status: r.status,
    catatan_apoteker: r.catatan_apoteker,
    created_at: r.created_at,
    nama_pasien: r.pasien?.nama_pasien ?? "—",
    no_rekam_medis: r.pasien?.no_rekam_medis ?? "—",
    status_bpjs: r.pasien?.status_bpjs ?? false,
    no_bpjs: r.pasien?.no_bpjs ?? null,
    nama_dokter: r.dokter?.nama_dokter ?? "—",
    total_bayar: r.pembayaran?.[0]?.total_bayar ?? 0,
    detail: (r.detail_resep ?? []).map((d: any) => ({
      id_detail_resep: d.id_detail_resep,
      id_resep: d.id_resep,
      id_obat: d.id_obat,
      jumlah_diminta: d.jumlah_diminta,
      aturan_pakai: d.aturan_pakai,
      harga_final: d.harga_final,
      subtotal: d.subtotal,
      nama_obat: d.obat?.nama_obat ?? "—",
      satuan: d.obat?.satuan ?? "—",
      ditanggung_bpjs: d.obat?.ditanggung_bpjs ?? false,
    })),
  }));
}

// ── MUTATIONS ─────────────────────────────────────────────────────────────────

export async function insertPasien(input: Omit<Pasien, "id_pasien" | "created_at">) {
  const { data, error } = await supabase.from("pasien").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function insertObat(input: Omit<Obat, "id_obat" | "total_stok">) {
  const { data, error } = await supabase.from("obat").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function submitResep(payload: {
  id_dokter: string;
  id_pasien: string;
  status_bpjs: boolean;
  items: {
    id_obat: string;
    jumlah_diminta: number;
    aturan_pakai: string;
    harga_jual_normal: number;
    ditanggung_bpjs: boolean;
  }[];
}) {
  // Panggil PostgreSQL function via RPC — satu transaksi atomik.
  // Pricing Rule 2 (BPJS) diterapkan di sisi database (SECURITY DEFINER).
  const { data, error } = await supabase.rpc("create_resep_with_details", {
    p_id_dokter:   payload.id_dokter,
    p_id_pasien:   payload.id_pasien,
    p_status_bpjs: payload.status_bpjs,
    p_items:       payload.items,
  });

  if (error) throw new Error(error.message);
  return { id_resep: data as string };
}

export async function updateResepStatus(
  id_resep: string,
  status: "Siap" | "Ditolak",
  catatan_apoteker?: string
) {
  const { error } = await supabase
    .from("resep")
    .update({ status, catatan_apoteker: catatan_apoteker ?? null })
    .eq("id_resep", id_resep);
  if (error) throw new Error(error.message);
}

export async function processPayment(id_resep: string) {
  const { error } = await supabase.rpc("process_payment_and_fefo", {
    p_resep_id: id_resep,
  });
  if (error) throw new Error(error.message);
}

export async function insertPenerimaanBatch(payload: {
  id_supplier: string;
  id_admin: string;
  tgl_terima: string;
  batches: { id_obat: string; nomor_batch: string; tgl_kadaluarsa: string; sisa_stok: number }[];
}) {
  // Insert penerimaan_obat
  const { data: penerimaan, error: e1 } = await supabase
    .from("penerimaan_obat")
    .insert({
      id_supplier: payload.id_supplier,
      id_admin: payload.id_admin,
      tgl_terima: payload.tgl_terima,
    })
    .select()
    .single();
  if (e1) throw new Error(e1.message);

  // Insert obat_batch rows
  const batchRows = payload.batches.map((b) => ({
    ...b,
    id_penerimaan: penerimaan.id_penerimaan,
  }));
  const { data: newBatches, error: e2 } = await supabase
    .from("obat_batch")
    .insert(batchRows)
    .select();
  if (e2) throw new Error(e2.message);

  // Insert mutasi audit trail
  const mutasi = (newBatches ?? []).map((b: any) => ({
    id_batch: b.id_batch,
    jenis_mutasi: "Masuk",
    jumlah: b.sisa_stok,
    id_referensi_transaksi: penerimaan.id_penerimaan,
  }));
  await supabase.from("mutasi_stok_batch").insert(mutasi);

  return penerimaan;
}

export async function adjustStockOpname(id_batch: string, new_stock: number, id_admin: string) {
  // 1. Fetch current stock
  const { data: batch, error: err1 } = await supabase
    .from("obat_batch")
    .select("sisa_stok")
    .eq("id_batch", id_batch)
    .single();
  if (err1) throw new Error("Gagal mengambil data batch: " + err1.message);

  const currentStock = batch.sisa_stok;
  const difference = new_stock - currentStock;

  if (difference === 0) return; // No change needed

  // 2. Update stock
  const { error: err2 } = await supabase
    .from("obat_batch")
    .update({ sisa_stok: new_stock })
    .eq("id_batch", id_batch);
  if (err2) throw new Error("Gagal update stok: " + err2.message);

  // 3. Insert Audit Trail (Opname)
  const { error: err3 } = await supabase
    .from("mutasi_stok_batch")
    .insert({
      id_batch: id_batch,
      jenis_mutasi: "Opname",
      jumlah: difference, // Can be positive or negative
      // id_referensi_transaksi is left null for manual opname
    });
  
  if (err3) {
    console.error("Gagal mencatat mutasi Opname:", err3.message);
    // Ideally we should rollback here, but for now we just log it.
  }
}
