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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Clock, Shield, Hash, BarChart3, Users, Upload, Edit, Trash2, Search, ChevronLeft, ChevronRight, Eye, Copy, User, Book, Calendar, DollarSign, FileText, ZoomIn, Phone, Info, Tag, Play, Pause, Filter, X, BookA } from "lucide-react";
import {
    generateAccessCode,
    getAllAccessCodes,
    deleteAccessCode,
    updateAccessCodeStatus,
    getActiveCouponsByLevel,
    calculateFinalPrice,
    updateAccessCode
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
    const [loading, setLoading] = useState(false);
    const [priceLoading, setPriceLoading] = useState(false);

    // ✅ الهيكلية الجديدة
    const [specializations, setSpecializations] = useState([]);
    const [instructors, setInstructors] = useState([]);

    // حالة النموذج
    const [form, setForm] = useState({
        courseId: "",
        courseLevelId: "",
        userId: "",
        validityInMonths: "6",
        amountPaid: "",
        originalPrice: "",
        discountAmount: "0",
        finalPrice: "",
        couponId: "",
        notes: ""
    });

    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" });
    const [statusDialog, setStatusDialog] = useState({ isOpen: false, itemId: null, itemName: "", isActive: false });
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, item: null });
    const [editDialog, setEditDialog] = useState({ isOpen: false, item: null, currentCouponId: "" }); // ✅ حالة جديدة للتعديل

    // حالات الفلترة والترتيب
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [userFilter, setUserFilter] = useState("all");
    const [courseFilter, setCourseFilter] = useState("all");
    const [levelFilter, setLevelFilter] = useState("all"); // ✅ فلترة جديدة بالمستوى
    const [sortBy, setSortBy] = useState("issuedAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // 🔍 حالات البحث للهيكلية الجديدة
    const [specializationSearch, setSpecializationSearch] = useState("");
    const [courseSearch, setCourseSearch] = useState("");
    const [instructorSearch, setInstructorSearch] = useState("");
    const [levelSearch, setLevelSearch] = useState("");

    // 🎯 حالات التحديد للهيكلية الجديدة
    const [selectedSpecialization, setSelectedSpecialization] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedInstructor, setSelectedInstructor] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");

    // 📊 قوائم الفلترة
    const [filterCourses, setFilterCourses] = useState([]);
    const [filterLevels, setFilterLevels] = useState([]);

    const [userSearch, setUserSearch] = useState("");

    // 🔧 الإصلاح: استخدام useRef لحقل البحث
    const searchInputRef = useRef(null);

    // 🔧 الإصلاح: الحفاظ على التركيز في حقل البحث
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchTerm, statusFilter, userFilter, courseFilter, levelFilter]); // إعادة التركيز عند تغيير أي فلتر

    // 🔄 دوال جلب البيانات
    const fetchUsers = async () => {
        try {
            const res = await getAllUsers();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
                // if(data.role === "STUDENT"){
                    setUsers(data);
                // }
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

    // جلب الكورسات بناءً على الاختصاص المحدد
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
            showErrorToast("فشل تحميل الكورسات");
        }
    };

    // ✅ جلب المدرسين بناءً على الكورس المحدد
    const fetchInstructorsByCourse = async (courseId) => {
        if (!courseId) {
            setInstructors([]);
            setSelectedInstructor("");
            return;
        }

        try {
            console.log("🔄 جلب المدرسين للكورس:", courseId);
            const res = await getInstructorsByCourse(courseId);
            console.log("📊 استجابة المدرسين:", res);

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

            console.log("✅ المدرسين المستلمون:", data);
            setInstructors(data || []);

            // إذا كنا في وضع التعديل وكان هناك مدرس محدد مسبقاً، تأكد من وجوده في القائمة
            if (editDialog.isOpen && selectedInstructor) {
                const instructorExists = data.some(inst => inst.id.toString() === selectedInstructor);
                if (!instructorExists) {
                    console.log("⚠️ المدرس المحدد غير موجود في القائمة، إعادة التعيين");
                    setSelectedInstructor("");
                }
            }
        } catch (err) {
            console.error("❌ فشل تحميل المدرسين:", err);
            showErrorToast("فشل تحميل المدرسين");
            setInstructors([]);
        }
    };

    // ✅ جلب المستويات بناءً على المدرس المحدد
    const fetchLevelsByInstructor = async (instructorId) => {
        if (!instructorId) {
            setLevels([]);
            setSelectedLevel("");
            return;
        }

        try {
            // البحث عن المدرس المحدد للحصول على levelIds
            const selectedInstructorData = instructors.find(inst => inst.id === parseInt(instructorId));

            if (!selectedInstructorData || !selectedInstructorData.levelIds) {
                setLevels([]);
                return;
            }

            // جلب كل المستويات للكورس أولاً
            const res = await getCourseLevels(selectedCourse);
            console.log("استجابة المستويات الكاملة:", res);

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

            // ✅ فلترة المستويات حسب levelIds الخاص بالمدرس
            const filteredLevels = allLevels.filter(level =>
                selectedInstructorData.levelIds.includes(level.id)
            );

            console.log("المستويات المفلترة حسب المدرس:", filteredLevels);
            setLevels(filteredLevels || []);

            // إذا كنا في وضع التعديل وكان هناك مستوى محدد مسبقاً، تأكد من وجوده في القائمة
            if (editDialog.isOpen && selectedLevel) {
                const levelExists = filteredLevels.some(level => level.id.toString() === selectedLevel);
                if (!levelExists) {
                    console.log("⚠️ المستوى المحدد غير موجود في القائمة، إعادة التعيين");
                    setSelectedLevel("");
                }
            }
        } catch (err) {
            console.error("❌ فشل تحميل مستويات المدرس:", err);
            showErrorToast("فشل تحميل مستويات المدرس");
            setLevels([]);
        }
    };

    // 🎯 جلب الكوبونات النشطة للمستوى
  const fetchActiveCoupons = async (levelId) => {
    if (!levelId) {
        setCoupons([]);
        return;
    }

    try {
        console.log("🔄 جلب الكوبونات للمستوى:", levelId);
        const res = await getActiveCouponsByLevel(levelId);
        console.log("📊 استجابة الكوبونات:", res);

        let data = [];
        if (Array.isArray(res.data?.data)) {
            data = res.data.data;
        } else if (Array.isArray(res.data)) {
            data = res.data;
        }

        console.log("✅ الكوبونات المستلمة:", data);
        setCoupons(data);
        
        // ✅ إرجاع البيانات للاستخدام في الـ then
        return data;
    } catch (err) {
        console.error("❌ فشل تحميل الكوبونات:", err);
        showErrorToast("فشل تحميل الكوبونات");
        setCoupons([]);
        return [];
    }
};
    // 🔄 جلب الكوبونات عند فتح التعديل
    useEffect(() => {
        if (editDialog.isOpen && editDialog.item) {
            const item = editDialog.item;
            const transaction = item.transaction?.[0];
            const coupon = transaction?.coupon;

            console.log("🔄 جلب الكوبونات للتعديل:", {
                itemId: item.id,
                courseLevelId: item.courseLevelId,
                hasCoupon: !!coupon,
                couponId: coupon?.id
            });

            if (item.courseLevelId) {
                fetchActiveCoupons(item.courseLevelId.toString());
            }
        }
    }, [editDialog.isOpen, editDialog.item]);

    // 💰 حساب السعر النهائي مع الكوبون
    const calculatePriceWithCoupon = async (couponId, courseLevelId) => {
        if (!couponId || !courseLevelId) return;

        setPriceLoading(true);
        try {
            console.log("🔄 حساب السعر للكوبون:", couponId, "والمستوى:", courseLevelId);
            const res = await calculateFinalPrice(couponId, parseInt(courseLevelId));
            console.log("💰 استجابة حساب السعر:", res);

            const priceData = res.data?.data;

            if (priceData) {
                setForm(prev => ({
                    ...prev,
                    originalPrice: priceData.basePrice?.toString() || prev.originalPrice,
                    discountAmount: priceData.discount?.toString() || "0",
                    finalPrice: priceData.finalPrice?.toString() || prev.finalPrice,
                    amountPaid: priceData.finalPrice?.toString() || prev.amountPaid
                }));
            }
        } catch (err) {
            console.error("❌ فشل حساب السعر:", err);
            showErrorToast("فشل حساب السعر");
        } finally {
            setPriceLoading(false);
        }
    };

    const fetchAccessCodes = async () => {
        setLoading(true);
        try {
            const res = await getAllAccessCodes();
            const data = Array.isArray(res.data?.data) ? res.data.data : [];
            setAllCodes(data);
            setCodes(data);

            // ✅ استخراج الكورسات والمستويات الفريدة للفلترة
            const uniqueCourses = [];
            const uniqueLevels = [];
            const courseMap = new Map();
            const levelMap = new Map();

            data.forEach(item => {
                // استخراج الكورسات
                if (item.courseLevel?.course && !courseMap.has(item.courseLevel.course.id)) {
                    courseMap.set(item.courseLevel.course.id, item.courseLevel.course);
                    uniqueCourses.push(item.courseLevel.course);
                }

                // استخراج المستويات
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

    //  دالة التعديل الكاملة
    const handleEditCode = async () => {
        if (!editDialog.item) return;

        try {
            const requestData = {
                courseLevelId: parseInt(form.courseLevelId),    // ✅ تحويل إلى number
                userId: parseInt(form.userId),                  // ✅ تحويل إلى number
                validityInMonths: parseFloat(form.validityInMonths),
                isActive: form.isActive === "true",
                amountPaid: parseFloat(form.amountPaid),
                notes: form.notes || null,
                couponId: form.couponId ? parseInt(form.couponId) : null
            };

            console.log("📤 بيانات التعديل المرسلة (numbers):", requestData);

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

    // 🗑️ دوال مساعدة للحصول على الأسماء
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

    // 🔄 إعادة تعيين جميع الاختيارات
    const resetAllSelections = () => {
        setSelectedSpecialization("");
        setSelectedCourse("");
        setSelectedInstructor("");
        setSelectedLevel("");
        setSpecializationSearch("");
        setCourseSearch("");
        setInstructorSearch("");
        setLevelSearch("");
        setForm(prev => ({
            ...prev,
            courseId: "",
            courseLevelId: "",
            originalPrice: "",
            discountAmount: "0",
            finalPrice: "",
            amountPaid: "",
            couponId: ""
        }));
        setCoupons([]);
    };

    // 📥 useEffect للبيانات الأساسية
    useEffect(() => {
        fetchAccessCodes();
        fetchUsers();
        fetchSpecializations();
    }, []);

    // 🔄 useEffect للتسلسل الهرمي

    // ✅ عند تغيير الاختصاص المحدد
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

    // ✅ عند تغيير الكورس المحدد
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

    // ✅ عند تغيير المدرس المحدد
    useEffect(() => {
        if (selectedInstructor) {
            fetchLevelsByInstructor(selectedInstructor);
            setSelectedLevel("");
        } else {
            setLevels([]);
            setSelectedLevel("");
        }
    }, [selectedInstructor, selectedCourse]);

    // ✅ عند تغيير المستوى المحدد
    useEffect(() => {
        if (selectedLevel) {
            handleFormChange("courseLevelId", selectedLevel);
            fetchActiveCoupons(selectedLevel);

            // جلب سعر المستوى من البيانات الفعلية
            const selectedLevelData = levels.find(level => level.id === parseInt(selectedLevel));
            if (selectedLevelData) {
                const price = selectedLevelData.priceSAR || selectedLevelData.priceUSD || "0";
                setForm(prev => ({
                    ...prev,
                    originalPrice: price.toString(),
                    finalPrice: price.toString(),
                    amountPaid: price.toString()
                }));
            }
        } else {
            setCoupons([]);
            setForm(prev => ({
                ...prev,
                courseLevelId: "",
                originalPrice: "",
                discountAmount: "0",
                finalPrice: "",
                amountPaid: "",
                couponId: ""
            }));
        }
    }, [selectedLevel, levels]);

    // 🔄 عند تغيير الكوبون
    useEffect(() => {
        if (form.couponId && form.courseLevelId) {
            calculatePriceWithCoupon(form.couponId, form.courseLevelId);
        } else if (!form.couponId && form.courseLevelId) {
            // إعادة تعيين السعر عند إلغاء الكوبون
            const selectedLevel = levels.find(level => level.id === parseInt(form.courseLevelId));
            if (selectedLevel) {
                const price = selectedLevel.priceSAR || selectedLevel.priceUSD || "0";
                setForm(prev => ({
                    ...prev,
                    originalPrice: price.toString(),
                    discountAmount: "0",
                    finalPrice: price.toString(),
                    amountPaid: price.toString()
                }));
            }
        }
    }, [form.couponId, form.courseLevelId, levels]);

    // 🛠️ دوال مساعدة مصححة - مع التعامل مع القيم null
    const getAmountPaid = (item) => {
        if (!item || !item.transaction || item.transaction.length === 0) {
            return "0";
        }

        const transaction = item.transaction[0];
        const amountPaid = transaction.amountPaid;

        if (!amountPaid) {
            return "0";
        }

        console.log('🔍 amountPaid object:', JSON.stringify(amountPaid));

        // إذا كان الرقم مخزناً مباشرة في الحقل value أو كرقم عادي
        if (amountPaid.value !== undefined) {
            return amountPaid.value.toString();
        }

        if (typeof amountPaid === 'number') {
            return amountPaid.toString();
        }

        if (typeof amountPaid === 'object' && amountPaid.d && Array.isArray(amountPaid.d)) {
            const baseNumber = amountPaid.d[0];
            console.log(`🔢 baseNumber: ${baseNumber}, e: ${amountPaid.e}`);
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

    const getIssuedByName = (issuedById) => {
        if (!issuedById) return "غير محدد";
        const user = users.find(user => user.id === issuedById);
        return user ? user.name : `المستخدم ${issuedById}`;
    };

    // 🔄 جلب الكوبونات عند تغيير المستوى في التعديل
    // 🔄 جلب الكوبونات والحفاظ على التحديد
useEffect(() => {
    if (editDialog.isOpen && selectedLevel) {
        console.log("🔄 جلب الكوبونات للمستوى في التعديل:", selectedLevel);
        fetchActiveCoupons(selectedLevel).then(() => {
            // ✅ بعد جلب الكوبونات، إعادة تعيين الكوبون الأصلي
            if (editDialog.currentCouponId) {
                console.log("🎯 استعادة الكوبون بعد التحميل:", editDialog.currentCouponId);
                setTimeout(() => {
                    setForm(prev => ({ 
                        ...prev, 
                        couponId: editDialog.currentCouponId 
                    }));
                }, 100);
            }
        });
    }
}, [selectedLevel, editDialog.isOpen]);

    // 🔍 الفلترة والترتيب
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
            filtered = filtered.filter(item =>
                statusFilter === "active" ? item.isActive && !item.used : !item.isActive || item.used
            );
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

        // ✅ فلترة جديدة بالمستوى
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
                case "issuedAt":
                    aValue = new Date(a.issuedAt);
                    bValue = new Date(b.issuedAt);
                    break;
                case "isActive":
                    aValue = a.isActive && !a.used;
                    bValue = b.isActive && !b.used;
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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, userFilter, courseFilter, levelFilter, itemsPerPage]);

    // ✏️ دوال النموذج
    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
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

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            showSuccessToast("تم نسخ الكود إلى الحافظة");
        }).catch(() => {
            showErrorToast("فشل نسخ الكود");
        });
    };

    const handleGenerateCode = async () => {
        if (!selectedLevel) return showErrorToast("يرجى اختيار مستوى الكورس");
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
            if (form.couponId) formData.append('couponId', form.couponId);
            formData.append('receiptImageUrl', receiptFile);

            await generateAccessCode(formData);
            showSuccessToast("تم توليد الكود بنجاح");

            // إعادة تعيين النموذج
            setForm({
                courseId: "",
                courseLevelId: "",
                userId: "",
                validityInMonths: "6",
                amountPaid: "",
                originalPrice: "",
                discountAmount: "0",
                finalPrice: "",
                couponId: "",
                notes: ""
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

    //  دالة فتح نموذج التعديل الكامل
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
        currentCouponId // ✅ حفظ الكوبون الحالي
    });
    
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
        couponId: currentCouponId, // ✅ استخدام الكوبون المحفوظ
        amountPaid: getAmountPaid(item) || "",
        notes: transaction?.notes || "",
        
        // بيانات للعرض
        userName: user?.name || "",
        userPhone: user?.phone || ""
    };
    
    console.log("📝 بيانات النموذج المعبأة:", formData);
    console.log("🎯 الكوبون الحالي:", currentCouponId);
    
    setForm(formData);

    // تعيين جميع الاختيارات مع التسلسل الهرمي
    const specializationId = course?.specializationId?.toString() || "";
    const courseId = course?.id?.toString() || "";
    const instructorId = courseLevel?.instructorId?.toString() || "";
    const levelId = courseLevel?.id?.toString() || "";
    
    console.log("🎯 الاختيارات:", { specializationId, courseId, instructorId, levelId });
    
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
                        
                        // ✅ بعد جلب الكوبونات، تأكد من تعيين الكوبون الأصلي
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
    // 🔄 useEffect خاص لمعالجة بيانات التعديل
    useEffect(() => {
        if (editDialog.isOpen && editDialog.item) {
            const item = editDialog.item;
            const course = item.courseLevel?.course;

            // إذا كان هناك اختصاص محدد، جلب الكورسات
            if (selectedSpecialization && course?.specializationId?.toString() === selectedSpecialization) {
                fetchCourses(selectedSpecialization);
            }

            // إذا كان هناك كورس محدد، جلب المدرسين
            if (selectedCourse && course?.id?.toString() === selectedCourse) {
                fetchInstructorsByCourse(selectedCourse);
            }

            // إذا كان هناك مدرس محدد، جلب المستويات
            if (selectedInstructor && item.courseLevel?.instructorId?.toString() === selectedInstructor) {
                fetchLevelsByInstructor(selectedInstructor);
            }
        }
    }, [editDialog.isOpen, selectedSpecialization, selectedCourse, selectedInstructor]);

    // 🔄 جلب المستويات للفلترة في التعديل
    useEffect(() => {
        if (editDialog.isOpen) {
            // جلب جميع المستويات المتاحة للعرض في التعديل
            const fetchLevelsForEdit = async () => {
                try {
                    const res = await getCourseLevels();
                    console.log("استجابة المستويات للتحرير:", res);

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

                    setFilterLevels(allLevels || []);
                } catch (err) {
                    console.error("❌ فشل تحميل المستويات للتحرير:", err);
                    setFilterLevels([]);
                }
            };

            fetchLevelsForEdit();
        }
    }, [editDialog.isOpen]);

    // 📅 دوال التنسيق
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد";
        return new Date(dateString).toLocaleDateString('en-US');
    };

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

    // 🔄 إعادة تعيين فلترة المستوى عند تغيير الكورس
    useEffect(() => {
        if (courseFilter === "all") {
            setLevelFilter("all");
        }
    }, [courseFilter]);

    // 💰 مكون عرض معلومات السعر
    const PriceDisplay = ({ item }) => {
        const amountPaid = getAmountPaid(item);
        const coupon = getCouponInfo(item);

        return (
            <div className="space-y-2">
                {/* المبلغ المدفوع الفعلي */}
                <div>
                    <div className="text-xs text-muted-foreground">المبلغ المدفوع:</div>
                    <div className="font-bold text-lg">{amountPaid} ل.س</div>
                </div>

                {/* أسعار الكورس الأصلية */}
                {item.courseLevel && (
                    <div className="border-t pt-2">
                        <div className="text-xs text-muted-foreground mb-1">سعر الكورس:</div>
                        {item.courseLevel.priceSAR > 0 && (
                            <div className="font-medium text-sm">{item.courseLevel.priceSAR} ل.س</div>
                        )}
                        {item.courseLevel.priceUSD > 0 && (
                            <div className="text-xs text-muted-foreground">{item.courseLevel.priceUSD} $</div>
                        )}
                    </div>
                )}

                {/* معلومات الكوبون */}
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
            <div className="space-y-6 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <Label className="font-bold text-base">الكود:</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-lg font-mono font-bold bg-gray-100 px-3 py-2 rounded-lg">
                                    {item.code}
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(item.code)}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <Label className="font-bold text-base">الحالة:</Label>
                            <div className="mt-1">
                                <Badge variant={item.isActive && !item.used ? "default" : "secondary"}>
                                    {item.isActive && !item.used ? "نشط" : "مستخدم"}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <Label className="font-bold text-base">المستخدم:</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{item.user?.name || "غير محدد"}</p>
                                    <p className="text-sm text-muted-foreground" dir="ltr">{item.user?.phone}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="font-bold text-base">مدة الصلاحية:</Label>
                            <p className="mt-1">{item.validityInMonths || "غير محدد"} شهر</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label className="font-bold text-base">الكورس:</Label>
                            <p className="mt-1">{item.courseLevel?.course?.title || "غير محدد"}</p>
                        </div>

                        <div>
                            <Label className="font-bold text-base">المستوى:</Label>
                            <p className="mt-1">{item.courseLevel?.name || "غير محدد"}</p>
                        </div>

                        <div>
                            <Label className="font-bold text-base">المدرب:</Label>
                            <p className="mt-1">{item.courseLevel?.instructor?.name || "غير محدد"}</p>
                        </div>

                        <div>
                            <Label className="font-bold text-base">تاريخ الإصدار:</Label>
                            <p className="mt-1">{formatDate(item.issuedAt)}</p>
                        </div>
                    </div>
                </div>

                {/* المعلومات المالية */}
                <div className="border-t pt-4">
                    <h3 className="font-bold text-lg mb-3">المعلومات المالية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* المبلغ المدفوع */}
                        <div className="space-y-3">
                            <Label className="font-medium text-base">المبلغ المدفوع</Label>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-2xl font-bold text-blue-800">{amountPaid} ل.س</div>
                                <div className="text-sm text-blue-600 mt-1">المبلغ الفعلي الذي تم دفعه</div>
                            </div>
                        </div>

                        {/* أسعار الكورس الأصلية */}
                        {item.courseLevel && (
                            <div className="space-y-3">
                                <Label className="font-medium text-base">أسعار الكورس الأصلية</Label>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                    {item.courseLevel.priceSAR > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">السعر بالسوري:</span>
                                            <span className="font-bold text-lg">{item.courseLevel.priceSAR} ل.س</span>
                                        </div>
                                    )}
                                    {item.courseLevel.priceUSD > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">السعر بالدولار:</span>
                                            <span className="font-bold text-lg">{item.courseLevel.priceUSD} $</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* معلومات الكوبون */}
                        {coupon && (
                            <div className="md:col-span-2">
                                <Label className="font-medium text-base">معلومات الكوبون</Label>
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-green-600" />
                                        <span className="font-medium">{coupon.code}</span>
                                        <Badge variant="secondary" className="mr-2">
                                            {coupon.isPercent ? `${coupon.discount}% خصم` : `${coupon.discount} ل.س خصم`}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* الملاحظات */}
                        {item.transaction && item.transaction.length > 0 && item.transaction[0].notes && (
                            <div className="md:col-span-2">
                                <Label className="font-medium text-base">الملاحظات</Label>
                                <p className="mt-1 p-3 bg-gray-50 rounded border">{item.transaction[0].notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* صورة الإيصال */}
                {item.transaction && item.transaction.length > 0 && item.transaction[0].receiptImageUrl && (
                    <div className="mt-6">
                        <Label className="font-medium text-lg block mb-3">صورة الإيصال:</Label>
                        <div className="flex flex-col items-center">
                            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 max-w-2xl w-full group">
                                <img
                                    src={getImageUrl(item.transaction[0].receiptImageUrl)}
                                    alt="صورة الإيصال"
                                    className="max-w-full h-auto max-h-96 rounded-md shadow-md mx-auto cursor-zoom-in transition-all duration-300 group-hover:shadow-lg"
                                    {...imageConfig}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/tallaam_logo2.png";
                                    }}
                                    onClick={() => {
                                        window.open(getImageUrl(item.transaction[0].receiptImageUrl), '_blank');
                                    }}
                                />
                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn className="w-3 h-3 inline ml-1" />
                                    انقر للتكبير
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
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
                                    <Badge variant={item.isActive && !item.used ? "default" : "secondary"}>
                                        {item.isActive && !item.used ? "نشط" : "مستخدم"}
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
                            <PriceDisplay item={item} />
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
                            onClick={() => openEditDialog(item)} // ✅ استخدام دالة التعديل الجديدة
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

    // 🔍 مكون الفلترة المتقدمة
    const FilterSection = () => {
        const hasActiveFilters = searchTerm || statusFilter !== "all" || userFilter !== "all" || courseFilter !== "all" || levelFilter !== "all";

        return (
            <div className="space-y-4">
                {/* 🔍 شريط البحث والفلترة الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={searchInputRef} // 🔧 الإصلاح: إضافة المرجع هنا
                            placeholder="بحث بالكود أو المستخدم أو الكورس..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="فلترة بالحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع الحالات</SelectItem>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="used">مستخدم</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="فلترة بالمستخدم" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع المستخدمين</SelectItem>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="عدد العناصر" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 عناصر</SelectItem>
                            <SelectItem value="10">10 عناصر</SelectItem>
                            <SelectItem value="20">20 عنصر</SelectItem>
                            <SelectItem value="50">50 عنصر</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* ✅ فلترة الكورس والمستوى */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">فلترة بالكورس</Label>
                        <Select value={courseFilter} onValueChange={setCourseFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="جميع الكورسات" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع الكورسات</SelectItem>
                                {filterCourses.map((course) => (
                                    <SelectItem key={course.id} value={course.id.toString()}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">فلترة بالمستوى</Label>
                        <Select
                            value={levelFilter}
                            onValueChange={setLevelFilter}
                            disabled={courseFilter === "all"}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={
                                    courseFilter === "all" ? "اختر كورس أولاً" : "جميع المستويات"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع المستويات</SelectItem>
                                {filterLevels
                                    .filter(level =>
                                        courseFilter === "all" ||
                                        level.courseId?.toString() === courseFilter
                                    )
                                    .map((level) => (
                                        <SelectItem key={level.id} value={level.id.toString()}>
                                            {level.name}
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetFilters}
                                className="w-full"
                            >
                                <X className="w-4 h-4 ml-1" />
                                إعادة تعيين الفلترة
                            </Button>
                        )}
                    </div>
                </div>

                {/* 📊 معلومات النتائج */}
                <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        عرض {filteredAndSortedCodes.length} من أصل {allCodes.length} كود
                        {hasActiveFilters && ` (مفلتر)`}
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Filter className="w-3 h-3" />
                                مفعل
                            </Badge>
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
                                        validityInMonths: "6",
                                        amountPaid: "",
                                        originalPrice: "",
                                        discountAmount: "0",
                                        finalPrice: "",
                                        couponId: "",
                                        notes: ""
                                    });
                                    setReceiptFile(null);
                                    setReceiptPreview(null);
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
                                                    onClick={resetAllSelections}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    إعادة تعيين الكل
                                                </Button>
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
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name} - {user.phone}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

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
                                                {filteredSpecializations.map((spec) => (
                                                    <SelectItem key={spec.id} value={spec.id.toString()}>
                                                        {spec.name || spec.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* اختيار الكورس */}
                                    <div className="space-y-2">
                                        <Label>الكورس</Label>
                                        <Select
                                            value={selectedCourse}
                                            onValueChange={setSelectedCourse}
                                            disabled={!selectedSpecialization}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={selectedSpecialization ? "اختر الكورس" : "اختر الاختصاص أولاً"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div className="p-2">
                                                    <Input
                                                        placeholder="ابحث عن كورس..."
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
                                                <SelectValue placeholder={selectedCourse ? "اختر المدرس" : "اختر الكورس أولاً"} />
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
                                                        لا توجد مدرسين لهذا الكورس
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
                                                        {level.priceSAR > 0 && ` - ${level.priceSAR} ل.س`}
                                                        {level.priceUSD > 0 && level.priceSAR === 0 && ` - ${level.priceUSD} $`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* 🎯 عرض الكوبونات النشطة */}
                                {coupons.length > 0 ? (
                                    <div className="space-y-2">
                                        <Label>كوبونات الخصم المتاحة</Label>
                                        <Select
                                            value={form.couponId || "no-coupon"}
                                            onValueChange={(value) => handleFormChange("couponId", value === "no-coupon" ? "" : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر كوبون خصم (اختياري)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no-coupon">بدون كوبون</SelectItem>
                                                {coupons.map((coupon) => (
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
                                        <p className="text-xs text-muted-foreground">
                                            اختر كوبون خصم لتطبيقه على السعر تلقائياً
                                        </p>
                                    </div>
                                ) : (
                                    selectedLevel && (
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-800 text-center">
                                                ⚠️ لا توجد كوبونات متاحة لهذا المستوى
                                            </p>
                                        </div>
                                    )
                                )}

                                {/* 💰 معلومات السعر */}
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
                                                                    <span className="font-medium">{form.originalPrice} ل.س</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm text-gray-600">نوع الخصم:</span>
                                                                    <span className="font-medium">
                                                                        {coupons.find(c => c.id === parseInt(form.couponId))?.isPercent ?
                                                                            `نسبة (${coupons.find(c => c.id === parseInt(form.couponId))?.discount}%)` :
                                                                            `قيمة ثابتة (${coupons.find(c => c.id === parseInt(form.couponId))?.discount} ل.س)`}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm text-gray-600">الخصم:</span>
                                                                    <span className="font-medium text-red-600">-{form.discountAmount} ل.س</span>
                                                                </div>
                                                                <div className="border-t pt-2 flex justify-between items-center">
                                                                    <span className="font-bold text-gray-800">السعر النهائي:</span>
                                                                    <span className="font-bold text-green-600 text-lg">{form.finalPrice} ل.س</span>
                                                                </div>
                                                                {form.couponId && (
                                                                    <div className="flex justify-between items-center text-xs text-blue-600">
                                                                        <span>الكوبون المطبق:</span>
                                                                        <span>{coupons.find(c => c.id === parseInt(form.couponId))?.code}</span>
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
                                    disabled={priceLoading || !selectedLevel || !form.userId || !receiptFile || !form.amountPaid}
                                >
                                    {priceLoading ? "جاري حساب السعر..." : "توليد الكود"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* 🔍 قسم الفلترة */}
                <FilterSection />
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
                    </div>
                ) : (
                    <>
                        {/* 📊 عرض الجدول للشاشات المتوسطة والكبيرة */}
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
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("course")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الكورس
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
                                        </TableHead>
                                        <TableHead className="table-header">المدة</TableHead>
                                        <TableHead className="table-header">
                                            <div className="space-y-1">
                                                <div>المعلومات المالية</div>
                                                <div className="text-xs text-muted-foreground font-normal">(المدفوع + سعر الكورس)</div>
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
                                                <TableCell className="table-cell">
                                                    {item.courseLevel?.course?.title || "غير محدد"}
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    {item.courseLevel?.name || "غير محدد"}
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
                                                    <Badge variant={item.isActive && !item.used ? "default" : "secondary"}>
                                                        {item.isActive && !item.used ? "نشط" : "مستخدم"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="table-cell text-right space-x-2">
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
                                                        onClick={() => copyToClipboard(item.code)}
                                                        title="نسخ الكود"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => openEditDialog(item)} // ✅ زر التعديل الجديد
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
                                            <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                                                {allCodes.length === 0 ? "لا توجد أكواد متاحة" : "لم يتم العثور على نتائج"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* 📱 عرض البطاقات للشاشات الصغيرة */}
                        <div className="md:hidden space-y-4">
                            {paginatedCodes.length > 0 ? paginatedCodes.map(item => (
                                <CodeCard key={item.id} item={item} />
                            )) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allCodes.length === 0 ? "لا توجد أكواد متاحة" : "لم يتم العثور على نتائج"}
                                </div>
                            )}
                        </div>

                        {/* 🔢 الترقيم */}
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

            {/* 🗑️ ديالوج تأكيد الحذف */}
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

            {/* 🔄 ديالوج تحديث الحالة */}
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

            {/*  ديالوج التفاصيل */}
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

                    {detailDialog.item && (
                        <div className="space-y-6 text-right">
                            {/* الهيدر مع المعلومات الأساسية */}
                            <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                                    {/* أيقونة الكود */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
                                            <FileText className="w-10 h-10 text-blue-600" />
                                        </div>
                                        {/* شارة الحالة */}
                                        <div className={`absolute -top-2 -right-2 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg ${detailDialog.item.isActive && !detailDialog.item.used
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-500 text-white"
                                            }`}>
                                            {detailDialog.item.isActive && !detailDialog.item.used ? "✓" : "✗"}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div>
                                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 font-mono">
                                                    {detailDialog.item.code}
                                                </h2>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <Badge variant={detailDialog.item.isActive && !detailDialog.item.used ? "default" : "secondary"}
                                                        className={detailDialog.item.isActive && !detailDialog.item.used ? "bg-green-600 hover:bg-green-700" : "bg-gray-500"}>
                                                        {detailDialog.item.isActive && !detailDialog.item.used ? "🟢 نشط" : "🔴 مستخدم"}
                                                    </Badge>

                                                    {detailDialog.item.validityInMonths && (
                                                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                                            <Calendar className="w-3 h-3 ml-1" />
                                                            {detailDialog.item.validityInMonths} شهر
                                                        </Badge>
                                                    )}

                                                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                                        <Book className="w-3 h-3 ml-1" />
                                                        {detailDialog.item.courseLevel?.course?.title || "غير محدد"}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                onClick={() => copyToClipboard(detailDialog.item.code)}
                                                className="flex items-center gap-2"
                                            >
                                                <Copy className="w-4 h-4" />
                                                نسخ الكود
                                            </Button>
                                        </div>

                                        {/* معلومات سريعة */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                <span>أصدر في: {formatDate(detailDialog.item.issuedAt)}</span>
                                            </div>
                                            {detailDialog.item.user && (
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                    <span>{detailDialog.item.user.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* الشبكة الرئيسية للمعلومات */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* معلومات المستخدم والكورس */}
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-3 bg-gradient-to-l from-green-50 to-emerald-50 rounded-t-lg">
                                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                            <User className="w-5 h-5 text-green-600" />
                                            معلومات المستخدم والكورس
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        <div className="space-y-3">
                                            {/* معلومات المستخدم */}
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">المستخدم</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-medium text-gray-900 block">{detailDialog.item.user?.name || "غير محدد"}</span>
                                                    <span className="text-xs text-gray-500" dir="ltr">{detailDialog.item.user?.phone}</span>
                                                </div>
                                            </div>

                                            {/* الاختصاص */}
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <BookA className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">الاختصاص</span>
                                                </div>
                                                <span className="font-medium text-gray-900">{detailDialog.item.courseLevel?.course?.specialization?.name || "غير محدد"}</span>
                                            </div>
                                            {/* الكورس */}
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Book className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">الكورس</span>
                                                </div>
                                                <span className="font-medium text-gray-900">{detailDialog.item.courseLevel?.course?.title || "غير محدد"}</span>
                                            </div>


                                            {/* المدرب */}
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">المدرب</span>
                                                </div>
                                                <span className="font-medium text-gray-900">{detailDialog.item.courseLevel?.instructor?.name || "غير محدد"}</span>
                                            </div>

                                            {/* المستوى */}
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">المستوى</span>
                                                </div>
                                                <span className="font-medium text-gray-900">{detailDialog.item.courseLevel?.name || "غير محدد"}</span>
                                            </div>

                                        </div>
                                    </CardContent>
                                </Card>

                                {/* معلومات الإصدار والصحة */}
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-3 bg-gradient-to-l from-purple-50 to-pink-50 rounded-t-lg">
                                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                            <Calendar className="w-5 h-5 text-purple-600" />
                                            معلومات الإصدار والصحة
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">تاريخ الإصدار</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-medium text-gray-900 block">{formatDate(detailDialog.item.issuedAt)}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">مدة الصلاحية</span>
                                                </div>
                                                <span className="font-medium text-gray-900">{detailDialog.item.validityInMonths || "غير محدد"} شهر</span>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">الحالة الحالية</span>
                                                </div>
                                                <Badge variant={detailDialog.item.isActive && !detailDialog.item.used ? "default" : "secondary"}>
                                                    {detailDialog.item.isActive && !detailDialog.item.used ? "نشط" : "مستخدم"}
                                                </Badge>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">معرف الكود</span>
                                                </div>
                                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                                                    {detailDialog.item.id}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* المعلومات المالية */}
                            <Card className="border border-gray-200 shadow-sm">
                                <CardHeader className="pb-3 bg-gradient-to-l from-orange-50 to-amber-50 rounded-t-lg">
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                        <DollarSign className="w-5 h-5 text-orange-600" />
                                        المعلومات المالية
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* المبلغ المدفوع */}
                                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="text-2xl font-bold text-blue-600">💰</div>
                                            <div className="text-sm font-medium text-gray-700 mt-2">المبلغ المدفوع</div>
                                            <div className="text-2xl font-bold text-gray-900 mt-1">{getAmountPaid(detailDialog.item)} ل.س</div>
                                            <div className="text-xs text-blue-600 mt-1">المبلغ الفعلي</div>
                                        </div>

                                        {/* سعر الكورس */}
                                        {detailDialog.item.courseLevel && (
                                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                                <div className="text-2xl font-bold text-green-600">🏷️</div>
                                                <div className="text-sm font-medium text-gray-700 mt-2">سعر الكورس</div>
                                                {detailDialog.item.courseLevel.priceSAR > 0 && (
                                                    <div className="text-xl font-bold text-gray-900">{detailDialog.item.courseLevel.priceSAR} ل.س</div>
                                                )}
                                                {detailDialog.item.courseLevel.priceUSD > 0 && (
                                                    <div className="text-sm text-gray-600 mt-1">{detailDialog.item.courseLevel.priceUSD} $</div>
                                                )}
                                            </div>
                                        )}

                                        {/* معلومات الكوبون */}
                                        {getCouponInfo(detailDialog.item) ? (
                                            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                                <div className="text-2xl font-bold text-purple-600">🎫</div>
                                                <div className="text-sm font-medium text-gray-700 mt-2">كوبون الخصم</div>
                                                <div className="text-lg font-bold text-gray-900 mt-1">{getCouponInfo(detailDialog.item).code}</div>
                                                <div className="text-xs text-purple-600 mt-1">
                                                    {getCouponInfo(detailDialog.item).isPercent ?
                                                        `${getCouponInfo(detailDialog.item).discount}% خصم` :
                                                        `${getCouponInfo(detailDialog.item).discount} ل.س خصم`}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="text-2xl font-bold text-gray-600">➖</div>
                                                <div className="text-sm font-medium text-gray-700 mt-2">كوبون الخصم</div>
                                                <div className="text-lg font-bold text-gray-900 mt-1">بدون كوبون</div>
                                                <div className="text-xs text-gray-600 mt-1">لم يتم تطبيق خصم</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* تفاصيل إضافية */}
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {detailDialog.item.transaction && detailDialog.item.transaction.length > 0 && detailDialog.item.transaction[0].notes && (
                                            <div className="md:col-span-2">
                                                <span className="text-sm font-medium text-gray-700 block mb-2">الملاحظات</span>
                                                <p className="p-3 bg-gray-50 rounded border text-gray-800">{detailDialog.item.transaction[0].notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* صورة الإيصال */}
                            {detailDialog.item.transaction && detailDialog.item.transaction.length > 0 && detailDialog.item.transaction[0].receiptImageUrl && (
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-3 bg-gradient-to-l from-red-50 to-rose-50 rounded-t-lg">
                                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                            <Upload className="w-5 h-5 text-red-600" />
                                            صورة الإيصال
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="flex flex-col items-center">
                                            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 max-w-2xl w-full group cursor-pointer transition-all duration-300 hover:shadow-lg">
                                                <img
                                                    src={getImageUrl(detailDialog.item.transaction[0].receiptImageUrl)}
                                                    alt="صورة الإيصال"
                                                    className="max-w-full h-auto max-h-96 rounded-md shadow-md mx-auto transition-all duration-300 group-hover:scale-105"
                                                    {...imageConfig}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "/tallaam_logo2.png";
                                                    }}
                                                    onClick={() => {
                                                        window.open(getImageUrl(detailDialog.item.transaction[0].receiptImageUrl), '_blank');
                                                    }}
                                                />
                                                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ZoomIn className="w-4 h-4" />
                                                    انقر للتكبير
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                                                <Info className="w-4 h-4" />
                                                انقر على الصورة لعرضها بحجم كامل في نافذة جديدة
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* ملخص سريع */}
                            <Card className="border border-gray-200 shadow-sm">
                                <CardHeader className="pb-3 bg-gradient-to-l from-gray-50 to-slate-50 rounded-t-lg">
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                        <BarChart3 className="w-5 h-5 text-gray-600" />
                                        ملخص الكود
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {detailDialog.item.isActive && !detailDialog.item.used ? "✅" : "❌"}
                                            </div>
                                            <div className="text-sm font-medium text-gray-700 mt-1">الحالة</div>
                                            <div className="text-lg font-bold text-gray-900">
                                                {detailDialog.item.isActive && !detailDialog.item.used ? "نشط" : "مستخدم"}
                                            </div>
                                        </div>

                                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                                            <div className="text-2xl font-bold text-green-600">📅</div>
                                            <div className="text-sm font-medium text-gray-700 mt-1">المدة</div>
                                            <div className="text-lg font-bold text-gray-900">
                                                {detailDialog.item.validityInMonths || "0"} شهر
                                            </div>
                                        </div>

                                        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                                            <div className="text-2xl font-bold text-purple-600">💳</div>
                                            <div className="text-sm font-medium text-gray-700 mt-1">المدفوع</div>
                                            <div className="text-lg font-bold text-gray-900">
                                                {getAmountPaid(detailDialog.item)} ل.س
                                            </div>
                                        </div>

                                        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                                            <div className="text-2xl font-bold text-orange-600">🎯</div>
                                            <div className="text-sm font-medium text-gray-700 mt-1">الكورس</div>
                                            <div className="text-lg font-bold text-gray-900 truncate" title={detailDialog.item.courseLevel?.course?.title}>
                                                {detailDialog.item.courseLevel?.course?.title ?
                                                    (detailDialog.item.courseLevel.course.title.length > 12 ?
                                                        detailDialog.item.courseLevel.course.title.substring(0, 12) + "..." :
                                                        detailDialog.item.courseLevel.course.title)
                                                    : "---"}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* أزرار الإجراءات */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    onClick={() => copyToClipboard(detailDialog.item.code)}
                                    className="flex items-center gap-2 flex-1"
                                >
                                    <Copy className="w-4 h-4" />
                                    نسخ الكود
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        openEditDialog(detailDialog.item); // ✅ فتح نموذج التعديل
                                        setDetailDialog({ isOpen: false, item: null });
                                    }}
                                    className="flex items-center gap-2 flex-1"
                                >
                                    <Edit className="w-4 h-4" />
                                    تعديل الكود
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setStatusDialog({
                                            isOpen: true,
                                            itemId: detailDialog.item.id,
                                            itemName: detailDialog.item.code,
                                            isActive: !detailDialog.item.isActive
                                        });
                                        setDetailDialog({ isOpen: false, item: null });
                                    }}
                                    className="flex items-center gap-2 flex-1"
                                >
                                    {detailDialog.item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    {detailDialog.item.isActive ? "تعطيل الكود" : "تفعيل الكود"}
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setDeleteDialog({
                                            isOpen: true,
                                            itemId: detailDialog.item.id,
                                            itemName: detailDialog.item.code
                                        });
                                        setDetailDialog({ isOpen: false, item: null });
                                    }}
                                    className="flex items-center gap-2 flex-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    حذف الكود
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/*  ديالوج التعديل الكامل */}
            <Dialog open={editDialog.isOpen} onOpenChange={(open) => {
                setEditDialog({ ...editDialog, isOpen: open });
                if (!open) {
                    resetAllSelections();
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
                                            onClick={resetAllSelections}
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
                                        {filteredSpecializations.map((spec) => (
                                            <SelectItem key={spec.id} value={spec.id.toString()}>
                                                {spec.name || spec.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* اختيار الكورس */}
                            <div className="space-y-2">
                                <Label>الكورس</Label>
                                <Select
                                    value={selectedCourse}
                                    onValueChange={setSelectedCourse}
                                    disabled={!selectedSpecialization}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedSpecialization ? "اختر الكورس" : "اختر الاختصاص أولاً"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2">
                                            <Input
                                                placeholder="ابحث عن كورس..."
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
                                        <SelectValue placeholder={selectedCourse ? "اختر المدرس" : "اختر الكورس أولاً"} />
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
                                                لا توجد مدرسين لهذا الكورس
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
                                                {level.priceSAR > 0 && ` - ${level.priceSAR} ل.س`}
                                                {level.priceUSD > 0 && level.priceSAR === 0 && ` - ${level.priceUSD} $`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

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
                                    <SelectContent>
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
                                    <p className="text-xs text-green-600">
                                        ✓ المستخدم الحالي: {users.find(u => u.id.toString() === form.userId)?.name || "جاري التحميل..."}
                                    </p>
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
                          {/* الكوبونات */}
<div className="space-y-2">
    <Label>كوبون الخصم</Label>
    <Select
        value={form.couponId || "no-coupon"}
        onValueChange={(value) => handleFormChange("couponId", value === "no-coupon" ? "" : value)}
    >
        <SelectTrigger>
            <SelectValue placeholder={
                form.couponId ? `محدد: ${coupons.find(c => c.id.toString() === form.couponId)?.code || form.couponId}` : "اختر كوبون خصم"
            } />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="no-coupon">بدون كوبون</SelectItem>
            {coupons.map((coupon) => (
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
            {coupons.length === 0 && selectedLevel && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                    لا توجد كوبونات متاحة لهذا المستوى
                </div>
            )}
        </SelectContent>
    </Select>
    
    {/* ✅ عرض معلومات الكوبون الحالي */}
    {form.couponId && (
        <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
            <div className="flex items-center gap-2 text-green-700">
                <Tag className="w-3 h-3" />
                <span>الكوبون الحالي: <strong>{coupons.find(c => c.id.toString() === form.couponId)?.code || "جاري التحميل..."}</strong></span>
            </div>
        </div>
    )}
</div>

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
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            {/* الحالة */}
                            {/* <div className="space-y-2">
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
                            </div> */}

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
                        </div>

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

        </Card>
    );
};

export default AccessCode;