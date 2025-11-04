import React, { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Clock, BadgeCheck, Ban, CalendarX, List, BookOpen, Layers, RefreshCw, BarChart3, XCircle, CreditCard, Users, UserCheck, Edit, Trash2, Search, ChevronLeft, ChevronRight, Eye, Copy, User, Book, Calendar, DollarSign, FileText, ZoomIn, Phone, Info, Tag, Play, Pause, Filter, X, BookA, CheckCircle, Scan } from "lucide-react";
import {
    generateAccessCode,
    getAllAccessCodes,
    deleteAccessCode,
    updateAccessCodeStatus,
    getActiveCouponsByLevel,
    calculateFinalPrice,
    updateAccessCode,
    getCouponsByLevelOrUser,
    getCodeLevels,
    getCodeLevelByEncode
} from "@/api/api";
import { getAllUsers } from "@/api/api";
import { getCourses } from "@/api/api";
import { getCourseLevels } from "@/api/api";
import { getSpecializations } from "@/api/api";
import { getInstructorsByCourse } from "@/api/api";
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages";
import { BASE_URL } from "@/api/api";
import { imageConfig } from "@/utils/corsConfig";

const AccessCode = () => {
    // الحالات الأساسية
    const [codes, setCodes] = useState([]);
    const [allCodes, setAllCodes] = useState([]);
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [priceLoading, setPriceLoading] = useState(false);
    const [couponCheckLoading, setCouponCheckLoading] = useState(false);

    // الهيكلية الجديدة
    const [specializations, setSpecializations] = useState([]);
    const [instructors, setInstructors] = useState([]);

    // حالة النموذج
    const [form, setForm] = useState({
        courseId: "",
        courseLevelId: "",
        userId: "",
        validityInMonths: "1.5",
        amountPaid: "",
        originalPrice: "",
        discountAmount: "0",
        finalPrice: "",
        couponId: "",
        notes: "",
        useCoupon: false,
        isActive: "true",
        status: "NOT_USED"
    });

    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" });
    const [statusDialog, setStatusDialog] = useState({ isOpen: false, itemId: null, itemName: "", isActive: false });
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, item: null });
    const [editDialog, setEditDialog] = useState({ isOpen: false, item: null, currentCouponId: "" });

    // حالات الفلترة والترتيب
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [userFilter, setUserFilter] = useState("all");
    const [courseFilter, setCourseFilter] = useState("all");
    const [levelFilter, setLevelFilter] = useState("all");
    const [sortBy, setSortBy] = useState("issuedAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // حالات البحث
    const [specializationSearch, setSpecializationSearch] = useState("");
    const [courseSearch, setCourseSearch] = useState("");
    const [instructorSearch, setInstructorSearch] = useState("");
    const [levelSearch, setLevelSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    // حالات التحديد
    const [selectedSpecialization, setSelectedSpecialization] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedInstructor, setSelectedInstructor] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");

    // التحقق من الكوبونات عند التعديل
    const [availableCouponsEdit, setAvailableCouponsEdit] = useState([]);
    const [couponCheckLoadingEdit, setCouponCheckLoadingEdit] = useState(false);

    // قوائم الفلترة
    const [filterCourses, setFilterCourses] = useState([]);
    const [filterLevels, setFilterLevels] = useState([]);

    // 🔄 حالات الترميز الجديدة
    const [codeLevels, setCodeLevels] = useState([]);
    const [selectedEncode, setSelectedEncode] = useState("");
    const [encodeSearch, setEncodeSearch] = useState("");
    const [encodeLoading, setEncodeLoading] = useState(false);

    // 🔄  حالات الترميز للتعديل
    const [selectedEncodeEdit, setSelectedEncodeEdit] = useState("");
    const [encodeSearchEdit, setEncodeSearchEdit] = useState("");
    const [encodeLoadingEdit, setEncodeLoadingEdit] = useState(false);

    const searchInputRef = useRef(null);

    // 🔄 دوال جلب البيانات الأساسية
    const fetchUsers = async () => {
        try {
            const res = await getAllUsers();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            setUsers(data);
        } catch (err) {
            console.error("❌ فشل تحميل المستخدمين:", err);
            showErrorToast("فشل تحميل المستخدمين");
        }
    };

    const fetchSpecializations = async () => {
        try {
            const res = await getSpecializations();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data :
                    Array.isArray(res.data?.data) ? res.data.data : [];
            setSpecializations(data);
        } catch (err) {
            console.error("❌ فشل تحميل الاختصاصات:", err);
            showErrorToast("فشل تحميل الاختصاصات");
        }
    };

    // 🔄 دالة جلب قائمة الترميزات
    const fetchCodeLevels = async () => {
        try {
            const res = await getCodeLevels();
            const data = Array.isArray(res.data?.data) ? res.data.data : [];
            setCodeLevels(data);
        } catch (err) {
            console.error("❌ فشل تحميل الترميزات:", err);
            showErrorToast("فشل تحميل قائمة الترميزات");
        }
    };

    // 🔄 دالة جلب تفاصيل المستوى بواسطة الترميز
    const fetchLevelByEncode = async (encode) => {
        if (!encode) return;

        setEncodeLoading(true);
        try {
            const res = await getCodeLevelByEncode(encode);
            const levelData = res.data?.data;

            if (levelData) {
                console.log("🎯 بيانات المستوى المسترجعة:", levelData);

                // الحصول على المستخدم المحدد إذا كان موجوداً
                const selectedUser = users.find(user => user.id.toString() === form.userId);
                const userPhone = selectedUser?.phone;

                // تحديد العملة بناءً على رقم الهاتف
                const currencyType = getCurrencyType(userPhone);
                console.log("💰 نوع العملة المحدد:", currencyType, "للمستخدم:", userPhone);

                const course = levelData.course;
                const instructor = levelData.instructor;
                const specialization = course?.specialization;

                if (specialization && course && instructor) {
                    // 🔄 إعادة تعيين فقط الاختيارات الهيكلية (بدون الترميز)
                    setSelectedSpecialization("");
                    setSelectedCourse("");
                    setSelectedInstructor("");
                    setSelectedLevel("");
                    setSpecializationSearch("");
                    setCourseSearch("");
                    setInstructorSearch("");
                    setLevelSearch("");

                    // إعادة تعيين جزء من النموذج
                    setForm(prev => ({
                        ...prev,
                        courseId: "",
                        courseLevelId: "",
                        originalPrice: "",
                        discountAmount: "0",
                        finalPrice: "",
                        amountPaid: "",
                        couponId: "",
                        useCoupon: false
                    }));
                    setCoupons([]);
                    setAvailableCoupons([]);

                    // 1. تعيين الاختصاص وجلب الكورسات
                    setSelectedSpecialization(specialization.id.toString());
                    await fetchCourses(specialization.id.toString());

                    // انتظار بسيط لضمان جلب الكورسات
                    await new Promise(resolve => setTimeout(resolve, 200));

                    // 2. تعيين الكورس وجلب المدرسين
                    setSelectedCourse(course.id.toString());
                    await fetchInstructorsByCourse(course.id.toString());

                    // انتظار بسيط لضمان جلب المدرسين
                    await new Promise(resolve => setTimeout(resolve, 200));

                    // 3. تعيين المدرس وجلب المستويات
                    setSelectedInstructor(instructor.id.toString());
                    await fetchLevelsByInstructor(instructor.id.toString());

                    // انتظار بسيط لضمان جلب المستويات
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // 4. تعيين المستوى النهائي
                    setSelectedLevel(levelData.id.toString());

                    // 5. تعيين السعر تلقائياً بعد تأكيد تعيين المستوى مع مراعاة العملة
                    setTimeout(() => {
                        const selectedLevelData = levels.find(level => level.id === levelData.id);
                        if (selectedLevelData) {
                            const price = getPriceByCurrency(selectedLevelData, userPhone);
                            console.log("💰 تعيين السعر التلقائي بناءً على العملة:", {
                                price,
                                currencyType,
                                userPhone,
                                priceSAR: selectedLevelData.priceSAR,
                                priceUSD: selectedLevelData.priceUSD
                            });

                            setForm(prev => ({
                                ...prev,
                                originalPrice: price,
                                finalPrice: price,
                                amountPaid: price
                            }));
                        }
                        showSuccessToast(`تم تحميل بيانات المستوى تلقائياً - العملة: ${currencyType}`);
                    }, 500);
                }
            }
        } catch (err) {
            console.error("❌ فشل جلب بيانات الترميز:", err);
            showErrorToast("فشل تحميل بيانات الترميز");
        } finally {
            setEncodeLoading(false);
        }
    };

    const fetchCourses = async (specializationId) => {
        if (!specializationId) {
            setCourses([]);
            setSelectedCourse("");
            return;
        }

        try {
            const res = await getCourses();
            let allCourses = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data : [];

            const filteredCourses = allCourses.filter(course =>
                course.specializationId === parseInt(specializationId)
            );
            setCourses(filteredCourses);
        } catch (err) {
            console.error("❌ فشل تحميل الكورسات:", err);
            showErrorToast("فشل تحميل المواد");
        }
    };

    const fetchInstructorsByCourse = async (courseId) => {
        if (!courseId) {
            setInstructors([]);
            setSelectedInstructor("");
            return;
        }

        try {
            const res = await getInstructorsByCourse(courseId);
            let data = [];
            if (Array.isArray(res.data?.data?.instructors)) {
                data = res.data.data.instructors;
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }

            setInstructors(data || []);
        } catch (err) {
            console.error("❌ فشل تحميل المدرسين:", err);
            showErrorToast("فشل تحميل المدرسين");
            setInstructors([]);
        }
    };

    const fetchLevelsByInstructor = async (instructorId) => {
        if (!instructorId) {
            setLevels([]);
            setSelectedLevel("");
            return;
        }

        try {
            const selectedInstructorData = instructors.find(inst => inst.id === parseInt(instructorId));

            if (!selectedInstructorData || !selectedInstructorData.levelIds) {
                setLevels([]);
                return;
            }

            const res = await getCourseLevels(selectedCourse);
            let allLevels = [];
            if (Array.isArray(res.data?.data)) {
                if (res.data.data.length > 0 && Array.isArray(res.data.data[0])) {
                    allLevels = res.data.data[0];
                } else {
                    allLevels = res.data.data;
                }
            } else if (Array.isArray(res.data?.data?.items)) {
                allLevels = res.data.data.items;
            } else if (Array.isArray(res.data?.data?.data)) {
                allLevels = res.data.data.data;
            }

            const filteredLevels = allLevels.filter(level =>
                selectedInstructorData.levelIds.includes(level.id)
            );

            setLevels(filteredLevels || []);
        } catch (err) {
            console.error("❌ فشل تحميل مستويات المدرس:", err);
            showErrorToast("فشل تحميل مستويات المدرس");
            setLevels([]);
        }
    };

    const fetchActiveCoupons = async (levelId) => {
        if (!levelId) {
            setCoupons([]);
            return;
        }

        try {
            const res = await getActiveCouponsByLevel(levelId);
            let data = [];
            if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }

            setCoupons(data);
            return data;
        } catch (err) {
            console.error("❌ فشل تحميل الكوبونات:", err);
            showErrorToast("فشل تحميل الكوبونات");
            setCoupons([]);
            return [];
        }
    };

    const fetchAccessCodes = async () => {
        setLoading(true);
        try {
            const res = await getAllAccessCodes();
            const data = Array.isArray(res.data?.data) ? res.data.data : [];
            setAllCodes(data);
            setCodes(data);

            // استخراج الكورسات والمستويات الفريدة للفلترة
            const uniqueCourses = [];
            const uniqueLevels = [];
            const courseMap = new Map();
            const levelMap = new Map();

            data.forEach(item => {
                if (item.courseLevel?.course && !courseMap.has(item.courseLevel.course.id)) {
                    courseMap.set(item.courseLevel.course.id, item.courseLevel.course);
                    uniqueCourses.push(item.courseLevel.course);
                }

                if (item.courseLevel && !levelMap.has(item.courseLevel.id)) {
                    levelMap.set(item.courseLevel.id, item.courseLevel);
                    uniqueLevels.push(item.courseLevel);
                }
            });

            setFilterCourses(uniqueCourses);
            setFilterLevels(uniqueLevels);

        } catch (err) {
            console.error("❌ فشل تحميل الأكواد:", err);
            showErrorToast("فشل تحميل الأكواد");
        } finally {
            setLoading(false);
        }
    };

    // 🔍 دالة التحقق من الكوبونات
    const checkAvailableCoupons = async () => {
        if (!form.userId || !selectedLevel) {
            showErrorToast("يرجى اختيار المستخدم والمستوى أولاً");
            return;
        }

        setCouponCheckLoading(true);
        try {
            const requestData = {
                courseLevelId: parseInt(selectedLevel),
                userId: parseInt(form.userId)
            };

            const res = await getCouponsByLevelOrUser(requestData);
            let data = [];
            if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data?.data?.items)) {
                data = res.data.data.items;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }

            setAvailableCoupons(data);

            // عرض رسالة مع نوع العملة
            const selectedUser = users.find(user => user.id.toString() === form.userId);
            const currencyType = getCurrencyType(selectedUser?.phone);
            const currencyText = currencyType === 'SAR' ? 'ل.س' : '$';

            showSuccessToast(`تم العثور على ${data.length} كوبون متاح - العملة: ${currencyText}`);

            if (data.length > 0) {
                setForm(prev => ({ ...prev, useCoupon: true }));
            }

            return data;
        } catch (err) {
            console.error("❌ فشل التحقق من الكوبونات:", err);
            showErrorToast(err?.response?.data?.message || "فشل التحقق من الكوبونات");
            setAvailableCoupons([]);
            return [];
        } finally {
            setCouponCheckLoading(false);
        }
    };

    // 🔍 دالة التحقق من الكوبونات للمستخدم والمستوى في التعديل
    const checkAvailableCouponsEdit = async () => {
        if (!form.userId || !selectedLevel) {
            showErrorToast("يرجى اختيار المستخدم والمستوى أولاً");
            return;
        }

        setCouponCheckLoadingEdit(true);
        try {
            const requestData = {
                courseLevelId: parseInt(selectedLevel),
                userId: parseInt(form.userId)
            };

            console.log("🔍 التحقق من الكوبونات للتعديل:", requestData);
            const res = await getCouponsByLevelOrUser(requestData);

            let data = [];
            if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data?.data?.items)) {
                data = res.data.data.items;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }

            setAvailableCouponsEdit(data);
            showSuccessToast(`تم العثور على ${data.length} كوبون متاح`);

            // إذا كان هناك كوبون محدد مسبقاً، تأكد من أنه متاح
            if (form.couponId && data.some(coupon => coupon.id.toString() === form.couponId)) {
                console.log("✅ الكوبون الحالي متاح في القائمة");
            } else if (form.couponId) {
                console.log("⚠️ الكوبون الحالي غير متاح، إزالته");
                setForm(prev => ({ ...prev, couponId: "" }));
            }

            return data;
        } catch (err) {
            console.error("❌ فشل التحقق من الكوبونات للتعديل:", err);
            showErrorToast(err?.response?.data?.message || "فشل التحقق من الكوبونات");
            setAvailableCouponsEdit([]);
            return [];
        } finally {
            setCouponCheckLoadingEdit(false);
        }
    };

    // حساب السعر النهائي
    const calculatePriceWithCoupon = async (couponId, courseLevelId) => {
        if (!couponId || !courseLevelId) return;

        setPriceLoading(true);
        try {
            const selectedLevelData = levels.find(level => level.id === parseInt(courseLevelId));
            const coupon = availableCoupons.find(c => c.id === parseInt(couponId));
            const selectedUser = users.find(user => user.id.toString() === form.userId);

            if (!selectedLevelData || !coupon || !selectedUser) {
                console.log("❌ بيانات غير مكتملة");
                return;
            }

            // تحديد العملة بناءً على رقم الهاتف
            const currencyType = getCurrencyType(selectedUser.phone);
            const isSyrianUser = currencyType === 'SAR';

            // تحديد السعر الأساسي بناءً على العملة
            const basePrice = isSyrianUser ?
                (selectedLevelData.priceSAR || 0) :
                (selectedLevelData.priceUSD || 0);

            let discountAmount = 0;
            let finalPrice = basePrice;

            // تطبيق الخصم بناءً على نوع الكوبون
            if (coupon.isPercent) {
                discountAmount = (basePrice * coupon.discount) / 100;
            } else {
                // إذا كان الكوبون بقيمة ثابتة، نستخدمه كما هو
                discountAmount = coupon.discount;
            }

            finalPrice = basePrice - discountAmount;

            // التأكد من أن الأسعار غير سالبة
            finalPrice = Math.max(0, finalPrice);
            discountAmount = Math.max(0, discountAmount);

            console.log("🧮 الحساب بالعملة المناسبة:", {
                basePrice,
                discountAmount,
                finalPrice,
                coupon: coupon.code,
                currencyType,
                isPercent: coupon.isPercent,
                user: selectedUser.name,
                phone: selectedUser.phone
            });

            setForm(prev => ({
                ...prev,
                originalPrice: basePrice.toString(),
                discountAmount: discountAmount.toString(),
                finalPrice: finalPrice.toString(),
                amountPaid: finalPrice.toString()
            }));

        } catch (err) {
            console.error("❌ فشل حساب السعر:", err);
            showErrorToast("فشل حساب السعر");

            // الحساب المحلي كبديل
            calculatePriceLocally(couponId, courseLevelId);
        } finally {
            setPriceLoading(false);
        }
    };

    // 🧮 دالة حساب السعر محلياً
    const calculatePriceLocally = (couponId, courseLevelId) => {
        const selectedLevelData = levels.find(level => level.id === parseInt(courseLevelId));
        const coupon = availableCoupons.find(c => c.id === parseInt(couponId));
        const selectedUser = users.find(user => user.id.toString() === form.userId);

        if (!selectedLevelData || !coupon || !selectedUser) return;

        const currencyType = getCurrencyType(selectedUser.phone);
        const isSyrianUser = currencyType === 'SAR';

        const basePrice = isSyrianUser ?
            (selectedLevelData.priceSAR || 0) :
            (selectedLevelData.priceUSD || 0);

        let discountAmount = 0;

        if (coupon.isPercent) {
            discountAmount = (basePrice * coupon.discount) / 100;
        } else {
            discountAmount = coupon.discount;
        }

        const finalPrice = Math.max(0, basePrice - discountAmount);

        console.log("🧮 الحساب المحلي بالعملة المناسبة:", {
            basePrice,
            discountAmount,
            finalPrice,
            currencyType,
            coupon: coupon.code
        });

        setForm(prev => ({
            ...prev,
            originalPrice: basePrice.toString(),
            discountAmount: discountAmount.toString(),
            finalPrice: finalPrice.toString(),
            amountPaid: finalPrice.toString()
        }));
    };
    // 💰 حساب السعر النهائي مع الكوبون في التعديل (بالعملة المناسبة)
    const calculatePriceWithCouponEdit = async (couponId, courseLevelId) => {
        if (!couponId || !courseLevelId) return;

        setPriceLoading(true);
        try {
            console.log("🔄 حساب السعر في التعديل للكوبون:", couponId, "والمستوى:", courseLevelId);

            const selectedLevelData = levels.find(level => level.id === parseInt(courseLevelId));
            const coupon = availableCouponsEdit.find(c => c.id === parseInt(couponId));
            const selectedUser = users.find(user => user.id.toString() === form.userId);

            if (!selectedLevelData || !coupon || !selectedUser) {
                console.log("❌ بيانات غير مكتملة في التعديل:", { selectedLevelData, coupon, selectedUser });
                return;
            }

            // تحديد العملة بناءً على رقم الهاتف
            const currencyType = getCurrencyType(selectedUser.phone);
            const isSyrianUser = currencyType === 'SAR';

            const basePrice = isSyrianUser ?
                (selectedLevelData.priceSAR || 0) :
                (selectedLevelData.priceUSD || 0);

            let discountAmount = 0;

            if (coupon.isPercent) {
                discountAmount = (basePrice * coupon.discount) / 100;
            } else {
                discountAmount = coupon.discount;
            }

            const finalPrice = Math.max(0, basePrice - discountAmount);

            console.log("💰 حساب السعر في التعديل:", {
                basePrice,
                discountAmount,
                finalPrice,
                currencyType,
                user: selectedUser.name,
                phone: selectedUser.phone,
                coupon: coupon.code
            });

            setForm(prev => ({
                ...prev,
                originalPrice: basePrice.toString(),
                discountAmount: discountAmount.toString(),
                finalPrice: finalPrice.toString(),
                amountPaid: finalPrice.toString()
            }));

        } catch (err) {
            console.error("❌ فشل حساب السعر في التعديل:", err);
            showErrorToast("فشل حساب السعر");

            // الحساب المحلي كبديل
            calculatePriceLocallyEdit(couponId, courseLevelId);
        } finally {
            setPriceLoading(false);
        }
    };

    // 🧮 دالة حساب السعر محلياً في التعديل
    const calculatePriceLocallyEdit = (couponId, courseLevelId) => {
        const selectedLevelData = levels.find(level => level.id === parseInt(courseLevelId));
        const coupon = availableCouponsEdit.find(c => c.id === parseInt(couponId));
        const selectedUser = users.find(user => user.id.toString() === form.userId);

        if (!selectedLevelData || !coupon || !selectedUser) return;

        const currencyType = getCurrencyType(selectedUser.phone);
        const isSyrianUser = currencyType === 'SAR';

        const basePrice = isSyrianUser ?
            (selectedLevelData.priceSAR || 0) :
            (selectedLevelData.priceUSD || 0);

        let discountAmount = 0;

        if (coupon.isPercent) {
            discountAmount = (basePrice * coupon.discount) / 100;
        } else {
            discountAmount = coupon.discount;
        }

        const finalPrice = Math.max(0, basePrice - discountAmount);

        console.log("🧮 الحساب المحلي في التعديل:", {
            basePrice,
            discountAmount,
            finalPrice,
            currencyType,
            coupon: coupon.code
        });

        setForm(prev => ({
            ...prev,
            originalPrice: basePrice.toString(),
            discountAmount: discountAmount.toString(),
            finalPrice: finalPrice.toString(),
            amountPaid: finalPrice.toString()
        }));
    };

    // 🗑️ دوال الإجراءات
    const handleDeleteCode = async (id) => {
        try {
            await deleteAccessCode(id);
            showSuccessToast("تم حذف الكود بنجاح");
            fetchAccessCodes();
        } catch (err) {
            console.error("❌ فشل حذف الكود:", err);
            showErrorToast(err?.response?.data?.message || "فشل حذف الكود");
        }
    };

    const handleUpdateCodeStatus = async (id, isActive) => {
        try {
            await updateAccessCodeStatus(id, isActive);
            showSuccessToast(`تم ${isActive ? 'تفعيل' : 'تعطيل'} الكود بنجاح`);
            fetchAccessCodes();
        } catch (err) {
            console.error("❌ فشل تحديث حالة الكود:", err);
            showErrorToast(err?.response?.data?.message || "فشل تحديث حالة الكود");
        }
    };

    const handleEditCode = async () => {
        if (!editDialog.item) return;

        try {
            const requestData = {
                courseLevelId: parseInt(form.courseLevelId),
                userId: parseInt(form.userId),
                validityInMonths: parseFloat(form.validityInMonths),
                isActive: form.isActive === "true",
                amountPaid: parseFloat(form.amountPaid),
                notes: form.notes || null,
                couponId: form.couponId ? parseInt(form.couponId) : null
            };

            await updateAccessCode(editDialog.item.id, requestData);
            showSuccessToast("تم تعديل الكود بنجاح");

            setEditDialog({ isOpen: false, item: null });
            resetAllSelections();
            fetchAccessCodes();
        } catch (err) {
            console.error("❌ فشل تعديل الكود:", err);
            showErrorToast(err?.response?.data?.message || "فشل تعديل الكود");
        }
    };

    // 🛠️ دالة فتح نموذج التعديل الكامل
    const openEditDialog = async (item) => {
        if (!item) {
            console.error("❌ عنصر غير محدد لفتح التعديل");
            return;
        }

        console.log("🔧 فتح نموذج التعديل للعنصر:", item);

        // ✅ حفظ الكوبون الحالي قبل فتح الديالوج
        const transaction = item.transaction?.[0];
        const currentCouponId = transaction?.coupon?.id?.toString() || "";

        setEditDialog({
            isOpen: true,
            item,
            currentCouponId
        });

        // 🔄 إعادة تعيين حالات التعديل أولاً
        resetAllSelectionsEdit();

        // استخراج البيانات الأساسية
        const courseLevel = item.courseLevel;
        const course = courseLevel?.course;
        const user = item.user;

        // تعبئة النموذج بجميع البيانات
        const formData = {
            // بيانات الهيكلية
            specializationId: course?.specializationId?.toString() || "",
            courseId: course?.id?.toString() || "",
            instructorId: courseLevel?.instructorId?.toString() || "",
            courseLevelId: courseLevel?.id?.toString() || "",

            // البيانات الأخرى
            validityInMonths: item.validityInMonths?.toString() || "6",
            isActive: item.isActive?.toString() || "true",
            userId: item.userId?.toString() || user?.id?.toString() || "",
            couponId: currentCouponId,
            amountPaid: getAmountPaid(item) || "",
            notes: transaction?.notes || "",

            // بيانات للعرض
            userName: user?.name || "",
            userPhone: user?.phone || ""
        };

        console.log("📝 بيانات النموذج المعبأة:", formData);
        setForm(formData);

        // 🔄 محاولة العثور على الترميز الحالي للمستوى
        if (courseLevel?.id) {
            const currentLevel = codeLevels.find(level => level.id === courseLevel.id);
            if (currentLevel?.encode) {
                setSelectedEncodeEdit(currentLevel.encode);
                console.log("🎯 تم تعيين الترميز الحالي:", currentLevel.encode);
            }
        }

        // تعيين جميع الاختيارات مع التسلسل الهرمي
        const specializationId = course?.specializationId?.toString() || "";
        const courseId = course?.id?.toString() || "";
        const instructorId = courseLevel?.instructorId?.toString() || "";
        const levelId = courseLevel?.id?.toString() || "";

        console.log("🎯 الاختيارات:", { specializationId, courseId, instructorId, levelId });

        setTimeout(() => {
            if (formData.userId && formData.courseLevelId) {
                console.log("🔄 تحقق تلقائي أولي من الكوبونات");
                checkAvailableCouponsEdit();
            }
        }, 500);

        try {
            // 🔄 التسلسل الهرمي باستخدام async/await
            setSelectedSpecialization(specializationId);

            if (specializationId) {
                console.log("🔄 جلب الكورسات للاختصاص:", specializationId);
                await fetchCourses(specializationId);

                await new Promise(resolve => setTimeout(resolve, 100));

                setSelectedCourse(courseId);
                console.log("✅ تم تعيين الكورس:", courseId);

                if (courseId) {
                    console.log("🔄 جلب المدرسين للكورس:", courseId);
                    await fetchInstructorsByCourse(courseId);

                    await new Promise(resolve => setTimeout(resolve, 100));

                    setSelectedInstructor(instructorId);
                    console.log("✅ تم تعيين المدرس:", instructorId);

                    if (instructorId) {
                        console.log("🔄 جلب المستويات للمدرس:", instructorId);
                        await fetchLevelsByInstructor(instructorId);

                        await new Promise(resolve => setTimeout(resolve, 100));

                        setSelectedLevel(levelId);
                        console.log("✅ تم تعيين المستوى:", levelId);

                        if (levelId) {
                            console.log("🔄 جلب الكوبونات للمستوى:", levelId);
                            await fetchActiveCoupons(levelId);
                            console.log("✅ تم جلب الكوبونات");

                            setTimeout(() => {
                                if (currentCouponId) {
                                    console.log("🎯 إعادة تعيين الكوبون الأصلي:", currentCouponId);
                                    setForm(prev => ({ ...prev, couponId: currentCouponId }));
                                }
                            }, 200);
                        }
                    }
                }
            }

            console.log("✅ تم تحميل جميع البيانات بنجاح");

        } catch (error) {
            console.error("❌ خطأ في تحميل البيانات:", error);
            showErrorToast("حدث خطأ في تحميل البيانات");
        }
    };

    // ✏️ دوال النموذج
    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleUseCouponChange = (useCoupon) => {
        setForm(prev => ({
            ...prev,
            useCoupon,
            couponId: useCoupon ? prev.couponId : ""
        }));

        if (!useCoupon) {
            const selectedLevelData = levels.find(level => level.id === parseInt(selectedLevel));
            if (selectedLevelData) {
                const price = selectedLevelData.priceSAR || selectedLevelData.priceUSD || "0";
                setForm(prev => ({
                    ...prev,
                    originalPrice: price.toString(),
                    discountAmount: "0",
                    finalPrice: price.toString(),
                    amountPaid: price.toString()
                }));
            }
        }
    };

    const onReceiptChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                showErrorToast("حجم الملف كبير جداً. الحد الأقصى 5MB");
                e.target.value = '';
                return;
            }

            setReceiptFile(file);
            setReceiptPreview(URL.createObjectURL(file));
        } else {
            setReceiptFile(null);
            setReceiptPreview(null);
        }
    };

    // 🔄 دالة جلب تفاصيل المستوى بواسطة الترميز للتعديل
    const fetchLevelByEncodeEdit = async (encode) => {
        if (!encode) return;

        setEncodeLoadingEdit(true);
        try {
            const res = await getCodeLevelByEncode(encode);
            const levelData = res.data?.data;

            if (levelData) {
                console.log("🎯 بيانات المستوى المسترجعة للتعديل:", levelData);

                // الحصول على المستخدم المحدد إذا كان موجوداً
                const selectedUser = users.find(user => user.id.toString() === form.userId);
                const userPhone = selectedUser?.phone;

                // تحديد العملة بناءً على رقم الهاتف
                const currencyType = getCurrencyType(userPhone);
                console.log("💰 نوع العملة المحدد للتعديل:", currencyType, "للمستخدم:", userPhone);

                const course = levelData.course;
                const instructor = levelData.instructor;
                const specialization = course?.specialization;

                if (specialization && course && instructor) {
                    // 🔄 إعادة تعيين فقط الاختيارات الهيكلية (بدون الترميز)
                    setSelectedSpecialization("");
                    setSelectedCourse("");
                    setSelectedInstructor("");
                    setSelectedLevel("");
                    setSpecializationSearch("");
                    setCourseSearch("");
                    setInstructorSearch("");
                    setLevelSearch("");

                    // إعادة تعيين جزء من النموذج
                    setForm(prev => ({
                        ...prev,
                        courseId: "",
                        courseLevelId: "",
                        originalPrice: "",
                        discountAmount: "0",
                        finalPrice: "",
                        amountPaid: "",
                        couponId: "",
                        useCoupon: false
                    }));
                    setCoupons([]);
                    setAvailableCouponsEdit([]);

                    // 1. تعيين الاختصاص وجلب الكورسات
                    setSelectedSpecialization(specialization.id.toString());
                    await fetchCourses(specialization.id.toString());

                    await new Promise(resolve => setTimeout(resolve, 200));

                    // 2. تعيين الكورس وجلب المدرسين
                    setSelectedCourse(course.id.toString());
                    await fetchInstructorsByCourse(course.id.toString());

                    await new Promise(resolve => setTimeout(resolve, 200));

                    // 3. تعيين المدرس وجلب المستويات
                    setSelectedInstructor(instructor.id.toString());
                    await fetchLevelsByInstructor(instructor.id.toString());

                    await new Promise(resolve => setTimeout(resolve, 300));

                    // 4. تعيين المستوى النهائي
                    setSelectedLevel(levelData.id.toString());

                    // 5. تعيين السعر تلقائياً مع مراعاة العملة
                    setTimeout(() => {
                        const selectedLevelData = levels.find(level => level.id === levelData.id);
                        if (selectedLevelData) {
                            const price = getPriceByCurrency(selectedLevelData, userPhone);
                            console.log("💰 تعيين السعر التلقائي للتعديل:", {
                                price,
                                currencyType,
                                userPhone
                            });
                            setForm(prev => ({
                                ...prev,
                                originalPrice: price,
                                finalPrice: price,
                                amountPaid: price
                            }));
                        }
                        showSuccessToast(`تم تحميل بيانات المستوى تلقائياً - العملة: ${currencyType}`);
                    }, 500);
                }
            }
        } catch (err) {
            console.error("❌ فشل جلب بيانات الترميز للتعديل:", err);
            showErrorToast("فشل تحميل بيانات الترميز");
        } finally {
            setEncodeLoadingEdit(false);
        }
    };

    // 🔄 تحديث السعر تلقائياً عند تغيير المستخدم
    useEffect(() => {
        if (form.userId && selectedLevel) {
            const selectedUser = users.find(user => user.id.toString() === form.userId);
            const selectedLevelData = levels.find(level => level.id === parseInt(selectedLevel));

            if (selectedUser && selectedLevelData) {
                const userPhone = selectedUser.phone;
                const currencyType = getCurrencyType(userPhone);
                const price = getPriceByCurrency(selectedLevelData, userPhone);

                console.log("🔄 تحديث السعر عند تغيير المستخدم:", {
                    user: selectedUser.name,
                    phone: userPhone,
                    currencyType,
                    price
                });

                setForm(prev => ({
                    ...prev,
                    originalPrice: price,
                    finalPrice: price,
                    amountPaid: price
                }));

                // إذا كان هناك كوبون محدد، إعادة حساب السعر
                if (form.couponId) {
                    setTimeout(() => {
                        calculatePriceWithCoupon(form.couponId, selectedLevel);
                    }, 300);
                }
            }
        }
    }, [form.userId, users]);

    // 🔄 إعادة تعيين جميع الاختيارات للتعديل
    const resetAllSelectionsEdit = () => {
        setSelectedSpecialization("");
        setSelectedCourse("");
        setSelectedInstructor("");
        setSelectedLevel("");
        setSelectedEncodeEdit("");
        setSpecializationSearch("");
        setCourseSearch("");
        setInstructorSearch("");
        setLevelSearch("");
        setEncodeSearchEdit("");
        setForm(prev => ({
            ...prev,
            courseId: "",
            courseLevelId: "",
            originalPrice: "",
            discountAmount: "0",
            finalPrice: "",
            amountPaid: "",
            couponId: "",
            useCoupon: false
        }));
        setCoupons([]);
        setAvailableCouponsEdit([]);
    };

    // 🔄 إعادة تعيين جميع الاختيارات
    const resetAllSelections = () => {
        setSelectedSpecialization("");
        setSelectedCourse("");
        setSelectedInstructor("");
        setSelectedLevel("");
        setSelectedEncode(""); // إعادة تعيين الترميز أيضاً
        setSpecializationSearch("");
        setCourseSearch("");
        setInstructorSearch("");
        setLevelSearch("");
        setEncodeSearch("");
        setForm(prev => ({
            ...prev,
            courseId: "",
            courseLevelId: "",
            originalPrice: "",
            discountAmount: "0",
            finalPrice: "",
            amountPaid: "",
            couponId: "",
            useCoupon: false
        }));
        setCoupons([]);
        setAvailableCoupons([]);
    };

    // 📤 دالة توليد الكود
    const handleGenerateCode = async () => {
        if (!selectedLevel) return showErrorToast("يرجى اختيار مستوى المادة");
        if (!form.userId) return showErrorToast("يرجى اختيار المستخدم");
        if (!receiptFile) return showErrorToast("يرجى رفع صورة الإيصال");
        if (!form.amountPaid || parseFloat(form.amountPaid) <= 0) return showErrorToast("يرجى إدخال مبلغ مدفوع صحيح");

        try {
            const formData = new FormData();
            formData.append('courseLevelId', selectedLevel);
            formData.append('userId', form.userId);
            formData.append('validityInMonths', form.validityInMonths);
            formData.append('amountPaid', form.amountPaid);
            if (form.notes) formData.append('notes', form.notes);
            if (form.useCoupon && form.couponId) formData.append('couponId', form.couponId);
            formData.append('receiptImageUrl', receiptFile);

            await generateAccessCode(formData);
            showSuccessToast("تم توليد الكود بنجاح");

            // إعادة تعيين النموذج
            setForm({
                courseId: "",
                courseLevelId: "",
                userId: "",
                validityInMonths: "1.5",
                amountPaid: "",
                originalPrice: "",
                discountAmount: "0",
                finalPrice: "",
                couponId: "",
                notes: "",
                useCoupon: false
            });
            setReceiptFile(null);
            setReceiptPreview(null);
            resetAllSelections();
            setIsDialogOpen(false);
            fetchAccessCodes();
        } catch (err) {
            console.error("❌ فشل توليد الكود:", err);
            showErrorToast(err?.response?.data?.message || "فشل توليد الكود");
        }
    };

    // 📋 دوال مساعدة
    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            showSuccessToast("تم نسخ الكود إلى الحافظة");
        }).catch(() => {
            showErrorToast("فشل نسخ الكود");
        });
    };

    const getAmountPaid = (item) => {
        if (!item || !item.transaction || item.transaction.length === 0) {
            return "0";
        }

        const transaction = item.transaction[0];
        const amountPaid = transaction.amountPaid;

        if (!amountPaid) {
            return "0";
        }

        if (amountPaid.value !== undefined) {
            return amountPaid.value.toString();
        }

        if (typeof amountPaid === 'number') {
            return amountPaid.toString();
        }

        if (typeof amountPaid === 'object' && amountPaid.d && Array.isArray(amountPaid.d)) {
            const baseNumber = amountPaid.d[0];
            return baseNumber.toString();
        }

        return amountPaid?.toString() || "0";
    };

    const getCouponInfo = (item) => {
        if (!item || !item.transaction || item.transaction.length === 0) return null;
        return item.transaction[0].coupon;
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/tallaam_logo2.png";
        const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
        const cleanImageUrl = imageUrl.replace(/^\//, "");
        return `${cleanBaseUrl}/${cleanImageUrl}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد";
        return new Date(dateString).toLocaleDateString('en-US');
    };

    // 🔍 دالة التحقق من نوع العملة بناءً على رقم الهاتف
    const getCurrencyType = (phone) => {
        if (!phone) return 'USD'; // افتراضي دولار إذا لم يكن هناك رقم

        const cleanPhone = phone.toString().replace(/\s+/g, '');

        // إذا بدأ الرقم بـ +963 أو 963 أو 09 فهو سوري
        if (cleanPhone.startsWith('+963') ||
            cleanPhone.startsWith('963') ||
            cleanPhone.startsWith('09')) {
            return 'SAR';
        }

        return 'USD';
    };

    // 💰 دالة الحصول على السعر المناسب بناءً على العملة
    const getPriceByCurrency = (levelData, phone) => {
        if (!levelData) return "0";

        const currencyType = getCurrencyType(phone);

        if (currencyType === 'SAR' && levelData.priceSAR > 0) {
            return levelData.priceSAR.toString();
        } else if (levelData.priceUSD > 0) {
            return levelData.priceUSD.toString();
        }

        return "0";
    };

    // 🎯 دوال الحالة Status
    const getStatusText = (status) => {
        switch (status) {
            case 'NOT_USED':
                return 'غير مستخدم';
            case 'USED':
                return 'مستخدم';
            case 'CANCELLED':
                return 'ملغى';
            case 'EXPIRED':
                return 'منتهي الصلاحية';
            default:
                return 'غير محدد';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'NOT_USED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'USED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'EXPIRED':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getActiveStatusText = (isActive) => {
        return isActive ? 'مفعل' : 'معطل';
    };

    const getActiveStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
    };

    // 🔄 فلترة البيانات للاختيارات
    const filteredSpecializations = useMemo(() => {
        if (!specializationSearch) return specializations;
        return specializations.filter(spec =>
            spec.name?.toLowerCase().includes(specializationSearch.toLowerCase()) ||
            spec.title?.toLowerCase().includes(specializationSearch.toLowerCase())
        );
    }, [specializations, specializationSearch]);

    const filteredCoursesForSelect = useMemo(() => {
        if (!courseSearch) return courses;
        return courses.filter(course =>
            course.title?.toLowerCase().includes(courseSearch.toLowerCase())
        );
    }, [courses, courseSearch]);

    const filteredInstructorsForSelect = useMemo(() => {
        if (!instructorSearch) return instructors;
        return instructors.filter(instructor =>
            instructor.name?.toLowerCase().includes(instructorSearch.toLowerCase())
        );
    }, [instructors, instructorSearch]);

    const filteredLevelsForSelect = useMemo(() => {
        if (!levelSearch) return levels;
        return levels.filter(level =>
            level.name?.toLowerCase().includes(levelSearch.toLowerCase())
        );
    }, [levels, levelSearch]);

    // 🔄 فلترة الترميزات للبحث
    const filteredCodeLevels = useMemo(() => {
        if (!encodeSearch) return codeLevels;
        return codeLevels.filter(level =>
            level.encode?.toLowerCase().includes(encodeSearch.toLowerCase()) ||
            level.name?.toLowerCase().includes(encodeSearch.toLowerCase())
        );
    }, [codeLevels, encodeSearch]);

    // 🔄 دوال التصفية والترتيب
    const filteredAndSortedCodes = useMemo(() => {
        let filtered = [...allCodes];

        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.courseLevel?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.courseLevel?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            if (statusFilter === "active") {
                filtered = filtered.filter(item => item.isActive);
            } else if (statusFilter === "inactive") {
                filtered = filtered.filter(item => !item.isActive);
            } else {
                filtered = filtered.filter(item => item.status === statusFilter);
            }
        }

        if (userFilter !== "all") {
            filtered = filtered.filter(item =>
                item.usedBy?.toString() === userFilter
            );
        }

        if (courseFilter !== "all") {
            filtered = filtered.filter(item =>
                item.courseLevel?.courseId?.toString() === courseFilter
            );
        }

        if (levelFilter !== "all") {
            filtered = filtered.filter(item =>
                item.courseLevel?.id?.toString() === levelFilter
            );
        }

        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case "code":
                    aValue = a.code?.toLowerCase() || "";
                    bValue = b.code?.toLowerCase() || "";
                    break;
                case "user":
                    aValue = a.user?.name?.toLowerCase() || "";
                    bValue = b.user?.name?.toLowerCase() || "";
                    break;
                case "course":
                    aValue = a.courseLevel?.course?.title?.toLowerCase() || "";
                    bValue = b.courseLevel?.course?.title?.toLowerCase() || "";
                    break;
                case "level":
                    aValue = a.courseLevel?.name?.toLowerCase() || "";
                    bValue = b.courseLevel?.name?.toLowerCase() || "";
                    break;
                case "status":
                    aValue = a.status || "";
                    bValue = b.status || "";
                    break;
                case "issuedAt":
                    aValue = new Date(a.issuedAt);
                    bValue = new Date(b.issuedAt);
                    break;
                case "isActive":
                    aValue = a.isActive;
                    bValue = b.isActive;
                    break;
                default:
                    aValue = new Date(a.issuedAt);
                    bValue = new Date(b.issuedAt);
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [allCodes, searchTerm, statusFilter, userFilter, courseFilter, levelFilter, sortBy, sortOrder]);

    const paginatedCodes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedCodes.slice(startIndex, endIndex);
    }, [filteredAndSortedCodes, currentPage, itemsPerPage]);

    // 📊 حسابات الترقيم
    const totalItems = filteredAndSortedCodes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setUserFilter("all");
        setCourseFilter("all");
        setLevelFilter("all");
        setSortBy("issuedAt");
        setSortOrder("desc");
        setCurrentPage(1);
    };

    const getSpecializationName = (specializationId) => {
        const specialization = specializations.find(spec => spec.id === parseInt(specializationId));
        return specialization ? (specialization.name || specialization.title) : "غير محدد";
    };

    const getCourseName = (courseId) => {
        const course = courses.find(crs => crs.id === parseInt(courseId));
        return course ? course.title : "غير محدد";
    };

    const getInstructorName = (instructorId) => {
        const instructor = instructors.find(inst => inst.id === parseInt(instructorId));
        return instructor ? instructor.name : "غير محدد";
    };

    const getLevelName = (levelId) => {
        const level = levels.find(lvl => lvl.id === parseInt(levelId));
        return level ? level.name : "غير محدد";
    };

    // 💰 مكون عرض معلومات السعر
    const PriceDisplay = ({ item }) => {
        const amountPaid = getAmountPaid(item);
        const coupon = getCouponInfo(item);

        // تحديد نوع العملة بناءً على المستخدم
        const userPhone = item.user?.phone;
        const currencyType = getCurrencyType(userPhone);
        const currencySymbol = currencyType === 'SAR' ? 'ل.س' : '$';

        return (
            <div className="space-y-2">
                <div>
                    <div className="text-xs text-muted-foreground">المبلغ المدفوع:</div>
                    <div className="font-bold text-lg">{amountPaid} {currencySymbol}</div>
                    <div className="text-xs text-blue-600">
                        {currencyType === 'SAR' ? 'العملة السورية' : 'العملة بالدولار'}
                    </div>
                </div>

                {item.courseLevel && (
                    <div className="border-t pt-2">
                        <div className="text-xs text-muted-foreground mb-1">سعر المادة:</div>
                        {currencyType === 'SAR' && item.courseLevel.priceSAR > 0 && (
                            <div className="font-medium text-sm">{item.courseLevel.priceSAR} ل.س</div>
                        )}
                        {currencyType === 'USD' && item.courseLevel.priceUSD > 0 && (
                            <div className="font-medium text-sm">{item.courseLevel.priceUSD} $</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                            {currencyType === 'SAR' && item.courseLevel.priceUSD > 0 &&
                                `(${item.courseLevel.priceUSD} $)`}
                            {currencyType === 'USD' && item.courseLevel.priceSAR > 0 &&
                                `(${item.courseLevel.priceSAR} ل.س)`}
                        </div>
                    </div>
                )}

                {coupon && (
                    <Badge variant="outline" className="flex items-center gap-1 mt-1">
                        <Tag className="w-3 h-3" />
                        {coupon.code}
                    </Badge>
                )}
            </div>
        );
    };

    // 👁️ عرض التفاصيل
    const renderCodeDetails = (item) => {
        if (!item) return null;

        const amountPaid = getAmountPaid(item);
        const coupon = getCouponInfo(item);

        return (
            <div className="space-y-8 text-right">
                {/* البطاقة الرئيسية */}
                <div className="bg-gradient-to-l from-white to-gray-50/50 border border-gray-200 rounded-2xl shadow-sm p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* العمود الأول - المعلومات الأساسية */}
                        <div className="space-y-6">
                            {/* الكود */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-bold text-lg text-gray-800 mb-3 block">الكود</Label>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                        <p className="text-xl font-mono font-bold bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg border border-blue-100 text-blue-700 text-center">
                                            {item.code}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 shadow-sm"
                                        onClick={() => copyToClipboard(item.code)}
                                    >
                                        <Copy className="w-4 h-4 ml-1" />
                                        نسخ
                                    </Button>
                                </div>
                            </div>

                            {/* حالة الاستخدام والحالة */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                    <Label className="font-semibold text-gray-700 mb-2 block">حالة الاستخدام</Label>
                                    <Badge className={`${getStatusColor(item.status)} px-3 py-1.5 text-sm font-medium rounded-full`}>
                                        {getStatusText(item.status)}
                                    </Badge>
                                </div>

                                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                    <Label className="font-semibold text-gray-700 mb-2 block">الحالة</Label>
                                    <Badge className={`${getActiveStatusColor(item.isActive)} px-3 py-1.5 text-sm font-medium rounded-full`}>
                                        {getActiveStatusText(item.isActive)}
                                    </Badge>
                                </div>
                            </div>

                            {/* المستخدم */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-3 block">المستخدم</Label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{item.user?.name || "غير محدد"}</p>
                                        <p className="text-sm text-gray-500 mt-1" dir="ltr">{item.user?.phone || "لا يوجد"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* مدة الصلاحية */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">مدة الصلاحية</Label>
                                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                                    <Calendar className="w-5 h-5 text-green-500" />
                                    <span>{item.validityInMonths || "غير محدد"} شهر</span>
                                </div>
                            </div>
                        </div>

                        {/* العمود الثاني - معلومات الدورة */}
                        <div className="space-y-6">
                            {/* الاختصاص */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">الاختصاص</Label>
                                <p className="text-lg font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                                    {item.courseLevel?.course?.specialization?.name ||
                                        item.courseLevel?.course?.specialization?.title ||
                                        "غير محدد"}
                                </p>
                            </div>
                            {/* المادة */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">المادة</Label>
                                <p className="text-lg font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                                    {item.courseLevel?.course?.title || "غير محدد"}
                                </p>
                            </div>

                            {/* المستوى */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">المستوى</Label>
                                <p className="text-lg font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                                    {item.courseLevel?.name || "غير محدد"}
                                </p>
                            </div>

                            {/* المدرب */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">المدرس</Label>
                                <div className="flex items-center gap-2 text-lg font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                                    <User className="w-4 h-4 text-gray-500" />
                                    {item.courseLevel?.instructor?.name || "غير محدد"}
                                </div>
                            </div>

                            {/* التواريخ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                    <Label className="font-semibold text-gray-700 mb-2 block">تاريخ الإصدار</Label>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        {formatDate(item.issuedAt)}
                                    </div>
                                </div>

                                {item.expiresAt && (
                                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                        <Label className="font-semibold text-gray-700 mb-2 block">تاريخ الانتهاء</Label>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Calendar className="w-4 h-4 text-orange-500" />
                                            {formatDate(item.expiresAt)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* المعلومات المالية */}
                <div className="bg-gradient-to-l from-white to-blue-50/30 border border-blue-100 rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                        <h3 className="font-bold text-2xl text-gray-800">المعلومات المالية</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* المبلغ المدفوع */}
                        <div className="space-y-3">
                            <Label className="font-semibold text-gray-700 text-lg">المبلغ المدفوع</Label>
                            <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg text-white">
                                <div className="text-3xl font-bold mb-2">{amountPaid} ل.س</div>
                                <div className="text-blue-100 text-sm flex items-center gap-1">
                                    <CreditCard className="w-4 h-4" />
                                    المبلغ الفعلي الذي تم دفعه
                                </div>
                            </div>
                        </div>

                        {/* الأسعار الأصلية */}
                        {item.courseLevel && (
                            <div className="space-y-3">
                                <Label className="font-semibold text-gray-700 text-lg">أسعار المادة الأصلية</Label>
                                <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
                                    {item.courseLevel.priceSAR > 0 && (
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-green-500" />
                                                السعر بالسوري:
                                            </span>
                                            <span className="font-bold text-xl text-gray-800">{item.courseLevel.priceSAR} ل.س</span>
                                        </div>
                                    )}
                                    {item.courseLevel.priceUSD > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-blue-500" />
                                                السعر بالدولار:
                                            </span>
                                            <span className="font-bold text-xl text-gray-800">{item.courseLevel.priceUSD} $</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* معلومات الكوبون */}
                        {coupon && (
                            <div className="lg:col-span-2">
                                <Label className="font-semibold text-gray-700 text-lg mb-3 block">معلومات الكوبون</Label>
                                <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                                <Tag className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-lg text-gray-800">{coupon.code}</span>
                                                <Badge variant="secondary" className="mr-3 bg-green-100 text-green-700 border-green-200">
                                                    {coupon.isPercent ? `${coupon.discount}% خصم` : `${coupon.discount} ل.س خصم`}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-sm text-green-600 font-medium">
                                            تم تطبيق الخصم
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* الملاحظات */}
                        {item.transaction && item.transaction.length > 0 && item.transaction[0].notes && (
                            <div className="lg:col-span-2">
                                <Label className="font-semibold text-gray-700 text-lg mb-3 block">الملاحظات</Label>
                                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-amber-500 mt-0.5" />
                                        <p className="text-amber-800 font-medium leading-relaxed">
                                            {item.transaction[0].notes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* صورة الإيصال */}
                {item.transaction && item.transaction.length > 0 && item.transaction[0].receiptImageUrl && (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                            <h3 className="font-bold text-2xl text-gray-800">صورة الإيصال</h3>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50 max-w-3xl w-full group hover:border-gray-400 transition-all duration-300 cursor-zoom-in">
                                <img
                                    src={getImageUrl(item.transaction[0].receiptImageUrl)}
                                    alt="صورة الإيصال"
                                    className="max-w-full h-auto max-h-96 rounded-xl shadow-md mx-auto transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02]"
                                    {...imageConfig}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/tallaam_logo2.png";
                                    }}
                                    onClick={() => {
                                        window.open(getImageUrl(item.transaction[0].receiptImageUrl), '_blank');
                                    }}
                                />
                                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                                    <ZoomIn className="w-4 h-4" />
                                    انقر للتكبير
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4 flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                                <Eye className="w-4 h-4" />
                                انقر على الصورة لعرضها بحجم كامل
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // 📱 مكون البطاقة للجوال
    const CodeCard = ({ item }) => {
        return (
            <Card className="mb-4">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary text-primary-foreground rounded-lg p-3">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{item.code}</h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge className={getStatusColor(item.status)}>
                                        {getStatusText(item.status)}
                                    </Badge>
                                    <Badge className={getActiveStatusColor(item.isActive)}>
                                        {getActiveStatusText(item.isActive)}
                                    </Badge>
                                    {item.validityInMonths && (
                                        <Badge variant="outline">
                                            {item.validityInMonths} شهر
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(item.code)}
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{item.user?.name || "غير محدد"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Book className="w-4 h-4 text-muted-foreground" />
                            <span>{item.courseLevel?.course?.title || "غير محدد"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDate(item.issuedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span>{getAmountPaid(item)} ل.س</span>
                        </div>
                    </div>

                    <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailDialog({ isOpen: true, item })}
                            className="flex-1"
                        >
                            <Eye className="w-4 h-4 ml-1" />
                            التفاصيل
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(item)}
                            className="flex-1"
                        >
                            <Edit className="w-4 h-4 ml-1" />
                            تعديل
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatusDialog({
                                isOpen: true,
                                itemId: item.id,
                                itemName: item.code,
                                isActive: !item.isActive
                            })}
                            className="flex-1"
                        >
                            {item.isActive ? <Pause className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" />}
                            {item.isActive ? "تعطيل" : "تفعيل"}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteDialog({
                                isOpen: true,
                                itemId: item.id,
                                itemName: item.code
                            })}
                            className="flex-1"
                        >
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // 🔍 مكون الفلترة
    const FilterSection = () => {
        const hasActiveFilters = searchTerm || statusFilter !== "all" || userFilter !== "all" || courseFilter !== "all" || levelFilter !== "all";
        const [localSearch, setLocalSearch] = useState(searchTerm);
        // تحديث searchTerm تلقائياً أثناء الكتابة مع debounce
        useEffect(() => {
            const timer = setTimeout(() => {
                setSearchTerm(localSearch);
            }, 1000); // تحديث بعد 300ms من توقف الكتابة

            return () => clearTimeout(timer);
        }, [localSearch]);

        return (
            <div className="space-y-6">
                {/* شريط الفلاتر الرئيسي */}
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-sm">
                    {/* عنوان القسم */}
                    <div className="flex items-center gap-2 mb-6">
                        <Filter className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-gray-800">فلاتر الأكواد</h3>
                    </div>

                    {/* الصف الأول من الفلاتر */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                        {/* Search - مع تأثيرات تفاعلية */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            </div>
                            {/* <Input
                                ref={searchInputRef}
                                defaultValue={searchTerm}
                                placeholder="بحث ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10 transition-all duration-200 
                                     border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                                     group-hover:border-gray-400 bg-white/80"
                            /> */}

                            {/* <Input
                                placeholder="بحث في الأكواد والمستخدمين والمواد..."
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                onBlur={() => setSearchTerm(localSearch)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchTerm(localSearch);
                                    }
                                }}
                                className="pr-10 transition-all duration-200 
                 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                 group-hover:border-gray-400 bg-white/80"
                            /> */}

                             <Input
                placeholder="بحث في الأكواد والمستخدمين والمواد..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pr-10 transition-all duration-200 
                     border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                     group-hover:border-gray-400 bg-white/80"
            />

                        </div>

                        {/* Status Filter - مع أيقونة */}
                        <div className="relative group">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="transition-all duration-200
                                                  border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                                                  group-hover:border-gray-400 bg-white/80">
                                    <div className="flex items-center gap-2">
                                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="فلترة بالحالة" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                    <SelectItem value="all" className="flex items-center gap-2">
                                        جميع الحالات
                                    </SelectItem>
                                    <SelectItem value="active" className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        مفعل
                                    </SelectItem>
                                    <SelectItem value="inactive" className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        معطل
                                    </SelectItem>
                                    <SelectItem value="NOT_USED" className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                        غير مستخدم
                                    </SelectItem>
                                    <SelectItem value="USED" className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4 text-green-600" />
                                        مستخدم
                                    </SelectItem>
                                    <SelectItem value="CANCELLED" className="flex items-center gap-2">
                                        <Ban className="h-4 w-4 text-orange-600" />
                                        ملغى
                                    </SelectItem>
                                    <SelectItem value="EXPIRED" className="flex items-center gap-2">
                                        <CalendarX className="h-4 w-4 text-gray-600" />
                                        منتهي الصلاحية
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User Filter - مع أيقونة */}
                        <div className="relative group">
                            <Select value={userFilter} onValueChange={setUserFilter}>
                                <SelectTrigger className="transition-all duration-200
                                                  border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                                                  group-hover:border-gray-400 bg-white/80">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="فلترة بالمستخدم" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent searchable className="bg-white border border-gray-200 shadow-lg max-h-60">
                                    <SelectItem value="all" className="flex items-center gap-2">
                                        جميع المستخدمين
                                    </SelectItem>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()} className="flex items-center gap-2">
                                            {/* <User className="h-4 w-4 text-gray-500" /> */}
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Items Per Page - مع أيقونة */}
                        <div className="relative group">
                            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                                <SelectTrigger className="transition-all duration-200
                                                  border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                                                  group-hover:border-gray-400 bg-white/80">
                                    <div className="flex items-center gap-2">
                                        <List className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="عدد العناصر" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                    <SelectItem value="5" className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                        5 عناصر
                                    </SelectItem>
                                    <SelectItem value="10" className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        10 عناصر
                                    </SelectItem>
                                    <SelectItem value="20" className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        20 عنصر
                                    </SelectItem>
                                    <SelectItem value="50" className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                        50 عنصر
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* الصف الثاني من الفلاتر */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Course Filter */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                                <BookOpen className="h-4 w-4 text-primary" />
                                فلترة المادة
                            </Label>
                            <Select value={courseFilter} onValueChange={setCourseFilter}>
                                <SelectTrigger className="transition-all duration-200
                                                  border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                                                  hover:border-gray-400 bg-white/80">
                                    <SelectValue placeholder="جميع المواد" />
                                </SelectTrigger>
                                <SelectContent searchable className="bg-white border border-gray-200 shadow-lg">
                                    <SelectItem value="all" className="flex items-center gap-2">
                                        جميع المواد
                                    </SelectItem>
                                    {filterCourses.map((course) => (
                                        <SelectItem key={course.id} value={course.id.toString()} className="flex items-center gap-2">
                                            {/* <Book className="h-4 w-4 text-gray-500" /> */}
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Level Filter */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                                <Layers className="h-4 w-4 text-primary" />
                                فلترة بالمستوى
                            </Label>
                            <Select
                                value={levelFilter}
                                onValueChange={setLevelFilter}
                                disabled={courseFilter === "all"}
                            >
                                <SelectTrigger className={`transition-all duration-200
                                                   border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                                                   hover:border-gray-400 bg-white/80 ${courseFilter === "all" ? "opacity-50 cursor-not-allowed" : ""
                                    }`}>
                                    <SelectValue placeholder={
                                        courseFilter === "all" ? "اختر المادة أولاً" : "جميع المستويات"
                                    } />
                                </SelectTrigger>
                                <SelectContent searchable className="bg-white border border-gray-200 shadow-lg">
                                    <SelectItem value="all" className="flex items-center gap-2">
                                        جميع المستويات
                                    </SelectItem>
                                    {filterLevels
                                        .filter(level =>
                                            courseFilter === "all" ||
                                            level.courseId?.toString() === courseFilter
                                        )
                                        .map((level) => (
                                            <SelectItem key={level.id} value={level.id.toString()} className="flex items-center gap-2">
                                                {/* <Layer className="h-4 w-4 text-gray-500" /> */}
                                                {level.name}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        {/* زر الإجراءات */}
                        {/* <div className="flex items-end">
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                                    onClick={resetFilters}
                                >
                                    <RefreshCw className="h-4 w-4 ml-2" />
                                    إعادة تعيين الفلترة
                                </Button>
                            )}
                        </div> */}
                    </div>
                </div>

                {/* شريط النتائج والإحصائيات */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* عرض النتائج - مع تصميم جذاب */}
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-2 shadow-sm border">
                                <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-700">
                                    عرض <span className="font-bold text-primary">{startItem}-{endItem}</span> من أصل
                                    <span className="font-bold text-gray-900"> {allCodes.length} </span>
                                    كود
                                </p>
                                {hasActiveFilters && (
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-xs text-green-600 font-medium">نتائج مفلترة</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* أزرار الإجراءات */}
                        <div className="flex items-center gap-3">
                            {hasActiveFilters && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                                        <Filter className="w-3 h-3" />
                                        فلاتر مفعلة
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={resetFilters}
                                        className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                                    >
                                        <X className="h-4 w-4" />
                                        مسح الكل
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* شريط التقدم للإظهار المرئي */}
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-purple-900 rounded-full transition-all duration-500"
                                style={{
                                    width: `${(filteredAndSortedCodes.length / Math.max(allCodes.length, 1)) * 100}%`
                                }}
                            ></div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            {Math.round((filteredAndSortedCodes.length / Math.max(allCodes.length, 1)) * 100)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // 🔄 useEffect للبيانات الأساسية
    useEffect(() => {
        fetchAccessCodes();
        fetchUsers();
        fetchSpecializations();
        fetchCodeLevels(); // جلب الترميزات
    }, []);

    useEffect(() => {
        if (selectedSpecialization) {
            fetchCourses(selectedSpecialization);
            setSelectedCourse("");
            setSelectedInstructor("");
            setSelectedLevel("");
        } else {
            setCourses([]);
            setSelectedCourse("");
            setSelectedInstructor("");
            setSelectedLevel("");
        }
    }, [selectedSpecialization]);

    useEffect(() => {
        if (selectedCourse) {
            fetchInstructorsByCourse(selectedCourse);
            setSelectedInstructor("");
            setSelectedLevel("");
        } else {
            setInstructors([]);
            setSelectedInstructor("");
            setSelectedLevel("");
        }
    }, [selectedCourse]);

    useEffect(() => {
        if (selectedInstructor) {
            fetchLevelsByInstructor(selectedInstructor);
            setSelectedLevel("");
        } else {
            setLevels([]);
            setSelectedLevel("");
        }
    }, [selectedInstructor, selectedCourse]);

    useEffect(() => {
        if (selectedLevel) {
            handleFormChange("courseLevelId", selectedLevel);
            fetchActiveCoupons(selectedLevel);

            const selectedLevelData = levels.find(level => level.id === parseInt(selectedLevel));
            if (selectedLevelData) {
                // الحصول على بيانات المستخدم المحدد
                const selectedUser = users.find(user => user.id.toString() === form.userId);
                const userPhone = selectedUser?.phone;

                // تحديد السعر بناءً على العملة
                const price = getPriceByCurrency(selectedLevelData, userPhone);
                const currencyType = getCurrencyType(userPhone);

                console.log("💰 تحديث السعر عند اختيار المستوى:", {
                    price,
                    currencyType,
                    userPhone,
                    user: selectedUser?.name
                });

                setForm(prev => ({
                    ...prev,
                    originalPrice: price,
                    finalPrice: price,
                    amountPaid: price
                }));
            }
        } else {
            setCoupons([]);
            setAvailableCoupons([]);
            setForm(prev => ({
                ...prev,
                courseLevelId: "",
                originalPrice: "",
                discountAmount: "0",
                finalPrice: "",
                amountPaid: "",
                couponId: "",
                useCoupon: false
            }));
        }
    }, [selectedLevel, levels]);

    useEffect(() => {
        if (form.couponId && form.courseLevelId) {
            // الحصول على بيانات المستخدم والمستوى
            const selectedUser = users.find(user => user.id.toString() === form.userId);
            const selectedLevelData = levels.find(level => level.id === parseInt(form.courseLevelId));

            if (selectedUser && selectedLevelData) {
                const currencyType = getCurrencyType(selectedUser.phone);
                console.log("🎯 تطبيق الكوبون بالعملة:", currencyType, "للمستخدم:", selectedUser.name);

                calculatePriceWithCoupon(form.couponId, form.courseLevelId);
            }
        } else if (!form.couponId && form.courseLevelId) {
            // إعادة تعيين السعر عند إلغاء الكوبون
            const selectedLevelData = levels.find(level => level.id === parseInt(form.courseLevelId));
            const selectedUser = users.find(user => user.id.toString() === form.userId);

            if (selectedLevelData && selectedUser) {
                const price = getPriceByCurrency(selectedLevelData, selectedUser.phone);
                console.log("🔄 إعادة تعيين السعر بدون كوبون:", {
                    price,
                    currency: getCurrencyType(selectedUser.phone),
                    user: selectedUser.name
                });

                setForm(prev => ({
                    ...prev,
                    originalPrice: price,
                    discountAmount: "0",
                    finalPrice: price,
                    amountPaid: price
                }));
            }
        }
    }, [form.couponId, form.courseLevelId, levels, users]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, userFilter, courseFilter, levelFilter, itemsPerPage]);

    // 🔄 حساب السعر تلقائياً عند تغيير الكوبون في التعديل
    useEffect(() => {
        if (editDialog.isOpen && form.couponId && form.courseLevelId) {
            const selectedUser = users.find(user => user.id.toString() === form.userId);
            const selectedLevelData = levels.find(level => level.id === parseInt(form.courseLevelId));

            if (selectedUser && selectedLevelData) {
                const currencyType = getCurrencyType(selectedUser.phone);
                console.log("🎯 حساب السعر تلقائياً في التعديل بالعملة:", currencyType);
                calculatePriceWithCouponEdit(form.couponId, form.courseLevelId);
            }
        } else if (editDialog.isOpen && !form.couponId && form.courseLevelId) {
            // إعادة تعيين السعر عند إلغاء الكوبون في التعديل
            const selectedLevelData = levels.find(level => level.id === parseInt(form.courseLevelId));
            const selectedUser = users.find(user => user.id.toString() === form.userId);

            if (selectedLevelData && selectedUser) {
                const price = getPriceByCurrency(selectedLevelData, selectedUser.phone);
                console.log("🔄 إعادة تعيين السعر بدون كوبون في التعديل:", {
                    price,
                    currency: getCurrencyType(selectedUser.phone)
                });
                setForm(prev => ({
                    ...prev,
                    originalPrice: price,
                    discountAmount: "0",
                    finalPrice: price,
                    amountPaid: price
                }));
            }
        }
    }, [form.couponId, form.courseLevelId, editDialog.isOpen]);

    // 🔄 التحقق التلقائي من الكوبونات في التعديل
    useEffect(() => {
        if (editDialog.isOpen && form.userId && selectedLevel) {
            console.log("🔄 تحقق تلقائي من الكوبونات في التعديل");
            checkAvailableCouponsEdit();
        }
    }, [form.userId, selectedLevel, editDialog.isOpen]);

    // 🔄 حساب السعر تلقائياً عند تغيير الكوبون في التعديل
    useEffect(() => {
        if (editDialog.isOpen && form.couponId && form.courseLevelId) {
            console.log("🎯 حساب السعر تلقائياً في التعديل للكوبون:", form.couponId);
            calculatePriceWithCouponEdit(form.couponId, form.courseLevelId);
        } else if (editDialog.isOpen && !form.couponId && form.courseLevelId) {
            // إعادة تعيين السعر عند إلغاء الكوبون في التعديل
            const selectedLevelData = levels.find(level => level.id === parseInt(form.courseLevelId));
            if (selectedLevelData) {
                const price = selectedLevelData.priceSAR || selectedLevelData.priceUSD || "0";
                console.log("🔄 إعادة تعيين السعر بدون كوبون:", price);
                setForm(prev => ({
                    ...prev,
                    originalPrice: price.toString(),
                    discountAmount: "0",
                    finalPrice: price.toString(),
                    amountPaid: price.toString()
                }));
            }
        }
    }, [form.couponId, form.courseLevelId, editDialog.isOpen]);

    // 🔄 التحقق التلقائي من الكوبونات عند اختيار المستوى والمستخدم (للنموذج الرئيسي)
    useEffect(() => {
        if (selectedLevel && form.userId && isDialogOpen) {
            console.log("🔄 تحقق تلقائي من الكوبونات في النموذج الرئيسي:", form.userId, selectedLevel);
            const timer = setTimeout(() => {
                checkAvailableCoupons();
            }, 800); // زيادة الوقت قليلاً لضمان اكتمال التحديثات

            return () => clearTimeout(timer);
        }
    }, [selectedLevel, form.userId, isDialogOpen]);

    // 🔄 التحقق التلقائي من الكوبونات في نموذج التعديل
    useEffect(() => {
        if (editDialog.isOpen && selectedLevel && form.userId) {
            console.log("🔄 تحقق تلقائي من الكوبونات في التعديل:", form.userId, selectedLevel);
            const timer = setTimeout(() => {
                checkAvailableCouponsEdit();
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [selectedLevel, form.userId, editDialog.isOpen]);

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <CardTitle>إدارة أكواد الوصول</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setForm({
                                        courseId: "",
                                        courseLevelId: "",
                                        userId: "",
                                        validityInMonths: "1.5",
                                        amountPaid: "",
                                        originalPrice: "",
                                        discountAmount: "0",
                                        finalPrice: "",
                                        couponId: "",
                                        notes: "",
                                        useCoupon: false
                                    });
                                    setReceiptFile(null);
                                    setReceiptPreview(null);
                                    setAvailableCoupons([]);
                                    resetAllSelections();
                                }}
                            >
                                توليد كود <Plus className="w-4 h-4 cursor-pointer" />
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-right">توليد كود وصول جديد</DialogTitle>
                                <DialogDescription className="text-right">
                                    أدخل المعلومات المطلوبة لتوليد كود وصول جديد
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                {/* 🔄 قسم الترميز الجديد */}
                                <div className="space-y-3 p-4 bg-gradient-to-l from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Scan className="w-5 h-5 text-purple-600" />
                                        <Label className="font-bold text-base text-purple-800">الاختيار السريع بالترميز</Label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>اختر الترميز</Label>
                                        <Select
                                            value={selectedEncode}
                                            onValueChange={(value) => {
                                                setSelectedEncode(value);
                                                if (value) {
                                                    fetchLevelByEncode(value);
                                                }
                                            }}
                                            disabled={encodeLoading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={
                                                    encodeLoading ? "جاري التحميل..." : "اختر الترميز للتحميل التلقائي"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent searchable>
                                                {/* <div className="p-2">
                                                    <Input
                                                        placeholder="ابحث عن ترميز..."
                                                        value={encodeSearch}
                                                        onChange={(e) => setEncodeSearch(e.target.value)}
                                                        className="mb-2"
                                                    />
                                                </div> */}
                                                {filteredCodeLevels.map((level) => (
                                                    <SelectItem key={level.id} value={level.encode} disabled={!level.encode}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{level.encode}</span>
                                                            <span className="text-xs text-muted-foreground">{level.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                                {filteredCodeLevels.length === 0 && (
                                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                                        لا توجد ترميزات متاحة
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {encodeLoading && (
                                        <div className="flex items-center gap-2 text-purple-600">
                                            <div className="animate-spin h-4 w-4 border-b-2 rounded-full border-purple-600"></div>
                                            جاري تحميل بيانات الترميز...
                                        </div>
                                    )}

                                    <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
                                        💡 اختر الترميز لتحميل بيانات المستوى تلقائياً (اختصاص - مدرس - مادة - مستوى)
                                    </div>
                                </div>

                                {/* مسار الاختيار */}
                                {(selectedSpecialization || selectedCourse || selectedInstructor || selectedLevel) && (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-medium">
                                            <span className="text-blue-700">المسار المختار:</span>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline" className="bg-white">
                                                    {selectedSpecialization ? getSpecializationName(selectedSpecialization) : "---"}
                                                </Badge>
                                                <ChevronRight className="h-4 w-4 text-blue-500" />
                                                <Badge variant="outline" className="bg-white">
                                                    {selectedCourse ? getCourseName(selectedCourse) : "---"}
                                                </Badge>
                                                <ChevronRight className="h-4 w-4 text-blue-500" />
                                                <Badge variant="outline" className="bg-white">
                                                    {selectedInstructor ? getInstructorName(selectedInstructor) : "---"}
                                                </Badge>
                                                <ChevronRight className="h-4 w-4 text-blue-500" />
                                                <Badge variant="outline" className="bg-white">
                                                    {selectedLevel ? getLevelName(selectedLevel) : "---"}
                                                </Badge>
                                                {/* <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={resetAllSelections}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    إعادة تعيين الكل
                                                </Button> */}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>المستخدم *</Label>
                                    <Select
                                        value={form.userId}
                                        onValueChange={(value) => handleFormChange("userId", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر المستخدم" />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name} - {user.phone}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* الهيكلية الجديدة */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>الاختصاص</Label>
                                        <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الاختصاص" />
                                            </SelectTrigger>
                                            <SelectContent searchable>
                                                {/* <div className="p-2">
                                                    <Input
                                                        placeholder="ابحث عن اختصاص..."
                                                        value={specializationSearch}
                                                        onChange={(e) => setSpecializationSearch(e.target.value)}
                                                        className="mb-2"
                                                    />
                                                </div> */}
                                                {specializations.map((spec) => (
                                                    <SelectItem key={spec.id} value={spec.id.toString()}>
                                                        {spec.name || spec.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>المادة</Label>
                                        <Select
                                            value={selectedCourse}
                                            onValueChange={setSelectedCourse}
                                            disabled={!selectedSpecialization}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={selectedSpecialization ? "اختر المادة" : "اختر الاختصاص أولاً"} />
                                            </SelectTrigger >
                                            <SelectContent searchable>
                                                {/* <div className="p-2">
                                                    <Input
                                                        placeholder="ابحث عن المادة..."
                                                        value={courseSearch}
                                                        onChange={(e) => setCourseSearch(e.target.value)}
                                                        className="mb-2"
                                                    />
                                                </div> */}
                                                {courses.map((course) => (
                                                    <SelectItem key={course.id} value={course.id.toString()}>
                                                        {course.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>المدرس</Label>
                                        <Select
                                            value={selectedInstructor}
                                            onValueChange={setSelectedInstructor}
                                            disabled={!selectedCourse}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={selectedCourse ? "اختر المدرس" : "اختر المادة أولاً"} />
                                            </SelectTrigger>
                                            <SelectContent searchable>
                                                {/* <div className="p-2">
                                                    <Input
                                                        placeholder="ابحث عن مدرس..."
                                                        value={instructorSearch}
                                                        onChange={(e) => setInstructorSearch(e.target.value)}
                                                        className="mb-2"
                                                    />
                                                </div> */}
                                                {instructors.map((instructor) => (
                                                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                                        {instructor.name}
                                                    </SelectItem>
                                                ))}
                                                {instructors.length === 0 && selectedCourse && (
                                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                                        لا توجد مدرسين لهذه المادة
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>المستوى *</Label>
                                        <Select
                                            value={selectedLevel}
                                            onValueChange={setSelectedLevel}
                                            disabled={!selectedInstructor}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={selectedInstructor ? "اختر المستوى" : "اختر المدرس أولاً"} />
                                            </SelectTrigger>
                                            <SelectContent searchable>
                                                {/* <div className="p-2">
                                                    <Input
                                                        placeholder="ابحث عن مستوى..."
                                                        value={levelSearch}
                                                        onChange={(e) => setLevelSearch(e.target.value)}
                                                        className="mb-2"
                                                    />
                                                </div> */}
                                                {levels.map((level) => (
                                                    <SelectItem key={level.id} value={level.id.toString()}>
                                                        {level.name}
                                                        {/* {level.priceSAR > 0 && ` - ${level.priceSAR} ل.س`} */}
                                                        {/* {level.priceUSD > 0 && level.priceSAR === 0 && ` - ${level.priceUSD} $`} */}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* قسم التحقق من الكوبونات */}
                                {form.userId && selectedLevel && (
                                    <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        {/* <div className="flex items-center justify-between">
                                            <Label className="font-medium text-purple-800">التحقق من الكوبونات المتاحة</Label>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={form.useCoupon}
                                                    onCheckedChange={handleUseCouponChange}
                                                    disabled={availableCoupons.length === 0 && !couponCheckLoading}
                                                />
                                                <span className="text-sm text-purple-700">استخدام كوبون</span>
                                            </div>
                                        </div> */}

                                        {/* <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={checkAvailableCoupons}
                                                disabled={couponCheckLoading || !form.userId || !selectedLevel}
                                                className="flex-1"
                                            >
                                                {couponCheckLoading ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-b-2 rounded-full border-purple-600 mr-2"></div>
                                                        جاري التحقق...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 ml-1" />
                                                        تحقق من الكوبونات
                                                    </>
                                                )}
                                            </Button>
                                        </div> */}

                                        {availableCoupons.length > 0 && (
                                            <div className="mt-2">
                                                <Label className="text-sm font-medium text-green-700">
                                                    ✅ تم العثور على {availableCoupons.length} كوبون متاح
                                                </Label>
                                            </div>
                                        )}

                                        {form.useCoupon && availableCoupons.length > 0 && (
                                            <div className="space-y-2 mt-3">
                                                <Label>اختر الكوبون</Label>
                                                <Select
                                                    value={form.couponId}
                                                    onValueChange={(value) => handleFormChange("couponId", value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="اختر كوبون الخصم" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableCoupons.map((coupon) => (
                                                            <SelectItem key={coupon.id} value={coupon.id.toString()}>
                                                                <div className="flex items-center justify-between w-full">
                                                                    <div className="flex flex-col items-start">
                                                                        <span className="font-medium">{coupon.code}</span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {coupon.isPercent ? `${coupon.discount}% خصم` : `${coupon.discount} ل.س خصم`}
                                                                        </span>
                                                                    </div>
                                                                    <Badge variant={coupon.isPercent ? "default" : "secondary"}>
                                                                        {coupon.isPercent ? `${coupon.discount}%` : `${coupon.discount} ل.س`}
                                                                    </Badge>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {form.useCoupon && availableCoupons.length === 0 && !couponCheckLoading && (
                                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                                لا توجد كوبونات متاحة للمستخدم والمستوى المحددين
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* معلومات السعر */}
                               // في قسم عرض معلومات السعر، أضف عرض نوع العملة:
                                {(form.originalPrice || form.couponId) && (
                                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-bold text-base text-blue-800">معلومات السعر</Label>
                                            {form.userId && (
                                                <Badge variant="outline" className="bg-white">
                                                    {getCurrencyType(users.find(u => u.id.toString() === form.userId)?.phone) === 'SAR'
                                                        ? 'العملة: السورية (ل.س)'
                                                        : 'العملة: الدولار ($)'
                                                    }
                                                </Badge>
                                            )}
                                        </div>

                                        {priceLoading ? (
                                            <div className="flex justify-center items-center py-4">
                                                <div className="animate-spin h-6 w-6 border-b-2 rounded-full border-blue-600"></div>
                                                <span className="mr-2 text-blue-700">جاري حساب السعر...</span>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="space-y-2">
                                                    <Label>السعر الأصلي</Label>
                                                    <Input
                                                        type="number"
                                                        value={form.originalPrice}
                                                        onChange={(e) => handleFormChange("originalPrice", e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        className="bg-white"
                                                        readOnly
                                                    />
                                                </div>

                                                {parseFloat(form.discountAmount) > 0 && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label>مبلغ الخصم</Label>
                                                            <Input
                                                                type="number"
                                                                value={form.discountAmount}
                                                                readOnly
                                                                className="bg-green-50 border-green-200 text-green-700 font-bold"
                                                            />
                                                        </div>

                                                        <div className="p-3 bg-white rounded border">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm text-gray-600">السعر الأصلي:</span>
                                                                    <span className="font-medium">
                                                                        {form.originalPrice} {
                                                                            form.userId ?
                                                                                (getCurrencyType(users.find(u => u.id.toString() === form.userId)?.phone) === 'SAR' ? 'ل.س' : '$')
                                                                                : ''
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm text-gray-600">نوع الخصم:</span>
                                                                    <span className="font-medium">
                                                                        {availableCoupons.find(c => c.id === parseInt(form.couponId))?.isPercent ?
                                                                            `نسبة (${availableCoupons.find(c => c.id === parseInt(form.couponId))?.discount}%)` :
                                                                            `قيمة ثابتة (${availableCoupons.find(c => c.id === parseInt(form.couponId))?.discount} ${form.userId ?
                                                                                (getCurrencyType(users.find(u => u.id.toString() === form.userId)?.phone) === 'SAR' ? 'ل.س' : '$')
                                                                                : ''
                                                                            })`}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm text-gray-600">الخصم:</span>
                                                                    <span className="font-medium text-red-600">
                                                                        -{form.discountAmount} {
                                                                            form.userId ?
                                                                                (getCurrencyType(users.find(u => u.id.toString() === form.userId)?.phone) === 'SAR' ? 'ل.س' : '$')
                                                                                : ''
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="border-t pt-2 flex justify-between items-center">
                                                                    <span className="font-bold text-gray-800">السعر النهائي:</span>
                                                                    <span className="font-bold text-green-600 text-lg">
                                                                        {form.finalPrice} {
                                                                            form.userId ?
                                                                                (getCurrencyType(users.find(u => u.id.toString() === form.userId)?.phone) === 'SAR' ? 'ل.س' : '$')
                                                                                : ''
                                                                        }
                                                                    </span>
                                                                </div>
                                                                {form.couponId && (
                                                                    <div className="flex justify-between items-center text-xs text-blue-600">
                                                                        <span>الكوبون المطبق:</span>
                                                                        <span>{availableCoupons.find(c => c.id === parseInt(form.couponId))?.code}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                <div className="space-y-2">
                                                    <Label>السعر النهائي *</Label>
                                                    <Input
                                                        type="number"
                                                        value={form.finalPrice}
                                                        onChange={(e) => handleFormChange("finalPrice", e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        className="font-bold text-lg border-2 border-green-200 bg-green-50"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>مدة الصلاحية (أشهر)</Label>
                                        <Select
                                            value={form.validityInMonths}
                                            onValueChange={(value) => handleFormChange("validityInMonths", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر المدة" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">شهر</SelectItem>
                                                <SelectItem value="1.5">شهر ونصف</SelectItem>
                                                <SelectItem value="2">شهرين</SelectItem>
                                                <SelectItem value="3">ثلاثة أشهر</SelectItem>
                                                <SelectItem value="6">ستة أشهر</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>المبلغ المدفوع *</Label>
                                        <Input
                                            type="number"
                                            value={form.amountPaid}
                                            onChange={(e) => handleFormChange("amountPaid", e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="receipt-image">صورة الإيصال *</Label>
                                    <Input
                                        id="receipt-image"
                                        type="file"
                                        accept="image/*"
                                        onChange={onReceiptChange}
                                    />
                                    {receiptPreview && (
                                        <div className="mt-2">
                                            <img
                                                src={receiptPreview}
                                                alt="معاينة الإيصال"
                                                className="max-h-40 rounded-md border"
                                                {...imageConfig}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "/tallaam_logo2.png";
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>ملاحظات</Label>
                                    <Textarea
                                        value={form.notes}
                                        onChange={(e) => handleFormChange("notes", e.target.value)}
                                        rows={2}
                                        placeholder="أدخل أي ملاحظات إضافية..."
                                    />
                                </div>

                                <Button
                                    onClick={handleGenerateCode}
                                    disabled={priceLoading || !selectedLevel || !form.userId || !receiptFile || !form.amountPaid || (form.useCoupon && !form.couponId)}
                                >
                                    {priceLoading ? "جاري حساب السعر..." : "توليد الكود"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* قسم الفلترة */}
                <FilterSection />
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
                    </div>
                ) : (
                    <>
                        {/* عرض الجدول للشاشات المتوسطة والكبيرة */}
                        <div className="hidden md:block">
                            <Table className="direction-rtl">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("code")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الكود
                                                {sortBy === "code" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("user")}
                                        >
                                            <div className="flex items-center gap-1">
                                                المستخدم
                                                {sortBy === "user" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header">
                                            <div className="space-y-1">
                                                <div>معلومات الدورة</div>
                                                <div className="text-xs text-muted-foreground font-normal">(اختصاص - مادة - مدرس - مستوى)</div>
                                            </div>
                                        </TableHead>
                                        {/* <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("course")}
                                        >
                                            <div className="flex items-center gap-1">
                                                المادة
                                                {sortBy === "course" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("level")}
                                        >
                                            <div className="flex items-center gap-1">
                                                المستوى
                                                {sortBy === "level" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead> */}
                                        <TableHead className="table-header">المدة</TableHead>
                                        <TableHead className="table-header">
                                            <div className="space-y-1">
                                                <div>المعلومات المالية</div>
                                                <div className="text-xs text-muted-foreground font-normal">(المدفوع + سعر المادة)</div>
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("issuedAt")}
                                        >
                                            <div className="flex items-center gap-1">
                                                تاريخ الإصدار
                                                {sortBy === "issuedAt" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("status")}
                                        >
                                            <div className="flex items-center gap-1">
                                                حالة الاستخدام
                                                {sortBy === "status" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("isActive")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الحالة
                                                {sortBy === "isActive" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header text-right">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedCodes.length > 0 ? paginatedCodes.map(item => {
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="table-cell font-mono font-medium">
                                                    {item.code}
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <div className="flex items-center gap-2" dir="ltr">
                                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                                        {item.user?.phone || "غير محدد"}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        {item.user?.name || "غير محدد"}
                                                    </div>
                                                </TableCell>
                                                {/* <TableCell className="table-cell">
                                                    {item.courseLevel?.course?.title || "غير محدد"}
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    {item.courseLevel?.name || "غير محدد"}
                                                </TableCell> */}
                                                <TableCell className="table-cell">
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            {item.courseLevel?.course?.specialization?.name ||
                                                                item.courseLevel?.course?.specialization?.title ||
                                                                "غير محدد"}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            <div> {item.courseLevel?.course?.title || "غير محدد"}</div>
                                                            <div>{item.courseLevel?.instructor?.name || "غير محدد"}</div>
                                                            <div>{item.courseLevel?.name || "غير محدد"}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    {item.validityInMonths ? `${item.validityInMonths} شهر` : "غير محدد"}
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <PriceDisplay item={item} />
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    {formatDate(item.issuedAt)}
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <Badge className={getStatusColor(item.status)}>
                                                        {getStatusText(item.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <Badge className={getActiveStatusColor(item.isActive)}>
                                                        {getActiveStatusText(item.isActive)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="table-cell text-right space-x-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => copyToClipboard(item.code)}
                                                        title="نسخ الكود"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setDetailDialog({ isOpen: true, item })}
                                                        title="عرض التفاصيل"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => openEditDialog(item)}
                                                        title="تعديل الكود"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setStatusDialog({
                                                            isOpen: true,
                                                            itemId: item.id,
                                                            itemName: item.code,
                                                            isActive: !item.isActive
                                                        })}
                                                        title={item.isActive ? "تعطيل" : "تفعيل"}
                                                    >
                                                        {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        onClick={() => setDeleteDialog({
                                                            isOpen: true,
                                                            itemId: item.id,
                                                            itemName: item.code
                                                        })}
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                                                {allCodes.length === 0 ? "لا توجد أكواد متاحة" : "لم يتم العثور على نتائج"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* عرض البطاقات للشاشات الصغيرة */}
                        <div className="md:hidden space-y-4">
                            {paginatedCodes.length > 0 ? paginatedCodes.map(item => (
                                <CodeCard key={item.id} item={item} />
                            )) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allCodes.length === 0 ? "لا توجد أكواد متاحة" : "لم يتم العثور على نتائج"}
                                </div>
                            )}
                        </div>

                        {/* الترقيم */}
                        {paginatedCodes.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من أصل {totalItems} كود
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* ديالوج تأكيد الحذف */}
            <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, isOpen: open })}>
                <AlertDialogContent className="text-right" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف الفاتورة الخاصة به أيضا
                            هل أنت متأكد من أنك تريد حذف الكود "{deleteDialog.itemName}"؟ هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row-reverse gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => {
                                handleDeleteCode(deleteDialog.itemId);
                                setDeleteDialog({ isOpen: false, itemId: null, itemName: "" });
                            }}
                        >
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ديالوج تحديث الحالة */}
            <AlertDialog open={statusDialog.isOpen} onOpenChange={(open) => setStatusDialog({ ...statusDialog, isOpen: open })}>
                <AlertDialogContent className="text-right" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">
                            {statusDialog.isActive ? "تفعيل الكود" : "تعطيل الكود"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            هل أنت متأكد من أنك تريد {statusDialog.isActive ? "تفعيل" : "تعطيل"} الكود "{statusDialog.itemName}"؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row-reverse gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className={statusDialog.isActive ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}
                            onClick={() => {
                                handleUpdateCodeStatus(statusDialog.itemId, statusDialog.isActive);
                                setStatusDialog({ isOpen: false, itemId: null, itemName: "", isActive: false });
                            }}
                        >
                            {statusDialog.isActive ? "تفعيل" : "تعطيل"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 🛠️ ديالوج التعديل الكامل */}
            <Dialog open={editDialog.isOpen} onOpenChange={(open) => {
                setEditDialog({ ...editDialog, isOpen: open });
                if (!open) {
                    resetAllSelectionsEdit(); // استخدام الدالة الجديدة للتعديل
                }
            }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-right">تعديل كود الوصول - {editDialog.item?.code}</DialogTitle>
                        <DialogDescription className="text-right">
                            تعديل جميع معلومات كود الوصول
                        </DialogDescription>
                    </DialogHeader>

                    {/* عرض معلومات الكود الحالي */}
                    {editDialog.item && (
                        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                                <Info className="w-4 h-4" />
                                الكود: <span className="font-mono">{editDialog.item.code || "غير محدد"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
                                <div>المستخدم الحالي: {editDialog.item.user?.name || "غير محدد"}</div>
                                <div >الهاتف: <span dir="ltr">{editDialog.item.user?.phone || "غير محدد"}</span></div>
                                <div>المبلغ الحالي: {getAmountPaid(editDialog.item)} ل.س</div>
                                <div>الكوبون الحالي: {getCouponInfo(editDialog.item)?.code || "لا يوجد"}</div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 mt-2">
                        {/* 🔄 قسم الترميز للتعديل */}
                        <div className="space-y-3 p-4 bg-gradient-to-l from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Scan className="w-5 h-5 text-purple-600" />
                                    <Label className="font-bold text-base text-purple-800">الاختيار السريع بالترميز</Label>
                                </div>
                                {selectedEncodeEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedEncodeEdit("");
                                            setEncodeSearchEdit("");
                                        }}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        إعادة تعيين الترميز
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>اختر الترميز</Label>
                                <Select
                                    value={selectedEncodeEdit}
                                    onValueChange={(value) => {
                                        setSelectedEncodeEdit(value);
                                        if (value) {
                                            fetchLevelByEncodeEdit(value);
                                        }
                                    }}
                                    disabled={encodeLoadingEdit}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            encodeLoadingEdit ? "جاري التحميل..." : "اختر الترميز للتحميل التلقائي"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2">
                                            <Input
                                                placeholder="ابحث عن ترميز..."
                                                value={encodeSearchEdit}
                                                onChange={(e) => setEncodeSearchEdit(e.target.value)}
                                                className="mb-2"
                                            />
                                        </div>
                                        {filteredCodeLevels.map((level) => (
                                            <SelectItem key={level.id} value={level.encode} disabled={!level.encode}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{level.encode}</span>
                                                    <span className="text-xs text-muted-foreground">{level.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                        {filteredCodeLevels.length === 0 && (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                لا توجد ترميزات متاحة
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {encodeLoadingEdit && (
                                <div className="flex items-center gap-2 text-purple-600">
                                    <div className="animate-spin h-4 w-4 border-b-2 rounded-full border-purple-600"></div>
                                    جاري تحميل بيانات الترميز...
                                </div>
                            )}

                            <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
                                💡 اختر الترميز لتحميل بيانات المستوى تلقائياً (اختصاص - مدرس - مادة - مستوى)
                            </div>
                        </div>

                        {/* ✅ مسار الاختيار */}
                        {(selectedSpecialization || selectedCourse || selectedInstructor || selectedLevel) && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-medium">
                                    <span className="text-blue-700">المسار المختار:</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className="bg-white">
                                            {selectedSpecialization ? getSpecializationName(selectedSpecialization) : "---"}
                                        </Badge>
                                        <ChevronRight className="h-4 w-4 text-blue-500" />
                                        <Badge variant="outline" className="bg-white">
                                            {selectedCourse ? getCourseName(selectedCourse) : "---"}
                                        </Badge>
                                        <ChevronRight className="h-4 w-4 text-blue-500" />
                                        <Badge variant="outline" className="bg-white">
                                            {selectedInstructor ? getInstructorName(selectedInstructor) : "---"}
                                        </Badge>
                                        <ChevronRight className="h-4 w-4 text-blue-500" />
                                        <Badge variant="outline" className="bg-white">
                                            {selectedLevel ? getLevelName(selectedLevel) : "---"}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={resetAllSelectionsEdit}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            إعادة تعيين الكل
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ✅ الهيكلية الجديدة: اختصاص ← كورس ← مدرس ← مستوى */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* اختيار الاختصاص */}
                            <div className="space-y-2">
                                <Label>الاختصاص</Label>
                                <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الاختصاص" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2">
                                            <Input
                                                placeholder="ابحث عن اختصاص..."
                                                value={specializationSearch}
                                                onChange={(e) => setSpecializationSearch(e.target.value)}
                                                className="mb-2"
                                            />
                                        </div>
                                        {specializations.map((spec) => (
                                            <SelectItem key={spec.id} value={spec.id.toString()}>
                                                {spec.name || spec.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* اختيار الكورس */}
                            <div className="space-y-2">
                                <Label>المادة</Label>
                                <Select
                                    value={selectedCourse}
                                    onValueChange={setSelectedCourse}
                                    disabled={!selectedSpecialization}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedSpecialization ? "اختر المادة" : "اختر الاختصاص أولاً"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2">
                                            <Input
                                                placeholder="ابحث عن مادة..."
                                                value={courseSearch}
                                                onChange={(e) => setCourseSearch(e.target.value)}
                                                className="mb-2"
                                            />
                                        </div>
                                        {filteredCoursesForSelect.map((course) => (
                                            <SelectItem key={course.id} value={course.id.toString()}>
                                                {course.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* اختيار المدرس */}
                            <div className="space-y-2">
                                <Label>المدرس</Label>
                                <Select
                                    value={selectedInstructor}
                                    onValueChange={setSelectedInstructor}
                                    disabled={!selectedCourse}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedCourse ? "اختر المدرس" : "اختر المادة أولاً"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2">
                                            <Input
                                                placeholder="ابحث عن مدرس..."
                                                value={instructorSearch}
                                                onChange={(e) => setInstructorSearch(e.target.value)}
                                                className="mb-2"
                                            />
                                        </div>
                                        {filteredInstructorsForSelect.map((instructor) => (
                                            <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                                {instructor.name}
                                            </SelectItem>
                                        ))}
                                        {filteredInstructorsForSelect.length === 0 && selectedCourse && (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                لا توجد مدرسين لهذه المادة
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* اختيار المستوى */}
                            <div className="space-y-2">
                                <Label>المستوى *</Label>
                                <Select
                                    value={selectedLevel}
                                    onValueChange={setSelectedLevel}
                                    disabled={!selectedInstructor}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedInstructor ? "اختر المستوى" : "اختر المدرس أولاً"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2">
                                            <Input
                                                placeholder="ابحث عن مستوى..."
                                                value={levelSearch}
                                                onChange={(e) => setLevelSearch(e.target.value)}
                                                className="mb-2"
                                            />
                                        </div>
                                        {filteredLevelsForSelect.map((level) => (
                                            <SelectItem key={level.id} value={level.id.toString()}>
                                                {level.name}
                                                {/* {level.priceSAR > 0 && ` - ${level.priceSAR} ل.س`} */}
                                                {/* {level.priceUSD > 0 && level.priceSAR === 0 && ` - ${level.priceUSD} $`} */}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 🔍 قسم التحقق من الكوبونات في التعديل */}
                        {form.userId && selectedLevel && (
                            <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <Label className="font-medium text-purple-800">التحقق من الكوبونات المتاحة</Label>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={!!form.couponId}
                                            onCheckedChange={(checked) => {
                                                if (!checked) {
                                                    setForm(prev => ({ ...prev, couponId: "" }));
                                                }
                                            }}
                                            disabled={availableCouponsEdit.length === 0 && !couponCheckLoadingEdit}
                                        />
                                        <span className="text-sm text-purple-700">استخدام كوبون</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={checkAvailableCouponsEdit}
                                        disabled={couponCheckLoadingEdit || !form.userId || !selectedLevel}
                                        className="flex-1"
                                    >
                                        {couponCheckLoadingEdit ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 border-b-2 rounded-full border-purple-600 mr-2"></div>
                                                جاري التحقق...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 ml-1" />
                                                تحقق من الكوبونات
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {availableCouponsEdit.length > 0 && (
                                    <div className="mt-2">
                                        <Label className="text-sm font-medium text-green-700">
                                            ✅ تم العثور على {availableCouponsEdit.length} كوبون متاح
                                        </Label>
                                    </div>
                                )}

                                {availableCouponsEdit.length > 0 && (
                                    <div className="space-y-2 mt-3">
                                        <Label>اختر الكوبون</Label>
                                        <Select
                                            value={form.couponId || "no-coupon"}
                                            onValueChange={(value) => handleFormChange("couponId", value === "no-coupon" ? "" : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر كوبون الخصم" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no-coupon">بدون كوبون</SelectItem>
                                                {availableCouponsEdit.map((coupon) => (
                                                    <SelectItem key={coupon.id} value={coupon.id.toString()}>
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex flex-col items-start">
                                                                <span className="font-medium">{coupon.code}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {coupon.isPercent ? `${coupon.discount}% خصم` : `${coupon.discount} ل.س خصم`}
                                                                </span>
                                                            </div>
                                                            <Badge variant={coupon.isPercent ? "default" : "secondary"}>
                                                                {coupon.isPercent ? `${coupon.discount}%` : `${coupon.discount} ل.س`}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {availableCouponsEdit.length === 0 && !couponCheckLoadingEdit && form.userId && selectedLevel && (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                        ⚠️ لا توجد كوبونات متاحة للمستخدم والمستوى المحددين
                                    </div>
                                )}

                                {/* ✅ عرض معلومات الكوبون الحالي */}
                                {form.couponId && (
                                    <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <Tag className="w-3 h-3" />
                                            <span>الكوبون المحدد: <strong>{availableCouponsEdit.find(c => c.id.toString() === form.couponId)?.code || "جاري التحميل..."}</strong></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* البيانات الأساسية */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* المستخدم */}
                            <div className="space-y-2">
                                <Label>المستخدم *</Label>
                                <Select
                                    value={form.userId}
                                    onValueChange={(value) => handleFormChange("userId", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            form.userId ? `محدد: ${users.find(u => u.id.toString() === form.userId)?.name || form.userId}` : "اختر المستخدم"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent >
                                        <div className="p-2">
                                            <Input
                                                placeholder="ابحث عن مستخدم..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="mb-2"
                                            />
                                        </div>
                                        {users
                                            .filter(user =>
                                                !userSearch ||
                                                user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                                                user.phone?.includes(userSearch)
                                            )
                                            .map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.name}</span>
                                                        <span dir="ltr" className="text-xs text-muted-foreground">{user.phone}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                                {form.userId && (
                                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                                        العملة المحددة: {
                                            getCurrencyType(users.find(u => u.id.toString() === form.userId)?.phone) === 'SAR'
                                                ? 'السورية (ل.س)'
                                                : 'الدولار ($)'
                                        }
                                    </div>
                                )}
                            </div>

                            {/* مدة الصلاحية */}
                            <div className="space-y-2">
                                <Label>مدة الصلاحية (أشهر) *</Label>
                                <Select
                                    value={form.validityInMonths}
                                    onValueChange={(value) => handleFormChange("validityInMonths", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر المدة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">شهر واحد</SelectItem>
                                        <SelectItem value="1.5">شهر ونصف</SelectItem>
                                        <SelectItem value="2">شهرين</SelectItem>
                                        <SelectItem value="3">ثلاثة أشهر</SelectItem>
                                        <SelectItem value="6">ستة أشهر</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* الكوبونات والمبلغ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* المبلغ المدفوع */}
                            <div className="space-y-2">
                                <Label>المبلغ المدفوع *</Label>
                                <Input
                                    type="number"
                                    value={form.amountPaid}
                                    onChange={(e) => handleFormChange("amountPaid", e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        {/* الحالة والملاحظات */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* الحالة */}
                            <div className="space-y-2">
                                <Label>حالة الكود</Label>
                                <Select
                                    value={form.isActive}
                                    onValueChange={(value) => handleFormChange("isActive", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الحالة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">نشط</SelectItem>
                                        <SelectItem value="false">غير نشط</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* حالة الاستخدام */}
                            <div className="space-y-2">
                                <Label>حالة الاستخدام</Label>
                                <Select
                                    value={form.status || "NOT_USED"}
                                    onValueChange={(value) => handleFormChange("status", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر حالة الاستخدام" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NOT_USED">غير مستخدم</SelectItem>
                                        <SelectItem value="USED">مستخدم</SelectItem>
                                        <SelectItem value="CANCELLED">ملغى</SelectItem>
                                        <SelectItem value="EXPIRED">منتهي الصلاحية</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* الملاحظات */}
                        <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Textarea
                                value={form.notes}
                                onChange={(e) => handleFormChange("notes", e.target.value)}
                                rows={2}
                                placeholder="أدخل أي ملاحظات إضافية..."
                            />
                        </div>

                        {/* معلومات السعر */}
                        {/* 💰 معلومات السعر في التعديل */}
                        {(form.originalPrice || form.couponId) && (
                            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <Label className="font-bold text-base text-blue-800">معلومات السعر</Label>

                                {priceLoading ? (
                                    <div className="flex justify-center items-center py-4">
                                        <div className="animate-spin h-6 w-6 border-b-2 rounded-full border-blue-600"></div>
                                        <span className="mr-2 text-blue-700">جاري حساب السعر...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="space-y-2">
                                            <Label>السعر الأصلي</Label>
                                            <Input
                                                type="number"
                                                value={form.originalPrice}
                                                onChange={(e) => handleFormChange("originalPrice", e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="bg-white"
                                                readOnly
                                            />
                                        </div>

                                        {parseFloat(form.discountAmount) > 0 && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label>مبلغ الخصم</Label>
                                                    <Input
                                                        type="number"
                                                        value={form.discountAmount}
                                                        readOnly
                                                        className="bg-green-50 border-green-200 text-green-700 font-bold"
                                                    />
                                                </div>

                                                <div className="p-3 bg-white rounded border">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">السعر الأصلي:</span>
                                                            <span className="font-medium">
                                                                {parseFloat(form.originalPrice).toLocaleString()} ل.س
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">نوع الخصم:</span>
                                                            <span className="font-medium">
                                                                {availableCouponsEdit.find(c => c.id === parseInt(form.couponId))?.isPercent ?
                                                                    `نسبة (${availableCouponsEdit.find(c => c.id === parseInt(form.couponId))?.discount}%)` :
                                                                    `قيمة ثابتة (${availableCouponsEdit.find(c => c.id === parseInt(form.couponId))?.discount} ل.س)`}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">الخصم:</span>
                                                            <span className="font-medium text-red-600">
                                                                -{parseFloat(form.discountAmount).toLocaleString()} ل.س
                                                            </span>
                                                        </div>
                                                        <div className="border-t pt-2 flex justify-between items-center">
                                                            <span className="font-bold text-gray-800">السعر النهائي:</span>
                                                            <span className="font-bold text-green-600 text-lg">
                                                                {parseFloat(form.finalPrice).toLocaleString()} ل.س
                                                            </span>
                                                        </div>
                                                        {form.couponId && (
                                                            <div className="flex justify-between items-center text-xs text-blue-600">
                                                                <span>الكوبون المطبق:</span>
                                                                <span>{availableCouponsEdit.find(c => c.id === parseInt(form.couponId))?.code}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="space-y-2">
                                            <Label>السعر النهائي *</Label>
                                            <Input
                                                type="number"
                                                value={form.finalPrice}
                                                onChange={(e) => handleFormChange("finalPrice", e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="font-bold text-lg border-2 border-green-200 bg-green-50"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            onClick={handleEditCode}
                            disabled={!selectedLevel || !form.userId || !form.amountPaid || !form.validityInMonths}
                            className="w-full"
                        >
                            تحديث الكود
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ديالوج التفاصيل */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(open) => setDetailDialog({ ...detailDialog, isOpen: open })}>
                <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 text-right">
                            <div className="flex items-center gap-2">
                                <FileText className="w-6 h-6 text-blue-600" />
                                تفاصيل كود الوصول
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    {detailDialog.item && renderCodeDetails(detailDialog.item)}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AccessCode;