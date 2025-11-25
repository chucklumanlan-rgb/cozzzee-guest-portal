
import React, { useEffect, useState } from "react";
import { fetchAllReservations, syncCloudbedsReservation, syncDailyArrivals } from "../../services/mockApi";
import { CozzzCard } from "../CozzzCard";
import { Button } from "../ui/Button";
import { DepositStatus } from "../DepositStatus";
import { Reservation } from "../../types";
import { RefreshCw, DownloadCloud, X, CalendarArrowDown } from "lucide-react";

export const ArrivalsPage: React.FC = () => {
  const [guests, setGuests] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncId, setSyncId] = useState("");
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  const loadGuests = async () => {
    setLoading(true);
    const data = await fetchAllReservations();
    setGuests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadGuests();
  }, []);

  const handleBulkSync = async () => {
    setIsBulkSyncing(true);
    try {
        const res = await syncDailyArrivals();
        // Display message if simulation or specific backend message, otherwise default
        alert(res.message || `Successfully synced ${res.count} arrivals from Cloudbeds.`);
        await loadGuests();
    } catch (err) {
        console.error(err);
        alert("Bulk sync failed. Please check the backend logs.");
    } finally {
        setIsBulkSyncing(false);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncId) return;

    setIsSyncing(true);
    try {
        await syncCloudbedsReservation({ reservationId: syncId });
        await loadGuests(); // Refresh list
        setShowSyncModal(false);
        setSyncId("");
    } catch (err) {
        alert("Failed to sync. See console.");
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <CozzzCard className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-blue-900 mb-1">
            Today’s Arrivals
            </h1>
            <p className="text-sm text-slate-600">
            Monitor pre-check-in progress, verify passports, and ensure deposits are authorized.
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleBulkSync} disabled={isBulkSyncing || loading}>
                <CalendarArrowDown className={`w-4 h-4 mr-2 ${isBulkSyncing ? 'animate-bounce' : ''}`} />
                {isBulkSyncing ? 'Syncing...' : 'Sync Today\'s Arrivals'}
            </Button>
            <Button onClick={() => setShowSyncModal(true)}>
                <DownloadCloud className="w-4 h-4 mr-2" />
                Single Sync
            </Button>
        </div>
      </CozzzCard>

      <CozzzCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-pink-50/60 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs">Guest</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs">Reservation</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs">Check-in Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs">Deposit</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-blue-600">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading guests…
                    </div>
                  </td>
                </tr>
              )}

              {!loading && guests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No arrivals found in database. <br/> Click <b>"Sync Today's Arrivals"</b> to fetch from Cloudbeds.
                  </td>
                </tr>
              )}

              {guests.map((g) => (
                <tr key={g.reservation_id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-blue-900">{g.guest_details?.firstName} {g.guest_details?.lastName}</div>
                    <div className="text-xs text-slate-500">{g.guest_details?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{g.reservation_id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      g.pre_checkin_complete 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {g.pre_checkin_complete ? "Completed" : "In Progress"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {/* Defensive check for steps object in case of bad sync data */}
                    <DepositStatus status={g.steps?.deposit_status || 'pending'} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="default" className="h-8 text-xs">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CozzzCard>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Sync from Cloudbeds</h3>
                    <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                    Enter the Reservation ID to fetch the latest details from the PMS. 
                    (e.g., 12345678)
                </p>
                <form onSubmit={handleSync} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Reservation ID" 
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={syncId}
                        onChange={(e) => setSyncId(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="subtle" className="flex-1" onClick={() => setShowSyncModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={!syncId} isLoading={isSyncing}>
                            {isSyncing ? "Syncing..." : "Fetch Data"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
