import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const fmtDate = (d?: string | Date | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

export const fmtTime = (d?: string | Date | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString();
}

export const fmtDateTime = (d?: string | Date | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}
