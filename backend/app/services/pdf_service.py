import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch

def generate_health_report_pdf(report: dict, patient_name: str, patient_email: str) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=30, leftMargin=30,
                            topMargin=30, bottomMargin=30)
    Story = []
    styles = getSampleStyleSheet()
    
    primary_color = colors.HexColor("#2563EB")
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=primary_color,
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.gray,
        spaceAfter=20
    )
    
    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=primary_color,
        spaceAfter=10,
        spaceBefore=15
    )
    
    normal_style = styles['Normal']
    
    # 1. Logo and Title
    Story.append(Paragraph("MedAssist AI", title_style))
    Story.append(Paragraph("Clinical Decision Support Report", subtitle_style))
    
    # 2. Patient Info
    Story.append(Paragraph(f"<b>Patient Name:</b> {patient_name}", normal_style))
    Story.append(Paragraph(f"<b>Email:</b> {patient_email}", normal_style))
    Story.append(Paragraph(f"<b>Patient ID:</b> {report.get('patient_id')}", normal_style))
    
    generated_at = report.get('generated_at')
    if isinstance(generated_at, datetime):
        date_str = generated_at.strftime('%m/%d/%Y, %H:%M:%S')
    elif isinstance(generated_at, str):
        try:
            date_str = datetime.fromisoformat(generated_at.replace('Z', '+00:00')).strftime('%m/%d/%Y, %H:%M:%S')
        except ValueError:
            date_str = generated_at
    else:
        date_str = str(generated_at)
        
    Story.append(Paragraph(f"<b>Report Date:</b> {date_str}", normal_style))
    Story.append(Paragraph(f"<b>Report ID:</b> {report.get('submission_id', 'N/A')}", normal_style))
    Story.append(Spacer(1, 15))
    
    # 3. Diagnostic Overview
    r_data = report.get('risk_assessment', {})
    predictions = report.get('predictions', [])
    
    primary_disease = predictions[0].get('disease_name') if predictions else "N/A"
    confidence = f"{int(predictions[0].get('probability', 0) * 100)}%" if predictions else "N/A"
    risk_level = str(r_data.get('risk_category', 'LOW')).upper()
    
    Story.append(Paragraph("Diagnostic Overview", h2_style))
    Story.append(Paragraph(f"<b>Primary AI Diagnosis:</b> {primary_disease}", normal_style))
    Story.append(Paragraph(f"<b>Confidence Score:</b> {confidence}", normal_style))
    
    # Colored Risk Badge
    risk_color = colors.HexColor("#10b981") # Low
    if risk_level == "MEDIUM":
        risk_color = colors.HexColor("#f59e0b")
    elif risk_level == "HIGH":
        risk_color = colors.HexColor("#ef4444")
    elif risk_level == "CRITICAL":
        risk_color = colors.HexColor("#7f1d1d")
        
    risk_p = Paragraph(f"<b>Risk Level:</b> <font color='{risk_color.hexval()}'><b>{risk_level}</b></font>", normal_style)
    Story.append(risk_p)
    
    if r_data.get('is_emergency'):
        Story.append(Spacer(1, 5))
        Story.append(Paragraph("<b><font color='red'>EMERGENCY FLAGGED</font></b>", normal_style))
    
    Story.append(Spacer(1, 15))
    
    # Warning Signs
    factors = r_data.get('contributing_factors', [])
    if factors:
        Story.append(Paragraph(f"<b><font color='red'>Warning Signs:</font></b> {', '.join(factors)}", normal_style))
        Story.append(Spacer(1, 15))
    
    # Helper to create tables
    def make_table(headers, data):
        table_data = [headers] + data
        t = Table(table_data, colWidths=[2.5*inch, 4*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        return t
        
    # Symptoms Table
    symptoms = report.get('symptoms', [])
    if symptoms:
        Story.append(Paragraph("Reported Symptoms", h2_style))
        symp_data = []
        for s in symptoms:
            if isinstance(s, dict):
                symp_data.append([s.get('symptom_name', 'N/A'), str(s.get('severity', 'N/A'))])
            else:
                symp_data.append([str(s), "N/A"])
        Story.append(make_table(['Reported Symptom', 'Severity'], symp_data))
        Story.append(Spacer(1, 15))
        
    # Predictions Table
    if predictions:
        Story.append(Paragraph("Differential Diagnosis", h2_style))
        pred_data = [[p.get('disease_name', 'N/A'), f"{int(p.get('probability', 0) * 100)}%"] for p in predictions]
        Story.append(make_table(['Disease Name', 'Probability'], pred_data))
        Story.append(Spacer(1, 15))
        
    # Recommendations Table
    recs = report.get('recommendations', [])
    if recs:
        Story.append(Paragraph("AI Guidance & Recommendations", h2_style))
        rec_data = []
        for r in recs:
            rec_data.append([str(r.get('type', '')).replace('_', ' ').upper(), Paragraph(str(r.get('content', '')), normal_style)])
        
        t_recs = Table([['Recommendation Type', 'Guidance']] + rec_data, colWidths=[1.5*inch, 5*inch])
        t_recs.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        Story.append(t_recs)
        Story.append(Spacer(1, 15))
    
    # Provider Review & Clinical Decision Section
    provider_review = report.get('provider_review', {})
    review_status_val = str(provider_review.get('status') or report.get('review_status') or 'APPROVED').upper()
    doctor_notes_val = provider_review.get('doctor_notes') or report.get('doctor_notes')
    reviewer_name = provider_review.get('reviewed_by') or "Attending Physician"
    
    Story.append(Paragraph("Provider Review & Clinical Decision", h2_style))
    status_color = colors.HexColor("#10b981") if review_status_val == "APPROVED" else (colors.HexColor("#ef4444") if review_status_val == "REJECTED" else colors.HexColor("#f59e0b"))
    Story.append(Paragraph(f"<b>Review Status:</b> <font color='{status_color.hexval()}'><b>{review_status_val}</b></font>", normal_style))
    Story.append(Paragraph(f"<b>Reviewing Clinician:</b> {reviewer_name}", normal_style))
    if doctor_notes_val:
        Story.append(Spacer(1, 5))
        Story.append(Paragraph(f"<b>Physician Notes:</b> {doctor_notes_val}", normal_style))
    
    # Build Document with Footer
    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.gray)
        footer_text = "Generated by MedAssist AI. AI-assisted clinical decision support. This report is not a substitute for professional medical advice."
        text_width = canvas.stringWidth(footer_text, 'Helvetica', 8)
        canvas.drawString((doc.pagesize[0] - text_width) / 2.0, 30, footer_text)
        canvas.restoreState()
        
    doc.build(Story, onFirstPage=add_footer, onLaterPages=add_footer)
    
    buffer.seek(0)
    return buffer
