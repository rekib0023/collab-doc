import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollaboration } from "@/hooks/useCollaboration";
import { RootState } from "@/store";
import { User } from "@/store/slices/collaborationSlice";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import CollaboratorCursor from "./CollaboratorCursor";
import PresenceIndicator from "./PresenceIndicator";
// Import with type assertion to avoid TypeScript error
import lodash from "lodash";
const debounce: <T extends (...args: any[]) => any>(
  func: T,
  wait?: number,
  options?: { leading?: boolean; trailing?: boolean; maxWait?: number }
) => T = lodash.debounce;

interface CollaborativeEditorProps {
  documentId: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [lastContent, setLastContent] = useState("");
  const { activeUsers } = useSelector(
    (state: RootState) => state.collaboration
  );
  const { isConnected, isConnecting, error, applyOperation, updateActivity } = useCollaboration(
    { documentId }
  );

  // Define a debounced function to update user activity status after inactivity
  const debouncedActivityUpdate = debounce(() => {
    // When user stops typing, send a specific activity update
    if (isConnected) {
      applyOperation("activity_update", documentId, { status: "idle" });
    }
  }, 2000); // Wait 2 seconds before showing user as idle

  // The useCollaboration hook takes care of connection management
  // with autoConnect=true by default

  const renderConnectionStatus = () => {
    if (error) {
      return (
        <div className="flex items-center space-x-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <Badge variant="destructive">Error</Badge>
        </div>
      );
    }
    if (isConnecting) {
      return (
        <div className="flex items-center space-x-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
          <Badge variant="secondary">Connecting...</Badge>
        </div>
      );
    }
    if (isConnected) {
      return (
        <div className="flex items-center space-x-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <Badge className="bg-green-500">Connected</Badge>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
        </span>
        <Badge variant="destructive">Disconnected</Badge>
      </div>
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Document Editor</CardTitle>
          <div className="flex items-center space-x-2">
            {renderConnectionStatus()}
            <PresenceIndicator
              users={Object.values(activeUsers)}
              maxDisplayed={5}
              showStatus={true}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={editorRef}
          className="prose dark:prose-invert max-w-none min-h-[400px] border rounded-md p-4"
          contentEditable
          onInput={(e) => {
            // Reset activity state after 2 seconds of inactivity
            debouncedActivityUpdate();
            
            // Update activity timestamp
            updateActivity();
            
            // When content changes, send an operation only if connected
            if (isConnected) {
              const content = e.currentTarget.innerHTML;
              
              // Only send update if content has changed significantly
              if (content !== lastContent) {
                applyOperation("content_update", documentId, { content });
                setLastContent(content);
              }
            }
          }}
          onKeyDown={() => {
            // Update activity on keydown for more responsive typing detection
            updateActivity();
            debouncedActivityUpdate();
          }}
          onFocus={() => {
            // Update activity when user focuses on the editor
            updateActivity();
          }}
        />
        {Object.values(activeUsers).map((user: User) => (
          <CollaboratorCursor
            key={user.id}
            user={{
              id: user.id,
              name: user.name,
              email: user.name, // We don't have email in the User type, so using name as fallback
              avatar: user.avatar
            }}
            position={user.cursor || { x: 0, y: 0 }}
            color={user.color}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default CollaborativeEditor;
