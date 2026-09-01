import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "CodeSentry",
  description: "AST-Aware RAG for Code Security",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans`}>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 bg-cs-bg/90 backdrop-blur border-b border-cs-border">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <Link href="/" className="uppercase text-sm tracking-logo font-medium hover:text-cs-accent transition-colors">
                CODESENTRY
              </Link>
              <nav className="flex gap-8">
                <Link href="/dashboard" className="uppercase text-xs tracking-widest text-cs-text-secondary hover:text-cs-text transition-colors">
                  DASHBOARD
                </Link>
                <Link href="/repositories" className="uppercase text-xs tracking-widest text-cs-text-secondary hover:text-cs-text transition-colors">
                  REPOSITORIES
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
