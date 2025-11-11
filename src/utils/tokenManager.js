
import { refreshToken as apiRefreshToken } from '@/api/api';

// ثوابت للتكوين
const TOKEN_CONFIG = {
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 دقائق
  MONITORING_INTERVAL: 30 * 1000,    // 30 ثانية
  RETRY_ATTEMPTS: 3,                 // عدد محاولات إعادة المحاولة
  RETRY_DELAY: 1000                  // تأخير بين المحاولات (بالمللي ثانية)
};

/**
 * دالة للتحقق من صلاحية التوكن
 * @param {string} token - التوكن المراد التحقق منه
 * @returns {Object} معلومات صلاحية التوكن
 */
export const checkTokenValidity = (token) => {
  if (!token) {
    return { isValid: false, timeUntilExpiry: 0, needsRefresh: false };
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    const timeUntilExpiry = expiry - Date.now();
    
    return {
      isValid: timeUntilExpiry > 0,
      timeUntilExpiry,
      needsRefresh: timeUntilExpiry < TOKEN_CONFIG.REFRESH_THRESHOLD,
      expiryTime: new Date(expiry)
    };
  } catch (error) {
    console.error(' Error checking token validity:', error);
    return { isValid: false, timeUntilExpiry: 0, needsRefresh: false };
  }
};

/**
 * دالة لتحديث التوكن مع إعادة المحاولة
 * @returns {Promise<string>} التوكن الجديد
 */
export const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('لا يوجد توكن تحديث متاح');
  }

  let lastError;
  for (let attempt = 1; attempt <= TOKEN_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await apiRefreshToken(refreshToken);
      console.log(' استجابة تحديث التوكن:', response.data);
      
      const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
      if (!newAccessToken) {
        throw new Error('لم يتم العثور على توكن جديد في الاستجابة');
      }
      
      localStorage.setItem('accessToken', newAccessToken);
      console.log(' تم تحديث التوكن بنجاح');
      return newAccessToken;
    } catch (error) {
      lastError = error;
      console.warn(` فشلت محاولة تحديث التوكن ${attempt}/${TOKEN_CONFIG.RETRY_ATTEMPTS}:`, error.message);
      
      if (attempt < TOKEN_CONFIG.RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, TOKEN_CONFIG.RETRY_DELAY));
      }
    }
  }

  throw lastError;
};

/**
 * دالة للتحقق من صلاحية التوكن وتحديثه إذا لزم الأمر
 * @returns {Promise<boolean>} نجاح العملية
 */
export const ensureValidToken = async () => {
  const token = localStorage.getItem('accessToken');
  const tokenStatus = checkTokenValidity(token);

  if (!tokenStatus.isValid) {
    console.log(' التوكن غير صالح');
    // حاول تحديث التوكن إذا كان هناك refreshToken
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }
    try {
      await refreshAuthToken();
      return true;
    } catch (e) {
      return false;
    }
  }

  if (tokenStatus.needsRefresh) {
    try {
      console.log(' التوكن على وشك الانتهاء، جاري التحديث...');
      await refreshAuthToken();
      return true;
    } catch (error) {
      console.error(' فشل تحديث التوكن:', error);
      return false;
    }
  }

  return true;
};

/**
 * دالة لبدء مراقبة التوكن
 * @returns {Function} دالة لإيقاف المراقبة
 */
export const startTokenMonitoring = () => {
  console.log(` بدء مراقبة التوكن بفاصل زمني: ${TOKEN_CONFIG.MONITORING_INTERVAL}ms`);
  
  const monitor = setInterval(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const tokenStatus = checkTokenValidity(token);
      
      console.log(` حالة التوكن: ${Math.round(tokenStatus.timeUntilExpiry / 1000)} ثانية حتى الانتهاء`);
      
      if (tokenStatus.needsRefresh) {
        await refreshAuthToken();
      }
    } catch (error) {
      console.error(' خطأ في مراقبة التوكن:', error);
    }
  }, TOKEN_CONFIG.MONITORING_INTERVAL);

  return () => {
    console.log(' إيقاف مراقبة التوكن');
    clearInterval(monitor);
  };
};