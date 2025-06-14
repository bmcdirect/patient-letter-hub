import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useState } from "react";
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Only load Stripe if we have the public key
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface CreditPurchaseProps {
  user: any;
}

function CreditPurchaseForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Credits have been added to your account!",
        });
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || loading}
        className="w-full bg-teal-accent hover:bg-teal-600 text-white"
      >
        {loading ? "Processing..." : "Purchase Credits"}
      </Button>
    </form>
  );
}

export default function CreditPurchase({ user }: CreditPurchaseProps) {
  const [showPurchase, setShowPurchase] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<{ credits: number; amount: number } | null>(null);
  const { toast } = useToast();

  const creditBundles = [
    { credits: 1000, amount: 50, popular: false },
    { credits: 5000, amount: 200, popular: true },
    { credits: 10000, amount: 350, popular: false },
  ];

  const handlePurchaseClick = async (bundle: { credits: number; amount: number }) => {
    if (!stripePromise) {
      toast({
        title: "Payment Not Available",
        description: "Credit purchase is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: bundle.amount,
        credits: bundle.credits,
      });
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setSelectedBundle(bundle);
      setShowPurchase(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment",
        variant: "destructive",
      });
    }
  };

  const handleSuccess = () => {
    setShowPurchase(false);
    setClientSecret("");
    setSelectedBundle(null);
    // Refresh the page to update credit balance
    window.location.reload();
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-100">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Coins className="h-6 w-6 text-teal-accent" />
            <CardHeader className="p-0">
              <h3 className="text-lg font-semibold text-dark-navy">Credit Bundles</h3>
            </CardHeader>
          </div>
          <p className="text-sm text-gray-600 mb-4">Save up to 25% with prepaid credit bundles</p>
          
          <div className="space-y-2 mb-4">
            {creditBundles.map((bundle) => (
              <Button
                key={bundle.credits}
                variant="outline"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => handlePurchaseClick(bundle)}
              >
                <span>{bundle.credits.toLocaleString()} credits</span>
                <span className="font-semibold">${bundle.amount}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPurchase} onOpenChange={setShowPurchase}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Purchase Credits</DialogTitle>
          </DialogHeader>
          
          {selectedBundle && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedBundle.credits.toLocaleString()} Credits</span>
                <span className="font-bold">${selectedBundle.amount}</span>
              </div>
            </div>
          )}

          {clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CreditPurchaseForm onSuccess={handleSuccess} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
