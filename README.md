# CodeSentry

**CodeSentry** is an advanced, AI-powered security auditing and RAG (Retrieval-Augmented Generation) application designed for deep codebase analysis. It automatically ingests, chunks, embeds, and analyzes GitHub repositories to surface critical security vulnerabilities while allowing developers to semantically query and interact with their codebase.

CodeSentry was built with an experimental, cinematic, and minimal dark UI to emphasize data clarity, deep technical focus, and premium typography.

---

## Architecture

CodeSentry operates on a microservice architecture built for production scale:

1.  **Frontend (Next.js 16)**
    *   React, Tailwind CSS, Framer Motion
    *   Interactive Source Viewer, Citation Highlighting, and AST-aware Chat
    *   Premium Dark/Cinematic UI
2.  **Backend (Node.js + Express + TypeScript)**
    *   Orchestrates GitHub cloning and repository lifecycle management
    *   MongoDB Atlas integration for metadata, query history, and security findings
    *   Provides RESTful bridging to the RAG Service
3.  **RAG Service (Python + FastAPI)**
    *   **Parsing:** Advanced Python AST parsing and generic regex parsing for multiple languages
    *   **Retrieval:** Hybrid pipeline using ChromaDB (Dense/Embeddings) and BM25L (Sparse/Keyword)
    *   **Reranking:** Cross-Encoder reranking (MS MARCO) for extreme retrieval accuracy
    *   **LLM Engine:** Gemini 2.0 Flash integration for synthesis, RAG answers, and security analysis
    *   **Strict Isolation:** Multi-tenant cryptographic isolation ensuring repositories never leak context
4.  **Database & Storage**
    *   **MongoDB Atlas:** Document store
    *   **ChromaDB:** Vector storage (persistent volumes)
    *   **Local File System:** BM25 `.pkl` indexes and cloned repository source code (persistent volumes)

---

## Quick Start (Production via Docker)

CodeSentry includes a complete, production-ready `docker-compose.yml` for isolated deployment.

### 1. Prerequisites
*   Docker & Docker Compose
*   A MongoDB Atlas cluster (or any MongoDB instance)
*   A Gemini API Key (or OpenAI API Key)

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# ==========================================
# Frontend Configuration
# ==========================================
# IMPORTANT: This must be the PUBLIC URL where your backend is accessible to the browser.
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# ==========================================
# Backend Configuration
# ==========================================
# Production MongoDB Atlas String (DO NOT USE in-memory local instances for prod)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/codesentry
PORT=3001

# ==========================================
# RAG Service Configuration
# ==========================================
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.0-flash

# (Optional) Map ports if overriding the defaults
FRONTEND_PORT=3000
BACKEND_PORT=3001
RAG_SERVICE_PORT=8000
```

> **Warning:** The `NEXT_PUBLIC_API_URL` is baked into the Next.js frontend during the Docker build process. If you change this value, you **must rebuild** the frontend container (`docker compose build frontend`).

### 3. Deploy
Build and start the services in detached mode:

```bash
docker compose up --build -d
```

**Services will be available at:**
*   Frontend: `http://localhost:3000`
*   Backend API: `http://localhost:3001`
*   RAG Service (Internal): `http://localhost:8000`

---

## Local Development Setup

To run CodeSentry locally without Docker:

### 1. Start the RAG Service
```bash
cd rag-service
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Key Features

*   **Hybrid Retrieval (Dense + Sparse):** Combines contextual understanding of embeddings with the exact-keyword matching of BM25, fused via Reciprocal Rank Fusion (RRF).
*   **Security Auditor:** The security analyzer scans AST-extracted functions/classes against known vulnerability vectors (Auth, Input Validation, Access Control) and returns highlighted, actionable mitigation plans.
*   **Strict RAG Isolation:** Enforces multi-tenant boundaries at the database (Chroma metadata constraints) and application logic levels, guaranteeing zero cross-repository data contamination.
*   **Interactive Source Viewer:** View source code directly from the UI with perfectly synchronized line highlighting driven by citation references from the RAG pipeline.

## License

MIT License.
