"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Guards a page: redirects to /login if not authenticated.
 * Also prevents logged-in users from accessing pages outside their role.
 */
export function useAuthGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");

    if (!user) {
      if (!isLoginPage) {
        router.replace("/login");
      }
      return;
    }

    if (isLoginPage) {
      return;
    }

    // Role-based route protection
    const adminOnlyPaths = [
      "/validasi-resep",
      "/inventori",
      "/master-obat",
      "/kasir",
      "/laporan",
    ];
    const dokterOnlyPaths = ["/resep/buat", "/resep"];

    if (user.role === "dokter") {
      // Dokter only allowed on /pasien and /resep — redirect everything else to /pasien
      const allowed = ["/pasien", "/resep"].some((p) => pathname.startsWith(p));
      if (!allowed) router.replace("/pasien");
    }

    if (user.role === "admin") {
      const blocked = dokterOnlyPaths.some((p) => pathname.startsWith(p));
      if (blocked) router.replace("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  return { user, isLoading };
}
