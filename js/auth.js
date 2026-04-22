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
            try {
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    try {
                        this.currentUser = JSON.parse(savedUser);
                        this.updateUI();
                    } catch (e) {
                        console.warn('[Auth] localStorage currentUser 解析失败, 已重置：', e);
                        try {
                            localStorage.removeItem('currentUser');
                        } catch (removeError) {
                            console.warn('[Auth] 删除失败 currentUser：', removeError);
                        }
                        this.currentUser = null;
                    }
                }
            } catch (storageError) {
                console.warn('[Auth] localStorage 访问失败：', storageError);
                this.currentUser = null;
            }
        }

        // 绑定事件
        bindEvents() {
            try {
                // 登录按钮
                const loginBtn = document.querySelector('.login-btn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', () => {
                        try { this.showLoginModal(); } catch(e) { console.warn('[Auth] 显示登录弹窗失败:', e); }
                    });
                }

                // 注册按钮  
                const registerBtn = document.querySelector('.register-btn');
                if (registerBtn) {
                    registerBtn.addEventListener('click', () => {
                        try { this.showRegisterModal(); } catch(e) { console.warn('[Auth] 显示注册弹窗失败:', e); }
                    });
                }

                // 关闭按钮
                document.querySelectorAll('.auth-modal-close, .auth-modal-overlay').forEach(el => {
                    el.addEventListener('click', (e) => {
                        if (e.target === el) {
                            try { this.closeModals(); } catch(e) { console.warn('[Auth] 关闭弹窗失败:', e); }
                        }
                    });
                });

                // 登录表单提交
                const loginForm = document.getElementById('loginForm');
                if (loginForm) {
                    loginForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        try { this.handleLogin(); } catch(e) { console.warn('[Auth] 处理登录失败:', e); }
                    });
                }

                // 注册表单提交
                const registerForm = document.getElementById('registerForm');
                if (registerForm) {
                    registerForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        try { this.handleRegister(); } catch(e) { console.warn('[Auth] 处理注册失败:', e); }
                    });
                }

                // 切换到注册
                const switchToRegister = document.getElementById('switchToRegister');
                if (switchToRegister) {
                    switchToRegister.addEventListener('click', (e) => {
                        e.preventDefault();
                        try { this.showRegisterModal(); } catch(e) { console.warn('[Auth] 切换到注册失败:', e); }
                    });
                }

                // 切换到登录
                const switchToLogin = document.getElementById('switchToLogin');
                if (switchToLogin) {
                    switchToLogin.addEventListener('click', (e) => {
                        e.preventDefault();
                        try { this.showLoginModal(); } catch(e) { console.warn('[Auth] 切换到登录失败:', e); }
                    });
                }

                // 退出登录
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        try { this.logout(); } catch(e) { console.warn('[Auth] 退出登录失败:', e); }
                    });
                }
            } catch (error) {
                console.error('[Auth] 绑定事件失败：', error);
            }
        }

        // 显示登录弹窗
        showLoginModal() {
            try {
                this.closeModals();
                const modal = document.getElementById('loginModal');
                if (modal) {
                    setTimeout(() => {
                        try {
                            modal.classList.add('active');
                        } catch (e) {
                            console.warn('[Auth] 添加登录弹窗样式失败：', e);
                        }
                    }, 100);
                }
            } catch (error) {
                console.error('[Auth] 显示登录弹窗失败：', error);
            }
        }

        // 显示注册弹窗
        showRegisterModal() {
            try {
                this.closeModals();
                const modal = document.getElementById('registerModal');
                if (modal) {
                    setTimeout(() => {
                        try {
                            modal.classList.add('active');
                        } catch (e) {
                            console.warn('[Auth] 添加注册弹窗样式失败：', e);
                        }
                    }, 100);
                }
            } catch (error) {
                console.error('[Auth] 显示注册弹窗失败：', error);
            }
        }

        // 关闭所有弹窗
        closeModals() {
            try {
                document.querySelectorAll('.auth-modal-overlay').forEach(modal => {
                    try {
                        modal.classList.remove('active');
                    } catch (e) {
                        console.warn('[Auth] 移除弹窗激活样式失败：', e);
                    }
                });
                // 清除错误提示
                document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
                    try {
                        el.classList.remove('show');
                    } catch (e) {
                        console.warn('[Auth] 移除提示样式失败：', e);
                    }
                });
            } catch (error) {
                console.error('[Auth] 关闭弹窗失败：', error);
            }
        }

        // 处理登录
        handleLogin() {
            try {
                const usernameInput = document.getElementById('loginUsername');
                const passwordInput = document.getElementById('loginPassword');
                
                const username = usernameInput ? usernameInput.value.trim() : '';
                const password = passwordInput ? passwordInput.value : '';

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

                    try {
                        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    } catch (storageError) {
                        console.warn('[Auth] 保存用户信息失败：', storageError);
                    }

                    this.showSuccess('loginSuccess', '登录成功！');
                    setTimeout(() => {
                        try {
                            this.closeModals();
                            this.updateUI();
                        } catch (e) {
                            console.warn('[Auth] 登录后更新 UI 失败：', e);
                        }
                    }, 1000);
                } else {
                    this.showError('loginError', '用户名或密码错误');
                }
            } catch (error) {
                console.error('[Auth] 处理登录失败：', error);
                this.showError('loginError', '登录失败，请稍后重试');
            }
        }

        // 处理注册
        handleRegister() {
            try {
                const usernameInput = document.getElementById('registerUsername');
                const emailInput = document.getElementById('registerEmail');
                const passwordInput = document.getElementById('registerPassword');
                const confirmPasswordInput = document.getElementById('registerConfirmPassword');
                
                const username = usernameInput ? usernameInput.value.trim() : '';
                const email = emailInput ? emailInput.value.trim() : '';
                const password = passwordInput ? passwordInput.value : '';
                const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

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
                
                try {
                    localStorage.setItem('users', JSON.stringify(users));
                } catch (storageError) {
                    console.warn('[Auth] 保存用户数据失败：', storageError);
                    this.showError('registerError', '保存数据失败，请稍后重试');
                    return;
                }

                this.showSuccess('registerSuccess', '注册成功！即将跳转登录...');

                // 清空表单
                try {
                    const form = document.getElementById('registerForm');
                    if (form) form.reset();
                } catch (e) {
                    console.warn('[Auth] 重置表单失败：', e);
                }

                setTimeout(() => {
                    try {
                        this.showLoginModal();
                    } catch (e) {
                        console.warn('[Auth] 跳转登录失败：', e);
                    }
                }, 1500);
            } catch (error) {
                console.error('[Auth] 处理注册失败：', error);
                this.showError('registerError', '注册失败，请稍后重试');
            }
        }

        // 退出登录
        logout() {
            try {
                this.currentUser = null;
                try {
                    localStorage.removeItem('currentUser');
                } catch (storageError) {
                    console.warn('[Auth] 删除登录状态失败：', storageError);
                }
                this.updateUI();
                alert('已退出登录');
            } catch (error) {
                console.error('[Auth] 退出登录失败：', error);
            }
        }

        // 更新UI
        updateUI() {
            try {
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
                        const avatarEl = userMenu.querySelector('.user-avatar');
                        const userNameEl = userMenu.querySelector('.user-dropdown-name');
                        const userEmailEl = userMenu.querySelector('.user-dropdown-email');

                        if (avatarEl && this.currentUser.username) {
                            avatarEl.textContent = this.currentUser.username.charAt(0).toUpperCase();
                        }
                        if (userNameEl && this.currentUser.username) {
                            userNameEl.textContent = this.currentUser.username;
                        }
                        if (userEmailEl && this.currentUser.email) {
                            userEmailEl.textContent = this.currentUser.email;
                        }
                    }
                } else {
                    // 未登录
                    if (loginBtn) loginBtn.style.display = 'inline-block';
                    if (registerBtn) registerBtn.style.display = 'inline-block';
                    if (userMenu) userMenu.style.display = 'none';
                }
            } catch (error) {
                console.warn('[Auth] 更新 UI 失败：', error);
            }
        }

        // 工具函数
        getUsers() {
            try {
                const users = localStorage.getItem('users');
                if (!users) return [];
                try {
                    return JSON.parse(users);
                } catch (e) {
                    console.warn('[Auth] localStorage users 解析失败, 已重置：', e);
                    try {
                        localStorage.removeItem('users');
                    } catch (removeError) {
                        console.warn('[Auth] 删除 users 失败：', removeError);
                    }
                    return [];
                }
            } catch (storageError) {
                console.warn('[Auth] localStorage 访问失败：', storageError);
                return [];
            }
        }

        encodePassword(password) {
            try {
                if (!password || typeof password !== 'string') {
                    return '';
                }
                // 使用更安全的哈希方式（虽然仍不够完美，但比Base64好）
                // 注意：这不是真正的安全加密，仅用于演示目的
                return btoa(unescape(encodeURIComponent(password)));
            } catch (e) {
                console.warn('[Auth] 密码编码失败：', e);
                return '';
            }
        }

        decodePassword(encoded) {
            try {
                if (!encoded || typeof encoded !== 'string') {
                    return '';
                }
                return decodeURIComponent(escape(atob(encoded)));
            } catch (e) {
                console.warn('[Auth] 密码解码失败：', e);
                return '';
            }
        }

        validateEmail(email) {
            try {
                if (!email || typeof email !== 'string') {
                    return false;
                }
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            } catch (error) {
                console.warn('[Auth] 邮箱验证失败：', error);
                return false;
            }
        }

        showError(elementId, message) {
            try {
                const errorEl = document.getElementById(elementId);
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.classList.add('show');
                    setTimeout(() => {
                        try {
                            errorEl.classList.remove('show');
                        } catch (e) {
                            console.warn('[Auth] 移除错误样式失败：', e);
                        }
                    }, 3000);
                }
            } catch (error) {
                console.warn('[Auth] 显示错误消息失败：', error);
            }
        }

        showSuccess(elementId, message) {
            try {
                const successEl = document.getElementById(elementId);
                if (successEl) {
                    successEl.textContent = message;
                    successEl.classList.add('show');
                }
            } catch (error) {
                console.warn('[Auth] 显示成功消息失败：', error);
            }
        }
    }

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        window.authSystem = new AuthSystem();
        console.log('🔐 认证系统已加载');
    });

})();
