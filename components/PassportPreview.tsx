import React from 'react';

export function PassportPreview({ fileUrl }: { fileUrl: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-48 bg-slate-100">
      <img src={fileUrl} className="w-full h-full object-cover" alt="Passport Preview" />
    </div>
  );
}
