"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useRepository } from "@/hooks/useRepository";
import { FileContent } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion } from "framer-motion";

function highlightCode(code: string, language: string) {
  if (!code) return "";
  
  let highlighted = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (language.toLowerCase() === 'python') {
    // Keywords
    const keywords = ['def', 'class', 'return', 'if', 'else', 'elif', 'import', 'from', 'as', 'try', 'except', 'pass', 'for', 'in', 'while', 'with', 'yield', 'async', 'await'];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    highlighted = highlighted.replace(keywordRegex, '<span class="text-blue-400">$1</span>');
    
    // Strings
    highlighted = highlighted.replace(/("[^"]*"|'[^']*')/g, '<span class="text-green-400">$1</span>');
    
    // Comments
    highlighted = highlighted.replace(/(#.*)/g, '<span class="text-cs-text-muted italic">$1</span>');
    
    // Decorators
    highlighted = highlighted.replace(/(@\w+)/g, '<span class="text-purple-400">$1</span>');
    
    // Function calls
    highlighted = highlighted.replace(/(\w+)(?=\()/g, '<span class="text-yellow-200">$1</span>');
  }

  return highlighted;
}

export default function FileViewerPage({ params }: { params: Promise<{ id: string, path: string[] }> }) {
  const resolvedParams = use(params);
  const { repository } = useRepository(resolvedParams.id);
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");
  
  const [highlightStart, highlightEnd] = highlightParam 
    ? highlightParam.split('-').map(Number) 
    : [0, 0];

  const filePath = resolvedParams.path.join('/');
  
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const contentRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    async function fetchFile() {
      setIsLoading(true);
      setError("");
      try {
        const data = await api.getFileContent(resolvedParams.id, filePath);
        setFileContent(data);
      } catch (err) {
        setError("Failed to load file content.");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (resolvedParams.id && filePath) {
      fetchFile();
    }
  }, [resolvedParams.id, filePath]);

  useEffect(() => {
    if (highlightStart > 0 && contentRef.current && !isLoading) {
      setTimeout(() => {
        const highlightedEl = document.getElementById(`line-${highlightStart}`);
        if (highlightedEl) {
          highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightStart, isLoading]);

  const pathParts = filePath.split('/');
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 w-full py-16"
    >
      <nav className="mb-8">
        <p className="text-xs tracking-widest uppercase text-cs-text-muted flex items-center flex-wrap gap-2">
          <Link href="/repositories" className="hover:text-cs-text">REPOSITORIES</Link> 
          <span>/</span> 
          <Link href={`/repositories/${resolvedParams.id}`} className="hover:text-cs-text">{repository?.name || '...'}</Link> 
          <span>/</span> 
          <Link href={`/repositories/${resolvedParams.id}/files`} className="hover:text-cs-text">FILES</Link>
          
          {pathParts.map((part, i) => {
            const currentPath = pathParts.slice(0, i + 1).join('/');
            const isLast = i === pathParts.length - 1;
            return (
              <span key={currentPath} className="flex items-center gap-2">
                <span>/</span>
                <Link 
                  href={isLast ? '#' : `/repositories/${resolvedParams.id}/files?path=${encodeURIComponent(currentPath)}`}
                  className={isLast ? "text-cs-text" : "hover:text-cs-text"}
                >
                  {part}
                </Link>
              </span>
            );
          })}
        </p>
      </nav>

      {error && <div className="mb-8 text-cs-critical text-sm">{error}</div>}

      {isLoading ? (
        <div className="py-24 flex justify-center border border-cs-border">
          <LoadingSpinner text="LOADING FILE CONTENT..." />
        </div>
      ) : fileContent ? (
        <div className="border border-cs-border bg-[#0D0D0D]">
          <div className="border-b border-cs-border px-6 py-4 flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-cs-text-muted">
            <div><span className="text-cs-text mr-2">FILE:</span>{pathParts[pathParts.length - 1]}</div>
            {fileContent.language && <div><span className="text-cs-text mr-2">LANG:</span>{fileContent.language}</div>}
            <div><span className="text-cs-text mr-2">LINES:</span>{fileContent.lineCount || fileContent.content.split('\n').length}</div>
          </div>
          
          <div className="overflow-x-auto">
            <pre ref={contentRef} className="text-sm font-mono leading-relaxed py-4 min-w-max">
              <code>
                {fileContent.content.split('\n').map((line, i) => {
                  const lineNum = i + 1;
                  const isHighlighted = highlightStart > 0 && lineNum >= highlightStart && lineNum <= highlightEnd;
                  
                  return (
                    <div 
                      key={lineNum} 
                      id={`line-${lineNum}`}
                      className={`flex px-4 hover:bg-white/5 ${isHighlighted ? 'bg-cs-accent/10 border-l-2 border-cs-accent' : 'border-l-2 border-transparent'}`}
                    >
                      <span className="w-12 shrink-0 text-right pr-4 text-cs-text-muted select-none border-r border-cs-border/30 mr-4">
                        {lineNum}
                      </span>
                      <span 
                        className="whitespace-pre"
                        dangerouslySetInnerHTML={{ __html: highlightCode(line, fileContent.language || '') }}
                      />
                    </div>
                  );
                })}
              </code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="py-24 text-center border border-cs-border text-cs-text-secondary">
          No content available.
        </div>
      )}
    </motion.div>
  );
}
