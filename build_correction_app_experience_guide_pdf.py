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
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUT = "정보_정정_앱내_경험_프로토타입_제작가이드.pdf"
FONT_REG = r"C:\Windows\Fonts\NotoSansKR-VF.ttf"
FONT_BOLD = r"C:\Windows\Fonts\malgunbd.ttf"


pdfmetrics.registerFont(TTFont("KR", FONT_REG))
pdfmetrics.registerFont(TTFont("KRB", FONT_BOLD))


PAGE_W, PAGE_H = A4
MARGIN_X = 18 * mm
MARGIN_Y = 16 * mm


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("KR", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(MARGIN_X, PAGE_H - 10 * mm, "정보 정정을 위해 앱 자체에 들어가 사용하는 경험 제작 가이드")
    canvas.drawRightString(PAGE_W - MARGIN_X, 9 * mm, str(doc.page))
    canvas.setStrokeColor(colors.HexColor("#EAECF0"))
    canvas.line(MARGIN_X, PAGE_H - 13 * mm, PAGE_W - MARGIN_X, PAGE_H - 13 * mm)
    canvas.restoreState()


doc = BaseDocTemplate(
    OUT,
    pagesize=A4,
    leftMargin=MARGIN_X,
    rightMargin=MARGIN_X,
    topMargin=20 * mm,
    bottomMargin=16 * mm,
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="default", frames=[frame], onPage=header_footer)])


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        "TitleKR",
        fontName="KRB",
        fontSize=22,
        leading=28,
        textColor=colors.HexColor("#0B2545"),
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        "SubtitleKR",
        fontName="KR",
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor("#475467"),
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        "H1KR",
        fontName="KRB",
        fontSize=15,
        leading=21,
        textColor=colors.HexColor("#1F4D78"),
        spaceBefore=12,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        "H2KR",
        fontName="KRB",
        fontSize=12.5,
        leading=18,
        textColor=colors.HexColor("#101828"),
        spaceBefore=8,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        "BodyKR",
        fontName="KR",
        fontSize=9.6,
        leading=14.6,
        textColor=colors.HexColor("#101828"),
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        "SmallKR",
        fontName="KR",
        fontSize=8.6,
        leading=12.5,
        textColor=colors.HexColor("#667085"),
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        "CellKR",
        fontName="KR",
        fontSize=8.4,
        leading=12.4,
        textColor=colors.HexColor("#101828"),
    )
)
styles.add(
    ParagraphStyle(
        "CellHeadKR",
        fontName="KRB",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0B2545"),
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        "CalloutKR",
        fontName="KR",
        fontSize=9.2,
        leading=14,
        textColor=colors.HexColor("#1D2939"),
        leftIndent=0,
        spaceAfter=0,
    )
)


def P(text, style="BodyKR"):
    return Paragraph(text.replace("\n", "<br/>"), styles[style])


def H(text, level=1):
    return P(text, "H1KR" if level == 1 else "H2KR")


def bullet(text):
    return P("• " + text, "BodyKR")


def table(headers, rows, widths, header_fill="#E8EEF5", zebra=False):
    data = [[P(h, "CellHeadKR") for h in headers]]
    for row in rows:
        data.append([P(str(c), "CellKR") for c in row])
    t = Table(data, colWidths=[w * mm for w in widths], hAlign="LEFT", repeatRows=1)
    ts = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(header_fill)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0B2545")),
        ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#D9E2EC")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    if zebra:
        for i in range(2, len(data), 2):
            ts.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#F9FAFB")))
    t.setStyle(TableStyle(ts))
    return t


def callout(title, body, fill="#F2FBF8", border="#B7E4D8"):
    data = [[P(f"<b>{title}</b><br/>{body}", "CalloutKR")]]
    t = Table(data, colWidths=[174 * mm], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(fill)),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor(border)),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    return t


story = []
story.append(P("정보 정정을 위해 앱 자체에 들어가 사용하는 경험 제작 가이드", "TitleKR"))
story.append(
    P(
        "Figma에서 바로 화면을 구성할 수 있도록 정리한 앱 내부 프로토타입 제작 명세입니다. 범위는 홈 → 내 서랍 → 기록 선택 → 검증 다시 하기 또는 정정 → 기존 수신자에게 재발신까지입니다.",
        "SubtitleKR",
    )
)
story.append(
    callout(
        "프로토타입 핵심",
        "사용자는 과거에 보낸 정보를 앱 안의 ‘내 서랍’에서 찾고, 필요하면 ‘검증 다시 하기’로 검증 TASK에 재진입하거나 ‘정정’을 눌러 새 정정 정보를 입력한 뒤 기존 수신자에게 자동 문구와 함께 재발신합니다.",
        "#F7FAFF",
        "#B8D4F6",
    )
)
story.append(Spacer(1, 5))

story.append(H("1. 제작 범위와 전제"))
story.append(bullet("이번 PDF는 앱 진입 이후 화면만 다룹니다. 외부 공유 위젯 경험은 별도 프로토타입으로 둡니다."))
story.append(bullet("검증 TASK 자체는 따로 수행 중이므로, 여기서는 ‘검증 다시 하기’ 버튼을 누른 뒤 검증 TASK로 이동하고 다시 내 서랍으로 돌아오는 연결 지점만 설계합니다."))
story.append(bullet("앱 임시명은 ‘바른공유’, 체크리스트 명칭은 ‘바른정보길잡이’, 지수명은 ‘검증지수(가칭)’로 유지합니다."))
story.append(bullet("예시 콘텐츠는 막걸리 건강 정보 영상으로 고정합니다: “[건강 정보] 막걸리 효능 제대로 보기 위해선 무조건 이렇게 드세요”."))

story.append(H("2. Figma 파일 세팅"))
story.append(
    table(
        ["항목", "설정"],
        [
            ["페이지", "00_Cover / 01_Components / 02_App_Correction_Flow / 03_Prototype_Notes"],
            ["프레임", "iPhone 14 기준 390 × 844 px. 상단 상태바와 하단 탭바를 포함합니다."],
            ["레이아웃", "좌우 여백 24 px, 카드 내부 여백 18-20 px, 카드 간격 16-22 px."],
            ["타이포", "Pretendard 또는 Noto Sans KR. 제목 22-24 px, 섹션 제목 18-20 px, 본문 15-16 px, 보조문구 13-14 px."],
            ["색상", "Primary #1E7F7A, Share #2457A7, Verified #2EAD73, Unverified #D92D20, Surface #F9FAFB."],
        ],
        [34, 140],
        zebra=True,
    )
)

story.append(H("3. 전체 사용자 흐름"))
story.append(
    table(
        ["단계", "사용자 행동", "화면/상태", "프로토타입 연결"],
        [
            ["1", "앱 실행", "홈 화면 진입", "P2-01 홈"],
            ["2", "하단 탭 ‘내 서랍’ 선택", "내가 보낸 기록 목록 확인", "P2-02 내 서랍 목록"],
            ["3A", "검증한 정보의 ‘검증 다시 하기’ 선택", "검증 TASK로 재진입", "외부 검증 TASK 시작 화면으로 링크"],
            ["3B", "고치고 싶은 정보 옆 ‘정정’ 선택", "정정 정보 입력 화면으로 이동", "P2-04 정정 정보 입력"],
            ["4", "새 링크/정정 내용을 입력", "자동 문구와 기존 수신자 자동 선택", "P2-05 정정 메시지 확인"],
            ["5", "재발신하기 선택", "기존 수신자에게 정정 메시지 공유", "P2-06 정정 완료"],
            ["6", "내 서랍으로 돌아가기", "기록 카드가 ‘정정 완료’ 상태로 변경", "P2-02 목록 업데이트"],
        ],
        [15, 43, 55, 61],
        zebra=True,
    )
)

story.append(PageBreak())
story.append(H("4. 화면 목록"))
story.append(
    table(
        ["프레임명", "화면 목적", "필수 구성", "CTA"],
        [
            ["P2-01 홈", "앱 내부 진입 첫 화면. 사용자 상태와 오늘의 검증 동기를 보여줌.", "프로필 카드, 오늘의 검증 도장, 바른정보길잡이 카드, 미디어 리터러시 카드, 하단 탭", "내 서랍 탭"],
            ["P2-02 내 서랍 목록", "과거 공유 기록을 찾고 검증/정정 행동을 시작함.", "필터 칩, 검증한 정보 카드, 미검증 정보 카드, 상태 배지", "검증 다시 하기 / 정정 / 검증하기"],
            ["P2-03 기록 상세", "선택한 공유 기록의 맥락을 확인함.", "썸네일, 제목, 보낸 메시지, 수신자, 검증지수, 참고자료, 활동 로그", "검증 다시 하기 / 정정"],
            ["P2-04 정정 정보 입력", "새 정정 정보와 이유를 입력함.", "이전 정보 카드, 입력 필드, 자동 생성 문구, 기존 수신자 칩", "정정 메시지 확인"],
            ["P2-05 정정 메시지 확인", "재발신 전 최종 메시지와 수신자를 확인함.", "정정 메시지 미리보기, 원본/정정 정보 비교, 수신자 목록", "재발신하기"],
            ["P2-06 정정 완료", "재발신 완료와 기록 상태 변경을 알려줌.", "완료 안내, 도장, 재발신 대상 요약, 내 서랍 업데이트 안내", "내 서랍으로"],
        ],
        [29, 43, 66, 36],
        zebra=True,
    )
)

story.append(H("5. P2-01 홈 화면 제작 명세"))
story.append(bullet("상단에는 앱 이름 ‘바른공유’를 작게 두고, 오른쪽에는 + 아이콘 버튼을 둡니다. + 버튼은 새 공유/최근 사용 앱 진입을 암시하는 가짜 버튼입니다."))
story.append(bullet("프로필 카드는 청록색 배경으로 크게 배치합니다. 문구는 ‘나의 기본정보 / 기본 연락 플랫폼 · 카카오톡 / 나의 검증지수(가칭) 72점’을 사용합니다."))
story.append(bullet("오늘의 검증 카드는 흰색 카드로 만들고 오른쪽에 원형 도장 영역을 둡니다. 정정 재발신 완료 후에는 ‘칭찬해요!’ 도장 상태로 바뀌는 프레임을 별도로 만듭니다."))
story.append(bullet("하단 탭은 도움말, 홈, 내 서랍 3개입니다. 홈 화면에서는 홈 탭만 청록색 활성 상태로 표시합니다."))

story.append(H("6. P2-02 내 서랍 목록 제작 명세"))
story.append(bullet("화면 제목은 ‘내 서랍’, 보조문구는 ‘내가 보낸 기록 모아보기’입니다."))
story.append(bullet("필터는 주제별 칩과 검증도별 칩을 한 줄 또는 두 줄로 배치합니다. 기본 선택은 ‘건강’입니다."))
story.append(bullet("검증한 정보 카드는 연한 초록 배경, 초록 테두리, 원형 ‘중’ 배지를 사용합니다. 버튼은 ‘검증 다시 하기’와 ‘정정’을 둘 다 제공합니다."))
story.append(bullet("미검증 정보 카드는 연한 빨강 배경, 빨강 테두리, ‘미검증’ 배지를 사용합니다. 버튼은 ‘검증하기’를 제공합니다."))
story.append(bullet("고치고 싶은 정보 옆의 ‘정정’ 버튼을 눈에 띄게 배치해야 합니다. 발표 시 정정 흐름으로 들어가는 주 경로입니다."))
story.append(
    table(
        ["카드 상태", "배경/테두리", "표시 정보", "버튼"],
        [
            ["검증한 정보", "배경 #F2FBF8 / 테두리 #B7E4D8", "썸네일, 제목, 보낸 대상, 검증지수 상/중/하", "검증 다시 하기, 정정"],
            ["미검증 정보", "배경 #FFF8F7 / 테두리 #FECDCA", "썸네일, 제목, 보낸 대상, 미검증 배지", "검증하기"],
            ["정정 완료", "배경 #F7FAFF / 테두리 #B8D4F6", "원본 제목, 정정 완료 날짜, 재발신 대상", "정정 내역 보기"],
        ],
        [30, 48, 58, 38],
        zebra=True,
    )
)

story.append(PageBreak())
story.append(H("7. 특정 정보 다시 검증하기 흐름"))
story.append(P("이 흐름은 3.3 ‘특정 정보 다시 검증하기’에 해당합니다. 검증 TASK는 별도 제작 중이므로, 이 가이드에서는 연결부만 명확히 지정합니다."))
story.append(
    table(
        ["프레임", "상태", "사용자 액션", "다음 화면"],
        [
            ["P2-02 내 서랍 목록", "검증한 정보 카드에 ‘검증 다시 하기’ 버튼 노출", "버튼 탭", "P2-V01 검증 TASK 진입 안내"],
            ["P2-V01 검증 TASK 진입 안내", "검증 화면으로 이동한다는 중간 프레임 또는 로딩 상태", "자동 이동 또는 시작하기 탭", "별도 검증 TASK"],
            ["별도 검증 TASK", "바른정보길잡이/참고자료 확인 수행", "검증 완료", "P2-V02 검증 결과 반영"],
            ["P2-V02 검증 결과 반영", "내 서랍 카드의 검증지수와 최근 검증일 업데이트", "내 서랍으로", "P2-02 목록 업데이트"],
        ],
        [42, 58, 36, 38],
        zebra=True,
    )
)
story.append(
    callout(
        "검증 다시 하기 안내 문구",
        "이 정보를 다시 검증해볼게요. 검증이 끝나면 내 서랍의 검증지수와 참고자료가 업데이트됩니다.",
        "#F2FBF8",
        "#B7E4D8",
    )
)

story.append(H("8. 잘못된 정보 정정 및 재발신 흐름"))
story.append(P("이 흐름은 3.3 if ‘잘못된 정보 정정, 재발신’에 해당합니다. 핵심은 사용자가 새 수신자를 고르는 부담 없이 기존 수신자에게 바로 정정 메시지를 보낼 수 있게 하는 것입니다."))
story.append(
    table(
        ["단계", "화면", "필수 UI", "주의점"],
        [
            ["1", "내 서랍 목록", "막걸리 영상 카드 오른쪽 또는 하단에 ‘정정’ 버튼", "‘검증 다시 하기’와 시각적으로 구분. 정정은 파란색 또는 금색 보조 버튼 사용"],
            ["2", "정정 정보 입력", "이전 정보 카드, 새 링크/내용 입력 필드, 정정 이유 입력, 자동 문구 카드", "입력 전에도 자동 문구가 보이게 하여 사용자가 안심하게 함"],
            ["3", "기존 수신자 확인", "가족, 조한결, 허윤 칩이 기본 선택됨", "사용자는 해제할 수 있지만 기본값은 전체 선택"],
            ["4", "정정 메시지 확인", "원본 정보와 정정 정보 비교, 자동 메시지 미리보기", "보내기 전 최종 확인 화면을 반드시 둠"],
            ["5", "재발신 완료", "완료 체크, 오늘의 검증 도장, 내 서랍 업데이트 안내", "정정 완료 후 기록 카드 상태가 바뀌는 것을 보여줌"],
        ],
        [14, 36, 68, 56],
        zebra=True,
    )
)

story.append(H("9. P2-04 정정 정보 입력 화면 세부"))
story.append(bullet("앱바: 왼쪽 뒤로가기, 중앙 제목 ‘정정하기’."))
story.append(bullet("이전 정보 카드: ‘이전에 보낸 정보’ 라벨, 제목 1-2줄, ‘가족 단톡방, 조한결, 허윤에게 보냄’ 문구를 포함합니다."))
story.append(bullet("정정 정보 입력 필드: placeholder는 ‘새 링크 또는 정정 내용을 입력하세요’입니다. 필드 높이는 60 px 이상으로 둡니다."))
story.append(bullet("자동 생성 문구 카드는 연한 노랑 배경으로 만듭니다. 사용자가 직접 작성하지 않아도 앱이 도와준다는 느낌을 줍니다."))
story.append(bullet("기존 수신자 칩은 기본 선택 상태입니다. 칩 문구는 ‘가족’, ‘조한결’, ‘허윤’을 사용합니다."))
story.append(
    callout(
        "자동 생성 문구",
        "이전에 보낸 A정보에 반대되는 정보를 찾았어요.<br/>건강 정보는 참고용으로 다시 확인해주세요.",
        "#FFF8E6",
        "#F0C36D",
    )
)

story.append(H("10. P2-05 정정 메시지 확인 화면 세부"))
story.append(bullet("상단에는 ‘정정 메시지를 확인해주세요’ 제목을 둡니다."))
story.append(bullet("원본 정보와 정정 정보를 나란히 또는 위아래 카드로 비교합니다. 모바일에서는 위아래 카드가 안전합니다."))
story.append(bullet("메시지 미리보기는 실제 메신저 말풍선처럼 보여주면 사용자가 ‘이렇게 보내지는구나’를 이해하기 쉽습니다."))
story.append(bullet("하단 고정 CTA는 ‘재발신하기’입니다. 파란색 #2457A7을 사용해 실제 발송 행동임을 강조합니다."))
story.append(
    callout(
        "최종 정정 메시지 예시",
        "이전에 보낸 ‘[건강 정보] 막걸리 효능 제대로 보기 위해선 무조건 이렇게 드세요’ 정보와 반대되는 내용을 찾았어요.<br/>건강 정보는 사람마다 다르게 적용될 수 있어서, 아래 정정 내용을 함께 확인해주세요.<br/><br/>정정 정보: 사용자가 새로 입력한 링크 또는 설명",
        "#F7FAFF",
        "#B8D4F6",
    )
)

story.append(PageBreak())
story.append(H("11. P2-06 정정 완료 화면 세부"))
story.append(bullet("완료 아이콘은 큰 체크 원형 아이콘을 사용합니다. 문구는 ‘정정 메시지를 다시 보냈어요’입니다."))
story.append(bullet("보낸 대상 요약: ‘가족 단톡방, 조한결, 허윤에게 재발신됨’."))
story.append(bullet("오늘의 검증 도장: ‘칭찬해요! 오늘의 검증 도장을 받았어요’ 상태로 표시합니다."))
story.append(bullet("하단 CTA는 ‘내 서랍으로’입니다. 선택 시 P2-02 내 서랍 목록의 정정 완료 상태 카드로 돌아갑니다."))

story.append(H("12. 프로토타입 인터랙션 지정"))
story.append(
    table(
        ["대상", "트리거", "효과", "설정값"],
        [
            ["하단 탭", "Tap", "화면 전환", "Instant 또는 Smart Animate 250ms"],
            ["기록 카드", "Tap", "상세 화면 이동", "Navigate to P2-03"],
            ["검증 다시 하기", "Tap", "검증 TASK 연결", "Navigate to P2-V01"],
            ["정정 버튼", "Tap", "정정 입력 화면 이동", "Navigate to P2-04"],
            ["수신자 칩", "Tap", "선택/해제 variant 전환", "Change to selected/unselected"],
            ["재발신하기", "Tap", "완료 화면 이동", "Smart Animate 300ms"],
            ["도장", "정정 완료 후", "빈 도장 → 칭찬 도장", "After Delay 300ms 또는 Change to variant"],
        ],
        [36, 28, 54, 56],
        zebra=True,
    )
)

story.append(H("13. 컴포넌트 체크리스트"))
for item in [
    "Bottom Tab: 도움말 / 홈 / 내 서랍. 활성 탭은 청록색 원형 배경과 진한 라벨.",
    "Record Card: 검증한 정보, 미검증 정보, 정정 완료 3개 variant.",
    "CTA Button: Primary 청록, Share 파랑, Warning/Correction 보조색.",
    "Recipient Chip: selected, unselected, disabled 3개 variant.",
    "Correction Message Card: 자동 생성 문구와 사용자가 입력한 정정 정보 영역 분리.",
    "Stamp: empty, earned 2개 variant. 프로토타입에서는 도장 1종만 구현.",
]:
    story.append(bullet(item))

story.append(H("14. 화면 고정 문구"))
story.append(
    table(
        ["위치", "문구"],
        [
            ["홈 프로필", "나의 기본정보 / 기본 연락 플랫폼 · 카카오톡 / 나의 검증지수(가칭) 72점"],
            ["내 서랍 제목", "내가 보낸 기록 모아보기"],
            ["검증 재진입", "이 정보를 다시 검증해볼게요"],
            ["정정 입력", "새 링크 또는 정정 내용을 입력하세요"],
            ["자동 문구", "이전에 보낸 A정보에 반대되는 정보를 찾았어요."],
            ["수신자", "기존 수신자"],
            ["재발신 CTA", "재발신하기"],
            ["완료", "정정 메시지를 다시 보냈어요"],
        ],
        [44, 130],
        zebra=True,
    )
)

story.append(H("15. 최종 QA"))
story.append(bullet("홈 → 내 서랍 → 정정 → 재발신 완료까지 클릭이 끊기지 않아야 합니다."))
story.append(bullet("내 서랍에서 ‘검증 다시 하기’와 ‘정정’의 역할이 서로 다르게 보이는지 확인합니다."))
story.append(bullet("기존 수신자가 자동 선택되어 있는지 확인합니다. 이 기능이 정정 경험의 핵심입니다."))
story.append(bullet("재발신 완료 후 내 서랍 카드가 ‘정정 완료’ 상태로 바뀌는 프레임을 반드시 만듭니다."))
story.append(bullet("고령 사용자 기준으로 버튼 높이 52-56 px, 본문 15-16 px 이상을 유지합니다."))

doc.build(story)
print(OUT)
