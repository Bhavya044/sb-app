type GoogleButtonProps = {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
  isLoading?: boolean;
};

export default function GoogleButton({ onClick, className, children, isLoading = false }: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl border border-transparent bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_25px_50px_rgba(2,6,23,0.65)] transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:from-slate-800 hover:to-slate-900 ${isLoading ? "opacity-70" : ""} ${className ?? ""}`}
    >
      <span className="flex items-center justify-center rounded-full bg-white p-1">
        <svg viewBox="0 0 20 20" className="h-4 w-4">
          <path fill="#EA4335" d="M10.4 7.1H13.8V9.8H10.4z" />
          <path fill="#34A853" d="M6.5 9.8H8.7V12.5H6.5z" />
          <path fill="#FBBC05" d="M6.5 7.1H8.7V9.8H6.5z" />
          <path fill="#4285F4" d="M8.7 7.1H10.4V12.5H8.7z" />
        </svg>
      </span>
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
          <span className="tracking-[0.4em]">Loading</span>
        </span>
      ) : (
        <span className="tracking-[0.4em]">{children ?? "Continue with Google"}</span>
      )}
    </button>
  );
}
