# 仿 Lovart 系统部署计划 - 免费发布测试版

## 约束条件
- 不购买服务器
- 需要公网可访问
- 用于收集用户体验反馈

---

## 方案对比（均为免费）

| 方案 | 难度 | 公网地址 | 是否需改代码 | 限制 |
|------|------|---------|------------|------|
| **A. Vercel** | 低 | 永久域名 | 需适配 | 自定义 server 不支持 |
| **B. ngrok 内网穿透** | 最低 | 临时域名 | 几乎不改 | 每次重启地址变化 |
| **C. Cloudflare Tunnel** | 低 | 可固定域名 | 几乎不改 | 需注册 Cloudflare |

---

## 推荐方案 A：Vercel 部署（永久免费域名，最专业）

Vercel 是 Next.js 的官方部署平台，免费额度充足，自动 HTTPS，永久域名。

### 需要适配的问题

当前项目使用自定义 `server.ts`，Vercel 不支持。需要做以下适配：

1. **移除 server.ts 依赖** - Vercel 使用 Next.js 内置的 Serverless 模式
2. **修改启动方式** - 从 `node dist/server.js` 改为 `next start`
3. **环境变量** - 在 Vercel 控制台配置，不再依赖 .env 文件

### 实施步骤

#### 1. 修改 `next.config.ts`
- 添加 `output: 'standalone'` 优化构建产物
- 无需其他改动

#### 2. 修改 `package.json` scripts
- 添加 Vercel 构建命令
- 不影响现有 dev/start 命令

#### 3. 推送代码到 GitHub
- 创建 GitHub 仓库
- 推送代码（.env 已在 .gitignore 中，不会泄露密钥）

#### 4. Vercel 导入部署
- 登录 vercel.com（可用 GitHub 账号）
- Import Git 仓库
- 配置环境变量：
  - `YUNWU_API_KEY`
  - `GPT_IMAGE_2_API_KEY`
- 点击 Deploy
- 获得永久地址如 `https://lovart-beta.vercel.app`

#### 5. 添加用户反馈入口（可选）
- 在页面添加浮动反馈按钮
- 链接到腾讯问卷/金数据等免费问卷服务

### ⚠️ 影响范围
- `next.config.ts`：添加一行配置
- `package.json`：添加 vercel 构建脚本
- 不修改任何业务功能代码

---

## 备选方案 B：ngrok 内网穿透（最快，5分钟搞定）

无需改代码，在本机运行，通过 ngrok 获得公网地址。

### 实施步骤

#### 1. 修改 `server.ts` hostname
将 `localhost` 改为 `0.0.0.0`，允许外部访问（1行改动）

#### 2. 本机启动应用
```bash
pnpm dev
# 或生产模式
pnpm build && PORT=5000 HOSTNAME=0.0.0.0 COZE_PROJECT_ENV=PROD node dist/server.js
```

#### 3. 安装并运行 ngrok
```bash
# 安装
npm install -g ngrok

# 穿透（免费版）
ngrok http 5000
```

会得到类似 `https://a1b2c3d4.ngrok-free.app` 的公网地址。

### 限制
- 免费版每次重启地址会变
- 免费版有带宽和连接数限制
- 电脑需要一直开着
- ngrok 免费版会显示一个确认页面，用户首次访问需点击

---

## 备选方案 C：Cloudflare Tunnel（免费固定域名）

注册 Cloudflare（免费），使用 Tunnel 穿透，可获得固定域名。

### 实施步骤

#### 1. 注册 Cloudflare 免费账号
#### 2. 添加一个域名（可用免费域名如 .tk 或已有域名）
#### 3. 安装 cloudflared
```bash
npm install -g cloudflared
cloudflared tunnel login
cloudflared tunnel create lovart
cloudflared tunnel route dns lovart beta.yourdomain.com
cloudflared tunnel run lovart
```
#### 4. 修改 `server.ts` hostname 为 `0.0.0.0`
#### 5. 本机启动应用

### 限制
- 需要一个域名（可用免费域名）
- 电脑需要一直开着
- 配置稍复杂

---

## 最终推荐

**如果想要专业测试版** → 方案 A（Vercel），永久地址，自动 HTTPS，最专业
**如果想5分钟快速测试** → 方案 B（ngrok），零配置，最快上手
**如果想要固定免费地址** → 方案 C（Cloudflare Tunnel），免费固定域名
