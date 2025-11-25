
import React, { useEffect, useState } from "react";
import { fetchAllDeposits } from "../../services/mockApi";
import { CozzzCard } from "../CozzzCard";
import { DepositStatus } from "../DepositStatus";
import { Button } from "../ui/Button";
import { Deposit } from "../../types";

export const DepositsPage: React.FC = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchAllDeposits();
      setDeposits(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <CozzzCard>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">
          Deposits Overview
        </h1>
        <p className="text-sm text-slate-600">
          Track which guests have authorized deposits, which are pending, and which are released.
        </p>
      </CozzzCard>

      <CozzzCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-pink-50/60 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs">Reservation</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs">Stripe PI</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-blue-600">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading deposits…
                    </div>
                  </td>
                </tr>
              )}

              {!loading && deposits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No deposit records found.
                  </td>
                </tr>
              )}

              {deposits.map((r) => (
                <tr key={r.reservation_id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.reservation_id}</td>
                  <td className="px-4 py-3">
                    <DepositStatus status={r.status} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.currency} {(r.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">
                    {r.payment_intent_id ? r.payment_intent_id : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="default" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50">
                      Force Release
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CozzzCard>
    </div>
  );
};
