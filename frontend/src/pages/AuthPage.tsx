import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RootState } from "@/store";
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

const AuthPage: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.pathname.includes("/auth/register")) return "register";
    return "login";
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Collaborative Platform
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time collaboration for teams
          </p>
        </div>

        <Card>
          <CardHeader className="p-4 pb-2">
            <Tabs defaultValue={getActiveTab()} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="login"
                  onClick={() =>
                    window.history.pushState(null, "", "/auth/login")
                  }
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  onClick={() =>
                    window.history.pushState(null, "", "/auth/register")
                  }
                >
                  Register
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Routes>
              <Route path="login" element={<LoginForm />} />
              <Route path="register" element={<RegisterForm />} />
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
          </CardContent>
        </Card>

        <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <a
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
