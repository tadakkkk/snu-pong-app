interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function MobileFrame({ children, className = "" }: Props) {
  return (
    <div className="h-dvh bg-surface-muted flex justify-center overflow-hidden">
      <div
        className={`w-full max-w-full sm:max-w-[380px] h-full min-h-0 bg-surface flex flex-col relative overflow-hidden ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
