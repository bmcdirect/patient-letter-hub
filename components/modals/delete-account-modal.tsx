// TEMP STUB: replace with real modal implementation when available.
// Rollback: delete this file and restore original implementation.
"use client";

import { ReactNode } from "react";

type DeleteAccountModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

export default function DeleteAccountModal({
  open = false,
  onOpenChange,
  children,
}: DeleteAccountModalProps) {
  // Minimal no-op client component to satisfy imports.
  // Do not render UI to avoid UX regressions until implemented.
  return null;
}