  import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import QuotesManagement from "@/components/dashboard/quotes-management";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [newMailingOpen, setNewMailingOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedPractice, setSelectedPractice] = useState<any>(null);

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

  // Fetch user's practices
  const { data: practices = [] } = useQuery({
    queryKey: ["/api/practices"],
    enabled: !!user,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  // Set default practice
  useEffect(() => {
    if (practices.length > 0 && !selectedPractice) {
      setSelectedPractice(practices[0]);
    }
  }, [practices, selectedPractice]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/practices", selectedPractice?.id, "dashboard-stats"],
    enabled: !!selectedPractice,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  // Fetch recent mailings
  const { data: recentMailings = [] } = useQuery({
    queryKey: ["/api/practices", selectedPractice?.id, "letter-jobs"],
    enabled: !!selectedPractice,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  const handleNewMailing = () => {
    window.location.href = '/order.html';
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setNewMailingOpen(false);
    setWizardOpen(true);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} practices={practices} selectedPractice={selectedPractice} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-dark-navy mb-2">Dashboard</h2>
                <p className="text-gray-600">Monitor your patient communications and compliance status</p>
              </div>
              <Button 
                onClick={handleNewMailing}
                className="bg-primary-blue hover:bg-blue-800 text-white flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Mailing</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards stats={stats} loading={statsLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Mailings */}
            <div className="lg:col-span-2">
              <RecentMailings mailings={recentMailings} />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <ComplianceAlerts practiceId={selectedPractice?.id} />
              <QuickActions onTemplateSelect={handleTemplateSelect} />
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <NewMailingModal
        open={newMailingOpen}
        onOpenChange={setNewMailingOpen}
        onTemplateSelect={handleTemplateSelect}
      />

      <MailingWizardModal
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        template={selectedTemplate}
        practice={selectedPractice}
      />
    </div>
  );
}
