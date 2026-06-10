from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs"
OUT_DIR.mkdir(exist_ok=True)
PDF_PATH = OUT_DIR / "NuudelchinTrip_Production_Readiness_Blueprint_v1.pdf"

FONT_DIR = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Arial", str(FONT_DIR / "arial.ttf")))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(FONT_DIR / "arialbd.ttf")))

BLUE = colors.HexColor("#2563EB")
DARK = colors.HexColor("#0F172A")
MUTED = colors.HexColor("#64748B")
BORDER = colors.HexColor("#CBD5E1")
LIGHT_BLUE = colors.HexColor("#EFF6FF")
LIGHT_GRAY = colors.HexColor("#F8FAFC")
GREEN = colors.HexColor("#15803D")
GREEN_BG = colors.HexColor("#F0FDF4")
AMBER = colors.HexColor("#B45309")
AMBER_BG = colors.HexColor("#FFFBEB")
RED = colors.HexColor("#B91C1C")
RED_BG = colors.HexColor("#FEF2F2")
WHITE = colors.white

PAGE_W, PAGE_H = A4
LEFT = RIGHT = 19 * mm
TOP = 20 * mm
BOTTOM = 18 * mm
CONTENT_W = PAGE_W - LEFT - RIGHT


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="BlueprintBody",
        fontName="Arial",
        fontSize=9.5,
        leading=13.5,
        textColor=DARK,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="BlueprintMuted",
        parent=styles["BlueprintBody"],
        textColor=MUTED,
    )
)
styles.add(
    ParagraphStyle(
        name="BlueprintH1",
        fontName="Arial-Bold",
        fontSize=17,
        leading=21,
        textColor=BLUE,
        spaceBefore=10,
        spaceAfter=8,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="BlueprintH2",
        fontName="Arial-Bold",
        fontSize=13,
        leading=17,
        textColor=BLUE,
        spaceBefore=8,
        spaceAfter=5,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="BlueprintH3",
        fontName="Arial-Bold",
        fontSize=10.5,
        leading=14,
        textColor=DARK,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="BlueprintBullet",
        fontName="Arial",
        fontSize=9.3,
        leading=13.2,
        textColor=DARK,
        leftIndent=11,
        firstLineIndent=-8,
        bulletIndent=2,
        spaceAfter=3,
    )
)
styles.add(
    ParagraphStyle(
        name="BlueprintStep",
        fontName="Arial",
        fontSize=9.3,
        leading=13.2,
        textColor=DARK,
        leftIndent=14,
        firstLineIndent=-12,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="Cell",
        fontName="Arial",
        fontSize=7.7,
        leading=10.2,
        textColor=DARK,
    )
)
styles.add(
    ParagraphStyle(
        name="CellBold",
        parent=styles["Cell"],
        fontName="Arial-Bold",
    )
)
styles.add(
    ParagraphStyle(
        name="CellWhite",
        parent=styles["CellBold"],
        textColor=WHITE,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverKicker",
        fontName="Arial-Bold",
        fontSize=10,
        leading=12,
        textColor=BLUE,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        fontName="Arial-Bold",
        fontSize=29,
        leading=33,
        textColor=DARK,
        spaceAfter=11,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSubtitle",
        fontName="Arial",
        fontSize=13,
        leading=18,
        textColor=MUTED,
        spaceAfter=20,
    )
)


def p(text, style="BlueprintBody"):
    return Paragraph(text, styles[style])


def h(text, level=1):
    return Paragraph(text, styles[f"BlueprintH{level}"])


def bullet(text, checkbox=False):
    marker = "[ ]" if checkbox else "•"
    return Paragraph(f"{marker} {text}", styles["BlueprintBullet"])


def step(number, text):
    return Paragraph(f"{number}. {text}", styles["BlueprintStep"])


def callout(label, text, bg=LIGHT_BLUE, accent=BLUE):
    content = [
        Paragraph(label.upper(), ParagraphStyle(
            "CalloutLabel", fontName="Arial-Bold", fontSize=7.6, leading=10,
            textColor=accent, spaceAfter=4
        )),
        Paragraph(text, ParagraphStyle(
            "CalloutText", fontName="Arial", fontSize=9.3, leading=13.2,
            textColor=DARK
        )),
    ]
    table = Table([[content]], colWidths=[CONTENT_W])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.5, bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return KeepTogether([table, Spacer(1, 7)])


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Arial", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(LEFT, PAGE_H - 11 * mm, "NuudelchinTrip | Production Readiness Blueprint")
    canvas.drawRightString(PAGE_W - RIGHT, 9 * mm, f"{doc.page}")
    canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
    canvas.setLineWidth(0.4)
    canvas.line(LEFT, PAGE_H - 13 * mm, PAGE_W - RIGHT, PAGE_H - 13 * mm)
    canvas.restoreState()


doc = BaseDocTemplate(
    str(PDF_PATH),
    pagesize=A4,
    leftMargin=LEFT,
    rightMargin=RIGHT,
    topMargin=TOP,
    bottomMargin=BOTTOM,
    title="NuudelchinTrip Production Readiness Blueprint",
    author="NuudelchinTrip",
    subject="Production readiness implementation blueprint",
)
frame = Frame(LEFT, BOTTOM, CONTENT_W, PAGE_H - TOP - BOTTOM, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=header_footer)])

story = []

# Cover
story += [
    Spacer(1, 20 * mm),
    Paragraph("NUUDELCHINTRIP", styles["CoverKicker"]),
    Paragraph("Production Readiness<br/>Blueprint", styles["CoverTitle"]),
    Paragraph(
        "Ажилладаг MVP-ээс олон нийт ашиглах найдвартай платформ руу шилжих хэрэгжүүлэлтийн зураглал",
        styles["CoverSubtitle"],
    ),
    callout(
        "Одоогийн үнэлгээ",
        "NuudelchinTrip нь үндсэн Supabase холболттой, ажилладаг MVP/demo болсон. "
        "Гэхдээ production хэрэглээнд нээхийн өмнө authentication, verification, суудлын удирдлага, "
        "төлбөр, аяллын lifecycle, мэдэгдэл, security болон QA-г бүрэн дуусгах шаардлагатай.",
    ),
]

meta_data = [
    [p("<b>Баримтын хувилбар</b>", "Cell"), p("v1.0", "Cell")],
    [p("<b>Шалгасан огноо</b>", "Cell"), p("2026 оны 6 сарын 7", "Cell")],
    [p("<b>Live website</b>", "Cell"), p("https://nuudelchintrip.com", "Cell")],
    [p("<b>Үндсэн бүтээгдэхүүн</b>", "Cell"), p("Аялагч ба жолоочийг чиглэлээр холбох платформ", "Cell")],
]
meta = Table(meta_data, colWidths=[44 * mm, CONTENT_W - 44 * mm])
meta.setStyle(TableStyle([
    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
    ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story += [meta, PageBreak()]

story += [
    h("1. Blueprint-ийн зорилго"),
    p(
        "Энэ баримт нь NuudelchinTrip-ийг demo түвшнээс бодит хэрэглэгч, жолооч, админ ашиглах production "
        "платформ болгоход шаардлагатай ажлыг эрэмбэлж, шат бүрийн дууссан шалгуурыг тогтооно."
    ),
    p(
        "Бүтээгдэхүүний гол урсгал нь аялагч жолоочийн нийтэлсэн чиглэлийг хайж, суудлаа сонгон захиалах явдал. "
        "Дайвар ачаа нь жолоочийн чиглэл дээр суурилсан нэмэлт боломж байна."
    ),
    callout(
        "Launch шийдвэр",
        "Одоогийн хувилбарыг захиалагчид MVP/demo байдлаар үзүүлж болно. Харин танихгүй олон хэрэглэгчид "
        "нээлттэй ашиглуулахын өмнө энэхүү blueprint-ийн P0 ажлууд заавал дууссан байна.",
        bg=AMBER_BG,
        accent=AMBER,
    ),
    h("2. Одоогийн бодит төлөв"),
]

status_rows = [
    [p("Хэсэг", "CellWhite"), p("Төлөв", "CellWhite"), p("Тайлбар", "CellWhite")],
    [p("Public website", "CellBold"), p("Ажиллаж байна", "CellBold"), p("Нүүр, танилцуулга, бүртгэл, mobile public layout", "Cell")],
    [p("Auth ба role routing", "CellBold"), p("Хэсэгчлэн", "CellBold"), p("Supabase auth ажиллаж байгаа ч production OTP/SMTP дутуу", "Cell")],
    [p("Жолоочийн чиглэл", "CellBold"), p("Хэсэгчлэн", "CellBold"), p("Чиглэл үүсгэх бодит; verification document upload дутуу", "Cell")],
    [p("Аялагчийн захиалга", "CellBold"), p("Хэсэгчлэн", "CellBold"), p("Хайлт, суудал сонголт, booking бий; lifecycle бүрэн биш", "Cell")],
    [p("Төлбөр", "CellBold"), p("Хэсэгчлэн", "CellBold"), p("Баримт upload/admin approve бий; settlement/refund/atomic flow дутуу", "Cell")],
    [p("Аяллын явц", "CellBold"), p("Дутуу", "CellBold"), p("Эхлүүлэх, дуусгах, audit log, notification бүрэн холбогдоогүй", "Cell")],
    [p("Дайвар ачаа", "CellBold"), p("Хэсэгчлэн", "CellBold"), p("Request бий; detail, proof, delivery code lifecycle дутуу", "Cell")],
    [p("Admin", "CellBold"), p("Хэсэгчлэн", "CellBold"), p("Зарим queue бодит; reports/logs/operations бүрэн биш", "Cell")],
]
status_table = Table(status_rows, colWidths=[40 * mm, 29 * mm, CONTENT_W - 69 * mm], repeatRows=1)
status_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BLUE),
    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("BACKGROUND", (1, 1), (1, 1), GREEN_BG),
    ("TEXTCOLOR", (1, 1), (1, 1), GREEN),
    ("BACKGROUND", (1, 2), (1, 5), AMBER_BG),
    ("BACKGROUND", (1, 7), (1, 8), AMBER_BG),
    ("BACKGROUND", (1, 6), (1, 6), RED_BG),
]))
story += [status_table, Spacer(1, 7), h("3. Production launch blocker")]

blockers = [
    ("Production OTP ба email", "Demo баталгаажуулалтыг жинхэнэ SMS/OTP болгох; custom SMTP, password reset, rate limit нэмэх."),
    ("Жолоочийн бичиг баримт", "Үнэмлэх, машины гэрчилгээ, зураг бодитоор upload хийж, админ шалгах."),
    ("Суудлын түгжээ ба суллалт", "Pending хүсэлтэд хугацаатай hold хийх; reject/cancel/expiry үед автоматаар суллах."),
    ("Booking төлөвийн хамгаалалт", "Төлөв шилжилтийг client update биш role-validated RPC/серверийн функцээр хийх."),
    ("Төлбөрийн найдвартай урсгал", "Баримт, approval, booking update-ийг transaction болгох; refund/payout дүрэмтэй байх."),
    ("Аялал эхлүүлэх ба дуусгах", "Жолооч action, timestamp, status log, аялагч/админ мэдэгдлийг холбох."),
    ("Fake/placeholder UX арилгах", "Ажиллахгүй чат, report, түр код, mock хүн/утас/данс, placeholder мэдээллийг бүрэн цэвэрлэх."),
    ("Security ба RLS", "Role, verification, phone_verified зэрэг sensitive field-ийг хэрэглэгч өөрөө өөрчилж чадахгүй болгох."),
]
story += [bullet(f"<b>{title}:</b> {desc}") for title, desc in blockers]
story.append(PageBreak())

story += [
    h("4. Хэрэгжүүлэх 12 үе шат"),
    p("Ажлыг доорх дарааллаар хийх нь өгөгдөл, эрх, төлөвийн зөрчил үүсэх эрсдэлийг хамгийн бага байлгана."),
]
phase_data = [
    ("1", "Auth, OTP, SMTP", "Production SMS/OTP, email confirmation, reset password", "Хэрэглэгч найдвартай бүртгүүлж нэвтэрнэ"),
    ("2", "Жолоочийн verification", "Document upload, admin review, approve/reject", "Approved жолооч л чиглэл нийтэлнэ"),
    ("3", "Аялагчийн аялал", "Миний аялал, booking list/detail, зөв empty state", "Аялагч өөрийн захиалгаа бүрэн харна"),
    ("4", "Суудлын удирдлага", "Seat hold, expiry, reject/cancel release", "Суудал давхардахгүй, түгжигдэхгүй"),
    ("5", "Booking lifecycle", "Role-validated RPC state transitions", "Төлөв зөв дарааллаар, audit-тай шилжинэ"),
    ("6", "Төлбөр", "Admin account, proof review, transaction, refund/payout", "Мөнгөний урсгал хяналттай болно"),
    ("7", "Аялал эхлэх/дуусах", "Driver actions, timestamps, logs, notifications", "Бодит аяллын lifecycle дуусна"),
    ("8", "Мэдэгдэл ба лог", "In-app notification, admin alerts, audit history", "Хэрэглэгч дараагийн алхмаа мэднэ"),
    ("9", "Дайвар ачаа", "Cargo detail, proof, delivery code, status lifecycle", "Route-based cargo add-on бүтэн ажиллана"),
    ("10", "Admin operations", "Users, reports, payments, routes, disputes real data", "Админ өдөр тутмын ажиллагааг удирдана"),
    ("11", "Mobile, security, QA", "Responsive QA, RLS audit, tests, monitoring", "Production эрсдэл буурна"),
    ("12", "Launch ба handoff", "Policies, backups, runbook, customer acceptance", "Нээлттэй ашиглалтад шилжинэ"),
]
phase_rows = [[p("#", "CellWhite"), p("Үе шат", "CellWhite"), p("Хийх ажил", "CellWhite"), p("Дууссан шалгуур", "CellWhite")]]
for number, title, work, done in phase_data:
    phase_rows.append([p(number, "CellBold"), p(title, "CellBold"), p(work, "Cell"), p(done, "Cell")])
phase_table = Table(phase_rows, colWidths=[9 * mm, 37 * mm, 66 * mm, CONTENT_W - 112 * mm], repeatRows=1)
phase_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BLUE),
    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (0, 1), (0, -1), "CENTER"),
    ("BACKGROUND", (0, 1), (0, -1), LIGHT_BLUE),
    ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story += [phase_table, PageBreak()]

story += [h("5. Үндсэн хэрэглэгчийн урсгал"), h("5.1 Аялагч", 2)]
traveler_steps = [
    "Бүртгүүлэх → утас баталгаажуулах → аялагчийн мэдээллээ бүрдүүлэх",
    "Жолоочийн чиглэл хайх → чиглэлийн дэлгэрэнгүй үзэх",
    "Сул суудлаас өөрөө сонгох → захиалгын хүсэлт илгээх",
    "Жолооч зөвшөөрөх → төлбөрийн баримт оруулах",
    "Админ төлбөр батлах → аялал баталгаажих",
    "Аялал эхлэх/дуусах мэдэгдэл авах → үнэлгээ өгөх",
]
story += [step(i + 1, text) for i, text in enumerate(traveler_steps)]
story += [h("5.2 Жолооч", 2)]
driver_steps = [
    "Бүртгүүлэх → утас баталгаажуулах → машин, үнэмлэхийн мэдээлэл оруулах",
    "Админ verification approve хийх",
    "Чиглэл, огноо, цаг, үнэ, суудлын байрлал нийтлэх",
    "Ирсэн суудлын болон дайвар ачааны хүсэлтийг зөвшөөрөх/татгалзах",
    "Аяллыг эхлүүлэх → дуусгах",
    "Орлого, төлбөр, үнэлгээний түүхээ харах",
]
story += [step(i + 1, text) for i, text in enumerate(driver_steps)]
story += [h("5.3 Админ", 2)]
admin_steps = [
    "Жолоочийн бичиг баримт шалгах",
    "Төлбөрийн баримт батлах эсвэл татгалзах",
    "Аялал эхэлсэн/дууссан болон маргааны мэдэгдэл хүлээн авах",
    "Хэрэглэгч, чиглэл, захиалга, ачаа, report-ыг хянах",
    "Refund, suspension, dispute зэрэг ажиллагааг audit log-той хийх",
]
story += [step(i + 1, text) for i, text in enumerate(admin_steps)]

story += [h("6. Database ба backend шаардлага")]
database_items = [
    "profiles: role болон verification field-үүдийг зөвхөн хамгаалагдсан RPC/admin update хийнэ.",
    "driver_profiles: document path, verification reviewer, reviewed_at, rejection_reason хадгална.",
    "trips: structured location, seats, status, cargo permission болон expiry дүрэмтэй байна.",
    "passenger_bookings: selected seats, hold_expires_at, state transition timestamps хадгална.",
    "payments/proofs: booking/cargo reference, amount, reviewer, reviewed_at, rejection reason хадгална.",
    "trip_status_logs: төлөв бүрийн өмнөх/дараах утга, actor, timestamp, note хадгална.",
    "notifications: recipient, event type, read_at, deeplink хадгална.",
    "reviews/reports: зөвхөн холбоотой, дууссан transaction-аас үүсэх серверийн шалгалттай байна.",
]
story += [bullet(item) for item in database_items]
story += [
    callout(
        "Чухал дүрэм",
        "Booking, payment approval, trip start/end, seat release зэрэг олон хүснэгт өөрчилдөг үйлдлийг "
        "frontend-ээс дараалсан update хэлбэрээр бус database transaction/RPC эсвэл server function-оор гүйцэтгэнэ.",
        bg=RED_BG,
        accent=RED,
    ),
    PageBreak(),
]

story += [h("7. Security checklist")]
security_items = [
    "Admin route нь UI нууснаар бус database role-оор хамгаалагдсан",
    "User role, phone_verified, is_suspended, verification_status-ийг өөрөө update хийж чадахгүй",
    "Storage upload file type, хэмжээ, owner path, signed URL бодлоготой",
    "OTP resend, login, register, support form дээр rate limit тавьсан",
    "Booking/cargo status transition бүр role болон одоогийн төлвийг шалгадаг",
    "Payment approval, verification, suspension бүр audit log үүсгэдэг",
    "Supabase service role key frontend bundle-д байхгүй",
    "Production environment variables зөвхөн Vercel/Supabase secret store-д хадгалагдсан",
    "Backup, restore test, security alert болон access review төлөвлөгөөтэй",
]
story += [bullet(item, checkbox=True) for item in security_items]

story += [h("8. UI/UX ба content checklist")]
ux_items = [
    "Customer UI бүхэлдээ ойлгомжтой Монгол хэлтэй; role, admin, review зэрэг хөгжүүлэлтийн үг хэрэглээгүй",
    "Аялагчийн самбарт жолоочийн action харагдахгүй; жолоочийн самбарт аялагчийн action харагдахгүй",
    "Хуудас бүр дараагийн хийх үйлдлийг нэг үндсэн CTA-аар тодорхой харуулдаг",
    "Ажиллахгүй товч, mock тоо, fake review, fake банкны данс, placeholder хүн байхгүй",
    "Empty, loading, error, success, offline state бүр хэрэглэгчид тайлбар өгдөг",
    "Mobile дээр sidebar drawer, form, seat picker, modal, table хэвтээ overflow-гүй",
    "Нэг хуудас нэг H1, form бүр label, autocomplete, keyboard focus, contrast шаардлага хангадаг",
    "SEO title, description, Open Graph Монгол UTF-8 текст зөв харагддаг",
]
story += [bullet(item, checkbox=True) for item in ux_items]

story += [h("9. QA test matrix")]
qa_data = [
    ("Аялагч", "Register → OTP → хайлт → суудал → booking → payment → trip → review"),
    ("Жолооч", "Register → document verification → route → accept → start/end → earnings"),
    ("Ачаа илгээгч", "Cargo-enabled route → request → payment → pickup → delivery code"),
    ("Админ", "Verification → payment → reports → suspension/refund → audit log"),
    ("Security", "Role bypass, RLS, duplicate seat, invalid status, file upload abuse"),
    ("Mobile", "360px, 390px, tablet, desktop дээр бүх core flow"),
]
qa_rows = [[p("Тест", "CellWhite"), p("Заавал шалгах урсгал", "CellWhite")]]
qa_rows += [[p(label, "CellBold"), p(flow, "Cell")] for label, flow in qa_data]
qa_table = Table(qa_rows, colWidths=[35 * mm, CONTENT_W - 35 * mm], repeatRows=1)
qa_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BLUE),
    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story += [qa_table, PageBreak()]

story += [h("10. Phase acceptance criteria"), h("P0 — Олон нийтэд нээхээс өмнө", 2)]
p0_items = [
    "Шинэ traveler, driver, cargo account бүртгүүлж, OTP баталгаажуулж чаддаг",
    "Driver document upload ба admin approval бодитоор ажилладаг",
    "Seat hold/release болон booking state machine давхар захиалга үүсгэдэггүй",
    "Төлбөрийн баримт, approval, booking confirmation transaction байдлаар ажилладаг",
    "Driver аялал эхлүүлж/дуусгаж, аялагч болон админ мэдэгдэл авдаг",
    "Core flow-д mock data, ажиллахгүй товч, placeholder action үлдээгүй",
    "RLS/security test болон 4 role-ийн end-to-end test амжилттай",
]
story += [bullet(item, checkbox=True) for item in p0_items]
story += [h("P1 — Захиалагчид production байдлаар хүлээлгэн өгөх", 2)]
p1_items = [
    "Cargo lifecycle, review, report, support бүр real data-тай",
    "Terms, privacy, cancellation, refund, prohibited cargo policy батлагдсан",
    "Monitoring, error tracking, backups, alert тохирсон",
    "Mobile болон accessibility QA дууссан",
    "Admin runbook, deployment guide, test accounts, handoff documentation бэлэн",
]
story += [bullet(item, checkbox=True) for item in p1_items]
story += [h("11. Хүлээлгэн өгөх багц")]
handoff_items = [
    "Production source code ба version tag",
    "Supabase schema/migration болон RLS policy",
    "Vercel environment variable жагсаалт",
    "Admin хэрэглэгч үүсгэх заавар",
    "Operational runbook: payment, verification, report, refund",
    "QA report болон үлдсэн known issue жагсаалт",
    "Backup/restore болон incident response товч заавар",
]
story += [bullet(item) for item in handoff_items]
story += [
    callout(
        "Эцсийн дүгнэлт",
        "NuudelchinTrip-ийн үндсэн концепц зөв бөгөөд Supabase-тэй ажилладаг суурь бий. "
        "Дараагийн ажил нь шинэ feature олноор нэмэх бус, дээрх 12 үе шатыг дарааллаар дуусгаж "
        "core passenger-driver booking flow-ийг найдвартай, хамгаалагдсан, хэмжигдэхүйц болгох юм.",
    )
]

doc.build(story)
print(PDF_PATH)
