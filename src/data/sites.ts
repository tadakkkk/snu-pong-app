export type SiteCategory =
  | "core_portal"
  | "career"
  | "writing_learning"
  | "counseling"
  | "health"
  | "library_research"
  | "international"
  | "scholarship_finance"
  | "sports"
  | "culture_facility"
  | "social_volunteer"
  | "rights_safety"
  | "extracurricular"
  | "etc";

export interface Site {
  id: string;
  category: SiteCategory;
  name: string;
  url: string;
  description: string;
}

export const SITE_CATEGORY_LABELS: Record<SiteCategory, string> = {
  core_portal: "핵심 포털",
  career: "진로·취업",
  writing_learning: "글쓰기·학습",
  counseling: "심리상담",
  health: "보건·의료",
  library_research: "도서관·연구",
  international: "국제교류",
  scholarship_finance: "장학금",
  sports: "체육",
  culture_facility: "문화·시설",
  social_volunteer: "사회공헌",
  rights_safety: "인권·안전",
  extracurricular: "비교과",
  etc: "기타",
};

export const SITE_CATEGORY_EMOJI: Record<SiteCategory, string> = {
  core_portal: "🏛️",
  career: "💼",
  writing_learning: "✏️",
  counseling: "🧠",
  health: "🏥",
  library_research: "📚",
  international: "✈️",
  scholarship_finance: "💰",
  sports: "💪",
  culture_facility: "🎵",
  social_volunteer: "🤝",
  rights_safety: "🛡️",
  extracurricular: "🗓️",
  etc: "ℹ️",
};

export const FREQUENT_SITE_IDS = [
  "mysnu_portal",
  "extra_snu",
  "career_center",
  "cdcc_lifecenter",
];

export const sites: Site[] = [
  {
    id: "snu_main",
    category: "core_portal",
    name: "서울대학교 공식 홈페이지",
    url: "https://www.snu.ac.kr",
    description: "전체 학생 서비스 진입점. 학생지원·캠퍼스생활·장학금 등 모든 분류 메뉴 접근.",
  },
  {
    id: "mysnu_portal",
    category: "core_portal",
    name: "포털 마이스누 (mySNU)",
    url: "https://my.snu.ac.kr",
    description: "통합 로그인 포털. 수강신청·장학신청·증명서·비교과 신청 진입점.",
  },
  {
    id: "sugang",
    category: "core_portal",
    name: "수강신청 시스템",
    url: "https://sugang.snu.ac.kr",
    description: "수강신청·정정·강의계획서 조회. 좋은 강의 = 등록금 본전의 기본.",
  },
  {
    id: "extra_snu",
    category: "extracurricular",
    name: "SNU 비교과 통합 시스템",
    url: "https://extra.snu.ac.kr",
    description: "전 영역 비교과 프로그램 통합 신청처. 글쓰기·진로·심리·해외연수까지 한 곳에서.",
  },
  {
    id: "student_office",
    category: "core_portal",
    name: "학생처",
    url: "https://student.snu.ac.kr",
    description: "학생지원과·장학복지과 통합 부서. 모바일 학생증, 시설 예약, 비교과 안내 메인 페이지.",
  },
  {
    id: "admission",
    category: "core_portal",
    name: "입학본부",
    url: "https://admission.snu.ac.kr",
    description: "학부·대학원·편입학 입학 정보. 재학생은 편입/대학원 진학 시 활용.",
  },
  {
    id: "snunow_calendar",
    category: "etc",
    name: "SNU 캘린더 (이벤트/공지)",
    url: "https://www.snu.ac.kr/snunow/events",
    description: "전 학내 행사·모집 일정 통합 캘린더. 마감 임박 프로그램 발견.",
  },
  {
    id: "snunow_notice",
    category: "etc",
    name: "서울대 일반공지",
    url: "https://www.snu.ac.kr/snunow/notice/genernal",
    description: "본부 차원 일반 공지사항. 장학·행사·신청 마감 등 가장 큰 단위 정보.",
  },
  {
    id: "career_center",
    category: "career",
    name: "경력개발센터 (CDC)",
    url: "https://career.snu.ac.kr",
    description: "1:1 진로상담·취업컨설팅·자소서 첨삭·모의면접·STRONG/MBTI 검사. 사설 시세 5만~15만원짜리 다 무료.",
  },
  {
    id: "cdcc_lifecenter",
    category: "counseling",
    name: "학생생활문화원 (생생원)",
    url: "https://cdcc.snu.ac.kr",
    description: "심리상담센터+경력개발센터 통합 페이지. 진로검사·개인심리상담·집단상담 신청.",
  },
  {
    id: "snucounsel",
    category: "counseling",
    name: "대학생활문화원 심리상담",
    url: "https://snucounsel.snu.ac.kr",
    description: "전 학부생 대상 1:1 심리상담 50분 무료. 사설 회당 8~12만원.",
  },
  {
    id: "snudorm_relief",
    category: "counseling",
    name: "관악사 학생상담센터 「관심」",
    url: "https://snudorm.snu.ac.kr/생활안내/상담센터관심/센터-안내/",
    description: "기숙사 거주자 전용 심리상담. 우울·스트레스 자가진단 + 상담 신청.",
  },
  {
    id: "cnscounsel",
    category: "counseling",
    name: "자연대 학생상담센터 「자ː우리」",
    url: "https://cnscounsel.snu.ac.kr",
    description: "자연대 학생 전용 심리상담·심리검사. 단과대별 별도 상담실 보유.",
  },
  {
    id: "health4u",
    category: "health",
    name: "보건진료소",
    url: "https://health4u.snu.ac.kr",
    description: "재학생 연 1회 건강검진 무료. 가정의학·내과·정신건강·치과·금연·비만 클리닉. 일차진료 거의 무료.",
  },
  {
    id: "wellbeing4u",
    category: "health",
    name: "정신건강센터",
    url: "https://wellbeing4u.snu.ac.kr",
    description: "보건진료소 산하 정신건강의학과. 스트레스 클리닉·뉴로피드백·바이오피드백 프로그램.",
  },
  {
    id: "writer_basic",
    category: "writing_learning",
    name: "기초교육원",
    url: "https://liberaledu.snu.ac.kr",
    description: "글쓰기·외국인 글쓰기·리포트 집중지도·학생자율연구·새내기 러닝캠프 운영. 학습 워크숍.",
  },
  {
    id: "writing_center",
    category: "writing_learning",
    name: "글쓰기지원센터 (학부대학)",
    url: "https://snuc.snu.ac.kr/산하기구/글쓰기지원센터/",
    description: "1:1 글쓰기 튜터링·글쓰기 특강·SNU-WAC·토론한마당. 사설 첨삭 회당 3~5만원짜리 전부 무료.",
  },
  {
    id: "snuc_undergrad",
    category: "writing_learning",
    name: "학부대학",
    url: "https://snuc.snu.ac.kr",
    description: "신입생 글쓰기 평가·기초 영어·교양 교과목·Teaching Fellow 채용 정보 등 학부 교육 메인.",
  },
  {
    id: "writer_old",
    category: "writing_learning",
    name: "기초교육원 글쓰는 관악인",
    url: "http://writer.snu.ac.kr",
    description: "글쓰기 교육 자료실. 글쓰기 가이드·우수 리포트 사례 모음.",
  },
  {
    id: "lei_language",
    category: "writing_learning",
    name: "언어교육원",
    url: "https://lei.snu.ac.kr",
    description: "외국어 강좌 (영어·중국어·일본어·스페인어 등). TEPS 시험 운영. 어학 강좌 시세 대비 저렴.",
  },
  {
    id: "library",
    category: "library_research",
    name: "중앙도서관",
    url: "https://lib.snu.ac.kr",
    description: "530만권 장서·학술 DB·전자저널 무제한. 본관+관정관+9개 분관. 일반인은 8만원 내야 일부 이용.",
  },
  {
    id: "likesnu",
    category: "library_research",
    name: "LikeSNU (도서관 빅데이터)",
    url: "https://likesnu.snu.ac.kr",
    description: "도서관 기반 학술 빅데이터 플랫폼. 분야별 추천 자료·연구 트렌드.",
  },
  {
    id: "kyujanggak",
    category: "library_research",
    name: "규장각한국학연구원",
    url: "https://kyujanggak.snu.ac.kr",
    description: "조선왕조실록·동의보감 등 국보 소장. 한국학 연구 자료 열람 가능.",
  },
  {
    id: "sspace",
    category: "library_research",
    name: "S-Space (학위논문 저장소)",
    url: "https://s-space.snu.ac.kr",
    description: "서울대 학위논문·연구 결과물 오픈 액세스. 무료 다운로드.",
  },
  {
    id: "snu_museum",
    category: "culture_facility",
    name: "서울대 박물관",
    url: "https://museum.snu.ac.kr",
    description: "7,200여 점 유물 소장. 연 1회 이상 특별전·연중 상설전. 무료 입장.",
  },
  {
    id: "snu_artmuseum",
    category: "culture_facility",
    name: "서울대 미술관 (MoA)",
    url: "https://www.snumoa.org",
    description: "국내 최초 대학 미술관. 근현대 미술 전시. 학생 무료 또는 할인.",
  },
  {
    id: "snunow_culture",
    category: "culture_facility",
    name: "문화서비스",
    url: "https://www.snu.ac.kr/campuslife/aid/culture",
    description: "음대 정기연주회·미대 전시·공연 일정 통합. 대부분 학생 무료 관람.",
  },
  {
    id: "athletics",
    category: "sports",
    name: "스포츠진흥원",
    url: "https://athletics.snu.ac.kr",
    description: "39개 운동부·체육시설 예약·건강운동강좌·스누펀(SNU FUN). 헬스장·수영장 등 시설 예약.",
  },
  {
    id: "sports_pe",
    category: "sports",
    name: "체육교육과 시설",
    url: "https://sports.snu.ac.kr",
    description: "체육문화연구동·체육관 시설 안내. 강좌 수강 신청.",
  },
  {
    id: "intl_program",
    category: "international",
    name: "국제교육프로그램",
    url: "https://www.snu.ac.kr/academics/programs/international",
    description: "교환학생·단기해외연수·방학연수 지원. 등록금만 내고 해외 1~2학기 = 외국 학비 수천만원 절감.",
  },
  {
    id: "oia",
    category: "international",
    name: "국제협력본부 (OIA)",
    url: "https://oia.snu.ac.kr",
    description: "교환학생 250개 대학 파견·외국인 학생 지원·국제 프로그램 운영 본부.",
  },
  {
    id: "snusr",
    category: "social_volunteer",
    name: "글로벌사회공헌단 (SNUSR)",
    url: "https://snusr.snu.ac.kr",
    description: "국내·해외 봉사단·사회공헌형 교과목·SNUSR 단원 모집. 해외 파견 비용 학교 부담.",
  },
  {
    id: "snufsr",
    category: "social_volunteer",
    name: "교수사회공헌단",
    url: "https://snufsr.snu.ac.kr",
    description: "교수와 함께하는 사회공헌 프로그램·공모전. 멘토링 기회 포함.",
  },
  {
    id: "hrc",
    category: "rights_safety",
    name: "인권센터",
    url: "https://hrc.snu.ac.kr",
    description: "인권 침해·성희롱·차별 상담 및 신고. 인권/성평등 교육 콘텐츠 제공.",
  },
  {
    id: "helplms",
    category: "rights_safety",
    name: "인권/성평등 온라인 교육",
    url: "https://helplms.snu.ac.kr",
    description: "온라인 인권 교육 수강신청·수료증 출력. 매년 의무 이수 + 자기개발 콘텐츠.",
  },
  {
    id: "danbi",
    category: "rights_safety",
    name: "장애학생지원센터 (단비)",
    url: "https://snudanbi.snu.ac.kr",
    description: "장애학생 학습지원·이동지원·도우미 매칭.",
  },
  {
    id: "sboard_facility",
    category: "culture_facility",
    name: "학생지원서비스 (행정 통합)",
    url: "https://www.snu.ac.kr/campuslife/aid/administration",
    description: "문화예술활동 지원공모(행사 2개월 전 신청 시 단체 지원금)·시설이용 신청 등 행정 통합.",
  },
  {
    id: "snudorm",
    category: "etc",
    name: "관악학생생활관 (기숙사)",
    url: "https://snudorm.snu.ac.kr",
    description: "기숙사 입주·시설예약·고장신고·문화행사. 거주자 전용 헬스장·상담센터 포함.",
  },
  {
    id: "tour_office",
    category: "etc",
    name: "견학신청 시스템",
    url: "https://tour.snu.ac.kr",
    description: "캠퍼스 견학·역사기록관 견학 온라인 신청. 학생도 친구 데려와 견학 가능.",
  },
];

export function getSite(id: string): Site | undefined {
  return sites.find((s) => s.id === id);
}

export function getSitesByCategory(category: SiteCategory): Site[] {
  return sites.filter((s) => s.category === category);
}
