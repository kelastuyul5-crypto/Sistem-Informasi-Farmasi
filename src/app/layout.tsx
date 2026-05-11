import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { MainLayout } from "@/components/layout/MainLayout";
import { QueryProvider } from "@/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PharmaCare Clinical System",
  description: "Closed-Loop Clinical Pharmacy Information System — RS. Sejahtera Medika",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.className}>
      <body className="bg-slate-950 text-slate-200 antialiased">
        <QueryProvider>
          <AuthProvider>
            <MainLayout>{children}</MainLayout>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
