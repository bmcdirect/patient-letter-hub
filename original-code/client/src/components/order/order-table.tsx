import { Button } from "@/components/ui/button";
import { Eye, Edit, Truck, Download } from "lucide-react";
import type { Order } from "@shared/schema";

interface OrderTableProps {
  orders: Order[];
  onViewOrder: (id: number) => void;
  onEditOrder: (id: number) => void;
  onTrackOrder: (id: number) => void;
  onDownloadProof: (id: number) => void;
}

export function OrderTable({ 
  orders, 
  onViewOrder, 
  onEditOrder, 
  onTrackOrder, 
  onDownloadProof 
}: OrderTableProps) {
  // Null-safe date formatter
  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString() : '—';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recipients
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Production Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {order.orderNumber}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.subject}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {order.recipientCount || order.estimatedRecipients}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {fmtDate(order.productionStartDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${order.totalCost ? parseFloat(order.totalCost).toFixed(2) : '0.00'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => onViewOrder(order.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditOrder(order.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onTrackOrder(order.id)}>
                    <Truck className="h-4 w-4" />
                  </Button>
                  {order.status === 'completed' && (
                    <Button variant="ghost" size="sm" onClick={() => onDownloadProof(order.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
