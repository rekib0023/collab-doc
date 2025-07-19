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
      // Find the editor element by its class or id
      // This can be improved by using a ref passed from the component
      const editorElements = document.querySelectorAll('.prose');
      const editorElement = editorElements.length > 0 ? editorElements[0] : null;
      
      if (!editorElement) return; // No editor found
      
      // Set up cursor tracking only within the editor
      const handleMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        // Calculate position relative to editor with scroll offsets
        const rect = editorElement.getBoundingClientRect();
        const scrollLeft = editorElement.scrollLeft || document.documentElement.scrollLeft;
        const scrollTop = editorElement.scrollTop || document.documentElement.scrollTop;
        
        const x = (mouseEvent.clientX - rect.left) + scrollLeft;
        const y = (mouseEvent.clientY - rect.top) + scrollTop;
        
        // Only update if position changed significantly (reduce network traffic)
        if (!cursorPosition ||
            Math.abs(cursorPosition.x - x) > 5 ||
            Math.abs(cursorPosition.y - y) > 5) {
          setCursorPosition({ x, y });
        }
      };

      // Only track mouse within the editor element
      editorElement.addEventListener("mousemove", handleMouseMove);

      // Set up periodic cursor updates to the server (reduced frequency)
      cursorUpdateTimerRef.current = setInterval(() => {
        if (cursorPosition) {
          sendCursorUpdate(cursorPosition);
        }
      }, 150); // Send cursor position every 150ms for better performance

      return () => {
        editorElement.removeEventListener("mousemove", handleMouseMove);
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
      timestamp: Date.now(),
      id: `temp-${Date.now()}`, // Temporary ID, will be replaced by server
      vector: [], // Vector clock will be updated by the server
    };

    sendOperation(operation);
  };

  // Update user activity timestamp
  const updateActivity = () => {
    // This will trigger the WebSocketService to update lastActivityUpdate
    // and may send an activity update based on throttling
    if (connectionStatus === "connected") {
      // We don't need to do anything here as mouse movements and other
      // events will update activity in WebSocketService
      // But we'll update the local timestamp to help with UI state
      // This could also directly call a specific WebSocket message if needed
    }
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
    updateActivity,
    connect,
    disconnect
  };
};
