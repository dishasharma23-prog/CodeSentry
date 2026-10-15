"""Score CodeSentry's answers with Future AGI evals.

Asks the running RAG service each question in a questions file, then grades every
answer three ways:

  code_groundedness    LLM judge: is every claim about the code backed by the
                       snippets CodeSentry retrieved? (catches invented vulnerabilities)
  retrieval_relevance  LLM judge: did retrieval find the code needed to answer?
  citations_valid      no LLM: does the answer cite at least one [SOURCE: ...], and is
                       every cited file one that was actually retrieved?

Why custom judge prompts: in ai-evaluation 1.1.0 the offline groundedness metric
scores code-related answers 0.0 regardless of correctness, and the built-in metric
names can't run on the LLM engine without a prompt. A judge reply that can't be
parsed is reported as an error here, not as a 0 score (the SDK reports it as 0.0).

Usage (RAG service running, repository already indexed in CodeSentry):
    export GEMINI_API_KEY=...            # used by the judge
    python evals/run_rag_evals.py --repo-id <id> \
        --questions evals/questions.example.json --out eval_results.json

The repository id is the one in CodeSentry's URL: /repositories/<id>.
"""
import argparse
import json
import re
import statistics
import sys
import time

import httpx

# Same pattern the pipeline uses to parse citations (app/rag/pipeline.py).
CITATION_RE = re.compile(r"\[SOURCE:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*lines\s*(\d+)-(\d+)\]")

# The SDK sends the inputs as a JSON object with "input", "context" and "output"
# keys, so the criteria refer to those keys rather than to {placeholders}.
GROUNDEDNESS_CRITERIA = """You are reviewing an answer from a code-auditing assistant.
"input" is the developer's question, "context" is the source code the assistant
retrieved, and "output" is the assistant's answer.

Score how well every factual claim in "output" about the code (what functions do,
how data flows, which vulnerabilities exist, file names, line numbers) is directly
supported by "context".
- 1.0: every claim is supported by the code shown.
- 0.5: the main point is supported but some details are not.
- 0.0: the central claim (e.g. a vulnerability) is not supported or contradicts the code.
General security advice that makes no claim about this code does not lower the score.
Saying the context lacks the information needed is fully grounded."""

RELEVANCE_CRITERIA = """You are reviewing the retrieval step of a code-auditing assistant.
"input" is the developer's question and "context" is the code retrieved to answer it.
Ignore "output".

Score whether "context" contains the code needed to answer "input".
- 1.0: the code that answers the question is present.
- 0.5: related code is present but something essential is missing.
- 0.0: the retrieved code is unrelated to the question."""


def ask(api: str, repo_id: str, question: str, timeout: float) -> dict:
    r = httpx.post(f"{api}/query", json={"query": question, "repository_id": repo_id},
                   timeout=timeout)
    r.raise_for_status()
    return r.json()


def build_context(sources: list) -> str:
    return "\n\n".join(
        f"--- {s['file_path']} | {s['symbol_type']}: {s['symbol_name']} | "
        f"lines {s['start_line']}-{s['end_line']} ---\n{s['source_code']}"
        for s in sources
    )


def judge(criteria: str, model: str, question: str, context: str, answer: str) -> dict:
    """Run one LLM-judge eval; a judge failure becomes an error, never a fake 0."""
    from fi.evals import evaluate  # pip install -r evals/requirements.txt

    try:
        r = evaluate(prompt=criteria, engine="llm", model=model,
                     input=question, context=context, output=answer)
    except Exception as e:  # network, auth, quota...
        return {"score": None, "error": f"{type(e).__name__}: {e}"}
    reason = str(r.reason or "")
    # ai-evaluation 1.1.0 reports some failures as status="completed", score=0.0, with
    # the problem only in the reason text: an unparseable judge reply, or a provider
    # error such as a 429 quota or 503. Those are errors, not verdicts.
    if (r.status != "completed" or r.error
            or reason.startswith(("Failed to parse", "LLM provider failed"))):
        return {"score": None, "error": r.error or reason[:200]}
    return {"score": r.score, "reason": _reason_text(reason)}


def _reason_text(raw: str) -> str:
    try:
        return json.loads(raw).get("reason", raw)
    except (ValueError, AttributeError):
        return raw


def check_citations(answer: str, sources: list) -> dict:
    """Every cited file must be one that was retrieved.

    An answer with no citations is "n/a", not a failure: a correct "this code does not
    do that" answer has nothing to cite. Whether such an answer is right is what
    code_groundedness judges.
    """
    cited = [m.group(1) for m in CITATION_RE.finditer(answer)]
    if not cited:
        return {"score": None, "na": True, "reason": "no citations in the answer (n/a)"}
    retrieved = {s["file_path"] for s in sources}
    unknown = sorted({f for f in cited if f not in retrieved})
    return {
        "score": 0.0 if unknown else 1.0,
        "reason": (f"cites files that were not retrieved: {unknown}" if unknown
                   else f"{len(cited)} citation(s), all retrieved"),
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--repo-id", required=True, help="CodeSentry repository id")
    p.add_argument("--questions", default="evals/questions.example.json")
    p.add_argument("--api", default="http://localhost:8000", help="RAG service URL")
    p.add_argument("--judge-model", default="gemini/gemini-2.5-flash",
                   help="LiteLLM model string for the judge (needs that provider's API key)")
    p.add_argument("--limit", type=int, default=None,
                   help="only run the first N questions (each costs 1 answer + 2 judge calls, "
                        "which matters on free-tier daily quotas)")
    p.add_argument("--timeout", type=float, default=120.0)
    p.add_argument("--out", default="eval_results.json")
    args = p.parse_args()

    with open(args.questions) as f:
        questions = json.load(f)[: args.limit]

    rows = []
    for i, item in enumerate(questions, 1):
        q = item["question"] if isinstance(item, dict) else item
        print(f"[{i}/{len(questions)}] {q}")
        start = time.time()
        try:
            resp = ask(args.api, args.repo_id, q, args.timeout)
        except Exception as e:
            print(f"    query failed: {e}")
            rows.append({"question": q, "error": str(e)})
            continue
        latency = time.time() - start
        answer, sources = resp["answer"], resp.get("sources", [])
        context = build_context(sources)
        row = {
            "question": q,
            "answer": answer,
            "retrieved_files": sorted({s["file_path"] for s in sources}),
            "latency_s": round(latency, 2),
            "code_groundedness": judge(GROUNDEDNESS_CRITERIA, args.judge_model, q, context, answer),
            "retrieval_relevance": judge(RELEVANCE_CRITERIA, args.judge_model, q, context, answer),
            "citations_valid": check_citations(answer, sources),
        }
        rows.append(row)
        for m in ("code_groundedness", "retrieval_relevance", "citations_valid"):
            r = row[m]
            shown = ("n/a" if r.get("na") else "ERROR" if r["score"] is None
                     else f"{r['score']:.2f}")
            print(f"    {m:20} {shown:>5}  {r.get('reason') or r.get('error', '')}"[:160])

    print("\nSummary (errors and n/a excluded from averages)")
    for m in ("code_groundedness", "retrieval_relevance", "citations_valid"):
        scored = [r[m] for r in rows if m in r]
        scores = [s["score"] for s in scored if s["score"] is not None]
        na = sum(1 for s in scored if s.get("na"))
        errors = sum(1 for s in scored if s["score"] is None and not s.get("na"))
        avg = f"{statistics.mean(scores):.2f}" if scores else "n/a"
        print(f"  {m:20} avg {avg}  over {len(scores)} answers, {errors} errors, {na} n/a")
    failed = sum(1 for r in rows if "error" in r)
    if failed:
        print(f"  {failed} question(s) got no answer from CodeSentry "
              "(a 500 here is often the LLM provider's quota or rate limit)")
    lat = [r["latency_s"] for r in rows if "latency_s" in r]
    if lat:
        print(f"  {'latency':20} median {statistics.median(lat):.1f}s")

    with open(args.out, "w") as f:
        json.dump({"judge_model": args.judge_model, "repo_id": args.repo_id, "results": rows},
                  f, indent=2)
    print(f"\nwrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
