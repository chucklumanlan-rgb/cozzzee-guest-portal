import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { createStripeIntent, confirmDeposit } from '../../services/mockApi';
import { ShieldCheck, CreditCard } from 'lucide-react';

interface Props {
  reservationId: string;
  onComplete: () => Promise<void>;
}

export const StepDeposit: React.FC<Props> = ({ reservationId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Create Intent
      await createStripeIntent(reservationId);
      // 2. Confirm (Simulating Stripe Elements flow)
      await confirmDeposit(reservationId);
      // 3. Next
      await onComplete();
    } catch (err) {
      setError("Payment authorization failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Security Deposit</h2>
        <p className="text-slate-600 mb-6">
          We need to authorize a temporary hold of <span className="font-bold text-slate-900">S$30.00</span> for incidentals. 
          No money is taken from your account unless damage occurs.
        </p>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600">Authorization Amount</span>
            <span className="font-bold text-slate-900">SGD 30.00</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-500">
            <span>Release Schedule</span>
            <span>72h after checkout</span>
          </div>
        </div>

        {/* Mock Stripe Element UI */}
        <div className="border rounded-lg p-4 text-left space-y-4 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-bl">TEST MODE</div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase">Card Number</label>
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded border border-slate-200">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="font-mono text-slate-600">4242 4242 4242 4242</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase">Expiry</label>
              <div className="px-3 py-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-mono text-slate-600">12 / 25</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase">CVC</label>
              <div className="px-3 py-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-mono text-slate-600">123</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <Button 
          onClick={handleAuthorize} 
          className="w-full" 
          isLoading={isLoading}
        >
          Authorize S$30.00
        </Button>
        
        <p className="text-xs text-slate-400 mt-4">
          Powered by Stripe. Your card details are never stored on our servers.
        </p>
      </div>
    </div>
  );
};