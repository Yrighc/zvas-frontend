import type {
  InternalHandlerCurrentUserResponse,
  InternalHandlerLoginResponse,
  ZvasPkgAuthAuthUser,
} from '@/api/generated/model'
import { getAuthMe, postAuthLogin, postAuthLogout } from '@/api/generated/sdk'
import type { AuthUserView } from '@/types/auth'

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResultView {
  accessToken: string
  tokenType: string
  expiresAt: string
  user: AuthUserView
}

/**
 * login 执行账号密码登录并转换为前端视图模型。
 */
export async function login(payload: LoginPayload): Promise<LoginResultView> {
  const response = await postAuthLogin(payload)
  const body = response.data as InternalHandlerLoginResponse
  return {
    accessToken: body.data?.access_token || '',
    tokenType: body.data?.token_type || 'Bearer',
    expiresAt: body.data?.expires_at || '',
    user: toAuthUserView(body.data?.user),
  }
}

/**
 * getCurrentUser 读取当前用户信息。
 */
export async function getCurrentUser(): Promise<AuthUserView> {
  const response = await getAuthMe()
  const body = response.data as InternalHandlerCurrentUserResponse
  return toAuthUserView(body.data?.user)
}

/**
 * logout 执行退出登录。
 */
export async function logout() {
  await postAuthLogout()
}

function toAuthUserView(user?: ZvasPkgAuthAuthUser | null): AuthUserView {
  return {
    id: user?.id || '',
    username: user?.username || '',
    name: user?.name || '',
    role: user?.role || '',
    roles: user?.roles || [],
    permissions: user?.permissions || [],
  }
}
