import React from 'react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="bg-cs-bg text-white min-h-screen pt-32 pb-24 font-sans selection:bg-cs-accent/30 selection:text-white">
      <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
        
        {/* Sidebar */}
        <div className="md:col-span-3">
          <div className="sticky top-32">
            <h3 className="text-[11px] uppercase tracking-widest text-cs-text-secondary mb-6 border-b border-cs-border pb-4">Documentation</h3>
            <nav className="flex flex-col gap-4 text-[13px] font-mono">
              <a href="#overview" className="text-white hover:text-cs-accent transition-colors">Overview</a>
              <a href="#ingestion" className="text-cs-text-secondary hover:text-white transition-colors">Ingestion & Parsing</a>
              <a href="#retrieval" className="text-cs-text-secondary hover:text-white transition-colors">Hybrid Retrieval</a>
              <a href="#isolation" className="text-cs-text-secondary hover:text-white transition-colors">Repository Isolation</a>
              <a href="#features" className="text-cs-text-secondary hover:text-white transition-colors">Core Features</a>
              <a href="#architecture" className="text-cs-text-secondary hover:text-white transition-colors">Architecture</a>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-8 md:col-start-5 space-y-24">
          
          <section id="overview" className="scroll-mt-32">
            <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-8">
              CODESENTRY<br/>
              <span className="text-cs-text-secondary">SYSTEM ARCHITECTURE</span>
            </h1>
            <div className="prose prose-invert prose-p:text-cs-text-secondary prose-p:font-light prose-p:leading-relaxed max-w-none">
              <p className="text-xl border-l border-cs-accent pl-6">
                CodeSentry is an advanced, AI-powered security auditing and RAG (Retrieval-Augmented Generation) 
                application designed for deep codebase analysis. It automatically ingests, chunks, embeds, 
                and analyzes GitHub repositories to surface critical security vulnerabilities while allowing 
                developers to semantically query their codebase.
              </p>
            </div>
          </section>

          <section id="ingestion" className="scroll-mt-32 border-t border-cs-border pt-16">
            <h2 className="text-2xl font-light mb-8">Ingestion & Parsing</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-widest text-cs-accent mb-3">AST-Aware Parsing</h3>
                <p className="text-cs-text-secondary font-light leading-relaxed">
                  For supported languages (.py, .js, .ts, .java, .go, .rs, .c, .cpp), CodeSentry employs Abstract Syntax Tree 
                  (AST) extraction and regex heuristic strategies. Instead of arbitrarily splitting code, chunks are strictly 
                  aligned with code boundaries—capturing distinct classes, functions, and methods to preserve context.
                </p>
              </div>
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-widest text-cs-accent mb-3">Generic Text/Documentation</h3>
                <p className="text-cs-text-secondary font-light leading-relaxed">
                  CodeSentry inherently understands that documentation is critical context. Files such as <code>README.md</code>, 
                  <code>.txt</code>, <code>.csv</code>, and extension-less text files are routed through a dedicated TextParser. 
                  This ensures that even documentation-only repositories are fully indexed and retrievable, without overwhelming the context window.
                </p>
              </div>
            </div>
          </section>

          <section id="retrieval" className="scroll-mt-32 border-t border-cs-border pt-16">
            <h2 className="text-2xl font-light mb-8">Retrieval Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-cs-panel border border-cs-border p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2 h-2 bg-cs-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-[11px] font-mono uppercase tracking-widest text-white mb-4">Hybrid BM25 + Dense</h3>
                <p className="text-sm text-cs-text-secondary font-light leading-relaxed">
                  Queries are simultaneously executed against ChromaDB (for dense semantic understanding via embeddings) 
                  and a BM25L index (for exact-keyword sparsity matching). The results are fused using Reciprocal Rank Fusion (RRF).
                </p>
              </div>
              <div className="bg-cs-panel border border-cs-border p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2 h-2 bg-cs-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-[11px] font-mono uppercase tracking-widest text-white mb-4">Cross-Encoder Reranking</h3>
                <p className="text-sm text-cs-text-secondary font-light leading-relaxed">
                  The initial broad retrieval phase returns N candidates, which are then passed through a rigorous 
                  MS-MARCO cross-encoder. The cross-encoder re-evaluates the query-to-chunk relationship, 
                  pushing the highest-fidelity context to the top before LLM injection.
                </p>
              </div>
            </div>
          </section>

          <section id="isolation" className="scroll-mt-32 border-t border-cs-border pt-16">
            <h2 className="text-2xl font-light mb-8 text-cs-accent">Repository Isolation</h2>
            <p className="text-cs-text-secondary font-light leading-relaxed mb-6">
              CodeSentry guarantees absolute multi-tenant cryptographic isolation. A critical invariant of the pipeline is 
              that context from one repository cannot bleed into another.
            </p>
            <ul className="space-y-4 text-sm text-cs-text-secondary font-mono">
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 bg-cs-accent"></div>
                ChromaDB retrieval is strictly constrained by <span className="text-white">where=&#123;"repository_id": ...&#125;</span> metadata filters.
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 bg-cs-accent"></div>
                BM25 chunks are manually validated against the active repository ID post-retrieval.
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 bg-cs-accent"></div>
                A final pre-generation validation hook aggressively discards any misaligned context.
              </li>
            </ul>
          </section>

          <section id="features" className="scroll-mt-32 border-t border-cs-border pt-16">
            <h2 className="text-2xl font-light mb-8">Core Capabilities</h2>
            <div className="space-y-12">
              <div>
                <h3 className="text-lg font-light mb-3">Ask Questions</h3>
                <p className="text-cs-text-secondary font-light leading-relaxed">
                  Chat semantically with your codebase. The LLM (Gemini 2.0 Flash) receives precise RAG context, 
                  allowing it to answer deeply technical questions without hallucinating file structures.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-light mb-3">Security Analysis</h3>
                <p className="text-cs-text-secondary font-light leading-relaxed">
                  Perform comprehensive static analysis targeting authentication, input validation, 
                  and access control logic. CodeSentry correlates vectors across files and returns 
                  severity-ranked findings.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-light mb-3">Interactive Citations & Source Viewer</h3>
                <p className="text-cs-text-secondary font-light leading-relaxed">
                  Every claim the LLM makes is backed by a specific citation. Citations are parsed 
                  and embedded as interactive links in the chat. Clicking a citation instantly opens 
                  the Source Viewer, navigating to the exact file and highlighting the specific line range.
                </p>
              </div>
            </div>
          </section>

          <section id="architecture" className="scroll-mt-32 border-t border-cs-border pt-16">
            <h2 className="text-2xl font-light mb-8">Production Architecture</h2>
            <div className="p-8 border border-cs-border bg-cs-panel/50 font-mono text-sm text-cs-text-secondary">
              <pre className="overflow-x-auto">
{`[ Next.js 16 (Frontend) ]
        | (REST / API Routes)
        v
[ Node.js + Express (Backend) ]  <---> [ MongoDB Atlas ]
        | (Proxy / Sync)
        v
[ FastAPI (RAG Service) ]
        |
    +---+---+
    |       |
[ Chroma ] [ BM25 ]
(Dense)    (Sparse)`}
              </pre>
            </div>
            <div className="mt-8 flex justify-end">
              <Link href="/repositories" className="px-6 py-3 bg-white text-black text-[11px] uppercase tracking-widest font-semibold hover:bg-cs-accent hover:text-white transition-all flex items-center gap-2">
                Start Auditing <span className="text-sm">→</span>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
