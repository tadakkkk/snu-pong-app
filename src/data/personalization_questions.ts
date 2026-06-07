export type PersonalizationQuestionOption = {
  id: string;
  label: string;
  description?: string;
  tags: string[];
  weight?: number;
};

export type PersonalizationQuestion = {
  id: string;
  title: string;
  subtitle?: string;
  type: "multi_select" | "single_select";
  options: PersonalizationQuestionOption[];
};

export type PersonalizationAnswers = Record<string, string | string[]>;

export const personalizationQuestions: PersonalizationQuestion[] = [
  {
    // 옵션 id가 items.ts의 Category 키와 일치 → user.interests(Category[])로 변환된다.
    id: "interests",
    title: "어떤 걸 누리고 싶어?",
    subtitle: "골라두면 관련 혜택 위주로 추천해줄게 · 복수 선택",
    type: "multi_select",
    options: [
      {
        id: "learning",
        label: "📚 공부·글쓰기",
        description: "첨삭, 학습코칭, 언어교육",
        tags: ["#스터디", "#글쓰기", "#어학학습", "#학습코칭"],
      },
      {
        id: "career",
        label: "💼 취업·진로",
        description: "상담, 자소서, 면접 준비",
        tags: ["#진로탐색", "#취업준비", "#인턴십"],
      },
      {
        id: "sports",
        label: "💪 운동하기",
        description: "헬스장, 수영, 테니스",
        tags: ["#운동", "#체육시설", "#건강관리"],
      },
      {
        id: "welfare",
        label: "🩺 마음 챙기기",
        description: "심리상담, 건강검진",
        tags: ["#심리상담", "#건강관리", "#자기계발"],
      },
      {
        id: "culture",
        label: "🎵 문화·예술",
        description: "공연, 전시, 악기 대관",
        tags: ["#공연참여", "#전시", "#문화행사"],
      },
      {
        id: "experience",
        label: "✈️ 해외·경험",
        description: "교환학생, 봉사, 연수",
        tags: ["#국제교류", "#해외연수", "#글로벌프로그램"],
      },
      {
        id: "facility",
        label: "🏛️ 공간·도서관",
        description: "도서 대출, 열람실",
        tags: ["#도서관", "#학습공간", "#열람실"],
      },
      {
        id: "scholarship",
        label: "💰 장학금",
        description: "추가 장학 신청하기",
        tags: ["#장학금", "#교내장학", "#재정지원"],
      },
    ],
  },
  {
    id: "situation",
    title: "요즘 너의 상황은?",
    subtitle: "지금 시기에 맞는 혜택부터 보여줄게 · 복수 선택",
    type: "multi_select",
    options: [
      {
        id: "freshman",
        label: "새내기 적응 중",
        description: "학교생활에 적응하는 단계",
        tags: ["#새내기", "#대학적응", "#기초교육"],
      },
      {
        id: "major_explore",
        label: "전공·진로 탐색",
        description: "방향을 찾아가는 중",
        tags: ["#진로탐색", "#전공탐색", "#멘토링"],
      },
      {
        id: "job_prep",
        label: "졸업·취업 준비",
        description: "곧 사회로 나갈 준비",
        tags: ["#취업준비", "#자소서", "#면접준비"],
      },
      {
        id: "exchange",
        label: "교환·해외 준비",
        description: "해외로 나갈 계획",
        tags: ["#국제교류", "#해외연수", "#어학학습"],
      },
      {
        id: "vacation",
        label: "방학 알차게",
        description: "쉬는 동안 뭐라도 챙기기",
        tags: ["#방학프로그램", "#단기프로그램", "#인턴십"],
      },
    ],
  },
  {
    // 정렬·추천 강도 신호 (관심 태그 벡터에는 영향 없음 → tags: [])
    id: "time_commitment",
    title: "일주일에 낼 수 있는 시간은?",
    subtitle: "부담 정도에 맞는 활동을 골라줄게",
    type: "single_select",
    options: [
      { id: "one_off", label: "단발성만", description: "한 번에 끝나는 것 위주", tags: [] },
      { id: "sometimes", label: "가끔", description: "여유 있을 때 참여", tags: [] },
      { id: "regular", label: "꾸준히", description: "정기적으로 챙길 수 있어", tags: [] },
    ],
  },
  {
    // 알림·마감 노출 신호 (관심 태그 벡터에는 영향 없음 → tags: [])
    id: "deadline_sensitivity",
    title: "마감 알림은 얼마나 받을래?",
    type: "single_select",
    options: [
      { id: "urgent", label: "임박한 것만", description: "곧 닫히는 것만 콕 집어줘", tags: [] },
      { id: "all", label: "다 보여줘", description: "놓치는 것 없이 전부", tags: [] },
    ],
  },
  {
    id: "activity_style",
    title: "어떤 방식이 제일 좋아?",
    type: "multi_select",
    options: [
      {
        id: "workshop",
        label: "짧은 워크숍",
        description: "부담 없이 듣는 특강/교육",
        tags: ["#워크숍", "#특강수강", "#세미나"],
      },
      {
        id: "mentoring",
        label: "멘토링/상담",
        description: "누군가와 직접 이야기하는 방식",
        tags: ["#멘토링", "#코칭", "#진로상담"],
      },
      {
        id: "project",
        label: "프로젝트형 활동",
        description: "팀 활동, 공모전, 결과물 제작",
        tags: ["#연구프로젝트", "#공모전", "#포트폴리오제작"],
      },
      {
        id: "study",
        label: "학습 지원",
        description: "스터디, 어학, 글쓰기, 학습법",
        tags: ["#스터디", "#어학학습", "#글쓰기"],
      },
    ],
  },
  {
    id: "domain",
    title: "관심 있는 분야가 있어?",
    subtitle: "없으면 건너뛰어도 괜찮아",
    type: "multi_select",
    options: [
      {
        id: "software_ai",
        label: "AI/SW",
        tags: ["#인공지능", "#소프트웨어개발", "#데이터사이언스"],
      },
      {
        id: "business",
        label: "경영/경제",
        tags: ["#경영", "#경제학", "#마케팅"],
      },
      {
        id: "public",
        label: "공공/사회",
        tags: ["#공공정책", "#사회복지", "#NGO활동"],
      },
      {
        id: "media_art",
        label: "미디어/예술",
        tags: ["#콘텐츠기획", "#영상제작", "#그래픽디자인", "#공연참여"],
      },
      {
        id: "bio_health",
        label: "바이오/보건",
        tags: ["#바이오", "#의학", "#헬스케어"],
      },
      {
        id: "engineering",
        label: "공학/제조",
        tags: ["#전자공학", "#기계공학", "#반도체"],
      },
    ],
  },
];
