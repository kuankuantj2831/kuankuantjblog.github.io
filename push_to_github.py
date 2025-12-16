import os
import subprocess

def run_command(command):
    print(f"执行命令: {command}")
    try:
        subprocess.check_call(command, shell=True)
        print("✅ 成功")
    except subprocess.CalledProcessError as e:
        print(f"❌ 失败: {e}")
        exit(1)

print("🚀 开始上传代码到 GitHub...")

# 1. 添加所有文件
run_command("git add .")

# 2. 提交更改
# 2. 提交更改
commit_message = "Update blog: Chinese style, Auth, Profile, and CNAME"
print(f"执行命令: git commit -m \"{commit_message}\"")
try:
    subprocess.check_call(f'git commit -m "{commit_message}"', shell=True)
    print("✅ 提交成功")
except subprocess.CalledProcessError:
    print("⚠️ 提交失败或没有新更改 (这通常没问题，我们将继续推送)")

# 3. 推送到远程仓库
# 尝试推送到 main，如果失败尝试 master
try:
    print("尝试推送到 main 分支...")
    subprocess.check_call("git push origin main", shell=True)
except subprocess.CalledProcessError:
    print("main 分支推送失败，尝试 master 分支...")
    try:
        subprocess.check_call("git push origin master", shell=True)
    except subprocess.CalledProcessError:
         print("❌ 推送失败，请检查您的网络或分支名称。")
         exit(1)

print("\n🎉 代码上传成功！")
print("请按照 'GitHub_Cloudflare_部署指南.md' 继续操作。")
