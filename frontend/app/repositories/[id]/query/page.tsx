"use client";

import { useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRepository } from "@/hooks/useRepository";
import { QueryResponse } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { repository } = useRepository(resolvedParams.id);
  
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<QueryResponse[]>([]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError("");
    
    try {
      const result = await api.queryRepository(resolvedParams.id, query);
      setResponse(result);
      if (result) {
        setHistory(prev => [result, ...prev]);
      }
      setQuery("");
    } catch (err) {
      setError("Failed to query the repository.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-6 w-full py-16"
    >
      <nav className="mb-8">
        <p className="text-xs tracking-widest uppercase text-cs-text-muted">
          <Link href="/repositories" className="hover:text-cs-text">REPOSITORIES</Link> / 
          <Link href={`/repositories/${resolvedParams.id}`} className="hover:text-cs-text ml-1">{repository?.name || '...'}</Link> / 
          <span className="text-cs-text ml-1">QUERY</span>
        </p>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl font-light tracking-tight">ASK CODESENTRY</h1>
        <p className="text-cs-text-secondary mt-4">Ask questions about the codebase. Answers are grounded in actual source code.</p>
      </header>

      <form onSubmit={handleAsk} className="mb-12">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Where is authentication handled and what encryption is used?"
            className="w-full bg-[#0D0D0D] border border-cs-border py-4 px-6 min-h-[120px] text-cs-text outline-none focus:border-cs-accent transition-colors resize-y text-base font-mono"
            disabled={isSearching}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk(e);
              }
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-cs-text-muted uppercase tracking-widest">PRESS ENTER TO SUBMIT</div>
          <button 
            type="submit" 
            disabled={isSearching || !query.trim()}
            className="bg-cs-accent text-black px-8 py-3 text-sm tracking-[0.15em] font-medium uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cs-accent-hover transition-colors"
          >
            {isSearching ? "SEARCHING..." : "ASK →"}
          </button>
        </div>
        {error && <p className="text-cs-critical text-sm mt-4">{error}</p>}
      </form>

      {isSearching && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="RETRIEVING AND ANALYZING..." />
        </div>
      )}

      {response && !isSearching && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cs-bg-secondary/30 border border-cs-border p-8"
        >
          <div className="mb-8">
            <h3 className="text-xs tracking-widest text-cs-accent uppercase mb-4">CODESENTRY</h3>
            <div className="text-base leading-relaxed whitespace-pre-wrap">
              {response.answer}
            </div>
          </div>

          {response.sources && response.sources.length > 0 && (
            <div className="border-t border-cs-border pt-8 mt-8">
              <h3 className="text-xs tracking-widest text-cs-text-muted uppercase mb-6">SOURCES ({response.sources.length})</h3>
              
              <div className="space-y-6">
                {response.sources.map((source, i) => (
                  <div key={i} className="border-b border-cs-border/50 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm text-cs-accent font-mono break-all">{source.file_path}</div>
                        {source.symbol_name && (
                          <div className="text-sm font-mono mt-1 text-cs-text-secondary">
                            {source.symbol_type}: {source.symbol_name}
                          </div>
                        )}
                      </div>
                      <Link 
                        href={`/repositories/${resolvedParams.id}/files/${source.file_path}?highlight=${source.start_line}-${source.end_line}`}
                        className="text-xs border border-cs-border px-3 py-1 uppercase tracking-widest hover:border-cs-accent hover:text-cs-accent transition-colors shrink-0"
                      >
                        VIEW →
                      </Link>
                    </div>
                    <div className="text-xs text-cs-text-muted mb-3 font-mono">Lines {source.start_line}-{source.end_line}</div>
                    
                    {source.source_code && (
                      <pre className="bg-[#0A0A0A] border border-cs-border p-4 overflow-x-auto text-xs font-mono text-cs-text-secondary">
                        <code>{source.source_code.slice(0, 300)}{source.source_code.length > 300 ? '\n...' : ''}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
