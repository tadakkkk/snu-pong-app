interface Props {
  children: React.ReactNode;
  className?: string;
  gray?: boolean;
}

export default function Card({ children, className = "", gray = false }: Props) {
  const bg = gray ? "bg-surface-sub" : "bg-surface border border-hairline";
  return (
    <div className={`rounded-xl ${bg} ${className}`}>{children}</div>
  );
}
