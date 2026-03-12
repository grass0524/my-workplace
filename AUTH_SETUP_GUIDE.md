# 登录注册和云同步功能设置指南

## 📋 功能概述

本项目集成了完整的用户认证和云端数据同步功能：

- ✅ 用户注册/登录/登出
- ✅ 邮箱密码认证
- ✅ 密码重置功能
- ✅ 实时数据双向同步
- ✅ 离线支持（离线队列机制）
- ✅ 冲突自动处理
- ✅ 多设备支持

## 🚀 快速开始

### 步骤1：创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册账号并登录
3. 点击 "New Project"
4. 填写项目信息：
   - **Name**: My Workplace（或任意名称）
   - **Database Password**: 设置一个强密码（请保存好）
   - **Region**: 选择离你最近的区域
5. 点击 "Create new project"，等待项目创建完成（约2分钟）

### 步骤2：获取 API 凭证

1. 进入项目后，点击左侧菜单 **Settings** > **API**
2. 复制以下信息：
   - **Project URL**: 类似 `https://xxxxxxxx.supabase.co`
   - **anon public**: 类似 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 步骤3：配置项目

打开文件 `config/supabase.json`，替换以下内容：

```json
{
  "url": "https://你的项目ID.supabase.co",
  "key": "你的anon public key"
}
```

例如：
```json
{
  "url": "https://abcdefgh.supabase.co",
  "key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTIyNjY4MDZ9..."
}
```

### 步骤4：设置数据库

1. 在 Supabase 控制台中，点击左侧菜单 **SQL Editor**
2. 点击 "New Query"
3. 复制文件 `supabase_setup.sql` 的全部内容
4. 粘贴到编辑器中
5. 点击 "Run" 按钮执行

这将创建所有必需的数据库表和安全策略。

### 步骤5：配置认证设置

1. 进入 **Authentication** > **Settings**
2. 根据需要配置：
   - **Enable email confirmations**: 如果需要邮箱验证则开启
   - **Site URL**: 填写你的网站URL（本地开发可用 `http://localhost:3000`）
   - **Redirect URLs**: 添加允许的重定向URL，例如：
     - `http://localhost:3000/**`
     - `http://127.0.0.1:3000/**`
     - `https://yourdomain.com/**`

### 步骤6：测试功能

1. 打开 `register.html` 进行注册
2. 检查邮箱（如果开启了邮箱验证）
3. 登录系统
4. 数据会自动同步到云端

## 📱 使用说明

### 注册账号

访问 `register.html`，填写：
- 邮箱地址
- 密码（至少8位）
- 确认密码
- 同意服务条款

### 登录系统

访问 `login.html`，输入邮箱和密码。

选项：
- ✅ **记住我**：下次访问无需重新登录

### 忘记密码

在登录页面点击"忘记密码？"，输入邮箱地址，会收到密码重置链接。

### 数据同步

登录后，系统会自动：

1. **首次登录**：将本地数据上传到云端
2. **后续登录**：自动合并本地和云端数据
3. **实时同步**：每30秒自动同步一次
4. **离线支持**：离线时的操作会在联网后自动同步

### 同步策略

#### 健康打卡、待办事项、生词本、记账数据
采用**追加合并**策略：
- 保留两边的所有数据
- 去除重复项（通过ID判断）
- 适合列表类数据

#### 词库
采用**替换策略**：
- 比较时间戳
- 保留最新版本的数据
- 避免冲突

## 🔧 高级配置

### 修改同步间隔

在 `js/sync.js` 中修改：

```javascript
this.syncInterval = 30000; // 毫秒，默认30秒
```

### 添加新的数据类型

在 `js/sync.js` 的 `dataTypes` 中添加：

```javascript
this.dataTypes = {
    yourDataType: {
        tableName: 'your_table_name',
        localKey: 'yourLocalStorageKey',
        mergeStrategy: 'append' // 或 'replace'
    }
};
```

然后在 `supabase_setup.sql` 中创建对应的数据库表。

### 自定义认证逻辑

在 `js/auth.js` 中可以扩展：

- 添加第三方登录（Google、GitHub等）
- 实现邮箱验证流程
- 添加多因素认证

## 🐛 故障排除

### 问题1：认证服务初始化失败

**解决方案**：
- 检查 `config/supabase.json` 是否正确配置
- 确认网络连接正常
- 打开浏览器控制台查看详细错误信息

### 问题2：登录失败

**解决方案**：
- 确认已正确执行 `supabase_setup.sql`
- 检查邮箱是否已验证（如果开启了验证）
- 尝试重置密码

### 问题3：数据不同步

**解决方案**：
- 确认已登录
- 检查浏览器控制台是否有错误
- 手动触发同步（在控制台执行 `dataSync.syncAll()`）
- 确认数据库表已创建

### 问题4：离线队列不工作

**解决方案**：
- 检查 `localStorage` 是否可用
- 确认网络事件监听器正常
- 查看控制台日志

## 📊 数据结构

所有数据存储格式：

```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  data: {
    // 实际数据内容
  },
  updated_at: "2026-03-12T10:30:00Z",
  device_id: "device_uuid",
  created_at: "2026-03-12T10:30:00Z"
}
```

## 🔐 安全说明

- 所有数据都使用行级安全策略（RLS）保护
- 用户只能访问自己的数据
- 密码使用 Supabase 的加密存储
- API 密钥使用 anon public key（可公开）
- 不要将 service_role key 暴露在前端代码中

## 📈 Supabase 免费额度

- 500MB 数据库存储
- 1GB 文件存储
- 无限 API 请求
- 2个并发连接
- 实时数据订阅
- 每日50MB 出站流量

对于个人使用完全足够！

## 🎯 下一步

1. **配置生产环境**：准备一个域名和服务器
2. **添加更多功能**：第三方登录、数据导出等
3. **优化性能**：使用增量同步减少数据传输
4. **监控和日志**：添加错误追踪和用户行为分析

## 📞 支持

如有问题，请查看：
- [Supabase 官方文档](https://supabase.com/docs)
- [JavaScript 客户端文档](https://supabase.com/docs/reference/javascript)
- 项目 Issues

---

**祝你使用愉快！** 🎉
