$htmlFiles = Get-ChildItem -Path "c:\Users\asus\Desktop\my-blog" -Filter "*.html" -Recurse | Where-Object {
    $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*test*"
}

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw
        
        # 直接替换常见的乱码字符
        $content = $content -replace "鏇村", "更多"
        $content = $content -replace "鍔熻", "功能"
        $content = $content -replace "鐨勭", "的猫"
        $content = $content -replace "鐖", "爬架"
        $content = $content -replace "鏂囨", "文本"
        $content = $content -replace "瀵规", "对比"
        $content = $content -replace "宸ュ", "工具"
        $content = $content -replace "姝ｅ", "正则"
        $content = $content -replace "琛ㄨ", "表达式"
        $content = $content -replace "寮忔", "格式"
        $content = $content -replace "鏍煎", "格式"
        $content = $content -replace "绂荤", "离线"
        $content = $content -replace "鏀惰", "笔记"
        $content = $content -replace "棌鍔", "收藏"
        $content = $content -replace "熻兘", "功能"
        $content = $content -replace "鐗硅", "特色"
        $content = $content -replace "壊鍔", "换肤"
        $content = $content -replace "棰嗗", "评论"
        $content = $content -replace "瀛︿", "学习"
        $content = $content -replace "閲嶅", "重要"
        $content = $content -replace "鎬婚", "更多"
        $content = $content -replace "鐢ㄦ", "用户"
        $content = $content -replace "埛鍏", "户"
        $content = $content -replace "埛璁", "户"
        $content = $content -replace "浼佷", "企业"
        $content = $content -replace "笟绾", "级"
        $content = $content -replace "暟鎹", "数据"
        $content = $content -replace "鍔熻兘", "功能"
        $content = $content -replace "鐢ㄦ埛", "用户"
        $content = $content -replace "鐩存", "关注"
        $content = $content -replace "鐗硅壊", "特色"
        $content = $content -replace "鎺㈢", "探索"
        $content = $content -replace "鏈嶅姟", "服务"
        $content = $content -replace "鍚庡", "后台"
        $content = $content -replace "缁熶", "统计"
        $content = $content -replace "鍚庡彴", "后台"
        $content = $content -replace "鎼滅", "搜索"
        $content = $content -replace "鎴愬", "创建"
        $content = $content -replace "绔犲", "站"
        $content = $content -replace "妯℃", "主题"
        $content = $content -replace "鍙傛", "参数"
        $content = $content -replace "杩炴", "连接"
        $content = $content -replace "鎵撳", "点击"
        $content = $content -replace "浜哄", "人物"
        $content = $content -replace "楂樿", "高级"
        $content = $content -replace "瑙ｆ", "显示"
        $content = $content -replace "瀹屾", "完整"
        $content = $content -replace "鏂伴", "设置"
        $content = $content -replace "鏈", "本"
        $content = $content -replace "缃戠", "网络"
        $content = $content -replace "璇讳", "声明"
        $content = $content -replace "鏃堕", "时区"
        $content = $content -replace "娲诲", "生活"
        $content = $content -replace "姤鍔", "通讯"
        $content = $content -replace "闂", "问答"
        $content = $content -replace "淇℃", "信息"
        $content = $content -replace "瀹夊", "安全"
        $content = $content -replace "鎷?", "?"
        
        $utf8Encoding = New-Object System.Text.UTF8Encoding $false
        $utf8Bytes = $utf8Encoding.GetBytes($content)
        [System.IO.File]::WriteAllBytes($file.FullName, $utf8Bytes)
        
        Write-Host "✅ 已修复: $($file.FullName)" -ForegroundColor Green
    } catch {
        Write-Host "❌ 错误: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "修复完成！" -ForegroundColor Green