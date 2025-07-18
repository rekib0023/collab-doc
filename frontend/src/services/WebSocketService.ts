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

interface WSMessage {
  type: string;
  [key: string]: any;
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
  private cursorThrottleTime = 50; // ms

  constructor(dispatch: AppDispatch, token: string, documentId: string) {
    this.dispatch = dispatch;
    this.token = token;
    this.documentId = documentId;
  }

  public connect = () => {
    this.dispatch(setConnectionStatus('connecting'));

    // Close existing connection if any
    if (this.socket) {
      this.socket.close();
    }

    // Create new WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = 'localhost:8000';
    const apiPath = '/api/v1/ws';
    const url = `${protocol}//${host}${apiPath}/documents/${this.documentId}?token=${this.token}`;

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = this.handleOpen;
      this.socket.onmessage = this.handleMessage;
      this.socket.onclose = this.handleClose;
      this.socket.onerror = this.handleError;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.dispatch(setError('Failed to establish WebSocket connection'));
      this.dispatch(setConnectionStatus('error'));
    }
  };

  public disconnect = () => {
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
      this.socket = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.dispatch(setConnectionStatus('disconnected'));
  };

  public sendOperation = (operation: Operation) => {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'operation',
        operation: {
          type: operation.type,
          target_id: operation.targetId,
          payload: operation.payload,
          vector_clock: operation.vector
        }
      }));
    } else {
      this.dispatch(setError('Cannot send operation: WebSocket is not connected'));
    }
  };

  public sendCursorUpdate = (position: { x: number; y: number }) => {
    if (this.cursorUpdateThrottled) return;

    this.cursorUpdateThrottled = true;
    setTimeout(() => {
      this.cursorUpdateThrottled = false;
    }, this.cursorThrottleTime);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'cursor_update',
        position
      }));
    }
  };

  public sendChatMessage = (content: string) => {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'chat_message',
        content
      }));
    } else {
      this.dispatch(setError('Cannot send message: WebSocket is not connected'));
    }
  };

  private handleOpen = () => {
    console.log('WebSocket connection established');
    this.dispatch(setConnectionStatus('connected'));
    this.reconnectAttempts = 0;

    // Set up ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
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
        case 'error':
          this.dispatch(setError(message.message || 'An error occurred'));
          break;
        case 'pong':
          // Received pong from server (keep-alive response)
          break;
        default:
          console.warn('Unhandled message type:', message.type, message);
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
          name: user.name,
          avatar: user.avatar || undefined,
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
        name: user.name,
        avatar: user.avatar || undefined,
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
        userId: op.created_by,
        type: op.type,
        targetId: op.target_id || undefined,
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
      // Mark the user as active
      this.dispatch(updateUserCursor({
        userId: message.user_id,
        position: { x: -1, y: -1 } // Special value to indicate only activity update, not cursor position
      }));

      // Handle the chat message in your chat UI component
      // You could dispatch to a chatSlice if you have one
    }
  };

  private handleClose = (event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.dispatch(setConnectionStatus('disconnected'));

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Attempt to reconnect if it wasn't a clean close
    if (event.code !== 1000 && event.code !== 1001) {
      this.attemptReconnect();
    }
  };

  private handleError = (event: Event) => {
    console.error('WebSocket error:', event);
    this.dispatch(setError('WebSocket connection error'));
    this.dispatch(setConnectionStatus('error'));
  };

  private attemptReconnect = () => {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
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
