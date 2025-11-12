import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, User, Calendar, MapPin, Shield, Clock, BookOpen } from "lucide-react";
import { getInstructors, createInstructor, updateInstructor, deleteInstructor, toggleInstructorStatus, BASE_URL } from "@/api/api";
import { getSpecializations } from "@/api/api";
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages";
import { imageConfig } from "@/utils/corsConfig";

const Instructor = () => {
    const [instructors, setInstructors] = useState([]);
    const [allInstructors, setAllInstructors] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        bio: "",
        specializationId: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" });
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, instructor: null });

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [specializationFilter, setSpecializationFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    // دالة لتنظيف وتكوين مسار الصورة
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/default-avatar.png";

        // إذا كان الرابط يحتوي على النطاق الأساسي بالفعل
        if (imageUrl.includes('http')) {
            return imageUrl;
        }

        const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
        const cleanImageUrl = imageUrl.replace(/^\//, "");
        return `${cleanBaseUrl}/${cleanImageUrl}`;
    };

    // دالة مساعدة لتحويل رابط الصورة إلى File object
    const urlToFile = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
        } catch (error) {
            console.error('Error converting URL to file:', error);
            return null;
        }
    };

    // جلب جميع المدرسين مرة واحدة
    const fetchInstructors = async () => {
        setLoading(true);
        try {
            const res = await getInstructors();
            const data = Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            console.log("All Instructors data:", data);
            setAllInstructors(data);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل المدرسين");
        } finally {
            setLoading(false);
        }
    };

    // جلب التخصصات
    const fetchSpecializations = async () => {
        try {
            const res = await getSpecializations();
            const data = Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            setSpecializations(data);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل التخصصات");
        }
    };

    useEffect(() => {
        fetchInstructors();
        fetchSpecializations();
    }, []);

    // فلترة وترتيب البيانات على جانب العميل
    const filteredAndSortedInstructors = useMemo(() => {
        let filtered = [...allInstructors];

        // البحث بالاسم
        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // فلترة بالحالة
        if (statusFilter !== "all") {
            filtered = filtered.filter(item =>
                statusFilter === "active" ? item.isActive : !item.isActive
            );
        }

        // فلترة بالتخصص
        if (specializationFilter !== "all") {
            filtered = filtered.filter(item =>
                item.specializationId === specializationFilter
            );
        }

        // الترتيب
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case "name":
                    aValue = a.name?.toLowerCase() || "";
                    bValue = b.name?.toLowerCase() || "";
                    break;
                case "createdAt":
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case "isActive":
                    aValue = a.isActive;
                    bValue = b.isActive;
                    break;
                default:
                    aValue = a.name?.toLowerCase() || "";
                    bValue = b.name?.toLowerCase() || "";
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [allInstructors, searchTerm, statusFilter, specializationFilter, sortBy, sortOrder]);

    // حساب البيانات المعروضة في الصفحة الحالية
    const paginatedInstructors = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedInstructors.slice(startIndex, endIndex);
    }, [filteredAndSortedInstructors, currentPage, itemsPerPage]);

    // إعادة تعيين الصفحة عند تغيير الفلتر
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, specializationFilter, itemsPerPage]);

    // التعامل مع تغييرات النموذج
    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // التعامل مع تغيير الصورة
    const onImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    // حفظ المدرب (إضافة أو تعديل)
    const handleSave = async () => {
        if (!form.name.trim()) return showErrorToast("يرجى إدخال اسم المدرب");
        if (!form.specializationId) return showErrorToast("يرجى اختيار التخصص");

        try {
            let imageToSend = imageFile;

            if (editItem && !imageFile) {
                const imageUrl = getImageUrl(editItem.avatarUrl);
                imageToSend = await urlToFile(imageUrl, `instructor-${editItem.id}.jpg`);

                if (!imageToSend) {
                    return showErrorToast("فشل في تحميل الصورة القديمة");
                }
            }

            if (!editItem && !imageFile) {
                return showErrorToast("يرجى اختيار صورة");
            }

            if (editItem) {
                await updateInstructor(editItem.id, {
                    name: form.name,
                    bio: form.bio,
                    specializationId: form.specializationId,
                    avatarUrl: imageToSend
                });
                showSuccessToast("تم تعديل المدرب بنجاح");
                setEditItem(null);
            } else {
                await createInstructor({
                    name: form.name,
                    bio: form.bio,
                    specializationId: form.specializationId,
                    avatarUrl: imageFile
                });
                showSuccessToast("تم إنشاء المدرب بنجاح");
            }

            setForm({ name: "", bio: "", specializationId: "" });
            setImageFile(null);
            setImagePreview(null);
            // setIsDialogOpen(false);
            fetchInstructors();
        } catch (err) {
            console.error(err.response?.data || err);
            showErrorToast(err?.response?.data?.message || "فشل العملية");
        }
    };

    // تبديل حالة المدرب
    const handleToggleActive = async (id, isActive) => {
        try {
            await toggleInstructorStatus(id, !isActive);
            showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} المدرب بنجاح`);
            fetchInstructors();
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة");
        }
    };

    // حذف المدرب
    const handleDelete = async (id) => {
        try {
            await deleteInstructor(id);
            fetchInstructors();
            showSuccessToast("تم الحذف بنجاح");
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل الحذف");
        }
    };

    // الحصول على اسم التخصص من الـ ID
    const getSpecializationName = (specializationId) => {
        const specialization = specializations.find(spec => spec.id === specializationId);
        return specialization ? specialization.name : "غير محدد";
    };

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد";
        return new Date(dateString).toLocaleDateString('en-US');
    };

    // Pagination calculations
    const totalItems = filteredAndSortedInstructors.length;
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
        setSpecializationFilter("all");
        setSortBy("name");
        setSortOrder("asc");
        setCurrentPage(1);
    };

    // مكون عرض الصورة
    const InstructorAvatar = ({ instructor, size = "medium", className = "" }) => {
        const [imgError, setImgError] = useState(false);
        const imageUrl = instructor.avatarUrl ? getImageUrl(instructor.avatarUrl) : null;
        const sizeClass = size === "large" ? "w-24 h-24" : size === "small" ? "w-8 h-8" : "w-12 h-12";

        const handleImageError = (e) => {
            console.warn(`Failed to load image: ${imageUrl}`);
            setImgError(true);
            e.target.style.display = 'none';
        };

        return (
            <div className={`${sizeClass} ${className} bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border`}>
                {imageUrl && !imgError ? (
                    <img
                        src={imageUrl}
                        alt={instructor.name}
                        className={`${sizeClass} rounded-full object-cover`}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                        loading="lazy"
                    />
                ) : (
                    <User className={size === "large" ? "w-12 h-12 text-gray-500" : "w-5 h-5 text-gray-500"} />
                )}
            </div>
        );
    };

    // عرض التفاصيل الكاملة للمدرب
    const renderInstructorDetails = (instructor) => {
        if (!instructor) return null;

        return (
            <div className="space-y-6 text-right">
                {/* الهيدر مع الصورة والمعلومات الأساسية */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-l from-gray-50 to-white rounded-lg border">
                    <InstructorAvatar instructor={instructor} size="large" className="flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{instructor.name || "بدون اسم"}</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant={instructor.isActive ? "default" : "secondary"} className="text-sm">
                                {instructor.isActive ? "نشط" : "معطل"}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                <BookOpen className="w-3 h-3 ml-1" />
                                {getSpecializationName(instructor.specializationId)}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* الشبكة الرئيسية للمعلومات */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* المعلومات الشخصية */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5" />
                                المعلومات الشخصية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">التخصص</span>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{getSpecializationName(instructor.specializationId)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">حالة الحساب</span>
                                    <Badge variant={instructor.isActive ? "default" : "secondary"}>
                                        {instructor.isActive ? "نشط" : "معطل"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* معلومات الحساب */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                معلومات الحساب
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">تاريخ الإنشاء</span>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{formatDate(instructor.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">آخر تحديث</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{formatDate(instructor.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* السيرة الذاتية */}
                {instructor.bio && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                السيرة الذاتية
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {instructor.bio}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* الإجراءات */}
                {/* <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => handleToggleActive(instructor.id, instructor.isActive)}
                        className="flex items-center gap-2"
                    >
                        {instructor.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {instructor.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setEditItem(instructor)
                            setForm({
                                name: instructor.name || "",
                                bio: instructor.bio || "",
                                specializationId: instructor.specializationId || ""
                            })
                            setImageFile(null);
                            setImagePreview(instructor.avatarUrl ? getImageUrl(instructor.avatarUrl) : null);
                            setIsDialogOpen(true)
                            setDetailDialog({ isOpen: false, instructor: null })
                        }}
                        className="flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        تعديل المدرب
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            setDeleteDialog({
                                isOpen: true,
                                itemId: instructor.id,
                                itemName: instructor.name || "بدون اسم"
                            })
                            setDetailDialog({ isOpen: false, instructor: null })
                        }}
                        className="flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        حذف المدرب
                    </Button>
                </div> */}
            </div>
        )
    }

    // مكون البطاقة للعنصر الواحد مع تصميم محسن للصورة
    const InstructorCard = ({ item }) => (
        <Card className="mb-4 overflow-hidden">
            {/* الصورة تأخذ رأس البطاقة كامل */}
            <div className="relative h-48 bg-gray-100">
                <img
                    src={getImageUrl(item.avatarUrl)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    {...imageConfig}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default-avatar.png";
                    }}
                />
                {/* حالة المدرب في الزاوية */}
                <div className="absolute top-3 left-3">
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? "نشط" : "معطل"}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-4">
                <div className="space-y-3">
                    <div>
                        <h3 className="font-bold text-xl">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {getSpecializationName(item.specializationId)}
                        </p>
                    </div>

                    {item.bio && (
                        <div>
                            <p className="text-sm line-clamp-3">{item.bio}</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailDialog({ isOpen: true, instructor: item })}
                        className="text-xs"
                    >
                        <Eye className="w-3 h-3 ml-1" />
                        التفاصيل
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(item.id, item.isActive)}
                        className="text-xs"
                    >
                        {item.isActive ? <Pause className="w-3 h-3 ml-1" /> : <Play className="w-3 h-3 ml-1" />}
                        <span className="mr-1">{item.isActive ? "إيقاف" : "تفعيل"}</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setEditItem(item);
                            setForm({
                                name: item.name,
                                bio: item.bio || "",
                                specializationId: item.specializationId
                            });
                            setImageFile(null);
                            setImagePreview(item.avatarUrl ? getImageUrl(item.avatarUrl) : null);
                            setIsDialogOpen(true);
                        }}
                        className="text-xs"
                    >
                        <Edit className="w-3 h-3 ml-1" />
                        <span className="mr-1">تعديل</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id, itemName: item.name })}
                        className="text-xs"
                    >
                        <Trash2 className="w-3 h-3 ml-1" />
                        <span className="mr-1">حذف</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <CardTitle>إدارة المدرسين</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setEditItem(null);
                                    setForm({ name: "", bio: "", specializationId: "" });
                                    setImageFile(null);
                                    setImagePreview(null);
                                }}
                            >
                                إضافة مدرس <Plus className="w-4 h-4 cursor-pointer" />
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-md"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                        >
                            <DialogHeader>
                                <DialogTitle className="text-right">{editItem ? "تعديل المدرب" : "إضافة مدرس جديد"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label>الاسم *</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => handleFormChange("name", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>التخصص *</Label>
                                    <Select
                                        value={form.specializationId}
                                        onValueChange={(value) => handleFormChange("specializationId", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر التخصص" />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            {specializations.map((spec) => (
                                                <SelectItem key={spec.id} value={spec.id}>
                                                    {spec.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>السيرة الذاتية</Label>
                                    <Textarea
                                        value={form.bio}
                                        onChange={(e) => handleFormChange("bio", e.target.value)}
                                        rows={3}
                                        placeholder="أدخل السيرة الذاتية للمدرب..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="instructor-image">الصورة *</Label>
                                    <div className="flex-1">
                                        <p className="text-xl font-mono font-bold bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg border border-blue-100 text-blue-700 text-center">
                                            أبعاد الصورة  133w - 180h
                                        </p>
                                    </div>
                                    <Input
                                        id="instructor-image"
                                        type="file"
                                        accept="image/*"
                                        onChange={onImageChange}
                                    />
                                    {imagePreview && (
                                        <div className="mt-2">
                                            <img
                                                src={imagePreview}
                                                alt="معاينة"
                                                className="max-h-40 rounded-md border"
                                                {...imageConfig}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "/default-avatar.png";
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <Button onClick={handleSave}>
                                    {editItem ? "حفظ التعديل" : "حفظ"}
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
                            placeholder="بحث بالاسم..."
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
                            <SelectItem value="inactive">معطل</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Specialization Filter */}
                    <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="فلترة بالتخصص" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع التخصصات</SelectItem>
                            {specializations.map((spec) => (
                                <SelectItem key={spec.id} value={spec.id}>
                                    {spec.name}
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                        عرض {filteredAndSortedInstructors.length} من أصل {allInstructors.length} مدرس
                        {(searchTerm || statusFilter !== "all" || specializationFilter !== "all") && ` (مفلتر)`}
                    </div>

                    {(searchTerm || statusFilter !== "all" || specializationFilter !== "all") && (
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
                                        <TableHead className="table-header">الصورة</TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("name")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الاسم
                                                {sortBy === "name" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header">التخصص</TableHead>
                                        <TableHead className="table-header">السيرة الذاتية</TableHead>
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
                                    {paginatedInstructors.length > 0 ? paginatedInstructors.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="table-cell">
                                                <InstructorAvatar instructor={item} size="small" />
                                            </TableCell>
                                            <TableCell className="table-cell">{item.name}</TableCell>
                                            <TableCell className="table-cell">
                                                {getSpecializationName(item.specializationId)}
                                            </TableCell>
                                            <TableCell className="table-cell max-w-xs">
                                                <div className="truncate" title={item.bio}>
                                                    {item.bio || "لا يوجد"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <Badge variant={item.isActive ? "default" : "secondary"}>
                                                    {item.isActive ? "نشط" : "معطل"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="table-cell text-right space-x-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setDetailDialog({ isOpen: true, instructor: item })}
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleToggleActive(item.id, item.isActive)}
                                                    title={item.isActive ? "تعطيل" : "تفعيل"}
                                                >
                                                    {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditItem(item);
                                                        setForm({
                                                            name: item.name,
                                                            bio: item.bio || "",
                                                            specializationId: item.specializationId
                                                        });
                                                        setImageFile(null);
                                                        setImagePreview(item.avatarUrl ? getImageUrl(item.avatarUrl) : null);
                                                        setIsDialogOpen(true);
                                                    }}
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() => setDeleteDialog({
                                                        isOpen: true,
                                                        itemId: item.id,
                                                        itemName: item.name
                                                    })}
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                {allInstructors.length === 0 ? "لا توجد مدرسين متاحين" : "لا توجد نتائج مطابقة للبحث"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Cards View - for small screens */}
                        <div className="block md:hidden">
                            {paginatedInstructors.length > 0 ? (
                                paginatedInstructors.map(item => (
                                    <InstructorCard key={item.id} item={item} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allInstructors.length === 0 ? "لا توجد مدرسين متاحين" : "لا توجد نتائج مطابقة للبحث"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {paginatedInstructors.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من {totalItems} مدرس
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNumber;
                                            if (totalPages <= 5) {
                                                pageNumber = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNumber = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumber = totalPages - 4 + i;
                                            } else {
                                                pageNumber = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNumber}
                                                    variant={currentPage === pageNumber ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {pageNumber}
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
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialog.isOpen}
                onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
            >
                <AlertDialogContent className="text-right" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا المدرب؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف المدرب "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row-reverse gap-2">
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={async () => {
                                await handleDelete(deleteDialog.itemId);
                                setDeleteDialog({ isOpen: false, itemId: null, itemName: "" });
                            }}
                        >
                            حذف
                        </AlertDialogAction>
                        <AlertDialogCancel onClick={() => setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })}>
                            إلغاء
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Instructor Details Dialog */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog(prev => ({ ...prev, isOpen }))}>
                <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-right">تفاصيل المدرب</DialogTitle>
                    </DialogHeader>
                    {renderInstructorDetails(detailDialog.instructor)}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default Instructor;