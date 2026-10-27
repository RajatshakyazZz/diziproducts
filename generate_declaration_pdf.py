from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
import sys

def create_declaration_pdf(filename="public/Razorpay_IEC_Declaration_DiziProducts.pdf", name="Shamse Alam Siddique"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=45,
        bottomMargin=45
    )
    
    styles = getSampleStyleSheet()
    
    header_title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_CENTER
    )
    
    header_sub_style = ParagraphStyle(
        'HeaderSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_CENTER
    )

    doc_badge_style = ParagraphStyle(
        'DocBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0284c7'),
        alignment=TA_CENTER
    )

    to_style = ParagraphStyle(
        'ToStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1e293b')
    )
    
    to_sub_style = ParagraphStyle(
        'ToSubStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        alignment=TA_RIGHT
    )

    subject_style = ParagraphStyle(
        'SubjectStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=12
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        alignment=TA_JUSTIFY,
        spaceAfter=10
    )

    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=15,
        spaceAfter=6
    )

    story = []
    
    # 1. Letterhead
    story.append(Paragraph("DIZIPRODUCTS STORE", header_title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("E-Commerce & Digital Media Content • India<br/>Support Phone: +91 8860032559 &nbsp;|&nbsp; Email: ashamse137@gmail.com", header_sub_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=14, spaceBefore=0))
    
    # 2. Document Title
    story.append(Paragraph("FORMAL UNDERTAKING & DECLARATION", doc_badge_style))
    story.append(Spacer(1, 12))
    
    # 3. Two column To & Date Table
    to_html = "<b>To,</b><br/>The Verification & Merchant Onboarding Team,<br/><b>Razorpay Software Private Limited</b><br/>India"
    date_html = "<b>Date:</b> 27th October 2026<br/><b>Place:</b> India<br/><b>Store:</b> DiziProducts Store"
    
    to_p = Paragraph(to_html, to_sub_style)
    date_p = Paragraph(date_html, meta_style)
    
    t_header = Table([[to_p, date_p]], colWidths=[320, 184])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 10))
    
    # 4. Subject
    subj_text = "<b>Subject:</b> Declaration regarding Domestic Payments Only / Exemption & Waiver of IEC License"
    story.append(Paragraph(subj_text, subject_style))
    story.append(Spacer(1, 4))
    
    # 5. Salutation & Declaration Body
    story.append(Paragraph("Dear Sir/Madam,", to_style))
    story.append(Spacer(1, 8))
    
    intro_text = f"I, <b>{name}</b>, Proprietor / Authorized Representative of <b>DiziProducts Store</b>, do hereby solemnly declare, state, and affirm as follows:"
    story.append(Paragraph(intro_text, body_style))
    story.append(Spacer(1, 4))
    
    p1 = "<b>1. Domestic Business Operations:</b> We exclusively sell ready-to-use digital templates, software solutions, and creative reels bundles domestically within India in Indian Rupees (INR)."
    story.append(Paragraph(p1, bullet_style))
    
    p2 = "<b>2. No International Transactions:</b> We do <u>NOT</u> conduct cross-border trade, do <u>NOT</u> export goods or services outside the territory of India, and do <u>NOT</u> accept or require international payments in foreign currencies."
    story.append(Paragraph(p2, bullet_style))
    
    p3 = "<b>3. IEC Non-Applicability:</b> In accordance with Directorate General of Foreign Trade (DGFT) and Reserve Bank of India (RBI) statutory guidelines, an Import Export Code (IEC) is mandatory only for cross-border export/import trade and is not applicable to our purely domestic commerce model."
    story.append(Paragraph(p3, bullet_style))
    
    p4 = "<b>4. Request for Waiver:</b> We kindly request the Razorpay Compliance Team to disable/waive the international payments feature from our account backend and proceed with the activation of our <b>Domestic Payment Gateway (UPI, RuPay, Netbanking, and Domestic Debit/Credit Cards)</b>."
    story.append(Paragraph(p4, bullet_style))
    story.append(Spacer(1, 10))
    
    closing = "We confirm that the information provided herein is authentic, complete, and true to the best of our knowledge and belief."
    story.append(Paragraph(closing, body_style))
    story.append(Spacer(1, 16))
    
    # 6. Signatures Box
    sig_html_left = "<b>Verified & Declared By:</b><br/><br/><br/>_____________________________________<br/><b>Authorized Signatory</b><br/>Name: <b>" + name + "</b><br/>Designation: Owner / Proprietor<br/>Entity: DiziProducts Store"
    sig_html_right = "<b>Merchant Contact Details:</b><br/><br/>Registered Mobile: <b>+91 8860032559</b><br/>Registered Email: <b>ashamse137@gmail.com</b><br/>Website: <b>https://diziproducts.shop</b><br/>Date: <b>27-10-2026</b>"
    
    left_p = Paragraph(sig_html_left, to_sub_style)
    right_p = Paragraph(sig_html_right, to_sub_style)
    
    t_sig = Table([[left_p, right_p]], colWidths=[270, 234])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
    ]))
    story.append(t_sig)
    
    doc.build(story)
    print("PDF generated successfully:", filename)

if __name__ == '__main__':
    create_declaration_pdf()
