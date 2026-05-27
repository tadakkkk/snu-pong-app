interface Props {
  size?: number;
}

export default function NueSad({ size = 60 }: Props) {
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
      {/* sad eyes — inner corners raised */}
      <path d="M 9 15 L 14 13" stroke="#191F28" strokeWidth={2} strokeLinecap="round" fill="none"/>
      <path d="M 18 13 L 23 15" stroke="#191F28" strokeWidth={2} strokeLinecap="round" fill="none"/>
      {/* tears */}
      <ellipse cx={11} cy={18} rx={1.5} ry={2} fill="#7BA8EC" opacity={0.85}/>
      <ellipse cx={21} cy={18} rx={1.5} ry={2} fill="#7BA8EC" opacity={0.85}/>
      {/* frown */}
      <path d="M 10 23 Q 16 18 22 23" stroke="#191F28" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
    </svg>
  );
}
