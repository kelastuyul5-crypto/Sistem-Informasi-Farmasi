# 🤖 AGENT INSTRUCTIONS: PHARMACARE CLINICAL SYSTEM

## 1. PROJECT OVERVIEW & AGENT ROLE
**Role:** You are an Expert Full-Stack AI Developer (Next.js & Supabase).
**Task:** Build "PharmaCare", a Closed-Loop Clinical Pharmacy Information System. 
**Strict Constraint:** This is NOT a standard retail Point of Sale (POS). It is a medical facility system. DO NOT implement direct "over-the-counter" sales. Every single medicine dispensed MUST originate from a Doctor's E-Prescription (`resep`).

## 2. TECH STACK & DEVELOPMENT RULES
- **Framework:** Next.js 14/15 (App Router). Use Server Components by default. Use Client Components (`"use client"`) ONLY for interactivity/hooks.
- **Language:** TypeScript (Strict type checking).
- **Styling:** Tailwind CSS, Shadcn UI, Lucide Icons.
- **Database/Backend:** Supabase (PostgreSQL, Supabase Auth, Storage, Edge Functions).
- **Data Fetching/Mutation:** Supabase JS Client, TanStack Query (React Query) for client-side caching.
- **Form Validation:** Zod + React Hook Form.

## 3. DATABASE SCHEMA (POSTGRESQL)
Use `uuid` for all primary keys with `default uuid_generate_v4()`. Include `created_at` timestamp on all tables.

### Master Data
- `pasien`
  - `id_pasien` (uuid, PK)
  - `no_rekam_medis` (varchar, Unique)
  - `nama_pasien` (varchar)
  - `tgl_lahir` (date)
  - `riwayat_alergi` (text) -> Used for allergy screening.
  - `status_bpjs` (boolean) -> True if active BPJS member.
  - `no_bpjs` (varchar, nullable)
- `dokter` & `admin_farmasi`
  - `id_...` (uuid, PK)
  - `nama_...` (varchar)
  - `user_id` (uuid, FK to auth.users) -> For Supabase Auth mapping.
- `supplier`
  - `id_supplier` (uuid, PK), `nama_supplier`, `kontak`, `alamat`
- `obat`
  - `id_obat` (uuid, PK)
  - `nama_obat` (varchar)
  - `satuan` (varchar)
  - `stok_minimum` (int) -> Threshold for low stock alerts.
  - `harga_jual_normal` (decimal) -> Base price.
  - `ditanggung_bpjs` (boolean) -> True if covered by government subsidy.

### Inventory (Batch-Based FEFO)
- `penerimaan_obat`
  - `id_penerimaan` (uuid, PK), `id_supplier` (FK), `id_admin` (FK), `tgl_terima` (date), `file_nota_url` (text, storage link)
- `obat_batch`
  - `id_batch` (uuid, PK), `id_obat` (FK), `id_penerimaan` (FK)
  - `nomor_batch` (varchar)
  - `tgl_kadaluarsa` (date) -> CRITICAL: Used for FEFO sorting.
  - `sisa_stok` (int)
- `mutasi_stok_batch` (Audit Trail)
  - `id_mutasi` (uuid, PK), `id_batch` (FK)
  - `jenis_mutasi` (enum: 'Masuk', 'Keluar_Resep', 'Opname', 'Expired')
  - `jumlah` (int) -> Can be positive or negative.
  - `id_referensi_transaksi` (uuid) -> FK to either `resep` or `penerimaan`.

### Clinical & Billing Transactions
- `resep`
  - `id_resep` (uuid, PK), `id_dokter` (FK), `id_pasien` (FK), `id_admin` (FK, nullable)
  - `status` (enum: 'Menunggu', 'Siap', 'Selesai', 'Ditolak')
  - `catatan_apoteker` (text)
- `detail_resep`
  - `id_detail_resep` (uuid, PK), `id_resep` (FK), `id_obat` (FK)
  - `jumlah_diminta` (int), `aturan_pakai` (varchar)
  - `harga_final` (decimal), `subtotal` (decimal) -> MUST freeze price at transaction time.
- `pembayaran`
  - `id_pembayaran` (uuid, PK), `id_resep` (FK)
  - `total_bayar` (decimal), `status_bayar` (enum: 'Lunas', 'Gratis')

## 4. ABSOLUTE BUSINESS LOGIC (MUST IMPLEMENT EXACTLY)

### Rule 1: Automatic Allergy Screening (Frontend/API level)
When a Doctor adds `obat` to `detail_resep`, perform a case-insensitive string check:
```typescript
if (pasien.riwayat_alergi.toLowerCase().includes(obat.nama_obat.toLowerCase())) {
  throw new Error(`WARNING: Pasien alergi terhadap ${obat.nama_obat}`);
}
Rule 2: BPJS Subsidy Pricing Engine
Execute this logic when calculating detail_resep prices before saving to the database:

TypeScript
let harga_final = obat.harga_jual_normal;
if (pasien.status_bpjs === true && obat.ditanggung_bpjs === true) {
  harga_final = 0; // Fully subsidized
}
const subtotal = harga_final * jumlah_diminta;
Note: If sum of all subtotals == 0, pembayaran.status_bayar automatically becomes 'Gratis'.

Rule 3: FEFO (First Expired, First Out) Stock Deduction
CRITICAL: Do not update sisa_stok globally. You MUST loop through obat_batch ordered by tgl_kadaluarsa ASC.
Execute this ONLY when pembayaran status turns to 'Lunas' or 'Gratis'.
Use Supabase RPC (Postgres Function) or a strict Backend Transaction to ensure atomicity.

Cuplikan kode
let remaining_demand = detail_resep.jumlah_diminta;
batches = SELECT * FROM obat_batch WHERE id_obat = ? AND sisa_stok > 0 ORDER BY tgl_kadaluarsa ASC;

for batch in batches {
    if (remaining_demand <= 0) break;
    
    deduct_amount = min(batch.sisa_stok, remaining_demand);
    
    // 1. Update batch stock
    UPDATE obat_batch SET sisa_stok = sisa_stok - deduct_amount WHERE id = batch.id;
    
    // 2. Create Audit Trail
    INSERT INTO mutasi_stok_batch (id_batch, jenis_mutasi, jumlah, id_referensi) 
    VALUES (batch.id, 'Keluar_Resep', deduct_amount, resep.id);
    
    remaining_demand -= deduct_amount;
}
if (remaining_demand > 0) throw Error("Insufficient physical stock across all batches");
Rule 4: Immutable Audit Trail
NEVER execute an UPDATE obat_batch SET sisa_stok = X without inserting a corresponding row in mutasi_stok_batch. For Stock Opname (manual corrections), insert a mutation record and let a database trigger/function adjust the sisa_stok.

5. REQUIRED UI/UX FEATURES
Alert Center (Dashboard Widget):

Expiry Warning: Query and display batches where tgl_kadaluarsa is less than 90 days from CURRENT_DATE. Highlight rows in RED if already expired.

Low Stock Warning: Group sum of sisa_stok by id_obat. Display if total sum < obat.stok_minimum.

Print Module (@media print):

Create a React component optimized for 80mm thermal printers.

Receipt must explicitly show BPJS subsidized items as "Rp 0".

Role-Based Access (Supabase RLS):

Dokter CANNOT access inventory pages, batch details, or payment module.

Admin CANNOT create new prescriptions (resep).

End of Instructions. Implement step-by-step, starting with Supabase Schema & Auth, followed by Master Data CRUD, and finally the transactional workflows.