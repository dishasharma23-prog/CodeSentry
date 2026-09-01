from abc import ABC, abstractmethod
from typing import List
from app.models.chunk import CodeChunk

class BaseASTParser(ABC):
    
    @abstractmethod
    def can_parse(self, file_path: str) -> bool:
        pass
        
    @abstractmethod
    def parse(self, file_path: str, source_code: str, repository_id: str) -> List[CodeChunk]:
        pass
        
    @abstractmethod
    def supported_extensions(self) -> List[str]:
        pass
