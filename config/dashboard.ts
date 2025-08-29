import { UserRole } from "@prisma/client";

import { SidebarNavItem } from "types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      {
        href: "/dashboard",
        icon: "dashboard",
        title: "Dashboard",
        // Visible to both customers and admins
      },
      {
        href: "/orders",
        icon: "package",
        title: "Orders",
        // Visible to both customers and admins
      },
      {
        href: "/orders/create",
        icon: "add",
        title: "Create Order",
        authorizeOnly: UserRole.USER, // Only customers can create orders
      },
      {
        href: "/quotes",
        icon: "post",
        title: "Quotes",
        // Both roles can view quotes
      },
      {
        href: "/quotes/create",
        icon: "add",
        title: "Create Quote",
        authorizeOnly: UserRole.USER, // Only customers
      },
      {
        href: "/admin",
        icon: "laptop",
        title: "Admin Panel",
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "/admin/orders",
        icon: "package",
        title: "All Orders",
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "/file-upload",
        icon: "media",
        title: "File Upload",
        authorizeOnly: UserRole.USER, // Only customers
      },
    ],
  },
  {
    title: "OPTIONS",
    items: [
      { href: "/dashboard/profile", icon: "user", title: "Profile" },
      { href: "/", icon: "home", title: "Homepage" },
    ],
  },
];
