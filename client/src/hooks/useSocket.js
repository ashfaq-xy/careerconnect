// src/hooks/useSocket.js
// PRD v2 §6 — Socket.IO client
// §6.1 — JWT via auth handshake
// §6.2 — user joins private room by userId (handled server-side on connect)
// §6.4 — client sends join-room only; typing event removed from PRD v2

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getAccessToken } from '../api/axios';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

const useSocket = () => {
  const { isAuthenticated } = useAuth();
  const socketRef           = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    if (socketRef.current?.connected) return;

    const token = getAccessToken();
    if (!token) return;

    // PRD v2 §6.1 — JWT via auth handshake
    const newSocket = io(SOCKET_URL, {
      auth:               { token },
      transports:         ['websocket', 'polling'],
      reconnection:       true,
      reconnectionAttempts: 5,
      reconnectionDelay:  1000,
    });

    newSocket.on('connect',       () => console.log('[Socket] Connected:', newSocket.id));
    newSocket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));
    newSocket.on('disconnect',    (reason) => console.log('[Socket] Disconnected:', reason));

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return socket;
};

export { useSocket };
export default useSocket;
