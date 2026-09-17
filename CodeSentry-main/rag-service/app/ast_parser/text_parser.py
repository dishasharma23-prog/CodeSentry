import os
from typing import List
from app.ast_parser.base import BaseASTParser
from app.models.chunk import CodeChunk

class TextParser(BaseASTParser):
    def can_parse(self, file_path: str) -> bool:
        exts = ['.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.ini', '.csv', '.cfg']
        filename = os.path.basename(file_path)
        if '.' not in filename:
            return True
        return any(file_path.endswith(ext) for ext in exts)
        
    def supported_extensions(self) -> List[str]:
        return ['.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.ini', '.csv', '.cfg', '']

    def parse(self, file_path: str, source_code: str, repository_id: str) -> List[CodeChunk]:
        chunks = []
        source_lines = source_code.splitlines()
        
        # Line-based chunking for documents to prevent context windows from being overwhelmed
        chunk_size = 200
        filename = os.path.basename(file_path)
        
        if not source_lines:
            return chunks

        for i in range(0, len(source_lines), chunk_size):
            start_line = i + 1
            end_line = min(i + chunk_size, len(source_lines))
            chunk_source = "\n".join(source_lines[i:end_line])
            
            chunks.append(CodeChunk(
                chunk_id=f"{repository_id}:{file_path}:document:{start_line}",
                repository_id=repository_id,
                file_path=file_path,
                language="markdown" if file_path.endswith(".md") else "text",
                symbol_name=filename,
                symbol_type="document",
                start_line=start_line,
                end_line=end_line,
                source_code=chunk_source
            ))
            
        return chunks
