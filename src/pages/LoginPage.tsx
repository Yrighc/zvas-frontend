import { Button, Card, Form, Grid, Input, Message, Space, Tag, Typography } from '@arco-design/web-react'
import { IconLock, IconUser } from '@arco-design/web-react/icon'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { login } from '@/api/adapters/auth'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/store/auth'

const { Row, Col } = Grid
const FormItem = Form.Item
const { Paragraph, Text, Title } = Typography

interface LoginFormValues {
  username: string
  password: string
}

/**
 * LoginPage 提供真实账号密码登录入口。
 */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((state) => state.setSession)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<LoginFormValues>()

  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/system/health'

  const submit = async () => {
    try {
      const values = await form.validate()
      setSubmitting(true)
      const result = await login(values)
      setSession(result.accessToken, result.user)
      Message.success('登录成功。')
      navigate(redirectPath, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        Message.error(error.message)
        return
      }
      if (error instanceof Error) {
        Message.warning(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-grid">
        <Card className="login-hero">
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Tag color="arcoblue" bordered>
              ZVAS / Console
            </Tag>
            <Title heading={1} className="login-title">
              使用真实账号登录控制台
            </Title>
            <Paragraph className="login-copy">
              当前版本已经接入真实 `/api/v1/auth/login`，前端不再手填 Bearer Token，后续所有页面直接复用统一 JWT 登录态。
            </Paragraph>
            <Space wrap size={10}>
              <Button type="primary" onClick={submit} loading={submitting}>
                登录并进入控制台
              </Button>
              <Button onClick={() => navigate('/system/version')}>查看系统版本</Button>
            </Space>
          </Space>
        </Card>
        <Card className="login-panel">
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <div>
              <Text className="section-label">账号密码登录</Text>
              <Title heading={4}>使用系统管理员或已创建用户登录</Title>
            </div>
            <Form<LoginFormValues>
              layout="vertical"
              form={form}
              initialValues={{ username: 'admin', password: 'Admin@123456' }}
              onSubmit={submit}
            >
              <FormItem field="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<IconUser />} placeholder="例如：admin" autoComplete="username" />
              </FormItem>
              <FormItem field="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<IconLock />} placeholder="请输入密码" autoComplete="current-password" />
              </FormItem>
              <Row gutter={[12, 12]}>
                <Col span={24}>
                  <Button long type="primary" htmlType="submit" loading={submitting}>
                    登录
                  </Button>
                </Col>
              </Row>
            </Form>
            <Card className="token-card" hoverable>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Text bold>默认管理员</Text>
                <Paragraph className="token-copy">用户名：`admin`，密码：`Admin@123456`。首次启动可直接用于本地联调。</Paragraph>
              </Space>
            </Card>
          </Space>
        </Card>
      </section>
    </main>
  )
}
