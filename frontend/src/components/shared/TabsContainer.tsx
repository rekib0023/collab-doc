import React, { ReactNode } from "react";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";

interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  count?: number;
}

interface TabsContainerProps {
  tabs: TabItem[];
  defaultValue: string;
  className?: string;
  orientation?: "horizontal" | "vertical";
  onTabChange?: (value: string) => void;
}

/**
 * A reusable component for handling tabbed interfaces throughout the application.
 * Provides consistent tab styling and behavior.
 */
const TabsContainer: React.FC<TabsContainerProps> = ({
  tabs,
  defaultValue,
  className = "",
  orientation = "horizontal",
  onTabChange,
}) => {
  return (
    <Tabs
      defaultValue={defaultValue}
      className={className}
      onValueChange={onTabChange}
      orientation={orientation === "vertical" ? "vertical" : undefined}
    >
      <TabsList className={orientation === "vertical" ? "flex-col h-auto" : "mb-4"}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={`flex items-center ${orientation === "vertical" ? "w-full" : ""}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 text-xs font-medium text-muted-foreground rounded-full bg-muted px-2.5 py-0.5">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default TabsContainer;
