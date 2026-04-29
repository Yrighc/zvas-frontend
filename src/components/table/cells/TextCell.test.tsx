import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppProviders } from "@/app/providers";

import { TextCell } from "./TextCell";

describe("TextCell", () => {
  it("renders truncated mono content and exposes the full text in tooltip content", async () => {
    const fullValue = "https://example.internal/some/really/long/path";
    const user = userEvent.setup();

    render(
      <AppProviders>
        <TextCell value={fullValue} mono limit={20} />
      </AppProviders>,
    );

    const text = screen.getByText("https://example.inte...");
    expect(text).toHaveClass("truncate");
    expect(text).toHaveClass("whitespace-nowrap");
    expect(text).toHaveClass("font-mono");
    expect(text).toHaveAttribute("title", fullValue);

    await user.hover(text);
    expect(screen.getByText("https://example.inte...")).toBeInTheDocument();
  });

  it("renders an empty fallback for blank content", () => {
    render(
      <AppProviders>
        <TextCell value="   " />
      </AppProviders>,
    );

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("renders the original value without tooltip when truncation is unnecessary", () => {
    render(
      <AppProviders>
        <TextCell value="short value" limit={40} />
      </AppProviders>,
    );

    const text = screen.getByText("short value");
    expect(text).toHaveClass("truncate");
    expect(text).toHaveAttribute("title", "short value");
    expect(screen.queryByText(/^short value$/)).toBeInTheDocument();
  });
});
