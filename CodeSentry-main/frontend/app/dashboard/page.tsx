"use client";

import Link from "next/link";
import { useRepositories } from "@/hooks/useRepository";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatNumber } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";
import DeleteRepositoryButton from "@/components/DeleteRepositoryButton";

export default function DashboardPage() {
  const { repositories, isLoading, mutate } = useRepositories();

  const totalRepos = repositories.length;
  const totalFiles = repositories.reduce((acc, repo) => acc + (repo.stats?.totalFiles || 0), 0);
  const totalFindings = repositories.reduce((acc, repo) => acc + (repo.stats?.totalFindings || 0), 0);
  const totalSymbols = repositories.reduce((acc, repo) => acc + (repo.stats?.totalChunks || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-screen-xl mx-auto px-6 w-full pt-40 pb-32"
    >
      <header className="mb-24">
        <p className="text-[10px] tracking-widest text-cs-text-muted mb-6 uppercase">SYSTEM OVERVIEW</p>
        <h1 className="text-6xl font-light tracking-tight">DASHBOARD</h1>
      </header>

      {isLoading ? (
        <div className="py-24 border-t border-cs-border">
          <LoadingSpinner text="LOADING METRICS..." />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-cs-border border border-cs-border overflow-hidden mb-24">
            <div className="bg-cs-bg p-8">
              <div className="text-5xl font-light mb-4">{formatNumber(totalRepos)}</div>
              <div className="text-[10px] uppercase tracking-widest text-cs-text-secondary">REPOSITORIES</div>
            </div>
            <div className="bg-cs-bg p-8">
              <div className="text-5xl font-light mb-4">{formatNumber(totalFiles)}</div>
              <div className="text-[10px] uppercase tracking-widest text-cs-text-secondary">FILES INDEXED</div>
            </div>
            <div className="bg-cs-bg p-8">
              <div className="text-5xl font-light mb-4">{formatNumber(totalSymbols)}</div>
              <div className="text-[10px] uppercase tracking-widest text-cs-text-secondary">SYMBOLS</div>
            </div>
            <div className="bg-cs-bg p-8">
              <div className="text-5xl font-light mb-4">{formatNumber(totalFindings)}</div>
              <div className="text-[10px] uppercase tracking-widest text-cs-text-secondary">FINDINGS</div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] tracking-widest text-cs-text-muted mb-8 uppercase">ACTIVE REPOSITORIES</h2>
            
            {repositories.length === 0 ? (
              <div className="py-24 border border-cs-border bg-cs-bg-secondary flex flex-col items-center justify-center text-center">
                <p className="text-cs-text-secondary font-light mb-8">No repositories actively monitored.</p>
                <Link href="/repositories" className="text-xs uppercase tracking-[0.2em] font-medium text-black bg-white px-8 py-3 hover:bg-cs-accent transition-colors">
                  CONNECT GITHUB
                </Link>
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
              </div>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
}
