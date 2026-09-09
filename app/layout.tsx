import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { PwaSetup } from "@/components/PwaSetup";

const poppins = Poppins({ subsets: ["latin"], weight: ["300","400","500","600","700","800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "DDMA - Disaster Relief Portal",
  description: "Report disaster damage and track your compensation claim",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DDMA" },
};

export const viewport: Viewport = { themeColor: "#1d4ed8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={poppins.className + " bg-white text-slate-800 min-h-screen"}>
        <PwaSetup />
        {children}
      </body>
    </html>
  );
}