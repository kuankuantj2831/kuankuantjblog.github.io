import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const BASE_URL = 'https://api.mcock.cn/v1';

// 创建 axios 实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    // 添加认证 token
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加设备信息
    const deviceId = await DeviceInfo.getUniqueId();
    config.headers['X-Device-ID'] = deviceId;
    config.headers['X-Platform'] = Platform.OS;
    config.headers['X-App-Version'] = DeviceInfo.getVersion();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token 过期，清除并跳转到登录
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_info');
      
      // 触发登录过期事件
      // 这里可以通过 EventEmitter 或全局状态管理来通知
    }

    if (error.response?.status === 429) {
      // 请求过于频繁
      console.warn('请求过于频繁，请稍后再试');
    }

    return Promise.reject(error);
  }
);

// 导出请求方法
export const api = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  delete: apiClient.delete,
  patch: apiClient.patch,
};
