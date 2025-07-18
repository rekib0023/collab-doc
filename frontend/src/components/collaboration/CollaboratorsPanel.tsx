import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { User } from "@/store/slices/collaborationSlice";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CollaboratorsPanelProps {
  documentId: string;
}

export const CollaboratorsPanel: React.FC<CollaboratorsPanelProps> = ({
  documentId,
}) => {
  const activeUsers = useSelector(
    (state: RootState) => state.collaboration.activeUsers
  );
  const connectionStatus = useSelector(
    (state: RootState) => state.collaboration.connectionStatus
  );

  const isConnected = connectionStatus === "connected";
  const usersList = Object.values(activeUsers);

  const getActivityStatus = (user: User) => {
    // If last activity was within the last 30 seconds, show as active
    const isActive = Date.now() - user.lastActivity < 30000;
    return isActive ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge variant="outline">Idle</Badge>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-1" />
          <span>
            Collaborators {usersList.length > 0 && `(${usersList.length})`}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Active Collaborators</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {!isConnected && (
            <div className="p-3 bg-muted rounded-md text-center text-sm text-muted-foreground">
              Not connected to collaboration server
            </div>
          )}

          {isConnected && usersList.length === 0 && (
            <div className="p-3 bg-muted rounded-md text-center text-sm text-muted-foreground">
              No active collaborators
            </div>
          )}

          {isConnected && usersList.length > 0 && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {usersList.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: user.color }}
                      />
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback style={{ backgroundColor: user.color }}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Last active:{" "}
                          {new Date(user.lastActivity).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div>{getActivityStatus(user)}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Document Information</h4>
          <div className="text-sm text-muted-foreground">
            <p>Document ID: {documentId}</p>
            <p>Connected Users: {usersList.length}</p>
            <p>
              Status:{" "}
              {isConnected ? (
                <Badge className="bg-green-500">Connected</Badge>
              ) : (
                <Badge variant="destructive">Disconnected</Badge>
              )}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CollaboratorsPanel;
