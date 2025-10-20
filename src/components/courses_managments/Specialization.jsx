import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Image, Calendar, Shield, Clock, BookOpen } from "lucide-react";
import { getSpecializations, createSpecialization, updateSpecialization, deleteSpecialization, toggleSpecializationStatus, BASE_URL } from "@/api/api";
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages";
import { imageConfig } from "@/utils/corsConfig";

const Specialization = () => {
    const [specializations, setSpecializations] = useState([]);
    const [allSpecializations, setAllSpecializations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: "" });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" });
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, specialization: null });

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
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

    // جلب جميع التخصصات مرة واحدة
    const fetchSpecializations = async () => {
        setLoading(true);
        try {
            const res = await getSpecializations();
            const data = Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            console.log("All Specializations data:", data);
            setAllSpecializations(data);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل التخصصات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecializations();
    }, []);

    // فلترة وترتيب البيانات على جانب العميل
    const filteredAndSortedSpecializations = useMemo(() => {
        let filtered = [...allSpecializations];

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
    }, [allSpecializations, searchTerm, statusFilter, sortBy, sortOrder]);

    // حساب البيانات المعروضة في الصفحة الحالية
    const paginatedSpecializations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedSpecializations.slice(startIndex, endIndex);
    }, [filteredAndSortedSpecializations, currentPage, itemsPerPage]);

    // إعادة تعيين الصفحة عند تغيير الفلتر
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, itemsPerPage]);

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

    // حفظ التخصص (إضافة أو تعديل)
    const handleSave = async () => {
        if (!form.name.trim()) return showErrorToast("يرجى إدخال اسم الاختصاص");

        try {
            let imageToSend = imageFile;
            
            if (editItem && !imageFile) {
                const imageUrl = getImageUrl(editItem.imageUrl);
                imageToSend = await urlToFile(imageUrl, `specialization-${editItem.id}.jpg`);
                
                if (!imageToSend) {
                    return showErrorToast("فشل في تحميل الصورة القديمة");
                }
            }
            
            if (!editItem && !imageFile) {
                return showErrorToast("يرجى اختيار صورة");
            }

            if (editItem) {
                await updateSpecialization(editItem.id, {
                    name: form.name,
                    imageUrl: imageToSend
                });
                showSuccessToast("تم تعديل التخصص بنجاح");
                setEditItem(null);
            } else {
                await createSpecialization(form.name, imageFile);
                showSuccessToast("تم إنشاء التخصص بنجاح");
            }

            setForm({ name: "" });
            setImageFile(null);
            setImagePreview(null);
            setIsDialogOpen(false);
            fetchSpecializations();
        } catch (err) {
            console.error(err.response?.data || err);
            showErrorToast(err?.response?.data?.message || "فشل العملية");
        }
    };

    // تبديل حالة التخصص
    const handleToggleActive = async (id, isActive) => {
        try {
            await toggleSpecializationStatus(id, !isActive);
            showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} الاختصاص بنجاح`);
            fetchSpecializations();
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة");
        }
    };

    // حذف التخصص
    const handleDelete = async (id) => {
        try {
            await deleteSpecialization(id);
            fetchSpecializations();
            showSuccessToast("تم الحذف بنجاح");
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل الحذف");
        }
    };

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد";
        return new Date(dateString).toLocaleDateString('en-US');
    };

    // Pagination calculations
    const totalItems = filteredAndSortedSpecializations.length;
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
        setSortBy("name");
        setSortOrder("asc");
        setCurrentPage(1);
    };

    // مكون عرض الصورة
    const SpecializationImage = ({ specialization, size = "medium", className = "" }) => {
        const [imgError, setImgError] = useState(false);
        const imageUrl = specialization.imageUrl ? getImageUrl(specialization.imageUrl) : null;
        const sizeClass = size === "large" ? "w-32 h-32" : size === "small" ? "w-8 h-8" : "w-16 h-16";
        
        const handleImageError = (e) => {
            console.warn(`Failed to load image: ${imageUrl}`);
            setImgError(true);
            e.target.style.display = 'none';
        };

        return (
            <div className={`${sizeClass} ${className} bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden border`}>
                {imageUrl && !imgError ? (
                    <img 
                        src={imageUrl} 
                        alt={specialization.name}
                        className={`${sizeClass} object-cover`}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                        loading="lazy"
                    />
                ) : (
                    <Image className={size === "large" ? "w-12 h-12 text-gray-500" : "w-6 h-6 text-gray-500"} />
                )}
            </div>
        );
    };

    // عرض التفاصيل الكاملة للتخصص
    const renderSpecializationDetails = (specialization) => {
        if (!specialization) return null;

        return (
            <div className="space-y-6 text-right">
                {/* الهيدر مع الصورة والمعلومات الأساسية */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-gradient-to-l from-gray-50 to-white rounded-lg border">
                    <SpecializationImage specialization={specialization} size="large" className="flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{specialization.name || "بدون اسم"}</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant={specialization.isActive ? "default" : "secondary"} className="text-sm">
                                {specialization.isActive ? "نشط" : "معطل"}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                <BookOpen className="w-3 h-3 ml-1" />
                                تخصص
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* الشبكة الرئيسية للمعلومات */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* المعلومات الأساسية */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                المعلومات الأساسية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">اسم التخصص</span>
                                    <span className="font-medium">{specialization.name}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">حالة التخصص</span>
                                    <Badge variant={specialization.isActive ? "default" : "secondary"}>
                                        {specialization.isActive ? "نشط" : "معطل"}
                                    </Badge>
                                </div>
                                {/* <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">معرف التخصص</span>
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{specialization.id || "غير محدد"}</span>
                                </div> */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* معلومات التوقيت */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                معلومات التوقيت
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">تاريخ الإنشاء</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{formatDate(specialization.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">آخر تحديث</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{formatDate(specialization.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* الإجراءات */}
                <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => handleToggleActive(specialization.id, specialization.isActive)}
                        className="flex items-center gap-2"
                    >
                        {specialization.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {specialization.isActive ? "تعطيل التخصص" : "تفعيل التخصص"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setEditItem(specialization)
                            setForm({
                                name: specialization.name || ""
                            })
                            setImageFile(null);
                            setImagePreview(specialization.imageUrl ? getImageUrl(specialization.imageUrl) : null);
                            setIsDialogOpen(true)
                            setDetailDialog({ isOpen: false, specialization: null })
                        }}
                        className="flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        تعديل التخصص
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            setDeleteDialog({
                                isOpen: true,
                                itemId: specialization.id,
                                itemName: specialization.name || "بدون اسم"
                            })
                            setDetailDialog({ isOpen: false, specialization: null })
                        }}
                        className="flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        حذف التخصص
                    </Button>
                </div>
            </div>
        )
    }

    // مكون البطاقة للعنصر الواحد مع تصميم محسن
    const SpecializationCard = ({ item }) => (
        <Card className="mb-4 overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <SpecializationImage specialization={item} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant={item.isActive ? "default" : "secondary"}>
                                {item.isActive ? "نشط" : "معطل"}
                            </Badge>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setDetailDialog({ isOpen: true, specialization: item })}
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
                            setForm({ name: item.name });
                            setImageFile(null);
                            setImagePreview(item.imageUrl ? getImageUrl(item.imageUrl) : null);
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
                    <CardTitle>إدارة التخصصات</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setEditItem(null);
                                    setForm({ name: "" });
                                    setImageFile(null);
                                    setImagePreview(null);
                                }}
                            >
                                إضافة <Plus className="w-4 h-4 cursor-pointer" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>{editItem ? "تعديل التخصص" : "إضافة تخصص جديد"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label>الاسم *</Label>
                                    <Input value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="spec-image">الصورة *</Label>
                                    <Input id="spec-image" type="file" accept="image/*" onChange={onImageChange} />
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
                                <Button onClick={handleSave}>{editItem ? "حفظ التعديل" : "حفظ"}</Button>
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

                    {/* Sort By */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                            <SelectValue placeholder="ترتيب حسب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">الاسم</SelectItem>
                            <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
                            <SelectItem value="isActive">الحالة</SelectItem>
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
                        عرض {filteredAndSortedSpecializations.length} من أصل {allSpecializations.length} تخصص
                        {(searchTerm || statusFilter !== "all") && ` (مفلتر)`}
                    </div>
                    
                    {(searchTerm || statusFilter !== "all") && (
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
                                    {paginatedSpecializations.length > 0 ? paginatedSpecializations.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="table-cell">
                                                <SpecializationImage specialization={item} size="small" />
                                            </TableCell>
                                            <TableCell className="table-cell">{item.name}</TableCell>
                                            <TableCell className="table-cell">
                                                <Badge variant={item.isActive ? "default" : "secondary"}>
                                                    {item.isActive ? "نشط" : "معطل"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="table-cell text-right space-x-2">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => setDetailDialog({ isOpen: true, specialization: item })}
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
                                                        setForm({ name: item.name });
                                                        setImageFile(null);
                                                        setImagePreview(item.imageUrl ? getImageUrl(item.imageUrl) : null);
                                                        setIsDialogOpen(true);
                                                    }}
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id, itemName: item.name })}
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                                {allSpecializations.length === 0 ? "لا توجد تخصصات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Cards View - for small screens */}
                        <div className="block md:hidden">
                            {paginatedSpecializations.length > 0 ? (
                                paginatedSpecializations.map(item => (
                                    <SpecializationCard key={item.id} item={item} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allSpecializations.length === 0 ? "لا توجد تخصصات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {paginatedSpecializations.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من {totalItems} تخصص
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
                        <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا الاختصاص؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف الاختصاص "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
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

            {/* Specialization Details Dialog */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog(prev => ({ ...prev, isOpen }))}>
                <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-right">تفاصيل التخصص</DialogTitle>
                    </DialogHeader>
                    {renderSpecializationDetails(detailDialog.specialization)}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default Specialization;