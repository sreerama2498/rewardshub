#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Kill any existing stale process on port 8001
fuser -k 8001/tcp 2>/dev/null || true

echo "Starting backend watchdog..."
nohup bash -c '
  cd "'"$DIR"'"
  while true; do
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting FastAPI backend on port 8001..." >> backend.log
    set -a && source .env && set +a
    PYTHONPATH=backend python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 >> backend.log 2>&1 || true
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] FastAPI backend stopped. Restarting in 2s..." >> backend.log
    sleep 2
  done
' > /dev/null 2>&1 &

# Wait up to 10 seconds for backend to become healthy
for i in {1..20}; do
  if curl -sf http://localhost:8001/ > /dev/null 2>&1; then
    echo "Backend is healthy on http://localhost:8001"
    break
  fi
  sleep 0.5
done

# Ensure Vite is running
if ! curl -sf http://localhost:5173/ > /dev/null 2>&1; then
  echo "Starting frontend dev server..."
  cd "$DIR/frontend"
  nohup npm run dev -- --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &
  cd "$DIR"
fi

echo "Services started successfully."
