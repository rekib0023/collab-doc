import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCreateDocumentMutation } from "@/store/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const DocumentCreatePage: React.FC = () => {
  const [name, setName] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workspaceId = searchParams.get("workspace");

  const [
    createDocument,
    { isLoading, isSuccess, data: newDocument, isError, error },
  ] = useCreateDocumentMutation();

  useEffect(() => {
    if (isSuccess && newDocument) {
      toast.success("Document created successfully!");
      navigate(`/documents/${newDocument.id}`);
    }
    if (isError) {
      const apiError = error as any;
      toast.error(apiError?.data?.detail || "Failed to create document.");
      console.error(error);
    }
  }, [isSuccess, newDocument, isError, error, navigate]);

  useEffect(() => {
    if (!workspaceId) {
      toast.error("Workspace ID is missing. Cannot create document.");
      navigate(-1); // Go back to the previous page
    }
  }, [workspaceId, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && workspaceId) {
      createDocument({ workspaceId, name });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Document Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter document name"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? "Creating..." : "Create Document"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentCreatePage;
