import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import { AppProviders } from "@/app/providers";
import { TaskRecordsTab } from "@/components/tasks/TaskRecordsTab";

vi.mock("@/api/adapters/task", async () => {
  const actual = await vi.importActual<typeof import("@/api/adapters/task")>(
    "@/api/adapters/task",
  );
  return {
    ...actual,
    useTaskRecords: vi.fn(),
  };
});

vi.mock("@/components/tasks/TaskRecordDetailDrawer", () => ({
  TaskRecordDetailDrawer: () => null,
}));

async function loadTaskModule() {
  return import("@/api/adapters/task");
}

function renderTab() {
  render(
    <MemoryRouter>
      <AppProviders>
        <TaskRecordsTab taskId="task-1" />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("TaskRecordsTab", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const taskModule = await loadTaskModule();

    vi.mocked(taskModule.useTaskRecords).mockReturnValue({
      data: {
        data: [
          {
            unit_id: "record-1",
            task_id: "task-1",
            stage: "http_probe",
            topic: "topic-1",
            task_type: "http_probe",
            task_subtype: "homepage_identify",
            target_key: "https://example.internal/very/long/path",
            status: "succeeded",
            worker_id: "worker-alpha-very-long-name",
            attempt: 2,
            started_at: "2026-04-29T08:00:00Z",
            finished_at: "2026-04-29T08:00:03Z",
            duration_ms: 3200,
            result_summary: JSON.stringify({
              site_url: "https://example.internal/very/long/path",
              title: "Internal Admin Portal Dashboard With Very Long Title",
              status_code: 200,
              probe_status: "alive",
            }),
            route_code: "route-1",
            desired_state: "succeeded",
          },
          {
            unit_id: "record-2",
            task_id: "task-1",
            stage: "http_probe",
            topic: "topic-2",
            task_type: "http_probe",
            task_subtype: "homepage_identify",
            target_key: "https://fallback.example.internal",
            status: "succeeded",
            worker_id: "worker-beta",
            attempt: 1,
            started_at: "2026-04-29T08:10:00Z",
            finished_at: "2026-04-29T08:10:02Z",
            duration_ms: 2100,
            result_summary: "legacy homepage summary text",
            route_code: "route-2",
            desired_state: "succeeded",
          },
        ],
        pagination: { page: 1, page_size: 20, total: 2 },
      },
      isPending: false,
    } as never);
  });

  it("renders visible detail actions and compact mixed-record summaries", async () => {
    renderTab();

    expect(await screen.findByRole("columnheader", { name: "结果摘要" })).toBeInTheDocument();

    const targetCell = screen.getByTitle("https://example.internal/very/long/path");
    const row = targetCell.closest("tr");
    expect(row).not.toBeNull();

    const summary = within(row as HTMLTableRowElement).getByTitle(
      "Internal Admin Portal Dashboard With Very Long Title",
    );
    expect(summary.textContent).toBeTruthy();
    expect(summary.textContent!.length).toBeLessThan(
      "Internal Admin Portal Dashboard With Very Long Title".length,
    );
    expect(summary).toHaveTextContent("Internal Admin Portal");

    expect(
      within(row as HTMLTableRowElement).getByRole("button", { name: "查看详情" }),
    ).toBeInTheDocument();
  });

  it("falls back to the original summary text when homepage summary payload is not structured JSON", async () => {
    renderTab();

    const fallbackTarget = await screen.findByTitle(
      "https://fallback.example.internal",
    );
    const row = fallbackTarget.closest("tr");
    expect(row).not.toBeNull();

    expect(
      within(row as HTMLTableRowElement).getByText("legacy homepage summary text"),
    ).toBeInTheDocument();
    expect(
      within(row as HTMLTableRowElement).queryByText("-"),
    ).not.toBeInTheDocument();
  });
});
