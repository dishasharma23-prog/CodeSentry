"use client";

import { useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRepository } from "@/hooks/useRepository";
import { useFindings } from "@/hooks/useFindings";
import SeverityBadge from "@/components/ui/SeverityBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { repository } = useRepository(resolvedParams.id);
  const { findings, isLoading, mutate } = useFindings(resolvedParams.id);
  
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  const handleRunAnalysis = async () => {
    setIsRunning(true);
    setError("");
    
    try {
      await api.runSecurityAnalysis(resolvedParams.id);
      await mutate();
    } catch (err) {
      setError("Failed to run security analysis.");
    } finally {
      setIsRunning(false);
    }
  };

  const counts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'informational').length,
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-6 w-full py-16"
    >
      <nav className="mb-8">
        <p className="text-xs tracking-widest uppercase text-cs-text-muted">
          <Link href="/repositories" className="hover:text-cs-text">REPOSITORIES</Link> / 
          <Link href={`/repositories/${resolvedParams.id}`} className="hover:text-cs-text ml-1">{repository?.name || '...'}</Link> / 
          <span className="text-cs-text ml-1">SECURITY</span>
        </p>
      </nav>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-light tracking-tight">SECURITY ANALYSIS</h1>
        </div>
        <button 
          onClick={handleRunAnalysis}
          disabled={isRunning || (repository?.status !== 'ready')}
          className="bg-cs-accent text-black px-6 py-3 text-xs tracking-widest font-medium uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cs-accent-hover transition-colors"
        >
          {isRunning ? "ANALYZING..." : (findings.length > 0 ? "RE-RUN ANALYSIS →" : "RUN ANALYSIS →")}
        </button>
      </header>

      {error && <div className="mb-8 text-cs-critical text-sm">{error}</div>}
      
      {repository?.status !== 'ready' && !isLoading && (
        <div className="mb-8 p-4 border border-amber-500/50 bg-amber-500/10 text-amber-500 text-sm">
          Repository must be fully parsed and indexed before analysis can run. Current status: {repository?.status}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="LOADING FINDINGS..." />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-5 border-t border-b border-cs-border py-6 mb-12 text-center divide-x divide-cs-border">
            <div>
              <div className="text-2xl font-light text-cs-critical">{counts.critical}</div>
              <div className="text-[10px] uppercase tracking-widest text-cs-text-muted mt-2">CRITICAL</div>
            </div>
            <div>
              <div className="text-2xl font-light text-cs-high">{counts.high}</div>
              <div className="text-[10px] uppercase tracking-widest text-cs-text-muted mt-2">HIGH</div>
            </div>
            <div>
              <div className="text-2xl font-light text-cs-medium">{counts.medium}</div>
              <div className="text-[10px] uppercase tracking-widest text-cs-text-muted mt-2">MEDIUM</div>
            </div>
            <div>
              <div className="text-2xl font-light text-cs-low">{counts.low}</div>
              <div className="text-[10px] uppercase tracking-widest text-cs-text-muted mt-2">LOW</div>
            </div>
            <div>
              <div className="text-2xl font-light text-cs-info">{counts.info}</div>
              <div className="text-[10px] uppercase tracking-widest text-cs-text-muted mt-2">INFO</div>
            </div>
          </section>

          {findings.length === 0 && !isRunning ? (
            <div className="text-center py-24 border border-cs-border border-dashed">
              <p className="text-cs-text-secondary">No security findings available.</p>
              <button 
                onClick={handleRunAnalysis}
                className="mt-6 text-xs uppercase tracking-widest text-cs-accent hover:text-cs-accent-hover transition-colors"
              >
                RUN FIRST ANALYSIS →
              </button>
            </div>
          ) : (
            <div className="space-y-0">
              {findings.map((finding, index) => (
                <article key={finding._id || index} className="border-b border-cs-border py-10 last:border-0">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-cs-text-muted">{(index + 1).toString().padStart(2, '0')}</span>
                      <span className="text-cs-text-muted">/</span>
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    <div className="text-xs uppercase tracking-widest text-cs-text-muted border border-cs-border px-2 py-1">
                      {finding.confidence} CONFIDENCE
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-light tracking-wide mb-2">{finding.title}</h3>
                  
                  <div className="font-mono text-sm text-cs-text-secondary bg-[#0D0D0D] p-3 border border-cs-border/50 inline-block mb-6">
                    <span className="text-cs-text">{finding.filePath}</span>
                    {finding.functionName && (
                      <> <span className="text-cs-text-muted">→</span> <span className="text-cs-accent">{finding.functionName}()</span></>
                    )}
                    <span className="text-cs-text-muted ml-4">Lines {finding.startLine}-{finding.endLine}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                      <div>
                        <p className="text-sm leading-relaxed text-cs-text-secondary">{finding.description}</p>
                      </div>
                      
                      {finding.sourceCode && (
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest text-cs-text-muted mb-3">EVIDENCE</h4>
                          <pre className="bg-[#0A0A0A] border border-cs-border p-4 overflow-x-auto text-xs font-mono text-cs-text-secondary">
                            <code>{finding.sourceCode}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-8">
                      <div className="bg-cs-bg-secondary/50 p-6 border border-cs-border">
                        <h4 className="text-[10px] uppercase tracking-widest text-cs-text-muted mb-3">RECOMMENDATION</h4>
                        <p className="text-sm text-cs-text leading-relaxed">{finding.recommendation}</p>
                      </div>
                      
                      <Link 
                        href={`/repositories/${resolvedParams.id}/files/${finding.filePath}?highlight=${finding.startLine}-${finding.endLine}`}
                        className="block w-full text-center border border-cs-border py-3 text-xs uppercase tracking-widest hover:bg-cs-bg-secondary transition-colors"
                      >
                        VIEW SOURCE →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
