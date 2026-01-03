
import { API_BASE_URL } from './api-config.js';

class SupabaseAuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        console.log('AuthSystem: initializing...');
        this.bindEvents();

        // Check for existing session in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                console.log('AuthSystem: User restored from localStorage', this.currentUser);
                this.updateUI();
            } catch (e) {
                console.error('AuthSystem: Failed to parse stored user', e);
                localStorage.removeItem('user');
            }
        } else {
            console.log('AuthSystem: No user session found');
            this.updateUI();
        }
    }

    bindEvents() {
        // 登录按钮
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) loginBtn.addEventListener('click', (e) => {
            e.preventDefault(); // 防止链接跳转
            this.showLoginModal();
        });

        // 注册按钮
        const registerBtn = document.querySelector('.register-btn');
        if (registerBtn) registerBtn.addEventListener('click', (e) => {
            e.preventDefault(); // 防止链接跳转
            this.showRegisterModal();
        });

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
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
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
        const phone = document.getElementById('registerPhone') ? document.getElementById('registerPhone').value.trim() : '';
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (!username || (!email && !phone) || !password || !confirmPassword) {
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
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, phone, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '注册失败');
            }

            this.showSuccess('registerSuccess', '注册成功！正在自动登录...');

            // Optionally auto-login or wait for user to login
            setTimeout(() => {
                this.closeModals();
                document.getElementById('registerForm').reset();
                // If the API returns a token/user on register, we could log them in here
                // For now, let's ask them to login
                this.showLoginModal();
            }, 1500);

        } catch (error) {
            console.error('注册错误:', error);
            this.showError('registerError', error.message || '注册失败');
        }
    }

    async handleLogin() {
        console.log('Handle Login called');
        const input = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const codeInput = document.getElementById('login2faCode');
        const code = codeInput ? codeInput.value.trim() : '';

        if (!input || !password) {
            this.showError('loginError', '请填写完整信息');
            return;
        }

        try {
            let url = `${API_BASE_URL}/auth/login`;
            let body = { username: input, password };

            // If 2FA input is visible and has value, verify it
            if (document.getElementById('login2faGroup').style.display !== 'none' && code) {
                url = `${API_BASE_URL}/auth/login/verify`;
                // For verify, we need userId which we don't store in UI easily, 
                // but the backend verify needs userId. 
                // Actually, let's store userId in a hidden field or memory when 2FA is requested.
                const userId = this.tempUserId;
                if (!userId) throw new Error('会话过期，请刷新重试');
                body = { userId, code };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '登录失败');
            }

            // Check for 2FA requirement
            if (data.require2fa) {
                this.tempUserId = data.userId;
                document.getElementById('login2faGroup').style.display = 'block';
                this.showSuccess('loginSuccess', '验证码已发送至您的邮箱，请输入验证码');
                return; // Stop here, wait for user to input code
            }

            // Login Success
            this.currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            if (data.token) localStorage.setItem('token', data.token);

            this.showSuccess('loginSuccess', '登录成功！');
            this.updateUI();

            setTimeout(() => {
                this.closeModals();
                document.getElementById('loginForm').reset();
                document.getElementById('login2faGroup').style.display = 'none';
                if (codeInput) codeInput.value = '';
                this.tempUserId = null;
            }, 1000);

        } catch (error) {
            console.error('登录错误:', error);
            this.showError('loginError', '登录失败：' + (error.message || '账号或密码错误'));
        }
    }

    async logout() {
        try {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            this.currentUser = null;
            this.updateUI();
            window.location.reload();
        } catch (error) {
            console.error('退出错误:', error);
        }
    }

    updateUI() {
        console.log('SupabaseAuth: updateUI called. CurrentUser:', this.currentUser);
        const loginBtn = document.querySelector('.login-btn');
        const registerBtn = document.querySelector('.register-btn');
        const userMenu = document.querySelector('.user-menu');

        console.log('SupabaseAuth: UI Elements found:', { loginBtn, registerBtn, userMenu });

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
