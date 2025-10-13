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
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
        if (!imageUrl) return "/tallaam_logo2.png";
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
            setIsDialogOpen(false);
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
                        e.target.src = "/tallaam_logo2.png";
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
                
                <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleToggleActive(item.id, item.isActive)}
                        className="flex-1"
                    >
                        {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span className="mr-2">{item.isActive ? "إيقاف" : "تفعيل"}</span>
                    </Button>
                    <Button
                        size="sm"
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
                        className="flex-1"
                    >
                        <Edit className="w-4 h-4" />
                        <span className="mr-2">تعديل</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id, itemName: item.name })}
                        className="flex-1"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="mr-2">حذف</span>
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

                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>{editItem ? "تعديل المدرب" : "إضافة مدرس جديد"}</DialogTitle>
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
                                        <SelectContent>
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
                                                    e.target.src = "/tallaam_logo2.png";
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
                <div className="flex justify-between items-center">
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
                                                <img
                                                    src={getImageUrl(item.avatarUrl)}
                                                    alt={item.name}
                                                    className="w-12 h-12 object-contain rounded-md"
                                                    {...imageConfig}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "/tallaam_logo2.png";
                                                    }}
                                                />
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
                                                    onClick={() => handleToggleActive(item.id, item.isActive)}
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
        </Card>
    );
};

export default Instructor;