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
import { Plus, Edit, BookOpen, Shield, FileText, Map, Link, Calendar, Clock , Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, ChevronRightIcon, Loader2 } from "lucide-react";
import { getCourseLevels, createCourseLevel, updateCourseLevel, deleteCourseLevel, toggleCourseLevelStatus, BASE_URL } from "@/api/api";
import { getCourses } from "@/api/api";
import { getInstructors } from "@/api/api";
import { getSpecializations } from "@/api/api";
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages";
import { imageConfig } from "@/utils/corsConfig";

const CourseLevel = () => {
    const [levels, setLevels] = useState([]);
    const [allLevels, setAllLevels] = useState([]);
    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [selectedSpecialization, setSelectedSpecialization] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        // name: "",
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search states for selects
    const [specializationSearch, setSpecializationSearch] = useState("");
    const [courseSearch, setCourseSearch] = useState("");
    const [instructorSearch, setInstructorSearch] = useState("");
    const [instructorFilterSearch, setInstructorFilterSearch] = useState("");
    const [statusFilterSearch, setStatusFilterSearch] = useState("");
    const [freeFilterSearch, setFreeFilterSearch] = useState("");

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [instructorFilter, setInstructorFilter] = useState("all");
    const [freeFilter, setFreeFilter] = useState("all");
    const [sortBy, setSortBy] = useState("order");
    const [sortOrder, setSortOrder] = useState("asc");


    const [linkValidation, setLinkValidation] = useState({
        previewUrl: { isValid: true, message: "" }
    });

    // دالة للتحقق من صحة الرابط
const validateUrl = (url) => {
    if (!url) return { isValid: true, message: "" };
    
    try {
        // التحقق من أن الرابط يحتوي على بروتوكول
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return { 
                isValid: false, 
                message: "يجب أن يبدأ الرابط بـ http:// أو https://" 
            };
        }
        
        new URL(url);
        return { isValid: true, message: "الرابط صحيح" };
    } catch (error) {
        return { 
            isValid: false, 
            message: "صيغة الرابط غير صحيحة" 
        };
    }
};

// دالة للتعامل مع تغيير رابط المعاينة
const handlePreviewUrlChange = (value) => {
    handleFormChange("previewUrl", value);
    const validation = validateUrl(value);
    setLinkValidation(prev => ({ 
        ...prev, 
        previewUrl: validation 
    }));
};

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
        fetchSpecializations();
        fetchCourses();
        fetchInstructors();
    }, []);

    // عند تغيير التخصص المحدد
    useEffect(() => {
        if (selectedSpecialization) {
            setSelectedCourse("");
            setAllLevels([]);
        }
    }, [selectedSpecialization]);

    // عند تغيير الكورس المحدد
    useEffect(() => {
        if (selectedCourse) {
            fetchCourseLevels(selectedCourse);
        } else {
            setAllLevels([]);
        }
    }, [selectedCourse]);

    // الحصول على الكورسات المصفاة حسب التخصص
    const filteredCourses = useMemo(() => {
        if (!selectedSpecialization) return [];
        return courses.filter(course => course.specializationId === selectedSpecialization);
    }, [courses, selectedSpecialization]);

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
        // if (!form.name.trim()) return showErrorToast("يرجى إدخال عنوان المستوى");
        if (!form.order) return showErrorToast("يرجى إدخال ترتيب المستوى");
        if (!form.instructorId) return showErrorToast("يرجى اختيار المدرب");
        if (!selectedCourse) return showErrorToast("يرجى اختيار الكورس أولاً");
        if (!imageFile && !editItem) return showErrorToast("يرجى اختيار صورة");

        setIsSubmitting(true);
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
        } finally {
            setIsSubmitting(false);
        }
    };

    // تبديل حالة المستوى
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

    // الحصول على اسم الكورس
    const getCourseName = (courseId) => {
        const course = courses.find(crs => crs.id === courseId);
        return course ? course.title : "غير محدد";
    };

    // الحصول على اسم التخصص
    const getSpecializationName = (specializationId) => {
        const specialization = specializations.find(spec => spec.id === specializationId);
        return specialization ? specialization.name : "غير محدد";
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

    // Reset all selections
    const resetAllSelections = () => {
        setSelectedSpecialization("");
        setSelectedCourse("");
        setAllLevels([]);
        setSearchTerm("");
        setStatusFilter("all");
        setInstructorFilter("all");
        setFreeFilter("all");
        setCurrentPage(1);
    };

    // Filtered data for selects with search
    const filteredSpecializations = useMemo(() => {
        if (!specializationSearch) return specializations;
        return specializations.filter(spec =>
            spec.name?.toLowerCase().includes(specializationSearch.toLowerCase())
        );
    }, [specializations, specializationSearch]);

    const filteredCoursesForSelect = useMemo(() => {
        if (!courseSearch) return filteredCourses;
        return filteredCourses.filter(course =>
            course.title?.toLowerCase().includes(courseSearch.toLowerCase())
        );
    }, [filteredCourses, courseSearch]);

    const filteredInstructors = useMemo(() => {
        if (!instructorSearch) return instructors;
        return instructors.filter(instructor =>
            instructor.name?.toLowerCase().includes(instructorSearch.toLowerCase())
        );
    }, [instructors, instructorSearch]);

    const filteredInstructorsForFilter = useMemo(() => {
        if (!instructorFilterSearch) return instructors;
        return instructors.filter(instructor =>
            instructor.name?.toLowerCase().includes(instructorFilterSearch.toLowerCase())
        );
    }, [instructors, instructorFilterSearch]);

    // مكون البطاقة للعنصر الواحد
    const LevelCard = ({ item }) => (
        <Card className="mb-4 overflow-hidden" key={item.id} dir="rtl">
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
                                order: (item.order || "").toString(),
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
    // const LevelDetails = ({ item }) => (
    //     <div className="space-y-6" dir="rtl">
    //         {/* الصورة */}
    //         <div className="flex justify-center">
    //             <img
    //                 src={getImageUrl(item.imageUrl)}
    //                 alt={item.name}
    //                 className="w-64 h-48 object-cover rounded-lg shadow-md"
    //                 {...imageConfig}
    //                 onError={(e) => {
    //                     e.target.onerror = null;
    //                     e.target.src = "/tallaam_logo2.png";
    //                 }}
    //             />
    //         </div>

    //         {/* المعلومات الأساسية */}
    //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    //             <div className="space-y-4">
    //                 <div>
    //                     <Label className="font-semibold text-base">اسم المستوى:</Label>
    //                     <p className="text-lg mt-1 font-medium">{item.name}</p>
    //                 </div>

    //                 <div>
    //                     <Label className="font-semibold text-base">الترتيب:</Label>
    //                     <Badge variant="secondary" className="text-lg mt-1">
    //                         {item.order || 0}
    //                     </Badge>
    //                 </div>

    //                 <div>
    //                     <Label className="font-semibold text-base">الوصف:</Label>
    //                     <p className="text-gray-700 mt-1 leading-relaxed">
    //                         {item.description || "لا يوجد وصف"}
    //                     </p>
    //                 </div>
    //             </div>

    //             <div className="space-y-4">
    //                 <div className="grid grid-cols-2 gap-4">
    //                     <div>
    //                         <Label className="font-semibold text-base">الحالة:</Label>
    //                         <Badge variant={item.isActive ? "default" : "secondary"} className="mt-1">
    //                             {item.isActive ? "نشط" : "معطل"}
    //                         </Badge>
    //                     </div>
    //                     <div>
    //                         <Label className="font-semibold text-base">النوع:</Label>
    //                         <Badge variant={item.isFree ? "default" : "outline"} className="mt-1">
    //                             {item.isFree ? "مجاني" : "مدفوع"}
    //                         </Badge>
    //                     </div>
    //                 </div>

    //                 <div className="grid grid-cols-2 gap-4">
    //                     <div>
    //                         <Label className="font-semibold text-base">السعر (USD):</Label>
    //                         <p className="text-lg font-medium text-green-600 mt-1">
    //                             ${item.priceUSD || 0}
    //                         </p>
    //                     </div>
    //                     <div>
    //                         <Label className="font-semibold text-base">السعر (SAR):</Label>
    //                         <p className="text-lg font-medium text-green-600 mt-1">
    //                             {item.priceSAR || 0} ل.س
    //                         </p>
    //                     </div>
    //                 </div>

    //                 <div>
    //                     <Label className="font-semibold text-base">المدرب:</Label>
    //                     <p className="text-gray-700 mt-1">{getInstructorName(item.instructorId)}</p>
    //                 </div>
    //             </div>
    //         </div>

    //         {/* معلومات المسار */}
    //         <div className="border-t pt-4">
    //             <h3 className="font-semibold text-lg mb-3">معلومات المسار</h3>
    //             <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
    //                 <span className="font-medium">التخصص:</span>
    //                 <span>{getSpecializationName(selectedSpecialization)}</span>
    //                 <ChevronRightIcon className="h-4 w-4" />
    //                 <span className="font-medium">الكورس:</span>
    //                 <span>{getCourseName(selectedCourse)}</span>
    //             </div>
    //         </div>

    //         {/* الروابط */}
    //         {(item.previewUrl) && (
    //             <div className="border-t pt-4">
    //                 <h3 className="font-semibold text-lg mb-3">الروابط</h3>
    //                 <div className="space-y-2">
    //                     {item.previewUrl && (
    //                         <div>
    //                             <Label className="font-medium">رابط المعاينة:</Label>
    //                             <a
    //                                 href={item.previewUrl}
    //                                 target="_blank"
    //                                 rel="noopener noreferrer"
    //                                 className="text-blue-600 hover:underline block mt-1 text-sm break-all"
    //                             >
    //                                 {item.previewUrl}
    //                             </a>
    //                         </div>
    //                     )}
    //                     {/* {item.downloadUrl && (
    //                         <div>
    //                             <Label className="font-medium">رابط التحميل:</Label>
    //                             <a
    //                                 href={item.downloadUrl}
    //                                 target="_blank"
    //                                 rel="noopener noreferrer"
    //                                 className="text-blue-600 hover:underline block mt-1 text-sm break-all"
    //                             >
    //                                 {item.downloadUrl}
    //                             </a>
    //                         </div>
    //                     )} */}
    //                 </div>
    //             </div>
    //         )}

    //         {/* التواريخ */}
    //         <div className="border-t pt-4">
    //             <h3 className="font-semibold text-lg mb-3">التواريخ</h3>
    //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //                 <div>
    //                     <Label className="font-medium">تاريخ الإنشاء:</Label>
    //                     <p className="text-gray-600 mt-1">
    //                         {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US') : "غير محدد"}
    //                     </p>
    //                 </div>
    //                 <div>
    //                     <Label className="font-medium">آخر تحديث:</Label>
    //                     <p className="text-gray-600 mt-1">
    //                         {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US') : "غير محدد"}
    //                     </p>
    //                 </div>
    //             </div>
    //         </div>
    //     </div>
    // );


    // مكون عرض التفاصيل الكاملة للمستوى
const LevelDetails = ({ item }) => {
    if (!item) return null;

    return (
        <div className="space-y-6 text-right">
            {/* الهيدر مع الصورة والمعلومات الأساسية */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-gradient-to-l from-gray-50 to-white rounded-lg border">
                <div className="flex-shrink-0">
                    <img
                        src={getImageUrl(item.imageUrl)}
                        alt={item.name}
                        className="w-32 h-32 object-cover rounded-lg shadow-md"
                        {...imageConfig}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/tallaam_logo2.png";
                        }}
                    />
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.name || "بدون اسم"}</h3>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant={item.isActive ? "default" : "secondary"} className="text-sm">
                            {item.isActive ? "نشط" : "معطل"}
                        </Badge>
                        <Badge variant={item.isFree ? "default" : "outline"} className="text-sm">
                            {item.isFree ? "مجاني" : "مدفوع"}
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                            ترتيب: {item.order || 0}
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
                                <span className="text-sm font-medium text-gray-600">اسم المستوى</span>
                                <span className="font-medium">{item.name}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">ترتيب المستوى</span>
                                <span className="font-medium">{item.order || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">حالة المستوى</span>
                                <Badge variant={item.isActive ? "default" : "secondary"}>
                                    {item.isActive ? "نشط" : "معطل"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">نوع المستوى</span>
                                <Badge variant={item.isFree ? "default" : "outline"}>
                                    {item.isFree ? "مجاني" : "مدفوع"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* المعلومات المالية والمدرب */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            المعلومات المالية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">السعر (USD)</span>
                                <span className="font-medium text-green-600">${item.priceUSD || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">السعر (SAR)</span>
                                <span className="font-medium text-green-600">{item.priceSAR || 0} ل.س</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">المدرب</span>
                                <span className="font-medium">{getInstructorName(item.instructorId)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* الوصف */}
            {item.description && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            الوصف
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-lg">
                            {item.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* معلومات المسار */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Map className="w-5 h-5" />
                        معلومات المسار
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">التخصص:</span>
                        <span>{getSpecializationName(selectedSpecialization)}</span>
                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">الكورس:</span>
                        <span>{getCourseName(selectedCourse)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* الروابط */}
            {item.previewUrl && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Link className="w-5 h-5" />
                            الروابط
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">رابط المعاينة</span>
                                <a
                                    href={item.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm break-all"
                                >
                                    {item.previewUrl.length > 40 ? 
                                        `${item.previewUrl.substring(0, 40)}...` : 
                                        item.previewUrl
                                    }
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                <span className="font-medium">
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US') : "غير محدد"}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">آخر تحديث</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">
                                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US') : "غير محدد"}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* الإجراءات */}
            <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
                <Button
                    variant="outline"
                    onClick={() => {
                        handleToggleActive(item.id, item.isActive);
                        setDetailsDialog({ isOpen: false, item: null });
                    }}
                    className="flex items-center gap-2"
                >
                    {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {item.isActive ? "تعطيل المستوى" : "تفعيل المستوى"}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        setEditItem(item);
                        setForm({
                            name: item.name,
                            description: item.description || "",
                            order: (item.order || "").toString(),
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
                        setDetailsDialog({ isOpen: false, item: null });
                    }}
                    className="flex items-center gap-2"
                >
                    <Edit className="w-4 h-4" />
                    تعديل المستوى
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => {
                        setDeleteDialog({
                            isOpen: true,
                            itemId: item.id,
                            itemName: item.name || "بدون اسم"
                        });
                        setDetailsDialog({ isOpen: false, item: null });
                    }}
                    className="flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    حذف المستوى
                </Button>
            </div>
        </div>
    );
};


    return (
        <Card dir="rtl">
            <CardHeader className="flex flex-col gap-4" dir="rtl">
                <CardTitle>إدارة مستويات الكورسات</CardTitle>

                {/* Course Selection Path */}
                <div className="space-y-4" dir="rtl">
                    {/* مسار الاختيار */}
                    {(selectedSpecialization || selectedCourse) && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span>المسار المختار:</span>
                                <Badge variant="outline" className="bg-white">
                                    {selectedSpecialization ? getSpecializationName(selectedSpecialization) : "---"}
                                </Badge>
                                <ChevronRightIcon className="h-4 w-4 text-blue-500" />
                                <Badge variant="outline" className="bg-white">
                                    {selectedCourse ? getCourseName(selectedCourse) : "---"}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetAllSelections}
                                    className="mr-auto text-red-500 hover:text-red-700"
                                >
                                    إعادة تعيين
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
                        {/* اختيار التخصص أولاً */}
                        <div className="space-y-2" dir="rtl">
                            <Label>اختر التخصص أولاً</Label>
                            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر التخصص" dir="rtl" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Search input for specializations */}
                                    <div className="p-2">
                                        <Input
                                            placeholder="ابحث عن تخصص..."
                                            value={specializationSearch}
                                            onChange={(e) => setSpecializationSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                    </div>
                                    {filteredSpecializations.map((spec) => (
                                        <SelectItem key={spec.id} value={spec.id}>
                                            {spec.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* اختيار الكورس - يعتمد على التخصص المختار */}
                        <div className="space-y-2">
                            <Label>اختر الكورس</Label>
                            <Select
                                value={selectedCourse}
                                onValueChange={setSelectedCourse}
                                disabled={!selectedSpecialization}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedSpecialization ? "اختر الكورس" : "اختر التخصص أولاً"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Search input for courses */}
                                    <div className="p-2">
                                        <Input
                                            placeholder="ابحث عن كورس..."
                                            value={courseSearch}
                                            onChange={(e) => setCourseSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                    </div>
                                    {filteredCoursesForSelect.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* زر الإضافة - تحت اختيار التخصص والكورس */}
                    <div className="flex justify-end">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    disabled={!selectedCourse}
                                    onClick={() => {
                                        setEditItem(null);
                                        setForm({
                                            // name: "",
                                            description: "",
                                            order: "",
                                            priceUSD: "",
                                            priceSAR: "",
                                            isFree: false,
                                            previewUrl: "",
                                            // downloadUrl: "",
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
                                <DialogHeader >
                                    <DialogTitle className="text-right">{editItem ? "تعديل المستوى" : "إضافة مستوى جديد"}</DialogTitle>
                                    <DialogDescription className="text-right">
                                        {editItem ? "قم بتعديل بيانات المستوى" : "أدخل بيانات المستوى الجديد"}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-2">
                                    {/* <div className="space-y-2">
                                        <Label>العنوان *</Label>
                                        <Input
                                            value={form.name}
                                            onChange={(e) => handleFormChange("name", e.target.value)}
                                            placeholder="أدخل عنوان المستوى..."
                                        />
                                    </div> */}



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
                                                    {/* Search input for instructors */}
                                                    <div className="p-2">
                                                        <Input
                                                            placeholder="ابحث عن مدرب..."
                                                            value={instructorSearch}
                                                            onChange={(e) => setInstructorSearch(e.target.value)}
                                                            className="mb-2"
                                                        />
                                                    </div>
                                                    {filteredInstructors.map((instructor) => (
                                                        <SelectItem key={instructor.id} value={instructor.id}>
                                                            {instructor.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
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

                                    {/* <div className="space-y-2">
                                        <Label>رابط التحميل</Label>
                                        <Input
                                            value={form.downloadUrl}
                                            onChange={(e) => handleFormChange("downloadUrl", e.target.value)}
                                            placeholder="رابط تحميل الملفات..."
                                        />
                                    </div> */}

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
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                        className="w-full"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                                {editItem ? "جارٍ التعديل..." : "جارٍ الإضافة..."}
                                            </>
                                        ) : (
                                            editItem ? "حفظ التعديل" : "حفظ"
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
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
                                    {/* Search input for status filter */}
                                    <div className="p-2">
                                        <Input
                                            placeholder="ابحث في الحالات..."
                                            value={statusFilterSearch}
                                            onChange={(e) => setStatusFilterSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                    </div>
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
                                    {/* Search input for instructor filter */}
                                    <div className="p-2">
                                        <Input
                                            placeholder="ابحث عن مدرب..."
                                            value={instructorFilterSearch}
                                            onChange={(e) => setInstructorFilterSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                    </div>
                                    <SelectItem value="all">جميع المدرسين</SelectItem>
                                    {filteredInstructorsForFilter.map((instructor) => (
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
                                    {/* Search input for free filter */}
                                    <div className="p-2">
                                        <Input
                                            placeholder="ابحث في الأنواع..."
                                            value={freeFilterSearch}
                                            onChange={(e) => setFreeFilterSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                    </div>
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
                        {!selectedSpecialization ? "يرجى اختيار تخصص أولاً" : "يرجى اختيار كورس لعرض مستوياته"}
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
                                                            order: (item.order || "").toString(),
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

            {/* Details Dialog */}
            {/* <Dialog open={detailsDialog.isOpen} onOpenChange={(isOpen) => setDetailsDialog(prev => ({ ...prev, isOpen }))}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل المستوى</DialogTitle>
                        <DialogDescription>
                            عرض المعلومات الكاملة للمستوى
                        </DialogDescription>
                    </DialogHeader>
                    {detailsDialog.item && <LevelDetails item={detailsDialog.item} />}
                </DialogContent>
            </Dialog> */}

            {/* Level Details Dialog */}
<Dialog open={detailsDialog.isOpen} onOpenChange={(isOpen) => setDetailsDialog(prev => ({ ...prev, isOpen }))}>
    <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle className="text-xl text-right">تفاصيل المستوى</DialogTitle>
        </DialogHeader>
        {detailsDialog.item && <LevelDetails item={detailsDialog.item} />}
    </DialogContent>
</Dialog>
        </Card>
    );
};

export default CourseLevel;