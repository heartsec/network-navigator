#!/bin/bash

# 恢复原始加载组件的脚本

echo "正在恢复原始加载组件..."

if [ -f "src/components/App.js.original" ]; then
    cp src/components/App.js.original src/components/App.js
    echo "✓ 已恢复原始 App.js"
else
    echo "⚠ 未找到备份文件，手动恢复导入语句..."
    sed -i.bak 's/import LoadNetwork from "\.\/LoadNetworkDynamic";/import LoadNetwork from ".\/LoadNetwork";/' src/components/App.js
    echo "✓ 已更新导入语句"
fi

echo ""
echo "完成！已恢复到原始版本。"
