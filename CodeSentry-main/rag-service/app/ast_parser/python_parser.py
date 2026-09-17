import ast
from typing import List
from app.ast_parser.base import BaseASTParser
from app.models.chunk import CodeChunk

class PythonASTParser(BaseASTParser):
    def can_parse(self, file_path: str) -> bool:
        return file_path.endswith('.py')
        
    def supported_extensions(self) -> List[str]:
        return ['.py']

    def _extract_source(self, source_lines: List[str], start_line: int, end_line: int) -> str:
        return "\n".join(source_lines[start_line - 1 : end_line])

    def parse(self, file_path: str, source_code: str, repository_id: str) -> List[CodeChunk]:
        chunks = []
        source_lines = source_code.splitlines()
        
        try:
            tree = ast.parse(source_code)
        except SyntaxError:
            return chunks

        for node in ast.iter_child_nodes(tree):
            if isinstance(node, ast.ClassDef):
                docstring = ast.get_docstring(node)
                class_source = self._extract_source(source_lines, node.lineno, node.end_lineno)
                
                chunks.append(CodeChunk(
                    chunk_id=f"{repository_id}:{file_path}:{node.name}:{node.lineno}",
                    repository_id=repository_id,
                    file_path=file_path,
                    language="python",
                    symbol_name=node.name,
                    symbol_type="class",
                    class_name=node.name,
                    start_line=node.lineno,
                    end_line=node.end_lineno,
                    source_code=class_source,
                    docstring=docstring
                ))
                
                for class_node in node.body:
                    if isinstance(class_node, ast.FunctionDef) or isinstance(class_node, ast.AsyncFunctionDef):
                        method_docstring = ast.get_docstring(class_node)
                        method_source = self._extract_source(source_lines, class_node.lineno, class_node.end_lineno)
                        
                        chunks.append(CodeChunk(
                            chunk_id=f"{repository_id}:{file_path}:{class_node.name}:{class_node.lineno}",
                            repository_id=repository_id,
                            file_path=file_path,
                            language="python",
                            symbol_name=class_node.name,
                            symbol_type="method",
                            class_name=node.name,
                            function_name=class_node.name,
                            start_line=class_node.lineno,
                            end_line=class_node.end_lineno,
                            source_code=method_source,
                            docstring=method_docstring
                        ))
            
            elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                docstring = ast.get_docstring(node)
                func_source = self._extract_source(source_lines, node.lineno, node.end_lineno)
                
                chunks.append(CodeChunk(
                    chunk_id=f"{repository_id}:{file_path}:{node.name}:{node.lineno}",
                    repository_id=repository_id,
                    file_path=file_path,
                    language="python",
                    symbol_name=node.name,
                    symbol_type="function",
                    function_name=node.name,
                    start_line=node.lineno,
                    end_line=node.end_lineno,
                    source_code=func_source,
                    docstring=docstring
                ))

        module_level_lines = []
        for node in tree.body:
            if not isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
                if hasattr(node, 'lineno') and hasattr(node, 'end_lineno'):
                    module_level_lines.extend(range(node.lineno, node.end_lineno + 1))
        
        if module_level_lines:
            start_line = min(module_level_lines)
            end_line = max(module_level_lines)
            module_source = self._extract_source(source_lines, start_line, end_line)
            chunks.append(CodeChunk(
                chunk_id=f"{repository_id}:{file_path}:module:{start_line}",
                repository_id=repository_id,
                file_path=file_path,
                language="python",
                symbol_name="module",
                symbol_type="module",
                start_line=start_line,
                end_line=end_line,
                source_code=module_source
            ))
            
        return chunks
