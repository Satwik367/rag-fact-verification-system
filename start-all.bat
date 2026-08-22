@echo off
echo Starting RAG Fact Verification System (ChromaDB + Backend + Frontend)...

start "ChromaDB" cmd /k ""%APPDATA%\Python\Python313\Scripts\chroma.exe" run --path ./chroma-data --port 8000"

timeout /t 3 /nobreak >nul

start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

start "Frontend" cmd /k "cd frontend && npm run dev"

echo All three services are starting in separate windows.
echo Once ready, open http://localhost:5173 in your browser.
pause