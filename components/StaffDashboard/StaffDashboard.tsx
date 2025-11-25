import React, { useEffect, useState } from 'react';
import { fetchAllReservations, fetchAllDeposits } from '../../services/mockApi';
import { Reservation, Deposit } from '../../types';
import { ArrowLeft, Search, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StaffDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'arrivals' | 'deposits'>('arrivals');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllReservations(), fetchAllDeposits()]).then(([res, dep]) => {
      setReservations(res);
      setDeposits(dep);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
           <Link to="/" className="opacity-70 hover:opacity-100">
             <ArrowLeft className="w-5 h-5" />
           </Link>
           <h1 className="text-lg font-bold tracking-wide">CoZzzee <span className="font-normal opacity-70">| Staff Portal</span></h1>
        </div>
        <div className="flex gap-1">
            <button 
                onClick={() => setActiveTab('arrivals')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'arrivals' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            >
                Arrivals
            </button>
            <button 
                onClick={() => setActiveTab('deposits')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'deposits' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            >
                Deposit Audit
            </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto">
        {loading ? (
             <div className="flex items-center justify-center h-64">
                <div className="animate-spin text-blue-600"><RefreshCw className="w-8 h-8"/></div>
             </div>
        ) : (
            <>
                {activeTab === 'arrivals' && <ArrivalsTable reservations={reservations} />}
                {activeTab === 'deposits' && <DepositsTable deposits={deposits} />}
            </>
        )}
      </main>
    </div>
  );
};

const ArrivalsTable: React.FC<{ reservations: Reservation[] }> = ({ reservations }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-slate-700">Today's Arrivals</h2>
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search guest..." className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
            </div>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                    <th className="px-6 py-3">Guest</th>
                    <th className="px-6 py-3">Check-in</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Pre-Check-in</th>
                    <th className="px-6 py-3">Deposit</th>
                    <th className="px-6 py-3 text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                {reservations.map(r => (
                    <tr key={r.reservation_id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                            {r.guest_details.firstName} {r.guest_details.lastName}
                            <div className="text-xs text-slate-500 font-normal">{r.reservation_id}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{r.dates.checkin}</td>
                        <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                r.pms_status === 'confirmed' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                r.pms_status === 'checked_in' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                'bg-gray-50 border-gray-200 text-gray-600'
                            }`}>
                                {r.pms_status}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {r.pre_checkin_complete ? (
                                <div className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4"/> Complete</div>
                            ) : (
                                <div className="flex items-center gap-1 text-amber-600"><Clock className="w-4 h-4"/> Pending</div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {r.steps.deposit_status === 'authorized' ? (
                                <span className="text-green-600 font-mono font-medium">SGD 30.00</span>
                            ) : (
                                <span className="text-slate-400 italic">Pending</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="text-blue-600 hover:underline font-medium">View</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const DepositsTable: React.FC<{ deposits: Deposit[] }> = ({ deposits }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-700">Security Deposit Audit</h2>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Auth Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Release Status</th>
                </tr>
            </thead>
            <tbody>
                {deposits.map(d => (
                    <tr key={d.payment_intent_id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{d.reservation_id}</td>
                        <td className="px-6 py-4 capitalize">{d.provider}</td>
                        <td className="px-6 py-4 font-medium">{d.currency} {d.amount_cents / 100}</td>
                        <td className="px-6 py-4 text-slate-600">{d.authorized_at ? new Date(d.authorized_at).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                {d.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                             {d.release_status === 'none' && <span className="text-slate-400">-</span>}
                             {d.release_status === 'scheduled' && <span className="text-blue-600 flex items-center justify-end gap-1"><Clock className="w-3 h-3"/> Scheduled</span>}
                             {d.release_status === 'released' && <span className="text-slate-500">Released</span>}
                             {d.release_status === 'error' && <span className="text-red-600 flex items-center justify-end gap-1"><AlertCircle className="w-3 h-3"/> Failed</span>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);