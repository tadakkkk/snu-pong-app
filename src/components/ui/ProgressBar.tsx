interface Props {
  percent: number;
  height?: number;
  className?: string;
}

export default function ProgressBar({
  percent,
  height = 6,
  className = "",
}: Props) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={`w-full bg-surface-muted rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className="h-full bg-ink rounded-full transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
