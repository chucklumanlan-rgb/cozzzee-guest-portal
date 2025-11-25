import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { PreCheckinWizard } from './components/GuestFlow/PreCheckinWizard';
import { StaffDashboard } from './components/StaffDashboard/StaffDashboard';
import { Section } from './components/Section';
import { HeroBadge } from './components/HeroBadge';
import { ArrowRight, UserCheck, LayoutDashboard, Zap, Activity, Calendar, User, Info } from 'lucide-react';
import { AdminLayout } from './components/Admin/AdminLayout';
import { ArrivalsPage } from './components/Admin/ArrivalsPage';
import { DepositsPage } from './components/Admin/DepositsPage';
import { testCloudbedsConnection, syncCloudbedsReservation } from './services/mockApi';
import { initRemoteConfig } from './lib/remote-config';

// Simple Landing Page to simulate the entry points
const Landing = () => {
  // Login Method: 'id' or 'details'
  const [loginMethod, setLoginMethod] = useState<'id' | 'details'>('details'); // Default to details as requested

  // Form States
  const [reservationId, setReservationId] = useState("");
  
  // Details Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const navigate = useNavigate();

  const handleStartCheckinID = () => {
    const targetId = reservationId.trim() || "12345";
    navigate(`/checkin/${targetId}`);
  };

  const handleStartCheckinDetails = async () => {
      if (!firstName || !checkIn || !checkOut) return;

      setIsSearching(true);
      try {
          // Attempt to find the reservation via search params
          const res = await syncCloudbedsReservation({
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              checkInDate: checkIn,
              checkOutDate: checkOut
          });

          if (res && res.reservation_id) {
              navigate(`/checkin/${res.reservation_id}`);
          } else {
              alert("No booking found with these details. Please check your spelling and dates.");
          }
      } catch (e: any) {
          console.error(e);
          alert("Error searching for booking. Please try again or use your Reservation ID.");
      } finally {
          setIsSearching(false);
      }
  };

  const handleTestConnection = async () => {
      setIsTesting(true);
      setConnectionStatus("Testing...");
      const result = await testCloudbedsConnection();
      setIsTesting(false);
      setConnectionStatus(result.message);
      
      // Clear status after 5 seconds
      if (result.success) {
          setTimeout(() => setConnectionStatus(null), 5000);
      }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-4">
      <Section className="flex flex-col items-center">
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center gap-2 flex-wrap">
            <HeroBadge>
                <Zap className="w-3 h-3 mr-1 text-green-500 fill-green-500" />
                Live Credentials Active
            </HeroBadge>
            <button 
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs md:text-sm font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
                <Activity className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Checking...' : 'Check Connection'}
            </button>
          </div>
          
          {connectionStatus && (
              <div className={`text-xs font-bold px-4 py-2 rounded-lg animate-fade-in ${connectionStatus.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {connectionStatus}
              </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-blue-900 tracking-tight">
            CoZzzee Guest Portal
          </h1>
          <p className="text-slate-600 max-w-md mx-auto text-base leading-relaxed">
            Please identify yourself to access your check-in and room keys.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 w-full max-w-5xl items-start">
          {/* Guest Entry Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 pb-0">
               <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                       <UserCheck className="w-5 h-5" />
                   </div>
                   <h2 className="text-lg font-bold text-blue-900">Guest Login</h2>
               </div>

               {/* Tabs */}
               <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
                  <button 
                     onClick={() => setLoginMethod('details')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === 'details' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                     <User className="w-4 h-4" /> Personal Details
                  </button>
                  <button 
                     onClick={() => setLoginMethod('id')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === 'id' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                     <Zap className="w-4 h-4" /> Booking Number
                  </button>
               </div>
            </div>

            <div className="p-6 pt-0 flex-1 flex flex-col">
               {loginMethod === 'details' ? (
                  <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                              <input 
                                  type="text" 
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={firstName}
                                  onChange={(e) => setFirstName(e.target.value)}
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                              <input 
                                  type="text" 
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Check-in Date</label>
                              <div className="relative">
                                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input 
                                      type="date" 
                                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                      value={checkIn}
                                      onChange={(e) => setCheckIn(e.target.value)}
                                  />
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Check-out Date</label>
                              <div className="relative">
                                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input 
                                      type="date" 
                                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                      value={checkOut}
                                      onChange={(e) => setCheckOut(e.target.value)}
                                  />
                              </div>
                          </div>
                      </div>

                      <button 
                        onClick={handleStartCheckinDetails}
                        disabled={isSearching}
                        className="flex items-center justify-center text-white font-bold text-sm bg-blue-600 w-full py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 mt-2 disabled:opacity-70"
                      >
                         {isSearching ? 'Searching...' : 'Find My Booking'} <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                      
                      <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-xs text-blue-800 items-start">
                         <Info className="w-4 h-4 mt-0.5 shrink-0" />
                         <p>
                             <strong>Test Production Case:</strong> Try <u>Yang Ding</u> (2025-11-25) to see the live data simulation.
                         </p>
                      </div>
                  </div>
               ) : (
                  <div className="space-y-4 animate-fade-in flex flex-col justify-between h-full">
                      <div className="space-y-1">
                         <label className="text-xs font-bold text-slate-500 uppercase">Reservation ID / OTA Number</label>
                         <input 
                            type="text" 
                            placeholder="e.g. 12345 or Booking.com ID"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-400"
                            value={reservationId}
                            onChange={(e) => setReservationId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleStartCheckinID()}
                         />
                      </div>
                      <button 
                        onClick={handleStartCheckinID}
                        className="flex items-center justify-center text-white font-bold text-sm bg-blue-600 w-full py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 mt-auto"
                      >
                         Continue <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                      <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-xs text-blue-800 items-start">
                         <Info className="w-4 h-4 mt-0.5 shrink-0" />
                         <p>
                             <strong>Test ID:</strong> Use <code>7320576071587</code> (Yang Ding) to test production mapping.
                         </p>
                      </div>
                  </div>
               )}
            </div>
          </div>

          {/* Staff Entry Simulation */}
          <Link 
            to="/admin" 
            className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/10 transition-all text-left overflow-hidden h-full flex flex-col"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <LayoutDashboard className="w-24 h-24 text-slate-600" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                   <LayoutDashboard className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-blue-900 mb-2">Staff Access</h2>
              <p className="text-slate-500 mb-6 text-sm leading-relaxed flex-1">
                Access the Virtual Receptionist terminal. Sync real-time bookings from Cloudbeds, monitor arrivals, and audit security deposits.
              </p>
              <div className="flex items-center text-slate-700 font-bold text-sm bg-slate-100 w-fit px-4 py-2 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors">
                Open Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>
        </div>
        
        <div className="mt-12 text-xs text-slate-400 font-medium tracking-wide uppercase">
            CoZzzee Hostel • Singapore
        </div>
      </Section>
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Initialize Remote Config when the app mounts
    initRemoteConfig();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/checkin/:id" element={<PreCheckinWizard />} />
        <Route path="/staff" element={<Navigate to="/admin" replace />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="arrivals" replace />} />
          <Route path="arrivals" element={<ArrivalsPage />} />
          <Route path="deposits" element={<DepositsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;