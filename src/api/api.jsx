// src\api\api.jsxو// src\api\api.jsx
import axios from 'axios';
import axiosInstance, { setLogoutFunction } from './axiosInstance';

// const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.3.11:5000/api';
const BASE_URL = import.meta.env.VITE_BASE_URL || "https://dev.tallaam.com";
const API_URL = import.meta.env.REACT_APP_API_URL || 'https://dev.tallaam.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// const api = axiosInstance;

// Interceptor لإضافة توكن JWT إلى كل طلب مصادق عليه
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            // تأكد من أن هذا الهيدر يتطابق مع ما يتوقعه الـ Backend (authJwt.js)
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// تكوين ثوابت لمحاولات إعادة المحاولة والتأخير
const RETRY_CONFIG = {
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // ميلي ثانية
    TOKEN_REFRESH_COOLDOWN: 5000 // 5 ثواني بين محاولات تحديث التوكن
};

let lastTokenRefreshTimestamp = 0;

// Interceptor لمعالجة أخطاء المصادقة وتحديث التوكن
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const currentTime = Date.now();

        // التحقق من حالة الخطأ وعدد المحاولات
        if ((error.response?.status === 401 || error.response?.status === 400) &&
            !originalRequest._retry &&
            originalRequest._retryCount < RETRY_CONFIG.MAX_RETRY_ATTEMPTS) {

            // التحقق من وقت التبريد بين محاولات تحديث التوكن
            if (currentTime - lastTokenRefreshTimestamp < RETRY_CONFIG.TOKEN_REFRESH_COOLDOWN) {
                console.log('⏳ Waiting for token refresh cooldown...');
                await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.TOKEN_REFRESH_COOLDOWN));
            }

            originalRequest._retry = true;
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    console.log(`🔄 Attempting to refresh token (attempt ${originalRequest._retryCount}/${RETRY_CONFIG.MAX_RETRY_ATTEMPTS})...`);

                    lastTokenRefreshTimestamp = currentTime;
                    const response = await api.post('/auth/refresh', { refreshToken });

                    const { data } = response.data;
                    if (!data?.accessToken || !data?.refreshToken) {
                        throw new Error('لم يتم العثور على التوكن الجديد في الاستجابة');
                    }

                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    console.log('✅ تم تحديث التوكن بنجاح');

                    originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;

                    // إضافة تأخير قبل إعادة المحاولة
                    await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.RETRY_DELAY));
                    console.log('🔄 إعادة محاولة الطلب الأصلي مع التوكن الجديد...');
                    return api(originalRequest);

                } catch (refreshError) {
                    console.error('❌ فشل تحديث التوكن:', refreshError.response?.data?.message || refreshError.message);

                    if (originalRequest._retryCount >= RETRY_CONFIG.MAX_RETRY_ATTEMPTS) {
                        console.error('❌ تم استنفاد جميع محاولات تحديث التوكن');
                        clearAllAuthData();
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    }

                    // إضافة تأخير قبل المحاولة التالية
                    await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.RETRY_DELAY));
                    return api(originalRequest);
                }
            } else {
                console.error('❌ لا يوجد توكن تحديث متاح');
                clearAllAuthData();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// وظيفة لحذف جميع بيانات المصادقة
function clearAllAuthData() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // حذف جميع المفاتيح المتعلقة بالتطبيق
        if (key && (
            key.includes('accessToken') ||
            key.includes('refreshToken') ||
            key.includes('user') ||
            key.includes('auth') ||
            key.includes('token') ||
            key.startsWith('tallaam_') ||
            key.startsWith('app_')
        )) {
            keysToRemove.push(key);
        }
    }

    // حذف جميع المفاتيح المحددة
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });

    // حذف البيانات الأساسية بشكل صريح للتأكد
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('app_settings');
    localStorage.removeItem('language');

    console.log('🗑️ تم حذف جميع بيانات المصادقة من localStorage');
}

export const login = (identifier, password) => api.post('/admin/login', { identifier, password });

// دالة لتحديث التوكن باستخدام endpoint المحدد
export const refreshToken = (refreshToken) => api.post('/auth/refresh', { refreshToken });

// --- الكاتالوج: إنشاء تخصص جديد ---
// يرسل FormData يحتوي على: name, imageUrl
export const createSpecialization = (name, imageUrl) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('imageUrl', imageUrl);

    return api.post('/catalog/admin/specializations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// جلب كل الاختصاصات
export const getSpecializations = (params) =>
    api.get('/catalog/admin/specializations', { params });

// تحديث اختصاص
// export const updateSpecialization = (id, data) => {
//     const formData = new FormData();
//     formData.append('name', data.name);
//     if (data.imageUrl) {
//         formData.append('imageUrl', data.imageUrl);
//     }
//     return api.put(`/catalog/admin/specializations/${id}`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//     });
// };

export const updateSpecialization = (id, data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    
    // نرسل الصورة فقط إذا كانت موجودة (ملف جديد)
    if (data.imageUrl instanceof File) {
        formData.append('imageUrl', data.imageUrl);
    }
    // إذا كان null، لا نرسل حقل imageUrl إطلاقاً
    
    return api.put(`/catalog/admin/specializations/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// export const updateSpecialization = (id, data) => {
//     const formData = new FormData();
//     formData.append('name', data.name);

//     if (data.imageUrl) {
//         // data.imageUrl يجب أن يكون File أو Blob
//         formData.append('imageUrl', data.imageUrl);
//     }

//     // لا تحدد Content-Type يدويًا، Axios يضبطه تلقائيًا
//     return api.put(`/catalog/admin/specializations/${id}`, formData);
// };


// تفعيل/تعطيل اختصاص
export const toggleSpecializationStatus = (id, isActive) =>
    api.put(`/catalog/admin/specializations/${id}/active`, { isActive });

// حذف اختصاص
export const deleteSpecialization = (id) =>
    api.delete(`/catalog/admin/specializations/${id}`);

// ---: إدارة المدرسين ---
// إنشاء مدرب جديد
export const createInstructor = (data) => {
    // إذا كان هناك صورة، استخدم FormData
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('bio', data.bio || '');
    formData.append('avatarUrl', data.avatarUrl || '');
    formData.append('specializationId', data.specializationId);
    return api.post('/catalog/admin/instructors', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// جلب جميع المدرسين
export const getInstructors = (params) =>
    api.get('/catalog/admin/instructors', { params });

// تحديث بيانات مدرب
export const updateInstructor = (id, data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('bio', data.bio || '');
    formData.append('avatarUrl', data.avatarUrl || '');
    formData.append('specializationId', data.specializationId);
    return api.put(`/catalog/admin/instructors/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
// تفعيل/تعطيل مدرب
export const toggleInstructorStatus = (id, isActive) =>
    api.put(`/catalog/admin/instructors/${id}/active`, { isActive });

// حذف مدرب
export const deleteInstructor = (id) =>
    api.delete(`/catalog/admin/instructors/${id}`);

export const getInstructorsByCourse = (courseId) =>
    api.get(`/catalog/admin/courses/${courseId}/instructors`);

// --- إدارة الكورسات ---
// إنشاء دورة جديدة
export const createCourse = (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('imageUrl', data.imageUrl);
    formData.append('specializationId', data.specializationId);

    return api.post('/catalog/admin/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// عرض جميع الدورات
export const getCourses = (params) =>
    api.get('/catalog/admin/courses', { params });

// عرض دورة محددة
export const getCourseById = (id) =>
    api.get(`/catalog/admin/courses/${id}`);

// تحديث دورة
export const updateCourse = (id, data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.imageUrl) {
        formData.append('imageUrl', data.imageUrl);
    }
    formData.append('specializationId', data.specializationId);

    return api.put(`/catalog/admin/courses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// تفعيل/إلغاء تفعيل دورة
export const toggleCourseStatus = (id, isActive) =>
    api.put(`/catalog/admin/courses/${id}/active`, { isActive });

// حذف دورة
export const deleteCourse = (id) =>
    api.delete(`/catalog/admin/courses/${id}`);

// --- إدارة مستويات الدورات ---
// إنشاء مستوى جديد
// export const createCourseLevel = (courseId, data) => {
//     const formData = new FormData();
//     formData.append('title', data.title);
//     formData.append('description', data.description || ''); 
//     formData.append('order', data.order);
//     formData.append('priceUSD', data.priceUSD);
//     formData.append('priceSAR', data.priceSAR);
//     formData.append('isFree', data.isFree || false);
//     formData.append('imageUrl', data.imageUrl);
//     formData.append('previewUrl', data.previewUrl);
//     formData.append('downloadUrl', data.downloadUrl || '');
//     formData.append('instructorId', data.instructorId);

//     return api.post(`/lessons/admin/courses/${courseId}/levels`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//     });
// };

// // عرض مستويات دورة
// export const getCourseLevels = (courseId) =>
//     api.get(`/lessons/admin/courses/${courseId}/levels`);

// // تحديث مستوى
// export const updateCourseLevel = (id, data) => {
//     const formData = new FormData();
//     formData.append('title', data.title);
//     formData.append('description', data.description || ''); 
//     formData.append('order', data.order);
//     formData.append('priceUSD', data.priceUSD);
//     formData.append('priceSAR', data.priceSAR);
//     formData.append('isFree', data.isFree || false);
//     if (data.imageUrl) {
//         formData.append('imageUrl', data.imageUrl);
//     }
//     formData.append('previewUrl', data.previewUrl);
//     formData.append('downloadUrl', data.downloadUrl || '');
//     formData.append('instructorId', data.instructorId);

//     return api.put(`/lessons/admin/levels/${id}`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//     });
// };

// // تفعيل/إلغاء تفعيل مستوى
// export const toggleCourseLevelStatus = (id, isActive) =>
//     api.put(`/lessons/admin/levels/${id}/active`, { isActive });

// // حذف مستوى
// export const deleteCourseLevel = (id) =>
//     api.delete(`/lessons/admin/levels/${id}`);

// --- إدارة مستويات الدورات ---

export const createCourseLevel = (courseId, data) => {
    const formData = new FormData();
    formData.append('title', data.name);
    formData.append('description', data.description || '');
    formData.append('order', data.order);
    formData.append('priceUSD', data.priceUSD);
    formData.append('priceSAR', data.priceSAR);
    formData.append('isFree', data.isFree.toString()); // ⬅️ تحويل إلى string
    formData.append('previewUrl', data.previewUrl);
    formData.append('downloadUrl', data.downloadUrl || '');
    formData.append('instructorId', data.instructorId);
    formData.append('imageUrl', data.imageUrl); // ⬅️ إضافة الصورة

    return api.post(`/lessons/admin/courses/${courseId}/levels`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const updateCourseLevel = (id, data) => {
    const formData = new FormData();
    formData.append('title', data.name);
    formData.append('description', data.description || '');
    formData.append('order', data.order);
    formData.append('priceUSD', data.priceUSD);
    formData.append('priceSAR', data.priceSAR);
    formData.append('isFree', data.isFree.toString()); // ⬅️ تحويل إلى string
    formData.append('previewUrl', data.previewUrl);
    formData.append('downloadUrl', data.downloadUrl || '');
    formData.append('instructorId', data.instructorId);
    
    if (data.imageUrl) {
        formData.append('imageUrl', data.imageUrl); // ⬅️ إضافة الصورة إذا موجودة
    }

    return api.put(`/lessons/admin/levels/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
export const getCourseLevels = (courseId) =>
    api.get(`/lessons/admin/courses/${courseId}/levels`);

export const toggleCourseLevelStatus = (id, isActive) =>
    api.put(`/lessons/admin/levels/${id}/active`, { isActive });

export const deleteCourseLevel = (id) =>
    api.delete(`/lessons/admin/levels/${id}`);

// // --- إدارة الدروس ---
// // إنشاء درس للدورة مباشرة
// export const createLesson = (courseId, data) =>
//     api.post(`/lessons/admin/courses/${courseId}/lessons`, data);

// // إنشاء درس لمستوى محدد
// export const createLessonForLevel = (courseLevelId, data) => {
//     const formData = new FormData();
//     formData.append('title', data.title);
//     formData.append('description', data.description || '');
//     formData.append('youtubeUrl', data.youtubeUrl);
//     formData.append('youtubeId', data.youtubeId || '');
//     formData.append('durationSec', data.durationSec || 0);
//     formData.append('orderIndex', data.orderIndex || 1);
//     formData.append('isFreePreview', data.isFreePreview || false);

//     return api.post(`/lessons/admin/levels/${courseLevelId}/lessons`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//     });
// };

// // عرض دروس دورة
// export const getCourseLessons = (courseId) =>
//     api.get(`/lessons/admin/courses/${courseId}/lessons`);

// // عرض دروس مستوى
// export const getLevelLessons = (courseLevelId) =>
//     api.get(`/lessons/admin/levels/${courseLevelId}/lessons`);

// // تحديث درس
// export const updateLesson = (id, data) => {
//     const formData = new FormData();
//     formData.append('title', data.title);
//     formData.append('description', data.description || '');
//     formData.append('youtubeUrl', data.youtubeUrl);
//     formData.append('youtubeId', data.youtubeId || '');
//     formData.append('durationSec', data.durationSec || 0);
//     formData.append('orderIndex', data.orderIndex || 1);
//     formData.append('isFreePreview', data.isFreePreview || false);

//     return api.put(`/lessons/admin/lessons/${id}`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//     });
// };

// // تفعيل/إلغاء تفعيل درس
// export const toggleLessonStatus = (id, isActive) =>
//     api.put(`/lessons/admin/lessons/${id}/active`, { isActive });

// // حذف درس
// export const deleteLesson = (id) =>
//     api.delete(`/lessons/admin/lessons/${id}`);

// --- إدارة الدروس ---
// إنشاء درس للدورة مباشرة
export const createLesson = (courseId, data) =>
    api.post(`/lessons/admin/courses/${courseId}/lessons`, data);

// إنشاء درس لمستوى محدد  
export const createLessonForLevel = (courseLevelId, data) => {
    return api.post(`/lessons/admin/levels/${courseLevelId}/lessons`, data);
};

// عرض دروس دورة
export const getCourseLessons = (courseId) =>
    api.get(`/lessons/admin/courses/${courseId}/lessons`);

// عرض دروس مستوى
export const getLevelLessons = (courseLevelId) =>
    api.get(`/lessons/admin/levels/${courseLevelId}/lessons`);

// تحديث درس 
export const updateLesson = (id, data) => {
    return api.put(`/lessons/admin/lessons/${id}`, data);
};

// تفعيل/إلغاء تفعيل درس
export const toggleLessonStatus = (id, isActive) =>
    api.put(`/lessons/admin/lessons/${id}/active`, { isActive });

// حذف درس
export const deleteLesson = (id) =>
    api.delete(`/lessons/admin/lessons/${id}`);

// --- إدارة المستخدمين ---
export const getAllUsers = (params) => api.get('/users', { params });
export const createUser = (data) => api.post('/users', data);
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const toggleUserActive = (id) => api.put(`/users/${id}/toggle-active`);

// --- إدارة المعاملات ---
// export const getTransactions = (params) => api.get('/admin/transactions', { params });
// export const getTransactionById = (id) => api.get(`/admin/transactions/${id}`);
// export const getTransactionStats = (params) => api.get('/admin/transactions/stats/overview', { params });
// export const getTransactionsByDate = (params) => api.get('/admin/transactions/analytics/date', { params });

// --- إدارة التقدم ---
// export const markLessonComplete = (lessonId) => api.post(`/progress/lessons/${lessonId}/complete`);
// export const getCourseProgress = (courseId) => api.get(`/progress/courses/${courseId}`);

// --- إدارة التقييمات ---
// export const getReviewsForCourseLevel = (courseLevelId, params) =>
//     api.get(`/reviews/courselevels/${courseLevelId}`, { params });
// export const getReviewStats = (courseLevelId) =>
//     api.get(`/reviews/courselevels/${courseLevelId}/stats`);
// export const createReview = (courseLevelId, data) =>
//     api.post(`/reviews/courselevels/${courseLevelId}`, data);
// export const getMyReview = (courseLevelId) =>
//     api.get(`/reviews/courselevels/${courseLevelId}/mine`);
// export const updateReview = (reviewId, data) =>
//     api.put(`/reviews/${reviewId}`, data);
// export const deleteReview = (reviewId) =>
//     api.delete(`/reviews/${reviewId}`);

// --- إدارة الاختبارات ---
export const getQuizByCourseLevel = (courseLevelId) =>
    api.get(`/admin/courselevels/${courseLevelId}/questions`);
export const addQuestion = (courseLevelId, data) =>
    api.post(`/admin/courselevels/${courseLevelId}/questions`, data);
export const updateQuestion = (questionId, data) =>
    api.put(`/admin/questions/${questionId}`, data);
export const deleteQuestion = (questionId) =>
    api.delete(`/admin/questions/${questionId}`);
export const updateOption = (optionId, data) =>
    api.put(`/admin/options/${optionId}`, data);
export const deleteOption = (optionId) =>
    api.delete(`/admin/options/${optionId}`);
export const deleteQuiz = (courseLevelId) =>
    api.delete(`/admin/courselevels/${courseLevelId}`);

// --- إدارة الكوبونات ---
export const getCoupons = (params) => api.get('/coupons/admin', { params });
export const createCoupon = (data) => api.post('/coupons/admin', data);
export const updateCoupon = (id, data) => api.put(`/coupons/admin/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/coupons/admin/${id}`);
export const toggleCouponActive = (id, isActive) =>
    api.put(`/coupons/admin/${id}`, { isActive });

// // --- إدارة الملفات ---

// // GET - جلب قائمة الملفات (يحتاج تأكيد الـ endpoint الصحيح)
// export const getFiles = (params) => api.get('/files/admin/files', { params });

// // POST - رفع ملف جديد
// export const uploadFile = (data) => api.post('/files/admin/files', data, {
//     headers: { 'Content-Type': 'multipart/form-data' },
// });

// // PUT - تعديل ملف
// export const updateFile = (id, data) => api.put(`/files/admin/files/${id}`, data, {
//     headers: { 'Content-Type': 'multipart/form-data' },
// });

// // DELETE - حذف ملف
// export const deleteFile = (id) => api.delete(`/files/admin/files/${id}`);

// // GET - جلب تفاصيل ملف معين
// export const getFileDetails = (id) => api.get(`/files/admin/files/${id}`);

// // --- إذا لم يعمل GET أعلاه، جرب هذه الـ endpoints البديلة ---

// // البديل 1: استخدام POST لجلب الملفات
// export const getFilesPost = (data) => api.post('/files/admin/files/list', data, {
//     headers: { 'Content-Type': 'application/json' },
// });

// // البديل 2: endpoint مختلف
// export const getFilesAlt = (params) => api.get('/files/admin', { params });

// // البديل 3: endpoint مختلف آخر
// export const getFilesAlt2 = (params) => api.get('/files/admin/list', { params });




// --- إدارة الملفات ---

// GET - جلب الملفات حسب المستوى (للمسؤول)
export const getFilesByLevel = (levelId, params) => api.get(`/files/admin/courselevel/${levelId}/files`, { params });

// GET - جلب الملفات حسب المستوى (للمستخدمين العاديين)
export const getFilesByLevelPublic = (levelId) => api.get(`/files/levels/${levelId}`);

// GET - جلب تفاصيل ملف معين
export const getFileDetails = (fileId) => api.get(`/files/file/${fileId}`);

// POST - رفع ملف جديد
export const uploadFile = (data) => api.post('/files/admin/files', data, {
    headers: { 'Content-Type': 'multipart/form-data; charset=utf-8' },
});

// PUT - تعديل ملف (إذا كان مدعوماً)
export const updateFile = (id, data) => {
  // إذا كان الـ API يدعم التعديل
  return api.put(`/files/admin/files/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data; charset=utf-8' },
  });
};

// DELETE - حذف ملف (إذا كان مدعوماً)
export const deleteFile = (id) => api.delete(`/files/admin/files/${id}`);

// --- الدوال السابقة (للتوافق مع الكود الحالي) ---

// GET - جلب قائمة الملفات (دالة مساعدة)
export const getFiles = (params) => {
  // إذا كان هناك levelId في params، استخدم endpoint المستوى
  if (params?.courseLevelId) {
    return getFilesByLevel(params.courseLevelId, params);
  }
  // وإلا استخدم endpoint عام إذا كان متوفراً
  return api.get('/files/admin/files', { params });
};

// POST - جلب الملفات (للتوافق مع الكود الحالي)
export const getFilesPost = (data) => {
  // إذا كان هناك courseLevelId في data، استخدم endpoint المستوى
  if (data?.courseLevelId) {
    return getFilesByLevel(data.courseLevelId, { 
      page: data.page, 
      limit: data.limit,
      search: data.search 
    });
  }
  // رجع الرفض إذا لم يكن هناك مستوى محدد
  return Promise.reject(new Error('يجب تحديد courseLevelId'));
};






// --- إدارة الإعلانات ---

// export const getAdvertisements = (params) => api.get('/ads/admin', { params });
// export const createAdvertisement = (data) => api.post('/ads/admin', data, {
//     headers: { 'Content-Type': 'multipart/form-data' },
// });
// export const updateAdvertisement = (id, data) => api.put(`/ads/admin/${id}`, data, {
//     headers: { 'Content-Type': 'multipart/form-data' },
// });
// export const deleteAdvertisement = (id) => api.delete(`/ads/admin/${id}`);
// export const toggleAdvertisementActive = (id, isActive) =>
//     api.put(`/ads/admin/${id}`, { isActive });

// --- إعدادات التطبيق ---
// export const getAppSettings = () => api.get('/settings');
// export const updateAppSettings = (data) => api.put('/settings', data);

// --- إدارة المجالات والمواد ---
// export const getDomains = () => api.get('/catalog/admin/domains');
// export const createDomain = (name) => api.post('/catalog/admin/domains', { name });
// export const updateDomain = (id, data) => api.put(`/catalog/admin/domains/${id}`, data);
// export const toggleDomainActive = (id, isActive) =>
//     api.put(`/catalog/admin/domains/${id}/active`, { isActive });
// export const deleteDomain = (id) => api.delete(`/catalog/admin/domains/${id}`);

// export const getSubjects = (params) => api.get('/catalog/admin/subjects', { params });
// export const createSubject = (data) => api.post('/catalog/admin/subjects', data);
// export const updateSubject = (id, data) => api.put(`/catalog/admin/subjects/${id}`, data);
// export const toggleSubjectActive = (id, isActive) =>
//     api.put(`/catalog/admin/subjects/${id}/active`, { isActive });
// export const deleteSubject = (id) => api.delete(`/catalog/admin/subjects/${id}`);

// --- إدارة مستويات الدورات ---
// getCourseLevels موجودة بالفعل أعلاه

// --- إدارة الدروس ---
// getLessons, createLesson, updateLesson, deleteLesson موجودة بالفعل أعلاه

// إصلاح مسارات الدروس والمستويات
// getLevelLessons موجودة بالفعل أعلاه

// --- إدارة قصص النجاح ---
// export const getStories = (params) => api.get('/stories', { params });
// export const createStory = (data) => api.post('/stories', data);
// export const updateStory = (id, data) => api.put(`/stories/${id}`, data);
// export const deleteStory = (id) => api.delete(`/stories/${id}`);

// --- إدارة القصص ---
export const getStories = (params) => 
    api.get('/story/admin/stories', { params });

export const createStory = (data) => 
    api.post('/story/admin/stories', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const getStory = (id) => 
    api.get(`/story/admin/stories/${id}`);

export const updateStory = (id, data) => 
    api.put(`/story/admin/stories/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const deleteStory = (id) => 
    api.delete(`/story/admin/stories/${id}`);

// --- إدارة الإشعارات ---
// export const getNotifications = (params) => api.get('/notifications', { params });
// export const createNotification = (data) => api.post('/notifications', data);
// export const markNotificationAsRead = (id) => api.put(`/notifications/${id}/read`);

// --- إدارة المقترحات ---
// export const getSuggestions = (params) => api.get('/suggestions', { params });
// export const updateSuggestion = (id, data) => api.put(`/suggestions/${id}`, data);
// export const deleteSuggestion = (id) => api.delete(`/suggestions/${id}`);

// --- إدارة رسائل الدعم ---
// export const getSupportMessages = (params) => api.get('/support', { params });
// export const replyToSupport = (id, data) => api.post(`/support/${id}/reply`, data);

// --- إدارة المديرين الفرعيين ---
// export const getSubAdmins = (params) => api.get('/admin/sub-admins', { params });
// export const createSubAdmin = (data) => api.post('/admin/sub-admins', data);
// export const updateSubAdmin = (id, data) => api.put(`/admin/sub-admins/${id}`, data);
// export const deleteSubAdmin = (id) => api.delete(`/admin/sub-admins/${id}`);



// --- Access Codes API ---

// توليد كود جديد
// export const generateAccessCode = async (formData) => {
//   const response = await api.post('/access-codes/admin/generate', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   });
//   return response;
// };

// // جلب جميع الأكواد
// export const getAllAccessCodes = async () => {
//   const response = await api.get('/access-codes/admin/all');
//   return response;
// };

// // جلب أكواد مستخدم معين
// export const getAccessCodesByUserId = async (userId) => {
//   const response = await api.get(`/access-codes/admin/user/${userId}`);
//   return response;
// };

// // جلب أكواد كورس معين
// export const getAccessCodesByCourse = async (courseId) => {
//   const response = await api.get(`/access-codes/admin/course/${courseId}`);
//   return response;
// };



// توليد كود جديد
export const generateAccessCode = async (formData) => {
  const response = await api.post('/access-codes/admin/generate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

// جلب جميع الأكواد
export const getAllAccessCodes = async () => {
  const response = await api.get('/access-codes/admin/all');
  return response;
};

// جلب أكواد مستخدم معين
export const getAccessCodesByUserId = async (userId) => {
  const response = await api.get(`/access-codes/admin/user/${userId}`);
  return response;
};

// جلب أكواد كورس معين
export const getAccessCodesByCourse = async (courseId) => {
  const response = await api.get(`/access-codes/admin/course/${courseId}`);
  return response;
};

// حذف الكود
export const deleteAccessCode = async (accessCodeId) => {
  const response = await api.delete(`/access-codes/admin/access-code/${accessCodeId}`);
  return response;
};

// تحديث حالة الكود (تفعيل/تعطيل)
export const updateAccessCodeStatus = async (accessCodeId, isActive) => {
  const response = await api.put(`/access-codes/admin/access-code/${accessCodeId}/active`, {
    isActive
  });
  return response;
};

// تعديل الكود
export const updateAccessCode = async (accessCodeId, data) => {
  const response = await api.put(`/access-codes/admin/access-code/${accessCodeId}`, data);
  return response;
};

// --- Coupons API ---

// جلب الكوبونات النشطة للمستوى
export const getActiveCouponsByLevel = async (levelId) => {
  const response = await api.get(`/coupons/admin/level/${levelId}/active`);
  return response;
};

// حساب السعر النهائي مع الكوبون
export const calculateFinalPrice = async (couponId, courseLevelId) => {
  const response = await api.post(`/coupons/admin/coupon/${couponId}`, {
    courseLevelId
  });
  return response;
};



// حذف كود 
// export const deleteAccessCode = async (codeId) => {
//   const response = await api.delete(`/access-codes/admin/${codeId}`);
//   return response;
// };

// --- Suggestions API ---

// جلب جميع الاقتراحات
export const getSuggestions = async (params = {}) => {
  const response = await api.get('/suggestions/admin', { params });
  return response;
};

// --- Notifications API ---



// --- إدارة الإشعارات ---

// GET - جلب جميع الإشعارات (للمسؤول)
export const getNotifications = (params) => api.get('/notifications/admin', { params });

// POST - إنشاء إشعار لمستخدمين محددين
export const createNotificationForUsers = (data) => api.post('/notifications/admin/users', data);

// POST - إنشاء إشعار بث لجميع المستخدمين (إذا كان مدعوماً)
export const createBroadcastNotification = (data) => {
  // إذا كان هناك endpoint منفصل للبث
  return api.post('/notifications/admin/broadcast', data);
};

// DELETE - حذف إشعار
export const deleteNotification = (id) => api.delete(`/notifications/admin/${id}`);

// --- الدوال السابقة (للتوافق مع الكود الحالي) ---

// POST - إنشاء إشعار لمستخدم واحد (للتوافق مع الكود الحالي)
export const createNotification = (data) => {
  // استخدام نفس endpoint المستخدمين المتعددين ولكن بمستخدم واحد
  return createNotificationForUsers({
    ...data,
    userIds: [data.userId] // تحويل userId إلى مصفوفة userIds
  });
};





// في ملف api.js - أضف هذه الدوال

// الإشعارات
// export const getNotifications = async (params = {}) => {
//     try {
//         const response = await api.get('/notifications/admin', { params });
//         return response;
//     } catch (error) {
//         console.error('Error fetching notifications:', error);
//         throw error;
//     }
// };

// export const createNotification = async (notificationData) => {
//     try {
//         // تأكد من أن البيانات تتوافق مع المتطلبات
//         const data = {
//             userId: notificationData.userId,
//             title: notificationData.title,
//             body: notificationData.body,
//             type: notificationData.type || 'GENERAL',
//             link: notificationData.link || undefined,
//             imageUrl: notificationData.imageUrl || undefined,
//             data: notificationData.data || undefined
//         };
        
//         const response = await api.post('/notifications/admin', data);
//         return response;
//     } catch (error) {
//         console.error('Error creating notification:', error);
//         throw error;
//     }
// };

// export const createNotification = async (notificationData) => {
//     try {
//         // تنظيف البيانات - إزالة الحقول undefined
//         const cleanData = Object.fromEntries(
//             Object.entries(notificationData).filter(([_, value]) => value !== undefined && value !== null)
//         );
        
//         const response = await api.post('/notifications/admin', cleanData);
//         return response;
//     } catch (error) {
//         console.error('Error creating notification:', error);
//         throw error;
//     }
// };

// export const createBroadcastNotification = async (notificationData) => {
//     try {
//         // تأكد من أن البيانات تتوافق مع المتطلبات
//         const data = {
//             title: notificationData.title,
//             body: notificationData.body,
//             type: notificationData.type || 'GENERAL',
//             link: notificationData.link || undefined,
//             imageUrl: notificationData.imageUrl || undefined,
//             data: notificationData.data || undefined
//         };
        
//         const response = await api.post('/notifications/admin/broadcast', data);
//         return response;
//     } catch (error) {
//         console.error('Error creating broadcast notification:', error);
//         throw error;
//     }
// };

// export const createNotificationForUsers = async (notificationData) => {
//     try {
//         // تأكد من أن البيانات تتوافق مع المتطلبات
//         const data = {
//             userIds: notificationData.userIds,
//             title: notificationData.title,
//             body: notificationData.body,
//             type: notificationData.type || 'GENERAL',
//             link: notificationData.link || undefined,
//             imageUrl: notificationData.imageUrl || undefined,
//             data: notificationData.data || undefined
//         };
        
//         const response = await api.post('/notifications/admin/users', data);
//         return response;
//     } catch (error) {
//         console.error('Error creating notification for users:', error);
//         throw error;
//     }
// };

// الإشعارات
// export const createNotification = async (formData) => {
//     try {
//         const response = await api.post('/notifications/admin', formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data'
//             }
//         });
//         return response;
//     } catch (error) {
//         console.error('Error creating notification:', error);
//         throw error;
//     }
// };

// export const createBroadcastNotification = async (formData) => {
//     try {
//         const response = await api.post('/notifications/admin/broadcast', formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data'
//             }
//         });
//         return response;
//     } catch (error) {
//         console.error('Error creating broadcast notification:', error);
//         throw error;
//     }
// };

// export const createNotificationForUsers = async (formData) => {
//     try {
//         const response = await api.post('/notifications/admin/users', formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data'
//             }
//         });
//         return response;
//     } catch (error) {
//         console.error('Error creating notification for users:', error);
//         throw error;
//     }
// };

// export const deleteNotification = async (notificationId) => {
//     try {
//         const response = await api.delete(`/notifications/admin/${notificationId}`);
//         return response;
//     } catch (error) {
//         console.error('Error deleting notification:', error);
//         throw error;
//     }
// };

// جلب جميع الإشعارات
// export const getNotifications = async (params = {}) => {
//   const response = await api.get('/notifications/admin', { params });
//   return response;
// };

// // إنشاء إشعار لمستخدم معين
// export const createNotification = async (notificationData) => {
//   const response = await api.post('/notifications/admin', notificationData);
//   return response;
// };

// // إنشاء إشعار عام لجميع المستخدمين
// export const createBroadcastNotification = async (notificationData) => {
//   const response = await api.post('/notifications/admin/broadcast', notificationData);
//   return response;
// };

// // إنشاء إشعار لمستخدمين محددين
// export const createNotificationForUsers = async (notificationData) => {
//   const response = await api.post('/notifications/admin/users', notificationData);
//   return response;
// };

// // حذف إشعار
// export const deleteNotification = async (notificationId) => {
//   const response = await api.delete(`/notifications/admin/${notificationId}`);
//   return response;
// };

// --- إدارة التحويلات المالية والفواتير ---

// جلب جميع المعاملات مع التصفية والترتيب
export const getTransactions = (params) => 
    api.get('/transactions/admin', { params });

// جلب معاملة محددة بالرقم
export const getTransactionById = (id) => 
    api.get(`/transactions/admin/${id}`);

// جلب إحصائيات المعاملات
export const getTransactionStats = (params) => 
    api.get('/transactions/admin/stats/overview', { params });

// جلب تحليلات المعاملات حسب التاريخ
export const getTransactionsByDate = (params) => 
    api.get('/transactions/admin/analytics/date', { params });

//   للإعدادات
// 1. جلب إعدادات التواصل
export const getContactSettings = () =>
    api.get('/settings/contact');

// 2. جلب جميع الإعدادات
export const getAllSettings = () =>
    api.get('/settings/');

// 3. تعديل إعداد محدد
export const updateSetting = (key, value) =>
    api.put('/settings/allowRating', { key, value });

// 4. إضافة إعداد جديد
export const addSetting = (data) =>
    api.post('/settings', data);

// 5. تعديل جميع الإعدادات
export const updateAllSettings = (data) =>
    api.put('/settings/', data);


//   لإدارة المدراء
export const createAdmin = (data) =>
    api.post('/admin/create-admin', data);

export const getAdminsList = () =>
    api.get('/admin/list');

export const detailsAdmin = (adminId, data) =>
    api.get(`/admin/${adminId}`, data);

export const updateAdmin = (adminId, data) =>
    api.put(`/admin/${adminId}`, data);

export const deleteAdmin = (adminId) =>
    api.delete(`/admin/${adminId}`);



//   لإدارة التقييمات
export const getReviews = (courseLevelId) =>
    api.get(`/reviews/all?courseLevelId=${courseLevelId}`);

// --- تقارير المدرسين ---

export const getInstructorReport = (instructorId, startDate, endDate) => {
    return api.get(`/catalog/admin/report/instructors`, {
        params: {
            instructorId,
            startDate,
            endDate
        }
    });
};

export { api, BASE_URL };