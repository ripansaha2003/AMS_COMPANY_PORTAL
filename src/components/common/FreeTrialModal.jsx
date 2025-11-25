import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/context/SubscriptionContext";

const FreeTrialModal = () => {
  const { showFreeTrialModal, startFreeTrial } = useSubscription();

  return (
    <Dialog open={showFreeTrialModal} onOpenChange={() => {}}>
      <DialogContent showClose={false} className="sm:max-w-lg bg-white" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-gray-900 text-center">
            Welcome! 🎉
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-700 mt-3 text-center font-medium">
            Start your free trial today and explore all the premium features our platform has to offer. No credit card required!
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-3 bg-white">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <span className="text-green-600 text-sm font-bold">✓</span>
            </div>
            <span className="text-gray-700 text-base">Full access to all features</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <span className="text-green-600 text-sm font-bold">✓</span>
            </div>
            <span className="text-gray-700 text-base">Manage staff, assets, clients & vendors</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <span className="text-green-600 text-sm font-bold">✓</span>
            </div>
            <span className="text-gray-700 text-base">Priority support</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <span className="text-green-600 text-sm font-bold">✓</span>
            </div>
            <span className="text-gray-700 text-base">Cancel anytime</span>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button 
            onClick={startFreeTrial}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold rounded-lg shadow-md"
          >
            Start Free Trial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FreeTrialModal;
