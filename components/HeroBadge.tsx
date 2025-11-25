import React from 'react';

export function HeroBadge({ children }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs md:text-sm bg-pink-50 text-blue-900 border border-pink-200 shadow-sm">
      {children}
    </span>
  );
}