import { Button } from "@/components/ui/button";

// Shared components
import CardGrid from "@/components/shared/CardGrid";
import DocumentCard from "@/components/shared/DocumentCard";
import EmptyState from "@/components/shared/EmptyState";
import LoadingCard from "@/components/shared/LoadingCard";
import PageHeader from "@/components/shared/PageHeader";
import TabsContainer from "@/components/shared/TabsContainer";
import WorkspaceCard from "@/components/shared/WorkspaceCard";

// Custom hooks
import useAuth from "@/hooks/useAuth";
import useDocuments from "@/hooks/useDocuments";
import useToast from "@/hooks/useToast";
import useWorkspaces from "@/hooks/useWorkspaces";
import { Document } from "@/types/document";
import { Clock, FileText, Folder, Plus, Star } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { success, error: showError } = useToast();
  
  // Use our custom hooks for cleaner data fetching
  const { workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();
  const { documents: recentDocuments, isLoading: isLoadingDocuments } = useDocuments("recent");
  
  // Handle document star/unstar
  const handleToggleStar = async (documentId: string, isStarred: boolean) => {
    try {
      console.log(`Toggling star for document ${documentId} to ${isStarred}`);      
      // This would be implemented with an actual API call
      // await toggleStarDocument(documentId).unwrap();
      success(
        isStarred ? "Document starred" : "Document unstarred", 
        "Your changes have been saved"
      );
    } catch (err) {
      showError(
        "Action failed", 
        "There was a problem updating the document. Please try again."
      );
      console.error("Failed to toggle star", err);
    }
  };

  return (
    <div className="container p-6">
      {isAuthenticated ? (
        <>
          <PageHeader
            title={`Welcome, ${user?.name || "Collaborator"}`}
            actions={
              <>
                <Button asChild>
                  <Link to="/workspaces/create">
                    <Plus className="mr-2 h-4 w-4" />
                    New Workspace
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/documents/create">
                    <Plus className="mr-2 h-4 w-4" />
                    New Document
                  </Link>
                </Button>
              </>
            }
          />

          <TabsContainer
            defaultValue="recent"
            className="w-full"
            tabs={[
              {
                value: "recent",
                label: (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Recent
                  </>
                ),
                content: (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Recent Documents</h2>
                    {isLoadingDocuments ? (
                      <CardGrid>
                        {Array(3)
                          .fill(0)
                          .map((_, i) => (
                            <LoadingCard key={i} />
                          ))}
                      </CardGrid>
                    ) : recentDocuments && recentDocuments.length > 0 ? (
                      <CardGrid>
                        {recentDocuments.map((document: Document) => (
                          <DocumentCard 
                            key={document.id} 
                            document={document} 
                            onStarToggle={(id) => handleToggleStar(id, !document.is_starred)} 
                          />
                        ))}
                      </CardGrid>
                    ) : (
                      <EmptyState
                        icon={FileText}
                        title="No recent documents"
                        description="You haven't created or edited any documents yet."
                        actionLabel="Create a Document"
                        actionLink="/documents/create"
                        actionIcon={Plus}
                      />
                    )}
                  </div>
                )
              },
              {
                value: "workspaces",
                label: (
                  <>
                    <Folder className="mr-2 h-4 w-4" />
                    Workspaces
                  </>
                ),
                content: (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Your Workspaces</h2>
                    {isLoadingWorkspaces ? (
                      <CardGrid>
                        {Array(3)
                          .fill(0)
                          .map((_, i) => (
                            <LoadingCard key={i} />
                          ))}
                      </CardGrid>
                    ) : workspaces && workspaces.length > 0 ? (
                      <CardGrid>
                        {workspaces.map((workspace) => (
                          <WorkspaceCard key={workspace.id} workspace={workspace} />
                        ))}
                      </CardGrid>
                    ) : (
                      <EmptyState
                        icon={Folder}
                        title="No workspaces found"
                        description="You haven't created or joined any workspaces yet."
                        actionLabel="Create a Workspace"
                        actionLink="/workspaces/create"
                        actionIcon={Plus}
                      />
                    )}
                  </div>
                )
              },
              {
                value: "starred",
                label: (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Starred
                  </>
                ),
                content: (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Starred Documents</h2>
                    <EmptyState
                      icon={Star}
                      title="No starred documents"
                      description="You haven't starred any documents yet."
                    />
                  </div>
                )
              }
            ]}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center space-y-6 max-w-2xl">
            <h1 className="text-4xl font-bold">
              Real-time Collaboration Platform
            </h1>
            <p className="text-xl text-muted-foreground">
              A powerful platform for teams to collaborate in real-time with
              document editing, version control, and integrated communication.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
