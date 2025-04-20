
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseTerminalSocketProps {
  terminalId: string;
}

export function useTerminalSocket({ terminalId }: UseTerminalSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(`${window.location.protocol}//${window.location.hostname}:${window.location.port}`);
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });
    
    socketInstance.on('connect_error', (err) => {
      setIsConnected(false);
      setError(`Connection error: ${err.message}`);
    });
    
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendInput = useCallback((input: string) => {
    if (socket && isConnected) {
      socket.emit('terminal_input', {
        terminal_id: terminalId,
        input
      });
    }
  }, [socket, isConnected, terminalId]);

  const resizeTerminal = useCallback((cols: number, rows: number) => {
    if (socket && isConnected) {
      socket.emit('resize_terminal', {
        terminal_id: terminalId,
        cols,
        rows
      });
    }
  }, [socket, isConnected, terminalId]);

  const createTerminal = useCallback((cols: number, rows: number) => {
    if (socket && isConnected) {
      socket.emit('create_terminal', {
        terminal_id: terminalId,
        cols,
        rows
      });
    }
  }, [socket, isConnected, terminalId]);

  const closeTerminal = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('close_terminal', {
        terminal_id: terminalId
      });
    }
  }, [socket, isConnected, terminalId]);

  return {
    socket,
    isConnected,
    error,
    sendInput,
    resizeTerminal,
    createTerminal,
    closeTerminal
  };
}
