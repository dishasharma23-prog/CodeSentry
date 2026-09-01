"use client";

import Link from "next/link";
import { useRepositories } from "@/hooks/useRepository";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatNumber } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { repositories, isLoading } = useRepositories();

  const totalRepos = repositories.length;
  const totalFiles = repositories.reduce((acc, repo) => acc + (repo.stats?.totalFiles || 0), 0);
  const totalFindings = repositories.reduce((acc, repo) => acc + (repo.stats?.totalFindings || 0), 0);
  const totalSymbols = repositories.reduce((acc, repo) => acc + (repo.stats?.totalChunks || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 w-full py-16"
    >
      <header>
        <p className="text-xs tracking-widest text-cs-text-muted mb-4 uppercase">CODESENTRY</p>
        <h1 className="text-5xl font-light tracking-tight">DASHBOARD</h1>
      </header>

      {isLoading ? (
        <div className="mt-16">
          <LoadingSpinner text="LOADING METRICS..." />
        </div>
      ) : (
        <>
          <section className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-b border-cs-border py-8">
            <div>
              <div className="text-4xl font-light">{formatNumber(totalRepos)}</div>
              <div className="text-xs uppercase tracking-widest text-cs-text-muted mt-2">REPOSITORIES</div>
            </div>
            <div>
              <div className="text-4xl font-light">{formatNumber(totalFiles)}</div>
              <div className="text-xs uppercase tracking-widest text-cs-text-muted mt-2">FILES</div>
            </div>
            <div>
              <div className="text-4xl font-light">{formatNumber(totalSymbols)}</div>
              <div className="text-xs uppercase tracking-widest text-cs-text-muted mt-2">SYMBOLS</div>
            </div>
            <div>
              <div className="text-4xl font-light">{formatNumber(totalFindings)}</div>
              <div className="text-xs uppercase tracking-widest text-cs-text-muted mt-2">FINDINGS</div>
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-xs tracking-widest text-cs-text-muted mb-8 uppercase">REPOSITORIES</h2>
            
            {repositories.length === 0 ? (
              <div className="py-12 text-center border border-cs-border border-dashed">
                <p className="text-cs-text-secondary mb-6">No repositories analyzed yet.</p>
                <Link href="/repositories" className="text-sm uppercase tracking-widest text-cs-accent hover:text-cs-accent-hover transition-colors">
                  ADD REPOSITORY →
                </Link>
              </div>
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
              </div>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
}
