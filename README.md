
# macOS Web Terminal

A beautiful macOS-style terminal in your browser, powered by Flask and xterm.js.

![macOS Web Terminal Screenshot](screenshot.png)

## Features

- 🖥️ macOS-style terminal interface that looks like the real thing
- 🐍 Flask backend for executing real terminal commands
- 📦 xterm.js for accurate terminal emulation
- 🔌 Real-time communication via WebSockets
- 🧩 Fully responsive design for any screen size
- 🔒 Runs in a secure container
- 🚀 Easy to set up and use

## Quick Start

### The Easiest Way (Using the start script)

```bash
# Clone the repository
git clone https://github.com/yourusername/macos-web-terminal.git
cd macos-web-terminal

# Make the start script executable
chmod +x start.sh

# Run the start script (will automatically use Docker if available)
./start.sh
```

### Option 1: Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/macos-web-terminal.git
cd macos-web-terminal

# Using docker-compose (easiest)
docker-compose up

# OR build and run manually
docker build -t macos-web-terminal .
docker run -p 8080:8080 macos-web-terminal
```

### Option 2: Run locally (without Docker)

```bash
# Clone the repository
git clone https://github.com/yashkushwa/term-mac-web-spark
cd macos-web-terminal

# Install the Python dependencies
pip install -r requirements.txt

# Run the app
python app.py
```

Then visit `http://localhost:8080` in your browser.

## How It Works

The application consists of:

1. **Backend**: A Flask server that creates real terminal sessions using Python's pty module
2. **Frontend**: A React application with xterm.js that provides the terminal UI
3. **WebSockets**: For real-time communication between the frontend and backend

When you type in the terminal, your keystrokes are sent to the Flask backend, which forwards them to a real terminal session. The output is then sent back to the browser and displayed in the terminal UI.

## Development

### Frontend

The frontend is built with React, TypeScript, and Tailwind CSS:

```bash
# Install dependencies
npm install

# Run development server (if you're working on the frontend only)
npm run dev

# Build for production
npm run build
```

### Backend

The backend is a Flask application with WebSockets support:

```bash
# Install development dependencies
pip install -r requirements.txt

# Run with debug mode
FLASK_ENV=development python app.py
```

## Security Considerations

This application provides access to a real terminal in your browser. When deployed in production:

- Consider adding authentication
- Restrict commands that can be executed
- Run in a container with limited permissions

## License

MIT
