interface EvidenceBlockProps {
  title: string;
  content?: string | null;
  hint?: string;
}

export function EvidenceBlock({ title, content, hint }: EvidenceBlockProps) {
  const text = content?.trim() || "-";

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-apple-text-tertiary">
          {title}
        </h3>
        {hint ? <p className="text-xs text-apple-text-tertiary">{hint}</p> : null}
      </div>
      <pre className="overflow-auto rounded-[22px] border border-white/8 bg-black/30 p-4 text-xs leading-relaxed text-apple-text-secondary whitespace-pre-wrap break-all">
        {text}
      </pre>
    </section>
  );
}
