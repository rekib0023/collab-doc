import WorkspaceForm from "@/components/workspace/WorkspaceForm";
import React from "react";

const CreateWorkspacePage: React.FC = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Create a New Workspace
      </h1>
      <WorkspaceForm />
    </div>
  );
};

export default CreateWorkspacePage;
