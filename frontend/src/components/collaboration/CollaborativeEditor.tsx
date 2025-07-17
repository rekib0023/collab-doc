import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WebSocketService from "@/services/WebSocketService";
import { AppDispatch, RootState } from "@/store";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CollaborativeCursor from "./CollaborativeCursor";

interface CollaborativeEditorProps {
  documentId: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { token } = useSelector((state: RootState) => state.auth);
  const { activeUsers, connectionStatus, error }: { activeUsers: ActiveUser[]; connectionStatus: string; error: string } = useSelector(
    (state: RootState) => state.collaboration
  );

  // Initialize WebSocket connection
  useEffect(() => {
    if (token && documentId) {
      // Create and connect WebSocket service
      const service = new WebSocketService(dispatch, token, documentId);
      service.connect();
      setWsService(service);

      // Clean up on unmount
      return () => {
        service.disconnect();
      };
    }
  }, [token, documentId, dispatch]);

  // Track mouse movement for cursor position sharing
  useEffect(() => {
    if (!wsService || !editorRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!editorRef.current) return;

      // Get editor element position
      const rect = editorRef.current.getBoundingClientRect();

      // Calculate relative position within the editor
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Send cursor position to WebSocket service
      wsService.sendCursorUpdate({ x, y });
    };

    const editorElement = editorRef.current;
    editorElement.addEventListener("mousemove", handleMouseMove);

    return () => {
      editorElement.removeEventListener("mousemove", handleMouseMove);
    };
  }, [wsService]);

  // Status indicator UI
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            Connected
          </Badge>
        );
      case "connecting":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
            Connecting...
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
            Disconnected
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500">
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Document Editor</CardTitle>
          <div className="flex items-center space-x-2">
            {renderConnectionStatus()}
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="h-8 w-8 rounded-full border-2 border-background overflow-hidden"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white text-sm font-medium">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              {activeUsers.length > 3 && (
                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-sm font-medium">
                  +{activeUsers.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-red-500 mb-2">{error}</div>}

        <div
          ref={editorRef}
          className="relative border rounded-md p-4 min-h-[400px] bg-background"
        >
          {/* Placeholder editor content - will be replaced with actual editor implementation */}
          <div className="prose prose-sm max-w-none">
            <p>
              This is a collaborative document editor. Start typing to
              collaborate in real-time!
            </p>
            <p>
              The actual text editor component (like TipTap or ProseMirror) will
              be integrated here.
            </p>
          </div>

          {/* Collaborative cursors */}
          {activeUsers
            .filter((user) => user.isActive && user.cursor)
            .map((user) => (
              <CollaborativeCursor
                key={user.id}
                user={user}
                position={user.cursor || { x: 0, y: 0 }}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CollaborativeEditor;
