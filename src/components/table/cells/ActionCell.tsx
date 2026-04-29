import type { ReactNode } from "react";

import { Button } from "@heroui/react";

interface ActionCellProps {
  children?: ReactNode;
  label?: string;
  onPress?: () => void;
  isDisabled?: boolean;
  className?: string;
}

export function ActionCell({
  children,
  label,
  onPress,
  isDisabled = false,
  className = "",
}: ActionCellProps) {
  if (children) {
    return <div className={`flex items-center justify-end gap-2 ${className}`.trim()}>{children}</div>;
  }

  return (
    <div className={`flex items-center justify-end ${className}`.trim()}>
      <Button
        size="sm"
        variant="bordered"
        isDisabled={isDisabled}
        className="rounded-full border-white/10 text-apple-text-secondary font-bold hover:border-white/30 hover:text-white"
        onPress={onPress}
      >
        {label || "查看"}
      </Button>
    </div>
  );
}
