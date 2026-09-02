import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "CodeSentry",
  description: "Codebase Intelligence & Security",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans selection:bg-cs-accent/30 selection:text-white`}>
        <div className="min-h-screen flex flex-col relative">
          <header className="fixed top-0 left-0 right-0 z-50 bg-transparent transition-colors duration-500 hover:bg-cs-bg/80 hover:backdrop-blur-md border-b border-transparent hover:border-cs-border">
            <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
              <Link href="/" className="uppercase text-xs tracking-logo font-semibold text-white hover:text-cs-accent transition-colors">
                CODESENTRY
              </Link>
              
              <nav className="hidden md:flex items-center gap-8">
                <Link href="/#product" className="text-[11px] uppercase tracking-widest text-cs-text-secondary hover:text-white transition-colors">
                  Product
                </Link>
                <Link href="/#how-it-works" className="text-[11px] uppercase tracking-widest text-cs-text-secondary hover:text-white transition-colors">
                  How it works
                </Link>
                <Link href="/#audit" className="text-[11px] uppercase tracking-widest text-cs-text-secondary hover:text-white transition-colors">
                  Audit
                </Link>
                <Link href="/docs" className="text-[11px] uppercase tracking-widest text-cs-text-secondary hover:text-white transition-colors">
                  Docs
                </Link>
                <Link href="https://github.com/dishasharma23-prog/CodeSentry" target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase tracking-widest text-cs-text-secondary hover:text-white transition-colors">
                  GitHub
                </Link>
              </nav>

              <div className="flex items-center gap-6">
                <Link href="/repositories" className="text-[11px] uppercase tracking-widest text-white hover:text-cs-accent transition-colors flex items-center gap-2">
                  Connect GitHub <span className="text-cs-text-secondary group-hover:text-cs-accent transition-colors">→</span>
                </Link>
              </div>
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
