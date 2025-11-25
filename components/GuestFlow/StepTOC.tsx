import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Eraser } from 'lucide-react';

interface Props {
  onComplete: () => Promise<void>;
}

export const StepTOC: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return { x: x - rect.left, y: y - rect.top };
    };

    const startDrawing = (e: any) => {
      e.preventDefault(); // Prevent scrolling on touch
      setIsSigning(true);
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: any) => {
      if (!isSigning) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSigned(true);
    };

    const stopDrawing = () => setIsSigning(false);

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isSigning]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
    }
  };

  const handleSubmit = async () => {
    if (!hasSigned || !accepted) return;
    setIsLoading(true);
    try {
      // In real app: canvas.toDataURL() -> upload to Firebase Storage
      await onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Terms & Conditions</h2>
        
        <div className="h-64 overflow-y-auto bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600 mb-6 space-y-4">
          <p className="font-bold text-slate-900">Hotel Policy</p>
          <p>By checking in, all guests agree to the following terms. Violating these rules is a breach of this agreement and may lead to the termination of your stay without a refund.</p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Check-In Requirements:</strong> A valid government-issued ID or passport and a valid credit card are required from all guests before check-in.</li>
            <li><strong>Booking & Payment:</strong> Full payment is required to confirm a booking.</li>
            <li><strong>Minimum Age:</strong> Guests must be at least 18 years old to stay, or 12 years old if accompanied by a legal guardian.</li>
            <li><strong>Reservations & Refunds:</strong> All reservations are non-refundable upon check-in. There are no refunds for late arrivals, early departures, shortening a stay, late cancellations, or no-shows.</li>
            <li><strong>Zero Tolerance Policy:</strong> We have a zero-tolerance policy for illegal drugs, excessive inebriation, bullying, or indecency. Guests who violate this policy will be asked to leave immediately without a refund.</li>
            <li><strong>Smoking & Weapons:</strong> No smoking or weapons are permitted anywhere on the premises.</li>
            <li><strong>Video Surveillance:</strong> For your safety, all common areas are monitored by 24-hour video surveillance.</li>
            <li><strong>Liability:</strong> CoZzzee Hostel is not responsible for lost, stolen, or damaged personal property. Please use the provided lockers to secure your valuables.</li>
          </ul>

          <p className="font-bold text-slate-900 mt-4">Guest and Visitor Conduct</p>
          <ul className="list-disc pl-5 space-y-2">
             <li><strong>Respectful Behaviour:</strong> All guests and their visitors must behave in a disciplined and responsible manner. Any actions that disturb the comfort, quiet enjoyment, safety, or security of other guests or staff are grounds for immediate eviction without a refund.</li>
             <li><strong>Personal Hygiene:</strong> In a shared living environment, personal hygiene is essential. Guests are expected to maintain good hygiene to ensure a comfortable stay for everyone. Please be mindful of strong body odours, as they may be disruptive to others.</li>
             <li><strong>Private Space:</strong> Please respect the privacy of other guests, including their personal space and belongings.</li>
             <li><strong>Visitors:</strong> Only registered guests may stay in the dormitories. Visitors are welcome in common areas but must leave the premises by 12:00 AM.</li>
             <li><strong>Damages:</strong> Guests are financially responsible for any damage they cause to hostel property. The cost will be charged to the guest.</li>
             <li><strong>Proper Attire:</strong> Guests must be fully clothed in all dorm rooms and common areas.</li>
          </ul>

          <p className="font-bold text-slate-900 mt-4">Times & Hours</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Virtual Reception:</strong> 10AM -12MN (There is no physical Receptionist on-Site)</li>
            <li><strong>Self-Check-in:</strong> 3:00 PM - Onwards.</li>
            <li><strong>Check-out:</strong> 11:00 AM (Strict).</li>
            <li><strong>Quiet Hours:</strong> 10:00 PM - 8:00 AM in all dormitories.</li>
            <li><strong>Lounge Access:</strong> 24/7</li>
            <li><strong>Cleaning Hours:</strong> 10:00 AM - 3:00 PM</li>
          </ul>

          <p className="font-bold text-slate-900 mt-4">Additional Information</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Early Arrival Luggage Storage:</strong> You may store your luggage in the storage area located in the lounge if you arrive before the 3:00 PM check-in time. You can also leave your luggage in the same area after the 11:00 AM check-out time.</li>
            <li>Please note that only CCTV monitoring is available, and we will not be held responsible for any loss.</li>
          </ul>

          <p className="font-bold text-slate-900 mt-4">Damage Fees</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Stained Sheets: $30 SGD</li>
            <li>Stained Towel: $10 SGD</li>
            <li>Extra Towel: $2 SGD</li>
            <li>Adapters: $3 SGD</li>
            <li>Linen Change: $10 SGD</li>
            <li>Extra Pillow: Refer to our Pillow Menu</li>
          </ul>

          <p className="font-bold text-slate-900 mt-4">Security Deposit: $30 SGD</p>
          <ul className="list-disc pl-5 space-y-1">
             <li>A valid credit card will be held for incidentals.</li>
             <li>Your Bank Statement may reflect 2 charges ($0 SGD and $30 SGD).</li>
             <li>The system will automatically release the hold immediately after check-out.</li>
             <li>Please allow 7-10 working days for your card to be refunded.</li>
          </ul>
        </div>

        <div className="flex items-center gap-3 mb-6 p-3 bg-pink-50/50 rounded-lg border border-pink-100 transition-colors hover:bg-pink-50 cursor-pointer" onClick={() => setAccepted(!accepted)}>
          <input
            type="checkbox"
            id="accept-terms"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <label htmlFor="accept-terms" className="text-sm font-medium text-blue-900 cursor-pointer select-none">
            I have read and accept the Terms & Conditions above.
          </label>
        </div>

        <div className="space-y-2">
          <label className={`text-sm font-medium ${accepted ? 'text-slate-900' : 'text-slate-400'}`}>Sign Below</label>
          <div className={`relative border rounded-xl overflow-hidden bg-white touch-none transition-all duration-300 ${!accepted ? 'opacity-50 pointer-events-none bg-slate-50 grayscale' : ''}`}>
            <canvas 
              ref={canvasRef}
              width={500}
              height={200}
              className="w-full h-48 bg-white cursor-crosshair"
            />
            <button 
              type="button"
              onClick={clearSignature}
              className="absolute top-2 right-2 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
              disabled={!accepted}
            >
              <Eraser className="w-4 h-4" />
            </button>
            {!accepted && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-slate-500 font-medium text-sm bg-white/80 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                        Check box to unlock signature
                    </span>
                </div>
            )}
          </div>
          <p className="text-xs text-slate-500">Draw your signature using your finger or mouse.</p>
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full" 
        disabled={!hasSigned || !accepted}
        isLoading={isLoading}
      >
        Accept & Sign
      </Button>
    </div>
  );
};