import { formatTableDateTime, formatTableCount, truncateText } from "./tableFormat";

describe("tableFormat", () => {
  it("truncates long text with a shared ellipsis contract", () => {
    expect(truncateText("  alphabet  ", 5)).toBe("alpha...");
    expect(truncateText("short", 10)).toBe("short");
    expect(truncateText("   ", 10)).toBe("-");
  });

  it("formats timestamps as deterministic repository-style datetime strings", () => {
    expect(formatTableDateTime("2026-04-29T02:03:04Z")).toBe("2026-04-29 02:03:04");
    expect(formatTableDateTime("not-a-date")).toBe("not-a-date");
    expect(formatTableDateTime()).toBe("-");
  });

  it("formats numeric counts for compact table display", () => {
    expect(formatTableCount(1234567)).toBe("1,234,567");
    expect(formatTableCount(null)).toBe("-");
  });
});
