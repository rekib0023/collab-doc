import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
  isActive: boolean;
  lastActivity: number;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface Operation {
  id?: string;
  userId: string;
  type: string;
  targetId?: string;
  payload: any;
  timestamp?: number;
  vector: any[];
}

interface CollaborationState {
  activeUsers: Record<string, User>;
  operations: Operation[];
  workspaces: Workspace[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  rtcSignalingEnabled: boolean;
  error: string | null;
  isRtcEnabled: boolean;
  isSignalingConnected: boolean;
  lastSyncTimestamp: number | null;
}

const initialState: CollaborationState = {
  activeUsers: {},
  operations: [],
  workspaces: [],
  connectionStatus: 'disconnected',
  rtcSignalingEnabled: false,
  error: null,
  isRtcEnabled: false,
  isSignalingConnected: false,
  lastSyncTimestamp: null,
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    setConnectionStatus: (
      state,
      action: PayloadAction<CollaborationState['connectionStatus']>
    ) => {
      state.connectionStatus = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.activeUsers[action.payload.id] = action.payload;
    },
    removeUser: (state, action: PayloadAction<string>) => {
      delete state.activeUsers[action.payload];
    },
    updateUserCursor: (
      state,
      action: PayloadAction<{ userId: string; position: { x: number; y: number } }>
    ) => {
      if (state.activeUsers[action.payload.userId]) {
        state.activeUsers[action.payload.userId].cursor = action.payload.position;
        state.activeUsers[action.payload.userId].isActive = true;
        state.activeUsers[action.payload.userId].lastActivity = Date.now();
      }
    },
    addOperation: (state, action: PayloadAction<Operation>) => {
      state.operations.push(action.payload);
    },
    clearOperations: (state) => {
      state.operations = [];
    },
    setRtcEnabled: (state, action: PayloadAction<boolean>) => {
      state.isRtcEnabled = action.payload;
    },
    setSignalingConnected: (state, action: PayloadAction<boolean>) => {
      state.isSignalingConnected = action.payload;
    },
    setLastSyncTimestamp: (state, action: PayloadAction<number>) => {
      state.lastSyncTimestamp = action.payload;
    },
    updateUserActivity: (state, action: PayloadAction<string>) => {
      if (state.activeUsers[action.payload]) {
        state.activeUsers[action.payload].isActive = true;
        state.activeUsers[action.payload].lastActivity = Date.now();
      }
    },
    markUserInactive: (state, action: PayloadAction<string>) => {
      if (state.activeUsers[action.payload]) {
        state.activeUsers[action.payload].isActive = false;
      }
    },
  },
});

export const {
  setConnectionStatus,
  setError,
  addUser,
  removeUser,
  updateUserCursor,
  addOperation,
  clearOperations,
  setRtcEnabled,
  setSignalingConnected,
  setLastSyncTimestamp,
  updateUserActivity,
  markUserInactive,
} = collaborationSlice.actions;

export default collaborationSlice.reducer;
