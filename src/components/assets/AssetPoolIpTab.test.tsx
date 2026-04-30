import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import {
  useAssetPoolAssetDetail,
  useAssetPoolAssets,
} from "@/api/adapters/asset";
import { AppProviders } from "@/app/providers";
import { AssetPoolIpTab } from "@/components/assets/AssetPoolIpTab";
import { useAuthStore } from "@/store/auth";

vi.mock("@/api/adapters/asset", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/adapters/asset")>(
      "@/api/adapters/asset",
    );
  return {
    ...actual,
    useAssetPoolAssets: vi.fn(),
    useAssetPoolAssetDetail: vi.fn(),
  };
});

function renderTab() {
  render(
    <MemoryRouter>
      <AppProviders>
        <AssetPoolIpTab poolId="pool-1" />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("AssetPoolIpTab", () => {
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
            id: "ip-1",
            asset_kind: "ip",
            display_name: "10.10.10.8",
            normalized_key: "10.10.10.8",
            status: "active",
            confidence_level: "high",
            system_facets: ["kind:ip"],
            custom_tags: ["vpn"],
            source_summary: { primary_source: "gomap_portscan" },
            detail: {
              open_port_count: 2,
              open_ports: [443, 8443],
              expanded_from_cidr: true,
              source_cidr: "10.10.10.0/24",
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

    vi.mocked(useAssetPoolAssetDetail).mockReturnValue({
      data: {
        id: "ip-1",
        asset_kind: "ip",
        display_name: "10.10.10.8",
        normalized_key: "10.10.10.8",
        status: "active",
        confidence_level: "high",
        system_facets: ["kind:ip"],
        custom_tags: ["vpn"],
        source_summary: { primary_source: "gomap_portscan" },
        detail: {
          open_port_count: 2,
          ports: [
            { port: 443, protocol: "tcp", service: "https", status: "open" },
            { port: 8443, protocol: "tcp", service: "https-alt", status: "open" },
          ],
          expanded_from_cidr: true,
          source_cidr: "10.10.10.0/24",
        },
        created_at: "2026-04-29T00:00:00Z",
        updated_at: "2026-04-29T00:00:00Z",
      },
      isPending: false,
      isError: false,
    } as never);
  });

  it("opens IP details in a side panel instead of rendering an expanded row", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole("button", { name: "查看详情" }));

    expect(await screen.findByText("端口明细")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "10.10.10.8" })).toBeInTheDocument();
    expect(screen.getByText(/443\/tcp \| service=https \| status=open/)).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "协议" })).not.toBeInTheDocument();
  });
});
