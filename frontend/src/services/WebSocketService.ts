import { AppDispatch } from '@/store';
import {
  addOperation,
  addUser,
  Operation,
  removeUser,
  setConnectionStatus,
  setError,
  updateUserCursor,
  User
} from '@/store/slices/collaborationSlice';

// Define WebSocket message type
interface WSMessage {
  type: string;
  timestamp?: number;
  payload?: any;
  [key: string]: any; // Allow for additional properties
}

export default class WebSocketService {
  private socket: WebSocket | null = null;
  private dispatch: AppDispatch;
  private token: string;
  private documentId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private pingInterval: NodeJS.Timeout | null = null;
  private cursorUpdateThrottled = false;
  private cursorThrottleTime = 100; // ms - to reduce network traffic
  private isManualDisconnect = false;
  private lastActivityUpdate: number = 0;
  private activityUpdateThrottle: number = 30000; // Check activity status every 30 seconds
  private userStatus: string = 'active'; // Track user status (active, typing, idle, etc.)
  private activityUpdateInterval: NodeJS.Timeout | null = null;
  private lastSentCursorPosition: { x: number; y: number } | null = null;

  constructor(dispatch: AppDispatch, token: string, documentId: string) {
    this.dispatch = dispatch;
    this.token = token;
    this.documentId = documentId;
  }

  public connect = () => {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket server...');
    this.isManualDisconnect = false;
    this.dispatch(setConnectionStatus('connecting'));
    
    try {
      // Set host based on environment
      const host = process.env.NODE_ENV === 'production' 
        ? window.location.host
        : 'localhost:8000';
        
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${host}/api/v1/ws/${this.documentId}?token=${this.token}`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen;
      this.socket.onmessage = this.handleMessage;
      this.socket.onclose = this.handleClose;
      this.socket.onerror = this.handleError;
      
      // Start tracking user activity when connected
      this.startActivityTracking();
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.dispatch(setConnectionStatus('error'));
      this.dispatch(setError('Failed to establish WebSocket connection'));
    }
  };

  public disconnect = () => {
    console.log('Manually disconnecting WebSocket');
    
    this.isManualDisconnect = true;
    this.clearPingInterval();
    this.stopActivityTracking();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.dispatch(setConnectionStatus('disconnected'));
  };

  public sendOperation = (operation: Operation) => {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.dispatch(setError('Cannot send operation: WebSocket is not connected'));
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'operation',
      operation: {
        type: operation.type,
        target_id: operation.targetId,
        payload: operation.payload,
        vector_clock: operation.vector
      }
    }));
  };

  public sendCursorUpdate = (position: { x: number; y: number }): void => {
    // Update last activity when cursor moves
    this.updateActivity();
    
    // Only send cursor updates at a reasonable frequency
    if (!this.cursorUpdateThrottled && this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Avoid sending duplicate position updates
      if (
        !this.lastSentCursorPosition ||
        Math.abs(this.lastSentCursorPosition.x - position.x) > 5 ||
        Math.abs(this.lastSentCursorPosition.y - position.y) > 5
      ) {
        this.lastSentCursorPosition = position;
        
        // Update activity status to "active" when cursor moves
        this.userStatus = "active";
        
        this.socket.send(
          JSON.stringify({
            type: "cursor_update",
            position,
            documentId: this.documentId,
            timestamp: Date.now(),
          })
        );

        // Throttle subsequent updates
        this.cursorUpdateThrottled = true;
        setTimeout(() => {
          this.cursorUpdateThrottled = false;
        }, this.cursorThrottleTime);
      }
    }
  };

  public sendChatMessage = (content: string) => {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.dispatch(setError('Cannot send message: WebSocket is not connected'));
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'chat_message',
      content
    }));
    
    // Update activity timestamp when sending a chat message
    this.updateActivity();
  };

  public sendMessage = (message: WSMessage) => {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  };

  // Activity tracking methods
  private startActivityTracking = () => {
    // Listen for user activity events
    document.addEventListener('mousemove', this.updateActivity);
    document.addEventListener('keydown', this.updateActivity);
    document.addEventListener('click', this.updateActivity);
    
    // Set up regular activity status updates
    this.activityUpdateInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - this.lastActivityUpdate;
      // Determine status based on activity time
      if (timeSinceActivity < 60000) { // Less than a minute
        this.sendActivityUpdate('active');
      } else {
        this.sendActivityUpdate('idle');
      }
    }, 30000); // Check activity status every 30 seconds
  };
  
  private stopActivityTracking = () => {
    document.removeEventListener('mousemove', this.updateActivity);
    document.removeEventListener('keydown', this.updateActivity);
    document.removeEventListener('click', this.updateActivity);
    
    if (this.activityUpdateInterval) {
      clearInterval(this.activityUpdateInterval);
      this.activityUpdateInterval = null;
    }
  };
  
  private updateActivity = () => {
    this.lastActivityUpdate = Date.now();
  };
  
  private sendActivityUpdate = (status: string = 'active'): void => {
    const now = Date.now();
    
    // Only send updates when status changes or enough time has passed
    if (status !== this.userStatus || now - this.lastActivityUpdate > this.activityUpdateThrottle) {
      this.lastActivityUpdate = now;
      this.userStatus = status;
      
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: "activity_update",
          timestamp: now,
          payload: { status: status }
        }));
      }
    }
  };

  private handleOpen = () => {
    console.log('WebSocket connected');
    this.dispatch(setConnectionStatus('connected'));
    this.reconnectAttempts = 0;
    
    // Set up regular ping to keep connection alive
    this.clearPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
    
    // Send initial activity status as active
    this.sendActivityUpdate('active');
  };

  private handleMessage = (event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'init':
          this.handleInitMessage(message);
          break;
        case 'user_joined':
          this.handleUserJoinedMessage(message);
          break;
        case 'user_left':
          this.handleUserLeftMessage(message);
          break;
        case 'cursor_update':
          this.handleCursorUpdateMessage(message);
          break;
        case 'operation':
          this.handleOperationMessage(message);
          break;
        case 'chat_message':
          this.handleChatMessage(message);
          break;
        case 'activity_update':
          this.handleActivityUpdateMessage(message);
          break;
        case 'pong':
          // Do nothing for pong messages
          break;
        case 'error':
          console.error('WebSocket error message:', message.error);
          this.dispatch(setError(message.error || 'Unknown WebSocket error'));
          break;
        default:
          console.warn('Unknown message type:', message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  };

  private handleInitMessage = (message: WSMessage) => {
    // Handle the initial message with active users
    if (message.users && Array.isArray(message.users)) {
      message.users.forEach((user: any) => {
        const collaborator: User = {
          id: user.id,
          name: user.name || 'Unknown',
          avatar: user.avatar || '',
          color: this.getRandomColor(user.id),
          isActive: true,
          lastActivity: Date.now()
        };
        this.dispatch(addUser(collaborator));
      });
    }
  };

  private handleUserJoinedMessage = (message: WSMessage) => {
    if (message.user) {
      const user = message.user;
      const collaborator: User = {
        id: user.id,
        name: user.name || 'Unknown',
        avatar: user.avatar || '',
        color: this.getRandomColor(user.id),
        isActive: true,
        lastActivity: Date.now()
      };
      this.dispatch(addUser(collaborator));
    }
  };

  private handleUserLeftMessage = (message: WSMessage) => {
    if (message.user_id) {
      this.dispatch(removeUser(message.user_id));
    }
  };

  private handleCursorUpdateMessage = (message: WSMessage) => {
    if (message.user_id && message.position) {
      this.dispatch(updateUserCursor({
        userId: message.user_id,
        position: message.position
      }));
    }
  };

  private handleOperationMessage = (message: WSMessage) => {
    if (message.operation) {
      const op = message.operation;
      
      const operation: Operation = {
        id: op.id,
        type: op.type,
        targetId: op.target_id,
        userId: op.user_id,
        payload: op.payload,
        timestamp: new Date(op.created_at).getTime(),
        vector: op.vector_clock
      };
      
      this.dispatch(addOperation(operation));
    }
  };

  private handleChatMessage = (message: WSMessage) => {
    // Update user activity
    if (message.user_id) {
      // Dispatch action to update user's active status
      // You could implement this in your collaborationSlice
      
      // Handle the chat message in your chat UI component
      // You could dispatch to a chatSlice if you have one
    }
  };

  private handleActivityUpdateMessage = (message: WSMessage) => {
    if (message.user_id && typeof message.isActive === 'boolean') {
      // Update user activity status in the store
      // Implement this in your collaborationSlice if needed
    }
  };

  private handleClose = (event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    
    // Clean up event listeners and intervals
    this.clearPingInterval();
    this.stopActivityTracking();
    
    // Update connection status
    this.dispatch(setConnectionStatus('disconnected'));
    
    // Attempt reconnect if not manually closed and not a normal closure
    if (!this.isManualDisconnect && event.code !== 1000 && event.code !== 1001) {
      this.attemptReconnect();
    }
  };

  private handleError = (event: Event) => {
    console.error('WebSocket error:', event);
    this.dispatch(setConnectionStatus('error'));
  };

  private clearPingInterval = () => {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  };

  private attemptReconnect = () => {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnect attempts reached. Giving up.');
      this.dispatch(setError('Could not reconnect to the server after multiple attempts'));
    }
  };

  private getRandomColor = (userId: string): string => {
    // Generate a deterministic color based on user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Create HSL color with fixed saturation and lightness
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };
}
