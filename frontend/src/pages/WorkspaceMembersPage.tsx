import React from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useGetWorkspaceByIdQuery } from "@/store/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import WorkspaceMembers from "@/components/workspace/WorkspaceMembers";
import { ArrowLeft, Users } from "lucide-react";

const WorkspaceMembersPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useSelector((state: RootState) => state.auth);

  const {
    data: workspace,
    isLoading,
    error,
    refetch,
  } = useGetWorkspaceByIdQuery(workspaceId || "", { skip: !workspaceId });

  // Determine if current user is workspace owner
  const isOwner = workspace?.members?.some(
    (member: any) => member.id === user?.id && member.role === "owner"
  );

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32 mb-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="container py-6">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              Error Loading Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>
              Unable to load the workspace. It may not exist or you don't have
              access to it.
            </p>
            <Button asChild>
              <Link to="/workspaces">Return to Workspaces</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to={`/workspaces/${workspaceId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Manage Members</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {workspace.name} - Members
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage members and their roles in this workspace
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <WorkspaceMembers
            workspaceId={workspaceId || ""}
            members={workspace.members || []}
            currentUserId={user?.id || ""}
            isOwner={isOwner}
            onMemberChange={refetch}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceMembersPage;
