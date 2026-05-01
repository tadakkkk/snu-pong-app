interface Props {
  size?: number;
}

export default function MagpieExcited({ size = 100 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="5" y="0" width="6" height="1" fill="#191F28" />
      <rect x="4" y="1" width="8" height="2" fill="#191F28" />
      <rect x="4" y="3" width="8" height="2" fill="#FFFFFF" />
      {/* 별 모양 노란 눈 (왼쪽) */}
      <rect x="6" y="3" width="1" height="1" fill="#F5C247" />
      <rect x="5" y="4" width="3" height="1" fill="#F5C247" />
      <rect x="6" y="5" width="1" height="1" fill="#F5C247" />
      {/* 별 모양 노란 눈 (오른쪽) */}
      <rect x="9" y="3" width="1" height="1" fill="#F5C247" />
      <rect x="8" y="4" width="3" height="1" fill="#F5C247" />
      <rect x="9" y="5" width="1" height="1" fill="#F5C247" />
      {/* 벌어진 입 */}
      <rect x="7" y="6" width="2" height="1" fill="#191F28" />
      <rect x="6" y="7" width="4" height="1" fill="#191F28" />
      <rect x="4" y="8" width="8" height="4" fill="#E8DFCB" />
      <rect x="6" y="9" width="4" height="3" fill="#FFFFFF" />
      {/* 날개 펼침 */}
      <rect x="1" y="6" width="3" height="2" fill="#5B8FE8" />
      <rect x="2" y="8" width="2" height="2" fill="#5B8FE8" />
      <rect x="12" y="6" width="3" height="2" fill="#5B8FE8" />
      <rect x="12" y="8" width="2" height="2" fill="#5B8FE8" />
      {/* 점프 다리 */}
      <rect x="6" y="13" width="1" height="1" fill="#191F28" />
      <rect x="9" y="13" width="1" height="1" fill="#191F28" />
      <rect x="5" y="14" width="2" height="1" fill="#191F28" />
      <rect x="9" y="14" width="2" height="1" fill="#191F28" />
    </svg>
  );
}
