import React from 'react';

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-blue-600 text-white border-blue-600",
    active: "bg-pink-50 text-blue-900 border-pink-300",
    pending: "bg-white text-slate-700 border-slate-200",
    locked: "bg-slate-50 text-slate-400 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs rounded-full border ${map[status] || map.pending} font-medium tracking-wide uppercase`}
    >
      {status}
    </span>
  );
}
