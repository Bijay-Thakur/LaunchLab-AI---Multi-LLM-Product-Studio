import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaunchLab AI - Multi-LLM Product Studio",
  description:
    "A polished demo of a multi-LLM workflow that turns a rough idea into a researched product, build prompt, brand, visuals, and evaluation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
