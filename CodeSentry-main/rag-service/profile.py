import time
import requests

def test_query():
    try:
        repo_id = requests.get("http://localhost:3001/api/repositories").json()["data"][0]["_id"]
        print(f"Testing Repo ID: {repo_id}")
        
        start = time.time()
        res = requests.post("http://localhost:8000/query", json={"query": "Where is the Flask application initialized?", "repository_id": repo_id})
        print(f"Query Time: {time.time() - start:.2f}s")
        
        start = time.time()
        res = requests.post("http://localhost:8000/security-analysis", json={"repository_id": repo_id})
        print(f"Sec Analysis Time: {time.time() - start:.2f}s")
    except Exception as e:
        print(e)

test_query()
