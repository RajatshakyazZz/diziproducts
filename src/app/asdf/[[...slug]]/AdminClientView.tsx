'use client';

import dynamic from 'next/dynamic';

const AdminApp = dynamic(() => import('@/admin/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading Command Center...</span>
      </div>
    </div>
  ),
});

export default function AdminClientView() {
  return <AdminApp />;
}
