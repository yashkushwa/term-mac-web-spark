
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import subprocess
import os
import pty
import select
import termios
import struct
import fcntl
import signal
import threading
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("terminal-app")

# Create Flask app
app = Flask(__name__, static_folder='dist')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Store terminal sessions
terminals = {}

def read_terminal_output(fd, terminal_id):
    """Read output from terminal and emit to client."""
    max_read_bytes = 1024 * 20
    while True:
        if terminal_id not in terminals:
            logger.info(f"Terminal {terminal_id} closed, stopping reader thread")
            break
            
        ready, _, _ = select.select([fd], [], [], 0.1)
        if ready:
            try:
                output = os.read(fd, max_read_bytes).decode('utf-8', errors='replace')
                socketio.emit(f'terminal_output_{terminal_id}', {'output': output})
            except (OSError, IOError) as e:
                logger.error(f"Error reading from terminal {terminal_id}: {str(e)}")
                socketio.emit(f'terminal_output_{terminal_id}', 
                              {'output': f'\r\nConnection closed: {str(e)}\r\n'})
                break
            except Exception as e:
                logger.error(f"Unexpected error in terminal {terminal_id}: {str(e)}")
                socketio.emit(f'terminal_output_{terminal_id}', 
                              {'output': f'\r\nError: {str(e)}\r\n'})
                break

@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")
    emit('connect_response', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('create_terminal')
def create_terminal(data):
    """Create a new terminal session."""
    terminal_id = data.get('terminal_id', 'default')
    logger.info(f"Creating terminal session {terminal_id}")
    
    if terminal_id in terminals:
        # Close existing terminal
        logger.info(f"Terminal {terminal_id} already exists, closing it")
        close_terminal({'terminal_id': terminal_id})
    
    try:
        # Create new pseudoterminal
        primary, secondary = pty.openpty()
        
        # Set terminal size if provided
        if 'cols' in data and 'rows' in data:
            cols = data.get('cols', 80)
            rows = data.get('rows', 24)
            set_terminal_size(primary, cols, rows)
        
        # Start shell in the pty
        shell = os.environ.get('SHELL', '/bin/bash')
        process = subprocess.Popen(
            shell,
            stdin=secondary,
            stdout=secondary,
            stderr=secondary,
            shell=False,
            preexec_fn=os.setsid,
            env=os.environ.copy()
        )
        
        terminals[terminal_id] = {
            'fd': primary,
            'pid': process.pid,
            'process': process
        }
        
        # Start thread to read output
        thread = threading.Thread(
            target=read_terminal_output,
            args=(primary, terminal_id)
        )
        thread.daemon = True
        thread.start()
        
        logger.info(f"Terminal {terminal_id} created successfully")
        return {'success': True, 'terminal_id': terminal_id}
    except Exception as e:
        logger.error(f"Failed to create terminal {terminal_id}: {str(e)}")
        return {'success': False, 'error': str(e)}

@socketio.on('terminal_input')
def terminal_input(data):
    """Send input to terminal."""
    terminal_id = data.get('terminal_id', 'default')
    input_data = data.get('input', '')
    
    if terminal_id in terminals:
        try:
            os.write(terminals[terminal_id]['fd'], input_data.encode())
        except Exception as e:
            logger.error(f"Error writing to terminal {terminal_id}: {str(e)}")
            emit('terminal_output_' + terminal_id, {'output': f'\r\nError: {str(e)}\r\n'})
    else:
        logger.warning(f"Terminal {terminal_id} not found for input")
        emit('terminal_output_' + terminal_id, {'output': 'Terminal not found. Please create a new terminal.'})

@socketio.on('resize_terminal')
def resize_terminal(data):
    """Resize the terminal."""
    terminal_id = data.get('terminal_id', 'default')
    cols = data.get('cols', 80)
    rows = data.get('rows', 24)
    
    if terminal_id in terminals:
        try:
            set_terminal_size(terminals[terminal_id]['fd'], cols, rows)
            logger.info(f"Resized terminal {terminal_id} to {cols}x{rows}")
        except Exception as e:
            logger.error(f"Error resizing terminal {terminal_id}: {str(e)}")

@socketio.on('close_terminal')
def close_terminal(data):
    """Close the terminal session."""
    terminal_id = data.get('terminal_id', 'default')
    
    if terminal_id in terminals:
        # Clean up resources
        try:
            # Send SIGTERM to process group
            os.killpg(os.getpgid(terminals[terminal_id]['pid']), signal.SIGTERM)
            terminals[terminal_id]['process'].terminate()
            os.close(terminals[terminal_id]['fd'])
            logger.info(f"Terminal {terminal_id} closed successfully")
        except (OSError, IOError) as e:
            logger.warning(f"Error during terminal {terminal_id} cleanup: {str(e)}")
        
        # Remove from terminals dict
        del terminals[terminal_id]
        return {'success': True}
    
    logger.warning(f"Terminal {terminal_id} not found for closing")
    return {'success': False, 'error': 'Terminal not found'}

def set_terminal_size(fd, cols, rows):
    """Set the terminal size."""
    try:
        # TIOCSWINSZ is the ioctl that sets window size
        # It takes a struct with 4 values: rows, cols, xpixel, ypixel
        size = struct.pack("HHHH", rows, cols, 0, 0)
        fcntl.ioctl(fd, termios.TIOCSWINSZ, size)
    except (IOError, OSError) as e:
        logger.error(f"Error setting terminal size: {e}")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    logger.info("Starting Terminal Web App on port 8080")
    print("=" * 50)
    print("macOS Web Terminal starting on http://localhost:8080")
    print("=" * 50)
    
    # Ensure the app runs on port 8080
    socketio.run(app, host='0.0.0.0', port=8080, debug=True, allow_unsafe_werkzeug=True)
