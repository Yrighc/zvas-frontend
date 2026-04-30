const TABLE_COUNT_FORMATTER = new Intl.NumberFormat("en-US");

function padDateTimePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function truncateText(value: string, limit: number): string {
  const text = value.trim();
  if (!text) return "-";
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

export function formatTableDateTime(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return [
    date.getFullYear(),
    padDateTimePart(date.getMonth() + 1),
    padDateTimePart(date.getDate()),
  ].join("-")
    + ` ${padDateTimePart(date.getHours())}:${padDateTimePart(date.getMinutes())}:${padDateTimePart(date.getSeconds())}`;
}

export function formatTableCount(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return TABLE_COUNT_FORMATTER.format(value);
}
