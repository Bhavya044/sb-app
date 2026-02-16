"use client";

type BookmarkFormProps = {
  title: string;
  url: string;
  onChange: (field: "title" | "url", value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isValid: boolean;
  isSubmitting: boolean;
  disabled: boolean;
  urlHelperText?: string | null;
};

export default function BookmarkForm({
  title,
  url,
  onChange,
  onSubmit,
  isValid,
  isSubmitting,
  disabled,
  urlHelperText,
}: BookmarkFormProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            placeholder="Describe the page"
            value={title}
            onChange={(event) => onChange("title", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/5 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="url">
            URL
          </label>
          <input
            id="url"
            placeholder="https://example.com"
            value={url}
            onChange={(event) => onChange("url", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/5 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
          {urlHelperText ? (
            <p className="mt-1 max-w-sm text-[10px] uppercase tracking-[0.4em] text-rose-300">
              {urlHelperText}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className={`flex w-full items-center justify-center rounded-2xl py-2 text-sm font-semibold text-white transition ${
            isValid ? "bg-emerald-500/90 hover:bg-emerald-400" : "bg-slate-700/90 text-slate-300"
          }`}
          disabled={disabled || isSubmitting || !isValid}
        >
          {isSubmitting ? "Saving…" : "Add bookmark"}
        </button>
      </form>
    </div>
  );
}
