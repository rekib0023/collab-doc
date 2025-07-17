import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAddWorkspaceMemberMutation,
  useRemoveWorkspaceMemberMutation,
  useUpdateWorkspaceMemberMutation,
} from "@/store/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  MoreHorizontal,
  User,
  UserCog,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Schema for invite form
const inviteFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.string().min(1, { message: "Please select a role" }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

// Schema for role update form
const roleFormSchema = z.object({
  role: z.string().min(1, { message: "Please select a role" }),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface WorkspaceMembersProps {
  workspaceId: string;
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
  onMemberChange?: () => void;
}

export function WorkspaceMembers({
  workspaceId,
  members,
  currentUserId,
  isOwner,
  onMemberChange,
}: WorkspaceMembersProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [addMember, { isLoading: isAdding }] = useAddWorkspaceMemberMutation();
  const [updateMember, { isLoading: isUpdating }] =
    useUpdateWorkspaceMemberMutation();
  const [removeMember, { isLoading: isRemoving }] =
    useRemoveWorkspaceMemberMutation();

  // Form for inviting new members
  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  // Form for updating member role
  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      role: "",
    },
  });

  // Handle invite submit
  async function onInviteSubmit(data: InviteFormValues) {
    try {
      await addMember({
        workspaceId,
        email: data.email,
        role: data.role,
      }).unwrap();

      inviteForm.reset();
      setInviteDialogOpen(false);
      if (onMemberChange) onMemberChange();
    } catch (error) {
      console.error("Failed to invite member:", error);
    }
  }

  // Handle role update submit
  async function onRoleUpdateSubmit(data: RoleFormValues) {
    if (!selectedMember) return;

    try {
      await updateMember({
        workspaceId,
        userId: selectedMember.id,
        role: data.role,
      }).unwrap();

      setRoleDialogOpen(false);
      if (onMemberChange) onMemberChange();
    } catch (error) {
      console.error("Failed to update member role:", error);
    }
  }

  // Handle member removal
  async function handleRemoveMember(memberId: string) {
    if (
      !confirm(
        "Are you sure you want to remove this member from the workspace?"
      )
    ) {
      return;
    }

    try {
      await removeMember({
        workspaceId,
        userId: memberId,
      }).unwrap();

      if (onMemberChange) onMemberChange();
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  }

  function handleOpenRoleDialog(member: Member) {
    setSelectedMember(member);
    roleForm.setValue("role", member.role);
    setRoleDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Members ({members.length})</h3>
        {isOwner && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a Team Member</DialogTitle>
                <DialogDescription>
                  Invite someone to join your workspace by email.
                </DialogDescription>
              </DialogHeader>

              <Form {...inviteForm}>
                <form
                  onSubmit={inviteForm.handleSubmit(onInviteSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="colleague@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={inviteForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Viewers can view documents, editors can edit them,
                          admins can manage workspace settings.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={isAdding}>
                      {isAdding && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Send Invite
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="flex items-center space-x-3">
              <Avatar>
                {member.avatar && (
                  <AvatarImage src={member.avatar} alt={member.name} />
                )}
                <AvatarFallback>
                  {member.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {member.name} {member.id === currentUserId && "(You)"}
                </p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  member.role === "owner"
                    ? "bg-primary/10 text-primary"
                    : member.role === "admin"
                      ? "bg-blue-500/10 text-blue-500"
                      : member.role === "editor"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-gray-500/10 text-gray-500"
                }`}
              >
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>

              {isOwner && member.id !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleOpenRoleDialog(member)}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isRemoving}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove from Workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="text-center py-8 border rounded-lg">
            <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <h4 className="text-lg font-medium mb-1">No members yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Invite team members to collaborate on this workspace.
            </p>
            {isOwner && (
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedMember?.name}.
            </DialogDescription>
          </DialogHeader>

          <Form {...roleForm}>
            <form
              onSubmit={roleForm.handleSubmit(onRoleUpdateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={roleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Viewers can view documents, editors can edit them, admins
                      can manage workspace settings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRoleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Role
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkspaceMembers;
