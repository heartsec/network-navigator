#!/bin/bash

# 启用动态加载组件的脚本

echo "正在切换到动态加载版本..."

# 备份原始文件（如果还没有备份）
if [ ! -f "src/components/App.js.original" ]; then
    cp src/components/App.js src/components/App.js.original
    echo "✓ 已备份原始 App.js"
fi

# 替换导入语句
sed -i.bak 's/import LoadNetwork from "\.\/LoadNetwork";/import LoadNetwork from ".\/LoadNetworkDynamic";/' src/components/App.js

echo "✓ 已更新 App.js 使用动态加载组件"
echo ""
echo "完成！现在你可以："
echo "1. 添加新的 .ftree 文件到 public/ 目录"
echo "2. 编辑 public/examples-list.json 添加文件信息"
echo "3. 刷新页面查看新示例"
echo ""
echo "如需恢复原始版本，运行: ./scripts/restore-original-loader.sh"
