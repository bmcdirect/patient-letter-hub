import { Card, CardContent } from "@/components/ui/card";
import { Clock, Printer, CheckCircle } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    pendingApproval: number;
    inPrint: number;
    delivered: number;
  };
  loading?: boolean;
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Pending Approval",
      value: stats?.pendingApproval || 0,
      subtitle: "Awaiting review",
      icon: Clock,
      iconColor: "text-yellow-600",
      iconBg: "bg-yellow-100",
    },
    {
      title: "In Print",
      value: stats?.inPrint || 0,
      subtitle: "Being processed",
      icon: Printer,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "Delivered",
      value: stats?.delivered || 0,
      subtitle: "This month",
      icon: CheckCircle,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-dark-navy mt-1">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-full flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} h-6 w-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
