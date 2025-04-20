
import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
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
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      allowProposedApi: true,
      scrollback: 5000,
    });
    
    term.loadAddon(fitAddonRef.current);
    term.open(terminalRef.current);
    fitAddonRef.current.fit();
    setTerminal(term);
    
    return () => {
      term.dispose();
    };
  }, []);
  
  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(`${window.location.protocol}//${window.location.hostname}:${window.location.port}`, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });
    
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (terminal) {
        terminal.write('\r\n\x1b[31mConnection error. Please check if the server is running.\x1b[0m\r\n');
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
