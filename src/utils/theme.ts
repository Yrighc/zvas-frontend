/**
 * 苹果风（极简精密控制台）样式约束令牌
 */
import type { SlotsToClasses, TableSlots } from "@heroui/react"

/**
 * 仪表盘标准表格类配置 (Apple Dashboard Standard)
 * 适用于系统中绝大多数数据表格展示场景，统一表头、间距及悬停高亮逻辑。
 * 注意：使用时应手动传入 `base` 类的 `min-w-[XXXpx]` 等容器宽度限制。
 */
export const APPLE_TABLE_CLASSES: SlotsToClasses<TableSlots> = {
  table: "table-fixed",
  thead: "[&>tr]:first:rounded-xl",
  th: "bg-transparent text-apple-text-tertiary uppercase text-[10px] tracking-[0.2em] font-black h-14 border-b border-white/5 pb-2 text-left",
  td: "py-4 border-b border-white/5 last:border-0 text-left align-middle",
  tr: "hover:bg-white/[0.03] transition-colors",
}
