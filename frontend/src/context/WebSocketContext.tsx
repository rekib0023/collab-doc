import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import WebSocketService from "@/services/WebSocketService";
import { AppDispatch, RootState } from "@/store";
import { useToast } from "@/hooks/useToast";

interface WebSocketContextType {
  websocket: WebSocketService | null;
  connectionStatus: "connected" | "connecting" | "disconnected" | "error";
  connect: (documentId: string) => void;
  disconnect: () => void;
  sendOperation: (operation: any) => void;
  sendCursorUpdate: (position: { x: number; y: number }) => void;
  sendChatMessage: (content: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [websocketService, setWebsocketService] = useState<WebSocketService | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const connectionStatus = useSelector((state: RootState) => state.collaboration.connectionStatus);
  const { error: showError } = useToast();

  // Cleanup function for websocket service
  const cleanupWebsocket = () => {
    if (websocketService) {
      websocketService.disconnect();
      setWebsocketService(null);
    }
  };

  // Handle authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      cleanupWebsocket();
    }
    return () => {
      cleanupWebsocket();
    };
  }, [isAuthenticated]);

  // Connect to WebSocket
  const connect = (documentId: string) => {
    if (!isAuthenticated || !token) {
      showError("Authentication Error", "You must be logged in to join collaborative editing.");
      return;
    }

    try {
      cleanupWebsocket();
      const newWebsocketService = new WebSocketService(dispatch, token, documentId);
      setWebsocketService(newWebsocketService);
      newWebsocketService.connect();
    } catch (error) {
      console.error("Error creating WebSocket service:", error);
      showError("Connection Error", "Failed to establish real-time connection.");
    }
  };

  // Disconnect from WebSocket
  const disconnect = () => {
    cleanupWebsocket();
  };

  // Send operation through WebSocket
  const sendOperation = (operation: any) => {
    if (websocketService && connectionStatus === "connected") {
      websocketService.sendOperation(operation);
    } else {
      showError("Collaboration Error", "Cannot send operation: WebSocket is not connected");
    }
  };

  // Send cursor update through WebSocket
  const sendCursorUpdate = (position: { x: number; y: number }) => {
    if (websocketService && connectionStatus === "connected") {
      websocketService.sendCursorUpdate(position);
    }
    // No error for cursor updates - they're less critical
  };

  // Send chat message through WebSocket
  const sendChatMessage = (content: string) => {
    if (websocketService && connectionStatus === "connected") {
      websocketService.sendChatMessage(content);
    } else {
      showError("Collaboration Error", "Cannot send message: WebSocket is not connected");
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        websocket: websocketService,
        connectionStatus,
        connect,
        disconnect,
        sendOperation,
        sendCursorUpdate,
        sendChatMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
