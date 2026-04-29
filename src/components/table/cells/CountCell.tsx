import { formatTableCount } from "../tableFormat";

interface CountCellProps {
  value?: number | null;
  className?: string;
}

export function CountCell({ value, className = "" }: CountCellProps) {
  return (
    <span className={`text-[12px] font-mono text-apple-text-secondary ${className}`.trim()}>
      {formatTableCount(value)}
    </span>
  );
}
