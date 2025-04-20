
import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { io, Socket } from 'socket.io-client';
import 'xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
}

const Terminal: React.FC<TerminalProps> = ({ className = "" }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<XTerm | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [terminalId] = useState(`term-${Date.now()}`);
  const fitAddonRef = useRef<FitAddon>(new FitAddon());
  const [isConnected, setIsConnected] = useState(false);
  const [isTerminalCreated, setIsTerminalCreated] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;
    
    // Import xterm CSS
    import('xterm/css/xterm.css');
    
    // Initialize xterm.js
    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#f8f8f8',
        cursor: '#aeafad',
        cursorAccent: '#1e1e1e',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      allowProposedApi: true,
      scrollback: 5000,
      smoothScrollDuration: 300,
    });
    
    term.loadAddon(fitAddonRef.current);
    
    // Add web links addon for clickable links
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(webLinksAddon);
    
    term.open(terminalRef.current);
    fitAddonRef.current.fit();
    setTerminal(term);
    
    term.writeln('\x1b[1;32m╭────────────────────────────────────────────╮\x1b[0m');
    term.writeln('\x1b[1;32m│       macOS Web Terminal v1.0.0             │\x1b[0m');
    term.writeln('\x1b[1;32m│       Connecting to server...               │\x1b[0m');
    term.writeln('\x1b[1;32m╰────────────────────────────────────────────╯\x1b[0m');
    
    return () => {
      term.dispose();
    };
  }, []);
  
  // Initialize socket connection
  useEffect(() => {
    if (!terminal) return;
    
    console.log("Attempting to connect to WebSocket server...");
    
    const socketInstance = io(`${window.location.protocol}//${window.location.hostname}:${window.location.port}`, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
      terminal.clear();
      terminal.writeln('\x1b[1;32m╭────────────────────────────────────────────╮\x1b[0m');
      terminal.writeln('\x1b[1;32m│       macOS Web Terminal v1.0.0             │\x1b[0m');
      terminal.writeln('\x1b[1;32m│       Connected to server!                  │\x1b[0m');
      terminal.writeln('\x1b[1;32m╰────────────────────────────────────────────╯\x1b[0m');
      terminal.writeln('');
    });
    
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setIsTerminalCreated(false);
      console.log('Socket disconnected');
      terminal.writeln('\r\n\x1b[31mDisconnected from server. Trying to reconnect...\x1b[0m\r\n');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsError(true);
      setErrorMessage(error.message);
      
      if (terminal) {
        terminal.writeln('\r\n\x1b[31mConnection error. Please check if the server is running.\x1b[0m');
        terminal.writeln('\x1b[31mError: ' + error.message + '\x1b[0m\r\n');
        terminal.writeln('\x1b[33mMake sure the Flask server is running with:\x1b[0m');
        terminal.writeln('\x1b[36m  python app.py\x1b[0m');
        terminal.writeln('\x1b[33mOr using Docker:\x1b[0m');
        terminal.writeln('\x1b[36m  docker-compose up\x1b[0m\r\n');
      }
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, [terminal]);
  
  // Setup terminal session
  useEffect(() => {
    if (!socket || !terminal || !isConnected) return;
    
    // Create a new terminal session
    const createTerminalSession = () => {
      socket.emit('create_terminal', { 
        terminal_id: terminalId,
        cols: terminal.cols,
        rows: terminal.rows
      }, (response: { success: boolean }) => {
        if (response && response.success) {
          setIsTerminalCreated(true);
          console.log('Terminal session created');
        } else {
          terminal.writeln('\r\n\x1b[31mFailed to create terminal session.\x1b[0m\r\n');
        }
      });
    };
    
    createTerminalSession();
    
    // Handle terminal output
    const handleTerminalOutput = (data: { output: string }) => {
      if (terminal && data.output) {
        terminal.write(data.output);
      }
    };
    
    socket.on(`terminal_output_${terminalId}`, handleTerminalOutput);
    
    return () => {
      socket.off(`terminal_output_${terminalId}`, handleTerminalOutput);
      socket.emit('close_terminal', { terminal_id: terminalId });
    };
  }, [socket, terminal, terminalId, isConnected]);
  
  // Handle user input and terminal resize
  useEffect(() => {
    if (!socket || !terminal || !isConnected || !isTerminalCreated) return;
    
    // Handle user input
    const handleUserInput = (data: string) => {
      socket.emit('terminal_input', { 
        terminal_id: terminalId,
        input: data
      });
    };
    
    // Handle terminal resize
    const handleTerminalResize = (size: { cols: number; rows: number }) => {
      socket.emit('resize_terminal', { 
        terminal_id: terminalId,
        cols: size.cols,
        rows: size.rows
      });
    };
    
    const dataListener = terminal.onData(handleUserInput);
    const resizeListener = terminal.onResize(handleTerminalResize);
    
    // Handle window resize
    const handleWindowResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    // Initial fit
    setTimeout(handleWindowResize, 100);
    
    return () => {
      dataListener.dispose();
      resizeListener.dispose();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [socket, terminal, terminalId, isConnected, isTerminalCreated]);
  
  return (
    <div 
      ref={terminalRef} 
      className={`h-full w-full terminal-container ${className}`} 
      data-testid="terminal-container"
    />
  );
};

export default Terminal;
