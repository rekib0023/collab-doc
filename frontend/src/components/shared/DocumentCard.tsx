import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Document } from "@/types/document";
import React from "react";
import { Link } from "react-router-dom";

interface DocumentCardProps {
  document: Document;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="h-6 w-6">
            <AvatarImage src={document.creator.avatar || ""} />
            <AvatarFallback>
              {document.creator.name[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">
            {document.creator.name}
          </span>
        </div>
        <CardTitle className="truncate text-lg">
          {document.name}
        </CardTitle>
        <CardDescription className="truncate">
          Edited{" "}
          {new Date(document.updated_at || document.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {document.description || "No description available."}
        </p>
      </CardContent>
      <div className="flex justify-between items-center p-4 pt-0">
        <span className="text-xs text-muted-foreground">
          Edited{" "}
          {new Date(document.updated_at || document.created_at).toLocaleDateString()}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/documents/${document.id}`}>Open</Link>
        </Button>
      </div>
    </Card>
  );
};

export default DocumentCard;
