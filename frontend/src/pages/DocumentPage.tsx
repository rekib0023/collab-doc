import CollaborativeEditor from "@/components/collaboration/CollaborativeEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDocumentQuery } from "@/store/api";
import { Download, History, Save, Share2, Users } from "lucide-react";
import React from "react";
import { useParams } from "react-router-dom";

const DocumentPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  // These will be used for future functionality
  // const dispatch = useDispatch<AppDispatch>();
  // const { user } = useSelector((state: RootState) => state.auth);

  // Fetch document data
  const {
    data: document,
    isLoading,
    isError,
    error,
  } = useGetDocumentQuery({ documentId: documentId! }, { skip: !documentId });

  if (isLoading) {
    return (
      <div className="container py-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full rounded-md" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Document</h2>
        <p className="text-muted-foreground mb-6">
          {error
            ? String(error)
            : "Document not found or you don't have permission to access it."}
        </p>
        <Button variant="default" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{document.title}</h1>
          <p className="text-sm text-muted-foreground">
            Workspace: {document.workspace?.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-1" />
            <span>Collaborators</span>
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            <span>Share</span>
          </Button>
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-1" />
            <span>History</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            <span>Export</span>
          </Button>
          <Button variant="default" size="sm">
            <Save className="h-4 w-4 mr-1" />
            <span>Save</span>
          </Button>
        </div>
      </div>

      <CollaborativeEditor documentId={documentId || ""} />

      <div className="mt-6 text-sm text-muted-foreground">
        <p>Last edited {new Date(document.updated_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DocumentPage;
