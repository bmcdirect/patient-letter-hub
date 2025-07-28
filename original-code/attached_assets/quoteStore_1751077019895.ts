// Global quote store for managing quote status and conversions
class QuoteStore {
  private quotes: any[] = [
    {
      id: 1,
      quote_number: "Q-1001",
      user_id: "user123",
      practice_id: 1,
      subject: "Practice Relocation Notice",
      template_type: "custom",
      color_mode: "Color",
      estimated_recipients: 850,
      total_cost: "1205.50",
      status: "pending",
      created_at: "2024-12-27T09:30:00Z",
      updated_at: "2024-12-27T09:30:00Z",
      practice_name: "Sunshine Family Medicine",
      practice_email: "info@sunshinefamily.com",
      notes: "New location opening February 2025"
    },
    {
      id: 2,
      quote_number: "Q-1002",
      user_id: "user123",
      practice_id: 2,
      subject: "Provider Departure Notification",
      template_type: "custom",
      color_mode: "Black and White",
      estimated_recipients: 650,
      total_cost: "375.00",
      status: "converted",
      converted_order_id: 101,
      created_at: "2024-12-26T14:15:00Z",
      updated_at: "2024-12-27T10:00:00Z",
      practice_name: "Metro Pediatrics Group",
      practice_email: "admin@metropediatrics.com",
      notes: "Dr. Martinez retirement effective March 2025"
    },
    {
      id: 3,
      quote_number: "Q-1003",
      user_id: "user123",
      practice_id: 3,
      subject: "Practice Closure Announcement",
      template_type: "custom",
      color_mode: "Color",
      estimated_recipients: 1200,
      total_cost: "1621.00",
      status: "converted",
      converted_order_id: 102,
      created_at: "2024-12-25T11:00:00Z",
      updated_at: "2024-12-26T15:30:00Z",
      practice_name: "Valley Dental Associates",
      practice_email: "office@valleydental.com",
      notes: "Final patient notifications before closure"
    },
    {
      id: 4,
      quote_number: "Q-1004",
      user_id: "user123",
      practice_id: 4,
      subject: "New Services Available",
      template_type: "custom",
      color_mode: "Black and White",
      estimated_recipients: 2000,
      total_cost: "1000.00",
      status: "archived",
      created_at: "2024-12-20T16:45:00Z",
      updated_at: "2024-12-20T16:45:00Z",
      practice_name: "Riverside Medical Center",
      practice_email: "contact@riversidemedical.com",
      notes: "Marketing campaign for new cardiac services"
    }
  ];
  private listeners: Array<() => void> = [];

  getQuotes() {
    return [...this.quotes];
  }

  addQuote(quote: any) {
    this.quotes.push(quote);
    this.notifyListeners();
    return quote;
  }

  convertQuoteToOrder(quoteId: number, orderId: number) {
    const quoteIndex = this.quotes.findIndex(quote => quote.id === quoteId);
    if (quoteIndex !== -1) {
      this.quotes[quoteIndex].status = "Converted";
      this.quotes[quoteIndex].converted_order_id = orderId;
      this.quotes[quoteIndex].updated_at = new Date().toISOString();
      this.notifyListeners();
      return this.quotes[quoteIndex];
    }
    return null;
  }

  updateQuoteStatus(quoteId: number, status: string) {
    const quoteIndex = this.quotes.findIndex(quote => quote.id === quoteId);
    if (quoteIndex !== -1) {
      this.quotes[quoteIndex].status = status;
      this.quotes[quoteIndex].updated_at = new Date().toISOString();
      this.notifyListeners();
    }
  }

  deleteQuote(quoteId: number) {
    this.quotes = this.quotes.filter(quote => quote.id !== quoteId);
    this.notifyListeners();
  }

  getQuote(quoteId: number) {
    return this.quotes.find(quote => quote.id === quoteId);
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

export const quoteStore = new QuoteStore();