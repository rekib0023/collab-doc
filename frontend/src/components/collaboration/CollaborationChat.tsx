import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useCollaboration } from "@/hooks/useCollaboration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MessageCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Format date as simple string
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  content: string;
  timestamp: number;
}

// Used for active user information from Redux store
interface ActiveUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

interface CollaborationChatProps {
  documentId: string;
}

export const CollaborationChat: React.FC<CollaborationChatProps> = ({
  documentId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isConnected, sendChatMessage } = useCollaboration({ documentId, autoConnect: false });
  const activeUsers = useSelector(
    (state: RootState) => state.collaboration.activeUsers
  );
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // For a fully implemented solution, we would pull chat messages from Redux
  // But for demonstration purposes, we're using local state
  
  useEffect(() => {
    // For demonstration, add a sample message
    if (messages.length === 0 && currentUser) {
      const sampleMessage: ChatMessage = {
        id: "sample-1",
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: "#0ea5e9",
        content: "Welcome to document chat!",
        timestamp: Date.now()
      };
      setMessages([sampleMessage]);
    }
  }, [messages.length, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Reset unread counter when sheet is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser || !isConnected) return;

    // Create new message
    const newChatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: "#0ea5e9", // Use a default color
      content: newMessage,
      timestamp: Date.now()
    };

    // Add message to local state
    setMessages(prev => [...prev, newChatMessage]);

    // Send message through websocket
    sendChatMessage(newMessage);
    
    // Clear input after sending
    setNewMessage("");
  };

  const getUserDetails = (userId: string): ActiveUser => {
    const user = activeUsers[userId];
    return user || {
      id: userId,
      name: "Unknown User",
      color: "#666666",
      avatar: undefined
    };
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <MessageCircle className="h-4 w-4 mr-1" />
          <span>Chat</span>
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 bg-primary text-primary-foreground h-5 min-w-[20px] flex items-center justify-center p-0 text-xs"
              variant="default"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Document Chat</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center p-4">
              <div>
                <p>No messages yet</p>
                <p className="text-sm mt-2">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-160px)]">
              <div className="p-4 space-y-4">
                {messages.map((msg) => {
                  const user = getUserDetails(msg.userId);
                  const isCurrentUser =
                    currentUser && msg.userId === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        isCurrentUser ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback style={{ backgroundColor: user.color }}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={cn(
                          "max-w-[75%]",
                          isCurrentUser ? "text-right" : "text-left"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 inline-block",
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {msg.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {user.name}, {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="p-4 border-t mt-auto">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={!isConnected}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!isConnected || !newMessage.trim()}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>

          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              You are not connected to the collaboration server
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CollaborationChat;
