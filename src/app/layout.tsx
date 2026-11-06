import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";

const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-barlow" });
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  title: "CoachBoard · Assistant coach basket",
  description: "Banque d'exercices, séances et co-pilote IA pour entraîneurs de basket.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen antialiased">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
