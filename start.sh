
#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Web Terminal...${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for python
if command_exists python3; then
  PYTHON=python3
elif command_exists python; then
  PYTHON=python
else
  echo -e "${RED}Error: Python not found. Please install Python 3.${NC}"
  exit 1
fi

# Check for pip
if command_exists pip3; then
  PIP=pip3
elif command_exists pip; then
  PIP=pip
else
  echo -e "${RED}Error: pip not found. Please install pip.${NC}"
  exit 1
fi

# Check if Docker is available - prefer Docker if available
if command_exists docker; then
  echo -e "${GREEN}Docker found. Starting with Docker...${NC}"
  docker build -t web-terminal .
  docker run -p 8080:8080 web-terminal
  exit 0
fi

# If Docker is not available, run with Python
echo -e "${GREEN}Installing Python dependencies...${NC}"
$PIP install -r requirements.txt

echo -e "${GREEN}Starting Flask server...${NC}"
$PYTHON app.py
