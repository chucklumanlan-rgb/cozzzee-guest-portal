import React from 'react';
import { cn } from "../lib/utils";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-colors",
              i <= current
                ? "bg-blue-600 border-blue-600"
                : "border-slate-300 bg-white"
            )}
          />
          <span className={cn(
            "text-sm font-medium",
             i <= current ? "text-blue-900" : "text-slate-400"
          )}>
            {step}
          </span>
          {i < steps.length - 1 && (
            <div className="h-0.5 w-4 md:w-8 bg-slate-200" />
          )}
        </div>
      ))}
    </div>
  );
}