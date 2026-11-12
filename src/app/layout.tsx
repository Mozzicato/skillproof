import type { Metadata } from "next";
import { JetBrains_Mono, Outfit, Work_Sans } from "next/font/google";
import "./globals.css";

const display = Outfit({ subsets: ["latin"], variable: "--font-display" });
const body = Work_Sans({ subsets: ["latin"], variable: "--font-body" });
const code = JetBrains_Mono({ subsets: ["latin"], variable: "--font-code" });

export const metadata: Metadata = {
  title: "SkillProof AI",
  description: "Career readiness built on evidence of what students can actually do.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${code.variable}`}>
      <body>{children}</body>
    </html>
  );
}
