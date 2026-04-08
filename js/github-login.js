/**
 * GitHub OAuth 登录组件
 */

class GitHubLogin {
    constructor(options = {}) {
        this.clientId = options.clientId || '';
        this.redirectUri = options.redirectUri || window.location.origin + '/auth/github/callback';
        this.scope = options.scope || 'read:user user:email';
        this.state = options.state || this.generateState();
        
        this.onSuccess = options.onSuccess || (() => {});
        this.onError = options.onError || (() => {});
        
        this.apiBaseUrl = options.apiBaseUrl || 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';
    }

    /**
     * 生成随机 state
     */
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * 开始 GitHub OAuth 登录流程
     */
    login() {
        if (!this.clientId) {
            this.onError(new Error('请配置 GitHub Client ID'));
            return;
        }

        // 保存 state 到 sessionStorage，用于回调时验证
        sessionStorage.setItem('github_oauth_state', this.state);

        // 构建 GitHub OAuth URL
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
            state: this.state
        });

        const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
        
        // 跳转到 GitHub 授权页面
        window.location.href = githubAuthUrl;
    }

    /**
     * 检查是否是 GitHub 登录回调
     * @returns {boolean} 是否是回调
     */
    isCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // 如果是错误回调
        if (error) {
            const errorDescription = urlParams.get('error_description') || 'GitHub 授权失败';
            this.onError(new Error(errorDescription));
            this.cleanUrl();
            return true;
        }

        // 如果不是 code 回调
        if (!code || !state) {
            return false;
        }

        // 验证 state 防止 CSRF
        const savedState = sessionStorage.getItem('github_oauth_state');
        if (state !== savedState) {
            this.onError(new Error('State 验证失败，请重试'));
            this.cleanUrl();
            return true;
        }

        // 处理回调
        this.handleCallback(code);
        return true;
    }

    /**
     * 处理 GitHub 登录回调
     */
    async handleCallback(code) {
        try {
            // 清理 URL
            this.cleanUrl();

            // 调用后端 API 完成登录
            const response = await fetch(`${this.apiBaseUrl}/auth/github/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (data.success && data.data) {
                // 保存登录信息
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                // 清理 state
                sessionStorage.removeItem('github_oauth_state');
                
                this.onSuccess(data.data);
            } else {
                throw new Error(data.message || 'GitHub 登录失败');
            }
        } catch (error) {
            console.error('GitHub 登录失败:', error);
            this.onError(error);
        }
    }

    /**
     * 清理 URL 中的 code 和 state 参数
     */
    cleanUrl() {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubLogin;
}
