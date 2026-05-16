import React from 'react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
      <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p className="text-sm text-slate-600">
          Settings are temporarily unavailable in this deployment build. Your account and application flow are still supported.
        </p>
      </div>
    </div>
  );
}
