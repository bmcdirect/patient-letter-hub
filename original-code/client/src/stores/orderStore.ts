import { Order } from '@shared/schema';
import { create } from 'zustand';

interface OrderStore {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: number, updates: Partial<Order>) => void;
  removeOrder: (id: number) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (id, updates) => set((state) => ({
    orders: state.orders.map(order => 
      order.id === id ? { ...order, ...updates } : order
    )
  })),
  removeOrder: (id) => set((state) => ({
    orders: state.orders.filter(order => order.id !== id)
  })),
}));
