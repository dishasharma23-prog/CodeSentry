"""Retrieval evaluation: precision@k, recall@k and MRR on a hand-labelled question set.

Indexes this repository with the same ingestor and retrievers the service uses, asks each question in
retrieval_questions.json, and checks whether the labelled files come back. Results are measured per file:
the ranked chunks are collapsed to the distinct files they come from.

    python evals/retrieval_eval.py                    # keyword (BM25) only, no model download
    python evals/retrieval_eval.py --all              # BM25, dense, hybrid, hybrid + rerank
"""
import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SERVICE = HERE.parent
REPO = SERVICE.parent
sys.path.insert(0, str(SERVICE))

# keep the evaluation's indexes out of the service's data folders
_tmp = tempfile.mkdtemp(prefix="retrieval-eval-")
os.environ["BM25_PERSIST_DIR"] = os.path.join(_tmp, "bm25")
os.environ["CHROMA_PERSIST_DIR"] = os.path.join(_tmp, "chroma")

from app.ingestion.ingestor import CodeIngestor  # noqa: E402
from app.retrieval.bm25_retriever import BM25Retriever  # noqa: E402

REPO_ID = "eval"
CANDIDATES = 20   # chunks retrieved before reranking, same as TOP_K_RETRIEVAL
KS = (1, 3, 5)


def ranked_files(results):
    """Distinct files in the order their first chunk was ranked."""
    files = []
    for r in results:
        if r.chunk.file_path not in files:
            files.append(r.chunk.file_path)
    return files


def score(files, relevant, k):
    top = files[:k]
    hits = sum(1 for f in top if f in relevant)
    return hits / k, hits / len(relevant)


def evaluate(search, questions):
    totals = {f"precision@{k}": 0.0 for k in KS} | {f"recall@{k}": 0.0 for k in KS} | {"mrr": 0.0}
    misses = []
    for q in questions:
        relevant = set(q["relevant"])
        files = ranked_files(search(q["question"]))
        for k in KS:
            p, r = score(files, relevant, k)
            totals[f"precision@{k}"] += p
            totals[f"recall@{k}"] += r
        rank = next((i + 1 for i, f in enumerate(files) if f in relevant), None)
        totals["mrr"] += 1 / rank if rank else 0.0
        if not rank or rank > 5:
            misses.append({"question": q["question"], "expected": sorted(relevant), "got": files[:5]})
    n = len(questions)
    return {name: round(value / n, 3) for name, value in totals.items()}, misses


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="also run dense, hybrid and reranked retrieval")
    parser.add_argument("--out", default=str(HERE / "results" / "retrieval.json"))
    args = parser.parse_args()

    questions = json.loads((HERE / "retrieval_questions.json").read_text())
    ingestor = CodeIngestor()
    ingestor.ignored_dirs |= {"evals"}   # the question file must not be part of what is searched
    chunks, stats = ingestor.ingest(str(REPO), REPO_ID)
    print(f"indexed {stats['parsed_files']} files, {len(chunks)} chunks; {len(questions)} labelled questions")

    bm25 = BM25Retriever()
    bm25.index(chunks, REPO_ID)
    methods = {"bm25": lambda q: bm25.search(q, REPO_ID, CANDIDATES)}

    if args.all:
        from app.embeddings.embedder import CodeEmbedder
        from app.reranking.reranker import CrossEncoderReranker
        from app.retrieval.dense_retriever import DenseRetriever
        from app.retrieval.hybrid_retriever import HybridRetriever

        embedder, dense = CodeEmbedder(), DenseRetriever()
        dense.index(chunks, embedder.embed_chunks(chunks), REPO_ID)
        hybrid, reranker = HybridRetriever(), CrossEncoderReranker()
        methods["dense"] = lambda q: dense.search(embedder.embed_query(q), REPO_ID, CANDIDATES)
        methods["hybrid"] = lambda q: hybrid.search(q, REPO_ID, CANDIDATES)
        methods["hybrid + rerank"] = lambda q: reranker.rerank(q, hybrid.search(q, REPO_ID, CANDIDATES), CANDIDATES)

    report, all_misses = {}, {}
    print(f"\n{'method':<16}" + "".join(f"{m:>13}" for m in ["P@1", "P@3", "P@5", "R@1", "R@3", "R@5", "MRR"]))
    for name, search in methods.items():
        metrics, misses = evaluate(search, questions)
        report[name], all_misses[name] = metrics, misses
        cols = [metrics[f"precision@{k}"] for k in KS] + [metrics[f"recall@{k}"] for k in KS] + [metrics["mrr"]]
        print(f"{name:<16}" + "".join(f"{c:>13.3f}" for c in cols))

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"questions": len(questions), "chunks": len(chunks), "metrics": report,
                               "missed_in_top5": all_misses}, indent=2))
    print(f"\nsaved {out}")


if __name__ == "__main__":
    main()
