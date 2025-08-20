#!/bin/bash

echo "Starting AI Chat Backend..."

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "Error: Python is not installed or not in PATH"
    exit 1
fi

# Check if pip is available
if command -v pip3 &> /dev/null; then
    PIP_CMD=pip3
elif command -v pip &> /dev/null; then
    PIP_CMD=pip
else
    echo "Error: pip is not installed or not in PATH"
    exit 1
fi

echo "Installing Python dependencies..."
$PIP_CMD install -r requirements.txt

echo "Starting Flask server..."
$PYTHON_CMD app.py
