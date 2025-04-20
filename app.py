
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
            break
            
        ready, _, _ = select.select([fd], [], [], 0.1)
        if ready:
            try:
                output = os.read(fd, max_read_bytes).decode('utf-8', errors='replace')
                socketio.emit(f'terminal_output_{terminal_id}', {'output': output})
            except (OSError, IOError) as e:
                socketio.emit(f'terminal_output_{terminal_id}', 
                              {'output': f'\r\nConnection closed: {str(e)}\r\n'})
                break
            except Exception as e:
                socketio.emit(f'terminal_output_{terminal_id}', 
                              {'output': f'\r\nError: {str(e)}\r\n'})
                break

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('create_terminal')
def create_terminal(data):
    """Create a new terminal session."""
    terminal_id = data.get('terminal_id', 'default')
    
    if terminal_id in terminals:
        # Close existing terminal
        close_terminal({'terminal_id': terminal_id})
    
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
    
    return {'success': True, 'terminal_id': terminal_id}

@socketio.on('terminal_input')
def terminal_input(data):
    """Send input to terminal."""
    terminal_id = data.get('terminal_id', 'default')
    input_data = data.get('input', '')
    
    if terminal_id in terminals:
        os.write(terminals[terminal_id]['fd'], input_data.encode())
    else:
        emit('terminal_output_' + terminal_id, {'output': 'Terminal not found. Please create a new terminal.'})

@socketio.on('resize_terminal')
def resize_terminal(data):
    """Resize the terminal."""
    terminal_id = data.get('terminal_id', 'default')
    cols = data.get('cols', 80)
    rows = data.get('rows', 24)
    
    if terminal_id in terminals:
        set_terminal_size(terminals[terminal_id]['fd'], cols, rows)

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
        except (OSError, IOError):
            pass
        
        # Remove from terminals dict
        del terminals[terminal_id]
        return {'success': True}
    
    return {'success': False, 'error': 'Terminal not found'}

def set_terminal_size(fd, cols, rows):
    """Set the terminal size."""
    try:
        # TIOCSWINSZ is the ioctl that sets window size
        # It takes a struct with 4 values: rows, cols, xpixel, ypixel
        size = struct.pack("HHHH", rows, cols, 0, 0)
        fcntl.ioctl(fd, termios.TIOCSWINSZ, size)
    except (IOError, OSError) as e:
        print(f"Error setting terminal size: {e}")

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
    # Ensure the app runs on port 8080
    socketio.run(app, host='0.0.0.0', port=8080, allow_unsafe_werkzeug=True)
