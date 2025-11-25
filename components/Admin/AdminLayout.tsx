
import React from 'react';
import { Section } from "../Section";
import { Link, Outlet } from "react-router-dom";

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <Section className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-pink-200" />
            <div>
              <p className="font-bold text-lg text-blue-900 leading-none">CoZzzee Admin</p>
              <p className="text-xs text-slate-500">Virtual Reception • Dashboard</p>
            </div>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <Link to="/admin/arrivals" className="text-slate-600 hover:text-blue-600 transition-colors">
              Arrivals
            </Link>
            <Link to="/admin/deposits" className="text-slate-600 hover:text-blue-600 transition-colors">
              Deposits
            </Link>
          </nav>
        </Section>
      </header>

      <main>
        <Section className="py-6">
          <Outlet />
        </Section>
      </main>
    </div>
  );
};
