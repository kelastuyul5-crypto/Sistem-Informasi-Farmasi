"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Stethoscope,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Activity,
  Pill,
} from "lucide-react";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      // Redirect based on role
      if (loggedUser.role === "dokter") {
        router.push("/pasien");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (type: "dokter" | "admin") => {
    if (type === "dokter") {
      setEmail("dr.@pharmacare.id");
    } else {
      setEmail("admin.@pharmacare.id");
    }
    // Remove automatic password filling as requested
    setPassword("");
    setError("");
  };

  // No loading spinner needed — form is always safe to show immediately.
  // If user is already logged in, the useEffect above will redirect them.

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">
      {/* ── Left Panel: Decorative ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute top-1/2 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute -bottom-20 left-1/4 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(to right, #14b8a6 1px, transparent 1px), linear-gradient(to bottom, #14b8a6 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-teal-900/60 overflow-hidden">
            <img src="/icon.png" alt="PharmaCare" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">PharmaCare</p>
            <p className="text-xs text-teal-400">Clinical System</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Sistem Informasi
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                Farmasi Klinis
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Platform terintegrasi untuk manajemen resep elektronik dan
              inventori batch{" "}
              <span className="text-teal-400 font-medium">closed-loop</span>.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: ShieldCheck, label: "FEFO Otomatis" },
              { icon: Activity, label: "Skrining Alergi" },
              { icon: Pill, label: "Subsidi BPJS" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom info */}
        <div className="relative z-10">
          <p className="text-slate-500 text-xs">
            © 2026 RS. Sejahtera Medika — PharmaCare v1.0
          </p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-teal-900/60 overflow-hidden">
              <img src="/icon.png" alt="PharmaCare" className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <p className="text-base font-bold text-white">PharmaCare</p>
              <p className="text-[11px] text-teal-400">Clinical System</p>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Selamat Datang</h2>
            <p className="text-slate-400 text-sm">
              Masuk dengan akun PharmaCare Anda untuk melanjutkan.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@pharmacare.id"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-teal-900/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                "Masuk ke Sistem"
              )}
            </button>
          </form>

          {/* Demo Account Quick Fill */}
          <div className="space-y-3">
            <div className="relative flex items-center">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="px-3 text-slate-600 text-xs">Demo Akun</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemo("dokter")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-teal-500/50 hover:bg-slate-800 transition-all text-xs text-slate-400 hover:text-slate-200 group"
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-500 group-hover:text-teal-400 transition-colors" />
                Masuk sbg Dokter
              </button>
              <button
                type="button"
                onClick={() => fillDemo("admin")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-teal-500/50 hover:bg-slate-800 transition-all text-xs text-slate-400 hover:text-slate-200 group"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 group-hover:text-cyan-400 transition-colors" />
                Masuk sbg Admin
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-600">
              Klik tombol di atas untuk mengisi kredensial demo secara otomatis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
