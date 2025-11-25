import React from 'react';
import { cn } from "../lib/utils";

export function Section({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <section className={cn("w-full max-w-3xl mx-auto px-4 md:px-6", className)}>
      {children}
    </section>
  );
}