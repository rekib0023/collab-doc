import CardGrid from "@/components/shared/CardGrid";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import DocumentCard from "@/components/shared/DocumentCard";
import EmptyState from "@/components/shared/EmptyState";
import LoadingCard from "@/components/shared/LoadingCard";
import PageHeader from "@/components/shared/PageHeader";
import TabsContainer from "@/components/shared/TabsContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useDialog from "@/hooks/useDialog";
import useDocuments from "@/hooks/useDocuments";
import useToast from "@/hooks/useToast";
import useWorkspace from "@/hooks/useWorkspace";
import { useDeleteWorkspaceMutation } from "@/store/api";
import { Document } from "@/types/document";
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
import { Link } from "react-router-dom";

const WorkspacePage: React.FC = () => {
  // Use our custom hooks for cleaner code
  // Auth state is handled within the useWorkspace and useDocuments hooks
  const { workspace, workspaceId, isLoading, error } = useWorkspace();
  const { documents, isLoading: documentsLoading, error: documentsError } = useDocuments(workspaceId || "");
  const { isOpen: isDeleteDialogOpen, open: openDeleteDialog, close: closeDeleteDialog } = useDialog();
  const { success, error: showError } = useToast();
  const [deleteWorkspace] = useDeleteWorkspaceMutation();

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;
    try {
      await deleteWorkspace(workspaceId).unwrap();
      success("Workspace deleted", "The workspace was successfully deleted");
      // Navigate after successful deletion
      window.location.href = "/";
    } catch (err) {
      showError("Failed to delete workspace", "Please try again later");
      console.error("Failed to delete workspace", err);
    }
    closeDeleteDialog();
  };

  if (isLoading || documentsLoading) {
    return (
      <div className="container p-6 space-y-6">
        {/* Loading header */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-1/3">
            <LoadingCard headerLines={1} lines={0} footerLines={0} />
          </div>
          <div className="h-10 w-32">
            <LoadingCard headerLines={1} lines={0} footerLines={0} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <LoadingCard headerLines={1} lines={0} footerLines={0} />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <LoadingCard key={i} headerLines={0} lines={1} footerLines={0} />
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <LoadingCard headerLines={1} lines={0} footerLines={0} />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <LoadingCard key={i} headerLines={0} lines={1} footerLines={0} />
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workspace || documentsError) {
    return (
      <div className="container p-6">
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
    <div className="container p-6 space-y-6">
      <PageHeader
        title={workspace.name}
        description={workspace.description}
        actions={
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
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={openDeleteDialog}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <TabsContainer
        defaultValue="documents"
        className="w-full"
        tabs={[
          {
            value: "documents",
            label: (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </>
            ),
            content: (
              <div className="space-y-6">
                <CardGrid>
                  {documents && documents.length > 0 ? (
                    documents.map((document: Document) => (
                      <DocumentCard key={document.id} document={document} />
                    ))
                  ) : (
                    <div className="col-span-full">
                      <EmptyState
                        icon={FileText}
                        title="No documents yet"
                        description="This workspace doesn't have any documents yet."
                        actionLabel="Create Document"
                        actionLink={`/documents/create?workspace=${workspaceId}`}
                        actionIcon={Plus}
                      />
                    </div>
                  )}
                </CardGrid>
              </div>
            )
          },
          {
            value: "members",
            label: (
              <>
                <Users className="mr-2 h-4 w-4" />
                Members
              </>
            ),
            content: (
              <div className="space-y-6">
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
                          <EmptyState
                            icon={Users}
                            title="No members"
                            description="This workspace doesn't have any members yet."
                          />
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
              </div>
            )
          },
          {
            value: "activity",
            label: (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Activity
              </>
            ),
            content: (
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
                      <EmptyState
                        icon={Clock}
                        title="No recent activity"
                        description="This workspace doesn't have any activity yet."
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          }
        ]}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        description={`Are you sure you want to delete workspace "${workspace?.name}"? This action cannot be undone and will permanently delete all documents in this workspace.`}
        confirmText="Delete Workspace"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default WorkspacePage;
