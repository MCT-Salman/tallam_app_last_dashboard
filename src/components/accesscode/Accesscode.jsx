import React, { useEffect, useState, useMemo } from "react";
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
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Eye, Copy, User, Book, Calendar, DollarSign, FileText, ZoomIn, Phone, Info, Tag, Play, Pause } from "lucide-react";
import {
    generateAccessCode,
    getAllAccessCodes,
    deleteAccessCode,
    updateAccessCodeStatus,
    getActiveCouponsByLevel,
    calculateFinalPrice
} from "@/api/api";
import { getAllUsers } from "@/api/api";
import { getCourses } from "@/api/api";
import { getCourseLevels } from "@/api/api";
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

    // حالات الفلترة والترتيب
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [userFilter, setUserFilter] = useState("all");
    const [courseFilter, setCourseFilter] = useState("all");
    const [sortBy, setSortBy] = useState("issuedAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // 🔄 دوال جلب البيانات
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

    const fetchCourses = async () => {
        try {
            const res = await getCourses();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            setCourses(data);
        } catch (err) {
            console.error("❌ فشل تحميل الكورسات:", err);
            showErrorToast("فشل تحميل الكورسات");
        }
    };

    const fetchCourseLevels = async (courseId) => {
        if (!courseId) {
            setLevels([]);
            setCoupons([]);
            return;
        }

        try {
            const res = await getCourseLevels(courseId);
            let data = [];

            if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data?.data?.items)) {
                data = res.data.data.items;
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            }

            setLevels(data || []);
        } catch (err) {
            console.error("❌ فشل تحميل مستويات الكورس:", err);
            showErrorToast("فشل تحميل مستويات الكورس");
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
        } catch (err) {
            console.error("❌ فشل تحميل الكوبونات:", err);
            showErrorToast("فشل تحميل الكوبونات");
            setCoupons([]);
        }
    };

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

    // 📥 useEffect للبيانات الأساسية
    useEffect(() => {
        fetchAccessCodes();
        fetchUsers();
        fetchCourses();
    }, []);

    // 🔄 عند تغيير الكورس
    useEffect(() => {
        if (form.courseId) {
            fetchCourseLevels(form.courseId);
        } else {
            setLevels([]);
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
    }, [form.courseId]);

    // 🔄 عند تغيير المستوى
    useEffect(() => {
        if (form.courseLevelId) {
            fetchActiveCoupons(form.courseLevelId);

            // جلب سعر المستوى من البيانات الفعلية
            const selectedLevel = levels.find(level => level.id === parseInt(form.courseLevelId));
            if (selectedLevel) {
                // استخدام السعر السوري (priceSAR) كسعر أساسي
                const price = selectedLevel.priceSAR || selectedLevel.priceUSD || "0";
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
                originalPrice: "",
                discountAmount: "0",
                finalPrice: "",
                amountPaid: "",
                couponId: ""
            }));
        }
    }, [form.courseLevelId, levels]);

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

    // 🛠️ دوال مساعدة
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/tallaam_logo2.png";
        const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
        const cleanImageUrl = imageUrl.replace(/^\//, "");
        return `${cleanBaseUrl}/${cleanImageUrl}`;
    };


    const getAmountPaid = (item) => {
        if (!item.transaction || item.transaction.length === 0) {
            return "0";
        }

        const transaction = item.transaction[0];
        const amountPaid = transaction.amountPaid;

        console.log('🔍 amountPaid object:', JSON.stringify(amountPaid));

        // إذا كان الرقم مخزناً مباشرة في الحقل value أو كرقم عادي
        if (amountPaid.value !== undefined) {
            return amountPaid.value.toString();
        }

        if (typeof amountPaid === 'number') {
            return amountPaid.toString();
        }

        if (typeof amountPaid === 'object' && amountPaid.d && Array.isArray(amountPaid.d)) {
            // جرب قراءة الرقم من أماكن مختلفة في الكائن
            const baseNumber = amountPaid.d[0];

            // إذا كان baseNumber هو 50 وexponent هو 3، فالنتيجة يجب أن تكون 50000
            // ولكن إذا أعطاك 500000000، فربما baseNumber هو 50000 وexponent هو 4
            console.log(`🔢 baseNumber: ${baseNumber}, e: ${amountPaid.e}`);

            // جرب بدون exponent أولاً
            return baseNumber.toString();
        }

        return amountPaid?.toString() || "0";
    };

    const getCouponInfo = (item) => {
        if (!item.transaction || item.transaction.length === 0) return null;
        return item.transaction[0].coupon;
    };

    const getIssuedByName = (issuedById) => {
        if (!issuedById) return "غير محدد";
        const user = users.find(user => user.id === issuedById);
        return user ? user.name : `المستخدم ${issuedById}`;
    };

    // 🔍 الفلترة والترتيب
    const filteredAndSortedCodes = useMemo(() => {
        let filtered = [...allCodes];

        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.courseLevel?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
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
    }, [allCodes, searchTerm, statusFilter, userFilter, courseFilter, sortBy, sortOrder]);

    const paginatedCodes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedCodes.slice(startIndex, endIndex);
    }, [filteredAndSortedCodes, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, userFilter, courseFilter, itemsPerPage]);

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
        if (!form.courseLevelId) return showErrorToast("يرجى اختيار مستوى الكورس");
        if (!form.userId) return showErrorToast("يرجى اختيار المستخدم");
        if (!receiptFile) return showErrorToast("يرجى رفع صورة الإيصال");
        if (!form.amountPaid || parseFloat(form.amountPaid) <= 0) return showErrorToast("يرجى إدخال مبلغ مدفوع صحيح");

        try {
            const formData = new FormData();
            formData.append('courseLevelId', form.courseLevelId);
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
            setIsDialogOpen(false);
            fetchAccessCodes();
        } catch (err) {
            console.error("❌ فشل توليد الكود:", err);
            showErrorToast(err?.response?.data?.message || "فشل توليد الكود");
        }
    };

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
        setSortBy("issuedAt");
        setSortOrder("desc");
        setCurrentPage(1);
    };

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
                <div>
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
            </div >
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
                                <DialogTitle>توليد كود وصول جديد</DialogTitle>
                                <DialogDescription>
                                    أدخل المعلومات المطلوبة لتوليد كود وصول جديد
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
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

                                <div className="space-y-2">
                                    <Label>الكورس *</Label>
                                    <Select
                                        value={form.courseId}
                                        onValueChange={(value) => handleFormChange("courseId", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر الكورس" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map((course) => (
                                                <SelectItem key={course.id} value={course.id.toString()}>
                                                    {course.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>المستوى *</Label>
                                    <Select
                                        value={form.courseLevelId}
                                        onValueChange={(value) => handleFormChange("courseLevelId", value)}
                                        disabled={!form.courseId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={form.courseId ? "اختر المستوى" : "اختر الكورس أولاً"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {levels.map((level) => (
                                                <SelectItem key={level.id} value={level.id.toString()}>
                                                    {level.name}
                                                    {level.priceSAR > 0 && ` - ${level.priceSAR} ل.س`}
                                                    {level.priceUSD > 0 && level.priceSAR === 0 && ` - ${level.priceUSD} $`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    form.courseLevelId && (
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
                                    <Label>ملاحظات</Label>
                                    <Textarea
                                        value={form.notes}
                                        onChange={(e) => handleFormChange("notes", e.target.value)}
                                        rows={2}
                                        placeholder="أدخل أي ملاحظات إضافية..."
                                    />
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

                                <Button onClick={handleGenerateCode} disabled={priceLoading}>
                                    {priceLoading ? "جاري حساب السعر..." : "توليد الكود"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* 🔍 قسم الفلترة */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
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

                <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        عرض {filteredAndSortedCodes.length} من أصل {allCodes.length} كود
                        {(searchTerm || statusFilter !== "all" || userFilter !== "all" || courseFilter !== "all") && ` (مفلتر)`}
                    </div>

                    {(searchTerm || statusFilter !== "all" || userFilter !== "all" || courseFilter !== "all") && (
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                            إعادة تعيين الفلترة
                        </Button>
                    )}
                </div>
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
                                        <TableHead className="table-header">المستوى</TableHead>
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

            {/* 👁️ ديالوج التفاصيل */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(open) => setDetailDialog({ ...detailDialog, isOpen: open })}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل الكود</DialogTitle>
                    </DialogHeader>
                    {renderCodeDetails(detailDialog.item)}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AccessCode;