'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore } from '@/data/store';
import { ScrollText, Search, ShieldCheck, User, Clock } from 'lucide-react';

export default function AdminAuditPage() {
  const { auditLogs } = useAppStore();
  const [search, setSearch] = useState('');

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="System Audit" subtitle="Immutable Operational Trail" />
      <DesktopSubNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Central Audit Trail</h2>
            <p className="text-xs text-[#6B7280]">
              Chronological ledger of user actions, order state transitions, and integration events
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            />
          </div>
        </div>

        {/* Audit Stream Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-[#E5E7EB]">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-neutral-50/60 transition-colors flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <span className="tech-code font-bold text-[10px] bg-[#111827] text-white px-2 py-0.5 rounded uppercase mt-0.5 shrink-0">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <div>
                    <div className="font-semibold text-[#111827]">{log.details}</div>
                    <div className="text-[11px] text-[#6B7280] font-mono mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-neutral-400" />
                        {log.userName} ({log.role})
                      </span>
                      <span>•</span>
                      <span>Entity: {log.entityType} ({log.entityId})</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] text-[#6B7280] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  <span className="block text-[10px] text-[#9CA3AF]">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
