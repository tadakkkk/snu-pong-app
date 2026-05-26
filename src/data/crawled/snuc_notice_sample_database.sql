-- Sample crawl database for Seoul National University College notices.
-- Source page: https://snuc.snu.ac.kr/공지사항/
-- Generated from the public first-page crawl. Body content is stored as excerpts only.

CREATE TABLE snuc_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  crawler_note TEXT NOT NULL
);

CREATE TABLE snuc_crawl_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES snuc_sources(id),
  crawled_at TIMESTAMPTZ NOT NULL,
  visible_article_count INTEGER NOT NULL,
  fetched_article_count INTEGER NOT NULL,
  benefit_draft_count INTEGER NOT NULL
);

CREATE TABLE snuc_raw_articles (
  uid TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES snuc_sources(id),
  crawl_run_id TEXT NOT NULL REFERENCES snuc_crawl_runs(id),
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  board_category TEXT,
  author TEXT,
  published_at DATE,
  views INTEGER,
  project_categories JSONB NOT NULL,
  value_signal TEXT NOT NULL,
  is_benefit_candidate BOOLEAN NOT NULL,
  deadline_hints JSONB NOT NULL,
  outbound_links JSONB NOT NULL,
  body_excerpt TEXT NOT NULL
);

CREATE TABLE snuc_benefit_item_drafts (
  id TEXT PRIMARY KEY,
  raw_article_uid TEXT NOT NULL REFERENCES snuc_raw_articles(uid),
  status TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  source_url TEXT NOT NULL,
  provider TEXT NOT NULL,
  deadline_hints JSONB NOT NULL,
  value_status TEXT NOT NULL,
  value_basis_hint TEXT NOT NULL,
  review_priority TEXT NOT NULL
);

INSERT INTO snuc_sources (id, name, url, source_type, crawler_note) VALUES
  ('snuc_notice_board', '서울대학교 학부대학 공지사항', 'https://snuc.snu.ac.kr/공지사항/', 'public_wordpress_kboard', 'Fetched the first visible notice-list page and then fetched every visible article link on that page.');

INSERT INTO snuc_crawl_runs (id, source_id, crawled_at, visible_article_count, fetched_article_count, benefit_draft_count) VALUES
  ('sample_snuc_notice_2026_05_22', 'snuc_notice_board', '2026-05-22T00:00:00+09:00', 42, 42, 34);

INSERT INTO snuc_raw_articles (
  uid, source_id, crawl_run_id, source_url, title, board_category, author,
  published_at, views, project_categories, value_signal, is_benefit_candidate,
  deadline_hints, outbound_links, body_excerpt
) VALUES
  ('718', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=718', '예비대학 과목별 Q&A 게시판 운영 안내(기프티콘 이벤트)', NULL, 'jsy95', '2026-05-22', 12, '["learning_support"]'::jsonb, 'unknown_or_low', true, '[]'::jsonb, '[]'::jsonb, '예비대학 과목별 페이지에이 운영됩니다.
수강 중 궁금한 점은 언제든지 질문해 주세요! 담당 교수님과 조교님이 직접 답변해 드립니다.
1. 질의응답 운영 기간: 상시 운영
2. 운영 과목: 총 10개의 
[이용 방법]
1. 서울대학교 SNUON(https://etl.snu.ac.kr/snuon) 접속 → 희망하는 과목 신청하기
2. 수강 중인 예비대학 과목 배너 클릭-신청-학습하러 가기
3. https://myetl.snu.ac.kr 접속-과목-게시판-Q&A 게시판 클릭
4. ''글쓰기'' 버튼으로 질문 등록 (비밀글 설정 가능)
과목 콘텐츠에 나오는 개념, 이해가 안되는 부분부터 연습문제 풀이법까지 어떤 질문이든 환영합니다.
개인적인 질문이나 기초적인 질문도 괜찮습니다. 보이고 싶지 않다면 ''비밀글'' 기능을 활용하세요.
질문자는 과목별로 추첨을 통해 해드립니다. 
많은 참여 부탁드립니다. 
관련 문의사항: 02-880-1327(교수학습개발센터)
Q&A 게시판
예비대학 운영 교과목 기초 콘텐츠 (수학, 통계, 물리, 컴퓨팅 A/B, 논리적 사고, 글쓰기와 말하기, 영어, 화학, 생명과학, 예술적 및 디자인적 사고)
기프티콘 지급'),
  ('714', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=714', '(2026 하계계절수업) 학부대학 개설 컴퓨팅 교과목 강의조교(대학원생), 튜터(학부생&대학원생) 모집(~5/29까지)', '학사·장학', '송진경', '2026-05-20', 132, '["learning_support", "career_experience"]'::jsonb, 'direct_money', true, '["5/29까지", "~5/29"]'::jsonb, '[{"label": "https://docs.google.com/forms/d/e/1FAIpQLSe0gUfXFeaz92_beiumazA9XP7yUd417e8JHuV1bYFsZV1lJg/viewform?usp=publish-editor", "url": "https://docs.google.com/forms/d/e/1FAIpQLSe0gUfXFeaz92_beiumazA9XP7yUd417e8JHuV1bYFsZV1lJg/viewform?usp=publish-editor"}]'::jsonb, '서울대학교 학부대학은 학생들이 전공에 상관없이 컴퓨터 소프트웨어와 인공지능 기술을 쉽게 습득할 수 있는 컴퓨팅 관련 교양교과목을 제공하고 있습니다. 이 교과목들은 「학문의 토대」<수학·과학·컴퓨팅> 영역에 개설되며 다루는 주제와 수준에 따라 기초-핵심-응용으로 구성됩니다. 지금까지 개설이 확정된 교과목은 다음과 같습니다.
<컴퓨팅 기초: 처음 만나는 컴퓨팅>: 2020년 2학기부터 개설
<컴퓨팅 기초: 처음 만나는 데이터>: 2025년 1학기부터 개설
<컴퓨팅 핵심: 컴퓨터로 생각하기>: 2021년 1학기부터 개설
<컴퓨팅 핵심: 데이터 중심의 인공지능>: 2025년 1학기부터 개설
<컴퓨팅 탐색: 실생활에서 활용하기>: 2025년 2학기 개설
<컴퓨팅 응용: 기계학습 개념 및 실습>: 2022년 1학기부터 개설
<컴퓨팅 응용: 자연어처리의 기초>: 2022년 2학기부터 개설
<컴퓨팅 응용: 데이터사이언스의 기초>: 2022년 2학기부터 개설
각 교과목은 이론과 실습으로 이루어지며 실습은 강의조교와 튜터의 밀접한 상호작용 하에 진행됩니다. 학부대학에서 2026학년도 하계 계절학기 교양 <컴퓨팅 기초: 처음 만나는 컴퓨팅> 교과목의 ‘강의조교(대학원생)’와 ‘'),
  ('713', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=713', '[교수학습개발센터] ✨슬기로운 대학생활✨을 위한 진단검사 이벤트 참여 안내', '공통교육', '김예인', '2026-05-20', 84, '["learning_support", "career_experience", "welfare_safety"]'::jsonb, 'service_or_experience', true, '[]'::jsonb, '[]'::jsonb, '안녕하세요, 학부대학 학습상담실입니다.
서울대학교 학생들의 자기이해 및 학습역량 향상을 지원하기 위하여
를 아래와 같이 실시하오니 많은 참여 바랍니다.
SNU 핵심역량진단 및 SNU 학습유형검사 참여 이벤트
📌 참여 방법
1. SNU 비교과 홈페이지(https://extra.snu.ac.kr/) 접속 및 로그인
2. 상단 메뉴 중 [역량·학습유형진단]에서 SNU 핵심역량진단/SNU 학습유형검사 모두 실시
3. 결과 화면(본인 이름 확인 가능한 화면) 캡처
4. 구글폼 제출 및 후기 작성(https://forms.gle/XZgk64oiCqJkU7qNA)
📌 참여 대상
서울대학교 학부생 및 대학원생
📌 운영 기간
2026년 5월 18일(월) ~ 6월 30일(화)
※ 모집 인원 마감 시 조기 종료될 수 있음
📌 참여 혜택
진단검사 참여자(선착순 500명): 메가커피 기프티콘 지급
우수 후기 작성자(선정 50명): 커피 기프티콘(1만원) 지급
※ 우수 후기는 향후 홍보 자료로 활용될 수 있음
📞 문의
학부대학 학습상담실
02-880-4027 / yein1029@snu.ac.kr'),
  ('710', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=710', '2026학년도 2학기 국가장학금 1차 신청 안내', '학사·장학', '전현선', '2026-05-20', 97, '["scholarship_finance", "career_experience", "welfare_safety", "international"]'::jsonb, 'direct_money', true, '[]'::jsonb, '[{"label": "www.kosaf.go.kr", "url": "http://www.kosaf.go.kr"}]'::jsonb, '일정을 아래와 같이 안내합니다.
2026
학년도
2
학기 국가장학금
1
차 신청
※ 국가장학금 학자금 지원구간이 교내·외장학금(선한인재·해외수학·맞춤형·근로장학금 등) 장학생 선발에 활용되므로, 필요한 학생은 반드시 신청하시기 바랍니다.
가. 2026. 5. 22.(금) 09:00 ~ 6. 22.(월) 18:00
신청기간
:
나. 2026. 5. 22.(금) 09:00 ~ 2026. 6. 29.(월) 18:00
서류제출 및 가구원 정보제공 동의 기간
:
다. 신청대상: 재학생/신입생(입학예정자 등)/복학생/편입생/재입학생 등
학사과정 학생
※ 이며, 신청기간 미준수 시 재학 중 2회에 한하여 구제 적용됨
재학생은 국가장학금
1
차 신청이 원칙
라. 신청방법: 한국장학재단 홈페이지() 또는 모바일 앱에서 신청 가능
www.kosaf.go.kr
마. 관련문의: 한국장학재단 상담센터 1599-2000
바. 참고사항
- 학자금지원구간 9구간 추천자 및 초과학기생은 학기말(12월 중) 장학금 일괄 지급 예정.
- 학자금지원구간 9구간 추천자 및 초과학기생은 국가장학금 Ⅱ유형 심사 대상이 아님.'),
  ('709', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=709', '2026학년도 2학기 1차 주거안정장학금 안내', '학사·장학', '전현선', '2026-05-20', 75, '["scholarship_finance", "welfare_safety"]'::jsonb, 'direct_money', true, '["2026. 6. 22.(월) 오후 6시까지", "2026. 6. 29.(월) 오후 6시까지"]'::jsonb, '[]'::jsonb, '2026학년도 2학기 1차 주거안정장학금 학생 신청이 아래와 같이 진행됩니다.
가. 선발대상:
원거리 대학에 진학한 학자금지원구간 기초생활수급 또는 차상위 학부 재학생
※ 본교 기준 부모님 주소지가 수도권 외 권역에 있는 경우
나. 신청기간:
2026. 5. 22.(금) 오전 9시 ~ 2026. 6. 22.(월) 오후 6시까지
※ 서류제출 및 가구원동의: 2026. 5. 22.(금) 오전 9시 ~ 2026. 6. 29.(월) 오후 6시까지
다. 신청방법:
한국장학재단 홈페이지(http://www.kosaf.go.kr) 등에서
학생 개별 신청
라. 지원금액:
2026학년도 2학기 정규학기 중 최대 월 20만 원 한도 내 주거관련 실비 지원(9~12월)
마. 결과발표:
2026년 10월 말 한국장학재단 발표 예정
바. 관련문의:
한국장학재단 상담센터 1599-2000'),
  ('708', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=708', '2026. 8. 1.자 학부대학 비전임(객원)교원 채용 공고(~5/27)', '채용', '박주현', '2026-05-20', 86, '["career_experience", "welfare_safety"]'::jsonb, 'unknown_or_low', true, '["~5/27"]'::jsonb, '[{"label": "https://facultyrecruitment.snu.ac.kr", "url": "https://facultyrecruitment.snu.ac.kr/"}]'::jsonb, '※ 자세한 사항은 붙임의 공고문을 참고하시기 바랍니다.
ㅁ 채용분야 및 인원
- 학부대학 전공설계지원센터 객원교원(전공상담-인문사회계열) 3명
- 학부대학 전공설계지원센터 객원교원(전공상담-이공계열) 2명
ㅁ 지원자격
- 박사학위 소지자. 다만,「대학교원 자격기준 등에 관한 규정」제2조에 따른 조교수 이상 자격기준을 갖춘 사람 또는 이에 준하는 해당 분야 경력을 보유한 사람으로서 특수한 교과를 강의하게 하기 위하여 임용하는 사람으로 다음 각 호의 어느 하나에 해당하는 경우에는 예외로 할 수 있음
- 임용예정일 기준 만 65세 이하인 자
- 「서울대학교 교원 인사 규정」 제19조에 해당하는 결격사유가 없는 자
ㅁ 임용(예정)일: 2026. 8. 1. (임용기간: 심사결과에 따라 임용일로부터 1년 이상 3년 이내)
ㅁ 접수기간: 2026. 5. 20.(수) 14:00 ~ 5. 27.(수) 14:00  (한국시간기준)
ㅁ 접수방법: 서울대학교 채용사이트 접속 후 지원서 작성 및 제출 (서류 온라인 업로드)
https://facultyrecruitment.snu.ac.kr'),
  ('705', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=705', '학부대학 명사 초청 특강 - 이종범 작가 강연 안내(6/4 15:30 ~ 17:30)', '행사', '임승연', '2026-05-19', 198, '["event_culture"]'::jsonb, 'service_or_experience', true, '[]'::jsonb, '[]'::jsonb, '안녕하세요, 서울대학교 학부대학 강연 기획단입니다. 저희는 정답을 맞히는 ''해결사''를 넘어 나만의 질문을 던지는 ''개척자''의 삶을 탐구하는 프로젝트 < 세상에 질문을 던지는 자들 >을 진행하고 있습니다. 이번 강연에서는 스토리텔링 전문가 이종범 작가님과 함께, 이야기의 주인공이 가진 속성을 통해 우리 삶의 주체성을 회복하고 자신만의 고유한 서사를 직조하는 방법론을 나누고자 합니다.
[강연 안내]
-(전) 청강문화산업대학 만화콘텐츠스쿨 교수
-(현) SWA(서울웹툰아카데미) 전임멘토
-(현) 연세대학교 이윤재현대문화예술연구원 겸임교수
-(현) JQ코믹스 크리에이티브 총괄디렉터
-네이버 웹툰 <오늘만 사는 기사>, <역대급 영지 설계사>, <닥터, 조선 가다> 등 작품 프로듀싱
○ 강연 주제: 심리학과 스토리텔링으로 보는 주인공성
○ 강연 장소: 서울대학교 220동 203호
자신만의 세계를 깊이 있게 파고들어 이를 타인과 소통하는 이야기로 확장해 오신 작가님의 경험은, 앞으로 각자의 삶에서 주체적인 서사를 써 내려가야 할 학생들에게 매우 현실적이고 명확한 이정표가 될 것입니다. 학생들은 본 강연을 통해 ''나''라는 인물이 삶의 주인공으로서 가져야 할 속성을 이해하'),
  ('704', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=704', '2026학년도 하계 유네스코 한국위원회 인턴십 모집', '학생지원', '심인혜', '2026-05-18', 132, '["scholarship_finance", "career_experience", "welfare_safety", "international"]'::jsonb, 'direct_money', true, '[]'::jsonb, '[]'::jsonb, '서울대학교 학부대학과 유네스코 한국위원회는 업무 협약을 맺고 하계/동계 인턴십을 진행하고 있습니다.
국제기구 활동에 관심을 갖고 있는 학생들의 많은 참여 바랍니다.
✅ 지원 대상 : 학부대학 자유전공학부 및 광역 재학생 (학년/전공 무관, 2026-1학기 등록생)
✅ 지원 기간 : 
     ※ 지원자가 많을 경우 조기마감될 수 있음
✅ 인턴 파견 기관 : 유네스코한국위원회(서울 중구 명동길 26, 유네스코회관)
✅ 실습 기간 : 2026년 7월 1일(수) ~ 8월 28일(금), 주 5일 하루 8시간 풀타임 근무
✅ 선발 인원 : 총 5명 (지원 가능 부서/인턴 업무/요구 역량에 관한 내용은 첨부 파일-하계 연수 인턴- 운영안 파일 참조)
    ※ 본 인턴십은 무급으로 진행되지만, 학부에서 장학금을 지급할 예정(총 300만원/월 150만원)
    ※ 장학금은 인턴십 시작 시점과 인턴십 종료 후 2회에 걸쳐서 지급 예정
    ※ 인턴십을 성실하게 수료했음을 유네스코 측으로부터 확인받지 못한 경우 최초 지급한 장학금 또한 환수됨
    ※ 선발된 학생은 사전교육(1회)에 참여해야하며, 상해 보험(학생 본인부담)에 가입해야 함
✅ 지원 방법 : 자기소개서(첨'),
  ('701', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=701', '[2026. 여름학기] 대학영어 교과목 수강부적격자 1차 (5/13 출석부 기준)', '학사·장학', '권선정', '2026-05-13', 392, '["academic_admin"]'::jsonb, 'unknown_or_low', false, '[]'::jsonb, '[{"label": "https://snuc.snu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?mod=document&uid=99", "url": "https://snuc.snu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?mod=document&uid=99"}]'::jsonb, '* 문의: sjkwon@snu.ac.kr
* 첨부된 명단에 있는 학생들 중 신청한 과목의 수강기준에 맞는 텝스 성적이 있거나 이상한 점이 있는 학생들은 대학영어 사무실로 꼭 문의해서 확인을 받고 수강신청 변경 또는 취소하기 바랍니다. (미처리시 F)
* 2014학번 이후 학생은 텝스 성적이 없는 경우 (개인적으로 취득한 텝스 성적도 없고, 신입생 텝스에도 응시하지 않은 경우) 기초영어, 대학영어 1, 대학영어 2, 고급영어 중 어떤 교과목도 수강할 수 없으니, 텝스 성적이 있는 경우 최대한 빨리 마이스누에 업로드하기 바랍니다.
- 텝스 성적 확인 및 업로드 방법: https://snuc.snu.ac.kr→알림마당→공지사항→“대학영어 수강자격 확인용 텝스 성적 업로드 및 확인 방법 안내"
- 2020학년도 전기 신입생은 예외적으로 2017. 3월 또는 고등학교 입학 이후~2020. 2월 중 응시한 텝스, 토익, 토플 성적 인정 (토익, 토플 성적은 2020. 5. 15.까지 제출한 경우에만 인정)
* 2013학번 이전 학생은 텝스 성적 업로드 불필요
* 신입생 텝스에 응시했거나 이미 등록한 학생은 텝스 성적 업로드 불필요
https://snuc.snu.ac.k'),
  ('700', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=700', '☆ 2026학년도 하계 계절수업 수강료 납부 및 환불 계획 안내', '학사·장학', '황인경', '2026-05-13', 272, '["academic_admin"]'::jsonb, 'unknown_or_low', false, '[]'::jsonb, '[]'::jsonb, '수강료 미납 및 폐강으로 인하여 계절수업을 이수하지 못하는 일이 발생하지 않도록 
****************************************************************
2026학년도 하계 계절수업 수강료 납부 및 환불계획을 아래와 같이 알려드립니다.
첨부 드리는 안내문 꼼꼼히 확인 부탁 드립니다.
가. 수강료(1학점당): 이론과목 40,500원, 실험실습과목 45,500원
나. 납부 및 고지서 출력기간
1) 1차:
2026. 5. 28.(목) ~  6. 2. (화)
2) 2차(최종):
2026. 6. 4.(목) ~ 6. 8.(월)
※ 미납 시 자동 취소되며, 위 기간 이후 추가 수납은 불가합니다.
※ 최종 폐강(수납인원 20명 미만): 2026. 6. 11.(목)
다. 납부방법: 전 은행 및 가상계좌 납부
라. 환불기간 및 환불액
수강 취소 기간
환불 금액
비고
2026. 6. 12.(금) ~ 2026. 6. 22.(월)
수업료 전액 환불
개강 전
2026. 6. 23.(화) ~ 2026. 7. 8.(수)
수업료 3분의 2 환불
수업일수 1/3선
2026. 7. 9.(목) ~ 2026. 7. 15.(수)
수업료 2분의 1 환불
'),
  ('699', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=699', '2026학년도 하계 현장실습(스타트업 인턴십) 안내 및 모집 공고', '학생지원', '심인혜', '2026-05-13', 420, '["scholarship_finance", "career_experience"]'::jsonb, 'direct_money', true, '["~ 6/12", "~ 6/19", "~5/25", "~  9/7", "~    6/5"]'::jsonb, '[{"label": "https://forms.gle/9AvCY46sequYXBXA7", "url": "https://forms.gle/9AvCY46sequYXBXA7"}, {"label": "https://www.miridih.com/ko/o/187147", "url": "https://www.miridih.com/ko/o/187147"}, {"label": "https://maize-gold-038.notion.site/2a1cb64f566b8081b8e1df4924d5bd03", "url": "https://maize-gold-038.notion.site/2a1cb64f566b8081b8e1df4924d5bd03"}, {"label": "https://businesscanvas.notion.site/3578a6dbf8398023a88df399615b5aa4?source=copy_link", "url": "https://businesscanvas.notion.site/3578a6dbf8398023a88df399615b5aa4?source=copy_link"}, {"label": "https://businesscanvas.ninehire.site/job_posting/nYiJLW6w", "url": "https://businesscanvas.ninehire.site/job_posting/nYiJLW6w"}, {"label": "https://businesscanvas.ninehire.site/job_posting/SjRfXfHm", "url": "https://businesscanvas.ninehire.site/job_posting/SjRfXfHm"}, {"label": "https://friendli.ai/", "url": "https://friendli.ai/"}, {"label": "https://friendli.ai/careers", "url": "https://friendli.ai/careers"}]'::jsonb, '스타트업에 관심이 있지만 어떻게 시작해야 될지 모르는 학부대학 학생들을 위해 학부대학에서는 하계/동계 방학 인턴십 프로그램을 지원하고 있습니다. 
1) 관심있는 직무를 현장에서 직접 배우면서 창업가의 멘토링을 가장 가까운 곳에서 받아볼 수 있는 기회를 제공합니다. 
2) 현장실습 인턴십 참가자 중 자유전공학부 학생의 경우에는 자유전공학부 [현장학습] 학점 인정을 받을 수 있습니다. 
※ 현장학습 교과목은 인턴 시기와 수강 시기에 대한 제한도 있고, 사전 수강 승인을 받아야 수강할 수 있는 과목입니다. 공지사항의 현장학습 교과목 관련 공지글을 숙지하시고, 수강신청한 학생만 현장학습 교과목 수강을 통해 학점 인정이 가능합니다. 현장실습 인턴십에 참여했다고 자동으로 현장학습 교과목 수강이 가능한 것이 아님에 주의해주세요.
3) 현장실습 참여 학생들은 근로계약서 상의 최저임금 수준 임금외에, 월 60만원 / 총 120만원의 장학금을 지원 받습니다.
배움의 가장 빠른 길은 현장에 있습니다. 수업에서 이론을 배우고 끝내는 것이 아니라, 현장에서 소중한 경험을 체득하세요. 
⇒ 인턴십을 진행했던 스타트업과 향후 지속적인 관계를 이어나가는 참여자들이 많습니다. 
1) 지원'),
  ('698', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=698', '2026 CAMPUS Asia The ACE Summer Intensive Program 선발 결과', '행사', '김찬미', '2026-05-13', 221, '["international"]'::jsonb, 'unknown_or_low', true, '[]'::jsonb, '[]'::jsonb, '2026 CAMPUS Asia The ACE Summer Intensive Program 참가학생 선발 결과는 다음과 같습니다.
20 우*영
21 현*환
22 김*우
24 모*연
24 박*연
25 민*영
26 전*규
26 박*형
이상입니다.'),
  ('693', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=693', '📚 26-1 < 학부대학 전공박람회(5/18~5/19)> 개최 및 사전 신청안내 📌', '행사', '심인혜', '2026-05-11', 233, '["event_culture", "career_experience"]'::jsonb, 'unknown_or_low', true, '["~5/19"]'::jsonb, '[{"label": "https://docs.google.com/spreadsheets/d/1vl7fwpkU-_wdx0a6xw7ORcfxVNW_OX1-FasY3_YlGVQ/edit?gid=0#gid=0", "url": "https://docs.google.com/spreadsheets/d/1vl7fwpkU-_wdx0a6xw7ORcfxVNW_OX1-FasY3_YlGVQ/edit?gid=0#gid=0"}, {"label": "https://forms.gle/ifkDrCHhs8Gmwf2c9", "url": "https://forms.gle/ifkDrCHhs8Gmwf2c9"}, {"label": "https://docs.google.com/spreadsheets/d/1DHvNIfLbt8rQ16A3epeCSG9hH_LlPedZis-FETWAVVs/edit?usp=sharing", "url": "https://docs.google.com/spreadsheets/d/1DHvNIfLbt8rQ16A3epeCSG9hH_LlPedZis-FETWAVVs/edit?usp=sharing"}]'::jsonb, '📚 26-1 <전공박람회> 개최 및 사전 신청 안내 📌
안녕하세요, 자유전공학부 학생회 <이상> 전공교육국입니다.
다가오는 5/18(월)~5/19(화)에 🎓전공박람회🎓가 개최됩니다! 이에 전공 탐색을 희망하는 학부대학 학생 여러분을 모집합니다.
🗓행사 안내
- 일시 : 2026년 5월 18일 (월) ~ 5월 19일 (화) 18:00~19:40
- 진행 방식 : 총 3타임(각 30분)으로, 타임별 자유롭게 이동 가능
- 장소 : 서울대학교 220동 (대면)
📌전공박람회란?
멘토와 멘티가 220동에서 박람회 형식으로 만나, 전공 진입과 이수에 필요한 정보를 공유하고 교류하는 행사입니다. 타임별로 다양한 전공의 멘토님들과 자유롭게 이야기를 나눌 수 있습니다.
📌어떤 멘토님이 계신가요?
아래 링크를 통해 다양한 전공의 멘토님들을 확인하실 수 있습니다.
🔗멘토 소개 스프레드시트 : 
📌멘티로 어떻게 참여하나요?
구글폼을 통한 사전 예약이 진행되며, 행사 당일 현장 신청 또한 가능합니다! 다만 사전 예약으로 마감되어 현장 신청이 불가능할 수 있으니, 원활한 참여를 위해 사전 신청을 권장드립니다.
✅사전 예약 신청 : 5월 15일 (금) 19:00부터 선착순 진행
🔗사전'),
  ('686', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=686', '2026학년도 학부대학 국내·해외 현장체험 비교과 프로그램 학생 공모 안내 (유형III, 상반기)(~5/24 접수)', '학생지원', '임승연', '2026-05-06', 7265, '["event_culture", "international"]'::jsonb, 'service_or_experience', true, '["5/24 접수", "~5/24"]'::jsonb, '[{"label": "https://extra.snu.ac.kr/", "url": "https://extra.snu.ac.kr/"}]'::jsonb, '2026학년도 학부대학 국내·해외 현장체험 비교과 프로그램 학생 공모 안내 (유형III, 상반기)
○ 서울대학교 학부생 및 석사과정 학생으로 구성된 팀(4인 이상 8인 이내)
※ (주의) 석사과정 학생만으로 구성된 팀은 신청 불가
※ 팀 전원이 재학생 또는 연구생 신분일 것(현장학습 시까지)
※ 팀원의 소속이 3개 단과대학 이상으로 구성된 경우 가점을 부여함
○ 학부대학 핵심역량(도전혁신, 의사소통, 사회공헌, 문제해결) 함양을 목적으로 각 팀은 희망 지역과 주제를 선정하고, 그에 따른 현장체험을 계획 및 실행
※ 지역 선정: 국내/해외 중 희망 지역(외교부 여행경보 2단계 이상 지역은 신청 불가)
※ 주제 예시: AI, 중공업, 패션, 농업, 문화, 예술, 문명 등 자유 주제
※ 단순 취미 활동, 정치·종교 활동, 자격증 취득 목적 활동 등은 선발 제외
※ 팀은 자체적으로 지도교수(교내 전임/비전임 교원) 초빙 가능(선택 사항)
○ 심사 기준: 현장체험 주제 및 계획의 타당성 및 창의성, 현장학습 계획의 구체성 및 실현가능성, 학부대학 핵심역량과의 부합도, 예산 활용 계획의 적절성
○ 지원금액: 최종 선발된 팀 구성원 1인당 최대 4백만원 이내(팀당 최대 '),
  ('685', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=685', 'Guidelines on Taking College English Courses for Exchange Students', '학사·장학', '권선정', '2026-05-04', 377, '["academic_admin"]'::jsonb, 'unknown_or_low', false, '[]'::jsonb, '[{"label": "https://snuc.snu.ac.kr/%EC%88%98%EA%B0%95%ED%8E%B8%EB%9E%8C/", "url": "https://snuc.snu.ac.kr/%EC%88%98%EA%B0%95%ED%8E%B8%EB%9E%8C/"}, {"label": "https://snuc.snu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?mod=document&uid=98#none", "url": "https://snuc.snu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?mod=document&uid=98#none"}]'::jsonb, 'Exchange students may enroll in the following College English Program courses even if they do not have a TEPS score or if their TEPS score does not meet the required level for the course: English Foundations, College English 1, College English 2, and Advanced English.
However, . Any courses taken in violation of this rule will not be eligible for academic credit.
As an exception, students may enroll in multiple courses within the same course category in the following cases:
For further details, please refer to the relevant regulations and FAQs below.
exchange students may not enroll in two or '),
  ('684', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=684', '2026. 9. 1.자 학부대학 비전임(강의)교원 신규채용 공고(~5/20)', '채용', '손미정', '2026-05-04', 444, '["career_experience"]'::jsonb, 'unknown_or_low', true, '["~5/20"]'::jsonb, '[{"label": "https://facultyrecruitment.snu.ac.kr", "url": "https://facultyrecruitment.snu.ac.kr/"}]'::jsonb, '※ 자세한 사항은 붙임의 공고문을 참고하시기 바랍니다.
- 학부대학 교육운영개발센터 강의교원(대학글쓰기 2) 1명
- 박사학위 소지자. 다만,「대학교원 자격기준 등에 관한 규정」제2조에 따른 조교수 이상 자격기준을 갖춘 사람 또는 이에 준하는 해당 분야 경력을 보유한 사람으로서 특수한 교과를 강의하게 하기 위하여 임용하는 사람으로 다음 각 호의 어느 하나에 해당하는 경우에는 예외로 할 수 있음
- 임용예정일 기준 만 65세 이하인 자
- 「서울대학교 교원 인사 규정」 제19조에 해당하는 결격사유가 없는 자
ㅁ 접수기간: 2026. 5. 4.(월) 14:00 ~ 5. 20.(수) 14:00  (한국시간기준)
ㅁ 접수방법: 서울대학교 채용사이트 접속 후 지원서 작성 및 제출 (서류 온라인 업로드)
ㅁ 채용분야 및 인원
ㅁ 지원자격
ㅁ 임용(예정)일: 2026. 9. 1. (임용기간: 심사결과에 따라 임용일로부터 1년 이상 3년 이내)
https://facultyrecruitment.snu.ac.kr'),
  ('676', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=676', '☆ 2026학년도 하계 계절수업 수강신청 안내', '학사·장학', '황인경', '2026-04-24', 2961, '["academic_admin"]'::jsonb, 'unknown_or_low', false, '[]'::jsonb, '[]'::jsonb, '○ 수업기간 : 2026. 6. 23.(화) ~ 2026. 8. 3.(월)
○ 수강신청 일정 
○ 유의사항
- 수강신청 가능학점 : 
- 수강신청 및 재이수 : 
- 졸업예정자 수강신청 : 졸업요건 충족 여부 사전 확인 후 반드시 기간 내 수강신청 완료할 것
- 중복수강신청 : 중복수강신청 전산화(mySNU 학사정보-수업/성적-수업/중복수강신청) 이용할 것
- 정원외신청 및 수강취소 : 반드시 기간 내 완료해야함(기간 이후 변경 불가) 
- 부정행위 : 수강신청 관련 부정행위 적발시 엄중 처벌합니다.
※ 계절수업 등록금 납부 등 자세한 사항은 첨부파일 안내문을 참고해주시기 바랍니다. (특히 붙임 1-1)
※ 참고로, 자유전공학부(전공)는 2023년 여름 계절학기 부터 계절수업을 개설하지 않습니다.
붙임 1-1. 2026학년도 동계 계절수업 수강신청 안내
붙임 1-2. 서울대학교 수강신청 매뉴얼
붙임 1-3. 강의매매방지 수강신청제도 안내
붙임 2. 수강신청 부정행위 관련 안내
※ 개별 과목 수강신청 관련 문의는 해당 과목을 개설하는 학과/전공 사무실에 연락 부탁 드립니다.
※ 첨부파일(붙임) 안내문들 꼭 확인해주세요.
ex. 경제학부 개설 전공 수업 => 경'),
  ('670', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=670', '2026학년도 국가근로장학금 하계방학 집중근로 선발 일정 안내(신청기한: 5/29 18시까지)', '학사·장학', '심인혜', '2026-04-22', 725, '["scholarship_finance", "career_experience"]'::jsonb, 'direct_money', true, '["5/29 18시까지"]'::jsonb, '[]'::jsonb, '가. 하계방학 집중근로 프로그램 개요
• (지원대상)  2026학년도 1학기 국가근로장학금 일반유형을 신청한 학부 재학생
• (근로기간)  2026. 7. 1.(수) ~ 8. 31.(월) ※ 교외근로기관에 따라 상이
• (근로기관)  희망근로지 신청기간에 선택한 교외 근로기관(최대 5개) 중 자동 매칭
• (선발인원)  20명 내외
• (근로시간)  1일 최대 8시간, 주당 최대 40시간 이내
• (장 학 금)  시간당 12,790원
나. 참여방법
1) 국가근로장학금 일반유형 추가신청: 2026. 4. 24.(금) 9시 ~ 5. 13.(수) 18시 ※ 기 신청자는 본 단계 생략
- [붙임 1] 매뉴얼을 참고하여 한국장학재단 홈페이지 또는 모바일로 학생이 직접 신청
※ 2026학년도 1학기 학자금 지원구간은 산정되었으나, 국가근로장학금을 아직 신청하지 않은 학생에 한하여 위 기간에 신청 가능
2) 희망근로지 신청: 2026. 5. 20.(수) 9시 ~ 5. 29.(금) 18시
- 한국장학재단 홈페이지 또는 모바일로 학생이 직접 신청
• [메뉴] > [장학금] > [국가근로장학금] > [근로장학관리] > [희망근로지 신청]
다. 선발일정
1) (재    단) 근'),
  ('648', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=648', '2026학년도 학교 경영자 배상책임 보험 안내', '학생지원', '임승연', '2026-04-02', 529, '["welfare_safety"]'::jsonb, 'risk_or_access_support', true, '[]'::jsonb, '[]'::jsonb, 'ㅁ 서울대학교 학생처(장학복지과)에서는 2026학년도 ''학교 경영자 배상책임 보험''을 가입하였기에 붙임과 같이 알려드립니다. 사고 발생 시 보험 청구를 희망하는 경우 붙임 문서를 확인하여 청구하시기 바랍니다.
가. 보험사: 학교안전공제중앙회
나. 계약기간: 2026. 4. 1.(화) 00:00 ~ 2027. 4. 1.(수) 00:00 (1년)
다. 담보내역 및 보상 한도액
라. 보상범위: [붙임 1] 참고
ㅁ 아울러, 교내·외 치료비 신청 시스템 메뉴가 다음과 같이 오픈되어 기존의 방문 접수 신청 절차가 시스템 신청으로 변경되었음을 안내드립니다.
가. 청구방법: [붙임 2] 안내문에 명시된 제출서류를 모두 구비하여 mySNU 포털로 시스템 신청(방문 접수·대리인 접수·우편접수 불가)
나. 시스템 오픈일: 2026. 4. 1.(수)
다. 접속 경로
○ PC 접속경로: mySNU > 학사정보 > 대학생활 > 교내외치료비 > 신청/확인
○ 모바일(어플) 접속경로: 학사·행정 > 교내외치료비 신청/확인
※ 그 밖에 담보(경영자 배상책임 등) 보험금 청구는 소관 부서(기관) 등에서 장학복지과로 문의
담보위험
구분
대상
인원(명)
보상 한도액(단위:천원)
1인당
1사고'),
  ('636', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=636', '[교수학습개발센터] SNUON 예비대학 기초 콘텐츠 상시 수강 가능', '학생지원', 'jsy95', '2026-03-25', 607, '["learning_support", "event_culture"]'::jsonb, 'service_or_experience', true, '[]'::jsonb, '[]'::jsonb, '서울대학교 2026학년도 신입생 및 재학생 여러분,
입학 후 대학 공부와 연계하여 수강할 수 있는 예비대학 기초 콘텐츠를 안내드립니다.
🎓 예비대학이란?
대학 수업에 필요한 기초 학습 역량을 미리 다질 수 있도록
온라인 콘텐츠(SNUON)와 인트로 특강을 제공하는 프로그램입니다.
📚 개설 과목 (총 10과목)
수학, 통계, 물리, 화학, 생명과학, 컴퓨팅(A/B), 영어, 논리적 사고, 글쓰기와 말하기, 예술적 및 디자인 사고
* 컴퓨팅A: 파이썬 기초 / 컴퓨팅B: 데이터 분석 기초
⏰ 지금 신청하면 이런 점이 좋습니다
✔ 합격 후부터 여름방학까지 상시 학습 가능
✔ 시간·장소 제약 없이 원하는 과목 자유롭게 수강
✔ 대학 수업을 미리 경험하며 학습 부담 완화
🎁 참여 이벤트
수강 후기 이벤트 (선착순 기념품 제공)
📝 신청 방법
SNUON (etl.snu.ac.kr) 접속 후 과목별 신청
💡 수업 막히는 순간, 바로 찾는 기초 강의
여유 있는 지금, 예비대학으로 한발 먼저 시작해보세요.
신입생 여러분의 많은 관심과 참여를 바랍니다.
감사합니다.
⇒
예비대학 기초 콘텐츠 수강 바로 가기
(QR 코드를 스캔하세요!)
문의: 02-880-1327 / jsy95'),
  ('633', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=633', '[학부대학 소속 학생 대상] 2026학년도 언어교육원 외국어 교육비 지원 계획 안내', '학생지원', '임승연', '2026-03-23', 567, '["scholarship_finance"]'::jsonb, 'direct_money', true, '[]'::jsonb, '[]'::jsonb, '❍ 외국어 역량 강화를 통한 국제적인 인재 양성
❍ 외국어 의사소통 능력 향상
❍ 학부대학 소속 학생(자유전공학부, 학부대학 광역) 대상 서울대학교 언어교육원 수강료 지원
 수강료의 80% (연간 개인별 2회 이내)
※ 수강료 할인 내역이 있는 경우 실제 결제된 금액을 기준으로 지원
※ 지원 횟수 제한: 2026학년도(2026. 3월 ~ 2027. 2월) 중 개인별 2회 이내
- 서울대학교 언어교육원 개설강좌 중 에 한해 지원
※ 언어클리닉 등 기타 강좌는 제외
- 출석률 80% 이상
- 타인이 응시‧수강한 내역을 근거로 지원받거나 기타 부정한 방법으로 지원받은 경우, 해당 금액 환수 및 향후 지원 불가
- 여러 학기에 걸쳐 수강하는 경우 이수 완료 시점을 기준으로 해당 학기 신청기간에 신청하며 신청기간 이후 제출 건은 지원하지 아니함
※ 8월에 시작한 강좌가 9월 중에 끝났을 경우, 9월 이후에 80% 출석률을 확인할 수 있으므로 2학기 수강분 신청기간에 신청
- 한 강좌만 지원 대상 [예외적으로 강좌 이수 중간에 학적이 변동되는 경우(‘재학→휴학’ 혹은 ‘휴학→복학’)에는 지원 가능]
※ 수강 후 해당 학기에 졸업한 경우에도 지원 가능
- 타 기관에서 동'),
  ('621', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=621', '2026학년도 2학기 전공선택·결정, 다전공, 학생설계전공 및 심화전공 신청 공고(다전공 신청 일정 수정)', '학사·장학', '이호민', '2026-03-17', 1306, '["welfare_safety"]'::jsonb, 'unknown_or_low', true, '[]'::jsonb, '[]'::jsonb, '을 아래와 같이 공고하니 하여 주시기 바랍니다.
2026학년도 2학기 전공 선택, 결정, 다전공, 학생설계전공 및 심화전공 신청
전공설계지원센터 상담교원 면담 이후 전공 선택, 결정 및 취소를 신청
구 분
일 정
연합전공 신청 기간(학생)
2026. 3. 30.(월) 09:00 ~ 4. 3.(금) 18:00
심화전공 신청 및 취소 신청 기간(학생)
2026. 4. 13.(월) ~ 4. 24.(금) 18:00
주전공 선택 및 취소 신청 기간(학생)
2026. 4. 27.(월) ~ 5. 8.(금) 18:00
부·연계·학생설계전공 신청 기간(학생)
2026. 4. 20.(월) ~ 4. 24.(금) 18:00
전공결정 신청기간(광역 학생)
2026. 5. 11.(월) ~ 5. 22.(금) 18:00
관련 위원회 심의
2026. 6월 말 ~ 7월 초 개최
전공선택·취소, 전공결정, 연합·연계전공 선발, 학생설계전공 및 심화전공 신청 결과 안내
2026. 7. 15(수)
◊ 신청방법: 마이스누 포털 학사행정에서 해당 서류 업로드 및 신청 (붙임 안내문 확인)
붙임 문서를 정독한 뒤 신청할 것.
첨부파일을 제대로 확인하지 않아서 발생하는 문제의 책임은 학생 본인에게 있음'),
  ('584', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=584', '[교수학습개발센터] ★1:1 학습상담☆ 상시 운영 안내', '학생지원', '김예인', '2026-03-05', 1109, '["learning_support", "welfare_safety"]'::jsonb, 'service_or_experience', true, '[]'::jsonb, '[]'::jsonb, '학부대학 교수학습개발센터 학습상담실에서는
학부생 및 대학원생을 대상으로 1:1 맞춤형 학습상담을 상시 운영하고 있습니다.
✔ 공부가 막막할 때
✔ 시간관리가 잘 되지 않을 때
✔ 성적 향상을 위해 점검이 필요할 때
전문 상담자와 함께 현재의 학습 상태를 정리하고 실행 가능한 학습 전략을 구체적으로 설계합니다.
🍀상담 주요 내용
- 학습역량·학습유형·학습전략 검사 및 결과 해석
- 학습 습관 분석 및 맞춤 전략 수립
- 학업 동기 및 학업 불안 관리
- 전공·진로 연계 학습 설계
🍀안내 사항
- 대상: 학부생 및 대학원생
- 운영: 1회기 50분 내외(최대 12회기)
- 신청: 아래 링크 또는 포스터 내 QR 접속 후 신청서 작성 → 상담사 개별 연락을 통해 일정 조율
✨ 학부생: https://forms.gle/zB7fYPzKoAZoSuE98
✨ 대학원생: https://forms.gle/qxiW3wsKT7Zr5t3i9
지금의 공부를 한 번 점검해보고 싶다면 누구나 신청할 수 있습니다.
관심있는 분들의 많은 참여 부탁드립니다.'),
  ('521', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=521', '★ [졸업] 2025학년도 후기(2026년 8월) 예비 졸업 신청 공고', '학사·장학', '이호민', '2026-02-02', 2213, '["academic_admin"]'::jsonb, 'unknown_or_low', false, '["2026. 7. 3.(금)까지"]'::jsonb, '[{"label": "https://forms.gle/JzqDXKjGm8rGFA8T6", "url": "https://forms.gle/JzqDXKjGm8rGFA8T6"}, {"label": "자료실 Archives - 자유전공학부", "url": "https://cls.snu.ac.kr/category/board-151-GN-Edua8aaW-20230622154132/"}, {"label": "공지사항 Archives - SNU", "url": "https://liberaledu.snu.ac.kr/category/board-206-GN-kuf5d0eK-20231023174836/"}]'::jsonb, '우리 학부 2025학년도 후기(2026년 8월) 졸업 신청 일정을 다음과 같이 공고하니 졸업을 희망하는 학생은 붙임의 공고문을 참조하여 신청하여 주시기 바랍니다.
* 참고로, 현재 2025 전기에 대한 졸업사정이 한창 진행중이어서 개별 문의에 대한 답변이 느릴 수 있습니다. 양해 부탁 드립니다.
  2025 후기 졸업신청 예정자들은 가급적 아래의 신청기간을 활용하여 주시기 바랍니다.
** 하단에 졸업논문 제출기한(7.3(금)까지)도 꼭 확인해주세요. 안내사항 숙지하셔서 제출기한 엄수 부탁 드립니다.
   (담당자 1명이 100명 넘는 인원을 담당하고 있습니다...)
=========================================================================================
자세한 사항은 첨부파일의 ''졸업신청공고문'' 참고할 것
  1) 
  2) 위 기간 중 신청자에 한하여 수강신청 변경 기간(3.3.~3.9.) 내 이수학점 검토 결과 확인(이메일 안내)이 가능합니다.
    (구글신청은 공지글 게시후 오픈하니 자유롭게 신청 가능) 
 (*제출형식: hwp)
    ※ 서식은 학번별 상이하므로 파일명을 반드시'),
  ('499', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=499', '2026학년도 시행 공통교육과정 교과목 목록 안내', '공통교육', '김현진', '2026-01-19', 3369, '["academic_admin"]'::jsonb, 'unknown_or_low', false, '[]'::jsonb, '[]'::jsonb, '2026학년도 시행 공통교육과정 교과목 목록 안내
2026학년도 시행 공통교육과정 교과목 목록을 첨부하여 안내드립니다.
○  영역 및 교과목 번호
  * 유의사항: 2025학년도 신설 교과목은 공통교육과정(교양) 전체 학점에 포함되나, 2024학년도 이전 학번은 영역 필수로 인정되지 않음
  ** 예시: 컴퓨팅 기초-처음 만나는 데이터, 컴퓨팅 핵심-데이터 중심의 인공지능, 베리타스 강좌1(일부), 베리타스 실천)
2024학년도 이전
○ 영역 및 교과목 번호
  * 유의사항: 2026학년도 신설 교과목은 공통교육과정(교양) 전체 학점에 포함되나, 2025학년도 이전 학번은 영역 필수로 인정되지 않음
  ** 예시: 인문사회계를 위한 화학, 인문사회계를 위한 우주천문학, 베리타스 강좌1(일부), 베리타스 강좌2, 베리타스 실천(일부)
2025학년도
○ 영역 및 교과목 번호
2026학년도 이후'),
  ('488', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=488', '2026학년도 1학기 한국장학재단 학자금대출 안내[재학생]', '학사·장학', '전현선', '2026-01-08', 2439, '["scholarship_finance"]'::jsonb, 'direct_money', true, '[]'::jsonb, '[]'::jsonb, '에서 실시하는계획을 알려드리니, 희망하는 학생들이 이용할 수 있도록 적극 안내하여 주시기 바랍니다.
가. 한국장학재단 학자금대출 개요
나. 2026학년도 1학기 주요 개선 사항
다. 대출금액 및 일정
한국장학재단
2026
학년도
1
학기 학자금대출
▪일반 상환 학자금대출, 취업 후 상환 학자금대출
▪로서 2026학년도 1학기 또는 인 대학(원)생
※ 학자금 지원구간(소득수준) 산정이 필요한 대출로 
▪한국장학재단 또는 ※ [붙임 2] 참고
▪
▪성적 및 학자금 지원구간 등
(
대출종류
)
(
신청대상
)
대한민국 국적자
본교 재학
입학 예정
조기 신청 필요
(
심사기간 최대
8
주 소요
)
(
신청방법
)
홈페이지
모바일 직접신청
(
대출금리
)
연
1.7%
(
대출자격
)
[
붙임
1]
안내문 등 반드시 확인
■ 
■ 
-(기존) 대출신청자 유형별 최장거치기간 상이 →
취업 후 상환 학자금대출 지원대상 확대 개편
<2026
년 취업 후 상환 학자금대출 지원대상 확대 추진
(
안
)>
구분
학부생
대학원생
’25-2
학기
’26-1
학기
~
’25-2
학기
’26-1
학기
~
등록금(전면확대)
9구간 이하
10구간 이하
4구간 이하
10구간 이하
생활비(선별'),
  ('463', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=463', '★ 2026학년도 1학기 등록, 복학, 재입학 및 휴학 일정 안내', '학사·장학', '이호민', '2025-12-22', 4100, '["international"]'::jsonb, 'unknown_or_low', true, '["2026. 3. 26.(목)까지"]'::jsonb, '[]'::jsonb, '❍ 등록기간 : 
❍ 장소 : 농협은행, 신한은행 및 우리은행 전국 소재 지점
❍ 신청기간 :
❍ 신청방법
- 서울대학교 포털 → 학사정보 → 학적변동(신청) → 휴학·복학
- 수강신청이 복학 신청을 대신하지 않음. 따라서 수강신청을 하였어도 반드시 복학 신청해야 함
❍ 신청기간: 
※ 군 휴학생이 
❍ 군 복학(복귀)생 구비서류 및 검토사항
- 수업일수 4분의 1선 2026. 3. 26.(목)까지 전역자: 병적증명서 또는 전역증 사본 등
- 수업일수 4분의 1선 2026. 3. 26.(목)이후 전역자: 아래표 참고
❍ 신청방법: 학과 사무실에 신청서 
❍ 신청기간: (1차) 
❍ 허가일: 2026. 1. 23.(금)
※ 복적 및 재입학을 허가받은 자는 등록기간 중 반드시 등록을 하여야 하며, 미등록시 복적 및 재입학 포기원서를 제출하여야 함
❍ 신청기간
※ 등록금 분납 중인 자는 완납해야 휴학 가능
※ 등록 후 휴학하고자 하는 학생은 반드시 등록기간에 등록금을 납부한 후 휴학 신청을 해야 함
     (휴학신청 후에는 등록금 고지서 출력 불가)
❍ 신청방법: 서울대학교 포털 → 학사정보 → 학적변동(신청) → 휴학·복학
- 가사휴학 외의 휴학은 증빙서류를 '),
  ('455', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=455', '2026학번 광역 공통교육과정 이수규정 및 권장이수 교과목 목록 공지', '학사·장학', '이호민', '2025-12-16', 3056, '["academic_admin"]'::jsonb, 'unknown_or_low', false, '[]'::jsonb, '[]'::jsonb, '2026학번 광역 학생 대상 공통교육과정 이수규정 및 권장이수 교과목 목록을 공지하오니
2026학번 예비 신입생 분들께서는 참고하여 수강계획을 세워주시기 바랍니다.'),
  ('249', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=249', '★ 학부대학(자유전공학부, 광역) 국외수학 학점인정제도 변경 안내', '학사·장학', '황인경', '2025-07-10', 3582, '["international"]'::jsonb, 'unknown_or_low', true, '[]'::jsonb, '[{"label": "서울대학교 포털", "url": "https://my.snu.ac.kr/p/EM030103?b=2&ls=20&ln=1&px=7&sc=title&sw=%ED%95%99%EC%A0%90&dm=r&p=8341"}]'::jsonb, '교무처에서 국외수학 학점인정 업무 효율성 증대와 학생의 학점인정 신청 편의를 위하여 협정 대학 *을 각 대학에 배포(2025. 6. 16.)
* 서울대학교 대학혁신센터에서 데이터 분석을 진행, 본교와 학점교류 협정을 맺고 있는 223개 외국대학의 졸업학점, 연간 표준 이수학점 등을 비교하여 기준 마련
현 국외수학 학점인정은 15시간의 실 수업시간을 1학점으로, 30시간의 실험·실습 등을 1학점으로 환산하고 있으나(학칙 제74조) 국가 · 대학별 상이한 교육제도 및 학점체계를 온전히 반영하기 어려워, 을 검토하고 적용하기로 심의함
 ※ 2025학년도 제5차 학부대학 학사운영위원회 심의결과(2025. 7. 4.)
○ 적용기준: 교무처 국외수학 학점인정 변환표 가이드라인 ([붙임 1] 참고)
○ 적용대상: 학부대학(자유전공학부, 광역), 자유전공학부 소속 학생
○ 적용시기: 
* 이전 파견학생은 기존 자유전공학부 국외수학 학점인정 기준 적용(실 수업시간을 기준으로 학점 계산)
○ 비학위 과정에서 이수한 교과목의 학점 인정은 불가함
(2023.5. 학사과 안내문 참고 (링크: ))
○ (전공 인정여부) 주전공에서 발급한 ‘전공 인정 확인서’를 제출하는 경우, 주전공'),
  ('99', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=99', '[중요] 대학영어 수강자격 확인용 텝스 성적 업로드 및 확인 방법 안내 (2021. 11. 10.부터 변경)', '학사·장학', '권선정', '2025-03-20', 12863, '["academic_admin"]'::jsonb, 'direct_money', true, '[]'::jsonb, '[]'::jsonb, '*
작성 및 저장 완료 후 반드시 "신청"을 클릭해야 합니다. "신청" 미클릭시 "작성중"으로 분류되어 시스템에서 승인 자체가 되지 않습니다.
* 컴퓨터 (PC)를 사용해야 오류가 나지 않습니다. (핸드폰, 태블릿 등에서는 메뉴가 안 보이거나 오류 발생)
* 아래 내용과 매뉴얼을 자세히 읽어보고 신청해 주세요. 신청이 안 되는 이유는 대체로 매뉴얼대로 하지 않은 경우입니다.
* 텝스 등록 신청한 후 대학영어 사무실에 연락하지 않아도 됩니다. 수시로 신청 내역을 확인하여 승인하며, 잘못 신청한 건은 반려 처리하고 있습니다.
* 신입생의 경우 입학일 (보통 전기: 3월 2일, 후기: 9월 1일) 이후 마이스누 사이트에서 텝스 성적 등록이 가능합니다. 입학일 전에 텝스 성적 등록 메뉴가 안 보이거나 등록이 안 되는 것은 오류가 아니라 입학 전이라서 권한이 부여되지 않았기 때문입니다.
1. 대학영어 수강자격 확인용 텝스 성적 업로드 방법 변경 안내 (2021. 11. 10.부터)
변경 전: 텝스 성적표 스캔본 대학영어 이메일로 제출→대학영어 사무실에서 업로드
변경 후: 마이스누에서 직접 텝스 성적표 스캔본 업로드→대학영어 사무실에서 승인
2. 텝스 성적 업로드 방법'),
  ('98', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=98', '[중요] 기초영어, 대학영어1, 대학영어2, 고급영어 수강신청 FAQ (2026. 4. 14. 업데이트)', '학사·장학', '권선정', '2025-03-20', 12477, '["welfare_safety"]'::jsonb, 'direct_money', true, '[]'::jsonb, '[{"label": "https://snuc.snu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?mod=document&uid=99", "url": "https://snuc.snu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?mod=document&uid=99"}, {"label": "https://sugang.snu.ac.kr", "url": "https://sugang.snu.ac.kr"}, {"label": "https://snuc.snu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?mod=document&keyword=%ED%95%99%EB%B2%88%EB%B3%84&uid=115", "url": "https://snuc.snu.ac.kr/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/?mod=document&keyword=%ED%95%99%EB%B2%88%EB%B3%84&uid=115"}]'::jsonb, '<대학영어 1>의 경우 신입생 수강신청기간까지 재학생은 신청할 수 없습니다. (예비수강신청도 불가능)
수강신청 변경기간에는 전체 학생 수강신청 가능하므로 재학생들은 수강신청 변경기간에 신청하기 바랍니다.
<대학영어 1>의 경우 예비수강신청기간 및 수강신청 4일차까지는 1학년만 신청 가능합니다.
수강신청 5, 6일차 및 수강신청 변경기간에는 전체 학생 수강신청 가능하므로 2학년 이상 학생들은 수강신청 5일차부터 수강신청을 하기 바랍니다.
수강신청 제한이 없으므로 예비 수강신청기간, 수강신청기간, 수강신청 변경기간에 전체 학생 신청 가능
1. <
대학영어 1> 수강신청 (예비수강신청)이 왜 안 되나요?
* 1학기:
* 2학기:
* 여름/겨울계절학기:
2. 텝스 성적이 없어도 수강신청이 되나요?
수강신청 시스템과 텝스 성적 정보가 연동되어 있지 않으므로 텝스 성적이 없어도 수강신청은 가능하나, 수강신청에 성공했더라도 신청한 과목의 수강 기준에 맞는 텝스 성적이 마이스누에 등록되어 있지 않으면 해당 과목을 수강할 수 없습니다.
* 2014학번 이후 학생들은 마이스누에 등록된 텝스 성적이 없으면 대학영어 교과목 (기초영어, 대학영어 1, 대학영어 2, 고급영어) 중 '),
  ('63', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=63', '[2025학년도 1학기] 출판물 불법복제 예방 안내', '기타', '박은미', '2025-02-19', 2955, '["academic_admin"]'::jsonb, 'unknown_or_low', false, '[]'::jsonb, '[]'::jsonb, '문화체육관광부에서는 출판물 불법복제 근절을 위하여 지속적으로 홍보 및 단속을 시행하고 있습니다.
2025학년도 1학기 개강을 맞이하여
「출판물 불법복제 예방활동」
을 실시할 예정임을 알려왔으니, 저작권법 위반 사례가 발생하지 않도록 다음과 같이 협조하여 주시기 바랍니다.
저작권자의 허락없이 도서를 복제(복사, 스캔, PDF파일 공유 등)하는 행위는 저작권 위반입니다.
학과 내에서 불법복제물을 공유하거나 학생들에게 일괄 배부하지 않도록 해 주시기 바랍니다.
자세한 내용은 첨부한 파일 참조 부탁 드립니다.'),
  ('722', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=722', '장애학생 지원 길라잡이 안내', '학생지원', '임승연', '2026-05-22', 6, '["welfare_safety"]'::jsonb, 'risk_or_access_support', true, '[]'::jsonb, '[]'::jsonb, '서울대학교 장애학생지원센터 발간 - 장애학생 지원 길라잡이(학생용): 첨부파일 확인하시기 바랍니다.'),
  ('721', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=721', 'AI 시대, 인간을 그리다. GRAY : 불확실성 앞에서', '기타', '임승연', '2026-05-22', 8, '["academic_admin"]'::jsonb, 'service_or_experience', true, '[]'::jsonb, '[{"label": "https://docs.google.com/forms/d/e/1FAIpQLSdu23NkP04XwPXWQxlFM21WxxErdDChlfiuMBj9Qjn5SC6v6Q/viewform?usp=header", "url": "https://docs.google.com/forms/d/e/1FAIpQLSdu23NkP04XwPXWQxlFM21WxxErdDChlfiuMBj9Qjn5SC6v6Q/viewform?usp=header"}]'::jsonb, '#서울대 빅데이터혁신융합대학사업단, #비교과프로그램, #즉흥공감극장
AI가 점점 더 많은 것을 잘하게 되는 지금,
우리는 이런 질문을 마주 합니다.
"앞으로 나는 무엇을 해야 할까?"
"내 역할은 어떻게 바뀔까?"
기대와 동시에 막연한 불안도 커지는 시기,
잠시 멈추고
사람을 돌아보는 시간에 초대합니다.
즉흥공감극장은
관객의 이야기를 바탕으로
그 순간, 연극으로 다시 펼쳐보는 참여형 예술 프로그램입니다.
AI 시대, 불확실성 앞에 놓인
나의 이야기가 무대가 되고,
우리의 이야기를 통해 새로운 시선을 만날 수 있는 자리가 될 것입니다.
- 대상 : 서울대학교 구성원 누구나(학부생, 대학원생, 교직원, 교수 등)
- 인원 : 회차당 선착순 80명(선정자 개별 문자 안내)
- 신청 링크 :
- 장소 : 서울대학교 인문소극장
- 일정 : 2026.05.27(수) 14:00 , 2026.05.28(목) 14:00 / 19:00
- 문의 : adrtree@snu.ac.kr / 송현성 / 빅데이터혁신융합대학사업단
https://docs.google.com/forms/d/e/1FAIpQLSdu23NkP04XwPXWQxlFM21WxxErdDChlfiuMBj9Qjn5SC6v6'),
  ('720', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=720', '서울대학교 개교 80주년 축하영상 공모전 개최 안내', '기타', '임승연', '2026-05-22', 9, '["event_culture"]'::jsonb, 'unknown_or_low', true, '[]'::jsonb, '[]'::jsonb, '2026년 서울대학교 개교 80주년을 맞이하여 아래와 같이 ''서울대학교 개교 80주년 축하영상 공모전''을 개최합니다.
가. 주제: 서울대학교 개교 80주년 축하 메시지
나. 참여 대상: 서울대학교 전 구성원 및 동문
다. 출품 규격: 5~20초 분량의 가로형(16:9) 영상
라. 일정: (접수) 2026. 5. 20.(수) ~ 2026. 6. 30.(화)
(결과 발표) 2026. 7월 중
마. 시상: 최우수상(1명/팀) 100만원, 우수상-아이디어 부문(10명/팀) 각 20만원, 우수상-팀워크 부문(10팀) 각 20만원, 장려상(80명/팀) 각 1만원
바. 문의: 기획처 소통팀(02-880-2555)
사. 참여 링크: https://www.snu.ac.kr/80th-anniversary/contest'),
  ('719', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=719', '[국가미래전략원]「AI 공존 사회」발표회 안내', '기타', '임승연', '2026-05-22', 8, '["event_culture"]'::jsonb, 'unknown_or_low', true, '[]'::jsonb, '[]'::jsonb, ''),
  ('715', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=715', '융합과학기술대학원 2026학년도 하계 융합연구프로그램 안내', '기타', '임승연', '2026-05-21', 50, '["career_experience"]'::jsonb, 'service_or_experience', true, '[]'::jsonb, '[]'::jsonb, '융합과학기술대학원에서는 학부생들에게 다양한 융합연구의 기회를 제공하기 위해 방학 기간 중 「융합연구프로그램」을 운영하고 있습니다.
관련 분야 진학이나 취업, 연구 등에 관심 있는 우수한 학생들의 많은 지원 바랍니다.
가. 자격요건: 학부 4학기 이상 재학생 또는 학부 수료·졸업(예정)자
나. 모집분야: 응용바이오공학과, 지능정보융합학과, 분자의학및바이오제약학과 소속 19개 연구실
▶ 참여 연구실 상세 모집공고 https://docs.google.com/spreadsheets/d/1Ip0gFpmjjQ35_YdH2Ngptjj96VxJR7bPMEkvePcpWk4/edit?usp=sharing
다. 접수기간: 2026. 5. 18.(월) ~ 5. 25.(월) * 기한 엄수
라. 합격발표: 2026년 6월 중순 예정
마. 참여기간: 2026. 7. 1.(수) ~ 8. 28.(금) * 공휴일 및 주말 제외
바. 문 의: 융합과학기술대학원 교학행정실(☎031-888-9153) 및 각 연구실 담당자
사. 기 타: 융합연구프로그램 참여학생 모집 공고(https://convergence.snu.ac.kr/21669/)'),
  ('712', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=712', '[학부대학&아시아연구소] ''아시아지역 탐구'' 과정 참가자 모집(공지 내용 추가)', '기타', '임승연', '2026-05-20', 457, '["career_experience", "international"]'::jsonb, 'service_or_experience', true, '["~8/16"]'::jsonb, '[{"label": "2020asiaproject@gmail.com", "url": "mailto:2020asiaproject@gmail.com"}]'::jsonb, '자아-진로 발견 해외 현장체험 프로그램
서울대학교 학부대학과 아시아연구소는 미래의 아시아전문가를 양성하는 교육프로그램의 일환으로 과정을 개설합니다. 이 과정은 다양한 교육과 훈련을 통해 프로그램 참가자가 아시아를 이해하는 우수한 인재로 성장할 수 있도록 하는 것을 목표로 합니다. 프로그램에서는 아시아의 다양한 지역에 대한 개괄적인 이해와 아시아의 환경, 기술, 문화/한류, 보건의료 등에 관한 전문가의 강의가 제공됩니다. 이와 함께 아시아 지역으로의 해외 현지조사를 지원하여 사고력과 실천력을 겸비한 문제해결형 인재를 양성하고자 합니다.
○ 주관 기관: 서울대학교 학부대학, 서울대학교 아시아연구소
: 2026년 6월 19일 ~ 2026년 12월 4일(약 6개월)
: 15명 내외
가. 아시아지역과 현안에 관심이 있는 서울대학교 학부 재학생 (전공 무관)
나. 매주 금요일 오후 서울대 아시아연구소에서 진행하는 오프라인 수업 참여 가능한 자
다. 매주 금요일 오전 현지조사 팀별 오프라인 모임 참여 가능한 자
가. 아시아 지역 해외현지조사 참가비용 전액 지원
나. 희망자에 한하여 아시아연구소 각 지역 센터 및 프로그램 활동 참여 가능
다 수료증 발급 및 활동 우수자 선'),
  ('711', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=711', '2026년도 일본 정부(문부과학성) 장학금 연구유학생 및 일한공동고등교육 유학생 교류사업(석사·박사학위 과정) 선발 안내', '학사·장학', '전현선', '2026-05-20', 60, '["scholarship_finance", "career_experience", "international"]'::jsonb, 'direct_money', true, '[]'::jsonb, '[{"label": "주한일본대사관 홈페이지 공지사항", "url": "https://www.kr.emb-japan.go.jp/itprtop_ko/index.html"}]'::jsonb, '2027년도 일본 정부(문부과학성) 장학금 연구유학생 및 일한공동고등교육 유학생 교류사업 (석사·박사학위 과정) 선발을 주한일본대사관 공보문화원의 요청에 따라 안내드립니다.
1. 지원자격 및 선발규모
가) 연령: 1992년 4월 2일 이후 출생한 대한민국 국적 소지자
나) 학력: 일본의 대학 졸업 또는 졸업예정자와 동등한 자격을 가진 자 등
다) 인원: 미정(2025년도 : 이공계 분야 14명, 그 외 분야 21명 선발)
2.
장학내용
가) 기간: 원칙적으로 2027년 4월부터 2년간이며, 10월(또는 9월)부터는 1년 6개월간(※단, 상위과정 진학 시 연장 가능)
나) 장학금: 학비 및 항공요금 지급 외에 매월 약 143,000엔(모집요강 참조) 지급 등
온라인으로 접수 번호 신청(2026.5.25. 16:00까지) 후 필기시험 등록
3. 지원방법:
등 지원관련 세부사항은 반드시 별첨 모집요강 및 참조
4. 제출서류 및 선발절차
주한일본대사관 홈페이지 공지사항
주한일본대사관 공보문화원
5. 문의처:
(전화 02-765-3011/3 <내선 145>, 이메일: yuhak@so.mofa.go.jp)'),
  ('707', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=707', '학부대학 피어튜터링 초청 특강-고호관 작가, 안형준 박사 강연 안내(5/22 18:00-20:00)', '기타', '임승연', '2026-05-20', 37, '["learning_support", "event_culture"]'::jsonb, 'service_or_experience', true, '[]'::jsonb, '[]'::jsonb, '글쓰기 피어튜터링 프로그램에서는 학생들과 튜터들의 글쓰기 역량 강화를 위해 명사 초청 특강을 준비하였습니다. 대학 글쓰기의 경계를 넘어 스토리텔링 기법과 공공 분야의 연구 제안서 실무 전략에 대해 배워가는 시간을 갖고자 합니다.
◯ 강연 주제: 경계를 넘는 글쓰기 - 스토리텔링 기법과 공공 연구 제안서 실무 전략
◯ 강연 일시: 2026년 5월 22일 금요일 ｜ 18:00 ~ 20:00
◯ 강연 장소: 서울대학교 61동 320호
◯ 강연 안내
1. 고호관 작가, 글쓰기와 스토리텔링: 정보 전달에서 대중적 서사로
인문, 사회, 이공계를 망라하는 학술적 소재를 발굴하여 독자가 깊이 공감할 수 있는 서사로 재구성하는 스토리텔링의 프로세스를 다룰 예쩡. 학문적 엄밀성과 대중적 흥미를 균형 있게 결합하는 융합적 작법에 관해 설명할 예정
2. 안형준 박사, 글 잘 쓰는 과학기술자: 설득력 있는 연구 제안서 쓰기
정부·공공기관 대상 제안서와 국가 사업 계획서에서 심사위원 및 평가자를 설득할 수 있는 정교한 논리 구조를 설명할 예쩡. 거시적 국가 과학기술 정책의 맥락을 가독성 높은 공적 문서로 구현해 내는 학술적 필치와 정교한 서술 방법론을 제시할 예정
◯ 강연자 소개
●'),
  ('706', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=706', '2026학년도 학부대학 연구실 탐방(전공분야 소개) 프로그램 참여 신청(황지수 교수님)', '기타', '임승연', '2026-05-19', 502, '["career_experience"]'::jsonb, 'service_or_experience', true, '[]'::jsonb, '[{"label": "https://cls.snu.ac.kr/snu__professor/%ed%99%a9%ec%a7%80%ec%88%98/", "url": "https://cls.snu.ac.kr/snu__professor/%ed%99%a9%ec%a7%80%ec%88%98/"}, {"label": "https://forms.gle/zZG96PL2mAWYkWny5", "url": "https://forms.gle/zZG96PL2mAWYkWny5"}]'::jsonb, '[연구실 탐방 프로그램 안내]
ㅇ 학부대학 학생을 대상으로 한 전공 및 진로 탐색 지원 프로그램
ㅇ 학부대학 황지수 교수님
- 연구분야: 응용미시경제학(노동경제학, 인구경제학)
-
https://cls.snu.ac.kr/snu__professor/%ed%99%a9%ec%a7%80%ec%88%98/
ㅇ 프로그램 구성: 연구 분야 소개 및 경제학 전공 진로 질의응답
ㅇ 일시: 2026. 6. 4.(목) 12:30~1:30 (1시간)
ㅇ 장소: 220동 201호
참여 신청 링크:
https://forms.gle/zZG96PL2mAWYkWny5
* 강의실 수용 인원 상 선착순 마감될 수 있음
(5월 6일~5월 11일에 진행된 사전 모집에 황지수 교수님 연구실 희망한 학생들 우선 접수함)
* 사전 모집 신청하였으나 구글 폼 마감된 경우 별도 문의 forest3308@snu.ac.kr
* 참고: , 통보 없이 불참 시 이후 학부대학 비교과 프로그램 참여에 불이익이 있을 수 있으며 불참하게 되는 경우
참석자에게 햄버거&콜라 제공 예정
프로그램 진행 전까지 구글 폼으로 불참 여부 제출 또는 담당자 연락 forest3308@snu.ac.kr
* 6월 1일 이후 신청자는 식사'),
  ('703', 'snuc_notice_board', 'sample_snuc_notice_2026_05_22', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=703', '2027년도 일본 정부(문부과학성) 장학금 연구유학생 및 일한공동고등교육 유학생 교류사업(석사·박사학위 과정) 선발 안내', '기타', '임승연', '2026-05-18', 60, '["scholarship_finance", "career_experience", "international"]'::jsonb, 'direct_money', true, '[]'::jsonb, '[]'::jsonb, '2027년도 일본 정부(문부과학성) 장학금 연구유학생 및 일한공동고등교육 유학생 교류사업 (석사·박사학위 과정) 선발을 아래와 같이 안내드립니다.
ㅇ 지원자격 및 선발규모
가) 연령: 1992년 4월 2일 이후 출생한 대한민국 국적 소지자
나) 학력: 일본의 대학 졸업 또는 졸업예정자와 동등한 자격을 가진 자 등
다) 인원: 미정(2025년도 : 이공계 분야 14명, 그 외 분야 21명 선발)
ㅇ 장학내용
가) 기간: 원칙적으로 2027년 4월부터 2년간이며, 10월(또는 9월)부터는 1년 6개월간
(※단, 상위과정 진학 시 연장 가능)
나) 장학금: 학비 및 항공요금 지급 외에 매월 약 143,000엔(모집요강 참조) 지급 등
ㅇ 지원방법: 온라인으로 접수 번호 신청(2026.5.25. 16:00까지) 후 필기시험 등록
ㅇ 제출서류 및 선발절차 등 지원관련 세부사항은 반드시 별첨 모집요강 및 주한일본대사관 홈페이지 공지사항( https://www.kr.emb-japan.go.jp/itprtop_ko/index.html ) 참조
ㅇ 문의처: 주한일본대사관 공보문화원 (전화 02-765-3011/3 <내선 145>, 이메일: yuhak@so.mofa.go.jp');

INSERT INTO snuc_benefit_item_drafts (
  id, raw_article_uid, status, name, category, source_url, provider,
  deadline_hints, value_status, value_basis_hint, review_priority
) VALUES
  ('snuc_notice_718', '718', 'needs_review', '예비대학 과목별 Q&A 게시판 운영 안내(기프티콘 이벤트)', 'learning', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=718', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'medium'),
  ('snuc_notice_714', '714', 'needs_review', '(2026 하계계절수업) 학부대학 개설 컴퓨팅 교과목 강의조교(대학원생), 튜터(학부생&대학원생) 모집(~5/29까지)', 'learning', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=714', '서울대학교 학부대학', '["5/29까지", "~5/29"]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_713', '713', 'needs_review', '[교수학습개발센터] ✨슬기로운 대학생활✨을 위한 진단검사 이벤트 참여 안내', 'learning', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=713', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'medium'),
  ('snuc_notice_710', '710', 'needs_review', '2026학년도 2학기 국가장학금 1차 신청 안내', 'scholarship', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=710', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_709', '709', 'needs_review', '2026학년도 2학기 1차 주거안정장학금 안내', 'scholarship', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=709', '서울대학교 학부대학', '["2026. 6. 22.(월) 오후 6시까지", "2026. 6. 29.(월) 오후 6시까지"]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_708', '708', 'needs_review', '2026. 8. 1.자 학부대학 비전임(객원)교원 채용 공고(~5/27)', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=708', '서울대학교 학부대학', '["~5/27"]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'high'),
  ('snuc_notice_705', '705', 'needs_review', '학부대학 명사 초청 특강 - 이종범 작가 강연 안내(6/4 15:30 ~ 17:30)', 'culture', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=705', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'medium'),
  ('snuc_notice_704', '704', 'needs_review', '2026학년도 하계 유네스코 한국위원회 인턴십 모집', 'scholarship', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=704', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_699', '699', 'needs_review', '2026학년도 하계 현장실습(스타트업 인턴십) 안내 및 모집 공고', 'scholarship', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=699', '서울대학교 학부대학', '["~ 6/12", "~ 6/19", "~5/25", "~  9/7", "~    6/5"]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_698', '698', 'needs_review', '2026 CAMPUS Asia The ACE Summer Intensive Program 선발 결과', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=698', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'medium'),
  ('snuc_notice_693', '693', 'needs_review', '📚 26-1 < 학부대학 전공박람회(5/18~5/19)> 개최 및 사전 신청안내 📌', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=693', '서울대학교 학부대학', '["~5/19"]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'high'),
  ('snuc_notice_686', '686', 'needs_review', '2026학년도 학부대학 국내·해외 현장체험 비교과 프로그램 학생 공모 안내 (유형III, 상반기)(~5/24 접수)', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=686', '서울대학교 학부대학', '["5/24 접수", "~5/24"]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'high'),
  ('snuc_notice_684', '684', 'needs_review', '2026. 9. 1.자 학부대학 비전임(강의)교원 신규채용 공고(~5/20)', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=684', '서울대학교 학부대학', '["~5/20"]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'high'),
  ('snuc_notice_670', '670', 'needs_review', '2026학년도 국가근로장학금 하계방학 집중근로 선발 일정 안내(신청기한: 5/29 18시까지)', 'scholarship', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=670', '서울대학교 학부대학', '["5/29 18시까지"]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_648', '648', 'needs_review', '2026학년도 학교 경영자 배상책임 보험 안내', 'welfare', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=648', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains welfare/access/risk-support signal; should be reviewed for student benefit value.', 'medium'),
  ('snuc_notice_636', '636', 'needs_review', '[교수학습개발센터] SNUON 예비대학 기초 콘텐츠 상시 수강 가능', 'learning', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=636', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'medium'),
  ('snuc_notice_633', '633', 'needs_review', '[학부대학 소속 학생 대상] 2026학년도 언어교육원 외국어 교육비 지원 계획 안내', 'scholarship', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=633', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_621', '621', 'needs_review', '2026학년도 2학기 전공선택·결정, 다전공, 학생설계전공 및 심화전공 신청 공고(다전공 신청 일정 수정)', 'welfare', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=621', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'medium'),
  ('snuc_notice_584', '584', 'needs_review', '[교수학습개발센터] ★1:1 학습상담☆ 상시 운영 안내', 'learning', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=584', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'medium'),
  ('snuc_notice_488', '488', 'needs_review', '2026학년도 1학기 한국장학재단 학자금대출 안내[재학생]', 'scholarship', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=488', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_463', '463', 'needs_review', '★ 2026학년도 1학기 등록, 복학, 재입학 및 휴학 일정 안내', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=463', '서울대학교 학부대학', '["2026. 3. 26.(목)까지"]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'high'),
  ('snuc_notice_249', '249', 'needs_review', '★ 학부대학(자유전공학부, 광역) 국외수학 학점인정제도 변경 안내', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=249', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'medium'),
  ('snuc_notice_99', '99', 'needs_review', '[중요] 대학영어 수강자격 확인용 텝스 성적 업로드 및 확인 방법 안내 (2021. 11. 10.부터 변경)', 'other', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=99', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_98', '98', 'needs_review', '[중요] 기초영어, 대학영어1, 대학영어2, 고급영어 수강신청 FAQ (2026. 4. 14. 업데이트)', 'welfare', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=98', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_722', '722', 'needs_review', '장애학생 지원 길라잡이 안내', 'welfare', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=722', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains welfare/access/risk-support signal; should be reviewed for student benefit value.', 'medium'),
  ('snuc_notice_721', '721', 'needs_review', 'AI 시대, 인간을 그리다. GRAY : 불확실성 앞에서', 'other', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=721', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'medium'),
  ('snuc_notice_720', '720', 'needs_review', '서울대학교 개교 80주년 축하영상 공모전 개최 안내', 'culture', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=720', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'medium'),
  ('snuc_notice_719', '719', 'needs_review', '[국가미래전략원]「AI 공존 사회」발표회 안내', 'culture', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=719', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Low-confidence project fit; keep as raw article only unless manual review finds a benefit.', 'medium'),
  ('snuc_notice_715', '715', 'needs_review', '융합과학기술대학원 2026학년도 하계 융합연구프로그램 안내', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=715', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'medium'),
  ('snuc_notice_712', '712', 'needs_review', '[학부대학&아시아연구소] ''아시아지역 탐구'' 과정 참가자 모집(공지 내용 추가)', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=712', '서울대학교 학부대학', '["~8/16"]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'high'),
  ('snuc_notice_711', '711', 'needs_review', '2026년도 일본 정부(문부과학성) 장학금 연구유학생 및 일한공동고등교육 유학생 교류사업(석사·박사학위 과정) 선발 안내', 'scholarship', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=711', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high'),
  ('snuc_notice_707', '707', 'needs_review', '학부대학 피어튜터링 초청 특강-고호관 작가, 안형준 박사 강연 안내(5/22 18:00-20:00)', 'learning', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=707', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'medium'),
  ('snuc_notice_706', '706', 'needs_review', '2026학년도 학부대학 연구실 탐방(전공분야 소개) 프로그램 참여 신청(황지수 교수님)', 'experience', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=706', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains program/service/event/experience signal; should be reviewed for private-market value estimate.', 'medium'),
  ('snuc_notice_703', '703', 'needs_review', '2027년도 일본 정부(문부과학성) 장학금 연구유학생 및 일한공동고등교육 유학생 교류사업(석사·박사학위 과정) 선발 안내', 'scholarship', 'https://snuc.snu.ac.kr/공지사항/?mod=document&uid=703', '서울대학교 학부대학', '[]'::jsonb, 'needs_estimation', 'Contains money/scholarship/work/education-fee support signal; should be reviewed for direct KRW value.', 'high');
