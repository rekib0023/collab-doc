import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'text' | 'path';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  points?: [number, number][];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  layer: number;
  locked?: boolean;
  hidden?: boolean;
  createdBy: string;
  updatedAt: number;
}

interface CanvasViewport {
  zoom: number;
  panX: number;
  panY: number;
}

interface CanvasState {
  objects: Record<string, CanvasObject>;
  selectedObjectIds: string[];
  viewport: CanvasViewport;
  history: {
    past: Array<Record<string, CanvasObject>>;
    future: Array<Record<string, CanvasObject>>;
  };
  activeTool: 'select' | 'rectangle' | 'circle' | 'line' | 'text' | 'path' | null;
}

const initialState: CanvasState = {
  objects: {},
  selectedObjectIds: [],
  viewport: {
    zoom: 1,
    panX: 0,
    panY: 0,
  },
  history: {
    past: [],
    future: [],
  },
  activeTool: null,
};

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    addObject: (state, action: PayloadAction<CanvasObject>) => {
      state.history.past.push({ ...state.objects });
      state.history.future = [];
      state.objects[action.payload.id] = action.payload;
    },
    updateObject: (state, action: PayloadAction<Partial<CanvasObject> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      if (state.objects[id]) {
        state.history.past.push({ ...state.objects });
        state.history.future = [];
        state.objects[id] = {
          ...state.objects[id],
          ...updates,
          updatedAt: Date.now(),
        };
      }
    },
    deleteObject: (state, action: PayloadAction<string>) => {
      state.history.past.push({ ...state.objects });
      state.history.future = [];
      delete state.objects[action.payload];
      state.selectedObjectIds = state.selectedObjectIds.filter(
        (id) => id !== action.payload
      );
    },
    setSelectedObjects: (state, action: PayloadAction<string[]>) => {
      state.selectedObjectIds = action.payload;
    },
    setViewport: (state, action: PayloadAction<Partial<CanvasViewport>>) => {
      state.viewport = { ...state.viewport, ...action.payload };
    },
    setActiveTool: (
      state,
      action: PayloadAction<CanvasState['activeTool']>
    ) => {
      state.activeTool = action.payload;
    },
    undo: (state) => {
      if (state.history.past.length > 0) {
        const previous = state.history.past.pop();
        if (previous) {
          state.history.future.push({ ...state.objects });
          state.objects = previous;
        }
      }
    },
    redo: (state) => {
      if (state.history.future.length > 0) {
        const next = state.history.future.pop();
        if (next) {
          state.history.past.push({ ...state.objects });
          state.objects = next;
        }
      }
    },
  },
});

export const {
  addObject,
  updateObject,
  deleteObject,
  setSelectedObjects,
  setViewport,
  setActiveTool,
  undo,
  redo,
} = canvasSlice.actions;

export default canvasSlice.reducer;
