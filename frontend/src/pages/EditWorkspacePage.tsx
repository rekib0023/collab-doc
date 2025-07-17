import { Skeleton } from "@/components/ui/skeleton";
import WorkspaceForm from "@/components/workspace/WorkspaceForm";
import { useGetWorkspaceByIdQuery } from "@/store/api";
import React from "react";
import { useParams } from "react-router-dom";

const EditWorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const {
    data: workspace,
    isLoading,
    error,
  } = useGetWorkspaceByIdQuery(workspaceId || "", { skip: !workspaceId });

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-1/3 mx-auto mb-6" />
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">
          Unable to load the workspace. It may not exist or you don't have
          access to edit it.
        </p>
      </div>
    );
  }

  const defaultValues = {
    name: workspace.name,
    description: workspace.description || "",
    is_private: workspace.is_private,
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Edit Workspace</h1>
      <WorkspaceForm workspaceId={workspaceId} defaultValues={defaultValues} />
    </div>
  );
};

export default EditWorkspacePage;
