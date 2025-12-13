/**
 * 用户认证系统 - auth.js
 * 登录、注册、状态管理
 */

(function () {
    'use strict';

    // ==================== 用户管理类 ====================
    class AuthSystem {
        constructor() {
            this.currentUser = null;
            this.init();
        }

        init() {
            // 检查登录状态
            this.checkLoginStatus();
            // 绑定事件
            this.bindEvents();
        }

        // 检查登录状态
        checkLoginStatus() {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.updateUI();
            }
        }

        // 绑定事件
        bindEvents() {
            // 登录按钮
            const loginBtn = document.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => this.showLoginModal());
            }

            // 注册按钮  
            const registerBtn = document.querySelector('.register-btn');
            if (registerBtn) {
                registerBtn.addEventListener('click', () => this.showRegisterModal());
            }

            // 关闭按钮
            document.querySelectorAll('.auth-modal-close, .auth-modal-overlay').forEach(el => {
                el.addEventListener('click', (e) => {
                    if (e.target === el) {
                        this.closeModals();
                    }
                });
            });

            // 登录表单提交
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }

            // 注册表单提交
            const registerForm = document.getElementById('registerForm');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegister();
                });
            }

            // 切换到注册
            const switchToRegister = document.getElementById('switchToRegister');
            if (switchToRegister) {
                switchToRegister.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showRegisterModal();
                });
            }

            // 切换到登录
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

        // 显示登录弹窗
        showLoginModal() {
            this.closeModals();
            const modal = document.getElementById('loginModal');
            if (modal) {
                setTimeout(() => {
                    modal.classList.add('active');
                }, 100);
            }
        }

        // 显示注册弹窗
        showRegisterModal() {
            this.closeModals();
            const modal = document.getElementById('registerModal');
            if (modal) {
                setTimeout(() => {
                    modal.classList.add('active');
                }, 100);
            }
        }

        // 关闭所有弹窗
        closeModals() {
            document.querySelectorAll('.auth-modal-overlay').forEach(modal => {
                modal.classList.remove('active');
            });
            // 清除错误提示
            document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
                el.classList.remove('show');
            });
        }

        // 处理登录
        handleLogin() {
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            const remember = document.getElementById('loginRemember').checked;

            // 验证
            if (!username || !password) {
                this.showError('loginError', '请填写完整信息');
                return;
            }

            // 获取用户数据
            const users = this.getUsers();
            const user = users.find(u =>
                (u.username === username || u.email === username) &&
                this.decodePassword(u.password) === password
            );

            if (user) {
                // 登录成功
                this.currentUser = {
                    username: user.username,
                    email: user.email,
                    loginTime: new Date().toISOString()
                };

                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

                this.showSuccess('loginSuccess', '登录成功！');
                setTimeout(() => {
                    this.closeModals();
                    this.updateUI();
                }, 1000);
            } else {
                this.showError('loginError', '用户名或密码错误');
            }
        }

        // 处理注册
        handleRegister() {
            const username = document.getElementById('registerUsername').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;

            // 验证
            if (!username || !email || !password || !confirmPassword) {
                this.showError('registerError', '请填写完整信息');
                return;
            }

            if (username.length < 3) {
                this.showError('registerError', '用户名至少3个字符');
                return;
            }

            if (!this.validateEmail(email)) {
                this.showError('registerError', '请输入有效的邮箱地址');
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

            // 检查用户是否已存在
            const users = this.getUsers();
            if (users.find(u => u.username === username)) {
                this.showError('registerError', '用户名已存在');
                return;
            }

            if (users.find(u => u.email === email)) {
                this.showError('registerError', '邮箱已被注册');
                return;
            }

            // 注册用户
            const newUser = {
                username,
                email,
                password: this.encodePassword(password),
                registerTime: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            this.showSuccess('registerSuccess', '注册成功！即将跳转登录...');

            // 清空表单
            document.getElementById('registerForm').reset();

            setTimeout(() => {
                this.showLoginModal();
            }, 1500);
        }

        // 退出登录
        logout() {
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            this.updateUI();
            alert('已退出登录');
        }

        // 更新UI
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
                    // 更新用户信息
                    const avatar = userMenu.querySelector('.user-avatar');
                    const userName = userMenu.querySelector('.user-dropdown-name');
                    const userEmail = userMenu.querySelector('.user-dropdown-email');

                    if (avatar) avatar.textContent = this.currentUser.username.charAt(0).toUpperCase();
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

        // 工具函数
        getUsers() {
            const users = localStorage.getItem('users');
            return users ? JSON.parse(users) : [];
        }

        encodePassword(password) {
            return btoa(password); // 简单Base64编码
        }

        decodePassword(encoded) {
            try {
                return atob(encoded);
            } catch (e) {
                return '';
            }
        }

        validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        showError(elementId, message) {
            const errorEl = document.getElementById(elementId);
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.classList.add('show');
                setTimeout(() => {
                    errorEl.classList.remove('show');
                }, 3000);
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
    document.addEventListener('DOMContentLoaded', () => {
        window.authSystem = new AuthSystem();
        console.log('🔐 认证系统已加载');
    });

})();
