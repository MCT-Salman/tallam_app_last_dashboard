import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Youtube, Download, Info } from "lucide-react"
import { getLevelLessons, createLessonForLevel, updateLesson, deleteLesson, toggleLessonStatus, getInstructors } from "@/api/api"
import { getCourses } from "@/api/api"
import { getCourseLevels } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

const Lesson = () => {
    const [lessons, setLessons] = useState([])
    const [allLessons, setAllLessons] = useState([])
    const [courses, setCourses] = useState([])
    const [levels, setLevels] = useState([])
    const [instructors, setInstructors] = useState([]) // ⬅️ أضف هذا
    const [selectedCourse, setSelectedCourse] = useState("")
    const [selectedLevel, setSelectedLevel] = useState("")
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        title: "",
        description: "",
        youtubeUrl: "",
        youtubeId: "",
        googleDriveUrl: "",
        durationSec: "",
        orderIndex: "",
        isFreePreview: false
    })
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, lesson: null })

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [freePreviewFilter, setFreePreviewFilter] = useState("all")
    const [sortBy, setSortBy] = useState("orderIndex")
    const [sortOrder, setSortOrder] = useState("asc")

    // جلب الكورسات
    const fetchCourses = async () => {
        try {
            const res = await getCourses();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            console.log("Courses data:", data);
            setCourses(data);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل الكورسات");
        }
    };

    // جلب المدرسين
    const fetchInstructors = async () => {
        try {
            console.log("🔄 Fetching instructors...");
            const res = await getInstructors();
            console.log("📊 Instructors API full response:", res);
            
            let data = [];
            if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            } else if (Array.isArray(res.data?.data?.items)) {
                data = res.data.data.items;
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }
            
            console.log("✅ Extracted instructors:", data);
            setInstructors(data);
        } catch (err) {
            console.error("❌ Error fetching instructors:", err);
            const fallbackInstructors = [
                { id: 1, name: "د. أحمد محمد" },
                { id: 2, name: "د. علي حسن" }
            ];
            setInstructors(fallbackInstructors);
        }
    };

    // جلب مستويات الكورس المحدد
    const fetchCourseLevels = async (courseId) => {
        if (!courseId) {
            setLevels([])
            setSelectedLevel("")
            return
        }

        try {
            const res = await getCourseLevels(courseId)
            console.log("Full levels response:", res);
            
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
            
            console.log("Levels data:", data);
            setLevels(data || []);
        } catch (err) {
            console.error("Error fetching levels:", err);
            showErrorToast("فشل تحميل مستويات الكورس");
            setLevels([]);
        }
    }

    // جلب دروس المستوى المحدد
    const fetchLevelLessons = async (levelId) => {
        if (!levelId) {
            setAllLessons([])
            return
        }

        setLoading(true)
        try {
            const res = await getLevelLessons(levelId)
            console.log("📚 Lessons API full response:", res);
            
            let data = [];
            
            if (res.data?.data?.success && res.data.data.data?.data) {
                data = res.data.data.data.data;
                console.log("✅ Using res.data.data.data.data");
            } else if (Array.isArray(res.data?.data?.data?.data)) {
                data = res.data.data.data.data;
                console.log("✅ Using res.data.data.data.data (direct)");
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
                console.log("✅ Using res.data.data.data");
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data;
                console.log("✅ Using res.data.data");
            } else if (Array.isArray(res.data)) {
                data = res.data;
                console.log("✅ Using res.data");
            }
            
            console.log("🎯 Final lessons data:", data);
            setAllLessons(data || []);
        } catch (err) {
            console.error("❌ Error fetching lessons:", err);
            console.error("Error details:", err.response?.data);
            showErrorToast("فشل تحميل الدروس");
            setAllLessons([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCourses()
        fetchInstructors() // ⬅️ أضف هذا
    }, [])

    // عند تغيير الكورس المحدد
    useEffect(() => {
        if (selectedCourse) {
            fetchCourseLevels(selectedCourse)
            setSelectedLevel("")
        } else {
            setLevels([])
            setSelectedLevel("")
        }
    }, [selectedCourse])

    // عند تغيير المستوى المحدد
    useEffect(() => {
        if (selectedLevel) {
            fetchLevelLessons(selectedLevel)
        } else {
            setAllLessons([])
        }
    }, [selectedLevel])

    // فلترة وترتيب البيانات
    const filteredAndSortedLessons = useMemo(() => {
        let filtered = [...allLessons]

        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item?.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(item =>
                statusFilter === "active" ? item?.isActive : !item?.isActive
            )
        }

        if (freePreviewFilter !== "all") {
            filtered = filtered.filter(item =>
                freePreviewFilter === "free" ? item?.isFreePreview : !item?.isFreePreview
            )
        }

        filtered.sort((a, b) => {
            let aValue, bValue

            switch (sortBy) {
                case "title":
                    aValue = a?.title?.toLowerCase() || ""
                    bValue = b?.title?.toLowerCase() || ""
                    break
                case "orderIndex":
                    aValue = parseInt(a?.orderIndex) || 0
                    bValue = parseInt(b?.orderIndex) || 0
                    break
                case "durationSec":
                    aValue = parseInt(a?.durationSec) || 0
                    bValue = parseInt(b?.durationSec) || 0
                    break
                case "isActive":
                    aValue = a?.isActive
                    bValue = b?.isActive
                    break
                default:
                    aValue = parseInt(a?.orderIndex) || 0
                    bValue = parseInt(b?.orderIndex) || 0
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
            return 0
        })

        return filtered
    }, [allLessons, searchTerm, statusFilter, freePreviewFilter, sortBy, sortOrder])

    // حساب البيانات المعروضة في الصفحة الحالية
    const paginatedLessons = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredAndSortedLessons.slice(startIndex, endIndex)
    }, [filteredAndSortedLessons, currentPage, itemsPerPage])

    // إعادة تعيين الصفحة عند تغيير الفلتر
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, freePreviewFilter, itemsPerPage])

    // التعامل مع تغييرات النموذج
    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    // استخراج YouTube ID من الرابط
    const extractYouTubeId = (url) => {
        if (!url) return ""
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
        return match ? match[1] : ""
    }

    // عند تغيير رابط YouTube
    const handleYoutubeUrlChange = (url) => {
        const youtubeId = extractYouTubeId(url)
        setForm(prev => ({
            ...prev,
            youtubeUrl: url,
            youtubeId: youtubeId
        }))
    }

    // حفظ الدرس (إضافة أو تعديل)
    // const handleSave = async () => {
    //     if (!form.title.trim()) return showErrorToast("يرجى إدخال عنوان الدرس")
    //     if (!form.orderIndex) return showErrorToast("يرجى إدخال ترتيب الدرس")
    //     if (!form.youtubeUrl) return showErrorToast("يرجى إدخال رابط YouTube")
    //     if (!selectedLevel) return showErrorToast("يرجى اختيار المستوى أولاً")

    //     try {
    //         const lessonData = {
    //             title: form.title,
    //             description: form.description || '',
    //             youtubeUrl: form.youtubeUrl,
    //             youtubeId: form.youtubeId,
    //             googleDriveUrl: form.googleDriveUrl || '',
    //             durationSec: parseInt(form.durationSec) || 0,
    //             orderIndex: parseInt(form.orderIndex),
    //             isFreePreview: Boolean(form.isFreePreview)
    //         }

    //         console.log("📤 Sending lesson data:", lessonData);

    //         if (editItem) {
    //             await updateLesson(editItem.id, lessonData)
    //             showSuccessToast("تم تعديل الدرس بنجاح")
    //             setEditItem(null)
    //         } else {
    //             await createLessonForLevel(selectedLevel, lessonData)
    //             showSuccessToast("تم إنشاء الدرس بنجاح")
    //         }

    //         setForm({
    //             title: "",
    //             description: "",
    //             youtubeUrl: "",
    //             youtubeId: "",
    //             googleDriveUrl: "",
    //             durationSec: "",
    //             orderIndex: "",
    //             isFreePreview: false
    //         })
    //         setIsDialogOpen(false)
    //         fetchLevelLessons(selectedLevel)
    //     } catch (err) {
    //         console.error("❌ Save error:", err.response?.data || err)
    //         showErrorToast(err?.response?.data?.message || "فشل العملية")
    //     }
    // }

    // في دالة handleSave، تأكد من إرسال googleDriveUrl
const handleSave = async () => {
    if (!form.title.trim()) return showErrorToast("يرجى إدخال عنوان الدرس")
    if (!form.orderIndex) return showErrorToast("يرجى إدخال ترتيب الدرس")
    if (!form.youtubeUrl) return showErrorToast("يرجى إدخال رابط YouTube")
    if (!selectedLevel) return showErrorToast("يرجى اختيار المستوى أولاً")

    try {
        const lessonData = {
            title: form.title,
            description: form.description || '',
            youtubeUrl: form.youtubeUrl,
            youtubeId: form.youtubeId,
            googleDriveUrl: form.googleDriveUrl || '', // ⬅️ تأكد من إرسال هذا الحقل
            durationSec: parseInt(form.durationSec) || 0,
            orderIndex: parseInt(form.orderIndex),
            isFreePreview: Boolean(form.isFreePreview)
        }

        console.log("📤 Sending lesson data:", lessonData);

        if (editItem) {
            await updateLesson(editItem.id, lessonData)
            showSuccessToast("تم تعديل الدرس بنجاح")
            setEditItem(null)
        } else {
            await createLessonForLevel(selectedLevel, lessonData)
            showSuccessToast("تم إنشاء الدرس بنجاح")
        }

        // إعادة تعيين النموذج
        setForm({
            title: "",
            description: "",
            youtubeUrl: "",
            youtubeId: "",
            googleDriveUrl: "",
            durationSec: "",
            orderIndex: "",
            isFreePreview: false
        })
        setIsDialogOpen(false)
        fetchLevelLessons(selectedLevel)
    } catch (err) {
        console.error("❌ Save error:", err.response?.data || err)
        showErrorToast(err?.response?.data?.message || "فشل العملية")
    }
}

    // تبديل حالة الدرس
    const handleToggleActive = async (id, isActive) => {
        try {
            await toggleLessonStatus(id, !isActive)
            showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} الدرس بنجاح`)
            fetchLevelLessons(selectedLevel)
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة")
        }
    }

    // حذف الدرس
    const handleDelete = async (id) => {
        try {
            await deleteLesson(id)
            fetchLevelLessons(selectedLevel)
            showSuccessToast("تم الحذف بنجاح")
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل الحذف")
        }
    }

    // تحويل الثواني إلى تنسيق وقت
    const formatDuration = (seconds) => {
        if (!seconds) return "00:00"
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // الحصول على معلومات الكورس من الدرس
    const getCourseInfo = (lesson) => {
        if (!lesson) return "غير محدد";
        return lesson.courseLevel?.course?.title || 
               lesson.course?.title || 
               "غير محدد";
    }

    // الحصول على معلومات المدرس من الدرس
    const getInstructorInfo = (lesson) => {
        if (!lesson) return "غير محدد";
        
        const instructorId = lesson.courseLevel?.instructorId;
        console.log("🔍 Instructor search:", {
            lessonId: lesson.id,
            instructorId: instructorId,
            instructorsCount: instructors.length
        });
        
        if (!instructorId) return "غير محدد";
        
        const instructor = instructors.find(inst => inst.id === instructorId);
        console.log("🔍 Found instructor:", instructor);
        
        return instructor?.name || `المدرس ID: ${instructorId}`;
    };

    // Pagination calculations
    const totalItems = filteredAndSortedLessons.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    // Handle sort
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
    }

    // Reset filters
    const resetFilters = () => {
        setSearchTerm("")
        setStatusFilter("all")
        setFreePreviewFilter("all")
        setSortBy("orderIndex")
        setSortOrder("asc")
        setCurrentPage(1)
    }

    // عرض التفاصيل الكاملة للدرس
    const renderLessonDetails = (lesson) => {
        if (!lesson) return null;

        return (
            <div className="space-y-4 text-right">
                {/* المعلومات الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="font-bold">عنوان الدرس:</Label>
                        <p className="mt-1">{lesson.title || "غير محدد"}</p>
                    </div>
                    <div>
                        <Label className="font-bold">ترتيب الدرس:</Label>
                        <p className="mt-1">{lesson.orderIndex || "غير محدد"}</p>
                    </div>
                    <div>
                        <Label className="font-bold">المدة:</Label>
                        <p className="mt-1">{formatDuration(lesson.durationSec)}</p>
                    </div>
                    <div>
                        <Label className="font-bold">الحالة:</Label>
                        <div className="mt-1">
                            <Badge variant={lesson.isActive ? "default" : "secondary"}>
                                {lesson.isActive ? "نشط" : "معطل"}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <Label className="font-bold">المعاينة المجانية:</Label>
                        <div className="mt-1">
                            <Badge variant={lesson.isFreePreview ? "default" : "secondary"}>
                                {lesson.isFreePreview ? "مجاني" : "مدفوع"}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <Label className="font-bold">الكورس:</Label>
                        <p className="mt-1">{getCourseInfo(lesson)}</p>
                    </div>
                    <div>
                        <Label className="font-bold">المدرس:</Label>
                        <p className="mt-1">{getInstructorInfo(lesson)}</p>
                        {/* <div className="text-xs text-gray-500 mt-1">
                            instructorId: {lesson.courseLevel?.instructorId || "غير موجود"}
                        </div> */}
                    </div>
                </div>

                {/* الوصف */}
                {lesson.description && (
                    <div>
                        <Label className="font-bold">الوصف:</Label>
                        <p className="mt-1 p-2 bg-gray-50 rounded-md">{lesson.description}</p>
                    </div>
                )}

                {/* الروابط */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <Label className="font-bold">رابط YouTube:</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Youtube className="w-4 h-4 text-red-600" />
                            {lesson.youtubeUrl ? (
                                <a 
                                    href={lesson.youtubeUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                >
                                    {lesson.youtubeUrl}
                                </a>
                            ) : (
                                <span className="text-gray-500">غير متوفر</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <Label className="font-bold">رابط Google Drive:</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Download className="w-4 h-4 text-green-600" />
                            {lesson.googleDriveUrl ? (
                                <a 
                                    href={lesson.googleDriveUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                >
                                    {lesson.googleDriveUrl}
                                </a>
                            ) : (
                                <span className="text-gray-500">غير متوفر</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* معلومات إضافية */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">معلومات إضافية:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-medium">YouTube ID:</Label>
                            <p>{lesson.youtubeId || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">تاريخ الإنشاء:</Label>
                            <p>{lesson.createdAt || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">آخر تحديث:</Label>
                            <p>{lesson.updatedAt || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">معرف الدرس:</Label>
                            <p>{lesson.id || "غير محدد"}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <CardTitle>إدارة الدروس</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                disabled={!selectedLevel}
                                onClick={() => {
                                    setEditItem(null)
                                    setForm({
                                        title: "",
                                        description: "",
                                        youtubeUrl: "",
                                        youtubeId: "",
                                        googleDriveUrl: "",
                                        durationSec: "",
                                        orderIndex: "",
                                        isFreePreview: false
                                    })
                                }}
                            >
                                إضافة درس <Plus className="w-4 h-4 cursor-pointer" />
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editItem ? "تعديل الدرس" : "إضافة درس جديد"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label>عنوان الدرس *</Label>
                                    <Input
                                        value={form.title}
                                        onChange={(e) => handleFormChange("title", e.target.value)}
                                        placeholder="أدخل عنوان الدرس..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>وصف الدرس</Label>
                                    <Textarea
                                        value={form.description}
                                        onChange={(e) => handleFormChange("description", e.target.value)}
                                        rows={3}
                                        placeholder="أدخل وصف الدرس..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ترتيب الدرس *</Label>
                                        <Input
                                            type="number"
                                            value={form.orderIndex}
                                            onChange={(e) => handleFormChange("orderIndex", e.target.value)}
                                            placeholder="ترتيب الدرس"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>مدة الدرس (ثانية)</Label>
                                        <Input
                                            type="number"
                                            value={form.durationSec}
                                            onChange={(e) => handleFormChange("durationSec", e.target.value)}
                                            placeholder="مدة الدرس بالثواني"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>رابط YouTube *</Label>
                                    <Input
                                        value={form.youtubeUrl}
                                        onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                    {form.youtubeId && (
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <Youtube className="w-4 h-4" />
                                            <span>تم التعرف على الفيديو: {form.youtubeId}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>رابط Google Drive</Label>
                                    <Input
                                        value={form.googleDriveUrl}
                                        onChange={(e) => handleFormChange("googleDriveUrl", e.target.value)}
                                        placeholder="https://drive.google.com/..."
                                    />
                                </div>

                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Switch
                                        checked={form.isFreePreview}
                                        onCheckedChange={(checked) => handleFormChange("isFreePreview", checked)}
                                    />
                                    <Label>معاينة مجانية</Label>
                                </div>

                                <Button onClick={handleSave}>
                                    {editItem ? "حفظ التعديل" : "حفظ"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Course and Level Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>اختر الكورس</Label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الكورس" />
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

                    <div className="space-y-2">
                        <Label>اختر المستوى</Label>
                        <Select 
                            value={selectedLevel} 
                            onValueChange={setSelectedLevel}
                            disabled={!selectedCourse}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={selectedCourse ? "اختر المستوى" : "اختر الكورس أولاً"} />
                            </SelectTrigger>
                            <SelectContent>
                                {levels.map((level) => (
                                    <SelectItem key={level.id} value={level.id}>
                                        {level.name} (ترتيب: {level.order})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filters Section - Only show when a level is selected */}
                {selectedLevel && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                            {/* Free Preview Filter */}
                            <Select value={freePreviewFilter} onValueChange={setFreePreviewFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="فلترة بالمعاينة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع الدروس</SelectItem>
                                    <SelectItem value="free">معاينة مجانية</SelectItem>
                                    <SelectItem value="paid">بدون معاينة</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Items Per Page */}
                            <Select 
                                value={itemsPerPage.toString()} 
                                onValueChange={(value) => setItemsPerPage(Number(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="عدد العناصر" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 عناصر</SelectItem>
                                    <SelectItem value="10">10 عناصر</SelectItem>
                                    <SelectItem value="20">20 عناصر</SelectItem>
                                    <SelectItem value="50">50 عناصر</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reset Filters & Results Count */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                                عرض {filteredAndSortedLessons.length} من أصل {allLessons.length} درس
                                {(searchTerm || statusFilter !== "all" || freePreviewFilter !== "all") && ` (مفلتر)`}
                            </div>

                            {(searchTerm || statusFilter !== "all" || freePreviewFilter !== "all") && (
                                <Button variant="outline" size="sm" onClick={resetFilters}>
                                    إعادة تعيين الفلترة
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </CardHeader>

            <CardContent>
                {!selectedLevel ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {!selectedCourse ? "يرجى اختيار كورس أولاً" : "يرجى اختيار مستوى لعرض دروسه"}
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
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("title")}
                                        >
                                            <div className="flex items-center gap-1">
                                                العنوان
                                                {sortBy === "title" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("orderIndex")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الترتيب
                                                {sortBy === "orderIndex" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header">المدة</TableHead>
                                        <TableHead className="table-header">الكورس</TableHead>
                                        <TableHead className="table-header">المدرس</TableHead>
                                        <TableHead className="table-header">المعاينة</TableHead>
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
                                    {paginatedLessons.length > 0 ? paginatedLessons.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="table-cell font-medium">
                                                <div>
                                                    <div>{item.title || "بدون عنوان"}</div>
                                                    {item.description && (
                                                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <Badge variant="secondary">{item.orderIndex || "0"}</Badge>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {formatDuration(item.durationSec)}
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {getCourseInfo(item)}
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <div>
                                                    {getInstructorInfo(item)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <Badge variant={item.isFreePreview ? "default" : "secondary"}>
                                                    {item.isFreePreview ? "مجاني" : "مدفوع"}
                                                </Badge>
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
                                                    onClick={() => setDetailDialog({ isOpen: true, lesson: item })}
                                                    title="عرض التفاصيل"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </Button>
                                                {item.youtubeUrl && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => window.open(item.youtubeUrl, '_blank')}
                                                        title="مشاهدة على YouTube"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                )}
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
                                                        setEditItem(item)
                                                        setForm({
                                                            title: item.title || "",
                                                            description: item.description || "",
                                                            youtubeUrl: item.youtubeUrl || "",
                                                            youtubeId: item.youtubeId || "",
                                                            googleDriveUrl: item.googleDriveUrl || "",
                                                            durationSec: item.durationSec?.toString() || "",
                                                            orderIndex: item.orderIndex?.toString() || "",
                                                            isFreePreview: item.isFreePreview || false
                                                        })
                                                        setIsDialogOpen(true)
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
                                                        itemName: item.title || "بدون عنوان"
                                                    })}
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                                                {allLessons.length === 0 ? "لا توجد دروس لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards View - تحسين التجاوب */}
                        <div className="block md:hidden space-y-4">
                            {paginatedLessons.length > 0 ? paginatedLessons.map(item => (
                                <Card key={item.id} className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                            <h3 className="font-bold text-lg flex-1">{item.title || "بدون عنوان"}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary">ترتيب: {item.orderIndex || "0"}</Badge>
                                                <Badge variant={item.isFreePreview ? "default" : "secondary"}>
                                                    {item.isFreePreview ? "مجاني" : "مدفوع"}
                                                </Badge>
                                            </div>
                                        </div>

                                        {item.description && (
                                            <p className="text-sm text-gray-600">
                                                {item.description}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">المدة:</span>
                                                <span>{formatDuration(item.durationSec)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">الحالة:</span>
                                                <Badge variant={item.isActive ? "default" : "secondary"}>
                                                    {item.isActive ? "نشط" : "معطل"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">الكورس:</span>
                                                <span className="flex-1">{getCourseInfo(item)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">المدرس:</span>
                                                <span className="flex-1">{getInstructorInfo(item)}</span>
                                            </div>
                                        </div>

                                        {/* أزرار الإجراءات - تصميم متجاوب */}
                                        <div className="flex flex-wrap gap-2 pt-3 border-t">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setDetailDialog({ isOpen: true, lesson: item })}
                                                className="flex-1 min-w-[120px]"
                                            >
                                                <Info className="w-4 h-4 ml-1" />
                                                التفاصيل
                                            </Button>
                                            {item.youtubeUrl && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(item.youtubeUrl, '_blank')}
                                                    className="flex-1 min-w-[120px]"
                                                >
                                                    <Eye className="w-4 h-4 ml-1" />
                                                    مشاهدة
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleToggleActive(item.id, item.isActive)}
                                                className="flex-1 min-w-[120px]"
                                            >
                                                {item.isActive ? <Pause className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" />}
                                                {item.isActive ? "إيقاف" : "تفعيل"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditItem(item)
                                                    setForm({
                                                        title: item.title || "",
                                                        description: item.description || "",
                                                        youtubeUrl: item.youtubeUrl || "",
                                                        youtubeId: item.youtubeId || "",
                                                        googleDriveUrl: item.googleDriveUrl || "",
                                                        durationSec: item.durationSec?.toString() || "",
                                                        orderIndex: item.orderIndex?.toString() || "",
                                                        isFreePreview: item.isFreePreview || false
                                                    })
                                                    setIsDialogOpen(true)
                                                }}
                                                className="flex-1 min-w-[120px]"
                                            >
                                                <Edit className="w-4 h-4 ml-1" />
                                                تعديل
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => setDeleteDialog({
                                                    isOpen: true,
                                                    itemId: item.id,
                                                    itemName: item.title || "بدون عنوان"
                                                })}
                                                className="flex-1 min-w-[120px]"
                                            >
                                                <Trash2 className="w-4 h-4 ml-1" />
                                                حذف
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allLessons.length === 0 ? "لا توجد دروس لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {paginatedLessons.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من {totalItems} درس
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
                                            let pageNumber
                                            if (totalPages <= 5) {
                                                pageNumber = i + 1
                                            } else if (currentPage <= 3) {
                                                pageNumber = i + 1
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumber = totalPages - 4 + i
                                            } else {
                                                pageNumber = currentPage - 2 + i
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
                                            )
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
                        <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا الدرس؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف الدرس "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row-reverse gap-2">
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={async () => {
                                await handleDelete(deleteDialog.itemId)
                                setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })
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

            {/* Lesson Details Dialog */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog(prev => ({ ...prev, isOpen }))}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل الدرس</DialogTitle>
                    </DialogHeader>
                    {renderLessonDetails(detailDialog.lesson)}
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export default Lesson