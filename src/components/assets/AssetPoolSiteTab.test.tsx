import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import { useAssetPoolAssets } from "@/api/adapters/asset";
import { AppProviders } from "@/app/providers";
import { AssetPoolSiteTab } from "@/components/assets/AssetPoolSiteTab";
import { useAuthStore } from "@/store/auth";

vi.mock("@/api/adapters/asset", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/adapters/asset")>(
      "@/api/adapters/asset",
    );
  return {
    ...actual,
    useAssetPoolAssets: vi.fn(),
  };
});

function renderTab() {
  render(
    <MemoryRouter>
      <AppProviders>
        <AssetPoolSiteTab poolId="pool-1" />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("AssetPoolSiteTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      token: "",
      hydrating: false,
      currentUser: null,
    });

    vi.mocked(useAssetPoolAssets).mockReturnValue({
      data: {
        data: [
          {
            id: "site-1",
            asset_kind: "site",
            display_name: "https://example.com",
            normalized_key: "https://example.com",
            status: "active",
            confidence_level: "high",
            system_facets: ["kind:site"],
            custom_tags: [],
            source_summary: { primary_source: "gomap_homepage" },
            detail: {
              site_url: "https://example.com",
              probe_status: "alive",
              status_code: 200,
              title: "Example",
              icp: "",
              server: "nginx",
              fingerprints: ["nginx", "jenkins"],
            },
            created_at: "2026-04-29T00:00:00Z",
            updated_at: "2026-04-29T00:00:00Z",
          },
        ],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
      isPending: false,
      refetch: vi.fn(),
    } as never);
  });

  it("renders site fingerprints in detail drawer", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole("button", { name: "查看详情" }));

    const heading = await screen.findByText("命中指纹");
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).getByText("nginx")).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText("jenkins")).toBeInTheDocument();
  });

  it("renders the updated site list columns", async () => {
    renderTab();

    expect(await screen.findByRole("columnheader", { name: "URL" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "状态" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "状态码" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "指纹" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "发现时间" })).toBeInTheDocument();
    expect(screen.getByText("nginx, jenkins")).toHaveClass("truncate", "whitespace-nowrap");
  });
});
