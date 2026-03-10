# 启动本地HTTP服务器

## 方法1：使用Python（推荐）

在项目目录执行：

```bash
# Python 3
cd /Users/lijingcao/Desktop/workplace
python3 -m http.server 8000
```

然后访问：http://localhost:8000

## 方法2：使用Node.js

```bash
cd /Users/lijingcao/Desktop/workplace
npx http-server -p 8000
```

然后访问：http://localhost:8000

## 方法3：使用PHP

```bash
cd /Users/lijingcao/Desktop/workplace
php -S localhost:8000
```

然后访问：http://localhost:8000

## 推荐工具
**安装一个简单的本地服务器：**

### Live Server (VSCode扩展)
1. 在VSCode中安装 "Live Server" 扩展
2. 右键点击 index.html
3. 选择 "Open with Live Server"
4. 自动在 http://127.0.0.5500 打开

### 优点
- ✅ 自动刷新
- ✅ 支持CORS
- ✅ 简单易用
