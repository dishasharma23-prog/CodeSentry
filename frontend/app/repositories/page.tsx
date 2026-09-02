"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useRepositories } from "@/hooks/useRepository";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatNumber } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";
import DeleteRepositoryButton from "@/components/DeleteRepositoryButton";

export default function RepositoriesPage() {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { repositories, isLoading, mutate } = useRepositories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const result = await api.createRepository(url);
      if (result.error) {
        setError(result.error);
      } else {
        setUrl("");
        mutate();
        if (result._id) {
          router.push(`/repositories/${result._id}`);
        }
      }
    } catch (err) {
      setError("Failed to add repository.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-screen-xl mx-auto px-6 w-full pt-40 pb-32"
    >
      <header className="mb-24">
        <p className="text-[10px] tracking-widest text-cs-text-muted mb-6 uppercase">DATA SOURCES</p>
        <h1 className="text-6xl font-light tracking-tight">REPOSITORIES</h1>
      </header>

      <section className="mb-24 relative overflow-hidden bg-cs-bg border border-cs-border">
        <div className="absolute inset-0 bg-atmospheric opacity-10 pointer-events-none mix-blend-screen" />
        <div className="p-12 relative z-10">
          <h2 className="text-[10px] tracking-widest uppercase mb-8 text-cs-accent">CONNECT NEW REPOSITORY</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-3xl">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="GitHub URL (e.g. https://github.com/owner/repo)"
              className="flex-1 bg-transparent border-b border-cs-border py-4 px-2 text-white placeholder:text-cs-text-muted outline-none focus:border-cs-accent transition-colors font-mono text-xs"
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              disabled={isSubmitting || !url.trim()}
              className="bg-white text-black px-10 py-4 text-xs tracking-[0.2em] font-medium uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cs-accent transition-colors"
            >
              {isSubmitting ? "PROCESSING..." : "ANALYZE →"}
            </button>
          </form>
          {error && <p className="text-cs-critical text-xs font-mono mt-6">{error}</p>}
        </div>
      </section>

      <section>
        <h2 className="text-[10px] tracking-widest text-cs-text-muted mb-8 uppercase">INDEXED CODEBASES</h2>
        {isLoading ? (
          <div className="py-24 border-t border-cs-border">
            <LoadingSpinner text="LOADING REPOSITORIES..." />
          </div>
        ) : (
          <div className="border-t border-cs-border">
            {repositories.map(repo => (
              <Link href={`/repositories/${repo._id}`} key={repo._id} className="block group">
                <div className="border-b border-cs-border py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#050505] transition-colors -mx-6 px-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-light mb-2">{repo.name}</h3>
                    <p className="text-[11px] font-mono text-cs-text-muted uppercase tracking-wider">{repo.owner || "local"}/{repo.name}</p>
                  </div>
                  <div className="w-32">
                    <StatusBadge status={repo.status} />
                  </div>
                  <div className="flex-1 flex justify-end items-center gap-8 text-[11px] font-mono uppercase tracking-wider text-cs-text-muted">
                    <span className="hidden md:inline">{formatNumber(repo.stats?.totalFiles)} files</span>
                    <span className="hidden md:inline">{formatNumber(repo.stats?.totalFindings)} findings</span>
                    <DeleteRepositoryButton 
                      repositoryId={repo._id} 
                      repositoryName={repo.name} 
                      onDeleted={mutate} 
                    />
                    <span className="text-cs-text opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </Link>
            ))}
            {repositories.length === 0 && !isLoading && (
              <p className="text-cs-text-secondary font-light py-12 text-center">No repositories found.</p>
            )}
          </div>
        )}
      </section>
    </motion.div>
  );
}
