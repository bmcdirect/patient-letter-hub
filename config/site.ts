import { SidebarNavItem, SiteConfig } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL;

export const siteConfig: SiteConfig = {
  name: "PatientLetterHub",
  description:
    "HIPAA-compliant patient communications platform for healthcare providers. Send letters, manage patient data, and ensure compliance with ease.",
  url: site_url,
  ogImage: `${site_url}/_static/og.jpg`,
  links: {
    twitter: "https://twitter.com/patientletterhub",
    github: "https://github.com/patientletterhub",
  },
  mailSupport: "support@patientletterhub.com",
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "Company",
    items: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
    ],
  },
  {
    title: "Product",
    items: [
      { title: "Security", href: "/security" },
      { title: "Customers", href: "/customers" },
      { title: "Pricing", href: "/pricing" },
      { title: "Support", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "HIPAA Compliance", href: "/security" },
      { title: "Patient Communications", href: "/about" },
      { title: "Healthcare Solutions", href: "/customers" },
      { title: "Get Started", href: "/sign-up" },
    ],
  },
];
