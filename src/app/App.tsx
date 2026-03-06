import { Button, Card, Space, Tag, Typography } from '@arco-design/web-react'

const { Paragraph, Text, Title } = Typography

/**
 * App 渲染 zvas-frontend 初始化阶段的品牌基线页。
 */
export function App() {
  return (
    <main className="app-shell">
      <section className="hero-grid">
        <Card className="hero-card">
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Tag color="arcoblue" bordered>
              ZVAS Frontend Baseline
            </Tag>
            <Title heading={2} className="hero-title">
              ZVAS 控制台前端工程已就绪
            </Title>
            <Paragraph className="hero-copy">
              当前阶段只落前端基线，不提前铺资产、扫描和漏洞结果页面。
            </Paragraph>
            <Space size={12} wrap>
              <Button type="primary">React + Vite</Button>
              <Button>TypeScript</Button>
              <Button>Arco Design</Button>
            </Space>
          </Space>
        </Card>
        <Card className="meta-card">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Text className="meta-label">交付目标</Text>
            <Title heading={4}>单体嵌入 + 前后端分离</Title>
            <Paragraph className="meta-copy">
              后续会统一挂载到 <code>/ui</code>，并对接 OpenAPI 生成和鉴权占位。
            </Paragraph>
          </Space>
        </Card>
      </section>
    </main>
  )
}
