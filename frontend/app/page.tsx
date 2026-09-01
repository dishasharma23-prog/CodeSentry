"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-6 w-full">
      <section className="pt-32 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p variants={itemVariants} className="uppercase text-xs tracking-widest text-cs-accent mb-8">
            CODE SECURITY / AST-AWARE RAG
          </motion.p>
          
          <motion.h1 variants={itemVariants} className="text-7xl md:text-8xl font-light tracking-tightest leading-none">
            SEE WHAT<br />
            YOUR CODE<br />
            IS REALLY DOING.
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg text-cs-text-secondary max-w-xl mt-8 leading-relaxed">
            CodeSentry maps your codebase by its actual structure — functions, classes, methods — then retrieves the most relevant source code to ground security analysis in evidence, not speculation.
          </motion.p>
          
          <motion.div variants={itemVariants} className="mt-12 flex flex-wrap gap-6">
            <Link 
              href="/repositories" 
              className="bg-cs-accent text-black px-8 py-4 text-sm tracking-[0.15em] hover:scale-[1.02] transition-transform uppercase font-medium"
            >
              ANALYZE REPOSITORY →
            </Link>
            <Link 
              href="/dashboard" 
              className="border border-cs-border text-cs-text px-8 py-4 text-sm tracking-[0.15em] hover:bg-cs-bg-secondary transition-colors uppercase"
            >
              EXPLORE THE SYSTEM →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="mt-32 border-t border-cs-border pt-16">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="uppercase text-xs tracking-widest text-cs-text-muted mb-16"
        >
          HOW IT WORKS
        </motion.p>
        
        <div className="relative pl-8 md:pl-0">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-cs-border md:hidden"></div>
          
          <div className="space-y-24">
            {[
              {
                step: "01",
                title: "PARSE",
                desc: "AST-aware extraction of functions, classes, and methods"
              },
              {
                step: "02",
                title: "INDEX",
                desc: "Dense embeddings + BM25 lexical index"
              },
              {
                step: "03",
                title: "RETRIEVE",
                desc: "Hybrid search with reciprocal rank fusion"
              },
              {
                step: "04",
                title: "RERANK",
                desc: "Cross-encoder scoring of candidates"
              },
              {
                step: "05",
                title: "ANALYZE",
                desc: "Source-grounded security analysis with exact citations"
              }
            ].map((item, i) => (
              <motion.div 
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative md:flex md:items-start md:gap-16"
              >
                <div className="absolute -left-8 top-6 w-8 h-px bg-cs-border md:hidden"></div>
                <div className="text-6xl text-cs-accent font-light md:w-32 shrink-0">
                  {item.step}
                </div>
                <div className="mt-4 md:mt-6">
                  <h3 className="text-xl tracking-wide">{item.title}</h3>
                  <p className="text-cs-text-secondary text-sm mt-2 uppercase tracking-wider">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-32 border-t border-cs-border pt-16 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {[
            {
              title: "AST-AWARE CHUNKING",
              desc: "Function and class-level code parsing, not naive text splitting."
            },
            {
              title: "HYBRID RETRIEVAL",
              desc: "BM25 keyword matching combined with dense semantic search."
            },
            {
              title: "SOURCE GROUNDING",
              desc: "Every answer cites the exact file, function, and line range."
            }
          ].map((feature) => (
            <motion.div 
              key={feature.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-sm font-medium tracking-wider mb-4 border-b border-cs-border pb-4">{feature.title}</h4>
              <p className="text-cs-text-secondary text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="mt-16 py-16 border-t border-cs-border text-center text-xs text-cs-text-muted tracking-widest uppercase">
        CODESENTRY — AST-AWARE RAG FOR CODE SECURITY
      </footer>
    </div>
  );
}
