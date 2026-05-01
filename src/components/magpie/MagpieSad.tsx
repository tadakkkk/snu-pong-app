interface Props {
  size?: number;
}

export default function MagpieSad({ size = 100 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="5" y="2" width="6" height="1" fill="#191F28" />
      <rect x="4" y="3" width="8" height="2" fill="#191F28" />
      <rect x="4" y="5" width="8" height="2" fill="#FFFFFF" />
      <rect x="5" y="6" width="2" height="1" fill="#191F28" />
      <rect x="9" y="6" width="2" height="1" fill="#191F28" />
      <rect x="7" y="7" width="2" height="1" fill="#191F28" />
      <rect x="4" y="8" width="8" height="5" fill="#E8DFCB" />
      <rect x="6" y="10" width="4" height="3" fill="#FFFFFF" />
      <rect x="2" y="9" width="2" height="3" fill="#5B8FE8" />
      <rect x="12" y="9" width="2" height="3" fill="#5B8FE8" />
      <rect x="6" y="14" width="1" height="1" fill="#191F28" />
      <rect x="9" y="14" width="1" height="1" fill="#191F28" />
    </svg>
  );
}
