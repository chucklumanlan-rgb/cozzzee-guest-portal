import React from 'react';
import { cn } from "../lib/utils";

interface CozzzCardProps {
  className?: string;
  children?: React.ReactNode;
}

export const CozzzCard: React.FC<CozzzCardProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm p-6",
        className
      )}
    >
      {children}
    </div>
  );
};