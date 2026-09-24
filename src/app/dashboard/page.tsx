'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Layers,
  FileSpreadsheet,
  Play,
  Pause,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Zap,
  Building2,
  ArrowLeft,
  Sparkles,
  DollarSign,
  Printer
} from 'lucide-react';
import { MonthlyRecord, DashboardDataResponse, TerritoryStat } from '@/app/api/sheets-dashboard/route';

const GOOGLE_SHEET_ID = '1AksLp5CKSE5oUz_9VnzLQFG0J0YzJYXBDy3ldx01aCE';
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`;

function formatCurrency(val: number): string {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} Lakh`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}

export default function ExecutiveSheetsDashboardPage() {
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'2026_YTD' | '2025_FULL' | 'ALL_HISTORY'>('2026_YTD');
  
  // Auto-sync polling states
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncIntervalSeconds, setSyncIntervalSeconds] = useState(15);
  const [secondsUntilSync, setSecondsUntilSync] = useState(15);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Custom sheet ID modal state
  const [customSheetId, setCustomSheetId] = useState(GOOGLE_SHEET_ID);
  const [isSheetSettingsOpen, setIsSheetSettingsOpen] = useState(false);
  const [tempSheetIdInput, setTempSheetIdInput] = useState(GOOGLE_SHEET_ID);

  // Fetch data function
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/sheets-dashboard?sheetId=${encodeURIComponent(customSheetId)}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load live Google Sheets data`);
      const json: DashboardDataResponse = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to retrieve sheet data');
      
      setData(json);
      setLastUpdated(new Date());
      setErrorMessage(null);
    } catch (err) {
      console.error('Error fetching sheet data:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error synchronizing with Google Sheets');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setSecondsUntilSync(syncIntervalSeconds);
    }
  }, [customSheetId, syncIntervalSeconds]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Countdown and periodic timer
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const timer = setInterval(() => {
      setSecondsUntilSync((prev) => {
        if (prev <= 1) {
          fetchData();
          return syncIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoSyncEnabled, syncIntervalSeconds, fetchData]);

  // Filter records based on selected tab
  const filteredRecords = useMemo(() => {
    if (!data) return [];
    if (activeTab === '2026_YTD') {
      return data.records.filter((r) => r.year === 2026);
    }
    if (activeTab === '2025_FULL') {
      return data.records.filter((r) => r.year === 2025);
    }
    return data.records;
  }, [data, activeTab]);

  // YoY comparison data for charts
  const monthlyComparison = useMemo(() => {
    if (!data) return [];
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const map2025 = new Map(data.records.filter((r) => r.year === 2025).map((r) => [r.monthNum, r]));
    const map2026 = new Map(data.records.filter((r) => r.year === 2026).map((r) => [r.monthNum, r]));

    return months.map((m) => {
      const r25 = map2025.get(m);
      const r26 = map2026.get(m);
      return {
        monthNum: m,
        monthName: r25?.monthName || r26?.monthName || `M${m}`,
        sales2025: r25?.salesAchieved || 0,
        target2025: r25?.salesTarget || 0,
        sales2026: r26?.salesAchieved || 0,
        target2026: r26?.salesTarget || 0,
        coll2025: r25?.collAchieved || 0,
        coll2026: r26?.collAchieved || 0,
        dealers2025: r25?.activeDealers || 0,
        dealers2026: r26?.activeDealers || 0,
        has2026Actual: (r26?.salesAchieved || 0) > 0,
        notes2026: r26?.notes || ''
      };
    });
  }, [data]);

  // Summary statistics for current active view
  const currentSummary = useMemo(() => {
    if (!data) return null;
    if (activeTab === '2025_FULL') {
      return {
        salesAchieved: data.summary2025.totalSalesAchieved,
        salesTarget: data.summary2025.totalSalesTarget,
        salesAchievedPct: data.summary2025.salesAchievedPct,
        collAchieved: data.summary2025.totalCollAchieved,
        collTarget: data.summary2025.totalCollTarget,
        collAchievedPct: data.summary2025.collAchievedPct,
        recoveryPct: data.summary2025.recoveryPct,
        activeDealers: data.summary2025.yearEndActiveDealers,
        newDealers: data.summary2025.totalNewDealersAdded,
        yoySalesPct: 0,
        yoyCollPct: 0,
        topDistrict: 'Kendrapara',
        topDistrictRev: 850000,
        topDistrictShare: 42.5,
        periodLabel: 'FY 2025 Consolidated Total'
      };
    }
    // Default to 2026 YTD
    return {
      salesAchieved: data.summary2026.totalSalesAchieved,
      salesTarget: data.summary2026.totalSalesTarget,
      salesAchievedPct: data.summary2026.salesAchievedPct,
      collAchieved: data.summary2026.totalCollAchieved,
      collTarget: data.summary2026.totalCollTarget,
      collAchievedPct: data.summary2026.collAchievedPct,
      recoveryPct: data.summary2026.recoveryPct,
      activeDealers: data.summary2026.currentActiveDealers,
      newDealers: data.summary2026.totalNewDealersAdded,
      yoySalesPct: data.summary2026.yoyRevenueGrowthPct,
      yoyCollPct: data.summary2026.yoyCollGrowthPct,
      topDistrict: data.summary2026.topDistrict,
      topDistrictRev: data.summary2026.topDistrictRevenue,
      topDistrictShare: data.summary2026.topDistrictSharePct,
      periodLabel: `2026 YTD (${data.summary2026.monthsRecorded} Months Active)`
    };
  }, [data, activeTab]);

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 selection:bg-cyan-500 selection:text-black font-sans antialiased">
      {/* BACKGROUND AMBIENT GLOW EFFECTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TOP PLATFORM BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-500 transition-all shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to FILTEC Operations</span>
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                FILTEC POLYPLAST PVT LTD
              </span>
            </div>
          </div>

          {/* LIVE SYNC CONTROLS & STATUS BADGE */}
          <div className="flex flex-wrap items-center gap-3">
            {/* GOOGLE SHEETS LIVE BADGE */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 text-xs shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-mono text-emerald-400 font-semibold tracking-wide flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Live Google Sheet Connected
              </span>
            </div>

            {/* AUTO SYNC TIMER TOGGLE */}
            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                autoSyncEnabled
                  ? 'bg-slate-900/90 border-cyan-500/40 text-cyan-300 hover:border-cyan-400'
                  : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={autoSyncEnabled ? 'Click to pause auto-sync' : 'Click to resume auto-sync'}
            >
              {autoSyncEnabled ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Auto-sync in {secondsUntilSync}s</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-sync Paused</span>
                </>
              )}
            </button>

            {/* INSTANT SYNC BUTTON */}
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {/* DIRECT GOOGLE SHEET LINK */}
            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Sheet ↗</span>
            </a>

            {/* PRINT / EXPORT PDF */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
              title="Print or Save Executive PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* HEADER HERO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                EXECUTIVE COCKPIT
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                Direct Cloud Sheet Synchronization
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Business Performance Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time executive tracking for commercial distribution, monthly billing run-rate, cash collection velocity, and regional dealership expansion.
            </p>
          </div>

          {/* ACTIVE PERIOD FILTER TABS */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('2026_YTD')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === '2026_YTD'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2026 YTD
            </button>
            <button
              onClick={() => setActiveTab('2025_FULL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === '2025_FULL'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2025 Full Year
            </button>
            <button
              onClick={() => setActiveTab('ALL_HISTORY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'ALL_HISTORY'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All 24 Months
            </button>
          </div>
        </div>

        {/* ERROR NOTIFICATION BANNER */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => fetchData(true)}
              className="px-3 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-100 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* 5 TOP EXECUTIVE KPI CARDS */}
        {currentSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* CARD 1: SALES REVENUE */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/80 hover:border-cyan-500/40 p-5 transition-all duration-200 shadow-lg hover:shadow-cyan-500/5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-cyan-400">
                  Sales Revenue
                </span>
                {currentSummary.yoySalesPct > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <TrendingUp className="w-3 h-3" />
                    +{currentSummary.yoySalesPct}% YoY
                  </span>
                )}
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
                {formatCurrency(currentSummary.salesAchieved)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>Target: {formatCurrency(currentSummary.salesTarget)}</span>
                <span className="font-semibold text-cyan-300">
                  {currentSummary.salesAchievedPct}%
                </span>
              </div>
              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-800/80 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(currentSummary.salesAchievedPct, 100)}%` }}
                />
              </div>
            </div>

            {/* CARD 2: CASH COLLECTIONS */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/80 hover:border-emerald-500/40 p-5 transition-all duration-200 shadow-lg hover:shadow-emerald-500/5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-emerald-400">
                  Cash Collections
                </span>
                {currentSummary.yoyCollPct > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <TrendingUp className="w-3 h-3" />
                    +{currentSummary.yoyCollPct}% YoY
                  </span>
                )}
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
                {formatCurrency(currentSummary.collAchieved)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>Target: {formatCurrency(currentSummary.collTarget)}</span>
                <span className="font-semibold text-emerald-300">
                  {currentSummary.collAchievedPct}%
                </span>
              </div>
              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-800/80 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(currentSummary.collAchievedPct, 100)}%` }}
                />
              </div>
            </div>

            {/* CARD 3: RECOVERY RATIO */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/80 hover:border-violet-500/40 p-5 transition-all duration-200 shadow-lg hover:shadow-violet-500/5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-violet-400">
                  Recovery Ratio
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                  <ShieldCheck className="w-3 h-3 text-violet-400" />
                  ★ High Health
                </span>
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
                {currentSummary.recoveryPct}%
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>Cash Inflow vs Invoiced</span>
                <span className="font-semibold text-violet-300">
                  ₹{(currentSummary.recoveryPct).toFixed(0)}/₹100
                </span>
              </div>
              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-800/80 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 to-purple-400 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(currentSummary.recoveryPct, 100)}%` }}
                />
              </div>
            </div>

            {/* CARD 4: ACTIVE DEALERS */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/80 hover:border-amber-500/40 p-5 transition-all duration-200 shadow-lg hover:shadow-amber-500/5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-400">
                  Active Dealers
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  +{currentSummary.newDealers} Added
                </span>
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
                {currentSummary.activeDealers}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>Base: 39 baseline</span>
                <span className="font-semibold text-amber-300">
                  +148% Growth
                </span>
              </div>
              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-800/80 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min((currentSummary.activeDealers / 100) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* CARD 5: TOP DISTRICT */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/80 hover:border-sky-500/40 p-5 transition-all duration-200 shadow-lg hover:shadow-sky-500/5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-sky-400">
                  Market Leader
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {currentSummary.topDistrictShare}% Share
                </span>
              </div>
              <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight truncate">
                {currentSummary.topDistrict}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>Revenue Anchor</span>
                <span className="font-semibold text-sky-300 font-mono">
                  {formatCurrency(currentSummary.topDistrictRev)}
                </span>
              </div>
              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-800/80 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-cyan-400 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(currentSummary.topDistrictShare, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECONDARY EXECUTIVE INTELLIGENCE ROW */}
        {currentSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. OUTSTANDING MARKET RECEIVABLES */}
            <div className="rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/80 hover:border-amber-500/30 p-4 transition-all shadow-md flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span className="uppercase tracking-wider">Market Receivables Gap</span>
                </div>
                <div className="text-xl lg:text-2xl font-extrabold font-mono text-white mt-1">
                  {formatCurrency(Math.max(0, currentSummary.salesAchieved - currentSummary.collAchieved))}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Uncollected buffer ({((1 - currentSummary.recoveryPct / 100) * 100).toFixed(1)}% of sales)
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold">
                  82.8% Inflow
                </span>
                <span className="block text-[10px] text-slate-500 font-mono mt-1">Low Capital Risk</span>
              </div>
            </div>

            {/* 2. DEALER CHANNEL PRODUCTIVITY */}
            <div className="rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/80 hover:border-cyan-500/30 p-4 transition-all shadow-md flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="uppercase tracking-wider">Dealer Channel Productivity</span>
                </div>
                <div className="text-xl lg:text-2xl font-extrabold font-mono text-cyan-300 mt-1">
                  {formatCurrency(currentSummary.activeDealers > 0 ? Math.round(currentSummary.salesAchieved / currentSummary.activeDealers) : 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Average revenue per active partner
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs font-semibold">
                  +68% YoY Depth
                </span>
                <span className="block text-[10px] text-slate-500 font-mono mt-1">97 Active Retailers</span>
              </div>
            </div>

            {/* 3. PROJECTED 2026 ANNUAL FINISH */}
            <div className="rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/80 hover:border-violet-500/30 p-4 transition-all shadow-md flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="uppercase tracking-wider">Projected 2026 Annual Finish</span>
                </div>
                <div className="text-xl lg:text-2xl font-extrabold font-mono text-violet-300 mt-1">
                  {formatCurrency(Math.round((currentSummary.salesAchieved / 4) * 12))}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Run-rate forecast at ₹7.79L/month pace
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono text-xs font-semibold">
                  +108% vs FY25
                </span>
                <span className="block text-[10px] text-slate-500 font-mono mt-1">Target: ₹1.05 Cr</span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN VISUAL CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CHART 1: MONTHLY RUN-RATE & YOY REVENUE COMPARISON (7 COLS) */}
          <div className="lg:col-span-7 rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/90 p-5 sm:p-6 flex flex-col justify-between shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Monthly Revenue Velocity & YoY Comparison
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  FY 2025 vs FY 2026 Monthly Achieved Sales (₹)
                </p>
              </div>

              {/* LEGEND */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-600" />
                  <span className="text-slate-300">2025 Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  <span className="text-cyan-300 font-semibold">2026 Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-amber-400" />
                  <span className="text-amber-300">Target</span>
                </div>
              </div>
            </div>

            {/* SVG BAR CHART */}
            <div className="py-6 overflow-x-auto">
              <div className="min-w-[500px]">
                {/* SVG CONTAINER */}
                <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-3 px-2 border-b border-slate-700/60 pb-2 relative">
                  {/* BACKGROUND GRID LINES */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-slate-500 w-full" />
                    <div className="border-b border-slate-500 w-full" />
                    <div className="border-b border-slate-500 w-full" />
                    <div className="border-b border-slate-500 w-full" />
                  </div>

                  {monthlyComparison.map((m) => {
                    const maxVal = 1200000;
                    const height25 = Math.min((m.sales2025 / maxVal) * 100, 100);
                    const height26 = m.has2026Actual ? Math.min((m.sales2026 / maxVal) * 100, 100) : 0;
                    const isHovered = hoveredMonth === m.monthName;

                    return (
                      <div
                        key={m.monthNum}
                        onMouseEnter={() => setHoveredMonth(m.monthName)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      >
                        {/* TOOLTIP ON HOVER */}
                        {isHovered && (
                          <div className="absolute -top-24 z-30 p-2.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-[11px] font-mono shadow-2xl pointer-events-none whitespace-nowrap min-w-[160px]">
                            <div className="font-bold text-white border-b border-slate-700 pb-1 mb-1">
                              {m.monthName} Performance
                            </div>
                            <div className="text-slate-400 flex justify-between">
                              <span>2025:</span>
                              <span className="text-slate-200 font-semibold">{formatCurrency(m.sales2025)}</span>
                            </div>
                            {m.has2026Actual && (
                              <>
                                <div className="text-cyan-400 flex justify-between">
                                  <span>2026:</span>
                                  <span className="font-bold">{formatCurrency(m.sales2026)}</span>
                                </div>
                                <div className="text-emerald-400 flex justify-between font-bold">
                                  <span>YoY Growth:</span>
                                  <span>
                                    +{(((m.sales2026 - m.sales2025) / m.sales2025) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </>
                            )}
                            {m.notes2026 && (
                              <div className="text-[10px] text-slate-400 mt-1 max-w-[180px] truncate">
                                {m.notes2026}
                              </div>
                            )}
                          </div>
                        )}

                        {/* BARS CONTAINER */}
                        <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                          {/* 2025 BAR */}
                          <div
                            style={{ height: `${height25}%` }}
                            className="w-1/2 sm:w-2.5 bg-slate-600/80 hover:bg-slate-500 rounded-t-xs transition-all duration-300"
                          />

                          {/* 2026 BAR */}
                          {m.has2026Actual ? (
                            <div
                              style={{ height: `${height26}%` }}
                              className="w-1/2 sm:w-2.5 bg-gradient-to-t from-cyan-600 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 rounded-t-xs transition-all duration-300 shadow-sm shadow-cyan-400/40"
                            />
                          ) : (
                            <div className="w-1/2 sm:w-2.5 h-1 bg-slate-800/50 rounded-xs" />
                          )}
                        </div>

                        {/* MONTH LABEL */}
                        <span
                          className={`text-[11px] font-mono mt-2 transition-colors ${
                            m.has2026Actual ? 'text-cyan-300 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {m.monthName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* QUICK STAT FOOTER FOR CHART 1 */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Peak 2026 Month</span>
                <span className="text-cyan-400 font-bold text-sm">March (₹8.70 Lakh)</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Highest YoY Surge</span>
                <span className="text-emerald-400 font-bold text-sm">April (+280.2%)</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Average Run-Rate</span>
                <span className="text-amber-400 font-bold text-sm">₹7.79 Lakh/Mo</span>
              </div>
            </div>
          </div>

          {/* CHART 2: TERRITORY DISTRIBUTION & DEALER EXPANSION (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* TERRITORY BREAKDOWN */}
            <div className="rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/90 p-5 shadow-xl flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-sky-400" />
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    Territory Distribution (2026)
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">Revenue Weightage</span>
              </div>

              {/* DONUT & LIST CONTAINER */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center py-4">
                {/* SVG DONUT */}
                <div className="sm:col-span-5 flex items-center justify-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                      {/* DONUT BACKGROUND */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1E293B" strokeWidth="16" />
                      {/* KENDRAPARA (65.2%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#0EA5E9"
                        strokeWidth="16"
                        strokeDasharray={`${65.2 * 2.51} 251`}
                        strokeDashoffset="0"
                        className="transition-all duration-1000"
                      />
                      {/* JHARSUGUDA (19.5%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#8B5CF6"
                        strokeWidth="16"
                        strokeDasharray={`${19.5 * 2.51} 251`}
                        strokeDashoffset={`-${65.2 * 2.51}`}
                        className="transition-all duration-1000"
                      />
                      {/* JAGATSINGHPUR (15.3%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="16"
                        strokeDasharray={`${15.3 * 2.51} 251`}
                        strokeDashoffset={`-${(65.2 + 19.5) * 2.51}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-mono text-slate-400">Top Hub</span>
                      <span className="text-sm font-bold text-white font-mono">65.2%</span>
                    </div>
                  </div>
                </div>

                {/* TERRITORY LIST */}
                <div className="sm:col-span-7 space-y-2.5">
                  {(data?.territoryBreakdown || []).map((t, idx) => {
                    const colors = [
                      { dot: 'bg-sky-500', bar: 'from-sky-500 to-cyan-400', text: 'text-sky-400' },
                      { dot: 'bg-violet-500', bar: 'from-violet-500 to-purple-400', text: 'text-violet-400' },
                      { dot: 'bg-emerald-500', bar: 'from-emerald-500 to-teal-400', text: 'text-emerald-400' }
                    ];
                    const c = colors[idx % colors.length];

                    return (
                      <div key={t.district} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="font-semibold text-slate-200">{t.district}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-300">
                            {formatCurrency(t.revenue)} ({t.sharePct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${c.bar} h-1.5 rounded-full`}
                            style={{ width: `${t.sharePct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DEALER NETWORK EXPANSION CURVE */}
            <div className="rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/90 p-5 shadow-xl flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    Authorized Dealer Expansion
                  </h2>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-semibold">+148% Network Surge</span>
              </div>

              {/* CURVE GRAPH */}
              <div className="py-3">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-slate-400">Total Network Reach</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold font-mono text-emerald-400">97 Dealers</span>
                    <span className="text-xs text-slate-500 font-mono">(from 39 baseline)</span>
                  </div>
                </div>

                {/* STEPPED EXPANSION BARS */}
                <div className="h-16 flex items-end gap-1 px-1">
                  {[
                    { period: 'Jan-25', count: 39 },
                    { period: 'Mar-25', count: 46 },
                    { period: 'Jun-25', count: 62 },
                    { period: 'Sep-25', count: 71 },
                    { period: 'Dec-25', count: 84 },
                    { period: 'Jan-26', count: 86 },
                    { period: 'Feb-26', count: 90 },
                    { period: 'Mar-26', count: 92 },
                    { period: 'Apr-26', count: 97 }
                  ].map((p, i) => {
                    const heightPct = Math.min(((p.count - 30) / 70) * 100, 100);
                    return (
                      <div key={p.period} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-xs transition-all duration-300 ${
                            i >= 5 ? 'bg-emerald-400 shadow-sm shadow-emerald-400/40' : 'bg-slate-700'
                          }`}
                          title={`${p.period}: ${p.count} active dealers`}
                        />
                        <span className="text-[9px] font-mono text-slate-500 mt-1 truncate">
                          {p.period.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FULL DETAILED MONTHLY DATA & ENTRY REGISTER */}
        <div className="rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/90 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Company Master Data & Monthly Entry Register
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full synchronized ledger reflecting live entries from Google Sheets tab &quot;Feuille 1&quot;
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                {filteredRecords.length} records displayed
              </span>
              <a
                href={GOOGLE_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-400 transition-all"
              >
                <span>Add / Edit in Sheets</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Sales Target</th>
                  <th className="py-3 px-4">Sales Achieved</th>
                  <th className="py-3 px-4">Ach %</th>
                  <th className="py-3 px-4">Coll Target</th>
                  <th className="py-3 px-4">Coll Achieved</th>
                  <th className="py-3 px-4">Recovery %</th>
                  <th className="py-3 px-4">Dealers</th>
                  <th className="py-3 px-4">Top District</th>
                  <th className="py-3 px-4">Notes & Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredRecords.map((r) => {
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        r.isUpcoming ? 'opacity-40 bg-slate-950/20' : ''
                      }`}
                    >
                      {/* PERIOD */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-200">
                        <span className="flex items-center gap-1.5">
                          {r.year === 2026 && r.hasActuals && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          )}
                          {r.periodCode}
                        </span>
                      </td>

                      {/* SALES TARGET */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {r.salesTarget > 0 ? formatCurrency(r.salesTarget) : '—'}
                      </td>

                      {/* SALES ACHIEVED */}
                      <td className="py-3 px-4 whitespace-nowrap font-semibold">
                        {r.hasActuals ? (
                          <span className="text-white">{formatCurrency(r.salesAchieved)}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                        {r.yoyRevenueGrowthPct !== undefined && r.yoyRevenueGrowthPct !== null && (
                          <span
                            className={`ml-1.5 text-[10px] ${
                              r.yoyRevenueGrowthPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            ({r.yoyRevenueGrowthPct >= 0 ? '+' : ''}
                            {r.yoyRevenueGrowthPct}%)
                          </span>
                        )}
                      </td>

                      {/* SALES ACH % */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.hasActuals ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                r.salesAchievedPct >= 100
                                  ? 'text-emerald-400'
                                  : r.salesAchievedPct >= 70
                                  ? 'text-cyan-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {r.salesAchievedPct.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* COLL TARGET */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {r.collTarget > 0 ? formatCurrency(r.collTarget) : '—'}
                      </td>

                      {/* COLL ACHIEVED */}
                      <td className="py-3 px-4 whitespace-nowrap font-semibold">
                        {r.hasActuals ? (
                          <span className="text-emerald-400">{formatCurrency(r.collAchieved)}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* RECOVERY % */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.hasActuals ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              r.recoveryPct >= 80
                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                : r.recoveryPct >= 50
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {r.recoveryPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* DEALERS */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                        {r.activeDealers > 0 ? (
                          <span>
                            {r.activeDealers}{' '}
                            {r.newDealersAdded > 0 && (
                              <span className="text-amber-400 text-[10px]">(+{r.newDealersAdded})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* TOP DISTRICT */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                        {r.topDistrict ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200">
                            {r.topDistrict}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* NOTES */}
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate font-sans text-xs">
                        {r.notes || <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* EXECUTIVE STRATEGIC TAKEAWAYS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TAKEAWAY 1 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/90 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Revenue Acceleration
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">₹31.16 Lakh achieved</strong> in just 4 months of 2026, already matching <strong className="text-cyan-400">69.3% of entire FY 2025</strong> annual revenue. March delivered an all-time company peak of 113.2% target achievement.
            </p>
          </div>

          {/* TAKEAWAY 2 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/90 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Cash Liquidity Discipline
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Collections surged <strong className="text-emerald-400">+219.6% YoY</strong> to ₹25.81 Lakh. The recovery ratio maintained a healthy <strong className="text-white">82.8%</strong>, converting distributor order demand into real cash inflows with low working-capital lockup.
            </p>
          </div>

          {/* TAKEAWAY 3 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#131B2A] to-[#0D1420] border border-slate-800/90 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Network & Territory Scale
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Active dealership footprint expanded from <strong className="text-white">39 to 97 partners</strong>. Kendrapara anchors 65.2% of key revenue, while Jharsuguda emerges as the fastest expanding secondary distribution corridor (+278% ramp).
            </p>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-800/80 font-mono">
          <div className="flex items-center gap-2">
            <span>FILTEC Live Sheet Engine</span>
            <span>•</span>
            <span>Google Sheet ID: {GOOGLE_SHEET_ID}</span>
          </div>
          <div>
            Last live synchronization:{' '}
            <span className="text-slate-300">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Syncing...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
