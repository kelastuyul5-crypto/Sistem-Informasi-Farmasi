"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Role = "dokter" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  hospital: string;
  spesialisasi?: string; // only for dokter
}

// Mock user accounts — replace with Supabase Auth later
const MOCK_ACCOUNTS: Array<AuthUser & { password: string; email: string }> = [
  {
    id: "d001",
    email: "dokter@pharmacare.id",
    password: "dokter123",
    name: "dr. Hendra Wijaya, Sp.PD",
    role: "dokter",
    hospital: "RS. Sejahtera Medika",
    spesialisasi: "Penyakit Dalam",
  },
  {
    id: "d002",
    email: "dokter2@pharmacare.id",
    password: "dokter123",
    name: "dr. Rina Kusuma, Sp.KK",
    role: "dokter",
    hospital: "RS. Sejahtera Medika",
    spesialisasi: "Kulit dan Kelamin",
  },
  {
    id: "a001",
    email: "admin@pharmacare.id",
    password: "admin123",
    name: "Apt. Sari Indrawati, S.Farm",
    role: "admin",
    hospital: "RS. Sejahtera Medika",
  },
  {
    id: "a002",
    email: "admin2@pharmacare.id",
    password: "admin123",
    name: "Apt. Budi Prasetyo, S.Farm",
    role: "admin",
    hospital: "RS. Sejahtera Medika",
  },
];

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "pharmacare_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const account = MOCK_ACCOUNTS.find(
      (a) =>
        a.email.toLowerCase() === email.toLowerCase() &&
        a.password === password
    );

    if (!account) {
      throw new Error("Email atau password salah. Silakan coba lagi.");
    }

    const { password: _, ...authUser } = account;
    setUser(authUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    return authUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
