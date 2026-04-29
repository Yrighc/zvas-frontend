import type { ReactNode } from "react";

interface KeyValueItem {
  key: string;
  label: string;
  value: ReactNode;
  mono?: boolean;
}

interface KeyValueGridProps {
  items: KeyValueItem[];
  columns?: 1 | 2;
}

export function KeyValueGrid({ items, columns = 2 }: KeyValueGridProps) {
  return (
    <div className={`grid gap-4 ${columns === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
      {items.map((item) => (
        <section key={item.key} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-apple-text-tertiary">
            {item.label}
          </div>
          <div className={`break-all text-sm text-white ${item.mono ? "font-mono" : ""}`.trim()}>
            {item.value}
          </div>
        </section>
      ))}
    </div>
  );
}
