
#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting macOS Web Terminal...${NC}"

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
  
  if command_exists docker-compose; then
    echo -e "${GREEN}Using docker-compose to build and run containers...${NC}"
    docker-compose up --build
  else
    echo -e "${GREEN}Building the Docker image...${NC}"
    docker build -t macos-web-terminal .
    
    echo -e "${GREEN}Running the container...${NC}"
    docker run -p 8080:8080 macos-web-terminal
  fi
  
  exit 0
fi

# If Docker is not available, run with Python
echo -e "${GREEN}Docker not found. Using Python directly...${NC}"
echo -e "${GREEN}Installing Python dependencies...${NC}"
$PIP install -r requirements.txt

echo -e "${GREEN}Starting Flask server...${NC}"
echo -e "${GREEN}Open your browser at http://localhost:8080${NC}"
$PYTHON app.py
