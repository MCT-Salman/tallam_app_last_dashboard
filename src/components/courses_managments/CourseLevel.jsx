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
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { getCourseLevels, createCourseLevel, updateCourseLevel, deleteCourseLevel, toggleCourseLevelStatus, BASE_URL } from "@/api/api";
import { getCourses } from "@/api/api";
import { getInstructors } from "@/api/api";
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages";
import { imageConfig } from "@/utils/corsConfig";

const CourseLevel = () => {
    const [levels, setLevels] = useState([]);
    const [allLevels, setAllLevels] = useState([]);
    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        order: "",
        priceUSD: "",
        priceSAR: "",
        isFree: false,
        previewUrl: "",
        downloadUrl: "",
        instructorId: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" });
    const [detailsDialog, setDetailsDialog] = useState({ isOpen: false, item: null });

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [instructorFilter, setInstructorFilter] = useState("all");
    const [freeFilter, setFreeFilter] = useState("all");
    const [sortBy, setSortBy] = useState("order");
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

    // جلب المدرسين
    const fetchInstructors = async () => {
        try {
            const res = await getInstructors();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            setInstructors(data);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل المدرسين");
        }
    };

    // جلب مستويات الكورس المحدد
    const fetchCourseLevels = async (courseId) => {
        if (!courseId) {
            setAllLevels([]);
            return;
        }

        setLoading(true);
        try {
            const res = await getCourseLevels(courseId);
            console.log("Full Course Levels response:", res);

            // استخراج البيانات بناءً على الهيكل الفعلي
            let data = [];
            if (Array.isArray(res.data?.data)) {
                // إذا كان res.data.data مصفوفة
                if (res.data.data.length > 0 && Array.isArray(res.data.data[0])) {
                    // المستويات هي العنصر الأول في المصفوفة
                    data = res.data.data[0];
                } else {
                    data = res.data.data;
                }
            } else if (Array.isArray(res.data?.data?.items)) {
                data = res.data.data.items;
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            }

            console.log("Extracted levels data:", data);
            setAllLevels(data || []);
        } catch (err) {
            console.error("Error fetching course levels:", err);
            showErrorToast("فشل تحميل مستويات الكورس");
            setAllLevels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchInstructors();
    }, []);

    // عند تغيير الكورس المحدد
    useEffect(() => {
        if (selectedCourse) {
            fetchCourseLevels(selectedCourse);
        } else {
            setAllLevels([]);
        }
    }, [selectedCourse]);

    // فلترة وترتيب البيانات على جانب العميل
    const filteredAndSortedLevels = useMemo(() => {
        let filtered = [...allLevels];

        // البحث بالعنوان
        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // فلترة بالحالة
        if (statusFilter !== "all") {
            filtered = filtered.filter(item =>
                statusFilter === "active" ? item.isActive : !item.isActive
            );
        }

        // فلترة بالمدرس
        if (instructorFilter !== "all") {
            filtered = filtered.filter(item =>
                item.instructorId === instructorFilter
            );
        }

        // فلترة بالمستويات المجانية
        if (freeFilter !== "all") {
            filtered = filtered.filter(item =>
                freeFilter === "free" ? item.isFree : !item.isFree
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
                case "order":
                    aValue = parseInt(a.order) || 0;
                    bValue = parseInt(b.order) || 0;
                    break;
                case "priceUSD":
                    aValue = parseFloat(a.priceUSD) || 0;
                    bValue = parseFloat(b.priceUSD) || 0;
                    break;
                case "isActive":
                    aValue = a.isActive;
                    bValue = b.isActive;
                    break;
                default:
                    aValue = parseInt(a.order) || 0;
                    bValue = parseInt(b.order) || 0;
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [allLevels, searchTerm, statusFilter, instructorFilter, freeFilter, sortBy, sortOrder]);

    // حساب البيانات المعروضة في الصفحة الحالية
    const paginatedLevels = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedLevels.slice(startIndex, endIndex);
    }, [filteredAndSortedLevels, currentPage, itemsPerPage]);

    // إعادة تعيين الصفحة عند تغيير الفلتر
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, instructorFilter, freeFilter, itemsPerPage]);

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

    // حفظ المستوى (إضافة أو تعديل)
    const handleSave = async () => {
        if (!form.name.trim()) return showErrorToast("يرجى إدخال عنوان المستوى");
        if (!form.order) return showErrorToast("يرجى إدخال ترتيب المستوى");
        if (!form.instructorId) return showErrorToast("يرجى اختيار المدرب");
        if (!selectedCourse) return showErrorToast("يرجى اختيار الكورس أولاً");
        if (!imageFile && !editItem) return showErrorToast("يرجى اختيار صورة");

        try {
            let imageToSend = imageFile;

            if (editItem && !imageFile) {
                const imageUrl = getImageUrl(editItem.imageUrl);
                imageToSend = await urlToFile(imageUrl, `level-${editItem.id}.jpg`);
            }

            const levelData = {
                name: form.name,
                description: form.description || '',
                order: parseInt(form.order),
                priceUSD: parseFloat(form.priceUSD) || 0,
                priceSAR: parseFloat(form.priceSAR) || 0,
                isFree: Boolean(form.isFree),
                previewUrl: form.previewUrl || '',
                downloadUrl: form.downloadUrl || '',
                instructorId: form.instructorId,
                imageUrl: imageToSend
            };

            if (editItem) {
                await updateCourseLevel(editItem.id, levelData);
                showSuccessToast("تم تعديل المستوى بنجاح");
                setEditItem(null);
            } else {
                await createCourseLevel(selectedCourse, levelData);
                showSuccessToast("تم إنشاء المستوى بنجاح");
            }

            // إعادة تعيين النموذج
            setForm({
                name: "",
                description: "",
                order: "",
                priceUSD: "",
                priceSAR: "",
                isFree: false,
                previewUrl: "",
                downloadUrl: "",
                instructorId: ""
            });
            setImageFile(null);
            setImagePreview(null);
            setIsDialogOpen(false);
            fetchCourseLevels(selectedCourse);
        } catch (err) {
            console.error(err.response?.data || err);
            showErrorToast(err?.response?.data?.message || "فشل العملية");
        }
    };

    // تبديل حالة المستوى - ⭐ التصحيح هنا
    const handleToggleActive = async (id, isActive) => {
        if (!id) {
            showErrorToast("معرف المستوى غير محدد");
            return;
        }

        try {
            await toggleCourseLevelStatus(id, !isActive);
            showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} المستوى بنجاح`);
            fetchCourseLevels(selectedCourse);
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة");
        }
    };

    // حذف المستوى 
    // const handleDelete = async (id) => {
    //     if (!id) {
    //         showErrorToast("معرف المستوى غير محدد");
    //         return;
    //     }

    //     try {
    //         await deleteCourseLevel(id);
    //         fetchCourseLevels(selectedCourse);
    //         showSuccessToast("تم الحذف بنجاح");
    //     } catch (err) {
    //         showErrorToast(err?.response?.data?.message || "فشل الحذف");
    //     }
    // };

    // في CourseLevel.jsx - دالة handleDelete
    const handleDelete = async (id) => {
        if (!id) {
            showErrorToast("معرف المستوى غير محدد");
            return;
        }

        try {
            await deleteCourseLevel(id);
            fetchCourseLevels(selectedCourse);
            showSuccessToast("تم الحذف بنجاح");
        } catch (err) {
            // التحقق من رسالة الخطأ وعرض الرسالة المناسبة
            const errorMessage = err?.response?.data?.message || err?.message || "فشل الحذف";

            if (errorMessage.includes('دروس مرتبطة') || err?.response?.data?.code === 'P2003') {
                showErrorToast("لا يمكن حذف المستوى لأنه يحتوي على دروس مرتبطة. يرجى حذف الدروس أولاً.");
            } else {
                showErrorToast(errorMessage);
            }
        }
    };

    // عرض تفاصيل المستوى
    const handleViewDetails = (item) => {
        setDetailsDialog({ isOpen: true, item });
    };

    // الحصول على اسم المدرب من الـ ID
    const getInstructorName = (instructorId) => {
        const instructor = instructors.find(inst => inst.id === instructorId);
        return instructor ? instructor.name : "غير محدد";
    };

    // دالة جديدة للحصول على اسم الكورس
    const getCourseName = (courseId) => {
        const course = courses.find(crs => crs.id === courseId);
        return course ? course.title : "غير محدد";
    };

    // Pagination calculations
    const totalItems = filteredAndSortedLevels.length;
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
        setInstructorFilter("all");
        setFreeFilter("all");
        setSortBy("order");
        setSortOrder("asc");
        setCurrentPage(1);
    };

    // مكون البطاقة للعنصر الواحد - ⭐ التصحيح هنا
    const LevelCard = ({ item }) => (
        <Card className="mb-4 overflow-hidden" key={item.id}>
            {/* الصورة تأخذ رأس البطاقة كامل */}
            <div className="relative h-48 bg-gray-100">
                <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    {...imageConfig}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/tallaam_logo2.png";
                    }}
                />
                {/* حالة المستوى في الزاوية */}
                <div className="absolute top-3 left-3">
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? "نشط" : "معطل"}
                    </Badge>
                </div>
                {/* مجانية المستوى */}
                <div className="absolute top-3 right-3">
                    <Badge variant={item.isFree ? "default" : "outline"}>
                        {item.isFree ? "مجاني" : `$${item.priceUSD || 0}`}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-4">
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-xl mb-1">{item.name}</h3>
                            <Badge variant="secondary">ترتيب: {item.order || 0}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            المدرب: {getInstructorName(item.instructorId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            الكورس: {getCourseName(item.courseId)}
                        </p>
                    </div>

                    {item.description && (
                        <div>
                            <p className="text-sm line-clamp-3 text-gray-600">
                                {item.description}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="font-medium">السعر USD:</span> ${item.priceUSD || 0}
                        </div>
                        <div>
                            <span className="font-medium">السعر SAR:</span> {item.priceSAR || 0} ل.س
                        </div>
                    </div>
                </div>

                <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(item)}
                        className="flex-1"
                    >
                        <Eye className="w-4 h-4" />
                        <span className="mr-2">تفاصيل</span>
                    </Button>
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
                                description: item.description || "",
                                order: (item.order || "").toString(), // ⭐ التصحيح هنا
                                priceUSD: (item.priceUSD || "0").toString(),
                                priceSAR: (item.priceSAR || "0").toString(),
                                isFree: item.isFree || false,
                                previewUrl: item.previewUrl || "",
                                downloadUrl: item.downloadUrl || "",
                                instructorId: item.instructorId
                            });
                            setImageFile(null);
                            setImagePreview(item.imageUrl ? getImageUrl(item.imageUrl) : null);
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

    // مكون عرض التفاصيل
    const LevelDetails = ({ item }) => (
        <div className="space-y-6">
            {/* الصورة */}
            <div className="flex justify-center">
                <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.name}
                    className="w-64 h-48 object-cover rounded-lg shadow-md"
                    {...imageConfig}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/tallaam_logo2.png";
                    }}
                />
            </div>

            {/* المعلومات الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label className="font-semibold text-base">اسم المستوى:</Label>
                        <p className="text-lg mt-1 font-medium">{item.name}</p>
                    </div>

                    <div>
                        <Label className="font-semibold text-base">الترتيب:</Label>
                        <Badge variant="secondary" className="text-lg mt-1">
                            {item.order || 0}
                        </Badge>
                    </div>

                    <div>
                        <Label className="font-semibold text-base">الوصف:</Label>
                        <p className="text-gray-700 mt-1 leading-relaxed">
                            {item.description || "لا يوجد وصف"}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="font-semibold text-base">الحالة:</Label>
                            <Badge variant={item.isActive ? "default" : "secondary"} className="mt-1">
                                {item.isActive ? "نشط" : "معطل"}
                            </Badge>
                        </div>
                        <div>
                            <Label className="font-semibold text-base">النوع:</Label>
                            <Badge variant={item.isFree ? "default" : "outline"} className="mt-1">
                                {item.isFree ? "مجاني" : "مدفوع"}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="font-semibold text-base">السعر (USD):</Label>
                            <p className="text-lg font-medium text-green-600 mt-1">
                                ${item.priceUSD || 0}
                            </p>
                        </div>
                        <div>
                            <Label className="font-semibold text-base">السعر (SAR):</Label>
                            <p className="text-lg font-medium text-green-600 mt-1">
                                {item.priceSAR || 0} ل.س
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* الروابط */}
            {(item.previewUrl || item.downloadUrl) && (
                <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-3">الروابط</h3>
                    <div className="space-y-2">
                        {item.previewUrl && (
                            <div>
                                <Label className="font-medium">رابط المعاينة:</Label>
                                <a
                                    href={item.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline block mt-1 text-sm break-all"
                                >
                                    {item.previewUrl}
                                </a>
                            </div>
                        )}
                        {item.downloadUrl && (
                            <div>
                                <Label className="font-medium">رابط التحميل:</Label>
                                <a
                                    href={item.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline block mt-1 text-sm break-all"
                                >
                                    {item.downloadUrl}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* معلومات المدرب */}
            {item.instructor && (
                <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-3">معلومات المدرب</h3>
                    <div className="flex items-start gap-4">
                        <img
                            src={getImageUrl(item.instructor.avatarUrl)}
                            alt={item.instructor.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                            <p className="font-semibold text-lg">{item.instructor.name}</p>
                            <p className="text-gray-600 mt-1">{item.instructor.bio}</p>
                            <Badge variant={item.instructor.isActive ? "default" : "secondary"} className="mt-2">
                                {item.instructor.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                        </div>
                    </div>
                </div>
            )}

            {/* معلومات الكورس */}
            {item.course && (
                <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-3">معلومات الكورس</h3>
                    <div className="space-y-2">
                        <p><span className="font-medium">العنوان:</span> {item.course.title}</p>
                        <p><span className="font-medium">الوصف:</span> {item.course.description}</p>
                        {item.course.subject && (
                            <p><span className="font-medium">التخصص:</span> {item.course.subject.name}</p>
                        )}
                    </div>
                </div>
            )}

            {/* التواريخ */}
            <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">التواريخ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="font-medium">تاريخ الإنشاء:</Label>
                        <p className="text-gray-600 mt-1">
                            {new Date(item.createdAt).toLocaleDateString('en-US')}
                        </p>
                    </div>
                    <div>
                        <Label className="font-medium">آخر تحديث:</Label>
                        <p className="text-gray-600 mt-1">
                            {new Date(item.updatedAt).toLocaleDateString('en-US')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    useEffect(() => {
        console.log("Courses:", courses);
        console.log("Instructors:", instructors);
        console.log("Selected Course:", selectedCourse);
        console.log("All Levels:", allLevels);
    }, [courses, instructors, selectedCourse, allLevels]);

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <CardTitle>إدارة مستويات الكورسات</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                disabled={!selectedCourse}
                                onClick={() => {
                                    setEditItem(null);
                                    setForm({
                                        name: "",
                                        description: "",
                                        order: "",
                                        priceUSD: "",
                                        priceSAR: "",
                                        isFree: false,
                                        previewUrl: "",
                                        downloadUrl: "",
                                        instructorId: ""
                                    });
                                    setImageFile(null);
                                    setImagePreview(null);
                                }}
                            >
                                إضافة مستوى <Plus className="w-4 h-4 cursor-pointer" />
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editItem ? "تعديل المستوى" : "إضافة مستوى جديد"}</DialogTitle>
                                <DialogDescription>
                                    {editItem ? "قم بتعديل بيانات المستوى" : "أدخل بيانات المستوى الجديد"}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label>العنوان *</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => handleFormChange("name", e.target.value)}
                                        placeholder="أدخل عنوان المستوى..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>الوصف</Label>
                                    <Textarea
                                        value={form.description}
                                        onChange={(e) => handleFormChange("description", e.target.value)}
                                        rows={3}
                                        placeholder="أدخل وصف المستوى..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>الترتيب *</Label>
                                        <Input
                                            type="number"
                                            value={form.order}
                                            onChange={(e) => handleFormChange("order", e.target.value)}
                                            placeholder="ترتيب المستوى"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>المدرب *</Label>
                                        <Select
                                            value={form.instructorId}
                                            onValueChange={(value) => handleFormChange("instructorId", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر المدرب" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {instructors.map((instructor) => (
                                                    <SelectItem key={instructor.id} value={instructor.id}>
                                                        {instructor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Switch
                                        checked={form.isFree}
                                        onCheckedChange={(checked) => handleFormChange("isFree", checked)}
                                    />
                                    <Label>مستوى مجاني</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>السعر (USD)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={form.priceUSD}
                                            onChange={(e) => handleFormChange("priceUSD", e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>السعر (SAR)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={form.priceSAR}
                                            onChange={(e) => handleFormChange("priceSAR", e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>رابط المعاينة</Label>
                                    <Input
                                        value={form.previewUrl}
                                        onChange={(e) => handleFormChange("previewUrl", e.target.value)}
                                        placeholder="رابط فيديو المعاينة..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>رابط التحميل</Label>
                                    <Input
                                        value={form.downloadUrl}
                                        onChange={(e) => handleFormChange("downloadUrl", e.target.value)}
                                        placeholder="رابط تحميل الملفات..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="level-image">صورة المستوى *</Label>
                                    <Input
                                        id="level-image"
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

                {/* Course Selection */}
                <div className="space-y-2">
                    <Label>اختر الكورس</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الكورس لعرض مستوياته" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filters Section - Only show when a course is selected */}
                {selectedCourse && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث بالعنوان أو الوصف..."
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

                            {/* Instructor Filter */}
                            <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="فلترة بالمدرب" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع المدرسين</SelectItem>
                                    {instructors.map((instructor) => (
                                        <SelectItem key={instructor.id} value={instructor.id}>
                                            {instructor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Free/Paid Filter */}
                            <Select value={freeFilter} onValueChange={setFreeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="فلترة بالنوع" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع المستويات</SelectItem>
                                    <SelectItem value="free">مجاني</SelectItem>
                                    <SelectItem value="paid">مدفوع</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reset Filters & Results Count */}
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                عرض {filteredAndSortedLevels.length} من أصل {allLevels.length} مستوى
                                {(searchTerm || statusFilter !== "all" || instructorFilter !== "all" || freeFilter !== "all") && ` (مفلتر)`}
                            </div>

                            {(searchTerm || statusFilter !== "all" || instructorFilter !== "all" || freeFilter !== "all") && (
                                <Button variant="outline" size="sm" onClick={resetFilters}>
                                    إعادة تعيين الفلترة
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </CardHeader>

            <CardContent>
                {!selectedCourse ? (
                    <div className="text-center py-8 text-muted-foreground">
                        يرجى اختيار كورس لعرض مستوياته
                    </div>
                ) : loading ? (
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
                                                العنوان
                                                {sortBy === "name" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("order")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الترتيب
                                                {sortBy === "order" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header">المدرب</TableHead>
                                        <TableHead className="table-header">السعر</TableHead>
                                        <TableHead className="table-header">الوصف</TableHead>
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
                                    {paginatedLevels.length > 0 ? paginatedLevels.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="table-cell">
                                                <img
                                                    src={getImageUrl(item.imageUrl)}
                                                    alt={item.name}
                                                    className="w-12 h-12 object-contain rounded-md"
                                                    {...imageConfig}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "/tallaam_logo2.png";
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="table-cell font-medium">{item.name}</TableCell>
                                            <TableCell className="table-cell">
                                                <Badge variant="secondary">{item.order || 0}</Badge>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {getInstructorName(item.instructorId)}
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {item.isFree ? (
                                                    <Badge variant="default">مجاني</Badge>
                                                ) : (
                                                    <div>
                                                        <div>${item.priceUSD || 0}</div>
                                                        <div className="text-xs text-muted-foreground">{item.priceSAR || 0} ل.س</div>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="table-cell max-w-xs">
                                                <div className="truncate" title={item.description}>
                                                    {item.description || "لا يوجد وصف"}
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
                                                    onClick={() => handleViewDetails(item)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
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
                                                            description: item.description || "",
                                                            order: (item.order || "").toString(), // ⭐ التصحيح هنا
                                                            priceUSD: (item.priceUSD || "0").toString(),
                                                            priceSAR: (item.priceSAR || "0").toString(),
                                                            isFree: item.isFree || false,
                                                            previewUrl: item.previewUrl || "",
                                                            downloadUrl: item.downloadUrl || "",
                                                            instructorId: item.instructorId
                                                        });
                                                        setImageFile(null);
                                                        setImagePreview(item.imageUrl ? getImageUrl(item.imageUrl) : null);
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
                                            <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                                                {allLevels.length === 0 ? "لا توجد مستويات لهذا الكورس" : "لا توجد نتائج مطابقة للبحث"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Cards View - for small screens */}
                        <div className="block md:hidden">
                            {paginatedLevels.length > 0 ? (
                                paginatedLevels.map(item => (
                                    <LevelCard key={item.id} item={item} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allLevels.length === 0 ? "لا توجد مستويات لهذا الكورس" : "لا توجد نتائج مطابقة للبحث"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {paginatedLevels.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من {totalItems} مستوى
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
                        <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا المستوى؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف المستوى "{deleteDialog.itemName}" بشكل نهائي.
                            {deleteDialog.relatedLessonsCount > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                    ⚠️ <strong>تحذير:</strong> هذا المستوى يحتوي على {deleteDialog.relatedLessonsCount} دروس مرتبطة.
                                    يجب حذف هذه الدروس أولاً قبل حذف المستوى.
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row-reverse gap-2">
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={async () => {
                                await handleDelete(deleteDialog.itemId);
                                setDeleteDialog({ isOpen: false, itemId: null, itemName: "" });
                            }}
                            disabled={deleteDialog.relatedLessonsCount > 0}
                        >
                            حذف
                        </AlertDialogAction>
                        <AlertDialogCancel onClick={() => setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })}>
                            إلغاء
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Details Dialog */}
            <Dialog open={detailsDialog.isOpen} onOpenChange={(isOpen) => setDetailsDialog(prev => ({ ...prev, isOpen }))}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل المستوى</DialogTitle>
                        <DialogDescription>
                            عرض المعلومات الكاملة للمستوى
                        </DialogDescription>
                    </DialogHeader>
                    {detailsDialog.item && <LevelDetails item={detailsDialog.item} />}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default CourseLevel;