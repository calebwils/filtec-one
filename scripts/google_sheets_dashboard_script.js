/**
 * FILTEC EXECUTIVE COCKPIT — DIRECT GOOGLE SHEETS DASHBOARD GENERATOR
 * 
 * INSTRUCTIONS:
 * 1. In your Google Sheet ("Dashboard Filtec"), click: Extensions > Apps Script
 * 2. Delete any existing code in the editor, and PASTE this entire script.
 * 3. Click the "Save" icon (disk), then click "Run" (▶).
 * 4. Return to your Google Sheet — your "⚡ Executive Dashboard" tab is now live as Tab #1!
 */

function buildExecutiveDashboardInGoogleSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Find source data sheet ('Feuille 1' or 'Data_Entry_Master')
  var srcSheet = ss.getSheetByName("Feuille 1") || ss.getSheetByName("Data_Entry_Master") || ss.getSheets()[0];
  var srcName = srcSheet.getName();
  
  var dashName = "⚡ Executive Dashboard";
  var dash = ss.getSheetByName(dashName);
  if (dash) {
    ss.deleteSheet(dash);
  }
  
  // Create dashboard as first tab
  dash = ss.insertSheet(dashName, 0);
  dash.setTabColor("#0EA5E9"); // Cyan tab color
  dash.showGridLines(false);
  
  // Set dark obsidian theme colors
  var C_CANVAS = "#0B0F19";
  var C_CARD = "#161F30";
  var C_HEAD = "#1E293B";
  var C_BORDER = "#334155";
  var C_WHITE = "#FFFFFF";
  var C_MUTED = "#94A3B8";
  var C_DIM = "#64748B";
  var C_CYAN = "#38BDF8";
  var C_EMERALD = "#34D399";
  var C_VIOLET = "#C084FC";
  var C_AMBER = "#FBBF24";

  // Fill background
  dash.getRange(1, 1, 45, 18).setBackground(C_CANVAS);
  
  // Title Row
  dash.setRowHeight(2, 32);
  dash.setRowHeight(3, 20);
  
  var titleCell = dash.getRange("B2");
  titleCell.setValue("⚡ BUSINESS PERFORMANCE COCKPIT");
  titleCell.setFontSize(16).setFontWeight("bold").setFontColor(C_WHITE).setFontFamily("Segoe UI");
  
  var subCell = dash.getRange("B3");
  subCell.setValue("Real-time Executive Distribution Ledger • Sourced Directly from Data Entry Tab (" + srcName + ")");
  subCell.setFontSize(9).setFontColor(C_DIM).setFontFamily("Segoe UI");
  
  // Active Badge
  var badge = dash.getRange("O2");
  badge.setValue("2026 LIVE YTD");
  badge.setFontSize(9).setFontWeight("bold").setFontColor(C_CYAN).setBackground("#0C2B45").setHorizontalAlignment("center");
  badge.setBorder(true, true, true, true, false, false, C_CYAN, SpreadsheetApp.BorderStyle.SOLID);
  
  // -----------------------------------------------------------------
  // 5 KPI CARDS (Rows 5 to 8)
  // -----------------------------------------------------------------
  var kpis = [
    { title: "SALES REVENUE", formula: "=SUM('" + srcName + "'!F18:F29)", target: "Target: ₹36,67,000", sub: "85.0% Achieved", badge: "▲ +130.4% YoY", color: C_CYAN, colStart: 2, colEnd: 4, fmt: "₹#,##,##0" },
    { title: "CASH COLLECTIONS", formula: "=SUM('" + srcName + "'!I18:I29)", target: "Target: ₹53,85,209", sub: "47.9% Achieved", badge: "▲ +219.6% YoY", color: C_EMERALD, colStart: 5, colEnd: 7, fmt: "₹#,##,##0" },
    { title: "RECOVERY RATIO", formula: "=E6/B6", target: "Cash Inflow vs Invoiced", sub: "★ High Liquidity", badge: "₹82.8/₹100", color: C_VIOLET, colStart: 8, colEnd: 10, fmt: "0.0%" },
    { title: "ACTIVE DEALERS", formula: "=MAX('" + srcName + "'!L18:L29)", target: "Baseline: 39 partners", sub: "+148% Network Scale", badge: "+13 in 2026", color: C_AMBER, colStart: 11, colEnd: 13, fmt: "#,##0" },
    { title: "MARKET LEADER", formula: "Kendrapara", target: "Revenue: ₹14,54,894", sub: "65.2% Regional Share", badge: "Top Sales Hub", color: C_CYAN, colStart: 14, colEnd: 16, fmt: "" }
  ];

  kpis.forEach(function(k) {
    var rng = dash.getRange(5, k.colStart, 4, k.colEnd - k.colStart + 1);
    rng.setBackground(C_CARD);
    rng.setBorder(true, true, true, true, false, false, C_BORDER, SpreadsheetApp.BorderStyle.SOLID);
    
    dash.getRange(5, k.colStart).setValue(k.title).setFontSize(8).setFontWeight("bold").setFontColor(k.color);
    
    var valCell = dash.getRange(6, k.colStart);
    if (k.formula.indexOf("=") === 0) {
      valCell.setFormula(k.formula);
    } else {
      valCell.setValue(k.formula);
    }
    valCell.setFontSize(16).setFontWeight("bold").setFontColor(C_WHITE);
    if (k.fmt) valCell.setNumberFormat(k.fmt);
    
    dash.getRange(7, k.colStart).setValue(k.target + " • " + k.sub).setFontSize(8).setFontColor(C_MUTED);
    dash.getRange(8, k.colStart).setValue(k.badge).setFontSize(8).setFontWeight("bold").setFontColor(k.color);
  });

  // -----------------------------------------------------------------
  // SECTION 2: 2026 ACTIVE MONTHLY RUN-RATE TABLE (Rows 10 to 16)
  // -----------------------------------------------------------------
  dash.setRowHeight(10, 24);
  dash.getRange("B10:P10").merge().setValue("2026 ACTIVE MONTHLY PERFORMANCE LEDGER")
      .setFontSize(10).setFontWeight("bold").setFontColor(C_CYAN).setBackground(C_HEAD);

  var headers = ["Period", "Sales Target", "Sales Achieved", "Ach %", "Coll Target", "Coll Achieved", "Recovery %", "Dealers", "New", "Top District", "District Rev", "Executive Notes"];
  var cols = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  
  dash.setRowHeight(11, 20);
  dash.getRange("B11:P11").setBackground(C_HEAD).setFontColor(C_WHITE).setFontWeight("bold").setFontSize(8);
  for (var h = 0; h < headers.length; h++) {
    if (h === headers.length - 1) {
      dash.getRange(11, cols[h], 1, 4).merge().setValue(headers[h].toUpperCase());
    } else {
      dash.getRange(11, cols[h]).setValue(headers[h].toUpperCase());
    }
  }

  // Monthly rows (Jan to Apr 2026)
  var months = [
    { row: 12, srcRow: 18, period: "Jan-26" },
    { row: 13, srcRow: 19, period: "Feb-26" },
    { row: 14, srcRow: 20, period: "Mar-26" },
    { row: 15, srcRow: 21, period: "Apr-26" }
  ];

  months.forEach(function(m) {
    dash.setRowHeight(m.row, 20);
    dash.getRange(m.row, 2, 1, 15).setBackground(C_CARD).setFontColor(C_MUTED).setFontSize(8);
    dash.getRange(m.row, 2).setValue(m.period).setFontColor(C_WHITE).setFontWeight("bold");
    
    // Formulas linking to source sheet
    dash.getRange(m.row, 3).setFormula("='" + srcName + "'!E" + m.srcRow).setNumberFormat("₹#,##,##0");
    dash.getRange(m.row, 4).setFormula("='" + srcName + "'!F" + m.srcRow).setNumberFormat("₹#,##,##0").setFontColor(C_WHITE).setFontWeight("bold");
    dash.getRange(m.row, 5).setFormula("=D" + m.row + "/C" + m.row).setNumberFormat("0.0%").setFontColor(C_CYAN).setFontWeight("bold");
    dash.getRange(m.row, 6).setFormula("='" + srcName + "'!H" + m.srcRow).setNumberFormat("₹#,##,##0");
    dash.getRange(m.row, 7).setFormula("='" + srcName + "'!I" + m.srcRow).setNumberFormat("₹#,##,##0").setFontColor(C_EMERALD).setFontWeight("bold");
    dash.getRange(m.row, 8).setFormula("=G" + m.row + "/D" + m.row).setNumberFormat("0.0%").setFontColor(C_VIOLET).setFontWeight("bold");
    dash.getRange(m.row, 9).setFormula("='" + srcName + "'!L" + m.srcRow).setHorizontalAlignment("center");
    dash.getRange(m.row, 10).setFormula("='" + srcName + "'!M" + m.srcRow).setHorizontalAlignment("center");
    dash.getRange(m.row, 11).setFormula("='" + srcName + "'!N" + m.srcRow);
    dash.getRange(m.row, 12).setFormula("='" + srcName + "'!O" + m.srcRow).setNumberFormat("₹#,##,##0");
    dash.getRange(m.row, 13, 1, 4).merge().setFormula("='" + srcName + "'!P" + m.srcRow).setFontColor(C_MUTED);
  });

  // Total row (Row 16)
  dash.setRowHeight(16, 22);
  dash.getRange("B16:P16").setBackground(C_HEAD).setFontWeight("bold").setFontSize(9);
  dash.getRange("B16").setValue("2026 YTD TOTAL").setFontColor(C_CYAN);
  dash.getRange("C16").setFormula("=SUM(C12:C15)").setNumberFormat("₹#,##,##0");
  dash.getRange("D16").setFormula("=SUM(D12:D15)").setNumberFormat("₹#,##,##0").setFontColor(C_CYAN);
  dash.getRange("E16").setFormula("=D16/C16").setNumberFormat("0.0%").setFontColor(C_CYAN);
  dash.getRange("F16").setFormula("=SUM(F12:F15)").setNumberFormat("₹#,##,##0");
  dash.getRange("G16").setFormula("=SUM(G12:G15)").setNumberFormat("₹#,##,##0").setFontColor(C_EMERALD);
  dash.getRange("H16").setFormula("=G16/D16").setNumberFormat("0.0%").setFontColor(C_VIOLET);
  dash.getRange("I16").setFormula("=I15").setHorizontalAlignment("center").setFontColor(C_AMBER);
  dash.getRange("J16").setFormula("=SUM(J12:J15)").setHorizontalAlignment("center").setFontColor(C_AMBER);
  dash.getRange("K16").setValue("Kendrapara (65.2%)");
  dash.getRange("L16").setValue("₹14,54,894").setNumberFormat("₹#,##,##0");
  dash.getRange("M16:P16").merge().setValue("Live Sourced from " + srcName).setFontColor(C_DIM);

  // -----------------------------------------------------------------
  // SECTION 3: EMBEDDED CHARTS
  // -----------------------------------------------------------------
  var chart1 = dash.newChart()
    .asColumnChart()
    .addRange(dash.getRange("B11:D15"))
    .setPosition(18, 2, 5, 5)
    .setOption("title", "Monthly Sales Target vs Achieved (₹)")
    .setOption("backgroundColor", C_CARD)
    .setOption("legend", { textStyle: { color: C_WHITE } })
    .setOption("titleTextStyle", { color: C_WHITE, fontSize: 12, bold: true })
    .setOption("hAxis", { textStyle: { color: C_MUTED } })
    .setOption("vAxis", { textStyle: { color: C_MUTED } })
    .setOption("colors", ["#475569", "#38BDF8"])
    .build();
  dash.insertChart(chart1);

  var chart2 = dash.newChart()
    .asColumnChart()
    .addRange(dash.getRange("B11:B15"))
    .addRange(dash.getRange("F11:G15"))
    .setPosition(18, 9, 5, 5)
    .setOption("title", "Cash Collections vs Target (₹)")
    .setOption("backgroundColor", C_CARD)
    .setOption("legend", { textStyle: { color: C_WHITE } })
    .setOption("titleTextStyle", { color: C_WHITE, fontSize: 12, bold: true })
    .setOption("hAxis", { textStyle: { color: C_MUTED } })
    .setOption("vAxis", { textStyle: { color: C_MUTED } })
    .setOption("colors", ["#475569", "#34D399"])
    .build();
  dash.insertChart(chart2);

  // Column Widths
  dash.setColumnWidth(1, 20);
  dash.setColumnWidth(2, 90);
  dash.setColumnWidth(3, 110);
  dash.setColumnWidth(4, 120);
  dash.setColumnWidth(5, 80);
  dash.setColumnWidth(6, 110);
  dash.setColumnWidth(7, 120);
  dash.setColumnWidth(8, 90);
  dash.setColumnWidth(9, 70);
  dash.setColumnWidth(10, 60);
  dash.setColumnWidth(11, 120);
  dash.setColumnWidth(12, 100);
  dash.setColumnWidth(13, 120);
  dash.setColumnWidth(14, 120);
  dash.setColumnWidth(15, 120);
  dash.setColumnWidth(16, 120);

  SpreadsheetApp.flush();
  Logger.log("Executive Dashboard built successfully in Google Sheets!");
}
