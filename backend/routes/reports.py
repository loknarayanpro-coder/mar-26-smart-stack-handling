from flask import Blueprint, request, jsonify, Response
from database import products_collection, sales_collection
from bson.objectid import ObjectId
import datetime
import csv
import io

reports = Blueprint("reports", __name__)


def serialize_product(doc):
    if doc is None:
        return None
    d = dict(doc)
    d["id"] = str(d.pop("_id", ""))
    return d


def serialize_sale(doc):
    if doc is None:
        return None
    d = dict(doc)
    d["id"] = str(d.pop("_id", ""))
    if "sold_at" in d and isinstance(d["sold_at"], datetime.datetime):
        d["sold_at"] = d["sold_at"].isoformat()
    return d


def get_date_filter(date_range):
    """Return a MongoDB date filter based on the selected date range."""
    now = datetime.datetime.utcnow()
    if date_range == "7days":
        return {"sold_at": {"$gte": now - datetime.timedelta(days=7)}}
    elif date_range == "30days":
        return {"sold_at": {"$gte": now - datetime.timedelta(days=30)}}
    elif date_range == "90days":
        return {"sold_at": {"$gte": now - datetime.timedelta(days=90)}}
    return {}  # All time


# ========== INVENTORY SUMMARY ==========

def _to_number(value, default=0):
    try:
        # Some records may store numbers as strings; normalize to float
        return float(value)
    except (TypeError, ValueError):
        return float(default)


@reports.route("/summary", methods=["GET"])
def inventory_summary():
    """Generate a full inventory summary."""
    products = list(products_collection.find({}))
    products_data = [serialize_product(p) for p in products]

    total_products = len(products_data)
    total_value = sum((_to_number(p.get("price", 0)) * _to_number(p.get("quantity", 0))) for p in products_data)
    total_quantity = sum(_to_number(p.get("quantity", 0)) for p in products_data)

    # Category breakdown
    categories = {}
    for p in products_data:
        cat = p.get("category", "Uncategorized") or "Uncategorized"
        if cat not in categories:
            categories[cat] = {"count": 0, "value": 0, "quantity": 0}
        categories[cat]["count"] += 1
        categories[cat]["value"] += _to_number(p.get("price", 0)) * _to_number(p.get("quantity", 0))
        categories[cat]["quantity"] += _to_number(p.get("quantity", 0))

    category_breakdown = [
        {"category": k, **v} for k, v in categories.items()
    ]

    # Low stock items
    low_stock = [
        p for p in products_data
        if _to_number(p.get("quantity", 0)) < _to_number(p.get("reorder_point", p.get("min_stock_threshold", 5)))
    ]

    # Recent sales count
    sales_count = sales_collection.count_documents({})

    return jsonify({
        "total_products": total_products,
        "total_value": total_value,
        "total_quantity": total_quantity,
        "category_breakdown": category_breakdown,
        "low_stock_items": low_stock,
        "low_stock_count": len(low_stock),
        "total_sales": sales_count,
        "products": products_data
    }), 200


# ========== EXPORT CSV ==========
@reports.route("/export/csv", methods=["GET"])
def export_csv():
    """Export data as CSV file."""
    report_type = request.args.get("type", "inventory")
    date_range = request.args.get("range", "all")

    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "inventory":
        writer.writerow(["Name", "Category", "Price", "Quantity", "Value", "Supplier", "Min Threshold"])
        products = list(products_collection.find({}))
        for p in products:
            price = _to_number(p.get("price", 0))
            qty = _to_number(p.get("quantity", 0))
            threshold = _to_number(p.get("min_stock_threshold", 5), default=5)
            writer.writerow([
                p.get("name", ""),
                p.get("category", ""),
                price,
                qty,
                round(price * qty, 2),
                p.get("supplier", ""),
                threshold
            ])
        filename = "inventory_report.csv"

    elif report_type == "sales":
        writer.writerow(["Product Name", "Quantity Sold", "Total Amount", "Date"])
        date_filter = get_date_filter(date_range)
        sales = list(sales_collection.find(date_filter).sort("sold_at", -1))
        for s in sales:
            sold_at = s.get("sold_at", "")
            if isinstance(sold_at, datetime.datetime):
                sold_at = sold_at.strftime("%Y-%m-%d %H:%M")
            qty_sold = _to_number(s.get("quantity_sold", 0))
            total_amount = _to_number(s.get("total_amount", 0))
            writer.writerow([
                s.get("product_name", ""),
                qty_sold,
                round(total_amount, 2),
                sold_at
            ])
        filename = "sales_report.csv"

    elif report_type == "low_stock":
        writer.writerow(["Name", "Category", "Current Stock", "Min Threshold", "Supplier"])
        products = list(products_collection.find({}))
        for p in products:
            qty = _to_number(p.get("quantity", 0))
            threshold = _to_number(p.get("min_stock_threshold", 5), default=5)
            if qty < threshold:
                writer.writerow([
                    p.get("name", ""),
                    p.get("category", ""),
                    qty,
                    threshold,
                    p.get("supplier", "")
                ])
        filename = "low_stock_report.csv"
    else:
        return jsonify({"msg": "Invalid report type"}), 400

    csv_content = output.getvalue()
    output.close()

    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ========== EXPORT PDF ==========
@reports.route("/export/pdf", methods=["GET"])
def export_pdf():
    """Export data as PDF file."""
    report_type = request.args.get("type", "inventory")
    date_range = request.args.get("range", "all")

    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    except ImportError:
        return jsonify({"msg": "reportlab is not installed. Run: pip install reportlab"}), 500

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    elements = []

    # Title style
    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Heading1"],
        fontSize=18, spaceAfter=20, textColor=colors.HexColor("#1e293b")
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle", parent=styles["Normal"],
        fontSize=10, spaceAfter=12, textColor=colors.HexColor("#64748b")
    )

    now = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p")

    table_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7c3aed")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 10),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#1e293b")),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ])

    if report_type == "inventory":
        elements.append(Paragraph("Inventory Report", title_style))
        elements.append(Paragraph(f"Generated on {now}", subtitle_style))
        elements.append(Spacer(1, 12))

        data = [["Name", "Category", "Price (₹)", "Quantity", "Value (₹)", "Supplier"]]
        products = list(products_collection.find({}))
        total_value = 0
        for p in products:
            price = _to_number(p.get("price", 0))
            qty = _to_number(p.get("quantity", 0))
            value = round(price * qty, 2)
            total_value += value
            data.append([
                p.get("name", ""),
                p.get("category", ""),
                f"₹{price:,.2f}",
                str(int(qty) if float(qty).is_integer() else qty),
                f"₹{value:,.2f}",
                p.get("supplier", "")
            ])
        data.append(["", "", "", "TOTAL", f"₹{total_value:,.2f}", ""])

        t = Table(data, repeatRows=1)
        t.setStyle(table_style)
        # Bold the total row
        t.setStyle(TableStyle([
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f1f5f9")),
        ]))
        elements.append(t)
        filename = "inventory_report.pdf"

    elif report_type == "sales":
        elements.append(Paragraph("Sales Report", title_style))
        range_labels = {"7days": "Last 7 Days", "30days": "Last 30 Days", "90days": "Last 90 Days"}
        range_label = range_labels.get(date_range, "All Time")
        elements.append(Paragraph(f"Generated on {now} | Period: {range_label}", subtitle_style))
        elements.append(Spacer(1, 12))

        data = [["Product Name", "Quantity Sold", "Total Amount (₹)", "Date"]]
        date_filter = get_date_filter(date_range)
        sales = list(sales_collection.find(date_filter).sort("sold_at", -1))
        grand_total = 0
        for s in sales:
            sold_at = s.get("sold_at", "")
            if isinstance(sold_at, datetime.datetime):
                sold_at = sold_at.strftime("%Y-%m-%d %H:%M")
            qty_sold = _to_number(s.get("quantity_sold", 0))
            amount = round(_to_number(s.get("total_amount", 0)), 2)
            grand_total += amount
            data.append([
                s.get("product_name", ""),
                str(int(qty_sold) if float(qty_sold).is_integer() else qty_sold),
                f"₹{amount:,.2f}",
                str(sold_at)
            ])
        data.append(["", "TOTAL", f"₹{grand_total:,.2f}", ""])

        t = Table(data, repeatRows=1)
        t.setStyle(table_style)
        t.setStyle(TableStyle([
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f1f5f9")),
        ]))
        elements.append(t)
        filename = "sales_report.pdf"

    elif report_type == "low_stock":
        elements.append(Paragraph("Low Stock Report", title_style))
        elements.append(Paragraph(f"Generated on {now}", subtitle_style))
        elements.append(Spacer(1, 12))

        data = [["Name", "Category", "Current Stock", "Min Threshold", "Shortage", "Supplier"]]
        products = list(products_collection.find({}))
        for p in products:
            qty = _to_number(p.get("quantity", 0))
            threshold = _to_number(p.get("min_stock_threshold", 5), default=5)
            if qty < threshold:
                data.append([
                    p.get("name", ""),
                    p.get("category", ""),
                    str(int(qty) if float(qty).is_integer() else qty),
                    str(int(threshold) if float(threshold).is_integer() else threshold),
                    str(int(threshold - qty) if float(threshold - qty).is_integer() else (threshold - qty)),
                    p.get("supplier", "")
                ])

        if len(data) == 1:
            elements.append(Paragraph("✅ No low stock items! All products are above their minimum threshold.", styles["Normal"]))
        else:
            t = Table(data, repeatRows=1)
            t.setStyle(table_style)
            elements.append(t)
        filename = "low_stock_report.pdf"

    else:
        return jsonify({"msg": "Invalid report type"}), 400

    doc.build(elements)
    pdf_content = buffer.getvalue()
    buffer.close()

    return Response(
        pdf_content,
        mimetype="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
