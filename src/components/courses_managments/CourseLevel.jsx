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
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, ChevronRightIcon, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
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

    // حالات التحقق من رابط المعاينة (YouTube)
    const [linkValidation, setLinkValidation] = useState({
        previewUrl: { isValid: false, message: "", checking: false, exists: false }
    });

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

    // دالة للتحقق من صحة رابط YouTube
    const validateYouTubeUrl = (url) => {
        if (!url) return { isValid: false, message: "يرجى إدخال رابط YouTube", exists: false };
        
        try {
            // التحقق من أن الرابط يحتوي على بروتوكول
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return { 
                    isValid: false, 
                    message: "يجب أن يبدأ الرابط بـ http:// أو https://",
                    exists: false
                };
            }
            
            const urlObj = new URL(url);
            
            // التحقق من أن الرابط خاص بـ YouTube
            if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
                return { 
                    isValid: false, 
                    message: "يجب أن يكون الرابط من youtube.com أو youtu.be",
                    exists: false
                };
            }

            // استخراج YouTube ID والتحقق منه
            const youtubeId = extractYouTubeId(url);
            if (!youtubeId) {
                return { 
                    isValid: false, 
                    message: "لم يتم العثور على معرف فيديو YouTube صحيح",
                    exists: false
                };
            }

            // التحقق من أن معرف الفيديو بطول 11 حرف (معيار YouTube)
            if (youtubeId.length !== 11) {
                return { 
                    isValid: false, 
                    message: "معرف فيديو YouTube يجب أن يكون 11 حرفاً",
                    exists: false
                };
            }
            
            return { 
                isValid: true, 
                message: "جاري التحقق من وجود الفيديو...",
                exists: false,
                youtubeId: youtubeId
            };
        } catch (error) {
            return { 
                isValid: false, 
                message: "صيغة الرابط غير صحيحة",
                exists: false
            };
        }
    };

    // استخراج YouTube ID من الرابط
    const extractYouTubeId = (url) => {
        if (!url) return ""
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
        return match ? match[1] : ""
    };

    // دالة للتحقق الفعلي من وجود الرابط
    const checkUrlExists = async (url, type) => {
        if (!url) {
            return { 
                isValid: false, 
                message: "", 
                exists: false 
            };
        }

        try {
            if (type === 'youtube') {
                const youtubeId = extractYouTubeId(url);
                if (!youtubeId) {
                    return { 
                        isValid: false, 
                        message: "لم يتم العثور على معرف فيديو صحيح",
                        exists: false 
                    };
                }

                // التحقق من وجود الفيديو عبر الصورة المصغرة
                const thumbResponse = await fetch(`https://img.youtube.com/vi/${youtubeId}/0.jpg`);
                
                if (thumbResponse.status === 200) {
                    return { 
                        isValid: true, 
                        message: "✅ الفيديو متوفر على YouTube",
                        exists: true 
                    };
                } else if (thumbResponse.status === 404) {
                    return { 
                        isValid: true, 
                        message: "⚠️ الرابط صحيح ولكن الفيديو غير متوفر أو محذوف",
                        exists: false 
                    };
                } else {
                    return { 
                        isValid: true, 
                        message: "🔶 الرابط صحيح - تعذر التحقق من وجود الفيديو",
                        exists: true // نفترض أنه متاح
                    };
                }
            }

            // للروابط الأخرى (ليست YouTube) نكتفي بالتحقق من الصيغة
            return { 
                isValid: true, 
                message: "✅ الرابط صحيح",
                exists: true 
            };

        } catch (error) {
            return { 
                isValid: true,
                message: "🔶 تم التحقق من صيغة الرابط - تعذر التأكد من الوجود",
                exists: true 
            };
        }
    };

    // دالة للتحقق من الروابط مع تأخير
    const validateUrlWithDelay = async (url, type) => {
        // أولاً: التحقق من الصيغة
        const formatValidation = type === 'youtube' ? validateYouTubeUrl(url) : { isValid: true, message: "" };
        
        if (!formatValidation.isValid) {
            return formatValidation;
        }

        // إذا كانت الصيغة صحيحة، نبدأ التحقق من الوجود
        setLinkValidation(prev => ({
            ...prev,
            previewUrl: { ...formatValidation, checking: true }
        }));

        // تأخير لمحاكاة عملية التحقق
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const existenceCheck = await checkUrlExists(url, type);
            return {
                ...existenceCheck,
                youtubeId: formatValidation.youtubeId
            };
        } catch (error) {
            return {
                isValid: false,
                message: "فشل التحقق من الرابط",
                exists: false
            };
        }
    };

    // عند تغيير رابط المعاينة
    const handlePreviewUrlChange = async (url) => {
        handleFormChange("previewUrl", url);
        
        // إذا كان الرابط فارغاً، نعيد تعيين الحالة
        if (!url) {
            setLinkValidation(prev => ({
                ...prev,
                previewUrl: { isValid: false, message: "", checking: false, exists: false }
            }));
            return;
        }

        // التحقق من الرابط (نعتبره YouTube)
        const validation = await validateUrlWithDelay(url, 'youtube');
        
        setLinkValidation(prev => ({
            ...prev,
            previewUrl: { ...validation, checking: false }
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

    // التحقق من إمكانية الحفظ
    const canSave = useMemo(() => {
        // التحقق من الحقول الإلزامية
        if (!form.order || !form.instructorId || !selectedCourse || (!imageFile && !editItem)) {
            return false;
        }

        // إذا كان هناك رابط معاينة، يجب أن يكون صالحاً
        if (form.previewUrl && (!linkValidation.previewUrl.isValid || !linkValidation.previewUrl.exists)) {
            return false;
        }

        return true;
    }, [form, linkValidation, selectedCourse, imageFile, editItem]);

    // حفظ المستوى (إضافة أو تعديل)
    const handleSave = async () => {
        if (!canSave) {
            showErrorToast("يرجى التحقق من صحة جميع البيانات والروابط");
            return;
        }

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
            setLinkValidation({
                previewUrl: { isValid: false, message: "", checking: false, exists: false }
            });
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

    // مكون عرض حالة الرابط
    const LinkStatus = ({ validation, type }) => {
        if (!validation.message) return null;

        let icon;
        let color;

        if (validation.checking) {
            icon = <Clock className="w-3 h-3 animate-spin" />;
            color = "text-blue-600";
        } else if (validation.isValid && validation.exists) {
            icon = <CheckCircle className="w-3 h-3" />;
            color = "text-green-600";
        } else if (validation.isValid && !validation.exists) {
            icon = <Clock className="w-3 h-3" />;
            color = "text-yellow-600";
        } else {
            icon = <XCircle className="w-3 h-3" />;
            color = "text-red-600";
        }

        return (
            <div className={`flex items-center gap-1 text-xs mt-1 ${color}`}>
                {icon}
                <span>{validation.message}</span>
            </div>
        );
    };

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
    const LevelDetails = ({ item }) => (
        <div className="space-y-6" dir="rtl">
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

                    <div>
                        <Label className="font-semibold text-base">المدرب:</Label>
                        <p className="text-gray-700 mt-1">{getInstructorName(item.instructorId)}</p>
                    </div>
                </div>
            </div>

            {/* معلومات المسار */}
            <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">معلومات المسار</h3>
                <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium">التخصص:</span>
                    <span>{getSpecializationName(selectedSpecialization)}</span>
                    <ChevronRightIcon className="h-4 w-4" />
                    <span className="font-medium">الكورس:</span>
                    <span>{getCourseName(selectedCourse)}</span>
                </div>
            </div>

            {/* الروابط */}
            {(item.previewUrl) && (
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
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US') : "غير محدد"}
                        </p>
                    </div>
                    <div>
                        <Label className="font-medium">آخر تحديث:</Label>
                        <p className="text-gray-600 mt-1">
                            {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US') : "غير محدد"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

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
                                        setLinkValidation({
                                            previewUrl: { isValid: false, message: "", checking: false, exists: false }
                                        });
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
                                        <Label>رابط المعاينة (YouTube)</Label>
                                        <Input
                                            value={form.previewUrl}
                                            onChange={(e) => handlePreviewUrlChange(e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className={linkValidation.previewUrl.isValid && linkValidation.previewUrl.exists ? "border-green-500" : 
                                                     linkValidation.previewUrl.isValid && !linkValidation.previewUrl.exists ? "border-yellow-500" : 
                                                     !linkValidation.previewUrl.isValid && form.previewUrl ? "border-red-500" : ""}
                                        />
                                        <LinkStatus validation={linkValidation.previewUrl} type="previewUrl" />
                                        {!form.previewUrl && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                أدخل رابط فيديو YouTube للمعاينة (يجب أن يبدأ بـ http:// أو https://)
                                            </div>
                                        )}
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
                                    
                                    <Button
                                        onClick={handleSave}
                                        disabled={!canSave || isSubmitting}
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

                                    {!canSave && (
                                        <div className="text-xs text-yellow-600 text-center">
                                            ⚠️ يرجى التحقق من صحة جميع البيانات والروابط قبل الحفظ
                                        </div>
                                    )}
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

            {/* باقي الكود يبقى كما هو بدون تغيير */}
            {/* ... */}
        </Card>
    );
};

export default CourseLevel;