import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  FileText,
  Package,
  Upload,
  Calendar,
  Settings,
  TrendingUp,
} from "lucide-react";

interface QuickActionsProps {
  stats: {
    activeQuotes: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

export function QuickActions({ stats }: QuickActionsProps) {
  const [, setLocation] = useLocation();

  const actions = [
    {
      title: "New Quote",
      description: "Create a new patient letter quote",
      icon: FileText,
      onClick: () => setLocation("/quotes/create"),
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "New Order",
      description: "Place a direct order",
      icon: Package,
      onClick: () => setLocation("/orders/create"),
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Upload Recipients",
      description: "Upload patient data file",
      icon: Upload,
      onClick: () => setLocation("/file-upload"),
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Calendar",
      description: "View production calendar",
      icon: Calendar,
      onClick: () => setLocation("/calendar"),
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  const statCards = [
    {
      title: "Active Quotes",
      value: stats.activeQuotes,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "In Progress",
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Completed",
      value: stats.completedOrders,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Card 
              key={action.title} 
              className="cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={action.onClick}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-full ${action.color} text-white`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>


    </div>
  );
}