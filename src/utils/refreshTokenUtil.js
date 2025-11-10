// src\utils\refreshTokenUtil.js
import { refreshToken } from '@/api/api';

/**
 * دالة لتحديث التوكن باستخدام توكن تحديث محدد
 * @param {string} refreshTokenValue - قيمة توكن التحديث
 * @returns {Promise<Object>} - استجابة الخادم مع التوكن الجديد
 */
export const refreshUserToken = async (refreshTokenValue) => {
  try {
    console.log(' Attempting to refresh token...');
    
    const response = await refreshToken(refreshTokenValue);
    
    console.log(' Token refresh successful:', response.data);
    
    return {
      success: true,
      data: response.data,
      message: 'Token refreshed successfully'
    };
    
  } catch (error) {
    console.error(' Token refresh failed:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      data: null
    };
  }
};

/**
 * دالة لتحديث التوكن باستخدام التوكن المخزن في localStorage
 * @returns {Promise<Object>} - استجابة الخادم مع التوكن الجديد
 */
export const refreshStoredToken = async () => {
  const storedRefreshToken = localStorage.getItem('refreshToken');
  
  if (!storedRefreshToken) {
    return {
      success: false,
      error: 'No refresh token found in localStorage',
      data: null
    };
  }
  
  return await refreshUserToken(storedRefreshToken);
};
