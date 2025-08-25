"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Download, Filter } from "lucide-react";
import { useNavigationClick } from "@/hooks/useNavigationClick";

interface CalendarEvent {
  id: string;
  title: string;
  type: 'quote' | 'order-draft' | 'order-progress' | 'order-completed' | 'order-delivered';
  date: Date;
  entityType: 'quote' | 'order';
  entityId: string;
  status: string;
  practiceName: string;
  orderNumber?: string;
  quoteNumber?: string;
}

interface ProductionCalendarProps {
  orders: any[];
  quotes: any[];
  onEventClick?: (event: CalendarEvent) => void;
  onExportSchedule?: () => void;
}

export function ProductionCalendar({ 
  orders, 
  quotes, 
  onEventClick,
  onExportSchedule 
}: ProductionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const handleNavigation = useNavigationClick();

  // Convert orders and quotes to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];
    
    // Add quote events
    quotes.forEach(quote => {
      if (!quote.createdAt) return;
      
      calendarEvents.push({
        id: `quote-${quote.id}`,
        title: `${quote.practiceName || 'Unknown Practice'} - Quote`,
        type: 'quote',
        date: new Date(quote.createdAt),
        entityType: 'quote',
        entityId: quote.id,
        status: quote.status || 'pending',
        practiceName: quote.practiceName || 'Unknown Practice',
        quoteNumber: quote.quoteNumber
      });
    });
    
    // Add order events
    orders.forEach(order => {
      // Use preferredMailDate if available, otherwise fall back to createdAt
      const eventDate = order.preferredMailDate || order.createdAt;
      if (!eventDate) return;
      
      const practiceName = order.practiceName || order.practice?.name || 'Unknown Practice';
      
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
        status: order.status || 'draft',
        practiceName,
        orderNumber: order.orderNumber
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
          status: 'production-start',
          practiceName,
          orderNumber: order.orderNumber
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
          status: 'production-end',
          practiceName,
          orderNumber: order.orderNumber
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
          status: 'fulfilled',
          practiceName,
          orderNumber: order.orderNumber
        });
      }
    });
    
    return calendarEvents;
  }, [orders, quotes]);

  // Filter events based on selected type
  const filteredEvents = events.filter(event => 
    selectedEventType === 'all' || event.type === selectedEventType
  );

  const getEventColor = (type: string) => {
    switch (type) {
      case 'quote':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
      case 'order-draft': 
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200';
      case 'order-progress':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200';
      case 'order-completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
      case 'order-delivered':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200';
    }
  };

  const handleEventClick = (calendarEvent: CalendarEvent, domEvent: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    domEvent.preventDefault();
    domEvent.stopPropagation();
    
    if (onEventClick) {
      onEventClick(calendarEvent);
    } else {
      // Default navigation behavior using the navigation hook
      if (calendarEvent.entityType === 'order') {
        // Navigate to order details page
        handleNavigation(`/orders/${calendarEvent.entityId}`)(domEvent);
      } else if (calendarEvent.entityType === 'quote') {
        // Navigate to quotes page
        handleNavigation('/quotes')(domEvent);
      }
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
      const dayEvents = filteredEvents.filter(event => 
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
  const currentMonthName = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const exportSchedule = () => {
    if (onExportSchedule) {
      onExportSchedule();
    } else {
      // Default CSV export
      const csvContent = [
        ['Date', 'Practice', 'Type', 'Order/Quote #', 'Status', 'Event'],
        ...filteredEvents.map(event => [
          event.date.toLocaleDateString(),
          event.practiceName,
          event.entityType,
          event.orderNumber || event.quoteNumber || '',
          event.status,
          event.title
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `production-schedule-${currentMonthName}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">{currentMonthName}</h2>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedEventType} 
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Events</option>
            <option value="quote">Quotes</option>
            <option value="order-draft">Draft Orders</option>
            <option value="order-progress">In Progress</option>
            <option value="order-completed">Completed</option>
            <option value="order-delivered">Delivered</option>
          </select>
          <Button variant="outline" size="sm" onClick={exportSchedule}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
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
                className={`min-h-[120px] p-2 ${
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${day.isToday ? 'border-2 border-blue-500' : ''}`}
              >
                <div className={`text-sm font-medium ${
                  day.isCurrentMonth 
                    ? day.isToday 
                      ? 'text-blue-600'
                      : 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="mt-1 space-y-1">
                  {day.events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs px-2 py-1 rounded border cursor-pointer transition-colors ${getEventColor(event.type)}`}
                      title={`${event.title} - Click to view details`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEventClick(event, e);
                      }}
                    >
                      <div className="font-medium truncate">{event.practiceName}</div>
                      <div className="text-xs opacity-75 truncate">
                        {event.orderNumber || event.quoteNumber}
                      </div>
                    </div>
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{day.events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Production Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-3"></div>
              <span className="text-sm text-gray-700">Quotes</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-3"></div>
              <span className="text-sm text-gray-700">Draft Orders</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded mr-3"></div>
              <span className="text-sm text-gray-700">In Progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-3"></div>
              <span className="text-sm text-gray-700">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded mr-3"></div>
              <span className="text-sm text-gray-700">Delivered</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 