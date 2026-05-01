interface Props {
  size?: "lg" | "sm";
}

export default function MagpieWithCoin({ size = "lg" }: Props) {
  if (size === "lg") {
    return (
      <svg
        width="160"
        height="160"
        viewBox="0 0 26 24"
        style={{ imageRendering: "pixelated" }}
      >
        {/* 꼬리 */}
        <rect x="0" y="13" width="3" height="1" fill="#5B8FE8" />
        <rect x="1" y="14" width="3" height="1" fill="#5B8FE8" />
        <rect x="2" y="12" width="3" height="1" fill="#7BA8EC" />
        {/* 몸통 베이지 */}
        <rect x="4" y="11" width="9" height="4" fill="#E8DFCB" />
        <rect x="5" y="10" width="8" height="1" fill="#E8DFCB" />
        {/* 흰 배 */}
        <rect x="7" y="13" width="4" height="2" fill="#FFFFFF" />
        {/* 날개 파랑 */}
        <rect x="5" y="9" width="7" height="3" fill="#5B8FE8" />
        <rect x="6" y="11" width="5" height="1" fill="#7BA8EC" />
        {/* 머리 */}
        <rect x="13" y="8" width="4" height="4" fill="#E8DFCB" />
        {/* 검은 베레모 */}
        <rect x="13" y="7" width="4" height="2" fill="#191F28" />
        <rect x="14" y="6" width="3" height="1" fill="#191F28" />
        {/* 흰 얼굴 */}
        <rect x="14" y="9" width="3" height="2" fill="#FFFFFF" />
        {/* 눈 */}
        <rect x="15" y="9" width="1" height="1" fill="#191F28" />
        {/* 부리 */}
        <rect x="17" y="9" width="2" height="1" fill="#191F28" />
        <rect x="17" y="10" width="1" height="1" fill="#191F28" />
        {/* 동전 (노란색) */}
        <rect x="19" y="8" width="4" height="4" fill="#F5C247" />
        <rect x="20" y="7" width="2" height="1" fill="#F5C247" />
        <rect x="20" y="12" width="2" height="1" fill="#F5C247" />
        <rect x="19" y="9" width="1" height="2" fill="#D4A030" />
        <rect x="22" y="9" width="1" height="2" fill="#D4A030" />
        {/* ₩ 표시 */}
        <rect x="20" y="9" width="1" height="1" fill="#191F28" />
        <rect x="22" y="9" width="1" height="1" fill="#191F28" />
        <rect x="20" y="11" width="3" height="1" fill="#191F28" />
        {/* 다리 */}
        <rect x="6" y="15" width="1" height="2" fill="#191F28" />
        <rect x="9" y="15" width="1" height="2" fill="#191F28" />
        <rect x="5" y="17" width="3" height="1" fill="#191F28" />
        <rect x="8" y="17" width="3" height="1" fill="#191F28" />
      </svg>
    );
  }

  return (
    <svg
      width="48"
      height="40"
      viewBox="0 0 26 22"
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="0" y="11" width="3" height="1" fill="#5B8FE8" />
      <rect x="1" y="12" width="3" height="1" fill="#5B8FE8" />
      <rect x="2" y="10" width="3" height="1" fill="#7BA8EC" />
      <rect x="4" y="9" width="9" height="4" fill="#E8DFCB" />
      <rect x="5" y="8" width="8" height="1" fill="#E8DFCB" />
      <rect x="7" y="11" width="4" height="2" fill="#FFFFFF" />
      <rect x="5" y="7" width="7" height="3" fill="#5B8FE8" />
      <rect x="6" y="9" width="5" height="1" fill="#7BA8EC" />
      <rect x="13" y="6" width="4" height="4" fill="#E8DFCB" />
      <rect x="13" y="5" width="4" height="2" fill="#191F28" />
      <rect x="14" y="4" width="3" height="1" fill="#191F28" />
      <rect x="14" y="7" width="3" height="2" fill="#FFFFFF" />
      <rect x="15" y="7" width="1" height="1" fill="#191F28" />
      <rect x="17" y="7" width="2" height="1" fill="#191F28" />
      <rect x="17" y="8" width="1" height="1" fill="#191F28" />
      <rect x="19" y="6" width="4" height="4" fill="#F5C247" />
      <rect x="20" y="5" width="2" height="1" fill="#F5C247" />
      <rect x="20" y="10" width="2" height="1" fill="#F5C247" />
      <rect x="19" y="7" width="1" height="2" fill="#D4A030" />
      <rect x="22" y="7" width="1" height="2" fill="#D4A030" />
      <rect x="20" y="7" width="1" height="1" fill="#191F28" />
      <rect x="22" y="7" width="1" height="1" fill="#191F28" />
      <rect x="20" y="9" width="3" height="1" fill="#191F28" />
      <rect x="6" y="13" width="1" height="2" fill="#191F28" />
      <rect x="9" y="13" width="1" height="2" fill="#191F28" />
    </svg>
  );
}
