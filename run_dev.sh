#!/bin/bash

# Function to kill all background processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "Starting Backend (FastAPI)..."
source venv/bin/activate
uvicorn api:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting Frontend (Vite)..."
cd dashboard
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Starting n8n..."
./start_n8n.sh &
N8N_PID=$!

echo "All services started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173 (usually)"
echo "n8n: http://localhost:5678"
echo "Press Ctrl+C to stop everything."

# Wait for all processes
wait
