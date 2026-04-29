import { formatTableDateTime } from "../tableFormat";

interface TimeCellProps {
  value?: string;
  className?: string;
}

export function TimeCell({ value, className = "" }: TimeCellProps) {
  return (
    <span className={`text-[12px] font-mono text-apple-text-secondary ${className}`.trim()}>
      {formatTableDateTime(value)}
    </span>
  );
}
