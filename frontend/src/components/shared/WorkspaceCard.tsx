import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";
import { Link } from "react-router-dom";

interface WorkspaceCardProps {
  workspace: {
    id: string;
    name: string;
    description?: string;
    member_count: number;
    document_count: number;
  };
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="truncate text-lg">
          {workspace.name}
        </CardTitle>
        <CardDescription className="truncate">
          {workspace.member_count} members
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {workspace.description || "No description available."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          {workspace.document_count} documents
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/workspaces/${workspace.id}`}>Open</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkspaceCard;
