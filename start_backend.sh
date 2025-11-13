#!/bin/bash
# Quick script to start the backend server for AI features

cd "$(dirname "$0")/backend"

echo "Starting Chamas AI Backend Server..."
echo "======================================"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if dependencies are installed
echo "Checking dependencies..."
python3 -c "import fastapi, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Installing missing dependencies..."
    python3 -m pip install -q fastapi uvicorn prometheus-client slowapi python-multipart web3 cryptography
fi

# Set PYTHONPATH
export PYTHONPATH="$(pwd):$PYTHONPATH"

echo "✓ Dependencies ready"
echo ""
echo "Starting server on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""
echo "Health check: curl http://localhost:8000/health"
echo ""

# Start server
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

