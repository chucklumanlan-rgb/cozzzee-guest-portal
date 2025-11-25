
import React from 'react';
import { Reservation, DepositStatus } from '../../types';
import { Button } from '../ui/Button';
import { CozzzCard } from '../CozzzCard';
import { StatusPill } from '../StatusPill';
import { Cloud, WifiOff } from 'lucide-react';

interface Props {
  reservation: Reservation;
  onContinue: () => void; // Used to trigger next logic in Wizard
}

export const StepOverview: React.FC<Props> = ({ reservation, onContinue }) => {
  const { guest_details, steps } = reservation;

  const stepItems = [
    {
      title: "Guest Details",
      status: steps.guest_details_complete ? "completed" : "active",
      action: "Review"
    },
    {
      title: "Upload Passport",
      status:
        steps.passport_complete
          ? "completed"
          : steps.guest_details_complete
          ? "active"
          : "locked",
       action: "Upload"
    },
    {
      title: "Sign Terms & Conditions",
      status:
        steps.tnc_accepted
          ? "completed"
          : steps.passport_complete
          ? "active"
          : "locked",
      action: "Sign"
    },
    {
      title: "Security Deposit (S$30)",
      status:
        steps.deposit_status === DepositStatus.AUTHORIZED
          ? "completed"
          : steps.tnc_accepted
          ? "active"
          : "locked",
      action: "Authorize"
    },
    {
      title: "Receive Access Codes",
      status:
        reservation.pre_checkin_complete
          ? "completed"
          : steps.deposit_status === DepositStatus.AUTHORIZED
          ? "active"
          : "locked",
      action: "View"
    },
  ];

  return (
    <div className="space-y-6">
      <CozzzCard>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-blue-900">
            Welcome, {guest_details.firstName || 'Guest'} 👋
            </h2>
            
            {reservation.data_source === 'cloudbeds' ? (
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                    <Cloud className="w-3 h-3" /> Live Cloudbeds Data
                 </span>
            ) : (
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                    <WifiOff className="w-3 h-3" /> Demo Mode
                 </span>
            )}
        </div>
        <p className="text-slate-600">
          Complete your self check-in so we can prepare your pod.
        </p>
      </CozzzCard>

      <div className="space-y-4">
        {stepItems.map((s, i) => (
          <CozzzCard
            key={i}
            className={`
            flex items-center justify-between transition-opacity
            ${s.status === "locked" ? "opacity-60 pointer-events-none" : ""}
            ${s.status === "active" ? "ring-2 ring-pink-100 border-pink-200" : ""}
          `}
          >
            <div>
              <h3 className="text-lg font-medium text-blue-900">
                {s.title}
              </h3>
              <div className="mt-1">
                <StatusPill status={s.status} />
              </div>
            </div>

            {s.status !== 'locked' && s.status !== 'completed' && (
                 <Button onClick={onContinue} size="default" variant={s.status === 'active' ? 'default' : 'outline'}>
                    {s.action}
                 </Button>
            )}
             
            {s.status === 'completed' && (
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
          </CozzzCard>
        ))}
      </div>
      
       <div className="flex justify-end pt-4">
            <Button onClick={onContinue} size="lg" className="w-full md:w-auto">
                {reservation.pre_checkin_complete ? "Open Guest Portal" : "Continue Check-in"}
            </Button>
       </div>
    </div>
  );
};