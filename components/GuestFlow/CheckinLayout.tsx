import React from "react";
import { Section } from "../Section";
import { Stepper } from "../Stepper";

export function CheckinLayout({ children, currentStepIndex }: { children?: React.ReactNode, currentStepIndex: number }) {
  const steps = [
    "Overview",
    "Details",
    "Passport",
    "Terms",
    "Deposit",
    "Complete",
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Section className="py-8">
        <h1
          className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 tracking-tight"
        >
          CoZzzee Check-in
        </h1>

        <Stepper steps={steps} current={currentStepIndex} />

        <div className="mt-8">{children}</div>
      </Section>
    </div>
  );
}