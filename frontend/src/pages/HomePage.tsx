import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RootState } from "@/store";
import { useGetDocumentsQuery, useGetWorkspacesQuery } from "@/store/api";
import { Clock, FileText, Folder, Plus, Star } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  const { data: workspaces, isLoading: isLoadingWorkspaces } =
    useGetWorkspacesQuery(undefined, { skip: !isAuthenticated });

  const { data: recentDocuments, isLoading: isLoadingDocuments } =
    useGetDocumentsQuery("recent", { skip: !isAuthenticated });

  return (
    <div className="container py-6">
      {isAuthenticated ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">
              Welcome, {user?.name || "Collaborator"}
            </h1>
            <div className="flex space-x-2">
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
            </div>
          </div>

          <Tabs defaultValue="recent">
            <TabsList className="mb-4">
              <TabsTrigger value="recent">
                <Clock className="mr-2 h-4 w-4" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="workspaces">
                <Folder className="mr-2 h-4 w-4" />
                Workspaces
              </TabsTrigger>
              <TabsTrigger value="starred">
                <Star className="mr-2 h-4 w-4" />
                Starred
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-6">
              <h2 className="text-xl font-semibold">Recent Documents</h2>

              {isLoadingDocuments ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <Skeleton className="h-5 w-4/5 mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent className="pb-2">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-4 w-1/2" />
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              ) : recentDocuments && recentDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentDocuments.map((document) => (
                    <Card key={document.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="truncate text-lg">
                          {document.title}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {document.workspace?.name || "Personal"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {document.description || "No description available."}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          Edited{" "}
                          {new Date(document.updated_at).toLocaleDateString()}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/documents/${document.id}`}>Open</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                  <h3 className="text-lg font-medium mb-1">
                    No recent documents
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't created or edited any documents yet.
                  </p>
                  <Button asChild>
                    <Link to="/documents/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create a Document
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="workspaces" className="space-y-6">
              <h2 className="text-xl font-semibold">Your Workspaces</h2>

              {isLoadingWorkspaces ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <Skeleton className="h-5 w-4/5 mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent className="pb-2">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-4 w-1/2" />
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              ) : workspaces && workspaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workspaces.map((workspace) => (
                    <Card key={workspace.id} className="overflow-hidden">
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Folder className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                  <h3 className="text-lg font-medium mb-1">
                    No workspaces found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't created or joined any workspaces yet.
                  </p>
                  <Button asChild>
                    <Link to="/workspaces/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create a Workspace
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="starred" className="space-y-6">
              <h2 className="text-xl font-semibold">Starred Documents</h2>
              <div className="text-center py-8">
                <Star className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-lg font-medium mb-1">
                  No starred documents
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't starred any documents yet.
                </p>
              </div>
            </TabsContent>
          </Tabs>
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
