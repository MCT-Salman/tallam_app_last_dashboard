// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "https://dev.tallaam.com/api",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// متغير لحفظ دالة logout
let globalLogout = null;

// دالة لتعيين دالة logout من AuthContext
export const setLogoutFunction = (logoutFn) => {
  console.log('🔗 Setting logout function in axios instance');
  globalLogout = logoutFn;
};

// request interceptor لإضافة التوكن
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// response interceptor للتعامل مع الأخطاء
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('🔍 API Error Details:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    const { response } = error;

    // الحالة 1: success: false و message: "تم إلغاء الجلسة"
    if (response?.data?.success === false && response.data.message === 'تم إلغاء الجلسة') {
      console.log('🚨 INTERCEPTOR: تم اكتشاف إلغاء الجلسة من السيرفر');
      if (globalLogout) {
        console.log('🔄 استدعاء دالة logout...');
        globalLogout('تم إلغاء الجلسة، يرجى تسجيل الدخول مرة أخرى');
      } else {
        console.error('❌ دالة logout غير معرفة في الـ interceptor');
      }
      return Promise.reject(new Error('Session cancelled'));
    }

    // الحالة 2: خطأ 401
    if (response?.status === 401) {
      console.log('🚨 INTERCEPTOR: حالة غير مصرح بها (401)');
      if (globalLogout) {
        console.log('🔄 استدعاء دالة logout...');
        globalLogout('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
      }
      return Promise.reject(new Error('Unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;