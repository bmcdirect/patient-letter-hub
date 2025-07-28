import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MapPin, Shield } from "lucide-react";

interface QuickActionsProps {
  onTemplateSelect: (template: any) => void;
}

export default function QuickActions({ onTemplateSelect }: QuickActionsProps) {
  const quickActions = [
    {
      title: "Practice Closure",
      description: "Notify patients of practice closure",
      icon: FileText,
      iconColor: "text-primary-blue",
      eventType: "closure",
    },
    {
      title: "Practice Relocation",
      description: "Inform patients of new location",
      icon: MapPin,
      iconColor: "text-teal-accent",
      eventType: "relocation",
    },
    {
      title: "HIPAA Breach",
      description: "Required breach notification",
      icon: Shield,
      iconColor: "text-alert-orange",
      eventType: "hipaa_breach",
    },
  ];

  const handleQuickAction = (eventType: string) => {
    window.location.href = '/order.html';
  };

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-dark-navy">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.eventType}
                variant="ghost"
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors h-auto"
                onClick={() => handleQuickAction(action.eventType)}
              >
                <Icon className={`h-5 w-5 ${action.iconColor} flex-shrink-0`} />
                <div className="flex-1 text-left">
                  <div className="font-medium text-dark-navy text-sm">{action.title}</div>
                  <div className="text-xs text-gray-600">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
