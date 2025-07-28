import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";

interface ComplianceAlertsProps {
  practiceId?: number;
}

export default function ComplianceAlerts({ practiceId }: ComplianceAlertsProps) {
  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts"],
    enabled: !!practiceId,
  });

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-dark-navy">Compliance Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No active alerts</p>
            <p className="text-xs text-gray-500 mt-1">Compliance notifications will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <AlertTriangle className="h-5 w-5 text-alert-orange mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-dark-navy text-sm">{alert.title}</div>
                  <div className="text-xs text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: alert.bodyHtml }} />
                  <Button variant="ghost" className="text-primary-blue text-xs font-medium mt-2 p-0 h-auto hover:underline">
                    Generate Notice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
