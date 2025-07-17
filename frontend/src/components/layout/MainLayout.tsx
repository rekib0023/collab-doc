import React, { ReactNode } from "react";
import { Outlet } from "react-router-dom";

import { ThemeProvider } from "@/components/theme-provider";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children || <Outlet />}</main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default MainLayout;
