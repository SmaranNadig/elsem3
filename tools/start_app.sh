#!/bin/bash

# Function to print colored output
print_status() {
    echo -e "\033[1;34m>>> $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m!!! $1\033[0m"
}

# 1. Setup Backend
print_status "Setting up Backend..."

# Check for python3.11 explicitly first
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    print_error "Python 3 is not installed."
    exit 1
fi

print_status "Using Python: $PYTHON_CMD"

# Create virtual environment if it doesn't exist
# We remove existing venv to ensure clean state if it was created with wrong python
if [ -d "venv" ]; then
    print_status "Removing existing virtual environment..."
    rm -rf venv
fi

print_status "Creating virtual environment..."
$PYTHON_CMD -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
print_status "Installing backend dependencies..."
pip install -r requirements-api.txt
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies."
    exit 1
fi

# 2. Setup Frontend
print_status "Setting up Frontend..."

cd dashboard || exit 1

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies."
    exit 1
fi

cd ..

# 3. Instructions
echo ""
echo -e "\033[1;32m=== Setup Complete! ===\033[0m"
echo ""
echo "To run the application:"
echo ""
echo "1. Start the Backend (in one terminal):"
echo "   source venv/bin/activate"
echo "   uvicorn server.api:app --reload --port 8000"
echo ""
echo "2. Start the Frontend (in another terminal):"
echo "   cd dashboard"
echo "   npm run dev"
echo ""
echo "3. Start n8n (optional, for workflows):"
echo "   ./start_n8n.sh"
echo ""
echo "Don't forget to copy .env.example to .env and add your API keys!"
