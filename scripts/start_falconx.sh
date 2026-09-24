#!/usr/bin/env bash
# ========================================================
# FALCON-X - Linux Edge Appliance Startup Script
# Team: Vision X
# ========================================================

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting FALCON-X Edge Cybersecurity Platform..."
echo "Base Directory: $BASE_DIR"

# Ensure Python dependencies
cd "$BASE_DIR/backend"
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt > /dev/null 2>&1
fi

# Start Backend in background
python3 app.py &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID) on http://127.0.0.1:5000"

# Start Frontend
cd "$BASE_DIR/frontend"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID) on http://localhost:5173"

echo "========================================================"
echo "FALCON-X Edge Dashboard is ready for demonstration!"
echo "Press Ctrl+C to stop all services."
echo "========================================================"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
