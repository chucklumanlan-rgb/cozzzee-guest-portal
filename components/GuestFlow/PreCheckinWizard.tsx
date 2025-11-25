
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchReservation, updateReservationStep } from '../../services/mockApi';
import { Reservation, GuestDetails, DepositStatus } from '../../types';
import { CheckinLayout } from './CheckinLayout';
import { StepOverview } from './StepOverview';
import { StepGuestDetails } from './StepGuestDetails';
import { StepPassport } from './StepPassport';
import { StepTOC } from './StepTOC';
import { StepDeposit } from './StepDeposit';
import { GuestPortal } from './GuestPortal';
import { CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export const PreCheckinWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'overview' | 'details' | 'passport' | 'tnc' | 'deposit' | 'done'>('overview');

  useEffect(() => {
    if (id) {
      fetchReservation(id).then(res => {
        setReservation(res);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!reservation) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md w-full">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Reservation Not Found</h2>
                <p className="text-slate-600 mb-6">
                    We could not find a booking with ID <strong>{id}</strong>. 
                </p>
                <Link to="/" className="inline-flex items-center justify-center w-full px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Try Again
                </Link>
            </div>
        </div>
    );
  }

  // If fully complete and explicitly on done step or just landing
  if (reservation.pre_checkin_complete && currentStep !== 'done' && currentStep === 'overview') {
      // Allow user to see portal if done
  }

  const handleNextStep = () => {
    const steps = reservation.steps;
    if (!steps.guest_details_complete) setCurrentStep('details');
    else if (!steps.passport_complete) setCurrentStep('passport');
    else if (!steps.tnc_accepted) setCurrentStep('tnc');
    else if (steps.deposit_status !== DepositStatus.AUTHORIZED) setCurrentStep('deposit');
    else setCurrentStep('done');
  };

  const handleUpdate = async (updatedRes: Reservation) => {
    setReservation(updatedRes);
    // Auto advance logic
    if (currentStep === 'details') setCurrentStep('passport');
    else if (currentStep === 'passport') setCurrentStep('tnc');
    else if (currentStep === 'tnc') setCurrentStep('deposit');
    else if (currentStep === 'deposit') setCurrentStep('done');
  };

  // Step Logic Helpers
  const saveDetails = async (details: GuestDetails) => {
    if (!reservation) return;
    const res = await updateReservationStep(reservation.reservation_id, {
      guest_details: details,
      steps: { ...reservation.steps, guest_details_complete: true },
      pre_checkin_started: true
    });
    handleUpdate(res);
  };

  const savePassport = async (extractedData?: Partial<GuestDetails>, passportUrl?: string) => {
    if (!reservation) return;
    
    const updates: Partial<Reservation> = {
      steps: { ...reservation.steps, passport_complete: true }
    };

    if (passportUrl) {
      updates.passport_image_url = passportUrl;
    }

    if (extractedData) {
      updates.guest_details = {
        ...reservation.guest_details,
        ...extractedData
      };
    }

    const res = await updateReservationStep(reservation.reservation_id, updates as any);
    handleUpdate(res);
  };

  const saveTNC = async () => {
    if (!reservation) return;
    const res = await updateReservationStep(reservation.reservation_id, {
      steps: { ...reservation.steps, tnc_accepted: true }
    });
    handleUpdate(res);
  };

  const saveDeposit = async () => {
    if (!reservation) return;
    const res = await updateReservationStep(reservation.reservation_id, {
        steps: { ...reservation.steps, deposit_status: DepositStatus.AUTHORIZED }
    });
    handleUpdate(res);
  };

  const stepIndexMap = {
    'overview': 0,
    'details': 1,
    'passport': 2,
    'tnc': 3,
    'deposit': 4,
    'done': 5
  };

  // If complete, show portal without layout
  if (currentStep === 'done' || (reservation.pre_checkin_complete && currentStep === 'overview')) {
      return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 max-w-md mx-auto">
            {reservation.pre_checkin_complete ? (
                 <GuestPortal reservation={reservation} />
            ) : (
                <div className="text-center space-y-6 pt-10 animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">You're all set!</h2>
                    <p className="text-slate-600">
                        Pre-check-in is complete. You can now access your room codes and hostel guide.
                    </p>
                    <button 
                        onClick={() => setCurrentStep('overview')} 
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700"
                    >
                        Go to Guest Portal
                    </button>
                </div>
            )}
        </div>
      );
  }

  return (
    <CheckinLayout currentStepIndex={stepIndexMap[currentStep]}>
        {currentStep === 'overview' && (
          <StepOverview reservation={reservation} onContinue={handleNextStep} />
        )}
        
        {currentStep === 'details' && (
          <StepGuestDetails initialDetails={reservation.guest_details} onSave={saveDetails} />
        )}
        
        {currentStep === 'passport' && (
          <StepPassport onComplete={savePassport} />
        )}

        {currentStep === 'tnc' && (
          <StepTOC onComplete={saveTNC} />
        )}

        {currentStep === 'deposit' && (
          <StepDeposit reservationId={reservation.reservation_id} onComplete={saveDeposit} />
        )}
    </CheckinLayout>
  );
};
