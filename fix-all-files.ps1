$files = Get-ChildItem -Path "c:\Users\asus\Desktop\my-blog" -Filter "*.html" -Recurse | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*test*" 
}

$count = 0
foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Raw
        
        # 检查是否包含需要修复的字符
        if ($content -match '鉁\?||兘|尗||灦|鍖哄煙|鑳屾櫙瑁呴グ|宸ュ叿|璁＄畻鍣\?|寰呭姙浜嬮」|绗旇|澶╂皵鏌ヨ|缈昏瘧|鍊掕鏃跺姛鑳\?|绉掕〃|鍗曚綅杞崲鍣\?|瀵嗙爜鐢熸垚鍣\?|浜岀淮鐮佺敓鎴愬櫒|鏂囨湰瀵规瘮宸ュ叿|JSON鏍煎紡鍖栧伐鍏\?|姝ｅ垯琛ㄨ揪寮忔祴璇曞櫒|棰滆壊閫夋嫨鍣\?' ) {
            
            # 执行替换
            $content = $content -replace '鉁\?', ''
            $content = $content -replace '', ''
            $content = $content -replace '兘', ''
            $content = $content -replace '尗', ''
            $content = $content -replace '', ''
            $content = $content -replace '灦', ''
            $content = $content -replace '鍖哄煙', '区域'
            $content = $content -replace '鑳屾櫙瑁呴グ', '背景装饰'
            $content = $content -replace '宸ュ叿', '工具'
            $content = $content -replace '璁＄畻鍣\?', '计算器'
            $content = $content -replace '寰呭姙浜嬮」', '待办事项'
            $content = $content -replace '绗旇', '笔记'
            $content = $content -replace '澶╂皵鏌ヨ', '天气查询'
            $content = $content -replace '缈昏瘧', '翻译'
            $content = $content -replace '鍊掕鏃跺姛鑳\?', '倒计时功能'
            $content = $content -replace '绉掕〃', '秒表'
            $content = $content -replace '鍗曚綅杞崲鍣\?', '单位转换器'
            $content = $content -replace '瀵嗙爜鐢熸垚鍣\?', '密码生成器'
            $content = $content -replace '浜岀淮鐮佺敓鎴愬櫒', '二维码生成器'
            $content = $content -replace '鏂囨湰瀵规瘮宸ュ叿', '文本对比工具'
            $content = $content -replace 'JSON鏍煎紡鍖栧伐鍏\?', 'JSON格式化工具'
            $content = $content -replace '姝ｅ垯琛ㄨ揪寮忔祴璇曞櫒', '正则表达式测试器'
            $content = $content -replace '棰滆壊閫夋嫨鍣\?', '颜色选择器'
            
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            $count++
            Write-Host "✅ 已修复: $($file.FullName)" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ 错误: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n修复完成！共修复了 $count 个文件" -ForegroundColor Yellow