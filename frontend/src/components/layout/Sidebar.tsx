import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import {
  ChevronRight,
  FileText,
  Folder,
  Home,
  PlusCircle,
  Settings,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isWorkspacesOpen, setIsWorkspacesOpen] = useState(true);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { workspaces } = useSelector((state: RootState) => state.collaboration);

  const mainNavItems: NavItem[] = [
    {
      title: "Home",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Documents",
      href: "/documents",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Teams",
      href: "/teams",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="hidden border-r bg-background lg:block lg:w-64">
      <div className="flex h-full flex-col">
        <ScrollArea className="flex-1 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    location.pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "transparent"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {isAuthenticated && (
            <div className="px-3 py-4">
              <Collapsible
                open={isWorkspacesOpen}
                onOpenChange={setIsWorkspacesOpen}
                className="space-y-2"
              >
                <div className="flex items-center justify-between px-3">
                  <h2 className="text-sm font-semibold">Workspaces</h2>
                  <div className="flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <PlusCircle className="h-4 w-4" />
                          <span className="sr-only">Add workspace</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create workspace</TooltipContent>
                    </Tooltip>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ChevronRight
                          className={cn("h-4 w-4 transition-transform", {
                            "transform rotate-90": isWorkspacesOpen,
                          })}
                        />
                        <span className="sr-only">Toggle workspaces</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent className="space-y-1">
                  {workspaces?.length > 0 ? (
                    workspaces.map((workspace) => (
                      <Link
                        key={workspace.id}
                        to={`/workspaces/${workspace.id}`}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                          location.pathname === `/workspaces/${workspace.id}`
                            ? "bg-accent/50 text-accent-foreground"
                            : "transparent"
                        )}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        <span className="truncate">{workspace.name}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No workspaces found
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default Sidebar;
