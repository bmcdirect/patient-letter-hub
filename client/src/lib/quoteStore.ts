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
      estimated_recipients: 1250,
      total_cost: "1625.00",
      status: "Quote",
      created_at: "2025-06-27T08:00:00Z",
      updated_at: "2025-06-27T08:00:00Z",
      practice_name: "Sunshine Dental",
      practice_email: "info@sunshinedental.com"
    },
    {
      id: 2,
      quote_number: "Q-1002",
      user_id: "user123",
      practice_id: 2,
      subject: "Provider Departure Notification",
      template_type: "custom",
      color_mode: "Black and White",
      estimated_recipients: 800,
      total_cost: "520.00",
      status: "Converted",
      converted_order_id: 15,
      created_at: "2025-06-26T14:30:00Z",
      updated_at: "2025-06-27T09:15:00Z",
      practice_name: "Healthy Smiles Family Dentistry",
      practice_email: "contact@healthysmiles.com"
    },
    {
      id: 3,
      quote_number: "Q-1003",
      user_id: "user123",
      practice_id: 1,
      subject: "HIPAA Breach Notification",
      template_type: "custom",
      color_mode: "Color",
      estimated_recipients: 450,
      total_cost: "585.00",
      status: "Quote",
      created_at: "2025-06-25T11:20:00Z",
      updated_at: "2025-06-25T11:20:00Z",
      practice_name: "Sunshine Dental",
      practice_email: "info@sunshinedental.com"
    }
  ];
  private listeners: Array<() => void> = [];

  getQuotes() {
    return [...this.quotes];
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