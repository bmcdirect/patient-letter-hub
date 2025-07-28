import { Quote } from '@shared/schema';
import { create } from 'zustand';

interface QuoteStore {
  quotes: Quote[];
  setQuotes: (quotes: Quote[]) => void;
  addQuote: (quote: Quote) => void;
  updateQuote: (id: number, updates: Partial<Quote>) => void;
  removeQuote: (id: number) => void;
}

export const useQuoteStore = create<QuoteStore>((set) => ({
  quotes: [],
  setQuotes: (quotes) => set({ quotes }),
  addQuote: (quote) => set((state) => ({ quotes: [quote, ...state.quotes] })),
  updateQuote: (id, updates) => set((state) => ({
    quotes: state.quotes.map(quote => 
      quote.id === id ? { ...quote, ...updates } : quote
    )
  })),
  removeQuote: (id) => set((state) => ({
    quotes: state.quotes.filter(quote => quote.id !== id)
  })),
}));
