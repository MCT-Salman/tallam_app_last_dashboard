// src\api\api.jsx
import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.3.11:5000/api';
const BASE_URL = import.meta.env.VITE_BASE_URL || "https://dev.tallaam.com";
const API_URL = import.meta.env.REACT_APP_API_URL || 'https://dev.tallaam.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


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
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

// Interceptor لمعالجة أخطاء المصادقة وتحديث التوكن
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const currentTime = Date.now();

        // إذا فشل استدعاء /auth/refresh نفسه، قم بتسجيل الخروج مباشرة لتجنب الحلقة اللانهائية
        if (originalRequest?.url?.includes('/auth/refresh')) {
            console.error('❌ فشل طلب تحديث التوكن نفسه، سيتم تسجيل الخروج');
            clearAllAuthData();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        if (originalRequest?.url?.includes('/admin/login')) {
            return Promise.reject(error); // لا تعامل مع أخطاء login
        }

        // التحقق من حالة الخطأ وعدد المحاولات
        if ((error.response?.status === 401) &&
            ((originalRequest._retryCount || 0) < RETRY_CONFIG.MAX_RETRY_ATTEMPTS)) {

            // التحقق من وقت التبريد بين محاولات تحديث التوكن
            if (currentTime - lastTokenRefreshTimestamp < RETRY_CONFIG.TOKEN_REFRESH_COOLDOWN) {
                console.log('⏳ Waiting for token refresh cooldown...');
                await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.TOKEN_REFRESH_COOLDOWN));
            }

            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    if (isRefreshing) {
                        // انتظر حتى يكتمل التحديث الجاري ثم أعد المحاولة
                        return new Promise((resolve, reject) => {
                            subscribeTokenRefresh((newToken) => {
                                if (!newToken) {
                                    reject(error);
                                    return;
                                }
                                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                                resolve(api(originalRequest));
                            });
                        });
                    }

                    console.log(`🔄 Attempting to refresh token (attempt ${originalRequest._retryCount}/${RETRY_CONFIG.MAX_RETRY_ATTEMPTS})...`);
                    isRefreshing = true;
                    lastTokenRefreshTimestamp = currentTime;

                    const response = await api.post('/auth/refresh', { refreshToken });
                    const { data } = response.data;
                    if (!data?.accessToken || !data?.refreshToken) {
                        throw new Error('لم يتم العثور على التوكن الجديد في الاستجابة');
                    }

                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    console.log('✅ تم تحديث التوكن بنجاح');

                    isRefreshing = false;
                    onRefreshed(data.accessToken);

                    originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                    await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.RETRY_DELAY));
                    console.log('🔄 إعادة محاولة الطلب الأصلي مع التوكن الجديد...');
                    return api(originalRequest);

                } catch (refreshError) {
                    isRefreshing = false;
                    onRefreshed(null);
                    console.error('❌ فشل تحديث التوكن:', refreshError.response?.data?.message || refreshError.message);

                    console.error('❌ تم استنفاد محاولات تحديث التوكن أو فشل التحديث');
                    clearAllAuthData();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
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
    formData.append('isFree', data.isFree.toString());
    formData.append('previewUrl', data.previewUrl);
    formData.append('downloadUrl', data.downloadUrl || '');
    formData.append('instructorId', data.instructorId);

    if (data.imageUrl) {
        formData.append('imageUrl', data.imageUrl);
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
export const getAllUsersHavePoints = () => {
    return api.get('/coupons/admin/users');
};
export const createUser = (data) => api.post('/users', data);
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const toggleUserActive = (id) => api.put(`/users/${id}/toggle-active`);
// حذف جلسة المستخدم
export const deleteUserSession = (userId) =>
    api.delete(`/admin/delete-session`, { data: { userId } });

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

// --- إدارة أكواد الوصول ---
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


// --- Suggestions API ---

// جلب جميع الاقتراحات
export const getSuggestions = async (params = {}) => {
    const response = await api.get('/suggestions/admin', { params });
    return response;
};

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


// POST - إنشاء إشعار لمستخدم واحد (للتوافق مع الكود الحالي)
export const createNotification = (data) => {
    // استخدام نفس endpoint المستخدمين المتعددين ولكن بمستخدم واحد
    return createNotificationForUsers({
        ...data,
        userIds: [data.userId] // تحويل userId إلى مصفوفة userIds
    });
};


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
// 1. جلب جميع الإعدادات
export const getAllSettings = () =>
    api.get('/settings/');

// 2. تعديل إعداد محدد
export const updateSetting = (key, value) =>
    api.put('/settings/key', { key, value });

// 3. إضافة إعداد جديد
export const addSetting = (data) =>
    api.post('/settings', data);

// 4. تعديل جميع الإعدادات
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

export const deleteReview = (Id) =>
    api.delete(`/reviews/admin/${Id}`);

// // --- تقارير المدرسين ---

export const getInstructorReport = (instructorId, startDate, endDate) => {
    return api.get(`/catalog/admin/report/instructors`, {
        params: {
            instructorId,
            startDate,
            endDate
        }
    });
};


// --- تقارير لوحة التحكم ---

// تقرير الأكواد النشطة
export const getAccessCodesReport = () => {
    return api.get('/access-codes/admin/report');
};

export const getcountStudentOfInstructors = () => {
    return api.get('/catalog/admin/count/students');
};

// تقرير المستخدمين حسب البلد
export const getUsersReport = () => {
    return api.get('/users/report');
};

// تقرير الإيرادات الشهرية
export const getMonthlyRevenueReport = (year = new Date().getFullYear()) => {
    return api.get('/transactions/admin/analytics/date', {
        params: { year }
    });
};

// تقرير المستخدمين الشهري
export const getMonthlyUsersReport = (year = new Date().getFullYear()) => {
    return api.get('/users/admin/analytics/date', {
        params: { year }
    });
};

// إحصائيات لوحة التحكم الرئيسية
export const getDashboardStats = () => {
    return api.get('/admin/dashboard/stats');
};

export const getCouponsByLevelOrUser = (data) => api.post('/coupons/admin/listcoupons', data);

//  جلب قائمة أكواد المستويات
export const getCodeLevels = () => {
    return api.get('/lessons/admin/codelevels');
};

//  جلب تفاصيل المستوى بواسطة الترميز
export const getCodeLevelByEncode = (encode) => {
    return api.get(`/lessons/admin/CodeLevel/${encode}`);
};

// --- إدارة المدن ---
export const getCities = (params) => api.get('/cities/admin', { params });
export const getCityById = (id) => api.get(`/cities/admin/${id}`);
export const createCity = (data) => api.post('/cities/admin', data);
export const updateCity = (id, data) => api.put(`/cities/admin/${id}`, data);
export const deleteCity = (id) => api.delete(`/cities/admin/${id}`);

// --- إدارة المناطق ---
export const getAreas = (params) => api.get('/areas/admin', { params });
export const getAreaById = (id) => api.get(`/areas/admin/${id}`);
export const createArea = (data) => api.post('/areas/admin', data);
export const updateArea = (id, data) => api.put(`/areas/admin/${id}`, data);
export const deleteArea = (id) => api.delete(`/areas/admin/${id}`);

// --- إدارة نقاط البيع ---
export const getPointsOfSale = (params) => api.get('/pointsofsale/admin', { params });
export const getPointOfSaleById = (id) => api.get(`/pointsofsale/admin/${id}`);
export const createPointOfSale = (data) => api.post('/pointsofsale/admin', data);
export const updatePointOfSale = (id, data) => api.put(`/pointsofsale/admin/${id}`, data);
export const deletePointOfSale = (id) => api.delete(`/pointsofsale/admin/${id}`);
export const togglePointOfSaleActive = (id, isActive) => api.put(`/pointsofsale/admin/${id}/active`, { isActive });

// --- إدارة طرق الدفع ---
export const getPaymentMethods = (params) => api.get('/paymentmethods/admin', { params });
export const getPaymentMethodById = (id) => api.get(`/paymentmethods/admin/${id}`);
export const createPaymentMethod = (data) => api.post('/paymentmethods/admin', data);
export const updatePaymentMethod = (id, data) => api.put(`/paymentmethods/admin/${id}`, data);
export const deletePaymentMethod = (id) => api.delete(`/paymentmethods/admin/${id}`);
export const togglePaymentMethodActive = (id, isActive) => api.put(`/paymentmethods/admin/${id}/active`, { isActive });

// --- إدارة إصدارات التطبيق ---
// قائمة الإصدارات مع فلاتر اختيارية
export const getMobileVersions = (params) => api.get('/mobileversions/admin', { params });
// جلب إصدار محدد بالتفاصيل
export const getMobileVersionById = (id) => api.get(`/mobileversions/admin/${id}`);
// إنشاء إصدار جديد
export const createMobileVersion = (data) => api.post('/mobileversions/admin', data);
// تحديث إصدار موجود
export const updateMobileVersion = (id, data) => api.put(`/mobileversions/admin/${id}`, data);
// حذف إصدار
export const deleteMobileVersion = (id) => api.delete(`/mobileversions/admin/${id}`);

export { api, BASE_URL };