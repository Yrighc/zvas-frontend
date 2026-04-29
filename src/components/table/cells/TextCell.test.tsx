import { render, screen } from "@testing-library/react";

import { AppProviders } from "@/app/providers";

import { TextCell } from "./TextCell";

describe("TextCell", () => {
  it("renders a single-line truncated cell with tooltip affordance", () => {
    render(
      <AppProviders>
        <TextCell value="https://example.internal/some/really/long/path" mono />
      </AppProviders>,
    );

    const text = screen.getByText(/https:\/\/example\.internal/);
    expect(text).toHaveClass("truncate");
    expect(text).toHaveClass("whitespace-nowrap");
  });
});
