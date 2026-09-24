import os
import shutil
import openpyxl
from copy import copy
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart import BarChart, LineChart, DoughnutChart, Reference
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.line import LineProperties

def build_google_sheets_master():
    src_path = "/Users/mac/Desktop/Dashboard 2026/Dashboard 2026.xlsx"
    backup_path = "/Users/mac/Desktop/Dashboard 2026/Dashboard 2026_Original.xlsx"
    out_path = "/Users/mac/Desktop/Dashboard 2026/Dashboard_2026_GoogleSheets_Master.xlsx"

    # 1. Back up original
    if not os.path.exists(backup_path):
        shutil.copyfile(src_path, backup_path)
        print(f"Backed up original file to: {backup_path}")

    # Load source workbook
    wb_src = openpyxl.load_workbook(src_path)
    
    # We will create a new master workbook
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    FONT = "Segoe UI"
    
    # Colors
    C_CANVAS = "0B0F19"         # Deep obsidian canvas
    C_CARD = "161F30"           # Elevated dark card container
    C_CARD_HEAD = "1E293B"      # Dark slate header / subcard
    C_BORDER = "243044"         # Subtle card border
    
    C_TEXT_WHITE = "F8FAFC"
    C_TEXT_MUTED = "94A3B8"
    C_TEXT_DIM = "64748B"
    
    # Neon Accent Colors
    C_CYAN = "38BDF8"
    C_CYAN_BG = "0C2B45"
    C_EMERALD = "34D399"
    C_EMERALD_BG = "0A3828"
    C_VIOLET = "C084FC"
    C_VIOLET_BG = "2E1A47"
    C_AMBER = "FBBF24"
    C_AMBER_BG = "382A0C"
    
    fill_canvas = PatternFill(start_color=C_CANVAS, end_color=C_CANVAS, fill_type="solid")
    fill_card = PatternFill(start_color=C_CARD, end_color=C_CARD, fill_type="solid")
    fill_card_head = PatternFill(start_color=C_CARD_HEAD, end_color=C_CARD_HEAD, fill_type="solid")
    fill_pill_cyan = PatternFill(start_color=C_CYAN_BG, end_color=C_CYAN_BG, fill_type="solid")
    fill_pill_emerald = PatternFill(start_color=C_EMERALD_BG, end_color=C_EMERALD_BG, fill_type="solid")
    fill_pill_violet = PatternFill(start_color=C_VIOLET_BG, end_color=C_VIOLET_BG, fill_type="solid")
    fill_pill_amber = PatternFill(start_color=C_AMBER_BG, end_color=C_AMBER_BG, fill_type="solid")
    
    s_subtle = Side(border_style="thin", color=C_BORDER)
    border_card = Border(left=s_subtle, right=s_subtle, top=s_subtle, bottom=s_subtle)
    border_tbl_th = Border(left=s_subtle, right=s_subtle, top=s_subtle, bottom=Side(border_style="medium", color=C_CYAN))
    border_tbl_row = Border(left=s_subtle, right=s_subtle, top=s_subtle, bottom=s_subtle)
    
    f_cockpit_title = Font(name=FONT, size=16, bold=True, color=C_TEXT_WHITE)
    f_kpi_lbl = Font(name=FONT, size=9, bold=True, color=C_TEXT_MUTED)
    f_kpi_val = Font(name=FONT, size=18, bold=True, color=C_TEXT_WHITE)
    f_kpi_sub = Font(name=FONT, size=9, color=C_TEXT_MUTED)
    f_tbl_hdr = Font(name=FONT, size=9, bold=True, color=C_TEXT_WHITE)
    f_data = Font(name=FONT, size=9, color=C_TEXT_MUTED)
    f_data_bold = Font(name=FONT, size=9, bold=True, color=C_TEXT_WHITE)
    
    al_center = Alignment(horizontal="center", vertical="center")
    al_left = Alignment(horizontal="left", vertical="center")
    al_right = Alignment(horizontal="right", vertical="center")
    
    FMT_CURR = "[$₹-4009]#,##0"
    FMT_PCT = "0.0%"
    FMT_INT = "#,##0"

    # =========================================================================
    # SHEET 1: ⚡ EXECUTIVE COCKPIT
    # =========================================================================
    ws_dash = wb.create_sheet(title="⚡ Executive Cockpit")
    ws_dash.views.sheetView[0].showGridLines = False

    # Fill canvas
    for r in range(1, 45):
        ws_dash.row_dimensions[r].height = 19
        for c in range(1, 18):
            ws_dash.cell(r, c).fill = fill_canvas

    # Header Title
    ws_dash.row_dimensions[2].height = 24
    ws_dash.row_dimensions[3].height = 16
    ws_dash["B2"].value = "⚡ BUSINESS PERFORMANCE COCKPIT"
    ws_dash["B2"].font = f_cockpit_title
    ws_dash["B3"].value = "Real-time Executive Distribution Ledger • Multi-Territory Billing, Cash Recovery & Channel Expansion"
    ws_dash["B3"].font = Font(name=FONT, size=9, color=C_TEXT_DIM)

    # 2026 YTD Filter Badge
    ws_dash["N2"].value = "ACTIVE VIEW:"
    ws_dash["N2"].font = Font(name=FONT, size=8, bold=True, color=C_TEXT_DIM)
    ws_dash["N2"].alignment = al_right
    ws_dash["O2"].value = "2026 YTD (LIVE)"
    ws_dash["O2"].font = Font(name=FONT, size=9, bold=True, color=C_CYAN)
    ws_dash["O2"].fill = fill_pill_cyan
    ws_dash["O2"].alignment = al_center
    ws_dash["O2"].border = border_card

    # -------------------------------------------------------------
    # 5 KPI SUMMARY CARDS (Rows 5 to 9)
    # -------------------------------------------------------------
    kpis = [
        ("SALES REVENUE", "=Data_Entry_Master!F30", "=Data_Entry_Master!E30", "=Data_Entry_Master!G30", "B", "D", FMT_CURR, C_CYAN, "▲ +130.4% YoY"),
        ("CASH COLLECTIONS", "=Data_Entry_Master!I30", "=Data_Entry_Master!H30", "=Data_Entry_Master!J30", "E", "G", FMT_CURR, C_EMERALD, "▲ +219.6% YoY"),
        ("RECOVERY RATIO", "=Data_Entry_Master!K30", "★ High Health", "", "H", "J", FMT_PCT, C_VIOLET, "₹82.8/₹100 Inflow"),
        ("ACTIVE DEALERS", "=Data_Entry_Master!L30", "=Data_Entry_Master!M30", "", "K", "M", FMT_INT, C_AMBER, "+13 in 2026"),
        ("TOP DISTRICT", "Kendrapara", "₹14.55 Lakh", "65.2% Share", "N", "P", None, C_CYAN, "Anchor Market")
    ]

    for title, formula_val, sub1, sub2, cs, ce, num_fmt, accent, badge_txt in kpis:
        cs_idx = openpyxl.utils.column_index_from_string(cs)
        ce_idx = openpyxl.utils.column_index_from_string(ce)
        
        # Merge rows
        ws_dash.merge_cells(f"{cs}5:{ce}5")
        ws_dash.merge_cells(f"{cs}6:{ce}6")
        ws_dash.merge_cells(f"{cs}7:{ce}7")
        ws_dash.merge_cells(f"{cs}8:{ce}8")
        
        c_title = ws_dash[f"{cs}5"]
        c_title.value = f"  {title}"
        c_title.font = Font(name=FONT, size=8, bold=True, color=accent)
        c_title.alignment = al_left
        
        c_val = ws_dash[f"{cs}6"]
        c_val.value = formula_val
        c_val.font = f_kpi_val
        c_val.alignment = al_left
        if num_fmt: c_val.number_format = num_fmt
        
        c_sub = ws_dash[f"{cs}7"]
        if title == "SALES REVENUE":
            c_sub.value = "Target: ₹36,67,000 • 85.0%"
        elif title == "CASH COLLECTIONS":
            c_sub.value = "Target: ₹53,85,209 • 47.9%"
        elif title == "RECOVERY RATIO":
            c_sub.value = "Cash Recovery Health: 82.8%"
        elif title == "ACTIVE DEALERS":
            c_sub.value = "+148% Growth from 39 base"
        else:
            c_sub.value = "Kendrapara: ₹14,54,894"
        c_sub.font = f_kpi_sub
        c_sub.alignment = al_left

        c_badge = ws_dash[f"{cs}8"]
        c_badge.value = badge_txt
        c_badge.font = Font(name=FONT, size=8, bold=True, color=accent)
        c_badge.alignment = al_left

        # Format Card Background & Border
        for r in range(5, 9):
            for c in range(cs_idx, ce_idx + 1):
                cell = ws_dash.cell(r, c)
                cell.fill = fill_card
                top = s_subtle if r == 5 else None
                bottom = s_subtle if r == 8 else None
                left = s_subtle if c == cs_idx else None
                right = s_subtle if c == ce_idx else None
                cell.border = Border(left=left, right=right, top=top, bottom=bottom)

    # -------------------------------------------------------------
    # SECTION 2: 2026 MONTHLY RUN-RATE & YOY TABLE (Rows 11 to 18)
    # -------------------------------------------------------------
    ws_dash.row_dimensions[10].height = 14
    ws_dash.row_dimensions[11].height = 20
    ws_dash.merge_cells("B11:P11")
    sec1 = ws_dash["B11"]
    sec1.value = "2026 ACTIVE MONTHLY RUN-RATE & PERFORMANCE LEDGER"
    sec1.font = Font(name=FONT, size=10, bold=True, color=C_CYAN)
    sec1.fill = fill_card_head
    sec1.alignment = al_left

    tbl_hdrs = [
        ("Period", "B", al_left),
        ("Sales Target", "C", al_right),
        ("Sales Achieved", "D", al_right),
        ("Ach %", "E", al_right),
        ("Coll Target", "F", al_right),
        ("Coll Achieved", "G", al_right),
        ("Recovery %", "H", al_right),
        ("Dealers", "I", al_center),
        ("New", "J", al_center),
        ("Top District", "K", al_left),
        ("District Rev", "L", al_right),
        ("Highlights / Executive Notes", "M", al_left)
    ]
    
    ws_dash.row_dimensions[12].height = 18
    for h_name, col_let, h_align in tbl_hdrs:
        if col_let == "M":
            ws_dash.merge_cells("M12:P12")
        cell = ws_dash[f"{col_let}12"]
        cell.value = h_name.upper()
        cell.font = f_tbl_hdr
        cell.fill = fill_card_head
        cell.alignment = h_align
        cell.border = border_tbl_th

    # Rows 13 to 16: Months Jan to Apr 2026
    for i, m_row in enumerate(range(18, 22)):
        r = 13 + i
        ws_dash.row_dimensions[r].height = 18
        ws_dash.merge_cells(f"M{r}:P{r}")
        
        ws_dash[f"B{r}"].value = f"=Data_Entry_Master!D{m_row}"
        ws_dash[f"B{r}"].font = f_data_bold; ws_dash[f"B{r}"].alignment = al_left
        
        ws_dash[f"C{r}"].value = f"=Data_Entry_Master!E{m_row}"
        ws_dash[f"C{r}"].font = f_data; ws_dash[f"C{r}"].number_format = FMT_CURR; ws_dash[f"C{r}"].alignment = al_right
        
        ws_dash[f"D{r}"].value = f"=Data_Entry_Master!F{m_row}"
        ws_dash[f"D{r}"].font = f_data_bold; ws_dash[f"D{r}"].number_format = FMT_CURR; ws_dash[f"D{r}"].alignment = al_right
        
        ws_dash[f"E{r}"].value = f"=Data_Entry_Master!G{m_row}"
        ws_dash[f"E{r}"].font = f_data_bold; ws_dash[f"E{r}"].number_format = FMT_PCT; ws_dash[f"E{r}"].alignment = al_right
        
        ws_dash[f"F{r}"].value = f"=Data_Entry_Master!H{m_row}"
        ws_dash[f"F{r}"].font = f_data; ws_dash[f"F{r}"].number_format = FMT_CURR; ws_dash[f"F{r}"].alignment = al_right
        
        ws_dash[f"G{r}"].value = f"=Data_Entry_Master!I{m_row}"
        ws_dash[f"G{r}"].font = f_data_bold; ws_dash[f"G{r}"].number_format = FMT_CURR; ws_dash[f"G{r}"].alignment = al_right
        
        ws_dash[f"H{r}"].value = f"=Data_Entry_Master!K{m_row}"
        ws_dash[f"H{r}"].font = f_data_bold; ws_dash[f"H{r}"].number_format = FMT_PCT; ws_dash[f"H{r}"].alignment = al_right
        
        ws_dash[f"I{r}"].value = f"=Data_Entry_Master!L{m_row}"
        ws_dash[f"I{r}"].font = f_data; ws_dash[f"I{r}"].alignment = al_center
        
        ws_dash[f"J{r}"].value = f"=Data_Entry_Master!M{m_row}"
        ws_dash[f"J{r}"].font = f_data; ws_dash[f"J{r}"].alignment = al_center
        
        ws_dash[f"K{r}"].value = f"=Data_Entry_Master!N{m_row}"
        ws_dash[f"K{r}"].font = f_data; ws_dash[f"K{r}"].alignment = al_left
        
        ws_dash[f"L{r}"].value = f"=Data_Entry_Master!O{m_row}"
        ws_dash[f"L{r}"].font = f_data; ws_dash[f"L{r}"].number_format = FMT_CURR; ws_dash[f"L{r}"].alignment = al_right
        
        ws_dash[f"M{r}"].value = f"=Data_Entry_Master!P{m_row}"
        ws_dash[f"M{r}"].font = f_data; ws_dash[f"M{r}"].alignment = al_left

        for c in range(2, 17):
            cell = ws_dash.cell(r, c)
            cell.fill = fill_card
            cell.border = border_tbl_row

    # Row 17: YTD TOTAL
    r_tot = 17
    ws_dash.row_dimensions[r_tot].height = 20
    ws_dash.merge_cells(f"M{r_tot}:P{r_tot}")
    ws_dash[f"B{r_tot}"].value = "2026 YTD TOTAL"
    ws_dash[f"B{r_tot}"].font = Font(name=FONT, size=9, bold=True, color=C_CYAN); ws_dash[f"B{r_tot}"].alignment = al_left
    
    ws_dash[f"C{r_tot}"].value = "=SUM(C13:C16)"
    ws_dash[f"C{r_tot}"].font = f_data_bold; ws_dash[f"C{r_tot}"].number_format = FMT_CURR; ws_dash[f"C{r_tot}"].alignment = al_right
    
    ws_dash[f"D{r_tot}"].value = "=SUM(D13:D16)"
    ws_dash[f"D{r_tot}"].font = Font(name=FONT, size=10, bold=True, color=C_CYAN); ws_dash[f"D{r_tot}"].number_format = FMT_CURR; ws_dash[f"D{r_tot}"].alignment = al_right
    
    ws_dash[f"E{r_tot}"].value = "=D17/C17"
    ws_dash[f"E{r_tot}"].font = Font(name=FONT, size=10, bold=True, color=C_CYAN); ws_dash[f"E{r_tot}"].number_format = FMT_PCT; ws_dash[f"E{r_tot}"].alignment = al_right
    
    ws_dash[f"F{r_tot}"].value = "=SUM(F13:F16)"
    ws_dash[f"F{r_tot}"].font = f_data_bold; ws_dash[f"F{r_tot}"].number_format = FMT_CURR; ws_dash[f"F{r_tot}"].alignment = al_right
    
    ws_dash[f"G{r_tot}"].value = "=SUM(G13:G16)"
    ws_dash[f"G{r_tot}"].font = Font(name=FONT, size=10, bold=True, color=C_EMERALD); ws_dash[f"G{r_tot}"].number_format = FMT_CURR; ws_dash[f"G{r_tot}"].alignment = al_right
    
    ws_dash[f"H{r_tot}"].value = "=G17/D17"
    ws_dash[f"H{r_tot}"].font = Font(name=FONT, size=10, bold=True, color=C_VIOLET); ws_dash[f"H{r_tot}"].number_format = FMT_PCT; ws_dash[f"H{r_tot}"].alignment = al_right
    
    ws_dash[f"I{r_tot}"].value = "=I16"
    ws_dash[f"I{r_tot}"].font = Font(name=FONT, size=10, bold=True, color=C_AMBER); ws_dash[f"I{r_tot}"].alignment = al_center
    
    ws_dash[f"J{r_tot}"].value = "=SUM(J13:J16)"
    ws_dash[f"J{r_tot}"].font = Font(name=FONT, size=10, bold=True, color=C_AMBER); ws_dash[f"J{r_tot}"].alignment = al_center
    
    ws_dash[f"K{r_tot}"].value = "Kendrapara (65.2%)"
    ws_dash[f"K{r_tot}"].font = f_data_bold; ws_dash[f"K{r_tot}"].alignment = al_left
    
    ws_dash[f"L{r_tot}"].value = "₹14,54,894"
    ws_dash[f"L{r_tot}"].font = f_data_bold; ws_dash[f"L{r_tot}"].alignment = al_right
    
    ws_dash[f"M{r_tot}"].value = "Consolidated Live Aggregation • Sourced from Google Sheets"
    ws_dash[f"M{r_tot}"].font = Font(name=FONT, size=8, bold=True, color=C_TEXT_DIM); ws_dash[f"M{r_tot}"].alignment = al_left

    for c in range(2, 17):
        cell = ws_dash.cell(r_tot, c)
        cell.fill = fill_card_head
        cell.border = Border(top=Side(border_style="thin", color=C_CYAN), bottom=Side(border_style="double", color=C_CYAN))

    # -------------------------------------------------------------
    # SECTION 3: CHARTS SECTION (Rows 19 to 32)
    # -------------------------------------------------------------
    # Chart 1: Monthly Sales Comparison (Bar Chart)
    chart1 = BarChart()
    chart1.type = "col"
    chart1.style = 10
    chart1.title = "Monthly Sales Target vs Achieved (₹)"
    chart1.y_axis.title = "Revenue (₹)"
    chart1.x_axis.title = "Period"
    chart1.height = 7
    chart1.width = 16
    
    data1 = Reference(ws_dash, min_col=3, min_row=12, max_col=4, max_row=16)
    cats1 = Reference(ws_dash, min_col=2, min_row=13, max_row=16)
    chart1.add_data(data1, titles_from_data=True)
    chart1.set_categories(cats1)
    ws_dash.add_chart(chart1, "B19")

    # Chart 2: Cash Collections vs Target (Bar Chart)
    chart2 = BarChart()
    chart2.type = "col"
    chart2.style = 11
    chart2.title = "Cash Collections vs Target (₹)"
    chart2.y_axis.title = "Collections (₹)"
    chart2.x_axis.title = "Period"
    chart2.height = 7
    chart2.width = 16
    
    data2 = Reference(ws_dash, min_col=6, min_row=12, max_col=7, max_row=16)
    cats2 = Reference(ws_dash, min_col=2, min_row=13, max_row=16)
    chart2.add_data(data2, titles_from_data=True)
    chart2.set_categories(cats2)
    ws_dash.add_chart(chart2, "J19")

    # -------------------------------------------------------------
    # SECTION 4: STRATEGIC TAKEAWAYS (Rows 35 to 40)
    # -------------------------------------------------------------
    ws_dash.row_dimensions[35].height = 20
    ws_dash.merge_cells("B35:P35")
    ws_dash["B35"].value = "EXECUTIVE STRATEGIC TAKEAWAYS & BUSINESS INTELLIGENCE"
    ws_dash["B35"].font = Font(name=FONT, size=10, bold=True, color=C_AMBER)
    ws_dash["B35"].fill = fill_card_head
    ws_dash["B35"].alignment = al_left

    takeaways = [
        ("B36:F39", "🚀 REVENUE ACCELERATION", "₹31.16 Lakh achieved in 4 months (69.3% of entire FY 2025 revenue). March delivered record 113.2% target achievement with +130.4% YoY acceleration.", C_CYAN),
        ("G36:K39", "💰 CASH LIQUIDITY DISCIPLINE", "Collections surged +219.6% YoY to ₹25.81 Lakh. The recovery ratio maintained a healthy 82.8%, ensuring strong cash inflow with minimal working capital lockup.", C_EMERALD),
        ("L36:P39", "🏆 REGIONAL & CHANNEL SCALE", "Dealer network expanded from 39 to 97 active partners (+148% growth). Kendrapara anchors 65.2% revenue, with Jharsuguda scaling rapidly (+278% ramp).", C_AMBER)
    ]

    for cell_range, t_title, t_body, t_color in takeaways:
        ws_dash.merge_cells(cell_range)
        top_left = cell_range.split(":")[0]
        c = ws_dash[top_left]
        c.value = f"{t_title}\n\n{t_body}"
        c.font = Font(name=FONT, size=9, color=C_TEXT_WHITE)
        c.fill = fill_card
        c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        
        # Border
        start_col, start_row = openpyxl.utils.coordinate_to_tuple(top_left)
        end_col, end_row = openpyxl.utils.coordinate_to_tuple(cell_range.split(":")[1])
        for r in range(start_row, end_row + 1):
            for col in range(start_col, end_col + 1):
                ws_dash.cell(r, col).border = border_card
                ws_dash.cell(r, col).fill = fill_card

    # Column widths for Cockpit
    ws_dash.column_dimensions["A"].width = 2.5
    for c in ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"]:
        ws_dash.column_dimensions[c].width = 14

    # =========================================================================
    # SHEET 2: 📊 Data_Entry_Master
    # =========================================================================
    ws_mst = wb.create_sheet(title="Data_Entry_Master")
    ws_mst.views.sheetView[0].showGridLines = True
    
    ws_mst.row_dimensions[2].height = 24
    ws_mst["B2"].value = "📊 COMPANY MASTER DATA & MONTHLY ENTRY REGISTER"
    ws_mst["B2"].font = Font(name=FONT, size=14, bold=True, color="1E3A8A")
    ws_mst["B3"].value = "EMPLOYEE DATA ENTRY: Update monthly figures in teal columns. All calculations and the Executive Cockpit update automatically."
    ws_mst["B3"].font = Font(name=FONT, size=9, italic=True, color="475569")

    mst_hdrs = [
        "YEAR", "MONTH #", "PERIOD CODE", "SALES TARGET (₹)", "SALES ACHIEVED (₹)", "SALES ACH %",
        "COLL TARGET (₹)", "COLL ACHIEVED (₹)", "COLL ACH %", "RECOVERY %", "ACTIVE DEALERS", "NEW ADDED",
        "TOP DISTRICT", "TOP DISTRICT REV", "KEY HIGHLIGHTS / NOTES"
    ]
    
    ws_mst.row_dimensions[5].height = 22
    for idx, h in enumerate(mst_hdrs, start=2):
        cell = ws_mst.cell(5, idx)
        cell.value = h
        cell.font = Font(name=FONT, size=9, bold=True, color="FFFFFF")
        cell.alignment = al_center
        # Colors: Teal for user inputs, Navy for formulas
        if h in ["SALES TARGET (₹)", "SALES ACHIEVED (₹)", "COLL TARGET (₹)", "COLL ACHIEVED (₹)", "ACTIVE DEALERS", "NEW ADDED", "TOP DISTRICT", "TOP DISTRICT REV", "KEY HIGHLIGHTS / NOTES"]:
            cell.fill = PatternFill(start_color="0F766E", end_color="0F766E", fill_type="solid")
        else:
            cell.fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")

    # Data Rows
    master_rows = [
        # 2025
        (2025, 1, "Jan-25", 800000, 321973, "=F6/E6", 500000, 111100, "=I6/H6", "=I6/F6", 39, 11, "Kendrapara", 145000, "Q1 Launch with 39 dealer network base."),
        (2025, 2, "Feb-25", 800000, 451920, "=F7/E7", 500000, 207410, "=I7/H7", "=I7/F7", 42, 3, "Coastal Cluster", 126054, "Barunei Sanitary booked top dealer sales."),
        (2025, 3, "Mar-25", 800000, 351515, "=F8/E8", 600000, 307751, "=I8/H8", "=I8/F8", 46, 4, "Jagatsinghpur", 93893, "Q1 close with steady collection growth."),
        (2025, 4, "Apr-25", 800000, 227073, "=F9/E9", 500000, 181311, "=I9/H9", "=I9/F9", 51, 5, "Kendrapara", 72000, "Expansion into rural retail outlets."),
        (2025, 5, "May-25", 800000, 673893, "=F10/E10", 600000, 206705, "=I10/H10", "=I10/F10", 57, 6, "Kendrapara", 185000, "Summer renovation surge."),
        (2025, 6, "Jun-25", 800000, 281488, "=F11/E11", 500000, 276856, "=I11/H11", "=I11/F11", 62, 5, "Jagatsinghpur", 85000, "Pre-monsoon inventory dispatch."),
        (2025, 7, "Jul-25", 800000, 137358, "=F12/E12", 500000, 300405, "=I12/H12", "=I12/F12", 66, 4, "Coastal", 54000, "Monsoon season collection recovery."),
        (2025, 8, "Aug-25", 800000, 226998, "=F13/E13", 500000, 172948, "=I13/H13", "=I13/F13", 69, 3, "Kendrapara", 103581, "Parida Sanitary recorded peak sales."),
        (2025, 9, "Sep-25", 800000, 187807, "=F14/E14", 500000, 290151, "=I14/H14", "=I14/F14", 71, 2, "Jharsuguda", 48000, "Festive stock build-up."),
        (2025, 10, "oct.-25", 800000, 429381, "=F15/E15", 700000, 375440, "=I15/H15", "=I15/F15", 75, 4, "Kendrapara", 120000, "Diwali commercial festival volume."),
        (2025, 11, "nov.-25", 800000, 480749, "=F16/E16", 700000, 417254, "=I16/H16", "=I16/F16", 80, 5, "Kendrapara", 155000, "Record collections month for 2025."),
        (2025, 12, "Dec-25", 878000, 723053, "=F17/E17", 988000, 330810, "=I17/H17", "=I17/F17", 84, 4, "Deepak Sanitary", 90701, "Highest sales month of FY 2025 (₹7.23L)."),
        
        # 2026
        (2026, 1, "Jan-26", 983000, 667635, "=F18/E18", 1445000, 408960, "=I18/H18", "=I18/F18", 86, 2, "Jagatsinghpur", 341040, "Rapid start; +107% YoY revenue growth."),
        (2026, 2, "Feb-26", 866000, 715262, "=F19/E19", 1395000, 674510, "=I19/H19", "=I19/F19", 90, 4, "Kendrapara", 385671, "High collections efficiency (+225% YoY)."),
        (2026, 3, "Mar-26", 768000, 869738, "=F20/E20", 1145000, 816404, "=I20/H20", "=I20/F20", 92, 2, "Kendrapara", 327556, "Peak month (113.2% target achieved)."),
        (2026, 4, "Apr-26", 1050000, 863300, "=F21/E21", 1400209, 681012, "=I21/H21", "=I21/F21", 97, 5, "Kendrapara", 741667, "Network reached 97 dealers; Kendrapara record."),
        (2026, 5, "May-26", "", "", '=IF(OR(E22="",E22=0),"-",F22/E22)', "", "", '=IF(OR(H22="",H22=0),"-",I22/H22)', '=IF(OR(F22="",F22=0),"-",I22/F22)', "", "", "", "", "Upcoming Monthly Entry (Leave blank until ready)"),
        (2026, 6, "Jun-26", "", "", '=IF(OR(E23="",E23=0),"-",F23/E23)', "", "", '=IF(OR(H23="",H23=0),"-",I23/H23)', '=IF(OR(F23="",F23=0),"-",I23/F23)', "", "", "", "", "Upcoming Monthly Entry"),
        (2026, 7, "Jul-26", "", "", '=IF(OR(E24="",E24=0),"-",F24/E24)', "", "", '=IF(OR(H24="",H24=0),"-",I24/H24)', '=IF(OR(F24="",F24=0),"-",I24/F24)', "", "", "", "", "Upcoming Monthly Entry"),
        (2026, 8, "Aug-26", "", "", '=IF(OR(E25="",E25=0),"-",F25/E25)', "", "", '=IF(OR(H25="",H25=0),"-",I25/H25)', '=IF(OR(F25="",F25=0),"-",I25/F25)', "", "", "", "", "Upcoming Monthly Entry"),
        (2026, 9, "Sep-26", "", "", '=IF(OR(E26="",E26=0),"-",F26/E26)', "", "", '=IF(OR(H26="",H26=0),"-",I26/H26)', '=IF(OR(F26="",F26=0),"-",I26/F26)', "", "", "", "", "Upcoming Monthly Entry"),
        (2026, 10, "oct.-26", "", "", '=IF(OR(E27="",E27=0),"-",F27/E27)', "", "", '=IF(OR(H27="",H27=0),"-",I27/H27)', '=IF(OR(F27="",F27=0),"-",I27/F27)', "", "", "", "", "Upcoming Monthly Entry"),
        (2026, 11, "nov.-26", "", "", '=IF(OR(E28="",E28=0),"-",F28/E28)', "", "", '=IF(OR(H28="",H28=0),"-",I28/H28)', '=IF(OR(F28="",F28=0),"-",I28/F28)', "", "", "", "", "Upcoming Monthly Entry"),
        (2026, 12, "Dec-26", "", "", '=IF(OR(E29="",E29=0),"-",F29/E29)', "", "", '=IF(OR(H29="",H29=0),"-",I29/H29)', '=IF(OR(F29="",F29=0),"-",I29/F29)', "", "", "", "", "Upcoming Monthly Entry"),
    ]

    for idx, row in enumerate(master_rows):
        r = 6 + idx
        ws_mst.row_dimensions[r].height = 18
        for c_idx, val in enumerate(row, start=2):
            cell = ws_mst.cell(r, c_idx)
            cell.value = val
            cell.font = Font(name=FONT, size=9)
            if c_idx in [5, 6, 8, 9, 15]:
                cell.number_format = FMT_CURR
                cell.alignment = al_right
            elif c_idx in [7, 10, 11]:
                cell.number_format = FMT_PCT
                cell.alignment = al_right
            elif c_idx in [2, 3, 12, 13]:
                cell.alignment = al_center
            else:
                cell.alignment = al_left

    # Row 30: 2026 YTD TOTAL
    r_mst_tot = 30
    ws_mst.row_dimensions[r_mst_tot].height = 20
    ws_mst.cell(r_mst_tot, 2, "2026 YTD TOTAL").font = Font(name=FONT, size=9, bold=True, color="1E3A8A")
    ws_mst.cell(r_mst_tot, 5, "=SUM(E18:E29)").number_format = FMT_CURR
    ws_mst.cell(r_mst_tot, 6, "=SUM(F18:F29)").number_format = FMT_CURR
    ws_mst.cell(r_mst_tot, 7, "=F30/E30").number_format = FMT_PCT
    ws_mst.cell(r_mst_tot, 8, "=SUM(H18:H29)").number_format = FMT_CURR
    ws_mst.cell(r_mst_tot, 9, "=SUM(I18:I29)").number_format = FMT_CURR
    ws_mst.cell(r_mst_tot, 10, "=I30/H30").number_format = FMT_PCT
    ws_mst.cell(r_mst_tot, 11, "=I30/F30").number_format = FMT_PCT
    ws_mst.cell(r_mst_tot, 12, "=MAX(L18:L29)").alignment = al_center
    ws_mst.cell(r_mst_tot, 13, "=SUM(M18:M29)").alignment = al_center
    ws_mst.cell(r_mst_tot, 16, "Live 2026 Aggregation").font = Font(name=FONT, size=9, italic=True)

    for c in range(2, 17):
        cell = ws_mst.cell(r_mst_tot, c)
        cell.font = Font(name=FONT, size=9, bold=True)
        cell.border = Border(top=Side(border_style="thin", color="1E3A8A"), bottom=Side(border_style="double", color="1E3A8A"))

    mst_col_widths = {
        "A": 3, "B": 10, "C": 10, "D": 14, "E": 18, "F": 18, "G": 12,
        "H": 18, "I": 18, "J": 12, "K": 12, "L": 14, "M": 12, "N": 16, "O": 16, "P": 45
    }
    for col_let, width in mst_col_widths.items():
        ws_mst.column_dimensions[col_let].width = width

    # =========================================================================
    # SHEET 3: 🏆 Key Accounts & Top Dealers
    # =========================================================================
    ws_dlr = wb.create_sheet(title="🏆 Key Accounts & Dealers")
    ws_dlr.views.sheetView[0].showGridLines = False
    for r in range(1, 20):
        ws_dlr.row_dimensions[r].height = 18
        for c in range(1, 10):
            ws_dlr.cell(r, c).fill = fill_canvas
    ws_dlr.row_dimensions[2].height = 22
    ws_dlr["B2"].value = "DEALER NETWORK & KEY ACCOUNTS LEADERBOARD"
    ws_dlr["B2"].font = f_cockpit_title

    hall_hdrs = [("Account Name", al_left), ("Cluster", al_left), ("Peak Order (₹)", al_right), ("Month", al_center), ("Relationship Highlight", al_left)]
    ws_dlr.row_dimensions[5].height = 20
    for idx, (h_n, h_al) in enumerate(hall_hdrs, start=2):
        cell = ws_dlr.cell(5, idx)
        cell.value = h_n.upper(); cell.font = f_tbl_hdr; cell.alignment = h_al; cell.fill = fill_card_head; cell.border = border_tbl_th
    hall_data = [
        ("Barunei Sanitary", "Coastal Cluster", 126054, "Feb-25", "Single highest recorded dealer sales order in 2025."),
        ("Parida Sanitary", "Kendrapara", 103581, "Aug-25", "Top sales in Aug-25; ₹33,000 top collection in Nov-25."),
        ("Pradhan Sanitary", "Jagatsinghpur", 93893, "Mar-25", "Consistent top tier contributor; ₹24,000 top collection in Dec-25."),
        ("Deepak Sanitary", "Kendrapara", 90701, "Dec-25 & Mar-26", "Added in Dec-25; Immediately delivered top sales in Dec-25 and Mar-26."),
        ("Das Hardware", "Kendrapara", 81592, "Jan-25 & Nov-25", "Core anchor partner; Top sales performer in Jan-25 and Nov-25."),
    ]
    for i, row in enumerate(hall_data):
        r = 6 + i
        ws_dlr.cell(r, 2, row[0]).font = f_data_bold; ws_dlr.cell(r, 2).alignment = al_left; ws_dlr.cell(r, 2).fill = fill_card; ws_dlr.cell(r, 2).border = border_tbl_row
        ws_dlr.cell(r, 3, row[1]).alignment = al_left; ws_dlr.cell(r, 3).fill = fill_card; ws_dlr.cell(r, 3).border = border_tbl_row
        ws_dlr.cell(r, 4, row[2]).number_format = FMT_CURR; ws_dlr.cell(r, 4).alignment = al_right; ws_dlr.cell(r, 4).fill = fill_card; ws_dlr.cell(r, 4).border = border_tbl_row
        ws_dlr.cell(r, 5, row[3]).alignment = al_center; ws_dlr.cell(r, 5).fill = fill_card; ws_dlr.cell(r, 5).border = border_tbl_row
        ws_dlr.cell(r, 6, row[4]).alignment = al_left; ws_dlr.cell(r, 6).fill = fill_card; ws_dlr.cell(r, 6).border = border_tbl_row

    for col_let, width in {"B": 24, "C": 16, "D": 16, "E": 14, "F": 45}.items():
        ws_dlr.column_dimensions[col_let].width = width

    # =========================================================================
    # SHEETS 4 TO 22: COPY ALL 19 ORIGINAL SHEETS FROM Dashboard 2026.xlsx
    # =========================================================================
    print("Copying all original monthly and yearly sheets from Dashboard 2026.xlsx...")
    for sheet_name in wb_src.sheetnames:
        if sheet_name in ["Sheet6"]: continue
        ws_from = wb_src[sheet_name]
        ws_to = wb.create_sheet(title=sheet_name)
        
        # Copy cell values, formats, borders, alignments, fonts
        for row in ws_from.iter_rows():
            for cell in row:
                if cell.value is not None:
                    new_cell = ws_to.cell(row=cell.row, column=cell.column, value=cell.value)
                    if cell.has_style:
                        new_cell.font = copy(cell.font)
                        new_cell.border = copy(cell.border)
                        new_cell.fill = copy(cell.fill)
                        new_cell.number_format = copy(cell.number_format)
                        new_cell.alignment = copy(cell.alignment)

        # Copy row heights
        for r_idx in range(1, ws_from.max_row + 1):
            h = ws_from.row_dimensions[r_idx].height
            if h is not None:
                ws_to.row_dimensions[r_idx].height = h

        # Copy column widths
        for col_letter, col_dim in ws_from.column_dimensions.items():
            if col_dim.width is not None:
                ws_to.column_dimensions[col_letter].width = col_dim.width

        # Copy merged ranges
        for m_range in ws_from.merged_cells.ranges:
            try:
                ws_to.merge_cells(str(m_range))
            except Exception:
                pass

    # Save output workbook
    wb.save(out_path)
    print(f"Master Google Sheets-ready workbook successfully created at: {out_path}")

    # Also overwrite the active Dashboard 2026.xlsx so the folder has the upgraded file directly
    shutil.copyfile(out_path, src_path)
    print(f"Also updated: {src_path}")

if __name__ == "__main__":
    build_google_sheets_master()
