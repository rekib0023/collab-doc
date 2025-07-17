import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
} from "@/store/api";
import { zodResolver } from "@hookform/resolvers/zod";

import { Loader2 } from "lucide-react";

const workspaceSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Workspace name must be at least 3 characters" })
    .max(50, { message: "Workspace name must be less than 50 characters" }),
  description: z
    .string()
    .max(500, { message: "Description must be less than 500 characters" })
    .optional(),
  is_private: z.boolean().default(true),
});

export type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

export interface WorkspaceFormProps {
  workspaceId?: string;
  defaultValues?: Partial<WorkspaceFormValues>;
  onSuccess?: (workspaceId: string) => void;
}

export function WorkspaceForm({
  workspaceId,
  defaultValues = {
    name: "",
    description: "",
    is_private: true,
  },
  onSuccess,
}: WorkspaceFormProps) {
  const navigate = useNavigate();
  const isEditing = !!workspaceId;

  const [createWorkspace, { isLoading: isCreating }] =
    useCreateWorkspaceMutation();
  const [updateWorkspace, { isLoading: isUpdating }] =
    useUpdateWorkspaceMutation();

  const isSubmitting = isCreating || isUpdating;

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema) as any,
    defaultValues: defaultValues,
  });

  async function onSubmit(data: WorkspaceFormValues) {
    try {
      if (isEditing && workspaceId) {
        const result = await updateWorkspace({
          id: workspaceId,
          ...data,
        }).unwrap();
        if (onSuccess) onSuccess(result.id);
        else navigate(`/workspaces/${result.id}`);
      } else {
        const result = await createWorkspace(data).unwrap();
        if (onSuccess) onSuccess(result.id);
        else navigate(`/workspaces/${result.id}`);
      }
    } catch (error) {
      console.error("Failed to save workspace:", error);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Workspace" : "Create Workspace"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update your workspace details"
            : "Create a new workspace for your team to collaborate"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter workspace name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    This is the name of your workspace visible to all members.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this workspace"
                      className="resize-none"
                      rows={4}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description helps team members understand the
                    purpose of this workspace.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_private"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Private Workspace</FormLabel>
                    <FormDescription>
                      Only invited members can access this workspace.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update Workspace" : "Create Workspace"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default WorkspaceForm;
