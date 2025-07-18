import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WebSocketService from "@/services/WebSocketService";
import { AppDispatch, RootState } from "@/store";
import { User } from "@/store/slices/collaborationSlice";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import CollaborativeCursor from "./CollaborativeCursor";

interface CollaborativeEditorProps {
  documentId: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const editorRef = useRef<HTMLDivElement>(null);
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const { token } = useSelector((state: RootState) => state.auth);
  const { activeUsers, connectionStatus, error } = useSelector(
    (state: RootState) => state.collaboration
  );

  useEffect(() => {
    if (token && documentId) {
      // Instantiate and connect only if it hasn't been done yet.
      if (!wsServiceRef.current) {
        wsServiceRef.current = new WebSocketService(dispatch, token, documentId);
        wsServiceRef.current.connect();
      }

      // The cleanup function will be called when the component unmounts.
      return () => {
        if (wsServiceRef.current) {
          wsServiceRef.current.disconnect();
          wsServiceRef.current = null;
        }
      };
    }
  }, [documentId, token, dispatch]);

  const renderConnectionStatus = () => {
    if (error) {
      return <Badge variant="destructive">Error</Badge>;
    }
    switch (connectionStatus) {
      case "connecting":
        return <Badge variant="secondary">Connecting...</Badge>;
      case "connected":
        return <Badge className="bg-green-500">Connected</Badge>;
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>;
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
              {Object.values(activeUsers)
                .slice(0, 3)
                .map((user: User) => (
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
              {Object.values(activeUsers).length > 3 && (
                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-sm">
                  +{Object.values(activeUsers).length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={editorRef} className="prose dark:prose-invert max-w-none" />
        {Object.values(activeUsers).map((user: User) => (
          <CollaborativeCursor
            key={user.id}
            user={user}
            position={user.cursor || { x: 0, y: 0 }}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default CollaborativeEditor;
