App({
  globalData: {
    userInfo: null,
    token: null,
    apiBaseUrl: 'https://api.mcock.cn/v1',
    appVersion: '1.0.0',
    systemInfo: null
  },

  onLaunch: function() {
    // 获取系统信息
    this.getSystemInfo();
    
    // 检查更新
    this.checkForUpdate();
    
    // 初始化存储
    this.initStorage();
    
    // 检查登录状态
    this.checkLoginStatus();
    
    console.log('App Launch');
  },

  onShow: function(options) {
    console.log('App Show', options);
    // 记录启动场景
    this.logLaunchScene(options);
  },

  onHide: function() {
    console.log('App Hide');
  },

  onError: function(msg) {
    console.error('App Error:', msg);
    // 上报错误
    this.reportError(msg);
  },

  // 获取系统信息
  getSystemInfo: function() {
    const that = this;
    wx.getSystemInfo({
      success: function(res) {
        that.globalData.systemInfo = res;
        console.log('SystemInfo:', res);
      }
    });
  },

  // 检查小程序更新
  checkForUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate(function(res) {
        console.log('检查更新:', res.hasUpdate);
      });

      updateManager.onUpdateReady(function() {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function(res) {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(function() {
        wx.showModal({
          title: '更新提示',
          content: '新版本下载失败，请检查网络后重试',
          showCancel: false
        });
      });
    }
  },

  // 初始化存储
  initStorage: function() {
    try {
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (token) {
        this.globalData.token = token;
      }
      if (userInfo) {
        this.globalData.userInfo = userInfo;
      }
    } catch (e) {
      console.error('Storage init failed:', e);
    }
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const token = this.globalData.token;
    if (!token) {
      return;
    }

    // 验证 token 有效性
    wx.request({
      url: `${this.globalData.apiBaseUrl}/auth/verify`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode !== 200) {
          // Token 失效，清除登录信息
          this.clearLoginInfo();
        }
      },
      fail: () => {
        console.error('Check login status failed');
      }
    });
  },

  // 清除登录信息
  clearLoginInfo: function() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  },

  // 记录启动场景
  logLaunchScene: function(options) {
    const scene = options.scene;
    console.log('Launch scene:', scene);
    
    // 可以发送到服务器进行分析
    wx.request({
      url: `${this.globalData.apiBaseUrl}/analytics/launch`,
      method: 'POST',
      data: {
        scene: scene,
        path: options.path,
        query: options.query,
        timestamp: new Date().toISOString()
      }
    });
  },

  // 上报错误
  reportError: function(msg) {
    wx.request({
      url: `${this.globalData.apiBaseUrl}/errors/report`,
      method: 'POST',
      data: {
        error: msg,
        systemInfo: this.globalData.systemInfo,
        timestamp: new Date().toISOString()
      }
    });
  },

  // 全局请求封装
  request: function(options) {
    const that = this;
    const token = this.globalData.token;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: options.url.startsWith('http') ? options.url : `${this.globalData.apiBaseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // 未授权，清除登录状态并跳转登录
            that.clearLoginInfo();
            wx.navigateTo({
              url: '/pages/login/login'
            });
            reject(new Error('Unauthorized'));
          } else {
            reject(new Error(res.data.message || 'Request failed'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
});
