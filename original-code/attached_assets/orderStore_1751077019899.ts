// Global order store for managing orders created from quote conversions
class OrderStore {
  private orders: any[] = [
    {
      id: 101,
      order_number: "O-2001",
      user_id: "user123",
      practice_id: 2,
      quote_id: 2,
      subject: "Provider Departure Notification",
      template_type: "custom",
      color_mode: "Black and White",
      recipient_count: 650,
      total_cost: "375.00",
      status: "draft",
      created_at: "2024-12-27T10:00:00Z",
      updated_at: "2024-12-27T10:00:00Z",
      practice_name: "Metro Pediatrics Group",
      practice_email: "admin@metropediatrics.com",
      notes: "Draft order from converted quote Q-1002"
    },
    {
      id: 102,
      order_number: "O-2002",
      user_id: "user123", 
      practice_id: 3,
      quote_id: 3,
      subject: "Practice Closure Announcement",
      template_type: "custom",
      color_mode: "Color",
      recipient_count: 1200,
      total_cost: "1621.00",
      status: "in-progress",
      created_at: "2024-12-26T15:30:00Z",
      updated_at: "2024-12-27T08:45:00Z",
      practice_name: "Valley Dental Associates",
      practice_email: "office@valleydental.com",
      notes: "Production started, expected completion Dec 30"
    },
    {
      id: 103,
      order_number: "O-2003",
      user_id: "user123",
      practice_id: 1,
      subject: "Annual Wellness Reminders",
      template_type: "custom",
      color_mode: "Color",
      recipient_count: 950,
      total_cost: "617.50",
      status: "completed",
      created_at: "2024-12-24T13:20:00Z",
      updated_at: "2024-12-26T16:00:00Z",
      fulfilled_at: "2024-12-26T16:00:00Z",
      practice_name: "Sunshine Family Medicine",
      practice_email: "info@sunshinefamily.com",
      notes: "Completed wellness campaign mailing"
    },
    {
      id: 104,
      order_number: "O-2004",
      user_id: "user123",
      practice_id: 4,
      subject: "Insurance Coverage Updates",
      template_type: "custom",
      color_mode: "Black and White",
      recipient_count: 1800,
      total_cost: "900.00",
      status: "delivered",
      created_at: "2024-12-22T09:15:00Z",
      updated_at: "2024-12-25T14:30:00Z",
      fulfilled_at: "2024-12-25T14:30:00Z",
      delivered_at: "2024-12-26T10:00:00Z",
      practice_name: "Riverside Medical Center",
      practice_email: "contact@riversidemedical.com",
      notes: "Successfully delivered insurance notification letters"
    },
    {
      id: 105,
      order_number: "O-2005",
      user_id: "user123",
      practice_id: 1,
      subject: "Holiday Schedule Changes",
      template_type: "custom",
      color_mode: "Color",
      recipient_count: 600,
      total_cost: "390.00",
      status: "draft",
      created_at: "2024-12-27T11:30:00Z",
      updated_at: "2024-12-27T11:30:00Z",
      practice_name: "Sunshine Family Medicine",
      practice_email: "info@sunshinefamily.com",
      notes: "Draft order for holiday hours notification"
    }
  ];
  private listeners: Array<() => void> = [];

  addOrder(order: any) {
    const maxId = Math.max(...this.orders.map(o => o.id), 105);
    const newOrder = {
      id: maxId + 1,
      order_number: `O-${2000 + maxId + 1}`,
      user_id: "user123",
      practice_id: order.practice_id || 1,
      quote_id: order.quote_id,
      subject: order.subject,
      template_type: order.template_type || "custom",
      color_mode: order.color_mode || "Color",
      recipient_count: order.recipient_count || 0,
      total_cost: order.total_cost || "0.00",
      status: "Draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      practice_name: order.practice_name,
      practice_email: order.practice_email
    };
    
    this.orders.push(newOrder);
    this.notifyListeners();
    return newOrder;
  }

  getOrders() {
    return [...this.orders];
  }

  updateOrderStatus(orderId: number, status: string) {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex !== -1) {
      this.orders[orderIndex].status = status;
      this.orders[orderIndex].updated_at = new Date().toISOString();
      if (status === "Completed") {
        this.orders[orderIndex].fulfilled_at = new Date().toISOString();
      }
      this.notifyListeners();
    }
  }

  deleteOrder(orderId: number) {
    this.orders = this.orders.filter(order => order.id !== orderId);
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const orderStore = new OrderStore();