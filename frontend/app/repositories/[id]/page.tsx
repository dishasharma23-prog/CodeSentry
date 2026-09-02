"use client";

import { use } from "react";
import Link from "next/link";
import { useRepository } from "@/hooks/useRepository";
import { formatNumber } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";

export default function RepositoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { repository, isLoading } = useRepository(resolvedParams.id);

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 w-full pt-40">
        <LoadingSpinner text="LOADING REPOSITORY..." />
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 w-full pt-40">
        <p className="text-cs-critical text-xs font-mono uppercase tracking-widest">Repository not found.</p>
      </div>
    );
  }

  const topLanguage = repository.stats?.languages 
    ? Object.entries(repository.stats.languages).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
    : 'Unknown';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-screen-xl mx-auto px-6 w-full pt-40 pb-32"
    >
      <nav className="mb-24">
        <p className="text-[10px] tracking-widest uppercase text-cs-text-muted">
          <Link href="/repositories" className="hover:text-white transition-colors">DATA SOURCES</Link> / {repository.name}
        </p>
      </nav>

      <header className="flex flex-col gap-6 mb-24">
        <h1 className="text-6xl font-light tracking-tight">{repository.name}</h1>
        <div className="flex items-center gap-6">
          <StatusBadge status={repository.status} />
          <a href={repository.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono text-cs-text-secondary hover:text-white transition-colors border-b border-transparent hover:border-white">
            {repository.url}
          </a>
        </div>
      </header>

      {repository.error && (
        <div className="mb-24 border border-cs-critical/30 bg-[#1A0505] text-cs-critical p-6 font-mono text-xs">
          ERROR: {repository.error}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-cs-border border border-cs-border overflow-hidden mb-24">
        <div className="bg-cs-bg p-8">
          <div className="text-5xl font-light mb-4">{formatNumber(repository.stats?.totalFiles)}</div>
          <div className="text-[10px] uppercase tracking-widest text-cs-text-secondary">FILES INDEXED</div>
        </div>
        <div className="bg-cs-bg p-8">
          <div className="text-5xl font-light mb-4">{formatNumber(repository.stats?.totalChunks)}</div>
          <div className="text-[10px] uppercase tracking-widest text-cs-text-secondary">SYMBOLS EXTRACTED</div>
        </div>
        <div className="bg-cs-bg p-8">
          <div className="text-5xl font-light mb-4">{formatNumber(repository.stats?.totalFindings)}</div>
          <div className="text-[10px] uppercase tracking-widest text-cs-text-secondary">AUDIT FINDINGS</div>
        </div>
        <div className="bg-cs-bg p-8">
          <div className="text-5xl font-light mb-4 capitalize truncate">{topLanguage}</div>
          <div className="text-[10px] uppercase tracking-widest text-cs-text-secondary">PRIMARY LANGUAGE</div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cs-border border border-cs-border">
        <Link href={`/repositories/${repository._id}/files`} className="bg-cs-bg p-12 hover:bg-[#050505] transition-colors group block">
          <h3 className="text-xl font-light mb-4 group-hover:text-cs-accent transition-colors">EXPLORE FILES →</h3>
          <p className="text-[11px] font-mono text-cs-text-secondary leading-relaxed uppercase tracking-wider">Browse parsed source code with AST-aware highlighting and component mapping.</p>
        </Link>
        <Link href={`/repositories/${repository._id}/analysis`} className="bg-cs-bg p-12 hover:bg-[#050505] transition-colors group block">
          <h3 className="text-xl font-light mb-4 group-hover:text-cs-accent transition-colors">SECURITY ANALYSIS →</h3>
          <p className="text-[11px] font-mono text-cs-text-secondary leading-relaxed uppercase tracking-wider">View automated security findings grounded in actual source code evidence.</p>
        </Link>
        <Link href={`/repositories/${repository._id}/chat`} className="bg-[#0A0A0A] p-12 hover:bg-[#050505] transition-colors group block relative overflow-hidden">
          <div className="absolute inset-0 bg-atmospheric opacity-10 pointer-events-none mix-blend-screen" />
          <h3 className="text-xl font-light mb-4 group-hover:text-cs-accent transition-colors relative z-10">ASK QUESTIONS →</h3>
          <p className="text-[11px] font-mono text-cs-text-secondary leading-relaxed uppercase tracking-wider relative z-10">Query the codebase using our hybrid RAG pipeline for grounded answers.</p>
        </Link>
      </section>
    </motion.div>
  );
}
