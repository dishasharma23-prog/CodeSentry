
$ErrorActionPreference = "Stop"
Write-Host "Starting Frontend..."
Start-Process "cmd.exe" -ArgumentList "/c cd frontend && npm run dev" -WindowStyle Hidden
Write-Host "Starting Backend..."
Start-Process "cmd.exe" -ArgumentList "/c cd backend && npm run dev" -WindowStyle Hidden
Write-Host "Starting RAG Service..."
Start-Process "cmd.exe" -ArgumentList "/c cd rag-service && .\venv\Scripts\activate && uvicorn app.main:app --port 8000 --reload" -WindowStyle Hidden
Write-Host "All services started."

