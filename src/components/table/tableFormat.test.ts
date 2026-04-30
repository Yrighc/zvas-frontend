import { formatTableDateTime, formatTableCount, truncateText } from "./tableFormat";

describe("tableFormat", () => {
  function formatWithLocalGetters(value: string) {
    const date = new Date(value);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-")
      + ` ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  }

  it("truncates long text with a shared ellipsis contract", () => {
    expect(truncateText("  alphabet  ", 5)).toBe("alpha...");
    expect(truncateText("short", 10)).toBe("short");
    expect(truncateText("   ", 10)).toBe("-");
  });

  it("formats timestamps with the repository's local-time semantics", () => {
    expect(formatTableDateTime("2026-04-29T00:00:00Z")).toBe(
      formatWithLocalGetters("2026-04-29T00:00:00Z"),
    );
    expect(formatTableDateTime("not-a-date")).toBe("not-a-date");
    expect(formatTableDateTime()).toBe("-");
  });

  it("formats numeric counts for compact table display", () => {
    expect(formatTableCount(1234567)).toBe("1,234,567");
    expect(formatTableCount(null)).toBe("-");
  });
});
