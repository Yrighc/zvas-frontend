# zvas-frontend

zvas 前端控制台工程。

## 技术栈

- React 18
- Vite
- TypeScript
- Arco Design
- React Router
- TanStack Query
- Zustand
- Axios
- Orval
- Vitest
- pnpm

## 开发

```bash
corepack pnpm install
corepack pnpm generate:api
corepack pnpm dev
```

## 常用命令

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## OpenAPI 生成

默认会按以下优先级查找 Swagger JSON：

1. `ZVAS_OPENAPI_SPEC`
2. `../docs/swagger/swagger.json`（子模块模式）
3. `../zvas/docs/swagger/swagger.json`（独立仓库并与主仓库同级时）
