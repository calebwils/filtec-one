'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore } from '@/data/store';
import { Building2, MessageSquare, CheckCircle2, Radio, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export default function AdminIntegrationsPage() {
  const { integrationEvents, whatsappMessages } = useAppStore();
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const handleTestSync = () => {
    setIsTestingSync(true);
    setTimeout(() => {
      setIsTestingSync(false);
      setSyncSuccessMsg('ERP synchronization test successful (Latency: 84ms). All 99 catalog SKUs validated.');
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Integration Health" subtitle="ERP Billing & WhatsApp Infrastructure" />
      <DesktopSubNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">External Services & Integration Adapters</h2>
          <p className="text-xs text-[#6B7280]">
            Clean adaptor layers isolating existing ERP billing and WhatsApp Business Cloud API
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ERP Adapter */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#111827]">Existing ERP / Billing Authority</h3>
                  <span className="text-[10px] text-[#6B7280] font-mono">Adapter: MockERPAdapter (Swappable)</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-[#4B5563]">
                <span>Authority Role:</span>
                <span className="font-medium text-[#111827]">Financial, Product & Invoice Authority</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Simulated Latency:</span>
                <span className="font-mono text-[#111827]">118 ms (Healthy)</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Pricing Mode:</span>
                <span className="text-[#111827]">Synchronized on Order Authorization</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
              <button
                type="button"
                disabled={isTestingSync}
                onClick={handleTestSync}
                className="bg-neutral-100 hover:bg-neutral-200 text-[#111827] text-xs font-semibold px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSync ? 'animate-spin' : ''}`} />
                <span>Test ERP Handshake</span>
              </button>
              <span className="text-[10px] font-mono text-neutral-500">Zero frontend rewrite needed</span>
            </div>

            {syncSuccessMsg && (
              <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                {syncSuccessMsg}
              </div>
            )}
          </div>

          {/* WhatsApp Adapter */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#111827]">WhatsApp Business Dispatcher</h3>
                  <span className="text-[10px] text-[#6B7280] font-mono">Adapter: MockWhatsAppService (Swappable)</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-[#4B5563]">
                <span>Templates Enabled:</span>
                <span className="font-mono text-[#111827]">order_submit, order_approved, invoice_alert</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Messages Dispatched:</span>
                <span className="font-mono font-bold text-[#111827]">{whatsappMessages.length} delivered</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Primary Channel:</span>
                <span className="text-[#111827]">Dealer Real-time Notifications</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-medium">Automatic dispatch on approval</span>
              <span className="text-[10px] font-mono text-neutral-500">Business Cloud API ready</span>
            </div>
          </div>
        </div>

        {/* Live Outgoing WhatsApp Messages Log */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Dispatched WhatsApp Notifications
              </h3>
              <p className="text-xs text-[#6B7280]">Real-time message bodies generated from field and admin operations</p>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              {whatsappMessages.length} Messages
            </span>
          </div>

          <div className="divide-y divide-[#F3F4F6]">
            {whatsappMessages.map((msg) => (
              <div key={msg.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#111827]">{msg.recipientName}</span>
                    <span className="font-mono text-[10px] text-[#6B7280]">{msg.recipientPhone}</span>
                    <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 rounded">
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-[#374151] bg-[#F9FAFB] p-2 rounded border border-[#E5E7EB] text-xs font-mono">
                    "{msg.messageBody}"
                  </p>
                </div>

                <span className="text-[10px] font-mono text-[#9CA3AF] shrink-0">
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
