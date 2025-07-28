import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Building, 
  Calendar, 
  FileType,
  Receipt,
  Mail,
  FolderOpen,
  Users,
  BarChart3,
  Settings,
  Shield
} from "lucide-react";

// Customer navigation
const customerNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Quotes", href: "/quotes", icon: FileText },
  { name: "Orders", href: "/orders", icon: Package },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Project Files", href: "/project-files", icon: FolderOpen },
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Locations", href: "/locations", icon: Building },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Templates", href: "/templates", icon: FileType },
];

// Admin/Operations navigation
const adminNavigation = [
  { name: "Operations Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Quotes", href: "/admin/quotes", icon: FileText },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Templates", href: "/admin/templates", icon: FileType },
];

const settingsNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  // Get current user to check super admin status
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    staleTime: 10 * 60 * 1000,
  });

  // Detect if we're in admin context
  const isAdminContext = location.startsWith('/admin') || location.startsWith('/operations');
  
  // Choose navigation based on context
  const navigation = isAdminContext ? adminNavigation : customerNavigation;

  const isActive = (href: string) => {
    if (href === "/" && !isAdminContext) {
      return location === "/";
    }
    if (href === "/admin/dashboard" && isAdminContext) {
      return location === "/admin/dashboard";
    }
    return location.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
      <nav className="mt-8 px-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "text-primary-700 bg-primary-50 border-r-2 border-primary-500"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Settings section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="space-y-2">
            {settingsNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "text-primary-700 bg-primary-50 border-r-2 border-primary-500"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}
