from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle, KeepTogether
from PIL import Image as PILImage

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
IMAGE_CACHE = ROOT / "tmp" / "pdfs" / "assets"
IMAGE_CACHE.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor("#080D28")
PANEL = colors.HexColor("#111A42")
GREEN = colors.HexColor("#66FF66")
YELLOW = colors.HexColor("#FFDB64")
BLUE = colors.HexColor("#8FE7FF")
INK = colors.HexColor("#17224C")
MUTED = colors.HexColor("#55607D")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=31, leading=34, textColor=colors.white, alignment=TA_CENTER, spaceAfter=10))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["BodyText"], fontName="Helvetica", fontSize=13, leading=19, textColor=colors.HexColor("#D5DEF7"), alignment=TA_CENTER))
styles.add(ParagraphStyle(name="H1Kids", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=25, leading=29, textColor=INK, spaceAfter=14))
styles.add(ParagraphStyle(name="H2Kids", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=colors.HexColor("#653CBB"), spaceBefore=13, spaceAfter=6))
styles.add(ParagraphStyle(name="BodyKids", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.5, leading=14, textColor=colors.HexColor("#30364B"), spaceAfter=7))
styles.add(ParagraphStyle(name="SmallKids", parent=styles["BodyText"], fontName="Helvetica", fontSize=8, leading=11, textColor=MUTED))
styles.add(ParagraphStyle(name="FeatureTitle", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=25, leading=29, textColor=GREEN, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name="FeatureBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=12, leading=18, textColor=colors.HexColor("#D5DEF7"), alignment=TA_CENTER))

def dark_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#FFFFFF22"))
    for x in range(18, 590, 42):
        for y in range(20, 830, 49):
            canvas.circle(x, y, .7, fill=1, stroke=0)
    canvas.setFillColor(BLUE)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.drawString(18*mm, 12*mm, "OATLE KIDS | PRODUCT BROCHURE")
    canvas.drawRightString(A4[0]-18*mm, 12*mm, str(doc.page))
    canvas.restoreState()

def policy_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1]-17*mm, A4[0], 17*mm, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(18*mm, A4[1]-11*mm, "OATLE KIDS")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(18*mm, 10*mm, "Ntombizodwa Moekwa, trading as Oatle Technologies | South Africa | Effective 22 October 2026")
    canvas.drawRightString(A4[0]-18*mm, 10*mm, str(doc.page))
    canvas.restoreState()

def optimised_image(path):
    target = IMAGE_CACHE / f"{path.stem}-pdf.jpg"
    if not target.exists() or target.stat().st_mtime < path.stat().st_mtime:
        with PILImage.open(path) as source:
            source = source.convert("RGBA")
            source.thumbnail((1200, 1200), PILImage.Resampling.LANCZOS)
            background = PILImage.new("RGBA", source.size, (8, 13, 40, 255))
            background.alpha_composite(source)
            background.convert("RGB").save(target, "JPEG", quality=84, optimize=True, progressive=True)
    return target

def fit_image(path, max_w=118*mm, max_h=105*mm):
    im = Image(str(optimised_image(path)))
    scale = min(max_w / im.imageWidth, max_h / im.imageHeight)
    im.drawWidth = im.imageWidth * scale
    im.drawHeight = im.imageHeight * scale
    return im

def brochure():
    path = OUT / "oatle-kids-product-brochure.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=24*mm, bottomMargin=20*mm)
    logo = ROOT / "public" / "oatle-kids-wordmark.png"
    features = [
        ("Reading and word building", "Recognise letters, build everyday words and complete missing-letter activities through a playful space journey.", ROOT/"src/assets/images/planets/earth.png", "Ages 4-7"),
        ("Sentence building", "Move from individual words to arranging and writing simple sentences, with activities that can be revisited at each child’s pace.", ROOT/"src/assets/images/words/dog.png", "Ages 4-7"),
        ("Maths and discovery", "Practise counting, number recognition, shapes, addition and subtraction in colourful interactive missions.", ROOT/"src/assets/images/planets/jupitor.png", "Ages 4-7"),
        ("Writing and tracing", "Trace letters, numbers and shapes, then practise making words and sentences with guided activities.", ROOT/"src/assets/images/words/pen.png", "Ages 4-7"),
        ("Little Explorers", "A gentle parent-guided introduction to colours, shapes, early discovery and simple learning routines.", ROOT/"src/assets/images/story/neptune-page1.png", "Ages 2-3"),
    ]
    story = [Spacer(1, 40*mm), fit_image(logo, 80*mm, 42*mm), Spacer(1, 16*mm), Paragraph("Playful learning adventures<br/>for children aged 2-7", styles["CoverTitle"]), Paragraph("Reading, word building, sentence building, maths, writing and tracing in one parent-guided digital product.", styles["CoverSub"]), Spacer(1, 18*mm)]
    facts = Table([["R99 / month", "Digital access", "South African product"]], colWidths=[52*mm]*3)
    facts.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),PANEL),("TEXTCOLOR",(0,0),(-1,-1),YELLOW),("FONTNAME",(0,0),(-1,-1),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),10),("ALIGN",(0,0),(-1,-1),"CENTER"),("BOX",(0,0),(-1,-1),.7,BLUE),("INNERGRID",(0,0),(-1,-1),.4,colors.HexColor("#8FE7FF55")),("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),10)]))
    story += [facts, Spacer(1, 18*mm), Paragraph("www.oatlekids.co.za", styles["CoverSub"]), PageBreak()]
    for title, body, image, age in features:
        story += [Spacer(1, 16*mm), Paragraph(age.upper(), ParagraphStyle("Age", parent=styles["SmallKids"], textColor=BLUE, alignment=TA_CENTER, fontName="Helvetica-Bold", fontSize=9, spaceAfter=8)), Paragraph(title, styles["FeatureTitle"]), Paragraph(body, styles["FeatureBody"]), Spacer(1, 12*mm), fit_image(image), Spacer(1, 10*mm), Paragraph("Explore together on a phone, tablet or computer.", styles["FeatureBody"]), PageBreak()]
    story += [Spacer(1, 34*mm), Paragraph("Clear monthly access", styles["FeatureTitle"]), Paragraph("Oatle Kids is offered at R99 per month in South African rand. A parent creates and manages the account, accepts the subscription policies, and completes payment securely through PayFast. Digital access is activated after successful payment confirmation.", styles["FeatureBody"]), Spacer(1, 16*mm), Paragraph("Merchant: Ntombizodwa Moekwa, trading as Oatle Technologies<br/>Customer care: info@oatle-technologies.co.za<br/>Country of domicile: South Africa", styles["CoverSub"])]
    doc.build(story, onFirstPage=dark_page, onLaterPages=dark_page)
    return path

def section(title, paragraphs):
    out = [Paragraph(title, styles["H1Kids"])]
    for heading, text in paragraphs:
        out += [Paragraph(heading, styles["H2Kids"]), Paragraph(text, styles["BodyKids"])]
    return out

def policies():
    path = OUT / "oatle-kids-payfast-policy-pack.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=19*mm, leftMargin=19*mm, topMargin=24*mm, bottomMargin=17*mm)
    intro = [Paragraph("Oatle Kids", styles["H1Kids"]), Paragraph("PayFast merchant policy pack", ParagraphStyle("PolicySub", parent=styles["H2Kids"], textColor=colors.HexColor("#653CBB"), fontSize=18)), Spacer(1,8*mm), Paragraph("This pack contains the Terms and Conditions, Privacy Policy, Refund Policy, Cancellation Policy and Digital Delivery Policy for the Oatle Kids monthly digital subscription.", styles["BodyKids"]), Spacer(1,8*mm)]
    meta = Table([["Merchant","Ntombizodwa Moekwa, trading as Oatle Technologies"],["Product","Oatle Kids"],["Price","R99 per month (ZAR)"],["Country","South Africa"],["Website","https://www.oatlekids.co.za/"],["Contact","info@oatle-technologies.co.za"],["Effective date","22 October 2026"]], colWidths=[38*mm,120*mm])
    meta.setStyle(TableStyle([("BACKGROUND",(0,0),(0,-1),PANEL),("TEXTCOLOR",(0,0),(0,-1),colors.white),("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("BACKGROUND",(1,0),(1,-1),colors.HexColor("#F1F4FF")),("TEXTCOLOR",(1,0),(1,-1),INK),("GRID",(0,0),(-1,-1),.4,colors.HexColor("#BCC7E8")),("VALIGN",(0,0),(-1,-1),"TOP"),("FONTSIZE",(0,0),(-1,-1),8.5),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)]))
    story = intro + [meta, PageBreak()]
    story += section("Terms and Conditions", [
        ("1. Product", "Oatle Kids is a digital, parent-guided learning product for ages 2-7, with reading, word building, sentence building, maths, writing and tracing activities. It is not a school, formal assessment, medical service or replacement for professional learning support."),
        ("2. Parent accounts", "The purchasing account holder must be at least 18, keep login details confidential and supervise a child’s use. Children should not submit personal information."),
        ("3. Subscription and payment", "Access costs R99 per month in ZAR and renews monthly until cancelled. Creating an account does not create a charge. PayFast processes payment; Oatle Kids does not store full card details."),
        ("4. Acceptance", "Before checkout, the parent must affirmatively accept these terms and the Refund, Cancellation, Delivery and Privacy Policies. The recurring price is displayed before payment."),
        ("5. Delivery", "Digital access is activated on the parent account after successful payment confirmation, normally immediately and within 30 minutes."),
        ("6. Cancellation and refunds", "Cancellation stops future renewals and access continues until the paid period ends. The first payment may be refunded when requested within seven calendar days. Statutory rights remain unaffected."),
        ("7. Use and intellectual property", "Access is for personal household use. Users may not resell access, bypass controls, interfere with the service or copy and redistribute substantial product content. Oatle Technologies retains ownership of its software, artwork, activities and branding."),
        ("8. Availability, liability and law", "Services may require maintenance or change. Nothing excludes rights or liability that cannot be excluded by law. South African law governs these terms."),
    ]) + [PageBreak()]
    story += section("Privacy Policy", [
        ("1. Responsible party", "Ntombizodwa Moekwa, trading as Oatle Technologies, is responsible for Oatle Kids personal information. Privacy requests may be sent to info@oatle-technologies.co.za."),
        ("2. Information", "We process parent email and authentication records, subscription and access status, payment references, essential technical logs, device-stored preferences and voluntarily submitted AI questions. Full payment card details are handled by PayFast."),
        ("3. Children", "Parents purchase and manage Oatle Kids. We do not ask children to create accounts and do not intentionally collect children’s names or contact details."),
        ("4. Purpose", "Information is used to secure accounts, provide access, deliver activities, support users, prevent misuse, improve reliability and meet legal obligations."),
        ("5. Providers", "Service providers include Supabase for account and access services, Vercel for hosting, PayFast for payments and Cloudflare for the AI assistant."),
        ("6. Sharing and retention", "Personal information is not sold. It is shared only as needed with providers or when lawfully required. It is retained only as long as needed for service, legal, accounting and dispute purposes."),
        ("7. Rights", "Subject to POPIA, individuals may request access, correction or deletion, object to certain processing, withdraw consent where relevant, or complain to South Africa’s Information Regulator."),
    ]) + [PageBreak()]
    story += section("Refund Policy", [
        ("Seven-day first-payment refund", "A parent may request a full refund of the first subscription payment within seven calendar days after payment by emailing from the parent account address."),
        ("Renewals", "Renewal payments are normally non-refundable after the new digital-access period begins. Duplicate charges, incorrect amounts, unauthorised payments and undelivered paid access will be investigated and corrected."),
        ("Service problems", "If confirmed payment does not activate access within 30 minutes, the parent should contact support. If access cannot be restored in a reasonable period, an appropriate refund, extension or credit will be provided."),
        ("Payment method", "Approved refunds are submitted through PayFast to the original payment method where possible. Provider and bank processing times apply."),
        ("Consumer rights", "This policy does not limit rights or remedies available under South African law."),
    ]) + [PageBreak()]
    story += section("Cancellation Policy", [
        ("How to cancel", "Email info@oatle-technologies.co.za from the parent account address with the subject ‘Cancel my Oatle Kids subscription’. This is the official method until self-service cancellation is available."),
        ("Timing", "Requests should be sent before the next renewal date. Oatle Technologies will acknowledge the request and stop future recurring charges."),
        ("Access", "Cancellation stops future renewals. Access remains active until the end of the billing period already paid for."),
        ("Refunds", "Cancellation does not automatically refund a completed charge. The seven-day first-payment rule and payment-error cases are handled under the Refund Policy."),
        ("Confirmation", "The parent should retain the confirmation email and follow up if no acknowledgement is received within two business days."),
    ]) + [PageBreak()]
    story += section("Digital Delivery Policy", [
        ("Delivery mode", "Oatle Kids is delivered electronically. No physical product is shipped. Paid access is linked to the parent account."),
        ("Delivery time", "Access is normally immediate after successful PayFast confirmation and may take up to 30 minutes."),
        ("Requirements", "A modern browser and internet connection are required for signup, login, payment and access checks. Current access is through the website; App Store and Google Play apps are marked coming soon and are not included in the present purchase."),
        ("Missing access", "The parent should sign out, sign in with the purchasing email and contact support with the payment date and reference if access remains unavailable. Passwords and full card numbers must never be emailed."),
        ("Failed or pending payments", "Access is not delivered for failed, cancelled or unconfirmed payments. Pending payments are handled after PayFast provides a final status."),
        ("Territory and currency", "The merchant is domiciled in South Africa and the subscription is charged in South African rand."),
    ])
    doc.build(story, onFirstPage=policy_page, onLaterPages=policy_page)
    return path

if __name__ == "__main__":
    print(brochure())
    print(policies())
