import React, { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import { ThemeProvider } from "@/components/theme-provider";
import { RootState } from "@/store";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {isAuthenticated && <Sidebar />}
          <main className="flex-1 overflow-auto">{children || <Outlet />}</main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default MainLayout;
