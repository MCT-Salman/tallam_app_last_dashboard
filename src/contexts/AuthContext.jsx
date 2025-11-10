// src/contexts/AuthContext.jsx
import{ createContext, useState, useEffect, useCallback, useRef } from 'react';
import { login as apiLogin } from '@/api/api';
import { startTokenMonitoring as startTokenMonitoringUtil,
   ensureValidToken, refreshAuthToken as refreshTokenUtil } from '@/utils/tokenManager';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.log(e)
      localStorage.removeItem('user');
      return null;
    }
  });

  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 
  const tokenMonitoringRef = useRef(null); 

 const login = useCallback(async (identifier, password) => {
  try {
    // لا تفعّل setLoading هنا — هذا يخص التهيئة فقط
    const response = await apiLogin(identifier, password);
    console.log(' API Response:', response.data);
    
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

    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (userData) localStorage.setItem('user', JSON.stringify(userData));

    setToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);

    return true;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setLoading(true);
    throw error;
  }
}, []);


  const logout = useCallback(() => {
    setLoading(true);
    
    // تنظيف localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('accessToken') || 
        key.includes('refreshToken') || 
        key.includes('user') ||
        key.includes('auth') ||
        key.includes('token')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // تنظيف إضافي
    ['accessToken', 'refreshToken', 'user'].forEach(key => 
      localStorage.removeItem(key)
    );
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    
    console.log(' جميع بيانات المستخدم تم حذفها');
  }, []);

  // دالة محدثة لتحديث التوكن
  const refreshAuthToken = useCallback(async () => {
    try {
      setLoading(true);
      const newAccessToken = await refreshTokenUtil();
      setToken(newAccessToken);
      setLoading(false);
      return newAccessToken;
    } catch (error) {
      setLoading(false);
      logout();
      throw error;
    }
  }, [logout]);

  const validateToken = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsAuthenticated(false);
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const isValid = Date.now() < expiry;
      
      if (!isValid) {
        logout();
      }
      
      setIsAuthenticated(isValid);
      return isValid;
    } catch (e) {
      console.error('Invalid token format:', e);
      logout();
      return false;
    }
  }, [logout]);

  const startTokenMonitoring = useCallback(() => {
    if (tokenMonitoringRef.current) {
      tokenMonitoringRef.current();
    }
    
    console.log(' Starting automatic token monitoring...');
    const stopMonitoring = startTokenMonitoringUtil(refreshAuthToken, 30 * 1000);
    tokenMonitoringRef.current = stopMonitoring;
  }, [refreshAuthToken]);

  const stopTokenMonitoring = useCallback(() => {
    if (tokenMonitoringRef.current) {
      console.log(' Stopping token monitoring...');
      tokenMonitoringRef.current();
      tokenMonitoringRef.current = null;
    }
  }, []);

  // التحقق من التوكن عند التحميل
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const isValid = await ensureValidToken();
          
          if (isValid) {
            const user = JSON.parse(storedUser);
            setToken(storedToken);
            setUser(user);
            setIsAuthenticated(true);
            console.log(' User authenticated and token validated');
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error during authentication initialization:', error);
          logout();
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, [logout]);

  // إدارة مراقبة التوكن
  useEffect(() => {
    if (isAuthenticated && token) {
      startTokenMonitoring();
    } else {
      stopTokenMonitoring();
    }
    
    return () => {
      stopTokenMonitoring();
    };
  }, [isAuthenticated, token, startTokenMonitoring, stopTokenMonitoring]);

  const authContextValue = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    validateToken,
    refreshAuthToken,
    startTokenMonitoring,
    stopTokenMonitoring,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
