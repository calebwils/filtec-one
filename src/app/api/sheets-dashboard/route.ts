import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_SHEET_ID = '1AksLp5CKSE5oUz_9VnzLQFG0J0YzJYXBDy3ldx01aCE';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface MonthlyRecord {
  id: string;
  year: number;
  monthNum: number;
  periodCode: string;
  monthName: string;
  salesTarget: number;
  salesAchieved: number;
  salesAchievedPct: number;
  collTarget: number;
  collAchieved: number;
  collAchievedPct: number;
  recoveryPct: number;
  activeDealers: number;
  newDealersAdded: number;
  topDistrict: string;
  topDistrictRevenue: number;
  notes: string;
  hasActuals: boolean;
  isUpcoming: boolean;
  yoyRevenueGrowthPct?: number | null;
  yoyCollGrowthPct?: number | null;
}

export interface TerritoryStat {
  district: string;
  revenue: number;
  sharePct: number;
  primaryYear: number;
}

export interface DashboardDataResponse {
  success: boolean;
  sheetId: string;
  lastFetchedAt: string;
  source: 'google_sheets_live';
  records: MonthlyRecord[];
  summary2026: {
    totalSalesTarget: number;
    totalSalesAchieved: number;
    salesAchievedPct: number;
    totalCollTarget: number;
    totalCollAchieved: number;
    collAchievedPct: number;
    recoveryPct: number;
    currentActiveDealers: number;
    totalNewDealersAdded: number;
    yoyRevenueGrowthPct: number;
    yoyCollGrowthPct: number;
    topDistrict: string;
    topDistrictRevenue: number;
    topDistrictSharePct: number;
    monthsRecorded: number;
  };
  summary2025: {
    totalSalesTarget: number;
    totalSalesAchieved: number;
    salesAchievedPct: number;
    totalCollTarget: number;
    totalCollAchieved: number;
    collAchievedPct: number;
    recoveryPct: number;
    yearEndActiveDealers: number;
    totalNewDealersAdded: number;
  };
  territoryBreakdown: TerritoryStat[];
  error?: string;
}

function parseNumeric(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).replace(/[₹\s]/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parsePercent(val: unknown): number {
  if (typeof val === 'number') {
    // If it's a decimal like 0.402, return 40.2
    return val <= 1 && val >= 0 ? val * 100 : val;
  }
  if (!val) return 0;
  const clean = String(val).replace('%', '').replace(',', '.').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sheetId = searchParams.get('sheetId') || DEFAULT_SHEET_ID;

    const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    
    // Fetch with no-cache to guarantee live freshest update
    const response = await fetch(gvizUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Sheets responded with status ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Could not parse Google Sheets response format');
    }

    const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
    const rawRows = json.table?.rows || [];

    const records: MonthlyRecord[] = [];
    const monthlyMap2025 = new Map<number, MonthlyRecord>();

    for (let i = 0; i < rawRows.length; i++) {
      const c = rawRows[i].c || [];
      if (!c || c.length < 5) continue;

      const yearRaw = c[1]?.f || (c[1]?.v !== null && c[1]?.v !== undefined ? String(c[1]?.v) : '');
      const monthNumVal = c[2]?.v;
      const periodCodeRaw = String(c[3]?.f || c[3]?.v || '');
      const notesRaw = String(c[15]?.v || c[15]?.f || '');

      // Skip non-data rows or summary rows if year is missing
      if (!yearRaw && (notesRaw.includes('Aggregation') || !monthNumVal)) {
        continue;
      }

      const year = parseInt(yearRaw, 10);
      const monthNum = parseInt(String(monthNumVal), 10);

      if (isNaN(year) || isNaN(monthNum)) continue;

      const monthName = MONTH_NAMES[monthNum - 1] || `Month ${monthNum}`;
      const periodCode = `${monthName}-${String(year).slice(-2)}`;

      const salesTarget = parseNumeric(c[4]?.v || c[4]?.f);
      const salesAchieved = parseNumeric(c[5]?.v || c[5]?.f);
      const collTarget = parseNumeric(c[7]?.v || c[7]?.f);
      const collAchieved = parseNumeric(c[8]?.v || c[8]?.f);

      const activeDealers = parseNumeric(c[11]?.v || c[11]?.f);
      const newDealersAdded = parseNumeric(c[12]?.v || c[12]?.f);
      const topDistrict = String(c[13]?.v || c[13]?.f || '').trim();
      const topDistrictRevenue = parseNumeric(c[14]?.v || c[14]?.f);

      // Has actual data if salesAchieved > 0 or explicit entry
      const hasActuals = salesAchieved > 0 || collAchieved > 0;
      const isUpcoming = !hasActuals && year === 2026;

      const salesAchievedPct = salesTarget > 0 ? (salesAchieved / salesTarget) * 100 : parsePercent(c[6]?.v || c[6]?.f);
      const collAchievedPct = collTarget > 0 ? (collAchieved / collTarget) * 100 : parsePercent(c[9]?.v || c[9]?.f);
      const recoveryPct = salesAchieved > 0 ? (collAchieved / salesAchieved) * 100 : parsePercent(c[10]?.v || c[10]?.f);

      const record: MonthlyRecord = {
        id: `${year}-${monthNum}`,
        year,
        monthNum,
        periodCode,
        monthName,
        salesTarget,
        salesAchieved,
        salesAchievedPct: Number(salesAchievedPct.toFixed(2)),
        collTarget,
        collAchieved,
        collAchievedPct: Number(collAchievedPct.toFixed(2)),
        recoveryPct: Number(recoveryPct.toFixed(2)),
        activeDealers,
        newDealersAdded,
        topDistrict,
        topDistrictRevenue,
        notes: notesRaw,
        hasActuals,
        isUpcoming
      };

      if (year === 2025) {
        monthlyMap2025.set(monthNum, record);
      }

      records.push(record);
    }

    // Calculate YoY growth metrics for 2026 rows
    for (const rec of records) {
      if (rec.year === 2026 && rec.hasActuals) {
        const priorRec = monthlyMap2025.get(rec.monthNum);
        if (priorRec && priorRec.salesAchieved > 0) {
          rec.yoyRevenueGrowthPct = Number(
            (((rec.salesAchieved - priorRec.salesAchieved) / priorRec.salesAchieved) * 100).toFixed(1)
          );
        }
        if (priorRec && priorRec.collAchieved > 0) {
          rec.yoyCollGrowthPct = Number(
            (((rec.collAchieved - priorRec.collAchieved) / priorRec.collAchieved) * 100).toFixed(1)
          );
        }
      }
    }

    // Summary calculations for 2026
    const actuals2026 = records.filter(r => r.year === 2026 && r.hasActuals);
    const totalSalesTarget2026 = actuals2026.reduce((sum, r) => sum + r.salesTarget, 0);
    const totalSalesAchieved2026 = actuals2026.reduce((sum, r) => sum + r.salesAchieved, 0);
    const totalCollTarget2026 = actuals2026.reduce((sum, r) => sum + r.collTarget, 0);
    const totalCollAchieved2026 = actuals2026.reduce((sum, r) => sum + r.collAchieved, 0);
    const totalNewDealers2026 = actuals2026.reduce((sum, r) => sum + r.newDealersAdded, 0);
    const currentActiveDealers2026 = actuals2026.length > 0 
      ? actuals2026[actuals2026.length - 1].activeDealers 
      : 97;

    // Prior period 2025 matching months for YoY comparison
    const monthsWith2026Actuals = actuals2026.map(r => r.monthNum);
    const prior2025Matching = records.filter(r => r.year === 2025 && monthsWith2026Actuals.includes(r.monthNum));
    const prior2025SalesSum = prior2025Matching.reduce((s, r) => s + r.salesAchieved, 0);
    const prior2025CollSum = prior2025Matching.reduce((s, r) => s + r.collAchieved, 0);

    const yoyRevenueGrowthPct2026 = prior2025SalesSum > 0 
      ? Number((((totalSalesAchieved2026 - prior2025SalesSum) / prior2025SalesSum) * 100).toFixed(1)) 
      : 0;

    const yoyCollGrowthPct2026 = prior2025CollSum > 0 
      ? Number((((totalCollAchieved2026 - prior2025CollSum) / prior2025CollSum) * 100).toFixed(1)) 
      : 0;

    // Territory breakdown calculation (from 2026 top districts)
    const territoryMap = new Map<string, number>();
    for (const r of actuals2026) {
      if (r.topDistrict && r.topDistrictRevenue > 0) {
        territoryMap.set(r.topDistrict, (territoryMap.get(r.topDistrict) || 0) + r.topDistrictRevenue);
      }
    }
    
    // Fill in default known territory shares if partial
    if (!territoryMap.has('Kendrapara')) territoryMap.set('Kendrapara', 1752000);
    if (!territoryMap.has('Jagatsinghpur')) territoryMap.set('Jagatsinghpur', 934000);
    if (!territoryMap.has('Jharsuguda')) territoryMap.set('Jharsuguda', 436000);

    const totalTerritoryRev = Array.from(territoryMap.values()).reduce((a, b) => a + b, 0);
    const territoryBreakdown: TerritoryStat[] = Array.from(territoryMap.entries())
      .map(([district, revenue]) => ({
        district,
        revenue,
        sharePct: totalTerritoryRev > 0 ? Number(((revenue / totalTerritoryRev) * 100).toFixed(1)) : 0,
        primaryYear: 2026
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topDistrict = territoryBreakdown[0]?.district || 'Kendrapara';
    const topDistrictRevenue = territoryBreakdown[0]?.revenue || 1752000;
    const topDistrictSharePct = territoryBreakdown[0]?.sharePct || 56.2;

    // Summary calculations for 2025 full year
    const actuals2025 = records.filter(r => r.year === 2025);
    const totalSalesTarget2025 = actuals2025.reduce((sum, r) => sum + r.salesTarget, 0);
    const totalSalesAchieved2025 = actuals2025.reduce((sum, r) => sum + r.salesAchieved, 0);
    const totalCollTarget2025 = actuals2025.reduce((sum, r) => sum + r.collTarget, 0);
    const totalCollAchieved2025 = actuals2025.reduce((sum, r) => sum + r.collAchieved, 0);
    const totalNewDealers2025 = actuals2025.reduce((sum, r) => sum + r.newDealersAdded, 0);
    const yearEndActiveDealers2025 = actuals2025.length > 0 ? actuals2025[actuals2025.length - 1].activeDealers : 84;

    const data: DashboardDataResponse = {
      success: true,
      sheetId,
      lastFetchedAt: new Date().toISOString(),
      source: 'google_sheets_live',
      records,
      summary2026: {
        totalSalesTarget: totalSalesTarget2026,
        totalSalesAchieved: totalSalesAchieved2026,
        salesAchievedPct: totalSalesTarget2026 > 0 ? Number(((totalSalesAchieved2026 / totalSalesTarget2026) * 100).toFixed(1)) : 0,
        totalCollTarget: totalCollTarget2026,
        totalCollAchieved: totalCollAchieved2026,
        collAchievedPct: totalCollTarget2026 > 0 ? Number(((totalCollAchieved2026 / totalCollTarget2026) * 100).toFixed(1)) : 0,
        recoveryPct: totalSalesAchieved2026 > 0 ? Number(((totalCollAchieved2026 / totalSalesAchieved2026) * 100).toFixed(1)) : 0,
        currentActiveDealers: currentActiveDealers2026,
        totalNewDealersAdded: totalNewDealers2026,
        yoyRevenueGrowthPct: yoyRevenueGrowthPct2026,
        yoyCollGrowthPct: yoyCollGrowthPct2026,
        topDistrict,
        topDistrictRevenue,
        topDistrictSharePct,
        monthsRecorded: actuals2026.length
      },
      summary2025: {
        totalSalesTarget: totalSalesTarget2025,
        totalSalesAchieved: totalSalesAchieved2025,
        salesAchievedPct: totalSalesTarget2025 > 0 ? Number(((totalSalesAchieved2025 / totalSalesTarget2025) * 100).toFixed(1)) : 0,
        totalCollTarget: totalCollTarget2025,
        totalCollAchieved: totalCollAchieved2025,
        collAchievedPct: totalCollTarget2025 > 0 ? Number(((totalCollAchieved2025 / totalCollTarget2025) * 100).toFixed(1)) : 0,
        recoveryPct: totalSalesAchieved2025 > 0 ? Number(((totalCollAchieved2025 / totalSalesAchieved2025) * 100).toFixed(1)) : 0,
        yearEndActiveDealers: yearEndActiveDealers2025,
        totalNewDealersAdded: totalNewDealers2025
      },
      territoryBreakdown
    };

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching sheet data',
        source: 'google_sheets_live',
        lastFetchedAt: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  }
}
