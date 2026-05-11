// ===================================================
// PHARMACARE CLINICAL SYSTEM - MOCK DATA
// ===================================================

export type Role = "dokter" | "admin";

// --- Pasien ---
export const mockPasien = [
  {
    id_pasien: "p001",
    no_rekam_medis: "RM-2024-001",
    nama_pasien: "Budi Santoso",
    tgl_lahir: "1985-03-12",
    riwayat_alergi: "Penisilin, Aspirin",
    status_bpjs: true,
    no_bpjs: "0001234567890",
  },
  {
    id_pasien: "p002",
    no_rekam_medis: "RM-2024-002",
    nama_pasien: "Siti Rahayu",
    tgl_lahir: "1990-07-25",
    riwayat_alergi: "Ibuprofen",
    status_bpjs: false,
    no_bpjs: null,
  },
  {
    id_pasien: "p003",
    no_rekam_medis: "RM-2024-003",
    nama_pasien: "Ahmad Fauzi",
    tgl_lahir: "1978-11-08",
    riwayat_alergi: "",
    status_bpjs: true,
    no_bpjs: "0009876543210",
  },
  {
    id_pasien: "p004",
    no_rekam_medis: "RM-2024-004",
    nama_pasien: "Dewi Lestari",
    tgl_lahir: "2001-04-30",
    riwayat_alergi: "Amoksisilin",
    status_bpjs: true,
    no_bpjs: "0005551234567",
  },
];

// --- Obat ---
export const mockObat = [
  {
    id_obat: "o001",
    nama_obat: "Amoksisilin 500mg",
    satuan: "Kapsul",
    stok_minimum: 100,
    harga_jual_normal: 5000,
    ditanggung_bpjs: true,
    total_stok: 230,
  },
  {
    id_obat: "o002",
    nama_obat: "Paracetamol 500mg",
    satuan: "Tablet",
    stok_minimum: 200,
    harga_jual_normal: 1500,
    ditanggung_bpjs: true,
    total_stok: 450,
  },
  {
    id_obat: "o003",
    nama_obat: "Ibuprofen 400mg",
    satuan: "Tablet",
    stok_minimum: 150,
    harga_jual_normal: 3000,
    ditanggung_bpjs: false,
    total_stok: 80, // below minimum → critical
  },
  {
    id_obat: "o004",
    nama_obat: "Metformin 500mg",
    satuan: "Tablet",
    stok_minimum: 100,
    harga_jual_normal: 2500,
    ditanggung_bpjs: true,
    total_stok: 50, // below minimum → critical
  },
  {
    id_obat: "o005",
    nama_obat: "Atorvastatin 20mg",
    satuan: "Tablet",
    stok_minimum: 80,
    harga_jual_normal: 8000,
    ditanggung_bpjs: true,
    total_stok: 120,
  },
  {
    id_obat: "o006",
    nama_obat: "Amlodipine 5mg",
    satuan: "Tablet",
    stok_minimum: 100,
    harga_jual_normal: 4500,
    ditanggung_bpjs: true,
    total_stok: 30, // below minimum → critical
  },
];

// --- Obat Batch (for inventory + expiry alerts) ---
export const mockBatch = [
  {
    id_batch: "b001",
    id_obat: "o001",
    nama_obat: "Amoksisilin 500mg",
    id_supplier: "s001",
    nama_supplier: "PT Kimia Farma",
    nomor_batch: "KF-AMX-2401",
    tgl_kadaluarsa: "2024-12-15", // EXPIRED
    sisa_stok: 20,
    tgl_terima: "2024-01-10",
  },
  {
    id_batch: "b002",
    id_obat: "o001",
    nama_obat: "Amoksisilin 500mg",
    id_supplier: "s001",
    nama_supplier: "PT Kimia Farma",
    nomor_batch: "KF-AMX-2501",
    tgl_kadaluarsa: "2026-06-20", // < 90 days from May 2026 → WARNING
    sisa_stok: 210,
    tgl_terima: "2025-01-15",
  },
  {
    id_batch: "b003",
    id_obat: "o002",
    nama_obat: "Paracetamol 500mg",
    id_supplier: "s002",
    nama_supplier: "PT Sanbe Farma",
    nomor_batch: "SB-PCT-2412",
    tgl_kadaluarsa: "2026-07-01", // < 90 days → WARNING
    sisa_stok: 450,
    tgl_terima: "2024-12-01",
  },
  {
    id_batch: "b004",
    id_obat: "o003",
    nama_obat: "Ibuprofen 400mg",
    id_supplier: "s002",
    nama_supplier: "PT Sanbe Farma",
    nomor_batch: "SB-IBU-2503",
    tgl_kadaluarsa: "2027-03-10",
    sisa_stok: 80,
    tgl_terima: "2025-03-01",
  },
  {
    id_batch: "b005",
    id_obat: "o004",
    nama_obat: "Metformin 500mg",
    id_supplier: "s003",
    nama_supplier: "PT Dexa Medica",
    nomor_batch: "DX-MET-2502",
    tgl_kadaluarsa: "2026-08-20",
    sisa_stok: 50,
    tgl_terima: "2025-02-14",
  },
  {
    id_batch: "b006",
    id_obat: "o005",
    nama_obat: "Atorvastatin 20mg",
    id_supplier: "s001",
    nama_supplier: "PT Kimia Farma",
    nomor_batch: "KF-ATV-2504",
    tgl_kadaluarsa: "2028-04-30",
    sisa_stok: 120,
    tgl_terima: "2025-04-10",
  },
  {
    id_batch: "b007",
    id_obat: "o006",
    nama_obat: "Amlodipine 5mg",
    id_supplier: "s003",
    nama_supplier: "PT Dexa Medica",
    nomor_batch: "DX-AML-2501",
    tgl_kadaluarsa: "2025-12-01", // EXPIRED
    sisa_stok: 30,
    tgl_terima: "2025-01-20",
  },
];

// --- Resep (Prescriptions) ---
export const mockResep = [
  {
    id_resep: "r001",
    id_pasien: "p001",
    nama_pasien: "Budi Santoso",
    no_rekam_medis: "RM-2024-001",
    status_bpjs: true,
    id_dokter: "d001",
    nama_dokter: "dr. Hendra Wijaya, Sp.PD",
    status: "Menunggu",
    created_at: "2026-05-10T08:30:00",
    catatan_apoteker: "",
    detail: [
      {
        id_obat: "o002",
        nama_obat: "Paracetamol 500mg",
        satuan: "Tablet",
        jumlah_diminta: 20,
        aturan_pakai: "3x1 setelah makan",
        harga_final: 0, // BPJS covered
        subtotal: 0,
        ditanggung_bpjs: true,
      },
      {
        id_obat: "o004",
        nama_obat: "Metformin 500mg",
        satuan: "Tablet",
        jumlah_diminta: 30,
        aturan_pakai: "1x1 pagi hari",
        harga_final: 0, // BPJS covered
        subtotal: 0,
        ditanggung_bpjs: true,
      },
    ],
    total_bayar: 0,
    status_bayar: "Gratis",
  },
  {
    id_resep: "r002",
    id_pasien: "p002",
    nama_pasien: "Siti Rahayu",
    no_rekam_medis: "RM-2024-002",
    status_bpjs: false,
    id_dokter: "d002",
    nama_dokter: "dr. Rina Kusuma, Sp.KK",
    status: "Menunggu",
    created_at: "2026-05-10T09:15:00",
    catatan_apoteker: "",
    detail: [
      {
        id_obat: "o003",
        nama_obat: "Ibuprofen 400mg",
        satuan: "Tablet",
        jumlah_diminta: 10,
        aturan_pakai: "2x1 sesudah makan",
        harga_final: 3000,
        subtotal: 30000,
        ditanggung_bpjs: false,
      },
    ],
    total_bayar: 30000,
    status_bayar: "Lunas",
  },
  {
    id_resep: "r003",
    id_pasien: "p003",
    nama_pasien: "Ahmad Fauzi",
    no_rekam_medis: "RM-2024-003",
    status_bpjs: true,
    id_dokter: "d001",
    nama_dokter: "dr. Hendra Wijaya, Sp.PD",
    status: "Siap",
    created_at: "2026-05-10T10:00:00",
    catatan_apoteker: "Stok batch b005 digunakan",
    detail: [
      {
        id_obat: "o005",
        nama_obat: "Atorvastatin 20mg",
        satuan: "Tablet",
        jumlah_diminta: 30,
        aturan_pakai: "1x1 malam hari",
        harga_final: 0,
        subtotal: 0,
        ditanggung_bpjs: true,
      },
    ],
    total_bayar: 0,
    status_bayar: "Gratis",
  },
];

// --- Supplier ---
export const mockSupplier = [
  {
    id_supplier: "s001",
    nama_supplier: "PT Kimia Farma",
    kontak: "021-5551234",
    alamat: "Jl. Veteran No. 9, Jakarta Pusat",
  },
  {
    id_supplier: "s002",
    nama_supplier: "PT Sanbe Farma",
    kontak: "022-2033200",
    alamat: "Jl. Industri Kopo KM 9.8, Bandung",
  },
  {
    id_supplier: "s003",
    nama_supplier: "PT Dexa Medica",
    kontak: "0711-430033",
    alamat: "Jl. Bambang Utoyo No. 138, Palembang",
  },
];

// --- Dokter ---
export const mockDokter = [
  { id_dokter: "d001", nama: "dr. Hendra Wijaya, Sp.PD", spesialisasi: "Penyakit Dalam" },
  { id_dokter: "d002", nama: "dr. Rina Kusuma, Sp.KK", spesialisasi: "Kulit dan Kelamin" },
];

// --- Alert Summary ---
export const mockAlertSummary = {
  expiredCount: mockBatch.filter((b) => new Date(b.tgl_kadaluarsa) < new Date()).length,
  expiringSoonCount: mockBatch.filter((b) => {
    const exp = new Date(b.tgl_kadaluarsa);
    const now = new Date();
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  }).length,
  lowStockCount: mockObat.filter((o) => o.total_stok < o.stok_minimum).length,
  pendingResepCount: mockResep.filter((r) => r.status === "Menunggu").length,
};
