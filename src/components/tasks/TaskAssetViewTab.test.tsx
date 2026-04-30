import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import {
  useTaskSnapshotAssetDetail,
  useTaskSnapshotAssets,
} from "@/api/adapters/task";
import { AppProviders } from "@/app/providers";
import { TaskAssetViewTab } from "@/components/tasks/TaskAssetViewTab";

vi.mock("@/api/adapters/task", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/adapters/task")>(
      "@/api/adapters/task",
    );
  return {
    ...actual,
    useTaskSnapshotAssets: vi.fn(),
    useTaskSnapshotAssetDetail: vi.fn(),
  };
});

function renderTab() {
  render(
    <MemoryRouter initialEntries={["/?asset_tab=site"]}>
      <AppProviders>
        <TaskAssetViewTab taskId="task-1" />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("TaskAssetViewTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useTaskSnapshotAssets).mockReturnValue({
      data: {
        data: [
          {
            id: "asset-site-1",
            task_id: "task-1",
            snapshot_id: "snapshot-1",
            asset_kind: "site",
            display_name: "https://console.example.com",
            normalized_key: "https://console.example.com",
            origin_type: "expanded",
            source_type: "homepage_identify",
            confidence_level: "high",
            promoted_to_pool: false,
            system_facets: ["kind:site"],
            extra_payload: {
              site_url: "https://console.example.com",
              title: "Console Portal",
              status_code: 200,
              probe_status: "unreachable",
              probe_error: "dial tcp 10.10.10.8:443: i/o timeout",
            },
            created_at: "2026-04-29T00:00:00Z",
            updated_at: "2026-04-29T00:00:00Z",
          },
        ],
        pagination: { page: 1, page_size: 20, total: 1 },
      },
      isPending: false,
    } as never);

    vi.mocked(useTaskSnapshotAssetDetail).mockReturnValue({
      data: {
        id: "asset-site-1",
        task_id: "task-1",
        snapshot_id: "snapshot-1",
        asset_kind: "site",
        display_name: "https://console.example.com",
        normalized_key: "https://console.example.com",
        origin_type: "expanded",
        source_type: "homepage_identify",
        confidence_level: "high",
        promoted_to_pool: false,
        system_facets: ["kind:site"],
        extra_payload: {
          site_url: "https://console.example.com",
          title: "Console Portal",
          status_code: 200,
          probe_status: "unreachable",
          probe_error: "dial tcp 10.10.10.8:443: i/o timeout",
          server: "nginx",
        },
        created_at: "2026-04-29T00:00:00Z",
        updated_at: "2026-04-29T00:00:00Z",
      },
      isPending: false,
      isError: false,
    } as never);
  });

  it("shows task asset detail in a side panel instead of rendering an expanded row", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole("button", { name: "查看详情" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("页面根 URL")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "https://console.example.com" })).toBeInTheDocument();
    expect(screen.getByText("探测错误")).toBeInTheDocument();
    expect(screen.getByText(/dial tcp 10\.10\.10\.8:443: i\/o timeout/)).toBeInTheDocument();
    expect(screen.queryByText("端口明细")).not.toBeInTheDocument();
  });
});
