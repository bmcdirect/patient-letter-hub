import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { ProductionCalendar } from "@/components/calendar/production-calendar";
import { Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const fmtDate = (d?: string | Date | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString();
  };
  
  const currentMonthName = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-hidden p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Production Calendar</h1>
                <p className="text-gray-600">Schedule and track letter production</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
                <Button className="bg-primary-500 hover:bg-primary-600 text-white flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Schedule</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Header */}
          <Card className="shadow-sm border border-gray-100 mb-6">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-gray-900">{currentMonthName}</h2>
                  <Button variant="ghost" onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">Day</Button>
                  <Button variant="outline" size="sm">Week</Button>
                  <Button size="sm" className="bg-primary-500 text-white">Month</Button>
                </div>
              </div>
            </div>

            <ProductionCalendar currentDate={currentDate} />
          </Card>

          {/* Production Legend */}
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Status Legend</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-primary-100 border border-primary-200 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Print Scheduled</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">In Production</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Ready to Mail</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
