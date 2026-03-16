# Cloudflare Pages 部署指南

## 方案1：使用 Git 集成（推荐）

### 步骤1：准备 GitHub 仓库
✅ 已完成 - 代码已推送到 github.com:grass0524/my-workplace

### 步骤2：在 Cloudflare Pages 创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 页面
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权 GitHub 访问
6. 选择仓库：`grass0524/my-workplace`
7. 点击 **Begin setup**

### 步骤3：配置构建设置

**基本设置：**
- Project name: `my-workplace`（或自定义）
- Production branch: `main`
- Root directory: `/`（根目录）

**构建设置：**
- Framework preset: **None**（自定义配置）
- Build command: **留空**（静态文件，无需构建）
- Build output directory: **/**（根目录）

**环境变量（可选）：**
- 无需配置

### 步骤4：部署

点击 **Save and Deploy**

Cloudflare Pages 会自动：
1. 检测到静态文件
2. 部署到全球 CDN
3. 提供 URL：`https://my-workplace.pages.dev`

---

## 方案2：使用 Wrangler CLI

### 安装 Wrangler
\`\`\`bash
npm install -g wrangler
\`\`\`

### 登录 Cloudflare
\`\`\`bash
wrangler login
\`\`\`

### 部署
\`\`\`bash
cd /Users/lijingcao/Desktop/workplace
wrangler pages deploy . --project-name=my-workplace
\`\`\`

---

## 部署后配置

### 1. 更新记账统计 iframe URL

部署成功后，需要更新 `index.html` 中的 iframe 地址：

**开发环境：**
\`\`\`html
<iframe src="http://localhost:3001">
\`\`\`

**生产环境：**
\`\`\`html
<iframe src="https://your-accounting-stats.pages.dev">
\`\`\`

### 2. 单独部署记账统计 React 应用

进入记账统计目录：
\`\`\`bash
cd 记账统计
npm run build
wrangler pages deploy dist --project-name=accounting-stats
\`\`\`

### 3. 更新 Supabase CORS 配置

在 Supabase Dashboard 中添加生产 URL 到允许列表：

1. 进入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 在 **CORS allowed origins** 中添加：
   - `https://my-workplace.pages.dev`
   - `https://accounting-stats.pages.dev`

---

## 环境变量管理

### Supabase 配置

生产环境的环境变量需要在 Cloudflare Pages 中设置：

1. 在 Cloudflare Pages 项目设置中
2. 进入 **Settings** → **Environment variables**
3. 添加以下变量（从 `config/supabaseConfig.js` 获取）：

\`\`\`
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

---

## 自动部署

配置完成后，每次推送到 `main` 分支会自动触发部署。

---

## 常见问题

### Q: 记账统计不显示？
A: 需要单独部署记账统计 React 应用，并更新 iframe URL

### Q: Supabase 认证失败？
A: 检查 CORS 配置，确保生产 URL 已添加

### Q: 数据不同步？
A: 确保使用 HTTPS，Cloudflare Pages 自动提供 HTTPS

---

## 域名绑定（可选）

### 添加自定义域名

1. 在 Cloudflare Pages 项目设置中
2. 进入 **Custom domains**
3. 点击 **Set up a custom domain**
4. 输入你的域名（如 `app.yourdomain.com`）
5. 按照提示完成 DNS 配置
