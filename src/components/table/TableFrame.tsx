import type { ReactNode } from "react";

interface TableFrameProps {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function TableFrame({ children, footer, className = "" }: TableFrameProps) {
  return (
    <div
      className={`overflow-x-auto rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl ${className}`.trim()}
    >
      {children}
      {footer ? <div className="border-t border-white/5 bg-white/[0.01]">{footer}</div> : null}
    </div>
  );
}
