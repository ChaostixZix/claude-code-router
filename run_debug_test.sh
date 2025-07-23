#!/bin/bash

# Define the path to the debug log file
DEBUG_LOG_FILE="$HOME/.claude-code-router/claude-router-debug.log"

# Define the project directory based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PROJECT_DIR="$HOME/Desktop/claude-code-router"
else
    # Linux/Ubuntu
    PROJECT_DIR="/home/bintangputra/claude-code-router"
fi

# Clear previous debug logs
> "$DEBUG_LOG_FILE"

echo "--- Starting Claude Code Router and logging debug output ---"
# Start the service and wait a bit
cd "$PROJECT_DIR" && node dist/cli.js code &
PID=$!
sleep 5 # Give it time to start and write logs

echo "--- Debug logs from first run ---"
cat "$DEBUG_LOG_FILE"
echo "--- End of first run debug logs ---"

# Stop the service
kill "$PID"
sleep 2 # Give it time to shut down

echo "--- Service stopped. Now modify config.json manually and re-run this script ---"