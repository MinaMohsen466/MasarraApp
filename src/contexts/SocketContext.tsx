import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api.config';

// React Native WebSocket polyfill for socket.io-client
// @ts-ignore
global.WebSocket = global.WebSocket || require('react-native').WebSocket;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendTyping: (chatId: string, isTyping: boolean) => void;
  markAsRead: (chatId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const initSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
          return;
        }

        // Use the API base URL for socket connection
        const serverUrl = API_BASE_URL.replace('/api', '');


        const newSocket = io(serverUrl, {
          auth: {
            token,
          },
          transports: ['polling', 'websocket'], // polling first for React Native
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          timeout: 20000,
          forceNew: true,
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          setIsConnected(false);
        });

        newSocket.on('reconnect_failed', () => {
        });

        newSocket.on('error', (error) => {
        });

        setSocket(newSocket);
      } catch (error) {
      }
    };

    initSocket();

    // Cleanup on unmount or when user changes
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user to avoid reconnecting on every socket change

  // Join a chat room
  const joinChat = useCallback(
    (chatId: string) => {
      if (socket && isConnected) {
        socket.emit('join_chat', chatId);
      }
    },
    [socket, isConnected]
  );

  // Leave a chat room
  const leaveChat = useCallback(
    (chatId: string) => {
      if (socket && isConnected) {
        socket.emit('leave_chat', chatId);
      }
    },
    [socket, isConnected]
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (chatId: string, isTyping: boolean) => {
      if (socket && isConnected && chatId) {
        socket.emit('typing', { chatId, isTyping });
      }
    },
    [socket, isConnected]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (chatId: string) => {
      if (socket && isConnected) {
        socket.emit('mark_read', { chatId });
      }
    },
    [socket, isConnected]
  );

  const value: SocketContextType = {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendTyping,
    markAsRead,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
