import React, { useState } from 'react';
import { GuestDetails } from '../../types';
import { Button } from '../ui/Button';

interface Props {
  initialDetails: GuestDetails;
  onSave: (details: GuestDetails) => Promise<void>;
}

export const StepGuestDetails: React.FC<Props> = ({ initialDetails, onSave }) => {
  const [formData, setFormData] = useState(initialDetails);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Confirm Your Details</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">First Name</label>
            <input 
              type="text" 
              required
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Last Name</label>
            <input 
              type="text" 
              required
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Email Address</label>
          <input 
            type="email" 
            required
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Mobile Phone</label>
          <input 
            type="tel" 
            required
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Estimated Arrival Time</label>
            <input 
              type="time" 
              value={formData.arrivalTime || ''}
              onChange={e => setFormData({...formData, arrivalTime: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Save & Continue
      </Button>
    </form>
  );
};