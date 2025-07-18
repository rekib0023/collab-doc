import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "@/components/layout/MainLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import AuthPage from "@/pages/AuthPage";
import CreateWorkspacePage from "@/pages/CreateWorkspacePage";
import DocumentPage from "@/pages/DocumentPage";
import DocumentCreatePage from "@/pages/DocumentCreatePage";
import EditWorkspacePage from "@/pages/EditWorkspacePage";
import HomePage from "@/pages/HomePage";
import WorkspaceMembersPage from "@/pages/WorkspaceMembersPage";
import WorkspacePage from "@/pages/WorkspacePage";
import { RootState } from "@/store";

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ToastProvider>
        <MainLayout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/*" element={<AuthPage />} />

            {/* Workspace routes */}
            <Route path="/workspaces">
              <Route
                index
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="create"
                element={
                  <ProtectedRoute>
                    <CreateWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":workspaceId"
                element={
                  <ProtectedRoute>
                    <WorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":workspaceId/edit"
                element={
                  <ProtectedRoute>
                    <EditWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":workspaceId/members"
                element={
                  <ProtectedRoute>
                    <WorkspaceMembersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":workspaceId/documents/create"
                element={
                  <ProtectedRoute>
                    <DocumentCreatePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Document routes */}
            <Route path="/documents">
              <Route
                index
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="create"
                element={
                  <ProtectedRoute>
                    <DocumentCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path=":documentId"
                element={
                  <ProtectedRoute>
                    <DocumentPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirect legacy routes */}
            <Route
              path="/workspace/:id"
              element={<Navigate to="/workspaces/:id" replace />}
            />

            {/* 404 route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
