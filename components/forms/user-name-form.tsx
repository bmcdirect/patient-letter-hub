"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";
import { toast } from "sonner";

interface UserNameFormProps extends React.HTMLAttributes<HTMLFormElement> {}

export function UserNameForm({ className, ...props }: UserNameFormProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Update user name in Clerk
      await user?.update({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });

      toast.success("Name updated successfully.");
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={className} {...props}>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          className="h-9"
          defaultValue={user?.fullName || ""}
          disabled={isLoading}
        />
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
        Update name
      </Button>
    </form>
  );
}