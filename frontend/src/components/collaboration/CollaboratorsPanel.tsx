import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { User } from "@/store/slices/collaborationSlice";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CollaboratorsPanelProps {
  documentId: string;
  documentTitle?: string;
}

export const CollaboratorsPanel: React.FC<CollaboratorsPanelProps> = ({
  documentId,
  documentTitle = "Document"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeUsers = useSelector(
    (state: RootState) => state.collaboration.activeUsers
  );
  const connectionStatus = useSelector(
    (state: RootState) => state.collaboration.connectionStatus
  );

  const isConnected = connectionStatus === "connected";
  const usersList = Object.values(activeUsers);

  // Categorize users by their activity status
  const { activeUsers: activeUsersList, typingUsers, idleUsers } = useMemo(() => {
    const result = {
      activeUsers: [] as User[],
      typingUsers: [] as User[],
      idleUsers: [] as User[]
    };
    
    usersList.forEach(user => {
      const timeSinceActivity = Date.now() - (user.lastActivity || 0);
      if (timeSinceActivity < 3000) {
        result.typingUsers.push(user);
      } else if (timeSinceActivity < 60000) {
        result.activeUsers.push(user);
      } else {
        result.idleUsers.push(user);
      }
    });
    
    return result;
  }, [usersList]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Users className="h-4 w-4 mr-1" />
          <span>Collaborators</span>
          {usersList.filter(u => u.isActive).length > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {usersList.filter(u => u.isActive).length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Active Collaborators</SheetTitle>
          <SheetDescription>
            {isConnected ? 
              `${usersList.filter(u => u.isActive).length} user${usersList.filter(u => u.isActive).length !== 1 ? 's' : ''} currently active.` : 
              'Connection status: ' + connectionStatus
            }
          </SheetDescription>
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
            <div className="space-y-4">
              {/* Document Info Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold">
                        {documentTitle}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {usersList.length} {usersList.length === 1 ? 'collaborator' : 'collaborators'} online
                        {typingUsers.length > 0 && (
                          <span className="ml-2 text-sky-500">
                            ({typingUsers.length} typing...)
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    {isConnected ? (
                      <Badge className="bg-green-500 hover:bg-green-600">Connected</Badge>
                    ) : (
                      <Badge variant="destructive">Disconnected</Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
              
              {/* Collaborators By Status */}
              <ScrollArea className="h-[400px] pr-3">
                {/* Typing Users */}
                {typingUsers.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <span className="flex space-x-1 mr-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span className="text-sky-500">Typing</span>
                    </h3>
                    
                    {typingUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback style={{ backgroundColor: user.color || '#4f46e5' }}>
                              {user.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-sky-400 flex items-center gap-1">
                              <span>typing...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Active Users */}
                {activeUsersList.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                      <span>Active</span>
                    </h3>
                    
                    {activeUsersList.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback style={{ backgroundColor: user.color || '#4f46e5' }}>
                              {user.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Active now
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Idle Users */}
                {idleUsers.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                      <span>Idle</span>
                    </h3>
                    
                    {idleUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback style={{ backgroundColor: user.color || '#4f46e5' }}>
                              {user.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Last active: {new Date(user.lastActivity || Date.now()).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
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
