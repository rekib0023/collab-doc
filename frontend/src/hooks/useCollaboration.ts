import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Operation } from "@/store/slices/collaborationSlice";
import { useWebSocket } from "@/context/WebSocketContext";
import { useToast } from "@/hooks/useToast";

interface UseCollaborationOptions {
  documentId: string;
  autoConnect?: boolean;
}

export const useCollaboration = ({ documentId, autoConnect = true }: UseCollaborationOptions) => {
  const { connectionStatus, connect, disconnect, sendOperation, sendCursorUpdate, sendChatMessage } = useWebSocket();
  const activeUsers = useSelector((state: RootState) => state.collaboration.activeUsers);
  const operations = useSelector((state: RootState) => state.collaboration.operations);
  const error = useSelector((state: RootState) => state.collaboration.error);
  const { error: showError } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const cursorUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to document on component mount if autoConnect is true
  useEffect(() => {
    if (autoConnect && documentId && !isConnecting) {
      setIsConnecting(true);
      connect(documentId);
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
      if (cursorUpdateTimerRef.current) {
        clearInterval(cursorUpdateTimerRef.current);
      }
    };
  }, [documentId, autoConnect]);

  // Show toast notification on connection error
  useEffect(() => {
    if (error) {
      showError("Collaboration Error", error);
    }
  }, [error, showError]);

  // Setup cursor position tracking and periodic updates
  useEffect(() => {
    if (connectionStatus === "connected") {
      // Set up cursor tracking
      const handleMouseMove = (e: MouseEvent) => {
        // Get cursor position relative to the document or editor container
        // This might need adjustment based on your specific editor implementation
        const rect = (e.target as Element).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCursorPosition({ x, y });
      };

      document.addEventListener("mousemove", handleMouseMove);

      // Set up periodic cursor updates to the server
      cursorUpdateTimerRef.current = setInterval(() => {
        if (cursorPosition) {
          sendCursorUpdate(cursorPosition);
        }
      }, 100); // Send cursor position every 100ms

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        if (cursorUpdateTimerRef.current) {
          clearInterval(cursorUpdateTimerRef.current);
        }
      };
    }
  }, [connectionStatus, cursorPosition]);

  // Send operation to the server
  const applyOperation = (operationType: string, targetId: string | undefined, payload: any) => {
    const operation: Operation = {
      userId: "current_user", // This will be overwritten by the server
      type: operationType,
      targetId,
      payload,
      vector: [], // This will be handled by the server
    };

    sendOperation(operation);
  };

  return {
    isConnected: connectionStatus === "connected",
    isConnecting: connectionStatus === "connecting",
    activeUsers: Object.values(activeUsers),
    operations,
    error,
    applyOperation,
    sendCursorUpdate,
    sendChatMessage,
    connect,
    disconnect,
  };
};
