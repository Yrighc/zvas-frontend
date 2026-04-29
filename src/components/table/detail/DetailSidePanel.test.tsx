import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { AppProviders } from "@/app/providers";

import { DetailSidePanel } from "./DetailSidePanel";

describe("DetailSidePanel", () => {
  it("renders heading, body, footer, and close action when open", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <AppProviders>
        <DetailSidePanel
          isOpen
          title="Panel Title"
          description="Panel Description"
          footer={<div>Panel Footer</div>}
          onClose={onClose}
        >
          <div>Panel Body</div>
        </DetailSidePanel>
      </AppProviders>,
    );

    expect(await screen.findByRole("heading", { name: "Panel Title" })).toBeInTheDocument();
    expect(screen.getByText("Panel Description")).toBeInTheDocument();
    expect(screen.getByText("Panel Body")).toBeInTheDocument();
    expect(screen.getByText("Panel Footer")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "关闭" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
