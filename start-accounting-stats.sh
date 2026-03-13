#!/bin/bash

# 记账统计React应用启动脚本

echo "🚀 启动记账统计React应用..."

cd /Users/lijingcao/Desktop/workplace/记账统计

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次启动，正在安装依赖..."
    npm install
fi

echo "📡 启动开发服务器（端口: 3001）..."
echo "📝 提示：启动后，在主项目中点击记账统计按钮即可查看"
echo ""
npm run dev
