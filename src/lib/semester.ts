export function getSemesterLabel(year: number, term: 1 | 2): string {
  return `${year} - ${term}학기`;
}

export function getDaysUntilSemesterEnd(year: number, term: 1 | 2): number {
  // 1학기: ~6월 20일 (기말고사 종료), 2학기: ~12월 20일
  const endDate =
    term === 1
      ? new Date(year, 5, 20) // Jun 20
      : new Date(year, 11, 20); // Dec 20
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = endDate.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getCurrentSemester(): { year: number; term: 1 | 2 } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return { year, term: month >= 3 && month <= 8 ? 1 : 2 };
}

export function makeSemesterId(year: number, term: 1 | 2): string {
  return `${year}-${term}`;
}

export function getRecommendText(
  name: string,
  value: number,
  deadlineLabel: string
): string {
  const v = Math.round(value / 10000);
  const deadline =
    deadlineLabel === "상시" ? "상시 신청 가능해" : `${deadlineLabel}까지야`;
  return `${v}만원짜리 ${name}이 ${deadline}. 한 번 해봐.`;
}
