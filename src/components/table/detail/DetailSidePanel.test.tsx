import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { AppProviders } from "@/app/providers";

import { DetailSidePanel } from "./DetailSidePanel";

describe("DetailSidePanel", () => {
  it("renders a default close footer when no custom footer is supplied", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <AppProviders>
        <DetailSidePanel
          isOpen
          title="Panel Title"
          description="Panel Description"
          onClose={onClose}
        >
          <div>Panel Body</div>
        </DetailSidePanel>
      </AppProviders>,
    );

    expect(await screen.findByRole("heading", { name: "Panel Title" })).toBeInTheDocument();
    expect(screen.getByText("Panel Description")).toBeInTheDocument();
    expect(screen.getByText("Panel Body")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "关闭" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("supports caller-provided footer actions and shell class overrides", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onPrimary = vi.fn();

    render(
      <AppProviders>
        <DetailSidePanel
          isOpen
          title="Custom Panel"
          size="md"
          scrollBehavior="inside"
          drawerClassNames={{ base: "custom-shell" }}
          bodyClassName="custom-body"
          footerClassName="custom-footer"
          footer={
            <>
              <div>Panel Footer</div>
              <button type="button" onClick={onPrimary}>
                Primary Action
              </button>
            </>
          }
          onClose={onClose}
        >
          <div>Custom Body</div>
        </DetailSidePanel>
      </AppProviders>,
    );

    expect(await screen.findByText("Panel Footer")).toBeInTheDocument();
    expect(document.querySelector(".custom-shell")).not.toBeNull();
    expect(screen.getByText("Custom Body").closest(".custom-body")).not.toBeNull();
    expect(screen.getByText("Panel Footer").closest(".custom-footer")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "关闭" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Primary Action" }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
