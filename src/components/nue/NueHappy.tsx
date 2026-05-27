interface Props {
  size?: number;
}

export default function NueHappy({ size = 60 }: Props) {
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
      <ellipse cx={8} cy={20} rx={4} ry={2.5} fill="#F5A0A0" opacity={0.7}/>
      <ellipse cx={24} cy={20} rx={4} ry={2.5} fill="#F5A0A0" opacity={0.7}/>
      {/* eyes */}
      <circle cx={11} cy={14} r={2.5} fill="#191F28"/>
      <circle cx={21} cy={14} r={2.5} fill="#191F28"/>
      <circle cx={10} cy={13} r={1} fill="white"/>
      <circle cx={20} cy={13} r={1} fill="white"/>
      {/* smile */}
      <path d="M 9 20 Q 16 27 23 20" stroke="#191F28" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
    </svg>
  );
}
