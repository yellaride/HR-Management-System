import React from "react";

interface EmptyStateProps {
  onAddClick: () => void;
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm text-center">
      <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h3 className="text-sm font-bold text-slate-900">No Employees Found</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-xs">
        Your directory database is currently empty. Start by registering your first company employee profile.
      </p>
      <button
        onClick={onAddClick}
        className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition"
      >
        Add First Employee
      </button>
    </div>
  );
}