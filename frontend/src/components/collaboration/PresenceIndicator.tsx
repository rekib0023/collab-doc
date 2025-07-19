import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { User } from '@/store/slices/collaborationSlice';
import { cn } from '@/lib/utils';

// Define a type for user activity status
type ActivityStatus = 'active' | 'typing' | 'idle' | 'offline';

interface PresenceIndicatorProps {
  users: User[];
  maxDisplayed?: number;
  showStatus?: boolean;
  showTypingIndicator?: boolean;
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ 
  users,
  maxDisplayed = 5,
  showStatus = true,
  showTypingIndicator = true
}) => {
  // Sort users by activity status - active first, then typing, then idle
  const sortedUsers = [...users].sort((a, b) => {
    // Active users come first
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    // Users who are typing come next (we'll detect this based on very recent activity)
    const aIsTyping = Date.now() - (a.lastActivity || 0) < 3000; // Less than 3 seconds = typing
    const bIsTyping = Date.now() - (b.lastActivity || 0) < 3000;
    if (aIsTyping !== bIsTyping) {
      return aIsTyping ? -1 : 1;
    }
    // Then sort by most recent activity
    return (b.lastActivity || 0) - (a.lastActivity || 0);
  });

  const displayedUsers = sortedUsers.slice(0, maxDisplayed);
  const remainingCount = sortedUsers.length - maxDisplayed;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserActivityStatus = (user: User): ActivityStatus => {
    if (!user.isActive) return 'offline';
    
    const secondsSinceActivity = Math.floor((Date.now() - (user.lastActivity || 0)) / 1000);
    if (secondsSinceActivity < 3) return 'typing'; // If activity in last 3 seconds, assume typing
    if (secondsSinceActivity < 30) return 'active'; // If activity in last 30 seconds, active
    return 'idle'; // Otherwise idle
  };

  const getTimeAgo = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 3) return 'typing...'; // Special case for typing
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (users.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No active users
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="flex -space-x-3">
        {displayedUsers.map(user => (
          <TooltipProvider key={user.id}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className={cn(
                  "rounded-full border-2 border-background transition-all hover:scale-110 relative",
                  user.isActive ? "ring-2 ring-green-500" : ""
                )}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback style={{ backgroundColor: user.color, color: '#fff' }}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {showStatus && user.isActive && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                {getUserActivityStatus(user) === 'typing' && showTypingIndicator ? (
                  <>
                    <span className="flex space-x-1 mr-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span>Typing...</span>
                  </>
                ) : (
                  <>
                    <span className={cn(
                      "h-2 w-2 rounded-full mr-1.5",
                      getUserActivityStatus(user) === 'active' ? "bg-green-500" : 
                      getUserActivityStatus(user) === 'idle' ? "bg-yellow-500" : "bg-gray-500"
                    )} />
                    {getUserActivityStatus(user) === 'active' ? 'Active now' : 
                     getUserActivityStatus(user) === 'idle' ? `Idle for ${getTimeAgo(user.lastActivity || 0)}` :
                     `Last seen ${getTimeAgo(user.lastActivity || 0)}`}
                  </>
                )}
              </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        
        {remainingCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 bg-secondary hover:scale-110 transition-all">
                  <AvatarFallback>+{remainingCount}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{remainingCount} more user{remainingCount !== 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Badge variant="secondary" className="ml-2 text-xs">
        {users.filter(u => u.isActive).length} active
      </Badge>
    </div>
  );
};

export default PresenceIndicator;
