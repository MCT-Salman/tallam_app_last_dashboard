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
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Eye, Copy, User, Book, Calendar, DollarSign, FileText, Download, ZoomIn, Phone } from "lucide-react";
import { generateAccessCode, getAllAccessCodes, getAccessCodesByUserId, getAccessCodesByCourse } from "@/api/api";
import { getAllUsers } from "@/api/api";
import { getCourses } from "@/api/api";
import { getCourseLevels } from "@/api/api";
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages";
import { BASE_URL } from "@/api/api";
import { imageConfig } from "@/utils/corsConfig";

const AccessCode = () => {
    const [codes, setCodes] = useState([]);
    const [allCodes, setAllCodes] = useState([]);
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        courseLevelId: "",
        userId: "",
        validityInMonths: "6",
        amountPaid: "",
        notes: ""
    });
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" });
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, item: null });

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [userFilter, setUserFilter] = useState("all");
    const [courseFilter, setCourseFilter] = useState("all");
    const [sortBy, setSortBy] = useState("issuedAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // دالة لتنظيف وتكوين مسار الصورة
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/tallaam_logo2.png";
        const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
        const cleanImageUrl = imageUrl.replace(/^\//, "");
        return `${cleanBaseUrl}/${cleanImageUrl}`;
    };

    // جلب جميع المستخدمين (بما فيهم المدراء)
    const fetchUsers = async () => {
        try {
            const res = await getAllUsers();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            setUsers(data);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل المستخدمين");
        }
    };

    // جلب الكورسات
    const fetchCourses = async () => {
        try {
            const res = await getCourses();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            setCourses(data);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل الكورسات");
        }
    };

    // جلب مستويات الكورس المحدد
    const fetchCourseLevels = async (courseId) => {
        if (!courseId) {
            setLevels([]);
            return;
        }

        try {
            const res = await getCourseLevels(courseId);
            let data = [];
            
            if (Array.isArray(res.data?.data)) {
                if (res.data.data.length > 0 && Array.isArray(res.data.data[0])) {
                    data = res.data.data[0];
                } else {
                    data = res.data.data;
                }
            } else if (Array.isArray(res.data?.data?.items)) {
                data = res.data.data.items;
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            }
            
            setLevels(data || []);
        } catch (err) {
            console.error("Error fetching levels:", err);
            showErrorToast("فشل تحميل مستويات الكورس");
            setLevels([]);
        }
    };

    // جلب جميع الأكواد
    const fetchAccessCodes = async () => {
        setLoading(true);
        try {
            const res = await getAllAccessCodes();
            const data = Array.isArray(res.data?.data) ? res.data.data : [];
            console.log("All Access Codes data:", data);
            setAllCodes(data);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل الأكواد");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccessCodes();
        fetchUsers();
        fetchCourses();
    }, []);

    // عند تغيير الكورس المحدد في النموذج
    useEffect(() => {
        if (form.courseId) {
            fetchCourseLevels(form.courseId);
        } else {
            setLevels([]);
        }
    }, [form.courseId]);

    // دالة لتحويل issuedBy ID إلى اسم
    const getIssuedByName = (issuedById) => {
        if (!issuedById) return "غير محدد";
        
        // البحث في قائمة المستخدمين
        const user = users.find(user => user.id === issuedById);
        return user ? user.name : `المستخدم ${issuedById}`;
    };

    // فلترة وترتيب البيانات على جانب العميل
    const filteredAndSortedCodes = useMemo(() => {
        let filtered = [...allCodes];

        // البحث بالكود أو اسم المستخدم
        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.courseLevel?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // فلترة بالحالة
        if (statusFilter !== "all") {
            filtered = filtered.filter(item =>
                statusFilter === "active" ? item.isActive && !item.used : !item.isActive || item.used
            );
        }

        // فلترة بالمستخدم
        if (userFilter !== "all") {
            filtered = filtered.filter(item =>
                item.usedBy?.toString() === userFilter
            );
        }

        // فلترة بالكورس
        if (courseFilter !== "all") {
            filtered = filtered.filter(item =>
                item.courseLevel?.courseId?.toString() === courseFilter
            );
        }

        // الترتيب
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

    // حساب البيانات المعروضة في الصفحة الحالية
    const paginatedCodes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedCodes.slice(startIndex, endIndex);
    }, [filteredAndSortedCodes, currentPage, itemsPerPage]);

    // إعادة تعيين الصفحة عند تغيير الفلتر
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, userFilter, courseFilter, itemsPerPage]);

    // التعامل مع تغييرات النموذج
    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // التعامل مع تغيير صورة الإيصال
    const onReceiptChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // التحقق من حجم الملف (5MB كحد أقصى)
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

    // نسخ الكود للحافظة
    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            showSuccessToast("تم نسخ الكود إلى الحافظة");
        }).catch(() => {
            showErrorToast("فشل نسخ الكود");
        });
    };

    // توليد الكود
    const handleGenerateCode = async () => {
        if (!form.courseLevelId) return showErrorToast("يرجى اختيار مستوى الكورس");
        if (!form.userId) return showErrorToast("يرجى اختيار المستخدم");
        if (!receiptFile) return showErrorToast("يرجى رفع صورة الإيصال");

        try {
            const formData = new FormData();
            formData.append('courseLevelId', form.courseLevelId);
            formData.append('userId', form.userId);
            formData.append('validityInMonths', form.validityInMonths);
            formData.append('amountPaid', form.amountPaid || "0");
            if (form.notes) formData.append('notes', form.notes);
            formData.append('receiptImageUrl', receiptFile);

            await generateAccessCode(formData);
            showSuccessToast("تم توليد الكود بنجاح");

            // إعادة تعيين النموذج
            setForm({
                courseLevelId: "",
                userId: "",
                validityInMonths: "6",
                amountPaid: "",
                notes: ""
            });
            setReceiptFile(null);
            setReceiptPreview(null);
            setIsDialogOpen(false);
            fetchAccessCodes();
        } catch (err) {
            console.error(err.response?.data || err);
            showErrorToast(err?.response?.data?.message || "فشل توليد الكود");
        }
    };

    // حذف الكود
    // const handleDelete = async (id) => {
    //     try {
    //         await deleteAccessCode(id);
    //         fetchAccessCodes();
    //         showSuccessToast("تم الحذف بنجاح");
    //     } catch (err) {
    //         showErrorToast(err?.response?.data?.message || "فشل الحذف");
    //     }
    // };

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد";
        return new Date(dateString).toLocaleDateString('en-US');
    };

    // Pagination calculations
    const totalItems = filteredAndSortedCodes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Handle items per page change
    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    // Handle sort
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setUserFilter("all");
        setCourseFilter("all");
        setSortBy("issuedAt");
        setSortOrder("desc");
        setCurrentPage(1);
    };

  // عرض التفاصيل الكاملة للكود
const renderCodeDetails = (item) => {
    if (!item) return null;

    const transaction = item.transaction?.[0];
    
    // معالجة amountPaid بشكل صحيح
    let amountPaid = "";
    if (transaction?.amountPaid) {
        if (typeof transaction.amountPaid === 'object') {
            // إذا كان كائن، نحاول استخراج القيمة
            amountPaid = transaction.amountPaid.d?.[0] || transaction.amountPaid.value || transaction.amountPaid.s || "";
        } else {
            // إذا كان قيمة بسيطة
            amountPaid = transaction.amountPaid;
        }
    }

    // التأكد أن amountPaid ليس كائن قبل العرض
    const displayAmount = typeof amountPaid === 'object' ? JSON.stringify(amountPaid) : amountPaid;

    return (
        <div className="space-y-6 text-right">
            {/* المعلومات الأساسية */}
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
            {transaction && (
                <div className="border-t pt-4">
                    <h3 className="font-bold text-lg mb-3">المعلومات المالية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayAmount && (
                            <div>
                                <Label className="font-medium">المبلغ المدفوع:</Label>
                                <p className="text-lg font-medium text-green-600 mt-1">
                                    {displayAmount} ل.س
                                </p>
                            </div>
                        )}
                        <div>
                            <Label className="font-medium">الملاحظات:</Label>
                            <p className="mt-1 p-2 bg-gray-50 rounded">{transaction.notes || "لا توجد ملاحظات"}</p>
                        </div>
                    </div>

                    {/* صورة الإيصال - تصميم محسن */}
                    {transaction.receiptImageUrl && (
                        <div className="mt-6">
                            <Label className="font-medium text-lg block mb-3">صورة الإيصال:</Label>
                            <div className="flex flex-col items-center">
                                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 max-w-2xl w-full group">
                                    <img
                                        src={getImageUrl(transaction.receiptImageUrl)}
                                        alt="صورة الإيصال"
                                        className="max-w-full h-auto max-h-96 rounded-md shadow-md mx-auto cursor-zoom-in transition-all duration-300 group-hover:shadow-lg"
                                        {...imageConfig}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/tallaam_logo2.png";
                                        }}
                                        onClick={() => {
                                            // فتح الصورة في نافذة جديدة
                                            window.open(getImageUrl(transaction.receiptImageUrl), '_blank');
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
            )}

            {/* معلومات إضافية */}
            <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">معلومات إضافية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="font-medium">معرف الكود:</Label>
                        <p className="font-mono bg-gray-100 p-2 rounded">{item.id}</p>
                    </div>
                    <div>
                        <Label className="font-medium">تم الإصدار بواسطة:</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium">{getIssuedByName(item.issuedBy)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// مكون البطاقة للعنصر الواحد
const CodeCard = ({ item }) => {
    const transaction = item.transaction?.[0];
    
    // معالجة amountPaid بشكل صحيح
    let amountPaid = "";
    if (transaction?.amountPaid) {
        if (typeof transaction.amountPaid === 'object') {
            // إذا كان كائن، نحاول استخراج القيمة
            amountPaid = transaction.amountPaid.d?.[0] || transaction.amountPaid.value || "";
        } else {
            // إذا كان قيمة بسيطة
            amountPaid = transaction.amountPaid;
        }
    }

    // التأكد أن amountPaid ليس كائن قبل العرض
    const displayAmount = typeof amountPaid === 'object' ? JSON.stringify(amountPaid) : amountPaid;

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
                    {displayAmount && (
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span>{displayAmount} ل.س</span>
                        </div>
                    )}
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
                                        courseLevelId: "",
                                        userId: "",
                                        validityInMonths: "6",
                                        amountPaid: "",
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
                                                    {level.name} (ترتيب: {level.order})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

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
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>المبلغ المدفوع</Label>
                                        <Input
                                            type="number"
                                            value={form.amountPaid}
                                            onChange={(e) => handleFormChange("amountPaid", e.target.value)}
                                            placeholder="0.00"
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

                                <Button onClick={handleGenerateCode}>
                                    توليد الكود
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث بالكود أو المستخدم أو الكورس..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>

                    {/* Status Filter */}
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

                    {/* User Filter */}
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

                    {/* Items Per Page */}
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

                {/* Reset Filters & Results Count */}
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
                        {/* Table View - for medium screens and up */}
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
                                    {paginatedCodes.length > 0 ? paginatedCodes.map(item => (
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
                                                {/* <Button
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
                                                </Button> */}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                                                {allCodes.length === 0 ? "لا توجد أكواد متاحة" : "لم يتم العثور على نتائج"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Card View - for mobile */}
                        <div className="md:hidden space-y-4">
                            {paginatedCodes.length > 0 ? paginatedCodes.map(item => (
                                <CodeCard key={item.id} item={item} />
                            )) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allCodes.length === 0 ? "لا توجد أكواد متاحة" : "لم يتم العثور على نتائج"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
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

            {/* Delete Confirmation Dialog */}
            {/* <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, isOpen: open })}>
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
                            onClick={() => handleDelete(deleteDialog.itemId)}
                        >
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog> */}

            {/* Details Dialog */}
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