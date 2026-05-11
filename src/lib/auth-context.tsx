"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { type User } from "@supabase/supabase-js";

export type Role = "dokter" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  hospital: string;
  spesialisasi?: string; // only for dokter
}

interface AuthContextValue {
  user: AuthUser | null;
  supabaseUser: User | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchUserProfile = async (sbUser: User): Promise<AuthUser | null> => {
    try {
      // Single fast query to profiles table (populated by trigger on signup)
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", sbUser.id)
        .single();

      if (error || !profile) return null;

      const role = profile.role?.toUpperCase();

      if (role === "DOKTER") {
        // Fetch clinical id (only used for prescription submission)
        const { data: dokter } = await supabase
          .from("dokter")
          .select("id_dokter, spesialisasi")
          .eq("user_id", sbUser.id)
          .single();

        return {
          id: dokter?.id_dokter ?? sbUser.id,
          name: profile.full_name ?? sbUser.email ?? "Dokter",
          role: "dokter",
          hospital: "RS. Sejahtera Medika",
          spesialisasi: dokter?.spesialisasi ?? undefined,
        };
      }

      if (role === "ADMIN") {
        const { data: admin } = await supabase
          .from("admin_farmasi")
          .select("id_admin")
          .eq("user_id", sbUser.id)
          .single();

        return {
          id: admin?.id_admin ?? sbUser.id,
          name: profile.full_name ?? sbUser.email ?? "Admin",
          role: "admin",
          hospital: "RS. Sejahtera Medika",
        };
      }

      return null;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  };

  useEffect(() => {
    const CACHE_KEY = "pharmacare_user_profile";

    // ── 1. Load from cache immediately (zero delay) ──────────────
    // Shows UI instantly without waiting for network.
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AuthUser;
        setUser(parsed);
        setIsLoading(false); // ← render from cache first
      }
    } catch { /* ignore parse errors */ }

    // ── 2. Safety timeout — failsafe jika Supabase tidak merespon.
    const safetyTimer = setTimeout(() => {
      console.warn("[PharmaCare] Auth timeout — memaksa isLoading=false");
      setIsLoading(false);
    }, 5000);

    // ── 3. Single source of truth: onAuthStateChange ─────────────
    // Supabase fires INITIAL_SESSION as the very first event.
    // RULE: setIsLoading(false) MUST only be called AFTER setUser()
    // so that useAuthGuard never sees isLoading=false + user=null
    // for a genuinely authenticated user (which causes redirect loop).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        clearTimeout(safetyTimer);

        if (!session?.user) {
          // No session → clear state then unblock
          localStorage.removeItem(CACHE_KEY);
          setSupabaseUser(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Session exists → fetch profile first, THEN unblock UI
        // (cache path already set user + isLoading=false above, so this
        //  only adds the tiny DB round-trip cost on first visit / no cache)
        setSupabaseUser(session.user);

        const profile = await fetchUserProfile(session.user);
        if (profile) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
          setUser(profile);          // ← user populated BEFORE gate opens
        } else {
          // Authenticated in Supabase Auth but no clinical profile → reject
          localStorage.removeItem(CACHE_KEY);
          setUser(null);
          await supabase.auth.signOut();
        }

        setIsLoading(false); // ← ALWAYS last, after user state is resolved
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Gagal mendapatkan data user.");
    }

    const profile = await fetchUserProfile(data.user);
    
    if (!profile) {
      // If user exists in Auth but not in roles table, we might want to handle it
      // For now, we'll throw an error as it's a "closed-loop" clinical system
      await supabase.auth.signOut();
      throw new Error("Akun Anda tidak terdaftar sebagai Dokter atau Admin Farmasi.");
    }

    // Set state SYNCHRONOUSLY before router.push happens in the component
    // to prevent useAuthGuard from bouncing us back to /login
    setSupabaseUser(data.user);
    setUser(profile);
    localStorage.setItem("pharmacare_user_profile", JSON.stringify(profile));

    return profile;
  };

  const logout = async () => {
    // Clear cache and state synchronously first
    localStorage.removeItem("pharmacare_user_profile");
    setUser(null);
    setSupabaseUser(null);
    // Then terminate the Supabase session
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
