"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandTrigger,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icons } from "@/components/shared/icons";

interface ProjectSwitcherProps {}

export function ProjectSwitcher({}: ProjectSwitcherProps) {
  const { user } = useUser();
  const [open, setOpen] = React.useState(false);

  if (!user) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a project"
          className="w-[200px] justify-between"
        >
          <Icons.logo className="mr-2 h-4 w-4" />
          {user.fullName || "Select project..."}
          <Icons.chevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search project..." />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup heading="Projects">
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                }}
                className="text-sm"
              >
                <Icons.logo className="mr-2 h-4 w-4" />
                {user.fullName || "Current User"}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <Icons.plus className="mr-2 h-4 w-4" />
                Create Project
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
