export function getSemesterLabel(year: number, term: 1 | 2): string {
  return `${year} - ${term}학기`;
}

export function getDaysUntilSemesterEnd(year: number, term: 1 | 2): number {
  // 1학기: ~8월 31일, 2학기: ~익년 2월 28일
  const endDate =
    term === 1
      ? new Date(year, 7, 31) // Aug 31
      : new Date(year + 1, 1, 28); // Feb 28 of next year
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
