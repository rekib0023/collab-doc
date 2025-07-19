import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface CursorPosition {
  x: number;
  y: number;
}

interface CollaboratorCursorProps {
  user: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    lastActivity?: number;
    color?: string;
  };
  position: {
    x: number;
    y: number;
  };
  color?: string;
  showLabel?: boolean;
  className?: string;
}

const CollaboratorCursor: React.FC<CollaboratorCursorProps> = ({
  user,
  position,
  color = "#3b82f6", // Default to blue if no color provided
  showLabel = true,
  className,
}) => {
  if (!position) return null;

  // Create absolute positioning style for cursor
  const motionStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 50,
    pointerEvents: 'none',
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  } as React.CSSProperties;

  // Don't render if position is invalid or has special -1,-1 value (just activity update)
  if (position.x < 0 || position.y < 0) {
    return null;
  }

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Check if the user is typing (activity within last 3 seconds)
    const checkTypingStatus = () => {
      const timeSinceActivity = Date.now() - (user.lastActivity || 0);
      setIsTyping(timeSinceActivity < 3000); // Less than 3 seconds = typing
    };

    // Initial check
    checkTypingStatus();

    // Regular checks
    const interval = setInterval(checkTypingStatus, 500);
    return () => clearInterval(interval);
  }, [user.lastActivity]);

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div style={motionStyle} className={className}>
            <svg
              width="16"
              height="24"
              viewBox="0 0 16 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: color }}
            >
              <path
                d="M0.928568 0.928531C1.44285 0.414245 2.2 0.199959 2.87143 0.414245L14.3 4.38567C15.3286 4.71424 15.8429 5.85709 15.3286 6.77138C14.8143 7.68567 13.6714 8.08567 12.7571 7.54281L5.7 4.17138L2.32857 11.2285C1.78571 12.1428 0.642853 12.6571 -0.271433 12.1428C-1.07143 11.6285 -1.38571 10.4856 -0.928575 9.45709L3.04286 1.97138C3.14286 1.65709 3.35714 1.23424 3.67143 0.928531H0.928568Z"
                fill="currentColor"
              />
            </svg>

            {showLabel && (
              <div className="absolute left-4 top-0">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback style={{ backgroundColor: color, color: '#fff' }}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {isTyping && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                  </span>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {isTyping && (
            <div className="text-xs text-sky-400 flex items-center gap-1 mt-0.5">
              <span className="flex space-x-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>Typing...</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CollaboratorCursor;
