import { Switch, Route } from "wouter";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import SimpleLogin from "@/pages/simple-login";
import SimpleDashboard from "@/pages/simple-dashboard";
import Dashboard from "@/pages/dashboard";
import Quotes from "@/pages/quotes";
import QuoteCreate from "@/pages/quote-create";
import Orders from "@/pages/orders";
import OrderCreate from "@/pages/order-create";
import Locations from "@/pages/practices";
import Calendar from "@/pages/calendar";
import FileUpload from "@/pages/file-upload";
import AdminDashboard from "@/pages/admin-dashboard-clean";
import AdminCustomers from "@/pages/admin-customers";
import OperationsLogin from "@/pages/operations-login";
import ProofReview from "@/pages/proof-review";
import Invoices from "@/pages/invoices";
import Emails from "@/pages/emails";
import ProjectFiles from "@/pages/project-files";
import Settings from "@/pages/settings";
import Users from "@/pages/users";
import Reports from "@/pages/reports";
import Templates from "@/pages/templates";
import AccessDenied from "@/pages/access-denied";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, error, user } = useSimpleAuth();

  console.log('Router state:', { 
    isAuthenticated, 
    isLoading, 
    error: error?.message,
    user: user ? `${user.email} (${user.practiceName})` : null
  });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={SimpleLogin} />
        <Route path="/operations/login" component={OperationsLogin} />
        <Route path="/orders/:orderId/proof-review" component={ProofReview} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/orders" component={AdminDashboard} />
        <Route path="/admin/quotes" component={AdminDashboard} />
        <Route path="/admin/customers" component={AdminCustomers} />
        <Route path="/admin/analytics" component={AdminDashboard} />
        <Route path="/admin/templates" component={AdminDashboard} />
        <Route path="/admin/billing" component={AdminDashboard} />
        <Route path="/admin/settings" component={AdminDashboard} />
        <Route path="/operations/dashboard" component={AdminDashboard} />
        <Route path="*" component={SimpleLogin} />
      </Switch>
    );
  }

  return (
    <Switch>
      {/* Authentication pages - accessible without authentication */}
      <Route path="/login" component={SimpleLogin} />
      <Route path="/operations/login" component={OperationsLogin} />
      
      {/* Customer proof review accessible without authentication */}
      <Route path="/orders/:orderId/proof-review" component={ProofReview} />
      
      {/* Operations routes - accessible with operations authentication (bypassed in development) */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminDashboard} />
      <Route path="/admin/quotes" component={AdminDashboard} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/analytics" component={AdminDashboard} />
      <Route path="/admin/templates" component={AdminDashboard} />
      <Route path="/admin/billing" component={AdminDashboard} />
      <Route path="/admin/settings" component={AdminDashboard} />
      <Route path="/operations/dashboard" component={AdminDashboard} />
      
      {/* Main dashboard - uses full customer dashboard with sidebar */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Customer routes - requires authentication */}
      <Route path="/quotes" component={Quotes} />
      <Route path="/quotes/create" component={QuoteCreate} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/create" component={OrderCreate} />
      <Route path="/locations" component={Locations} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/emails" component={Emails} />
      <Route path="/project-files" component={ProjectFiles} />
      <Route path="/upload" component={FileUpload} />
      <Route path="/templates" component={Templates} />
      <Route path="/users" component={Users} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      
      {/* Simple dashboard available at alternate route */}
      <Route path="/simple-dashboard" component={SimpleDashboard} />
      
      {/* Access denied page for restricted areas */}
      <Route path="/access-denied" component={AccessDenied} />
      
      {/* Fallback to NotFound */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;