
import { supabase } from './supabase-client.js';

class SupabaseAuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        console.log('SupabaseAuth: initializing...');
        if (!supabase) {
            console.error('SupabaseAuth: supabase client is missing!');
            return;
        }

        // 监听登录状态
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('SupabaseAuth: Auth state change:', event, session);
            if (session?.user) {
                const user = session.user;
                let username = user.user_metadata.username || user.email.split('@')[0];
                let avatar_url = user.user_metadata.avatar_url;

                // 从 profiles 表获取最新信息
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', user.id)
                        .single();

                    if (data) {
                        if (data.username) username = data.username;
                        if (data.avatar_url) avatar_url = data.avatar_url;
                    }
                } catch (error) {
                    console.error("获取用户资料失败:", error);
                }

                this.currentUser = {
                    id: user.id,
                    email: user.email,
                    username: username,
                    avatar_url: avatar_url
                };
                this.updateUI();
            } else {
                this.currentUser = null;
                this.updateUI();
            }
        });

        this.bindEvents();
    }

    bindEvents() {
        // 登录按钮
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) loginBtn.addEventListener('click', () => this.showLoginModal());

        // 注册按钮
        const registerBtn = document.querySelector('.register-btn');
        if (registerBtn) registerBtn.addEventListener('click', () => this.showRegisterModal());

        // 关闭按钮
        document.querySelectorAll('.auth-modal-close, .auth-modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el) this.closeModals();
            });
        });

        // 登录表单
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 注册表单
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // 切换按钮
        const switchToRegister = document.getElementById('switchToRegister');
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }

        const switchToLogin = document.getElementById('switchToLogin');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // 退出登录
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    showLoginModal() {
        this.closeModals();
        const modal = document.getElementById('loginModal');
        if (modal) setTimeout(() => modal.classList.add('active'), 100);
    }

    showRegisterModal() {
        this.closeModals();
        const modal = document.getElementById('registerModal');
        if (modal) setTimeout(() => modal.classList.add('active'), 100);
    }

    closeModals() {
        document.querySelectorAll('.auth-modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
        document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
            el.classList.remove('show');
        });
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (!username || !email || !password || !confirmPassword) {
            this.showError('registerError', '请填写完整信息');
            return;
        }

        if (username.length < 3) {
            this.showError('registerError', '用户名至少3个字符');
            return;
        }

        if (password.length < 6) {
            this.showError('registerError', '密码至少6个字符');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('registerError', '两次密码不一致');
            return;
        }

        try {
            // 1. 注册用户
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // 2. 创建 profile (虽然 trigger 可以做，但前端显式创建更可控)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        { id: data.user.id, username: username }
                    ]);

                if (profileError) console.error('创建Profile失败:', profileError);

                this.showSuccess('registerSuccess', '注册成功！正在自动登录...');

                setTimeout(() => {
                    this.closeModals();
                    document.getElementById('registerForm').reset();
                }, 1500);
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showError('registerError', error.message || '注册失败');
        }
    }

    async handleLogin() {
        const input = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!input || !password) {
            this.showError('loginError', '请填写完整信息');
            return;
        }

        try {
            // Supabase 默认只支持邮箱登录，如果输入的是用户名，需要先查邮箱
            let email = input;
            if (!input.includes('@')) {
                // 尝试直接登录，如果失败提示用户
                if (!input.includes('@')) {
                    this.showError('loginError', '目前仅支持邮箱登录，请输入注册邮箱');
                    return;
                }
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            this.showSuccess('loginSuccess', '登录成功！');
            setTimeout(() => {
                this.closeModals();
                document.getElementById('loginForm').reset();
            }, 1000);

        } catch (error) {
            console.error('登录错误:', error);
            this.showError('loginError', '登录失败：' + (error.message || '账号或密码错误'));
        }
    }

    async logout() {
        try {
            await supabase.auth.signOut();
            window.location.reload();
        } catch (error) {
            console.error('退出错误:', error);
        }
    }

    updateUI() {
        const loginBtn = document.querySelector('.login-btn');
        const registerBtn = document.querySelector('.register-btn');
        const userMenu = document.querySelector('.user-menu');

        if (this.currentUser) {
            // 已登录
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'inline-block';
                const avatar = userMenu.querySelector('.user-avatar');
                const userName = userMenu.querySelector('.user-dropdown-name');
                const userEmail = userMenu.querySelector('.user-dropdown-email');

                if (avatar) {
                    if (this.currentUser.avatar_url) {
                        avatar.innerHTML = `<img src="${this.currentUser.avatar_url}" alt="头像" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                    } else {
                        avatar.textContent = (this.currentUser.username || 'U').charAt(0).toUpperCase();
                    }
                }
                if (userName) userName.textContent = this.currentUser.username;
                if (userEmail) userEmail.textContent = this.currentUser.email;
            }
        } else {
            // 未登录
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 3000);
        }
    }

    showSuccess(elementId, message) {
        const successEl = document.getElementById(elementId);
        if (successEl) {
            successEl.textContent = message;
            successEl.classList.add('show');
        }
    }
}

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.supabaseAuthSystem = new SupabaseAuthSystem();
        console.log('⚡ Supabase认证系统已加载 (DOMContentLoaded)');
    });
} else {
    window.supabaseAuthSystem = new SupabaseAuthSystem();
    console.log('⚡ Supabase认证系统已加载 (Direct)');
}
