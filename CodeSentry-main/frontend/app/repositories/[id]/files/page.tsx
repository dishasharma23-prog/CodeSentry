"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useRepository } from "@/hooks/useRepository";
import { FileEntry } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatNumber } from "@/lib/utils";
import { motion } from "framer-motion";

export default function FilesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { repository } = useRepository(resolvedParams.id);
  const searchParams = useSearchParams();
  const path = searchParams.get("path") || "";
  
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchFiles() {
      setIsLoading(true);
      setError("");
      try {
        const data = await api.getFiles(resolvedParams.id, path);
        setFiles(data);
      } catch (err) {
        setError("Failed to load files.");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (resolvedParams.id) {
      fetchFiles();
    }
  }, [resolvedParams.id, path]);

  // Breadcrumbs for path
  const pathParts = path ? path.split('/').filter(Boolean) : [];
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-6 w-full py-16"
    >
      <nav className="mb-8">
        <p className="text-xs tracking-widest uppercase text-cs-text-muted flex items-center flex-wrap gap-2">
          <Link href="/repositories" className="hover:text-cs-text">REPOSITORIES</Link> 
          <span>/</span> 
          <Link href={`/repositories/${resolvedParams.id}`} className="hover:text-cs-text">{repository?.name || '...'}</Link> 
          <span>/</span> 
          <Link href={`/repositories/${resolvedParams.id}/files`} className={!path ? "text-cs-text" : "hover:text-cs-text"}>FILES</Link>
          
          {pathParts.map((part, i) => {
            const currentPath = pathParts.slice(0, i + 1).join('/');
            const isLast = i === pathParts.length - 1;
            return (
              <span key={currentPath} className="flex items-center gap-2">
                <span>/</span>
                <Link 
                  href={`/repositories/${resolvedParams.id}/files?path=${encodeURIComponent(currentPath)}`}
                  className={isLast ? "text-cs-text" : "hover:text-cs-text"}
                >
                  {part}
                </Link>
              </span>
            );
          })}
        </p>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl font-light tracking-tight">FILE EXPLORER</h1>
      </header>

      {error && <div className="mb-8 text-cs-critical text-sm">{error}</div>}

      <div className="border border-cs-border bg-[#0A0A0A]">
        {pathParts.length > 0 && (
          <div className="border-b border-cs-border">
            <Link 
              href={`/repositories/${resolvedParams.id}/files${pathParts.length > 1 ? `?path=${encodeURIComponent(pathParts.slice(0, -1).join('/'))}` : ''}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-cs-bg-secondary transition-colors"
            >
              <span className="text-cs-text-muted font-mono">..</span>
            </Link>
          </div>
        )}
        
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner text="LOADING FILES..." />
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center text-cs-text-secondary text-sm">
            Directory is empty.
          </div>
        ) : (
          <div className="divide-y divide-cs-border">
            {/* Directories first, then files */}
            {files.sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === 'directory' ? -1 : 1;
            }).map((file) => (
              <div key={file.path}>
                {file.type === 'directory' ? (
                  <Link 
                    href={`/repositories/${resolvedParams.id}/files?path=${encodeURIComponent(file.path)}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-cs-bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-cs-accent opacity-70 group-hover:opacity-100">D</span>
                      <span className="font-mono text-sm">{file.name}/</span>
                    </div>
                    <div className="text-xs text-cs-text-muted font-mono">
                      {file.children !== undefined ? `${file.children} items` : ''}
                    </div>
                  </Link>
                ) : (
                  <Link 
                    href={`/repositories/${resolvedParams.id}/files/${file.path}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-cs-bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-cs-text-muted group-hover:text-cs-text">F</span>
                      <span className="font-mono text-sm group-hover:text-cs-text text-cs-text-secondary">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-cs-text-muted font-mono">
                      {file.language && <span>{file.language}</span>}
                      <span>{formatNumber(file.size)} B</span>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
