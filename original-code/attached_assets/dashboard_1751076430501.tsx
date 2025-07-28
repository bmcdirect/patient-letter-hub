import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import OrdersManagement from "@/components/dashboard/orders-management";
import QuotesManagement from "@/components/dashboard/quotes-management";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  // Mock practice data for header display
  const mockSelectedPractice = {
    id: 1,
    name: "Sunshine Family Medicine",
    contact_prefix: "Dr.",
    contact_first_name: "Sarah",
    contact_last_name: "Johnson",
    contact_suffix: "MD"
  };

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} practices={[mockSelectedPractice]} selectedPractice={mockSelectedPractice} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8 space-y-12">
          <OrdersManagement userId={user?.id || "user123"} />
          <QuotesManagement userId={user?.id || "user123"} />
        </main>
      </div>
    </div>
  );
}