import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RootState } from "@/store";
import { useGetWorkspaceByIdQuery } from "@/store/api";
import {
  Clock,
  Edit,
  FileText,
  MoreHorizontal,
  Plus,
  Settings,
  Share2,
  Trash,
  Users,
} from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";

const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const {
    data: workspace,
    isLoading,
    error,
  } = useGetWorkspaceByIdQuery(workspaceId || "", {
    skip: !workspaceId || !isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32 mb-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32 mb-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-muted-foreground mt-1">
              {workspace.description}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button asChild>
            <Link to={`/documents/create?workspace=${workspaceId}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Document
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  to={`/workspaces/${workspaceId}/edit`}
                  className="cursor-pointer flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Workspace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={`/workspaces/${workspaceId}/settings`}
                  className="cursor-pointer flex items-center"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={`/workspaces/${workspaceId}/members`}
                  className="cursor-pointer flex items-center"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Members
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={`/workspaces/${workspaceId}/share`}
                  className="cursor-pointer flex items-center"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive cursor-pointer flex items-center">
                <Trash className="mr-2 h-4 w-4" />
                Delete Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="documents">
        <TabsList className="mb-4">
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspace.documents && workspace.documents.length > 0 ? (
              workspace.documents.map((document: any) => (
                <Card key={document.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="truncate text-lg">
                      {document.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Last edited{" "}
                      {new Date(document.updated_at).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {document.description || "No description available."}
                    </p>
                  </CardContent>
                  <div className="flex justify-end p-4 pt-0">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/documents/${document.id}`}>Open</Link>
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-lg font-medium mb-1">No documents yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This workspace doesn't have any documents yet.
                </p>
                <Button asChild>
                  <Link to={`/documents/create?workspace=${workspaceId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Document
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workspace.members && workspace.members.length > 0 ? (
                    workspace.members.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {member.role}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                      <h3 className="text-lg font-medium mb-1">No members</h3>
                      <p className="text-sm text-muted-foreground">
                        This workspace doesn't have any members yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Invite Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add team members to collaborate on documents within this
                    workspace.
                  </p>
                  <Button className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Invite People
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspace.activity && workspace.activity.length > 0 ? (
                  workspace.activity.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 border-b pb-3 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                        {item.user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p>{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                    <h3 className="text-lg font-medium mb-1">
                      No recent activity
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This workspace doesn't have any activity yet.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkspacePage;
