// src\hooks\useToastMessages.js
import { toast } from 'sonner';

// رسائل النجاح
export const SUCCESS_MESSAGES = {
  CREATE: (item) => `تم إنشاء ${item} بنجاح`,
  UPDATE: (item) => `تم تحديث ${item} بنجاح`,
  DELETE: (item) => `تم حذف ${item} بنجاح`,
  TOGGLE: (item, isActive) => `تم ${isActive ? 'تفعيل' : 'تعطيل'} ${item} بنجاح`,
  SAVE: (item) => `تم حفظ ${item} بنجاح`,
  SEND: (item) => `تم إرسال ${item} بنجاح`,
  UPLOAD: (item) => `تم رفع ${item} بنجاح`,
  DOWNLOAD: (item) => `تم تحميل ${item} بنجاح`,
  COPY: (item) => `تم نسخ ${item} بنجاح`,
  LOGIN: 'تم تسجيل الدخول بنجاح',
  LOGOUT: 'تم تسجيل الخروج بنجاح',
  REGISTER: 'تم إنشاء الحساب بنجاح',
  RESET_PASSWORD: 'تم إعادة تعيين كلمة المرور بنجاح',
  CHANGE_PASSWORD: 'تم تغيير كلمة المرور بنجاح',
  UPDATE_PROFILE: 'تم تحديث الملف الشخصي بنجاح',
  UPLOAD_AVATAR: 'تم تحديث الصورة الشخصية بنجاح',
  SEND_MESSAGE: 'تم إرسال الرسالة بنجاح',
  ADD_TO_CART: 'تم إضافة المنتج إلى السلة بنجاح',
  REMOVE_FROM_CART: 'تم حذف المنتج من السلة بنجاح',
  PLACE_ORDER: 'تم تقديم الطلب بنجاح',
  CANCEL_ORDER: 'تم إلغاء الطلب بنجاح',
  APPROVE_REQUEST: 'تم الموافقة على الطلب بنجاح',
  REJECT_REQUEST: 'تم رفض الطلب بنجاح',
  MARK_COMPLETE: 'تم تسجيل الإنجاز بنجاح',
  SUBMIT_ASSIGNMENT: 'تم تسليم المهمة بنجاح',
  GRADE_ASSIGNMENT: 'تم تقييم المهمة بنجاح',
  PUBLISH_COURSE: 'تم نشر الدورة بنجاح',
  UNPUBLISH_COURSE: 'تم إلغاء نشر الدورة بنجاح',
  ENROLL_COURSE: 'تم الالتحاق بالدورة بنجاح',
  UNENROLL_COURSE: 'تم إلغاء الالتحاق بالدورة بنجاح',
  START_QUIZ: 'تم بدء الاختبار بنجاح',
  SUBMIT_QUIZ: 'تم تسليم الاختبار بنجاح',
  REVIEW_COURSE: 'تم إضافة التقييم بنجاح',
  UPDATE_REVIEW: 'تم تحديث التقييم بنجاح',
  DELETE_REVIEW: 'تم حذف التقييم بنجاح',
  LIKE_COURSE: 'تم إضافة الإعجاب بنجاح',
  UNLIKE_COURSE: 'تم إزالة الإعجاب بنجاح',
  FOLLOW_INSTRUCTOR: 'تم متابعة المدرس بنجاح',
  UNFOLLOW_INSTRUCTOR: 'تم إلغاء متابعة المدرس بنجاح',
  SHARE_COURSE: 'تم مشاركة الدورة بنجاح',
  BOOKMARK_COURSE: 'تم إضافة الدورة للمفضلة بنجاح',
  UNBOOKMARK_COURSE: 'تم حذف الدورة من المفضلة بنجاح',
  SUBSCRIBE_NEWSLETTER: 'تم الاشتراك في النشرة الإخبارية بنجاح',
  UNSUBSCRIBE_NEWSLETTER: 'تم إلغاء الاشتراك في النشرة الإخبارية بنجاح',
  UPDATE_SETTINGS: 'تم تحديث الإعدادات بنجاح',
  BACKUP_DATA: 'تم إنشاء نسخة احتياطية بنجاح',
  RESTORE_DATA: 'تم استعادة البيانات بنجاح',
  EXPORT_DATA: 'تم تصدير البيانات بنجاح',
  IMPORT_DATA: 'تم استيراد البيانات بنجاح'
};

// رسائل الخطأ
export const ERROR_MESSAGES = {
  CREATE: (item) => `فشل في إنشاء ${item}`,
  UPDATE: (item) => `فشل في تحديث ${item}`,
  DELETE: (item) => `فشل في حذف ${item}`,
  TOGGLE: (item) => `فشل في تغيير حالة ${item}`,
  SAVE: (item) => `فشل في حفظ ${item}`,
  SEND: (item) => `فشل في إرسال ${item}`,
  UPLOAD: (item) => `فشل في رفع ${item}`,
  DOWNLOAD: (item) => `فشل في تحميل ${item}`,
  COPY: (item) => `فشل في نسخ ${item}`,
  LOGIN: 'فشل في تسجيل الدخول',
  LOGOUT: 'فشل في تسجيل الخروج',
  REGISTER: 'فشل في إنشاء الحساب',
  RESET_PASSWORD: 'فشل في إعادة تعيين كلمة المرور',
  CHANGE_PASSWORD: 'فشل في تغيير كلمة المرور',
  UPDATE_PROFILE: 'فشل في تحديث الملف الشخصي',
  UPLOAD_AVATAR: 'فشل في تحديث الصورة الشخصية',
  SEND_MESSAGE: 'فشل في إرسال الرسالة',
  ADD_TO_CART: 'فشل في إضافة المنتج إلى السلة',
  REMOVE_FROM_CART: 'فشل في حذف المنتج من السلة',
  PLACE_ORDER: 'فشل في تقديم الطلب',
  CANCEL_ORDER: 'فشل في إلغاء الطلب',
  APPROVE_REQUEST: 'فشل في الموافقة على الطلب',
  REJECT_REQUEST: 'فشل في رفض الطلب',
  MARK_COMPLETE: 'فشل في تسجيل الإنجاز',
  SUBMIT_ASSIGNMENT: 'فشل في تسليم المهمة',
  GRADE_ASSIGNMENT: 'فشل في تقييم المهمة',
  PUBLISH_COURSE: 'فشل في نشر الدورة',
  UNPUBLISH_COURSE: 'فشل في إلغاء نشر الدورة',
  ENROLL_COURSE: 'فشل في الالتحاق بالدورة',
  UNENROLL_COURSE: 'فشل في إلغاء الالتحاق بالدورة',
  START_QUIZ: 'فشل في بدء الاختبار',
  SUBMIT_QUIZ: 'فشل في تسليم الاختبار',
  REVIEW_COURSE: 'فشل في إضافة التقييم',
  UPDATE_REVIEW: 'فشل في تحديث التقييم',
  DELETE_REVIEW: 'فشل في حذف التقييم',
  LIKE_COURSE: 'فشل في إضافة الإعجاب',
  UNLIKE_COURSE: 'فشل في إزالة الإعجاب',
  FOLLOW_INSTRUCTOR: 'فشل في متابعة المدرس',
  UNFOLLOW_INSTRUCTOR: 'فشل في إلغاء متابعة المدرس',
  SHARE_COURSE: 'فشل في مشاركة الدورة',
  BOOKMARK_COURSE: 'فشل في إضافة الدورة للمفضلة',
  UNBOOKMARK_COURSE: 'فشل في حذف الدورة من المفضلة',
  SUBSCRIBE_NEWSLETTER: 'فشل في الاشتراك في النشرة الإخبارية',
  UNSUBSCRIBE_NEWSLETTER: 'فشل في إلغاء الاشتراك في النشرة الإخبارية',
  UPDATE_SETTINGS: 'فشل في تحديث الإعدادات',
  BACKUP_DATA: 'فشل في إنشاء نسخة احتياطية',
  RESTORE_DATA: 'فشل في استعادة البيانات',
  EXPORT_DATA: 'فشل في تصدير البيانات',
  IMPORT_DATA: 'فشل في استيراد البيانات',
  NETWORK_ERROR: 'خطأ في الاتصال بالشبكة',
  SERVER_ERROR: 'خطأ في الخادم',
  UNAUTHORIZED: 'غير مصرح لك بالوصول',
  FORBIDDEN: 'ممنوع الوصول',
  NOT_FOUND: 'العنصر المطلوب غير موجود',
  VALIDATION_ERROR: 'خطأ في البيانات المدخلة',
  FILE_TOO_LARGE: 'حجم الملف كبير جداً',
  INVALID_FILE_TYPE: 'نوع الملف غير مدعوم',
  DUPLICATE_ENTRY: 'البيانات موجودة مسبقاً',
  INSUFFICIENT_PERMISSIONS: 'صلاحيات غير كافية',
  ACCOUNT_LOCKED: 'الحساب مقفل',
  ACCOUNT_DISABLED: 'الحساب معطل',
  INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
  EMAIL_NOT_VERIFIED: 'البريد الإلكتروني غير مفعل',
  PHONE_NOT_VERIFIED: 'رقم الهاتف غير مفعل',
  TOKEN_EXPIRED: 'انتهت صلاحية الجلسة',
  TOKEN_INVALID: 'جلسة غير صحيحة',
  RATE_LIMIT_EXCEEDED: 'تم تجاوز الحد المسموح من المحاولات',
  MAINTENANCE_MODE: 'النظام في وضع الصيانة',
  SERVICE_UNAVAILABLE: 'الخدمة غير متاحة',
  TIMEOUT: 'انتهت مهلة الاتصال',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع'
};

// دالة لعرض رسالة نجاح
export const showSuccessToast = (message, options = {}) => {
  return toast.success(message, {
    duration: 4000,
    position: 'top-center',
    ...options
  });
};

// دالة لعرض رسالة خطأ
export const showErrorToast = (message, options = {}) => {
  return toast.error(message, {
    duration: 5000,
    position: 'top-center',
    ...options
  });
};

// دالة لعرض رسالة تحذير
export const showWarningToast = (message, options = {}) => {
  return toast.warning(message, {
    duration: 4000,
    position: 'top-center',
    ...options
  });
};

// دالة لعرض رسالة معلومات
export const showInfoToast = (message, options = {}) => {
  return toast.info(message, {
    duration: 4000,
    position: 'top-center',
    ...options
  });
};

// دالة لعرض رسالة تحميل
export const showLoadingToast = (message, options = {}) => {
  return toast.loading(message, {
    duration: Infinity,
    position: 'top-center',
    ...options
  });
};

// دالة لإخفاء رسالة التوست
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// دالة لإخفاء جميع رسائل التوست
export const dismissAllToasts = () => {
  toast.dismiss();
};

// دالة لعرض رسالة نجاح مع تفاصيل
export const showSuccessToastWithDetails = (title, description, options = {}) => {
  return toast.success(title, {
    description,
    duration: 5000,
    position: 'top-center',
    ...options
  });
};

// دالة لعرض رسالة خطأ مع تفاصيل
export const showErrorToastWithDetails = (title, description, options = {}) => {
  return toast.error(title, {
    description,
    duration: 6000,
    position: 'top-center',
    ...options
  });
};

// دالة لعرض رسالة تأكيد
export const showConfirmToast = (title, description, onConfirm, onCancel, options = {}) => {
  return toast(title, {
    description,
    duration: Infinity,
    position: 'top-center',
    action: {
      label: 'تأكيد',
      onClick: () => {
        onConfirm();
        toast.dismiss();
      }
    },
    cancel: {
      label: 'إلغاء',
      onClick: () => {
        onCancel();
        toast.dismiss();
      }
    },
    ...options
  });
};

export default {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
  dismissToast,
  dismissAllToasts,
  showSuccessToastWithDetails,
  showErrorToastWithDetails,
  showConfirmToast
};