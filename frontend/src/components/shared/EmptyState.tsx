import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  actionIcon?: LucideIcon;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
  actionIcon: ActionIcon,
}) => {
  return (
    <div className="text-center py-8">
      <Icon className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {actionLabel && actionLink && (
        <Button asChild>
          <Link to={actionLink}>
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
