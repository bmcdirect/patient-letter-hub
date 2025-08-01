"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRoleFormProps extends React.HTMLAttributes<HTMLFormElement> {}

export function UserRoleForm({ className, ...props }: UserRoleFormProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Note: Role updates would typically be handled through your backend API
      // since Clerk doesn't store custom roles in the user object
      toast.success("Role update functionality would be implemented here.");
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={className} {...props}>
      <div className="grid gap-2">
        <Label htmlFor="role">Role</Label>
        <Select disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        className="mt-2"
        disabled={isLoading}
        size="sm"
        type="submit"
      >
        {isLoading && (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        )}
        Update role
      </Button>
    </form>
  );
}