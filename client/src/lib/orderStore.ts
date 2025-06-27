// Global order store for managing orders created from quote conversions
class OrderStore {
  private orders: any[] = [];
  private listeners: Array<() => void> = [];

  addOrder(order: any) {
    const newOrder = {
      id: this.orders.length + 6, // Continue from mock data IDs
      order_number: `O-${2006 + this.orders.length}`,
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