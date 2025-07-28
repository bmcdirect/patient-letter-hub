import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Plus, 
  FileText, 
  Truck, 
  CreditCard, 
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'New Mailing', href: '/new-mailing', icon: Plus },

  { name: 'Tracking', href: '/tracking', icon: Truck },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <nav className="w-64 bg-soft-grey min-h-screen border-r border-gray-200">
      <div className="p-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
                    isActive
                      ? "bg-primary-blue text-white"
                      : "text-dark-navy hover:bg-white/70"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
