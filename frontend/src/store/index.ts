import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import userReducer from "@/store/slices/userSlice";
import canvasReducer from "@/store/slices/canvasSlice";
import collaborationReducer from "@/store/slices/collaborationSlice";
import authReducer from "@/store/slices/authSlice";
import { api } from "@/store/api";

export const store = configureStore({
  reducer: {
    user: userReducer,
    canvas: canvasReducer,
    collaboration: collaborationReducer,
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
