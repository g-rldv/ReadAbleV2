import React from 'react';

export default function GamePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-6">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Game mode is not available</h1>
        <p className="text-sm text-slate-600">
          This route is reserved for assessment gameplay. The page has been restored so the app can deploy successfully.
        </p>
      </div>
    </div>
  );
}
