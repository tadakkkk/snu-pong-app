interface Props {
  size?: number;
}

export default function NueExcited({ size = 60 }: Props) {
  const h = size;
  const w = Math.round(size * 64 / 36);
  return (
    <svg width={w} height={h} viewBox="0 0 64 36">
      {/* body segments — back to front */}
      <circle cx={56} cy={27} r={6} fill="#EDE8D8" stroke="#8B7355" strokeWidth={1.5}/>
      <circle cx={45} cy={25} r={9} fill="#EDE8D8" stroke="#8B7355" strokeWidth={1.5}/>
      <circle cx={32} cy={22} r={11} fill="#EDE8D8" stroke="#8B7355" strokeWidth={1.5}/>
      <circle cx={16} cy={18} r={14} fill="#EDE8D8" stroke="#8B7355" strokeWidth={1.5}/>
      {/* segment texture dots */}
      <circle cx={45} cy={28} r={1.8} fill="#C8BDA0"/>
      <circle cx={56} cy={29} r={1.2} fill="#C8BDA0"/>
      {/* blush */}
      <ellipse cx={8} cy={20} rx={4.5} ry={3} fill="#F5A0A0" opacity={0.7}/>
      <ellipse cx={24} cy={20} rx={4.5} ry={3} fill="#F5A0A0" opacity={0.7}/>
      {/* star / sparkle eyes in gold */}
      <path d="M 11 11 L 11 17 M 8 14 L 14 14" stroke="#F5C247" strokeWidth={2} strokeLinecap="round" fill="none"/>
      <path d="M 21 11 L 21 17 M 18 14 L 24 14" stroke="#F5C247" strokeWidth={2} strokeLinecap="round" fill="none"/>
      {/* open excited mouth */}
      <ellipse cx={16} cy={22} rx={3.5} ry={3} fill="#191F28"/>
    </svg>
  );
}
