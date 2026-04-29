import { Chip } from "@heroui/react";

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

interface StatusBadgeCellProps {
  label?: string | null;
  tone?: StatusTone;
}

const TONE_CLASS_NAMES: Record<StatusTone, string> = {
  neutral: "border-white/10 bg-white/5 text-apple-text-secondary",
  success: "border-apple-green/25 bg-apple-green/10 text-apple-green-light",
  warning: "border-apple-amber/25 bg-apple-amber/10 text-apple-amber",
  danger: "border-apple-red/25 bg-apple-red/10 text-apple-red-light",
  info: "border-apple-blue/25 bg-apple-blue/10 text-apple-blue-light",
};

export function StatusBadgeCell({ label, tone = "neutral" }: StatusBadgeCellProps) {
  return (
    <Chip
      size="sm"
      variant="flat"
      classNames={{
        base: `border font-black uppercase tracking-[0.14em] ${TONE_CLASS_NAMES[tone]}`,
        content: "px-0.5",
      }}
    >
      {label?.trim() || "-"}
    </Chip>
  );
}
