"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="w-full bg-cs-bg text-cs-text overflow-hidden relative selection:bg-cs-accent/30">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 mix-blend-screen pointer-events-none" />
        
        <div className="max-w-screen-2xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start"
            style={{ y: y1, opacity: opacityFade }}
          >
            <h1 className="text-6xl md:text-8xl font-light tracking-tight leading-[0.95] mb-8">
              YOUR CODEBASE.<br />
              <span className="text-cs-accent">FULLY UNDERSTOOD.</span>
            </h1>
            <p className="text-cs-text-secondary text-lg max-w-lg leading-relaxed font-light mb-12">
              CodeSentry clones, audits, and understands your repositories so you can ask questions about your code and get answers grounded in the actual codebase.
            </p>
            
            <div className="flex flex-col gap-8">
              <Link 
                href="/repositories" 
                className="group flex items-center gap-3 border border-cs-border hover:border-cs-accent/50 bg-cs-bg-secondary px-8 py-4 text-xs tracking-[0.15em] transition-all duration-300"
              >
                CONNECT GITHUB 
                <span className="text-cs-accent group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
              
              <div className="font-mono text-[10px] text-cs-text-muted mt-8">
                <span className="text-cs-accent">$</span> codesentry analyze<br/>
                <span className="text-cs-text-secondary">↳</span> repository cloned<br/>
                <span className="text-cs-text-secondary">↳</span> codebase indexed<br/>
                <span className="text-cs-text-secondary">↳</span> retrieval ready<br/>
                <br/>
                <span className="animate-pulse">ask your codebase_</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Intentional Atmospheric Negative Space */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="relative h-full min-h-[400px] flex items-center justify-center lg:justify-end"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.05)_0%,rgba(0,0,0,0)_50%)] mix-blend-screen pointer-events-none" />
          </motion.div>

        </div>
      </section>

      {/* 2. CODEBASE INTELLIGENCE */}
      <section id="product" className="py-40 relative border-t border-cs-border/50">
        <div className="max-w-screen-2xl mx-auto px-6 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <p className="text-[10px] tracking-widest uppercase text-cs-accent mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-cs-accent rounded-full animate-pulse" />
              CODEBASE INTELLIGENCE
            </p>
            <h2 className="text-5xl md:text-7xl font-light tracking-tight max-w-2xl">
              ASK YOUR CODEBASE<br/>ANYTHING.
            </h2>
            <p className="text-cs-text-secondary mt-6 max-w-md font-light text-lg">
              Search and understand your entire repository using natural language.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-cs-border border border-cs-border rounded-sm overflow-hidden">
            {/* Left Tree */}
            <div className="col-span-1 lg:col-span-3 bg-cs-bg p-6 font-mono text-[11px] text-cs-text-secondary">
              <div className="text-white mb-4">CodeSentry-API</div>
              <ul className="space-y-2">
                <li>src/</li>
                <li className="pl-4">middleware/</li>
                <li className="pl-8 text-cs-accent">auth.ts</li>
                <li className="pl-4">services/</li>
                <li className="pl-8">auth.service.ts</li>
                <li className="pl-4">routes/</li>
                <li className="pl-8">users.ts</li>
                <li className="pl-4">database/</li>
                <li className="pl-8">connection.ts</li>
              </ul>
            </div>
            
            {/* Right Chat/Code */}
            <div className="col-span-1 lg:col-span-9 bg-[#050505] p-0 flex flex-col h-[500px]">
              <div className="border-b border-cs-border p-6 bg-cs-bg">
                <div className="text-sm font-light text-white">Where does authentication happen?</div>
              </div>
              <div className="flex-1 p-8 overflow-hidden relative">
                <div className="font-mono text-[11px] mb-6 text-cs-text-secondary">
                  Found 3 relevant files in 112ms.
                </div>
                
                <div className="border border-cs-border/50 bg-[#0A0A0A] rounded-sm overflow-hidden mb-6">
                  <div className="px-4 py-2 bg-[#0F0F0F] border-b border-cs-border/50 font-mono text-[10px] text-cs-text-muted flex gap-4">
                    <span className="text-cs-accent">auth.ts</span>
                    <span>auth.service.ts</span>
                    <span>users.ts</span>
                  </div>
                  <pre className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto">
                    <code>
                      <span className="text-cs-text-muted">12</span> <span className="text-[#F87171]">export const</span> authenticate = <span className="text-[#FBBF24]">async</span> (req, res, next) =&gt; {'{\n'}
                      <span className="text-cs-text-muted">13</span>   <span className="text-[#F87171]">const</span> token = req.headers.authorization;<br/>
                      <div className="bg-cs-accent/10 border-l-2 border-cs-accent -ml-4 pl-4 py-1">
                      <span className="text-cs-text-muted">14</span>   <span className="text-[#F87171]">if</span> (!token) {'{\n'}
                      <span className="text-cs-text-muted">15</span>     <span className="text-[#F87171]">return</span> res.status(401).json({'{'} message: <span className="text-cs-accent">"Unauthorized"</span> {'}'});<br/>
                      <span className="text-cs-text-muted">16</span>   {'}'}
                      </div>
                      <span className="text-cs-text-muted">17</span>   <span className="text-cs-text-muted">// ...</span>
                    </code>
                  </pre>
                </div>
                
                <div className="text-sm font-light leading-relaxed">
                  Authentication is handled in <code className="text-[11px] bg-cs-bg-secondary px-1 text-cs-accent">src/middleware/auth.ts</code>, which validates the token before attaching the authenticated user to the request.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AUDIT */}
      <section id="audit" className="py-40 relative border-t border-cs-border/50 bg-[#050505]">
        <div className="max-w-screen-2xl mx-auto px-6 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <p className="text-[10px] tracking-widest uppercase text-cs-text-secondary mb-6">
              CODE AUDIT
            </p>
            <h2 className="text-5xl md:text-7xl font-light tracking-tight max-w-2xl">
              KNOW WHAT'S<br/>INSIDE YOUR CODE.
            </h2>
            <p className="text-cs-text-secondary mt-6 max-w-md font-light text-lg">
              CodeSentry analyzes your repository to surface potential security and codebase issues.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-px bg-cs-border">
              {['Authentication', 'Authorization', 'Dependencies', 'API Exposure'].map((item, i) => (
                <div key={item} className="bg-cs-bg p-6 flex justify-between items-center group">
                  <span className="text-sm tracking-wide text-white group-hover:text-cs-accent transition-colors">{item}</span>
                  <span className="text-cs-accent">✓</span>
                </div>
              ))}
            </div>
            
            <div className="border border-cs-border bg-[#0A0A0A] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FBBF24]" />
              <div className="text-[10px] font-mono text-[#FBBF24] mb-4 uppercase tracking-widest">HIGH</div>
              <h3 className="text-2xl font-light mb-4">Potential authorization issue</h3>
              <div className="font-mono text-[11px] text-cs-text-secondary bg-cs-bg p-2 inline-block mb-6 border border-cs-border">
                src/controllers/project.controller.ts
              </div>
              <p className="text-sm font-light text-cs-text-secondary leading-relaxed">
                Authentication is verified, but project ownership is not explicitly checked before returning project data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-40 relative border-t border-cs-border/50">
        <div className="max-w-screen-2xl mx-auto px-6 w-full flex flex-col md:flex-row gap-24">
          <div className="md:w-1/3">
            <h2 className="text-5xl font-light tracking-tight sticky top-32">
              FROM REPOSITORY<br/>TO UNDERSTANDING.
            </h2>
          </div>
          
          <div className="md:w-2/3 relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-cs-border" />
            
            {[
              { title: "Clone", desc: "Securely fetches your repository structure and contents." },
              { title: "Analyze", desc: "AST-aware parsing splits code logically by function and class." },
              { title: "Retrieve", desc: "Dual dense and BM25 indices locate relevant contexts instantly." },
              { title: "Reason", desc: "Cross-encoder reranking isolates the exact evidence." },
              { title: "Answer", desc: "Synthesizes responses completely grounded in your codebase." }
            ].map((step, i) => (
              <motion.div 
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-24 py-12"
              >
                <div className="absolute left-7 top-1/2 -translate-y-1/2 w-3 h-3 bg-cs-bg border border-cs-accent rounded-full z-10" />
                <h3 className="text-2xl font-light mb-2">{step.title}</h3>
                <p className="text-sm text-cs-text-secondary font-light max-w-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SELF DEMO */}
      <section className="py-40 relative border-t border-cs-border/50 bg-cs-bg-secondary">
        <div className="max-w-screen-2xl mx-auto px-6 w-full text-center">
          <p className="text-[10px] tracking-widest uppercase text-cs-text-secondary mb-12">
            META INTELLIGENCE
          </p>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-16">
            WE ASKED CODESENTRY<br/>ABOUT CODESENTRY.
          </h2>
          
          <div className="max-w-3xl mx-auto text-left bg-cs-bg border border-cs-border shadow-2xl p-8">
            <div className="flex gap-4 mb-8 items-start">
              <div className="w-8 h-8 rounded bg-cs-bg-tertiary flex items-center justify-center shrink-0 border border-cs-border text-xs">U</div>
              <div className="pt-1 text-sm font-light">How does CodeSentry retrieve relevant code?</div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded bg-cs-accent/10 border border-cs-accent/30 flex items-center justify-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-cs-accent" />
              </div>
              <div className="pt-1">
                <div className="font-mono text-[10px] text-cs-text-secondary flex gap-2 mb-4">
                  <span className="bg-cs-bg-secondary px-2 py-1 border border-cs-border">rag-service/app/retrieval/dense_retriever.py</span>
                </div>
                <p className="text-sm font-light text-cs-text leading-relaxed">
                  CodeSentry uses a hybrid retrieval pipeline. It passes queries through both a dense vector search (ChromaDB) and a lexical search (BM25), then applies Reciprocal Rank Fusion (RRF) before finally reranking candidates using a cross-encoder model.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-40 relative border-t border-cs-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-atmospheric opacity-20 pointer-events-none mix-blend-screen" />
        <div className="max-w-screen-xl mx-auto px-6 w-full text-center relative z-10 flex flex-col items-center">
          <h2 className="text-6xl md:text-8xl font-light tracking-tight mb-8">
            GIVE YOUR CODEBASE<br/>A VOICE.
          </h2>
          <p className="text-cs-text-secondary text-lg font-light mb-16 max-w-md">
            Connect a GitHub repository and start exploring your codebase with unmatched precision.
          </p>
          <Link 
            href="/repositories" 
            className="group inline-flex items-center gap-4 bg-white text-black px-10 py-5 text-xs tracking-[0.2em] font-medium transition-all hover:bg-cs-accent"
          >
            CONNECT GITHUB
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-cs-border bg-[#050505]">
        <div className="max-w-screen-2xl mx-auto px-6 w-full flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xs uppercase tracking-logo font-semibold">
            CODESENTRY
          </div>
          <nav className="flex gap-8 text-[10px] uppercase tracking-widest text-cs-text-secondary">
            <Link href="/#product" className="hover:text-white transition-colors">Product</Link>
            <Link href="/#how-it-works" className="hover:text-white transition-colors">How it works</Link>
            <Link href="/#audit" className="hover:text-white transition-colors">Audit</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="https://github.com/dishasharma23-prog/CodeSentry" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
