import React, { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface CenteredCardLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}

/**
 * A reusable centered card layout component for authentication screens and similar pages
 * that need centered content in a card format with a title and optional description.
 */
const CenteredCardLayout: React.FC<CenteredCardLayoutProps> = ({
  title,
  description,
  children,
  maxWidth = "sm:w-[350px]",
}) => {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className={`mx-auto flex w-full flex-col justify-center space-y-6 ${maxWidth}`}>
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>

        <Card>{children}</Card>
      </div>
    </div>
  );
};

export default CenteredCardLayout;
