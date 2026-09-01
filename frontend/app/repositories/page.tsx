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
      className="max-w-7xl mx-auto px-6 w-full py-16"
    >
      <header>
        <h1 className="text-5xl font-light tracking-tight">REPOSITORIES</h1>
      </header>

      <section className="mt-12 border border-cs-border p-8 bg-cs-bg-secondary/30">
        <h2 className="text-xs tracking-widest uppercase mb-6 text-cs-text-muted">ANALYZE A REPOSITORY</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="GitHub URL (e.g. https://github.com/owner/repo)"
            className="flex-1 bg-[#0D0D0D] border border-cs-border py-4 px-6 text-cs-text outline-none focus:border-cs-accent transition-colors font-mono text-sm"
            disabled={isSubmitting}
          />
          <button 
            type="submit" 
            disabled={isSubmitting || !url.trim()}
            className="bg-cs-accent text-black px-8 py-4 text-sm tracking-[0.15em] font-medium uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cs-accent-hover transition-colors"
          >
            {isSubmitting ? "PROCESSING..." : "ANALYZE →"}
          </button>
        </form>
        {error && <p className="text-cs-critical text-sm mt-4">{error}</p>}
      </section>

      <section className="mt-16">
        {isLoading ? (
          <LoadingSpinner text="LOADING REPOSITORIES..." />
        ) : (
          <div className="space-y-0">
            {repositories.map(repo => (
              <Link href={`/repositories/${repo._id}`} key={repo._id} className="block group">
                <div className="border-b border-cs-border py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group-hover:bg-cs-bg-secondary transition-colors px-4 -mx-4">
                  <div className="flex-1">
                    <h3 className="text-xl">{repo.name}</h3>
                    <p className="text-sm text-cs-text-secondary mt-1">{repo.owner || "local"}/{repo.name}</p>
                  </div>
                  <div className="w-32">
                    <StatusBadge status={repo.status} />
                  </div>
                  <div className="flex-1 flex justify-end items-center gap-8 text-sm text-cs-text-secondary">
                    <span className="hidden md:inline">{formatNumber(repo.stats?.totalFiles)} files</span>
                    <span className="hidden md:inline">{formatNumber(repo.stats?.totalFindings)} findings</span>
                    <span className="text-cs-accent opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </Link>
            ))}
            {repositories.length === 0 && !isLoading && (
              <p className="text-cs-text-secondary py-8">No repositories found.</p>
            )}
          </div>
        )}
      </section>
    </motion.div>
  );
}
