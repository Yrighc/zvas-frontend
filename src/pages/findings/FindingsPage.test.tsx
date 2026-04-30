import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import { useAssetPools } from "@/api/adapters/asset";
import { useFindings } from "@/api/adapters/finding";
import { AppProviders } from "@/app/providers";
import { FindingsPage } from "@/pages/findings/FindingsPage";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/api/adapters/asset", async () => {
  const actual = await vi.importActual<typeof import("@/api/adapters/asset")>(
    "@/api/adapters/asset",
  );
  return {
    ...actual,
    useAssetPools: vi.fn(),
  };
});

vi.mock("@/api/adapters/finding", async () => {
  const actual = await vi.importActual<typeof import("@/api/adapters/finding")>(
    "@/api/adapters/finding",
  );
  return {
    ...actual,
    useFindings: vi.fn(),
  };
});

function renderPage() {
  render(
    <MemoryRouter>
      <AppProviders>
        <FindingsPage />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("FindingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();

    vi.mocked(useAssetPools).mockReturnValue({
      data: {
        data: [{ id: "pool-1", name: "生产资产池" }],
        pagination: { page: 1, page_size: 100, total: 1 },
      },
    } as never);

    vi.mocked(useFindings).mockReturnValue({
      data: {
        data: [
          {
            finding_id: "finding-1",
            title: "任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务",
            severity: "high",
            base_url: "https://example.com/really/long/path/for/testing",
            asset_ref: "asset-ref-1",
            host: "example.com",
            rule_id: "poc-template-1",
            task_id: "task-1",
            task_name: "任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务",
            asset_pool_name: "生产资产池",
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

  it("renders shared single-line cells for findings rows", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "全局漏洞结果" })).toBeInTheDocument();
    const findingRow = screen.getByText("poc-template-1").closest("tr");
    expect(findingRow).not.toBeNull();
    expect(
      within(findingRow as HTMLTableRowElement).getByTitle(
        "任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务任务 / 生产资产池",
      ),
    ).toHaveClass("truncate", "whitespace-nowrap");
    expect(screen.getByText("poc-template-1")).toHaveClass("truncate", "whitespace-nowrap");
  });

  it("navigates to the task findings tab when clicking view task", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "查看任务" }));

    expect(navigateMock).toHaveBeenCalledWith("/tasks/task-1?tab=findings");
  });
});
