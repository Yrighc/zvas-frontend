import { TextCell } from "./TextCell";

interface MonoCellProps {
  value?: string | null;
  limit?: number;
  className?: string;
  emptyLabel?: string;
}

export function MonoCell(props: MonoCellProps) {
  return <TextCell {...props} mono className={props.className || "text-apple-text-secondary"} />;
}
