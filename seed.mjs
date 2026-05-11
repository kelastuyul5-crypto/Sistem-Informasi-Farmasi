import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function loadEnv() {
  try {
    const content = readFileSync(".env.local", "utf-8");
    for (const line of content.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) process.env[key.trim()] = rest.join("=").trim().replace(/\r$/, "");
    }
  } catch {}
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── DATA ──────────────────────────────────────────
const DUMMY_USERS = [
  { email: "dr.budi@pharmacare.id",    password: "Pass123", full_name: "dr. Budi Santoso, Sp.PD", role: "DOKTER" },
  { email: "dr.sari@pharmacare.id",    password: "Pass123", full_name: "dr. Sari Dewi, Sp.A",     role: "DOKTER" },
  { email: "admin.rina@pharmacare.id", password: "Pass123", full_name: "Rina Aprianti, S.Farm",   role: "ADMIN"  },
  { email: "admin.joko@pharmacare.id", password: "Pass123", full_name: "Joko Widodo, Apt",        role: "ADMIN"  },
];

const DUMMY_PASIEN = [
  { no_rekam_medis: "RM-2024-0001", nama_pasien: "Ahmad Fauzi",     tgl_lahir: "1985-03-15", riwayat_alergi: "Penisilin, Amoksisilin", status_bpjs: true,  no_bpjs: "0001234567890" },
  { no_rekam_medis: "RM-2024-0002", nama_pasien: "Siti Rahayu",     tgl_lahir: "1990-07-22", riwayat_alergi: null,                      status_bpjs: true,  no_bpjs: "0009876543210" },
  { no_rekam_medis: "RM-2024-0003", nama_pasien: "Budi Prasetyo",   tgl_lahir: "1975-11-08", riwayat_alergi: "Aspirin, Ibuprofen",      status_bpjs: false, no_bpjs: null            },
  { no_rekam_medis: "RM-2024-0004", nama_pasien: "Dewi Lestari",    tgl_lahir: "2000-01-30", riwayat_alergi: null,                      status_bpjs: false, no_bpjs: null            },
  { no_rekam_medis: "RM-2024-0005", nama_pasien: "Hendra Kusuma",   tgl_lahir: "1962-09-12", riwayat_alergi: "Sulfa",                   status_bpjs: true,  no_bpjs: "0005551234567" },
  { no_rekam_medis: "RM-2024-0006", nama_pasien: "Maya Indah Sari", tgl_lahir: "1995-05-20", riwayat_alergi: null,                      status_bpjs: true,  no_bpjs: "0007778889990" },
];

const DUMMY_SUPPLIER = [
  { nama_supplier: "PT. Kimia Farma Tbk", kontak: "021-5551234", alamat: "Jl. Veteran No. 9, Jakarta Pusat" },
  { nama_supplier: "PT. Kalbe Farma Tbk", kontak: "021-4521001", alamat: "Jl. Let. Jend. Suprapto Kav. 4, Jakarta Pusat" },
  { nama_supplier: "PT. Dexa Medica",     kontak: "0711-515551", alamat: "Jl. Rajawali No. 11, Palembang" },
];

const DUMMY_OBAT = [
  { nama_obat: "Amoksisilin 500mg",    satuan: "Kapsul", stok_minimum: 50,  harga_jual_normal: 2500,   ditanggung_bpjs: true  },
  { nama_obat: "Metformin 500mg",      satuan: "Tablet", stok_minimum: 100, harga_jual_normal: 1500,   ditanggung_bpjs: true  },
  { nama_obat: "Amlodipine 5mg",       satuan: "Tablet", stok_minimum: 80,  harga_jual_normal: 3000,   ditanggung_bpjs: true  },
  { nama_obat: "Omeprazole 20mg",      satuan: "Kapsul", stok_minimum: 60,  harga_jual_normal: 4000,   ditanggung_bpjs: true  },
  { nama_obat: "Simvastatin 20mg",     satuan: "Tablet", stok_minimum: 50,  harga_jual_normal: 2000,   ditanggung_bpjs: true  },
  { nama_obat: "Paracetamol 500mg",    satuan: "Tablet", stok_minimum: 200, harga_jual_normal: 500,    ditanggung_bpjs: false },
  { nama_obat: "Cetirizine 10mg",      satuan: "Tablet", stok_minimum: 40,  harga_jual_normal: 3500,   ditanggung_bpjs: false },
  { nama_obat: "Dexamethasone 0.5mg",  satuan: "Tablet", stok_minimum: 30,  harga_jual_normal: 1000,   ditanggung_bpjs: false },
  { nama_obat: "Vitamin B Complex",    satuan: "Tablet", stok_minimum: 100, harga_jual_normal: 800,    ditanggung_bpjs: false },
  { nama_obat: "Antasida DOEN",        satuan: "Tablet", stok_minimum: 75,  harga_jual_normal: 600,    ditanggung_bpjs: false },
  { nama_obat: "Insulin Glargine 100IU", satuan: "Vial", stok_minimum: 10,  harga_jual_normal: 180000, ditanggung_bpjs: true  },
  { nama_obat: "Captopril 25mg",       satuan: "Tablet", stok_minimum: 60,  harga_jual_normal: 1200,   ditanggung_bpjs: true  },
];

// ── HELPERS ───────────────────────────────────────
const section = (t) => console.log(`\n━━━ ${t} ━━━`);
const ok  = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const fail = (m) => console.error(`  ❌ ${m}`);

// ── SEED FUNCTIONS ────────────────────────────────

async function seedUsers() {
  section("1. Membuat Akun Auth + Profil Klinis");

  const { data: { users: existing } } = await supabase.auth.admin.listUsers();
  const existingEmails = new Set(existing.map(u => u.email));

  for (const u of DUMMY_USERS) {
    let userId = existing.find(e => e.email === u.email)?.id;

    // 1a. Buat auth user jika belum ada
    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role },
      });

      if (error) {
        // Trigger gagal — kita tetap lanjut dengan insert manual
        warn(`Auth user gagal (trigger error): ${u.email} — akan insert manual`);
      } else {
        userId = data.user.id;
        ok(`Auth user dibuat: ${u.email} [${u.role}]`);
      }
    } else {
      warn(`Auth user sudah ada: ${u.email}`);
    }

    // 1b. Pastikan profiles ada (upsert)
    if (userId) {
      await supabase.from("profiles").upsert(
        { id: userId, role: u.role, full_name: u.full_name },
        { onConflict: "id" }
      );
    }

    // 1c. Pastikan dokter/admin_farmasi ada
    if (u.role === "DOKTER") {
      const { data: existing_d } = await supabase.from("dokter")
        .select("id_dokter").eq("nama_dokter", u.full_name).limit(1);
      if (!existing_d?.length) {
        const { error: e } = await supabase.from("dokter")
          .insert({ nama_dokter: u.full_name, spesialisasi: u.full_name.includes("Sp.PD") ? "Penyakit Dalam" : "Anak", user_id: userId ?? null });
        if (e) fail(`Insert dokter ${u.full_name}: ${e.message}`);
        else ok(`Profil dokter dibuat: ${u.full_name}`);
      } else {
        warn(`Dokter sudah ada: ${u.full_name}`);
      }
    } else {
      const { data: existing_a } = await supabase.from("admin_farmasi")
        .select("id_admin").eq("nama_admin", u.full_name).limit(1);
      if (!existing_a?.length) {
        const { error: e } = await supabase.from("admin_farmasi")
          .insert({ nama_admin: u.full_name, user_id: userId ?? null });
        if (e) fail(`Insert admin ${u.full_name}: ${e.message}`);
        else ok(`Profil admin dibuat: ${u.full_name}`);
      } else {
        warn(`Admin sudah ada: ${u.full_name}`);
      }
    }
  }
}

async function seedPasien() {
  section("2. Data Pasien");
  const { error } = await supabase.from("pasien")
    .upsert(DUMMY_PASIEN, { onConflict: "no_rekam_medis" });
  if (error) fail(`Pasien: ${error.message}`);
  else ok(`${DUMMY_PASIEN.length} pasien berhasil`);
}

async function seedSupplier() {
  section("3. Data Supplier");
  const { data: ex } = await supabase.from("supplier").select("nama_supplier");
  const exNames = new Set(ex?.map(s => s.nama_supplier));
  const toInsert = DUMMY_SUPPLIER.filter(s => !exNames.has(s.nama_supplier));
  if (!toInsert.length) { warn("Supplier sudah ada semua"); return; }
  const { error } = await supabase.from("supplier").insert(toInsert);
  if (error) fail(`Supplier: ${error.message}`);
  else ok(`${toInsert.length} supplier berhasil`);
}

async function seedObat() {
  section("4. Data Obat");
  const { data: ex } = await supabase.from("obat").select("nama_obat");
  const exNames = new Set(ex?.map(o => o.nama_obat));
  const toInsert = DUMMY_OBAT.filter(o => !exNames.has(o.nama_obat));
  if (!toInsert.length) { warn("Semua obat sudah ada"); return; }
  const { error } = await supabase.from("obat").insert(toInsert);
  if (error) fail(`Obat: ${error.message}`);
  else ok(`${toInsert.length} obat berhasil`);
}

async function seedInventory() {
  section("5. Inventory (Batch Obat)");

  const { data: admins }    = await supabase.from("admin_farmasi").select("id_admin").limit(1);
  const { data: suppliers } = await supabase.from("supplier").select("id_supplier").limit(1);
  const { data: obatList }  = await supabase.from("obat").select("id_obat, nama_obat, stok_minimum");

  if (!admins?.length)    { fail("Tidak ada admin_farmasi — skip inventory"); return; }
  if (!suppliers?.length) { fail("Tidak ada supplier — skip inventory"); return; }
  if (!obatList?.length)  { fail("Tidak ada obat — skip inventory"); return; }

  const adminId    = admins[0].id_admin;
  const supplierId = suppliers[0].id_supplier;

  // Penerimaan obat
  let penerimaanId;
  const { data: exPenerimaan } = await supabase.from("penerimaan_obat").select("id_penerimaan").limit(1);
  if (exPenerimaan?.length) {
    warn("Penerimaan obat sudah ada");
    penerimaanId = exPenerimaan[0].id_penerimaan;
  } else {
    const { data: p, error: e1 } = await supabase.from("penerimaan_obat")
      .insert({ id_supplier: supplierId, id_admin: adminId, tgl_terima: "2025-01-15" })
      .select().single();
    if (e1) { fail(`Penerimaan: ${e1.message}`); return; }
    penerimaanId = p.id_penerimaan;
    ok(`Penerimaan obat dibuat`);
  }

  // Batch per obat
  const { data: exBatches } = await supabase.from("obat_batch").select("id_obat");
  const exObatIds = new Set(exBatches?.map(b => b.id_obat));

  const LOW_STOCK_OBAT = ["Insulin Glargine 100IU", "Captopril 25mg"];
  const today = new Date();
  const batchData = [];

  for (let i = 0; i < obatList.length; i++) {
    const o = obatList[i];
    if (exObatIds.has(o.id_obat)) continue;

    const isLow = LOW_STOCK_OBAT.includes(o.nama_obat);
    const exp1  = new Date(today); exp1.setMonth(exp1.getMonth() + 18 + i);

    batchData.push({
      id_obat: o.id_obat, id_penerimaan: penerimaanId,
      nomor_batch: `BTH-2025-${String(i+1).padStart(3,"0")}A`,
      tgl_kadaluarsa: exp1.toISOString().split("T")[0],
      sisa_stok: isLow ? Math.floor(o.stok_minimum * 0.4) : o.stok_minimum * 3,
    });

    // Batch hampir kadaluarsa (untuk demo alert dashboard)
    if (i % 3 === 0) {
      const exp2 = new Date(today); exp2.setDate(exp2.getDate() + 45);
      batchData.push({
        id_obat: o.id_obat, id_penerimaan: penerimaanId,
        nomor_batch: `BTH-2024-${String(i+1).padStart(3,"0")}B`,
        tgl_kadaluarsa: exp2.toISOString().split("T")[0],
        sisa_stok: 20,
      });
    }
  }

  if (!batchData.length) { warn("Semua batch sudah ada"); return; }

  const { data: newBatches, error: e2 } = await supabase.from("obat_batch")
    .insert(batchData).select("id_batch, sisa_stok");
  if (e2) { fail(`Batch: ${e2.message}`); return; }
  ok(`${newBatches.length} batch obat berhasil`);

  // Audit trail mutasi masuk
  const mutasi = newBatches.map(b => ({
    id_batch: b.id_batch, jenis_mutasi: "Masuk",
    jumlah: b.sisa_stok, id_referensi_transaksi: penerimaanId,
  }));
  const { error: e3 } = await supabase.from("mutasi_stok_batch").insert(mutasi);
  if (e3) warn(`Mutasi audit: ${e3.message}`);
  else ok(`${mutasi.length} audit trail mutasi dibuat`);
}

// ── MAIN ──────────────────────────────────────────
async function main() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   PharmaCare — Data Dummy Seeder v2    ║");
  console.log("╚════════════════════════════════════════╝");

  await seedUsers();
  await seedPasien();
  await seedSupplier();
  await seedObat();
  await seedInventory();

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   ✅ Seeding Selesai!                  ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("\n📋 AKUN LOGIN:");
  console.log("  DOKTER  → dr.budi@pharmacare.id      | Password123!");
  console.log("  DOKTER  → dr.sari@pharmacare.id      | Password123!");
  console.log("  ADMIN   → admin.rina@pharmacare.id   | Password123!");
  console.log("  ADMIN   → admin.joko@pharmacare.id   | Password123!\n");
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
