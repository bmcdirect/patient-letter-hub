import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";

interface RecentMailingsProps {
  mailings: any[];
}

export default function RecentMailings({ mailings }: RecentMailingsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'printing':
        return <Badge className="bg-blue-100 text-blue-800">In Print</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'mailed':
        return <Badge className="bg-purple-100 text-purple-800">Mailed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEventTypeName = (eventType: string) => {
    switch (eventType) {
      case 'relocation':
        return 'Practice Relocation';
      case 'closure':
        return 'Practice Closure';
      case 'hipaa_breach':
        return 'HIPAA Breach Notice';
      default:
        return eventType || 'Custom Letter';
    }
  };

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-dark-navy">Recent Mailings</CardTitle>
          <Link href="/tracking">
            <a className="text-primary-blue text-sm font-medium hover:underline">View all</a>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {mailings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No mailings yet</p>
            <p className="text-sm text-gray-500 mt-1">Your recent mailings will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100">
                  <TableHead className="font-medium text-gray-600">Event Type</TableHead>
                  <TableHead className="font-medium text-gray-600">Recipients</TableHead>
                  <TableHead className="font-medium text-gray-600">Status</TableHead>
                  <TableHead className="font-medium text-gray-600">Date</TableHead>
                  <TableHead className="font-medium text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mailings.map((mailing) => (
                  <TableRow key={mailing.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-dark-navy">
                        {getEventTypeName(mailing.eventType)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mailing.templateType === 'template' ? 'Template' : 'Custom Letter'}
                      </div>
                    </TableCell>
                    <TableCell className="text-dark-navy">
                      {mailing.validRecipients || mailing.totalRecipients || 0}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(mailing.status)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatDate(mailing.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" className="text-primary-blue hover:underline text-sm font-medium p-0">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
