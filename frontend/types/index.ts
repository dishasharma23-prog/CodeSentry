export interface Repository {
  _id: string;
  url: string;
  name: string;
  owner: string;
  status: 'pending' | 'cloning' | 'parsing' | 'indexing' | 'ready' | 'failed';
  error?: string;
  stats: {
    totalFiles: number;
    totalChunks: number;
    totalFindings: number;
    languages: Record<string, number>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  _id: string;
  repositoryId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  title: string;
  description: string;
  category: string;
  filePath: string;
  functionName?: string;
  className?: string;
  startLine: number;
  endLine: number;
  evidence: string;
  sourceCode: string;
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
  createdAt: string;
}

export interface QueryResponse {
  answer: string;
  sources: SourceCitation[];
  query: string;
}

export interface SourceCitation {
  file_path: string;
  symbol_name: string;
  symbol_type: string;
  start_line: number;
  end_line: number;
  source_code: string;
  relevance_score: number;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  language?: string;
  children?: number;
}

export interface FileContent {
  content: string;
  language: string;
  lineCount: number;
  path: string;
}
