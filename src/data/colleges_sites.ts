// URL 일부 추정값 포함. 향후 검증 필요.
export interface CollegeSite {
  id: string;
  name: string;
  url: string;
  description: string;
}

export const collegeSites: CollegeSite[] = [
  { id: "humanities", name: "인문대학", url: "https://humanities.snu.ac.kr", description: "공지·학사·장학" },
  { id: "social", name: "사회과학대학", url: "https://social.snu.ac.kr", description: "공지·학사·장학" },
  { id: "natural", name: "자연과학대학", url: "https://science.snu.ac.kr", description: "공지·학사·장학" },
  { id: "nursing", name: "간호대학", url: "https://nursing.snu.ac.kr", description: "공지·학사·장학" },
  { id: "business", name: "경영대학", url: "https://cba.snu.ac.kr", description: "공지·학사·장학" },
  { id: "engineering", name: "공과대학", url: "https://eng.snu.ac.kr", description: "공지·학사·장학" },
  { id: "agriculture", name: "농업생명과학대학", url: "https://cals.snu.ac.kr", description: "공지·학사·장학" },
  { id: "fine_arts", name: "미술대학", url: "https://art.snu.ac.kr", description: "공지·학사·장학" },
  { id: "education", name: "사범대학", url: "https://edu.snu.ac.kr", description: "공지·학사·장학" },
  { id: "human_ecology", name: "생활과학대학", url: "https://che.snu.ac.kr", description: "공지·학사·장학" },
  { id: "vet", name: "수의과대학", url: "https://vet.snu.ac.kr", description: "공지·학사·장학" },
  { id: "pharmacy", name: "약학대학", url: "https://pharm.snu.ac.kr", description: "공지·학사·장학" },
  { id: "music", name: "음악대학", url: "https://music.snu.ac.kr", description: "공지·학사·장학" },
  { id: "medicine", name: "의과대학", url: "https://medicine.snu.ac.kr", description: "공지·학사·장학" },
  { id: "liberal_studies", name: "자유전공학부", url: "https://cls.snu.ac.kr", description: "공지·학사·장학" },
  { id: "advanced_convergence", name: "첨단융합학부", url: "https://acs.snu.ac.kr", description: "공지·학사·장학" },
];
