interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-ink text-white py-4 rounded-xl text-[15px] font-medium text-center transition-opacity ${
        disabled ? "opacity-40" : "active:opacity-80"
      } ${className}`}
    >
      {children}
    </button>
  );
}
