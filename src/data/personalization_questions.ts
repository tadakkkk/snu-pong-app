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
    id: "goal",
    title: "이번 학기에 뭘 더 챙기고 싶어?",
    subtitle: "복수 선택할 수 있어",
    type: "multi_select",
    options: [
      {
        id: "career",
        label: "진로/취업",
        description: "인턴, 상담, 직무 경험",
        tags: ["#진로탐색", "#취업준비", "#인턴십", "#커리어코칭"],
      },
      {
        id: "research",
        label: "연구 경험",
        description: "학부연구, 랩인턴, 학술활동",
        tags: ["#학부연구", "#연구프로젝트", "#랩인턴", "#학술대회"],
      },
      {
        id: "global",
        label: "해외/교류",
        description: "교환, 해외연수, 국제 프로그램",
        tags: ["#국제교류", "#해외연수", "#글로벌프로그램", "#교환학생"],
      },
      {
        id: "wellbeing",
        label: "상담/건강",
        description: "심리, 건강, 생활 지원",
        tags: ["#심리상담", "#건강관리", "#자기계발"],
      },
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
        tags: ["#스터디", "#어학학습", "#글쓰기", "#학습법코칭"],
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
        tags: ["#경영", "#경제학", "#마케팅", "#금융"],
      },
      {
        id: "public",
        label: "공공/사회",
        tags: ["#공공정책", "#사회복지", "#NGO활동", "#국제개발협력"],
      },
      {
        id: "media_art",
        label: "미디어/예술",
        tags: ["#콘텐츠기획", "#영상제작", "#그래픽디자인", "#공연참여"],
      },
      {
        id: "bio_health",
        label: "바이오/보건",
        tags: ["#바이오", "#의학", "#헬스케어", "#간호보건"],
      },
      {
        id: "engineering",
        label: "공학/제조",
        tags: ["#전자공학", "#기계공학", "#반도체", "#로봇공학"],
      },
    ],
  },
];
