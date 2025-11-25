import React from 'react';
import { Reservation } from '../../types';
import { Wifi, Key, Calendar, Phone, MapPin } from 'lucide-react';

interface Props {
  reservation: Reservation;
}

export const GuestPortal: React.FC<Props> = ({ reservation }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Welcome Home!</h1>
          <p className="text-blue-100">Room 204 • Bed B</p>
        </div>
        <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Access Code Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-medium text-slate-500 text-sm">Door Access Code</h3>
            <div className="text-3xl font-bold text-slate-900 tracking-widest font-mono mt-1">
              {reservation.access_code}
            </div>
            <p className="text-xs text-slate-400 mt-2">Press # after entering code</p>
          </div>
        </div>

        {/* WiFi Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
            <Wifi className="w-6 h-6" />
          </div>
          <div className="w-full">
            <h3 className="font-medium text-slate-500 text-sm">WiFi Network</h3>
            <div className="font-bold text-slate-900 mt-1">{reservation.wifi_ssid}</div>
            <div className="flex items-center justify-between mt-2 p-2 bg-slate-50 rounded border border-slate-100">
              <code className="text-sm text-slate-700">{reservation.wifi_pass}</code>
              <button className="text-xs text-blue-600 font-medium">Copy</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
        <div className="p-4 flex items-center gap-4">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Check-in / Out</p>
            <p className="text-sm text-slate-800">
              {reservation.dates.checkin} (14:00) — {reservation.dates.checkout} (11:00)
            </p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-4">
          <MapPin className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Address</p>
            <p className="text-sm text-slate-800">
              123 Boat Quay, Singapore 049825
            </p>
            <a href="#" className="text-xs text-blue-600 hover:underline">Open Maps</a>
          </div>
        </div>
        <div className="p-4 flex items-center gap-4">
          <Phone className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Reception (VR Staff)</p>
            <p className="text-sm text-slate-800">+65 1234 5678</p>
            <div className="flex gap-3 mt-1">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};