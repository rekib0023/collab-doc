import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollaboration } from "@/hooks/useCollaboration";
import { RootState } from "@/store";
import { User } from "@/store/slices/collaborationSlice";
import React, { useRef } from "react";
import { useSelector } from "react-redux";
import CollaborativeCursor from "./CollaborativeCursor";

interface CollaborativeEditorProps {
  documentId: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { activeUsers } = useSelector(
    (state: RootState) => state.collaboration
  );
  const { isConnected, isConnecting, error, applyOperation } = useCollaboration(
    { documentId }
  );

  // The useCollaboration hook takes care of connection management
  // with autoConnect=true by default

  const renderConnectionStatus = () => {
    if (error) {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (isConnecting) {
      return <Badge variant="secondary">Connecting...</Badge>;
    }
    if (isConnected) {
      return <Badge className="bg-green-500">Connected</Badge>;
    }
    return <Badge variant="destructive">Disconnected</Badge>;
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
        <div
          ref={editorRef}
          className="prose dark:prose-invert max-w-none min-h-[400px] border rounded-md p-4"
          contentEditable
          onInput={(e) => {
            // When content changes, send an operation only if connected
            if (isConnected) {
              const content = e.currentTarget.innerHTML;
              applyOperation("content_update", documentId, { content });
            }
          }}
        />
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
