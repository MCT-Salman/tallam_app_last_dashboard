// // src/contexts/AuthContext.jsx
// import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
// import { login as apiLogin } from '@/api/api';
// import { startTokenMonitoring as startTokenMonitoringUtil, ensureValidToken, refreshAuthToken as refreshTokenUtil } from '@/utils/tokenManager';

// // eslint-disable-next-line react-refresh/only-export-components
// export const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(() => {
//     const storedUser = localStorage.getItem('user');
//     try {
//       return storedUser ? JSON.parse(storedUser) : null;
//     } catch (e) {
//       console.log(e)
//       localStorage.removeItem('user');
//       return null;
//     }
//   });

//   const [token, setToken] = useState(localStorage.getItem('accessToken'));
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [loading, setLoading] = useState(true); 
//   const tokenMonitoringRef = useRef(null); 

//  const login = useCallback(async (identifier, password) => {
//   try {
//     // لا تفعّل setLoading هنا — هذا يخص التهيئة فقط
//     const response = await apiLogin(identifier, password);
//     console.log('🔍 API Response:', response.data);
    
//     let accessToken, refreshToken, userData;

//     if (response.data.success && response.data.data) {
//       accessToken = response.data.data.accessToken;
//       refreshToken = response.data.data.refreshToken;
//       userData = response.data.data.user;
//     } else {
//       throw new Error('Invalid response format');
//     }

//     if (!accessToken) {
//       throw new Error('Access token not found in response');
//     }

//     localStorage.setItem('accessToken', accessToken);
//     if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
//     if (userData) localStorage.setItem('user', JSON.stringify(userData));

//     setToken(accessToken);
//     setUser(userData);
//     setIsAuthenticated(true);

//     return true;
//   } catch (error) {
//     console.error('Login failed:', error.response?.data?.message || error.message);
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('refreshToken');
//     localStorage.removeItem('user');
//     setIsAuthenticated(false);
//     // لا تغيّر setLoading هنا، خليه كما هو
//     throw error;
//   }
// }, []);


//   const logout = useCallback(() => {
//     setLoading(true);
    
//     // تنظيف localStorage
//     const keysToRemove = [];
//     for (let i = 0; i < localStorage.length; i++) {
//       const key = localStorage.key(i);
//       if (key && (
//         key.includes('accessToken') || 
//         key.includes('refreshToken') || 
//         key.includes('user') ||
//         key.includes('auth') ||
//         key.includes('token')
//       )) {
//         keysToRemove.push(key);
//       }
//     }
    
//     keysToRemove.forEach(key => localStorage.removeItem(key));
    
//     // تنظيف إضافي
//     ['accessToken', 'refreshToken', 'user'].forEach(key => 
//       localStorage.removeItem(key)
//     );
    
//     setToken(null);
//     setUser(null);
//     setIsAuthenticated(false);
//     setLoading(false);
    
//     console.log('✅ جميع بيانات المستخدم تم حذفها');
//   }, []);

//   // دالة محدثة لتحديث التوكن
//   const refreshAuthToken = useCallback(async () => {
//     try {
//       setLoading(true);
//       const newAccessToken = await refreshTokenUtil();
//       setToken(newAccessToken);
//       setLoading(false);
//       return newAccessToken;
//     } catch (error) {
//       setLoading(false);
//       logout();
//       throw error;
//     }
//   }, [logout]);

//   const validateToken = useCallback(() => {
//     const token = localStorage.getItem('accessToken');
//     if (!token) {
//       setIsAuthenticated(false);
//       return false;
//     }
    
//     try {
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       const expiry = payload.exp * 1000;
//       const isValid = Date.now() < expiry;
      
//       if (!isValid) {
//         logout();
//       }
      
//       setIsAuthenticated(isValid);
//       return isValid;
//     } catch (e) {
//       console.error('Invalid token format:', e);
//       logout();
//       return false;
//     }
//   }, [logout]);

//   const startTokenMonitoring = useCallback(() => {
//     if (tokenMonitoringRef.current) {
//       tokenMonitoringRef.current();
//     }
    
//     console.log('🔍 Starting automatic token monitoring...');
//     const stopMonitoring = startTokenMonitoringUtil(refreshAuthToken, 30 * 1000);
//     tokenMonitoringRef.current = stopMonitoring;
//   }, [refreshAuthToken]);

//   const stopTokenMonitoring = useCallback(() => {
//     if (tokenMonitoringRef.current) {
//       console.log('⏹️ Stopping token monitoring...');
//       tokenMonitoringRef.current();
//       tokenMonitoringRef.current = null;
//     }
//   }, []);

//   // التحقق من التوكن عند التحميل
//   useEffect(() => {
//     const initializeAuth = async () => {
//       const storedToken = localStorage.getItem('accessToken');
//       const storedUser = localStorage.getItem('user');
      
//       if (storedToken && storedUser) {
//         try {
//           const isValid = await ensureValidToken();
          
//           if (isValid) {
//             const user = JSON.parse(storedUser);
//             setToken(storedToken);
//             setUser(user);
//             setIsAuthenticated(true);
//             console.log('✅ User authenticated and token validated');
//           } else {
//             logout();
//           }
//         } catch (error) {
//           console.error('Error during authentication initialization:', error);
//           logout();
//         }
//       } else {
//         setIsAuthenticated(false);
//       }
      
//       setLoading(false);
//     };
    
//     initializeAuth();
//   }, [logout]);

//   // إدارة مراقبة التوكن
//   useEffect(() => {
//     if (isAuthenticated && token) {
//       startTokenMonitoring();
//     } else {
//       stopTokenMonitoring();
//     }
    
//     return () => {
//       stopTokenMonitoring();
//     };
//   }, [isAuthenticated, token, startTokenMonitoring, stopTokenMonitoring]);

//   const authContextValue = {
//     user,
//     token,
//     isAuthenticated,
//     loading,
//     login,
//     logout,
//     validateToken,
//     refreshAuthToken,
//     startTokenMonitoring,
//     stopTokenMonitoring,
//   };

//   return (
//     <AuthContext.Provider value={authContextValue}>
//       {children}
//     </AuthContext.Provider>
//   );
// };










// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { login as apiLogin } from '@/api/api';
import { startTokenMonitoring as startTokenMonitoringUtil, ensureValidToken, refreshAuthToken as refreshTokenUtil } from '@/utils/tokenManager';
import { setLogoutFunction } from '@/api/axiosInstance';
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Error parsing stored user:', e);
      localStorage.removeItem('user');
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const tokenMonitoringRef = useRef(null);

  // دالة مساعدة لإعادة التوجيه إلى Login باستخدام window.location
  const redirectToLogin = useCallback((message = '') => {
    console.log('🔄 Redirecting to login...');
    
    // تنظيف حالة المصادقة أولاً
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    
    // إعداد بيانات الرسالة لنقلها إلى صفحة Login
    const loginParams = new URLSearchParams();
    if (message) {
      loginParams.append('message', encodeURIComponent(message));
    }
    loginParams.append('sessionExpired', 'true');
    
    // استخدام setTimeout لتجنب مشاكل التحديث أثناء التصيير
    setTimeout(() => {
      window.location.href = `/login?${loginParams.toString()}`;
    }, 100);
  }, []);

  const login = useCallback(async (identifier, password) => {
    try {
      const response = await apiLogin(identifier, password);
      console.log('🔍 API Response:', response.data);
      
      let accessToken, refreshToken, userData;

      if (response.data.success && response.data.data) {
        accessToken = response.data.data.accessToken;
        refreshToken = response.data.data.refreshToken;
        userData = response.data.data.user;
      } else {
        throw new Error('Invalid response format');
      }

      if (!accessToken) {
        throw new Error('Access token not found in response');
      }

      // حفظ في localStorage
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (userData) localStorage.setItem('user', JSON.stringify(userData));

      // تحديث الحالة
      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
      setAuthChecked(true);

      console.log('✅ Login successful, starting token monitoring...');
      startTokenMonitoring();

      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      
      // تنظيف في حالة الفشل
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      throw error;
    }
  }, []);

  const logout = useCallback((message = '') => {
    console.log('🚪 Logging out...');
    
    setLoading(true);
    
    // إيقاف مراقبة التوكن أولاً
    stopTokenMonitoring();
    
    // تنظيف localStorage بشكل شامل
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('accessToken') || 
        key.includes('refreshToken') || 
        key.includes('user') ||
        key.includes('auth') ||
        key.includes('token') ||
        key.includes('session')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      console.log(`🗑️ Removing: ${key}`);
      localStorage.removeItem(key);
    });
    
    // تنظيف إضافي للتأكد
    ['accessToken', 'refreshToken', 'user', 'authToken', 'refreshToken'].forEach(key => {
      localStorage.removeItem(key);
    });
    
    // تحديث الحالة
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    setLoading(false);
    
    console.log('✅ جميع بيانات المستخدم تم حذفها');
    
    // إعادة التوجيه إلى صفحة Login
    redirectToLogin(message);
  }, [redirectToLogin]);

  useEffect(() => {
  console.log('🔗 ربط دالة logout مع axios instance...');
  setLogoutFunction(logout);
  
  return () => {
    setLogoutFunction(null);
  };
}, [logout]);

  // دالة محدثة لتحديث التوكن
  const refreshAuthToken = useCallback(async () => {
    try {
      console.log('🔄 Attempting to refresh token...');
      setLoading(true);
      const newAccessToken = await refreshTokenUtil();
      
      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
        setToken(newAccessToken);
        console.log('✅ Token refreshed successfully');
      }
      
      setLoading(false);
      return newAccessToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      setLoading(false);
      
      // إذا فشل تحديث التوكن، سجل الخروج
      logout('فشل في تجديد الجلسة، يرجى تسجيل الدخول مرة أخرى');
      throw error;
    }
  }, [logout]);


  const validateToken = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('❌ No token found');
      setIsAuthenticated(false);
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const isValid = Date.now() < expiry;
      
      if (!isValid) {
        console.log('❌ Token expired');
        logout('انتهت صلاحية الجلسة');
      } else {
        console.log('✅ Token is valid');
      }
      
      setIsAuthenticated(isValid);
      return isValid;
    } catch (e) {
      console.error('❌ Invalid token format:', e);
      logout('جلسة غير صالحة');
      return false;
    }
  }, [logout]);

  const startTokenMonitoring = useCallback(() => {
    // إيقاف أي مراقبة سابقة
    if (tokenMonitoringRef.current) {
      tokenMonitoringRef.current();
    }
    
    console.log('🔍 Starting automatic token monitoring...');
    
    try {
      const stopMonitoring = startTokenMonitoringUtil(
        refreshAuthToken,
        30 * 1000, // كل 30 ثانية
        logout // callback للفشل
      );
      
      tokenMonitoringRef.current = stopMonitoring;
      console.log('✅ Token monitoring started');
    } catch (error) {
      console.error('❌ Failed to start token monitoring:', error);
    }
  }, [refreshAuthToken, logout]);

  const stopTokenMonitoring = useCallback(() => {
    if (tokenMonitoringRef.current) {
      console.log('⏹️ Stopping token monitoring...');
      tokenMonitoringRef.current();
      tokenMonitoringRef.current = null;
    }
  }, []);

  // التحقق من التوكن عند التحميل الأولي
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 Initializing authentication...');
      
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          console.log('📋 Found stored token and user, validating...');
          
          const isValid = await ensureValidToken();
          
          if (isValid) {
            // تحقق إضافي من صلاحية التوكن
            try {
              const payload = JSON.parse(atob(storedToken.split('.')[1]));
              const expiry = payload.exp * 1000;
              const timeUntilExpiry = expiry - Date.now();
              
              console.log(`⏰ Token expires in: ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);
              
              // إذا بقي أقل من 10 دقائق على انتهاء الصلاحية، جدد التوكن
              if (timeUntilExpiry < 10 * 60 * 1000) {
                console.log('🔄 Token nearing expiry, refreshing...');
                await refreshAuthToken();
              }
              
              const user = JSON.parse(storedUser);
              setToken(storedToken);
              setUser(user);
              setIsAuthenticated(true);
              setAuthChecked(true);
              
              console.log('✅ User authenticated and token validated');
              
              // بدء مراقبة التوكن
              startTokenMonitoring();
              
            } catch (parseError) {
              console.error('❌ Error parsing token or user:', parseError);
              logout('خطأ في بيانات الجلسة');
            }
          } else {
            console.log('❌ Token validation failed during initialization');
            logout('فشل في التحقق من صحة الجلسة');
          }
        } catch (error) {
          console.error('❌ Error during authentication initialization:', error);
          logout('خطأ في تهيئة النظام');
        }
      } else {
        console.log('ℹ️ No stored authentication data found');
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, [logout, refreshAuthToken, startTokenMonitoring]);

  // إدارة مراقبة التوكن بناءً على حالة المصادقة
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('👀 Authentication active, monitoring tokens...');
      startTokenMonitoring();
    } else {
      console.log('👋 Authentication inactive, stopping monitoring...');
      stopTokenMonitoring();
    }
    
    return () => {
      stopTokenMonitoring();
    };
  }, [isAuthenticated, token, startTokenMonitoring, stopTokenMonitoring]);

  // تنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      stopTokenMonitoring();
    };
  }, [stopTokenMonitoring]);

  const authContextValue = {
    user,
    token,
    isAuthenticated,
    loading,
    authChecked, // حالة جديدة للإشارة إلى اكتمال التحقق من المصادقة
    login,
    logout,
    validateToken,
    refreshAuthToken,
    startTokenMonitoring,
    stopTokenMonitoring,
    redirectToLogin,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};