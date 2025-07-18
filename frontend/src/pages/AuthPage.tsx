import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import CenteredCardLayout from "@/components/shared/CenteredCardLayout";
import TabsContainer from "@/components/shared/TabsContainer";
import useAuth from "@/hooks/useAuth";
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const AuthPage: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Update active tab based on route and update URL when tab changes
  useEffect(() => {
    if (location.pathname.includes("/auth/register")) {
      setActiveTab("register");
    } else {
      setActiveTab("login");
    }
  }, [location.pathname]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.pushState(null, "", `/auth/${value}`);
  };

  return (
    <>
      <CenteredCardLayout
        title="Collaborative Platform"
        description="Real-time collaboration for teams"
      >
        <div className="p-4">
          <TabsContainer
            defaultValue={activeTab}
            onTabChange={handleTabChange}
            className="w-full"
            tabs={[
              {
                value: "login",
                label: "Login",
                content: <LoginForm />
              },
              {
                value: "register",
                label: "Register",
                content: <RegisterForm />
              }
            ]}
          />
        </div>

        <div className="p-4 pt-0">
          <p className="text-center text-sm text-muted-foreground">
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
      </CenteredCardLayout>
    </>
  );
};

export default AuthPage;
