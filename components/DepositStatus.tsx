import React from 'react';

export function DepositStatus({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: "Awaiting Authorization",
    authorized: "Deposit Authorized",
    failed: "Authorization Failed",
    released: "Released",
  };

  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    authorized: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    released: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${colors[status] || colors.pending}`}
    >
      {labels[status] || status}
    </span>
  );
}
