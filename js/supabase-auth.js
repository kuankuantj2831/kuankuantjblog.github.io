
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

        // 找回密码链接
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        const loginFormContainer = document.getElementById('loginForm');
        const resetPasswordForm = document.getElementById('resetPasswordForm');
        const backToLogin = document.getElementById('backToLogin');

        if (forgotPasswordLink && loginFormContainer && resetPasswordForm) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginFormContainer.style.display = 'none';
                resetPasswordForm.style.display = 'block';
                document.querySelector('#loginModal .auth-title').textContent = '重置密码';
                document.querySelector('#loginModal .auth-subtitle').style.display = 'none';
                this.showError('loginError', ''); // Clear errors
                this.showSuccess('loginSuccess', '');
            });
        }

        if (backToLogin) {
            backToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                resetPasswordForm.style.display = 'none';
                loginFormContainer.style.display = 'block';
                document.querySelector('#loginModal .auth-title').textContent = '登录';
                document.querySelector('#loginModal .auth-subtitle').style.display = 'block';
                this.showError('loginError', '');
                this.showSuccess('loginSuccess', '');
            });
        }

        // 发送重置验证码
        const sendResetCodeBtn = document.getElementById('sendResetCodeBtn');
        if (sendResetCodeBtn) {
            sendResetCodeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSendResetCode();
            });
        }

        // 重置密码表单提交
        if (resetPasswordForm) {
            resetPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleResetPassword();
            });
        }
    }

    async handleSendResetCode() {
        const emailInput = document.getElementById('resetEmail');
        const email = emailInput.value.trim();
        const sendBtn = document.getElementById('sendResetCodeBtn');

        if (!email) {
            this.showError('loginError', '请输入邮箱地址');
            return;
        }

        if (sendBtn.disabled) return;

        try {
            sendBtn.disabled = true;
            sendBtn.textContent = '发送中...';

            const response = await fetch(`${API_BASE_URL}/auth/send-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || '发送失败');

            this.showSuccess('loginSuccess', '验证码已发送，请检查邮箱');

            // Countdown
            let count = 60;
            const timer = setInterval(() => {
                count--;
                sendBtn.textContent = `${count}s后重试`;
                if (count <= 0) {
                    clearInterval(timer);
                    sendBtn.disabled = false;
                    sendBtn.textContent = '获取验证码';
                }
            }, 1000);

        } catch (error) {
            console.error(error);
            this.showError('loginError', error.message);
            sendBtn.disabled = false;
            sendBtn.textContent = '获取验证码';
        }
    }

    async handleResetPassword() {
        const email = document.getElementById('resetEmail').value.trim();
        const code = document.getElementById('resetCode').value.trim();
        const newPassword = document.getElementById('resetNewPassword').value;
        const submitBtn = document.querySelector('#resetPasswordForm button[type="submit"]');

        if (!email || !code || !newPassword) {
            this.showError('loginError', '请填写完整信息');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';

            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || '重置失败');

            this.showSuccess('loginSuccess', '密码重置成功！请重新登录');

            setTimeout(() => {
                // Switch back to login
                document.getElementById('backToLogin').click();
                document.getElementById('resetPasswordForm').reset();
            }, 2000);

        } catch (error) {
            this.showError('loginError', error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '➔ 重置密码';
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
        if (this.isLoginSubmitting) return;
        this.isLoginSubmitting = true;

        console.log('Handle Login called');
        const input = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const codeInput = document.getElementById('login2faCode');
        const code = codeInput ? codeInput.value.trim() : '';
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

        // Clear previous messages
        this.showError('loginError', '');
        document.getElementById('loginError').classList.remove('show');
        // Do NOT clear loginSuccess if it contains the "Code sent" message and we are verifying
        // Actually, better to clear only if restarting or erroring

        if (!input || !password) {
            this.showError('loginError', '请填写完整信息');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '处理中...';
            submitBtn.style.opacity = '0.7';
            submitBtn.style.cursor = 'not-allowed';
        }

        try {
            let url = `${API_BASE_URL}/auth/login`;
            let body = { username: input, password };

            // If 2FA input is visible and has value, verify it
            if (document.getElementById('login2faGroup').style.display !== 'none' && code) {
                // Clear the "Code sent" success message to avoid confusion
                const successEl = document.getElementById('loginSuccess');
                if (successEl) {
                    successEl.classList.remove('show');
                    successEl.textContent = '';
                }

                url = `${API_BASE_URL}/auth/login/verify`;
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

            this.showSuccess('loginSuccess', '登录成功！正在跳转...');
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
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '登录';
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
            this.isLoginSubmitting = false;
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
