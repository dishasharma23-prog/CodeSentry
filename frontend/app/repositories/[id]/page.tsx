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
      <div className="max-w-7xl mx-auto px-6 w-full py-16">
        <LoadingSpinner text="LOADING REPOSITORY..." />
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="max-w-7xl mx-auto px-6 w-full py-16">
        <p className="text-cs-critical">Repository not found.</p>
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
      className="max-w-7xl mx-auto px-6 w-full py-16"
    >
      <nav className="mb-8">
        <p className="text-xs tracking-widest uppercase text-cs-text-muted">
          <Link href="/repositories" className="hover:text-cs-text transition-colors">REPOSITORIES</Link> / {repository.name}
        </p>
      </nav>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-light tracking-tight">{repository.name}</h1>
          <a href={repository.url} target="_blank" rel="noopener noreferrer" className="text-sm text-cs-text-secondary mt-2 hover:text-cs-text transition-colors block">
            {repository.url}
          </a>
        </div>
        <div className="pb-2">
          <StatusBadge status={repository.status} />
        </div>
      </header>

      {repository.error && (
        <div className="mt-8 border border-cs-critical/50 bg-cs-critical/10 text-cs-critical p-4 text-sm">
          ERROR: {repository.error}
        </div>
      )}

      <section className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-b border-cs-border py-8">
        <div>
          <div className="text-4xl font-light">{formatNumber(repository.stats?.totalFiles)}</div>
          <div className="text-xs uppercase tracking-widest text-cs-text-muted mt-2">FILES</div>
        </div>
        <div>
          <div className="text-4xl font-light">{formatNumber(repository.stats?.totalChunks)}</div>
          <div className="text-xs uppercase tracking-widest text-cs-text-muted mt-2">SYMBOLS</div>
        </div>
        <div>
          <div className="text-4xl font-light">{formatNumber(repository.stats?.totalFindings)}</div>
          <div className="text-xs uppercase tracking-widest text-cs-text-muted mt-2">FINDINGS</div>
        </div>
        <div>
          <div className="text-4xl font-light capitalize">{topLanguage}</div>
          <div className="text-xs uppercase tracking-widest text-cs-text-muted mt-2">LANGUAGE</div>
        </div>
      </section>

      <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-cs-border">
        <Link href={`/repositories/${repository._id}/files`} className="bg-cs-bg p-8 md:p-12 hover:bg-cs-bg-secondary transition-colors group block">
          <h3 className="text-xl mb-4 group-hover:text-cs-accent transition-colors">EXPLORE FILES →</h3>
          <p className="text-sm text-cs-text-secondary leading-relaxed">Browse the parsed source code with AST-aware highlighting and component mapping.</p>
        </Link>
        <Link href={`/repositories/${repository._id}/analysis`} className="bg-cs-bg p-8 md:p-12 hover:bg-cs-bg-secondary transition-colors group block">
          <h3 className="text-xl mb-4 group-hover:text-cs-accent transition-colors">SECURITY ANALYSIS →</h3>
          <p className="text-sm text-cs-text-secondary leading-relaxed">View automated security findings grounded in actual source code evidence.</p>
        </Link>
        <Link href={`/repositories/${repository._id}/chat`} className="bg-cs-bg p-8 md:p-12 hover:bg-cs-bg-secondary transition-colors group block">
          <h3 className="text-xl mb-4 group-hover:text-cs-accent transition-colors">ASK QUESTIONS →</h3>
          <p className="text-sm text-cs-text-secondary leading-relaxed">Query the codebase using our hybrid RAG pipeline for grounded, evidence-based answers.</p>
        </Link>
      </section>
    </motion.div>
  );
}
