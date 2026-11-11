@echo off
TITLE "DSP KnowledgeHub AI - HR and Process Intelligence Launcher"
echo ========================================================
echo   DSP KnowledgeHub AI (DSPAMC Employee Platform)
echo   Enterprise 3D Experience + RAG Grounded Intelligence
echo ========================================================
echo.

:: Check Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

:: Check Node
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

echo [1/2] Starting FastAPI Knowledge Backend on http://localhost:8000 ...
start "DSP KnowledgeHub - Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --port 8000 --host 0.0.0.0"

echo [2/2] Starting React Three Fiber + Vite Frontend on http://localhost:5173 ...
start "DSP KnowledgeHub - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   DSP KnowledgeHub AI Services are running:
echo   - Employee Portal:   http://localhost:5173
echo   - Interactive 3D:    http://localhost:5173/
echo   - Policy Library:    http://localhost:5173/policies
echo   - Backend Swagger:   http://localhost:8000/api/docs
echo   - Health Endpoint:   http://localhost:8000/api/v1/health
echo ========================================================
echo.
pause
