<#
简单的文件重新编码脚本
#>

param(
    [string]$targetDir = '.'
)

Write-Host "开始重新编码 HTML 文件为 UTF-8..." -ForegroundColor Green
Write-Host "目标目录: $($(Get-Location).Path)" -ForegroundColor Yellow

# 查找所有 HTML 文件
$htmlFiles = Get-ChildItem -Path $targetDir -Filter "*.html" -Recurse | Where-Object {
    $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*test*"
}

Write-Host "找到 $($htmlFiles.Count) 个 HTML 文件" -ForegroundColor Yellow

# 处理每个 HTML 文件
foreach ($file in $htmlFiles) {
    Write-Host "`n处理文件: $($file.FullName)" -ForegroundColor Cyan
    
    try {
        # 读取文件内容（自动检测编码）
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $detectedEncoding = [System.Text.Encoding]::Default
        
        # 尝试检测编码
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            $detectedEncoding = [System.Text.Encoding]::UTF8
            $bytes = $bytes[3..($bytes.Length - 1)]
        }
        
        $content = $detectedEncoding.GetString($bytes)
        
        # 重新保存为 UTF-8 编码（无 BOM）
        $utf8Encoding = New-Object System.Text.UTF8Encoding $false
        $utf8Bytes = $utf8Encoding.GetBytes($content)
        [System.IO.File]::WriteAllBytes($file.FullName, $utf8Bytes)
        
        Write-Host "  ✅ 已重新编码为 UTF-8" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n编码完成！" -ForegroundColor Green
Write-Host "共处理了 $($htmlFiles.Count) 个 HTML 文件" -ForegroundColor Yellow