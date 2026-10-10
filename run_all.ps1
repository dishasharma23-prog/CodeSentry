
$backend = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "backend" -PassThru -RedirectStandardOutput backend.log -RedirectStandardError backend_err.log -WindowStyle Hidden
$frontend = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "frontend" -PassThru -RedirectStandardOutput frontend.log -RedirectStandardError frontend_err.log -WindowStyle Hidden
$rag = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd rag-service && .\venv\Scripts\activate && uvicorn app.main:app --port 8000" -PassThru -RedirectStandardOutput rag.log -RedirectStandardError rag_err.log -WindowStyle Hidden
Write-Output "$($backend.Id),$($frontend.Id),$($rag.Id)" > pids.txt

