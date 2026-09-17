import pytest
import os
import shutil
from app.ingestion.ingestor import CodeIngestor

def test_ingestion(tmp_path):
    repo_dir = tmp_path / "repo1"
    repo_dir.mkdir()
    
    src_file = repo_dir / "main.py"
    src_file.write_text("def hello():\n    print('world')\n")
    
    git_dir = repo_dir / ".git"
    git_dir.mkdir()
    (git_dir / "config").write_text("ignore me")
    
    ingestor = CodeIngestor()
    chunks, stats = ingestor.ingest(str(repo_dir), "repo1")
    
    assert stats["total_files"] == 1
    assert stats["parsed_files"] == 1
    assert len(chunks) > 0
    assert chunks[0].symbol_name == "hello"
