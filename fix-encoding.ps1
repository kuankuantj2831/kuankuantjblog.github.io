$files = @(
    "c:\Users\asus\Desktop\my-blog\admin\dashboard-enterprise.html",
    "c:\Users\asus\Desktop\my-blog\analytics-dashboard.html",
    "c:\Users\asus\Desktop\my-blog\about.html"
)

$problems = @(
    @{ old = "管理�?"; new = "管理员" },
    @{ old = "企业级数据大�?"; new = "企业级数据大屏" },
    @{ old = "数据周期�?"; new = "数据周期" },
    @{ old = "本季�?"; new = "本季度" },
    @{ old = "今日新增�?"; new = "今日新增" },
    @{ old = "今日活跃�?"; new = "今日活跃" },
    @{ old = "总营�?"; new = "总营收" },
    @{ old = "今日订单�?"; new = "今日订单" },
    @{ old = "地域分布和设备统�?"; new = "地域分布和设备统计" },
    @{ old = "用户�?"; new = "用户数" },
    @{ old = "动态填�?"; new = "动态填充" },
    @{ old = "桌面�?"; new = "桌面端" },
    @{ old = "移动�?"; new = "移动端" },
    @{ old = "浏览器分�?"; new = "浏览器分布" },
    @{ old = "初始化图�?"; new = "初始化图表" },
    @{ old = "初始�?"; new = "初始化" },
    @{ old = "用户增长趋势�?"; new = "用户增长趋势" },
    @{ old = "内容发布统计�?"; new = "内容发布统计" },
    @{ old = "营收趋势�?"; new = "营收趋势" },
    @{ old = "商品销�?"; new = "商品销量" },
    @{ old = "访问来源分布�?"; new = "访问来源分布" },
    @{ old = "实时数据�?"; new = "实时数据" },
    @{ old = "加载仪表盘数�?"; new = "加载仪表盘数据" },
    @{ old = "格式化数�?"; new = "格式化数字" },
    @{ old = "近一�?"; new = "近一年" },
    @{ old = "阅读�?"; new = "阅读量" },
    @{ old = "动态生�?"; new = "动态生成" },
    @{ old = "检查登录状�?"; new = "检查登录状态" },
    @{ old = "格式化数�?"; new = "格式化数据" },
    @{ old = "更新趋势指示�?"; new = "更新趋势指示器" },
    @{ old = "更新阅读量图�?"; new = "更新阅读量图表" },
    @{ old = "绑定时间筛选按�?"; new = "绑定时间筛选按钮" },
    @{ old = "洞察文章表现，优化创作策�?"; new = "洞察文章表现，优化创作策略" },
    @{ old = "项目作品" },
    @{ old = "快速学�?"; new = "快速学习" },
    @{ old = "创意设计" },
    @{ old = "问题解决" },
    @{ old = "用代码创造美好事�?"; new = "用代码创造美好事物" },
    @{ old = "探索世界的每一个角�?"; new = "探索世界的每一个角落" },
    @{ old = "在书海中寻找知识" },
    @{ old = "Minecraft 等创造性游�?"; new = "Minecraft 等创造性游戏" },
    @{ old = "小游戏合�?"; new = "小游戏合集" },
    @{ old = "贪吃蛇、熄灯游戏等经典小游�?"; new = "贪吃蛇、熄灯游戏等经典小游戏" },
    @{ old = "展示创意项目�?"; new = "展示创意项目" },
    @{ old = "带来一些有趣的内容和灵�?"; new = "带来一些有趣的内容和灵感" }
)

Write-Host "开始修复乱码问题..."
Write-Host "----------------------------------------"

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "处理文件: $file"
        $content = Get-Content $file -Raw

        foreach ($problem in $problems) {
            if ($problem.ContainsKey("old") -and $problem.ContainsKey("new")) {
                $content = $content -replace $problem.old, $problem.new
            }
        }

        $content = $content -replace "�", ""

        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "✅ 修复完成"
        Write-Host "----------------------------------------"
    }
    else {
        Write-Host "⚠️ 文件不存在: $file"
        Write-Host "----------------------------------------"
    }
}

Write-Host "所有乱码修复完成!"