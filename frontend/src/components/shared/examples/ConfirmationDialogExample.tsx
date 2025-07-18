import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ConfirmationDialog from "../ConfirmationDialog";

/**
 * Example component demonstrating the usage of ConfirmationDialog
 * for delete operations and other destructive actions.
 */
const ConfirmationDialogExample: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = () => {
    // In a real implementation, this would call an API to delete an item
    console.log("Item successfully deleted");
    // You might also want to show a toast notification here
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Confirmation Dialog Example</h2>
      
      <div className="flex flex-col space-y-4">
        <Button 
          variant="destructive" 
          onClick={() => setIsDialogOpen(true)}
        >
          Delete Item
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete this item and remove it from our servers."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default ConfirmationDialogExample;
