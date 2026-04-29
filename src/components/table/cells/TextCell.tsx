import { Tooltip } from "@heroui/react";

import { TABLE_TOOLTIP_CLASS_NAMES } from "../tableClassNames";
import { truncateText } from "../tableFormat";

interface TextCellProps {
  value?: string | null;
  limit?: number;
  mono?: boolean;
  className?: string;
  emptyLabel?: string;
}

export function TextCell({
  value,
  limit = 40,
  mono = false,
  className = "",
  emptyLabel = "-",
}: TextCellProps) {
  const text = value?.trim() || "";

  if (!text) {
    return <span className="text-[12px] text-apple-text-tertiary">{emptyLabel}</span>;
  }

  const display = truncateText(text, limit);
  const body = (
    <span
      title={text}
      className={`block truncate whitespace-nowrap text-[12px] ${mono ? "font-mono" : ""} ${className || "text-white"}`.trim()}
    >
      {display}
    </span>
  );

  if (text.length <= limit) {
    return body;
  }

  return (
    <Tooltip
      content={<div className="max-w-[420px] break-all text-xs">{text}</div>}
      classNames={TABLE_TOOLTIP_CLASS_NAMES}
    >
      {body}
    </Tooltip>
  );
}
