import type { SlotsToClasses, TableSlots } from "@heroui/react";

export const TABLE_CLASS_NAMES: SlotsToClasses<TableSlots> = {
  table: "table-fixed",
  thead: "[&>tr]:first:rounded-xl",
  th: "bg-transparent text-apple-text-tertiary uppercase text-[10px] tracking-[0.2em] font-black h-14 border-b border-white/5 pb-2 text-left",
  td: "py-4 border-b border-white/5 last:border-0 text-left align-middle overflow-hidden",
  tr: "hover:bg-white/[0.03] transition-colors",
};

export const TABLE_TOOLTIP_CLASS_NAMES = {
  content: "border border-white/10 bg-apple-bg/95 px-3 py-2 text-white",
};
