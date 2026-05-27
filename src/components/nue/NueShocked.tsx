interface Props {
  size?: number;
}

export default function NueShocked({ size = 60 }: Props) {
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
      {/* wide shocked eyes */}
      <circle cx={11} cy={14} r={3.5} fill="#191F28"/>
      <circle cx={21} cy={14} r={3.5} fill="#191F28"/>
      {/* white highlights */}
      <circle cx={9.5} cy={12.5} r={1.5} fill="white"/>
      <circle cx={19.5} cy={12.5} r={1.5} fill="white"/>
      {/* O-shaped open mouth */}
      <ellipse cx={16} cy={23} rx={4} ry={4} fill="#191F28"/>
    </svg>
  );
}
