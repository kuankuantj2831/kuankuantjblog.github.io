<#
简单的编码修复脚本，用于修复 HTML 文件中的乱码问题
#>

param(
    [string]$targetDir = '.'
)

Write-Host "开始修复 HTML 文件编码问题..." -ForegroundColor Green
Write-Host "目标目录: $($(Get-Location).Path)" -ForegroundColor Yellow

# 查找所有 HTML 文件
$htmlFiles = Get-ChildItem -Path $targetDir -Filter "*.html" -Recurse | Where-Object {
    $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*test*"
}

Write-Host "找到 $($htmlFiles.Count) 个 HTML 文件" -ForegroundColor Yellow

# 定义乱码字符替换字典
$replacementMap = @{
    "鏇村" = "更多";
    "鍔熻" = "功能";
    "鐨勭" = "的猫";
    "鐖" = "爬架";
    "鏂囨" = "文本";
    "瀵规" = "对比";
    "宸ュ" = "工具";
    "姝ｅ" = "正则";
    "琛ㄨ" = "表达式";
    "寮忔" = "格式";
    "JSON" = "JSON";
    "鏍煎" = "格式";
    "绂荤" = "离线";
    "鏀惰" = "笔记";
    "棌鍔" = "收藏";
    "熻兘" = "功能";
    "鐗硅" = "特色";
    "壊鍔" = "换肤";
    "棰嗗" = "评论";
    "瀛︿" = "学习";
    "閲嶅" = "重要";
    "鎬婚" = "更多";
    "鐢ㄦ" = "用户";
    "埛鍏" = "户";
    "埛璁" = "户";
    "浼佷" = "企业";
    "笟绾" = "级";
    "暟鎹" = "数据";
    "鍔熻兘" = "功能";
    "鐢ㄦ埛" = "用户";
    "鐩存" = "关注";
    "鐗硅壊" = "特色";
    "鎺㈢" = "探索";
    "鏈嶅姟" = "服务";
    "鍚庡" = "后台";
    "缁熶" = "统计";
    "鍚庡彴" = "后台";
    "鎼滅" = "搜索";
    "鎴愬" = "创建";
    "绔犲" = "站";
    "妯℃" = "主题";
    "鍙傛" = "参数";
    "杩炴" = "连接";
    "鎵撳" = "点击";
    "浜哄" = "人物";
    "楂樿" = "高级";
    "瑙ｆ" = "显示";
    "瀹屾" = "完整";
    "鏂伴" = "设置";
    "鏈" = "本";
    "缃戠" = "网络";
    "璇讳" = "声明";
    "鏃堕" = "时区";
    "娲诲" = "生活";
    "姤鍔" = "通讯";
    "闂" = "问答";
    "淇℃" = "信息";
    "瀹夊" = "安全";
    "鎷? = "?"
}

# 处理每个 HTML 文件
foreach ($file in $htmlFiles) {
    Write-Host "`n处理文件: $($file.FullName)" -ForegroundColor Cyan
    
    try {
        # 读取文件内容
        $content = Get-Content -Path $file.FullName -Raw
        
        # 检查是否包含乱码字符
        $hasChanges = $false
        
        foreach ($key in $replacementMap.Keys) {
            if ($content.Contains($key)) {
                $count = ($content.Split($key)).Count - 1
                $content = $content.Replace($key, $replacementMap[$key])
                $hasChanges = $true
                Write-Host "  替换: $key -> $($replacementMap[$key]) ($count 次)" -ForegroundColor Green
            }
        }
        
        # 保存修改后的内容
        if ($hasChanges) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            Write-Host "  ✅ 文件已保存" -ForegroundColor Green
        } else {
            Write-Host "  ✅ 无需修改" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n修复完成！" -ForegroundColor Green
Write-Host "共处理了 $($htmlFiles.Count) 个 HTML 文件" -ForegroundColor Yellow