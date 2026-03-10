# TianAPI 集成配置指南

## 📋 已完成的修改

### 1. 代码修改
- ✅ 修改了 `fetchAllNews()` 函数，改为调用TianAPI
- ✅ 添加了API配置区域
- ✅ 添加了错误处理（失败时自动降级到模拟数据）
- ✅ 添加了时间格式化函数

### 2. 接口映射
| 您的分类 | TianAPI接口 | 参数 |
|---------|-------------|------|
| 科技 | /technews/index | num=8 |
| 财经 | /caijing/index | num=8 |
| 综合 | /generalnews/index | num=8 |

## 🔑 获取API Key步骤

### 第1步：注册账号
1. 访问 [天聚数行开放平台](https://www.tianapi.com/)
2. 点击右上角"注册"
3. 填写信息完成注册

### 第2步：获取API Key
1. 登录后进入**控制台**
2. 在左侧菜单找到**API密钥**或**我的密钥**
3. 复制您的API Key

### 第3步：配置到项目
打开 `script.js` 文件，找到第4行：
```javascript
const TIANAPI_KEY = ''; // 请在 https://www.tianapi.com/ 注册后获取API Key
```
将您的API Key填入：
```javascript
const TIANAPI_KEY = '你的API Key';
```

## 💡 使用说明

### 有API Key时
- 自动从TianAPI获取真实新闻
- 每次刷新会获取最新数据
- 显示8条最新新闻

### 无API Key或API调用失败时
- 自动降级使用模拟数据
- 控制台会显示警告信息
- 不影响页面正常显示

## 📊 API免费额度
- 会员可**免费使用**
- 每天有调用次数限制
- 适合个人项目使用

## 🔧 故障排查

### 问题1：新闻显示的是模拟数据
**原因**：未配置API Key或API调用失败
**解决**：
1. 检查 `script.js` 第4行是否填入了API Key
2. 打开浏览器控制台查看错误信息

### 问题2：API调用失败
**原因**：网络问题或API Key无效
**解决**：
1. 确认API Key正确
2. 检查网络连接
3. 查看控制台错误信息

## 📞 技术支持
- TianAPI官网：https://www.tianapi.com/
- API文档：https://www.tianapi.com/apiview/
