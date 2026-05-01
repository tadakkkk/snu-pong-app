interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function MobileFrame({ children, className = "" }: Props) {
  return (
    <div className="min-h-screen bg-surface-muted flex justify-center">
      <div
        className={`w-full max-w-[380px] min-h-screen bg-surface flex flex-col relative overflow-x-hidden ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
