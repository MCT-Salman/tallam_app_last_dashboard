// src\utils\corsConfig.js

/**
 * تكوين عام للـ CORS يمكن استخدامه في الطلبات
 */
export const corsConfig = {
  credentials: true,
  headers: {
    'Access-Control-Allow-Origin': 'https://dev.tallaam.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
};

/**
 * تكوين خاص بالصور لمعالجة مشكلة CORS
 */
export const imageConfig = {
  crossOrigin: 'anonymous',
  referrerPolicy: 'no-referrer'
};

/**
 * دالة مساعدة لإضافة تكوينات CORS إلى عنصر الصورة
 * @param {HTMLImageElement} imgElement - عنصر الصورة
 */
export const applyCorsToImage = (imgElement) => {
  if (imgElement) {
    imgElement.crossOrigin = 'anonymous';
    imgElement.referrerPolicy = 'no-referrer';
  }
};