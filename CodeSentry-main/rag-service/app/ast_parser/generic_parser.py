import re
from typing import List
from app.ast_parser.base import BaseASTParser
from app.models.chunk import CodeChunk

class GenericParser(BaseASTParser):
    def can_parse(self, file_path: str) -> bool:
        return any(file_path.endswith(ext) for ext in self.supported_extensions())
        
    def supported_extensions(self) -> List[str]:
        return ['.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.rb']
        
    def get_language(self, file_path: str) -> str:
        ext = file_path.split('.')[-1]
        mapping = {
            'js': 'javascript', 'ts': 'typescript', 'jsx': 'javascript', 'tsx': 'typescript',
            'java': 'java', 'go': 'go', 'rs': 'rust', 'c': 'c', 'cpp': 'cpp', 'h': 'c', 'rb': 'ruby'
        }
        return mapping.get(ext, 'unknown')

    def parse(self, file_path: str, source_code: str, repository_id: str) -> List[CodeChunk]:
        chunks = []
        source_lines = source_code.splitlines()
        lang = self.get_language(file_path)
        
        patterns = [
            (r'^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(', 'function'),
            (r'^(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>', 'function'),
            (r'^(?:export\s+)?class\s+([a-zA-Z0-9_]+)', 'class'),
            (r'^\s*(?:public|private|protected)?\s*(?:static\s+)?[\w<>,\[\]]+\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{', 'function'),
            (r'^func\s+([a-zA-Z0-9_]+)\s*\(', 'function'),
            (r'^fn\s+([a-zA-Z0-9_]+)\s*\(', 'function'),
            (r'^def\s+([a-zA-Z0-9_]+)', 'function')
        ]
        
        current_symbol = None
        current_type = None
        start_line = 0
        
        for i, line in enumerate(source_lines):
            for pattern, sym_type in patterns:
                match = re.search(pattern, line.strip())
                if match:
                    if current_symbol:
                        chunks.append(CodeChunk(
                            chunk_id=f"{repository_id}:{file_path}:{current_symbol}:{start_line}",
                            repository_id=repository_id,
                            file_path=file_path,
                            language=lang,
                            symbol_name=current_symbol,
                            symbol_type=current_type,
                            start_line=start_line,
                            end_line=i,
                            source_code="\n".join(source_lines[start_line-1:i])
                        ))
                    current_symbol = match.group(1)
                    current_type = sym_type
                    start_line = i + 1
                    break
        
        if current_symbol:
            chunks.append(CodeChunk(
                chunk_id=f"{repository_id}:{file_path}:{current_symbol}:{start_line}",
                repository_id=repository_id,
                file_path=file_path,
                language=lang,
                symbol_name=current_symbol,
                symbol_type=current_type,
                start_line=start_line,
                end_line=len(source_lines),
                source_code="\n".join(source_lines[start_line-1:])
            ))
            
        if not chunks:
            chunks.append(CodeChunk(
                chunk_id=f"{repository_id}:{file_path}:file:1",
                repository_id=repository_id,
                file_path=file_path,
                language=lang,
                symbol_name="file",
                symbol_type="file",
                start_line=1,
                end_line=len(source_lines),
                source_code=source_code
            ))
            
        return chunks
