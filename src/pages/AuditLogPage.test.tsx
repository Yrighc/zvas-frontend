import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuditLogPage } from './AuditLogPage';
import { getAuditLogs } from '../api/adapters/audit';

// 模拟 API
vi.mock('../api/adapters/audit', () => ({
  getAuditLogs: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const mockLogs = {
  items: [
    {
      id: 'audit-1',
      actor_user_id: 'user-admin',
      actor_username: 'admin',
      actor_role: '管理员',
      action: 'user.password.reset',
      resource_type: 'user',
      resource_id: 'user-1',
      risk_level: 'high' as const,
      result: 'success' as const,
      trace_id: 'trace-12345678',
      path: '/api/v1/users/1/reset-password',
      method: 'POST',
      remote_ip: '127.0.0.1',
      detail: { source: 'test' },
      created_at: '2026-03-06T14:38:57Z',
    },
  ],
  total: 1,
  page: 1,
  page_size: 20,
  trace_id: 'trace-123',
};

describe('AuditLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuditLogPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('应该正确渲染摘要卡片', async () => {
    vi.mocked(getAuditLogs).mockResolvedValue(mockLogs);

    renderPage();

    await waitFor(() => {
      // 使用正则匹配，避免换行或空格干扰
      expect(screen.getByText(/审计总量/)).toBeInTheDocument();
      // 获取指标数值，考虑到可能多个 1，定位到 strong 标签
      const stats = screen.getAllByRole('strong');
      expect(stats[0]).toHaveTextContent('1');
    }, { timeout: 3000 });
  });

  it('应该在表格中展示审计流水', async () => {
    vi.mocked(getAuditLogs).mockResolvedValue(mockLogs);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/user.password.reset/)).toBeInTheDocument();
      expect(screen.getByText(/管理员/)).toBeInTheDocument();
    });

    expect(screen.getByText('user.password.reset')).toHaveClass('truncate', 'whitespace-nowrap');
  });

  it('点击查看按钮应该打开详情抽屉', async () => {
    vi.mocked(getAuditLogs).mockResolvedValue(mockLogs);

    renderPage();

    // 等待数据加载并渲染表格
    const viewButton = await screen.findByRole('button', { name: /详情|查看/i, hidden: true });
    fireEvent.click(viewButton);

    // 等待抽屉内容出现
    await waitFor(() => {
      expect(screen.getByText(/审计详情/)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/操作者 \(Actor\)/)).toBeInTheDocument();
  });
});
