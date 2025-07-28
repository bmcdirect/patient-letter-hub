import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Order, Quote, Practice } from "@shared/schema";

interface CalendarEvent {
  id: string;
  title: string;
  type: 'quote' | 'order-draft' | 'order-progress' | 'order-completed' | 'order-delivered';
  date: Date;
  entityType: 'quote' | 'order';
  entityId: number;
  status: string;
}

interface ProductionCalendarProps {
  currentDate: Date;
}

export function ProductionCalendar({ currentDate }: ProductionCalendarProps) {
  const [, setLocation] = useLocation();
  
  // Fetch real data from database
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });
  
  const { data: quotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });
  
  const { data: practices } = useQuery<Practice[]>({
    queryKey: ["/api/practices"],
  });

  // Convert orders and quotes to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];
    
    // Add quote events
    if (quotes && practices) {
      quotes.forEach(quote => {
        if (!quote.createdAt) return; // Skip if no creation date
        
        const practice = practices.find(p => p.id === quote.practiceId);
        const practiceName = practice?.name || 'Unknown Practice';
        
        calendarEvents.push({
          id: `quote-${quote.id}`,
          title: `${practiceName} - Quote`,
          type: 'quote',
          date: new Date(quote.createdAt),
          entityType: 'quote',
          entityId: quote.id,
          status: quote.status || 'pending'
        });
      });
    }
    
    // Add order events
    if (orders && practices) {
      orders.forEach(order => {
        // Use preferredMailDate if available, otherwise fall back to createdAt
        const eventDate = order.preferredMailDate || order.createdAt;
        if (!eventDate) return; // Skip if no date available
        
        const practice = practices.find(p => p.id === order.practiceId);
        const practiceName = practice?.name || 'Unknown Practice';
        
        let eventType: CalendarEvent['type'] = 'order-draft';
        let eventTitle = `${practiceName} - ${order.preferredMailDate ? 'Mail Date' : 'Draft'}`;
        
        switch (order.status) {
          case 'in-progress':
            eventType = 'order-progress';
            eventTitle = `${practiceName} - ${order.preferredMailDate ? 'Mail Date (In Progress)' : 'In Progress'}`;
            break;
          case 'completed':
            eventType = 'order-completed';
            eventTitle = `${practiceName} - ${order.preferredMailDate ? 'Mail Date (Completed)' : 'Completed'}`;
            break;
          case 'delivered':
            eventType = 'order-delivered';
            eventTitle = `${practiceName} - ${order.preferredMailDate ? 'Mail Date (Delivered)' : 'Delivered'}`;
            break;
        }
        
        calendarEvents.push({
          id: `order-${order.id}`,
          title: eventTitle,
          type: eventType,
          date: new Date(eventDate),
          entityType: 'order',
          entityId: order.id,
          status: order.status || 'draft'
        });
        
        // Add additional events for production dates if available
        if (order.productionStartDate) {
          calendarEvents.push({
            id: `order-${order.id}-start`,
            title: `${practiceName} - Production Start`,
            type: 'order-progress',
            date: new Date(order.productionStartDate),
            entityType: 'order',
            entityId: order.id,
            status: 'production-start'
          });
        }
        
        if (order.productionEndDate) {
          calendarEvents.push({
            id: `order-${order.id}-end`,
            title: `${practiceName} - Production End`,
            type: 'order-completed',
            date: new Date(order.productionEndDate),
            entityType: 'order',
            entityId: order.id,
            status: 'production-end'
          });
        }
        
        if (order.fulfilledAt) {
          calendarEvents.push({
            id: `order-${order.id}-fulfilled`,
            title: `${practiceName} - Fulfilled`,
            type: 'order-delivered',
            date: new Date(order.fulfilledAt),
            entityType: 'order',
            entityId: order.id,
            status: 'fulfilled'
          });
        }
      });
    }
    
    return calendarEvents;
  }, [orders, quotes, practices]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'quote':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'order-draft': 
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'order-progress':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'order-completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'order-delivered':
        return 'bg-primary-100 text-primary-800 hover:bg-primary-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.entityType === 'quote') {
      // Navigate to quotes page - the edit functionality will be handled there
      setLocation(`/quotes`);
    } else if (event.entityType === 'order') {
      // Navigate to orders page - the edit functionality will be handled there
      setLocation(`/orders`);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDay = new Date(year, month, -i);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        events: []
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter(event => 
        event.date.getDate() === day &&
        event.date.getMonth() === month &&
        event.date.getFullYear() === year
      );
      
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents,
        isToday: new Date().toDateString() === date.toDateString()
      });
    }

    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        events: []
      });
    }

    return days;
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6">
      {/* Calendar Days Header */}
      <div className="grid grid-cols-7 gap-px mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day, index) => (
          <div
            key={index}
            className={`h-24 p-2 ${
              day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
            } ${day.isToday ? 'border-2 border-primary-500' : ''}`}
          >
            <div className={`text-sm ${
              day.isCurrentMonth 
                ? day.isToday 
                  ? 'text-gray-900 font-semibold'
                  : 'text-gray-900'
                : 'text-gray-400'
            }`}>
              {day.date.getDate()}
            </div>
            
            <div className="mt-1 space-y-1">
              {day.events.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer transition-colors ${getEventColor(event.type)}`}
                  title={`${event.title} - Click to edit`}
                  onClick={() => handleEventClick(event)}
                >
                  {event.title}
                </div>
              ))}
              {day.events.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{day.events.length - 2} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
