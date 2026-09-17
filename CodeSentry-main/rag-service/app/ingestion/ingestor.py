import os
from typing import List, Dict, Any, Tuple
from app.models.chunk import CodeChunk
from app.ast_parser.python_parser import PythonASTParser
from app.ast_parser.generic_parser import GenericParser
from app.ast_parser.text_parser import TextParser

class CodeIngestor:
    def __init__(self):
        self.py_parser = PythonASTParser()
        self.gen_parser = GenericParser()
        self.text_parser = TextParser()
        self.ignored_dirs = {
            '.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build', 
            '.next', 'coverage', '.env', '.venv', 'env', '.tox', 
            '.mypy_cache', '.pytest_cache', '.eggs'
        }
        self.ignored_exts = {'.pyc', '.egg-info', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2', '.ttf', '.mp4'}

    def ingest(self, repo_path: str, repository_id: str) -> Tuple[List[CodeChunk], Dict[str, Any]]:
        chunks = []
        stats = {
            'total_files': 0,
            'parsed_files': 0,
            'total_chunks': 0,
            'languages': {}
        }

        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in self.ignored_dirs]
            
            for file in files:
                if any(file.endswith(ext) for ext in self.ignored_exts):
                    continue
                    
                file_path = os.path.join(root, file)
                
                try:
                    if os.path.getsize(file_path) > 100 * 1024:
                        continue
                except OSError:
                    continue
                    
                stats['total_files'] += 1
                rel_path = os.path.relpath(file_path, repo_path)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        source_code = f.read()
                except UnicodeDecodeError:
                    continue
                    
                file_chunks = []
                if self.py_parser.can_parse(file):
                    file_chunks = self.py_parser.parse(rel_path, source_code, repository_id)
                    lang = 'python'
                elif self.gen_parser.can_parse(file):
                    file_chunks = self.gen_parser.parse(rel_path, source_code, repository_id)
                    lang = self.gen_parser.get_language(file)
                elif self.text_parser.can_parse(file):
                    file_chunks = self.text_parser.parse(rel_path, source_code, repository_id)
                    lang = 'markdown' if file.endswith('.md') else 'text'
                else:
                    continue
                    
                if file_chunks:
                    chunks.extend(file_chunks)
                    stats['parsed_files'] += 1
                    stats['languages'][lang] = stats['languages'].get(lang, 0) + 1
                    
        stats['total_chunks'] = len(chunks)
        return chunks, stats
