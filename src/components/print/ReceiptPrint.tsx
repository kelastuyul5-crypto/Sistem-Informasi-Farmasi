import { mockResep } from "@/lib/mock-data";

type ResepType = (typeof mockResep)[0];

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

export function ReceiptPrint({ resep }: { resep: ResepType }) {
  const now = new Date();
  const tanggal = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Screen: invisible placeholder */}
      <div className="no-print" />

      {/* Print-only receipt */}
      <div id="receipt-print" style={{ fontFamily: "monospace", fontSize: "10pt", width: "76mm", padding: "4mm", color: "#000", background: "#fff" }}>
        {/* Header */}
        <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
          <p style={{ fontWeight: "bold", fontSize: "13pt" }}>RS. SEJAHTERA MEDIKA</p>
          <p style={{ fontSize: "8pt" }}>Jl. Kesehatan No. 1, Jakarta</p>
          <p style={{ fontSize: "8pt" }}>Telp: (021) 555-0100</p>
          <p style={{ fontSize: "8pt", marginTop: "4px" }}>INSTALASI FARMASI</p>
        </div>

        {/* Transaction Info */}
        <div style={{ borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px", fontSize: "8pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>No. Resep</span><span style={{ fontWeight: "bold" }}>#{resep.id_resep.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tanggal</span><span>{tanggal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Jam</span><span>{jam}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Dokter</span><span>{resep.nama_dokter}</span>
          </div>
        </div>

        {/* Patient */}
        <div style={{ borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px", fontSize: "8pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Pasien</span><span style={{ fontWeight: "bold" }}>{resep.nama_pasien}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>No. RM</span><span>{resep.no_rekam_medis}</span>
          </div>
          {resep.status_bpjs && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Status</span><span style={{ fontWeight: "bold" }}>PESERTA BPJS</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div style={{ borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
          <p style={{ fontWeight: "bold", fontSize: "8pt", marginBottom: "4px" }}>DAFTAR OBAT:</p>
          {resep.detail.map((d, i) => (
            <div key={i} style={{ marginBottom: "6px", fontSize: "8pt" }}>
              <p style={{ fontWeight: "bold" }}>{d.nama_obat}</p>
              <p style={{ color: "#555" }}>{d.aturan_pakai}</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{d.jumlah_diminta} {d.satuan ?? "unit"} x {d.harga_final === 0 ? "Rp 0*" : formatRp(d.harga_final)}</span>
                <span style={{ fontWeight: "bold" }}>
                  {d.subtotal === 0 ? "Rp 0*" : formatRp(d.subtotal)}
                </span>
              </div>
              {d.ditanggung_bpjs && resep.status_bpjs && (
                <p style={{ fontSize: "7pt", color: "#555" }}>*) Ditanggung BPJS Kesehatan</p>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px", fontSize: "9pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
            <span>TOTAL BAYAR</span>
            <span>{resep.total_bayar === 0 ? "Rp 0" : formatRp(resep.total_bayar)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Status</span>
            <span style={{ fontWeight: "bold" }}>{resep.status_bayar === "Gratis" ? "GRATIS (BPJS)" : "LUNAS"}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "7pt", color: "#555" }}>
          <p>Obat ini adalah resep dokter.</p>
          <p>Harap ikuti petunjuk penggunaan.</p>
          <p style={{ marginTop: "4px" }}>Terima kasih telah menggunakan</p>
          <p style={{ fontWeight: "bold" }}>RS. Sejahtera Medika</p>
          <p style={{ marginTop: "8px" }}>★ ★ ★</p>
        </div>
      </div>
    </>
  );
}
