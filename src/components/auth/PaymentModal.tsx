import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Zap, CreditCard, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const onPaymentSuccess = async (response: any) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        hasPaid: true,
        paymentReference: response.reference,
        paidAt: new Date().toISOString(),
      });

      toast({
        title: "Payment Successful! 🎉",
        description:
          "Welcome to Apex Tutorials! All courses are now unlocked forever.",
      });

      onClose();
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Database Sync Error",
        description:
          "Your payment was successful but we couldn't update your account. Please contact support with ref: " +
          response.reference,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (!user || !userData) return;

    setIsProcessing(true);

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
      email: user.email,
      amount: 10000 * 100,
      currency: "NGN",
      ref: `APEX-${user.uid.slice(0, 8)}-${Date.now()}`,
      callback: (response: any) => {
        // Payment successful - call internal async handler
        onPaymentSuccess(response);
      },
      onClose: () => {
        setIsProcessing(false);
        toast({
          title: "Payment Cancelled",
          description:
            "You need to complete the payment to access your courses.",
          variant: "default",
        });
      },
    });

    handler.openIframe();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
        <div className="gradient-primary p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10">
            <Zap className="h-12 w-12 mb-4 text-amber-300 fill-amber-300 animate-pulse" />
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold font-heading text-white">
                Unlock All Courses
              </DialogTitle>
              <DialogDescription className="text-white/80 text-lg mt-2">
                Get lifetime access to the entire Apex Tutorial library for a
                one-time fee.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-8 bg-card overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4 mb-8">
            {[
              "Forever Access to 20+ Premium Courses",
              "Official Certificates of Completion",
              "Exclusive Learning Community Access",
              "Downloadable Resource Materials",
              "Future Course Updates included",
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-2xl p-6 mb-8 border border-border/50 text-center">
            <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold mb-1">
              One-Time Payment
            </p>
            <h3 className="text-4xl font-bold text-foreground">₦10,000</h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Secure Payment via Paystack
            </p>
          </div>

          <Button
            variant="gradient"
            className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Unlock Access Now
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground mt-4 italic">
            By clicking "Unlock Access Now", you'll be redirected to Paystack to
            complete your secure purchase.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
