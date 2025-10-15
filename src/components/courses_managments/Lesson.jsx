import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Youtube, Download, Info, Loader2, CheckCircle, XCircle, Clock, BookOpen, File, Upload, FileQuestion } from "lucide-react"
import { getLevelLessons, createLessonForLevel, updateLesson, deleteLesson, toggleLessonStatus } from "@/api/api"
import { getCourses } from "@/api/api"
import { getCourseLevels } from "@/api/api"
import { getSpecializations } from "@/api/api"
import { getQuizByCourseLevel, addQuestion, updateQuestion, deleteQuestion, deleteQuiz, uploadFile, deleteFile, getFilesByLevel } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"
import { BASE_URL } from "@/api/api"

const Lesson = () => {
    const [allLessons, setAllLessons] = useState([])
    const [specializations, setSpecializations] = useState([])
    const [courses, setCourses] = useState([])
    const [levels, setLevels] = useState([])
    const [files, setFiles] = useState([])
    const [questions, setQuestions] = useState([])
    const [activeTab, setActiveTab] = useState("lessons")
    
    const [selectedSpecialization, setSelectedSpecialization] = useState("")
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
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "", type: "" })
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, lesson: null })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // حالات التحقق من الروابط
    const [linkValidation, setLinkValidation] = useState({
        youtubeUrl: { isValid: false, message: "", checking: false, exists: false },
        googleDriveUrl: { isValid: false, message: "", checking: false, exists: false }
    })

    // حالات البحث والترتيب
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [statusFilter, setStatusFilter] = useState("all")
    const [freePreviewFilter, setFreePreviewFilter] = useState("all")
    const [sortBy, setSortBy] = useState("orderIndex")
    const [sortOrder, setSortOrder] = useState("asc")

    // حالات الملفات والأسئلة
    const [fileToUpload, setFileToUpload] = useState(null)
    const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    
    const [questionForm, setQuestionForm] = useState({
        text: "",
        order: "",
        options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
        ]
    })
    const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false)
    const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false)
    const [editQuestionId, setEditQuestionId] = useState(null)

    const handleFormChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const resetFormData = () => {
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
        setEditItem(null)
        setLinkValidation({
            youtubeUrl: { isValid: false, message: "", checking: false, exists: false },
            googleDriveUrl: { isValid: false, message: "", checking: false, exists: false }
        })
    }

    const resetQuestionForm = () => {
        setQuestionForm({
            text: "",
            order: "",
            options: [
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false }
            ]
        })
        setEditQuestionId(null)
    }

    // جلب الاختصاصات
    const fetchSpecializations = async () => {
        try {
            const res = await getSpecializations();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data :
                Array.isArray(res.data?.data) ? res.data.data : [];
            setSpecializations(data);
        } catch (err) {
            console.error("Error fetching specializations:", err);
            showErrorToast("فشل تحميل الاختصاصات");
        }
    };

    // جلب الكورسات
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
            console.error(err);
            showErrorToast("فشل تحميل الكورسات");
        }
    };

    // جلب المستويات
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
            
            setLevels(data || []);
        } catch (err) {
            console.error("Error fetching levels:", err);
            showErrorToast("فشل تحميل المستويات");
            setLevels([]);
        }
    }

    // جلب محتوى المستوى
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
            } else if (Array.isArray(res.data?.data?.data?.data)) {
                data = res.data.data.data.data;
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }
            
            console.log("🎯 Final lessons data:", data);
            setAllLessons(data || []);
        } catch (err) {
            console.error("❌ Error fetching lessons:", err);
            showErrorToast("فشل تحميل الدروس");
            setAllLessons([]);
        } finally {
            setLoading(false);
        }
    }

    // جلب الأسئلة
    const fetchQuestions = async (levelId) => {
        try {
            const res = await getQuizByCourseLevel(levelId)
            let data = []
            if (Array.isArray(res.data?.data)) {
                data = res.data.data
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data
            }
            setQuestions(data || [])
        } catch (err) {
            console.error("Error fetching questions:", err)
            showErrorToast("فشل تحميل الأسئلة")
        }
    }

    // جلب الملفات
    const fetchFiles = async (levelId) => {
        try {
            const res = await getFilesByLevel(levelId)
            let filesData = []
            if (Array.isArray(res.data?.data)) {
                filesData = res.data.data
            }
            const filtered = filesData.filter(file => 
                file.courseLevelId === parseInt(levelId)
            )
            setFiles(filtered || [])
        } catch (err) {
            console.error("Error fetching files:", err)
            showErrorToast("فشل تحميل الملفات")
        }
    }

    useEffect(() => {
        fetchSpecializations()
    }, [])

    useEffect(() => {
        if (selectedSpecialization) {
            fetchCourses(selectedSpecialization)
            setSelectedCourse("")
            setSelectedLevel("")
        } else {
            setCourses([])
            setSelectedCourse("")
            setSelectedLevel("")
        }
    }, [selectedSpecialization])

    useEffect(() => {
        if (selectedCourse) {
            fetchCourseLevels(selectedCourse)
            setSelectedLevel("")
        } else {
            setLevels([])
            setSelectedLevel("")
        }
    }, [selectedCourse])

    useEffect(() => {
        if (selectedLevel) {
            fetchLevelLessons(selectedLevel)
            fetchQuestions(selectedLevel)
            fetchFiles(selectedLevel)
        } else {
            setAllLessons([])
            setQuestions([])
            setFiles([])
        }
    }, [selectedLevel])

    // دوال التحقق من الروابط
    const validateYouTubeUrl = (url) => {
        if (!url) return { isValid: false, message: "يرجى إدخال رابط YouTube", exists: false };
        try {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return { isValid: false, message: "يجب أن يبدأ الرابط بـ http:// أو https://", exists: false };
            }
            const urlObj = new URL(url);
            if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
                return { isValid: false, message: "يجب أن يكون الرابط من youtube.com أو youtu.be", exists: false };
            }
            const youtubeId = extractYouTubeId(url);
            if (!youtubeId || youtubeId.length !== 11) {
                return { isValid: false, message: "معرف فيديو YouTube يجب أن يكون 11 حرفاً", exists: false };
            }
            return { isValid: true, message: "جاري التحقق من وجود الفيديو...", exists: false, youtubeId };
        } catch (error) {
            return { isValid: false, message: "صيغة الرابط غير صحيحة", exists: false };
        }
    };

    const extractYouTubeId = (url) => {
        if (!url) return ""
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
        return match ? match[1] : ""
    }

    const handleYoutubeUrlChange = async (url) => {
        handleFormChange("youtubeUrl", url);
        if (!url) {
            setLinkValidation(prev => ({
                ...prev,
                youtubeUrl: { isValid: false, message: "", checking: false, exists: false }
            }));
            return;
        }
        const validation = validateYouTubeUrl(url);
        if (!validation.isValid) {
            setLinkValidation(prev => ({
                ...prev,
                youtubeUrl: validation
            }));
            return;
        }
        setLinkValidation(prev => ({
            ...prev,
            youtubeUrl: { ...validation, checking: true }
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLinkValidation(prev => ({
            ...prev,
            youtubeUrl: { ...validation, checking: false, exists: true }
        }));
        if (validation.youtubeId) {
            setForm(prev => ({
                ...prev,
                youtubeId: validation.youtubeId
            }));
        }
    };

    const LinkStatus = ({ validation }) => {
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

    const handleSave = async () => {
        if (!form.title.trim() || !form.orderIndex || !form.youtubeUrl) {
            showErrorToast("يرجى ملء جميع الحقول المطلوبة")
            return
        }

        // ✅ تحقق إضافي من صحة رابط YouTube
        if (!linkValidation.youtubeUrl.isValid || !linkValidation.youtubeUrl.exists) {
            showErrorToast("يرجى إدخال رابط YouTube صحيح")
            return
        }

        setIsSubmitting(true);
        try {
            const lessonData = {
                title: form.title,
                description: form.description || '',
                youtubeUrl: form.youtubeUrl,
                youtubeId: form.youtubeId || '',
                googleDriveUrl: form.googleDriveUrl || '',
                durationSec: parseInt(form.durationSec) || 0,
                orderIndex: parseInt(form.orderIndex),
                isFreePreview: Boolean(form.isFreePreview)
            }

            if (editItem) {
                await updateLesson(editItem.id, lessonData)
                showSuccessToast("تم تعديل الدرس بنجاح")
                setEditItem(null)
            } else {
                await createLessonForLevel(selectedLevel, lessonData)
                showSuccessToast("تم إنشاء الدرس بنجاح")
            }

            resetFormData();
            setIsDialogOpen(false);
            fetchLevelLessons(selectedLevel);
        } catch (err) {
            console.error("❌ Save error:", err);
            showErrorToast(err?.response?.data?.message || "فشل العملية");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleToggleActive = async (id, isActive) => {
        try {
            await toggleLessonStatus(id, !isActive)
            showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} الدرس بنجاح`)
            fetchLevelLessons(selectedLevel)
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة")
        }
    }

    const handleDelete = async (id, type) => {
        try {
            if (type === "lesson") {
                await deleteLesson(id)
                fetchLevelLessons(selectedLevel)
            } else if (type === "file") {
                await deleteFile(id)
                fetchFiles(selectedLevel)
            } else if (type === "question") {
                await deleteQuestion(id)
                fetchQuestions(selectedLevel)
            }
            showSuccessToast("تم الحذف بنجاح")
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل الحذف")
        }
        setDeleteDialog({ isOpen: false, itemId: null, itemName: "", type: "" })
    }

    // دوال الملفات
    const handleUploadFile = async () => {
        if (!fileToUpload) {
            showErrorToast("يرجى اختيار ملف")
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', fileToUpload)
            formData.append('courseLevelId', selectedLevel)

            const res = await uploadFile(formData)
            if (res.data?.success) {
                showSuccessToast("تم رفع الملف بنجاح")
                setFileToUpload(null)
                setIsFileDialogOpen(false)
                fetchFiles(selectedLevel)
            }
        } catch (err) {
            console.error("Error uploading file:", err)
            showErrorToast(err?.response?.data?.message || "فشل رفع الملف")
        } finally {
            setUploading(false)
        }
    }

    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return ""
        const cleanBaseUrl = BASE_URL.replace(/\/$/, "")
        const cleanFileUrl = fileUrl.replace(/^\//, "")
        return `${cleanBaseUrl}/${cleanFileUrl}`
    }

    // دوال الأسئلة
    const handleOptionChange = (index, field, value) => {
        setQuestionForm(prev => ({
            ...prev,
            options: prev.options.map((option, i) =>
                i === index ? { ...option, [field]: value } : option
            )
        }))
    }

    const handleCorrectAnswerChange = (index) => {
        setQuestionForm(prev => ({
            ...prev,
            options: prev.options.map((option, i) => ({
                ...option,
                isCorrect: i === index
            }))
        }))
    }

    const handleSaveQuestion = async () => {
        if (!questionForm.text.trim() || !questionForm.order) {
            showErrorToast("يرجى ملء جميع الحقول المطلوبة")
            return
        }

        const validOptions = questionForm.options.filter(opt => opt.text.trim() !== "")
        if (validOptions.length < 2) {
            showErrorToast("يرجى إدخال خيارين على الأقل")
            return
        }

        const hasCorrectAnswer = validOptions.some(opt => opt.isCorrect)
        if (!hasCorrectAnswer) {
            showErrorToast("يرجى تحديد الإجابة الصحيحة")
            return
        }

        setIsSubmittingQuestion(true)
        try {
            const questionData = {
                text: questionForm.text,
                order: parseInt(questionForm.order),
                options: validOptions
            }

            if (editQuestionId) {
                await updateQuestion(editQuestionId, questionData)
                showSuccessToast("تم تعديل السؤال بنجاح")
            } else {
                await addQuestion(selectedLevel, questionData)
                showSuccessToast("تم إضافة السؤال بنجاح")
            }

            resetQuestionForm()
            setIsQuestionDialogOpen(false)
            fetchQuestions(selectedLevel)
        } catch (err) {
            console.error("Error saving question:", err)
            showErrorToast(err?.response?.data?.message || "فشل حفظ السؤال")
        } finally {
            setIsSubmittingQuestion(false)
        }
    }

    const handleDeleteAllQuestions = async () => {
        try {
            await deleteQuiz(selectedLevel)
            showSuccessToast("تم حذف جميع الأسئلة بنجاح")
            fetchQuestions(selectedLevel)
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل حذف الأسئلة")
        }
    }

    // التنسيق
    const formatDuration = (seconds) => {
        if (!seconds) return "00:00"
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const formatFileSize = (size) => {
        if (!size) return "0 B"
        const units = ['B', 'KB', 'MB', 'GB']
        let sizeNumber = size
        let unitIndex = 0
        while (sizeNumber >= 1024 && unitIndex < units.length - 1) {
            sizeNumber /= 1024
            unitIndex++
        }
        return `${sizeNumber.toFixed(2)} ${units[unitIndex]}`
    }

    // فلترة وترتيب البيانات
    const filteredAndSortedLessons = useMemo(() => {
        let filtered = [...allLessons]

        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item?.title?.toLowerCase().includes(searchTerm.toLowerCase())
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

    const paginatedLessons = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredAndSortedLessons.slice(startIndex, endIndex)
    }, [filteredAndSortedLessons, currentPage, itemsPerPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, freePreviewFilter, itemsPerPage])

    const totalItems = filteredAndSortedLessons.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
    }

    const resetFilters = () => {
        setSearchTerm("")
        setStatusFilter("all")
        setFreePreviewFilter("all")
        setSortBy("orderIndex")
        setSortOrder("asc")
        setCurrentPage(1)
    }

    const renderLessonDetails = (lesson) => {
        if (!lesson) return null

        return (
            <div className="space-y-4 text-right">
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
                </div>

                {lesson.description && (
                    <div>
                        <Label className="font-bold">الوصف:</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg">{lesson.description}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {lesson.youtubeUrl && (
                        <div>
                            <Label className="font-bold">رابط YouTube:</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Youtube className="w-4 h-4 text-red-600" />
                                <a 
                                    href={lesson.youtubeUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                >
                                    {lesson.youtubeUrl}
                                </a>
                            </div>
                        </div>
                    )}
                    {lesson.googleDriveUrl && (
                        <div>
                            <Label className="font-bold">رابط Google Drive:</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Download className="w-4 h-4 text-green-600" />
                                <a 
                                    href={lesson.googleDriveUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                >
                                    {lesson.googleDriveUrl}
                                </a>
                            </div>
                        </div>
                    )}
                </div>

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
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <CardTitle>إدارة محتوى المستوى</CardTitle>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>اختر التخصص</Label>
                            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر التخصص" />
                                </SelectTrigger>
                                <SelectContent>
                                    {specializations.map(spec => (
                                        <SelectItem key={spec.id} value={spec.id.toString()}>
                                            {spec.name || spec.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>اختر الكورس</Label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={!selectedSpecialization}>
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedSpecialization ? "اختر الكورس" : "اختر التخصص أولاً"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course.id} value={course.id.toString()}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>اختر المستوى</Label>
                            <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={!selectedCourse}>
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedCourse ? "اختر المستوى" : "اختر الكورس أولاً"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {levels.map(level => (
                                        <SelectItem key={level.id} value={level.id.toString()}>
                                            {level.name} (ترتيب: {level.order})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedLevel && (
                        <div className="flex gap-2 flex-wrap">
                            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                                setIsDialogOpen(open)
                                if (!open) resetFormData()
                            }}>
                                <DialogTrigger asChild>
                                    <Button 
                                        size="sm"
                                        onClick={() => {
                                            resetFormData()
                                            setIsDialogOpen(true)
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        إضافة درس
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
                                                placeholder="أدخل وصف الدرس..." 
                                                rows={3} 
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>ترتيب الدرس *</Label>
                                                <Input 
                                                    type="number" 
                                                    value={form.orderIndex} 
                                                    onChange={(e) => handleFormChange("orderIndex", e.target.value)} 
                                                    min="1" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>مدة الدرس (ثانية)</Label>
                                                <Input 
                                                    type="number" 
                                                    value={form.durationSec} 
                                                    onChange={(e) => handleFormChange("durationSec", e.target.value)} 
                                                    min="0" 
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>رابط YouTube *</Label>
                                            <Input 
                                                value={form.youtubeUrl} 
                                                onChange={(e) => handleYoutubeUrlChange(e.target.value)} 
                                                placeholder="https://youtube.com/..." 
                                                className={linkValidation.youtubeUrl.isValid && linkValidation.youtubeUrl.exists ? "border-green-500" : 
                                                         linkValidation.youtubeUrl.isValid && !linkValidation.youtubeUrl.exists ? "border-yellow-500" : 
                                                         !linkValidation.youtubeUrl.isValid && form.youtubeUrl ? "border-red-500" : ""}
                                            />
                                            <LinkStatus validation={linkValidation.youtubeUrl} />
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

                                        <Button 
                                            onClick={handleSave} 
                                            disabled={isSubmitting || !linkValidation.youtubeUrl.isValid || !linkValidation.youtubeUrl.exists} 
                                            className="w-full"
                                        >
                                            {isSubmitting ? "جاري الحفظ..." : (editItem ? "حفظ التعديل" : "حفظ")}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Upload className="w-4 h-4 mr-1" />
                                        إضافة ملف
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>رفع ملف جديد</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-2">
                                        <div className="space-y-2">
                                            <Label>اختر الملف</Label>
                                            <Input 
                                                type="file" 
                                                onChange={(e) => setFileToUpload(e.target.files?.[0])} 
                                            />
                                            {fileToUpload && (
                                                <div className="p-3 border rounded bg-gray-50">
                                                    <p className="font-medium">{fileToUpload.name}</p>
                                                    <p className="text-sm text-muted-foreground">{formatFileSize(fileToUpload.size)}</p>
                                                </div>
                                            )}
                                        </div>
                                        <Button 
                                            onClick={handleUploadFile} 
                                            disabled={!fileToUpload || uploading} 
                                            className="w-full"
                                        >
                                            {uploading ? "جاري الرفع..." : "رفع الملف"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
                                setIsQuestionDialogOpen(open)
                                if (!open) resetQuestionForm()
                            }}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-1" />
                                        إضافة سؤال
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>{editQuestionId ? "تعديل السؤال" : "إضافة سؤال جديد"}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-2">
                                        <div className="space-y-2">
                                            <Label>نص السؤال *</Label>
                                            <Textarea 
                                                value={questionForm.text} 
                                                onChange={(e) => setQuestionForm({...questionForm, text: e.target.value})} 
                                                placeholder="أدخل نص السؤال..." 
                                                rows={3} 
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>ترتيب السؤال *</Label>
                                            <Input 
                                                type="number" 
                                                value={questionForm.order} 
                                                onChange={(e) => setQuestionForm({...questionForm, order: e.target.value})} 
                                                min="1" 
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label>خيارات الإجابة *</Label>
                                            {questionForm.options.map((option, index) => (
                                                <div key={index} className="flex items-center gap-2 p-3 border rounded">
                                                    <input 
                                                        type="radio" 
                                                        name="correctAnswer" 
                                                        checked={option.isCorrect} 
                                                        onChange={() => handleCorrectAnswerChange(index)} 
                                                        className="w-4 h-4" 
                                                    />
                                                    <Input 
                                                        value={option.text} 
                                                        onChange={(e) => handleOptionChange(index, "text", e.target.value)} 
                                                        placeholder={`الخيار ${index + 1}...`} 
                                                        className="flex-1" 
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <Button 
                                            onClick={handleSaveQuestion} 
                                            disabled={isSubmittingQuestion} 
                                            className="w-full"
                                        >
                                            {isSubmittingQuestion ? "جاري الحفظ..." : (editQuestionId ? "حفظ التعديل" : "إضافة السؤال")}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {selectedLevel && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="relative">
                                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="بحث بالعنوان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
                                </div>

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

                                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
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

                            <div className="flex justify-between items-center">
                                <div className="text-sm text-muted-foreground">
                                    عرض {filteredAndSortedLessons.length} من أصل {allLessons.length} درس
                                </div>
                                {(searchTerm || statusFilter !== "all" || freePreviewFilter !== "all") && (
                                    <Button variant="outline" size="sm" onClick={resetFilters}>
                                        إعادة تعيين الفلترة
                                    </Button>
                                )}
                            </div>
                        </>
                    )}

                    {selectedLevel && (
                        <div className="flex gap-2 flex-wrap">
                            <Button variant={activeTab === "lessons" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("lessons")}>
                                <BookOpen className="w-4 h-4 mr-1" />
                                الدروس ({allLessons.length})
                            </Button>
                            <Button variant={activeTab === "files" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("files")}>
                                <File className="w-4 h-4 mr-1" />
                                الملفات ({files.length})
                            </Button>
                            <Button variant={activeTab === "quizzes" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("quizzes")}>
                                <FileQuestion className="w-4 h-4 mr-1" />
                                الأسئلة ({questions.length})
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {!selectedLevel ? (
                    <div className="text-center py-8 text-muted-foreground">
                        يرجى اختيار التخصص والكورس والمستوى لعرض المحتوى
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === "lessons" && (
                            <>
                                <Table className="direction-rtl">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="table-header cursor-pointer hover:bg-gray-100" onClick={() => handleSort("title")}>
                                                <div className="flex items-center gap-1">
                                                    العنوان
                                                    {sortBy === "title" && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                                                </div>
                                            </TableHead>
                                            <TableHead className="table-header cursor-pointer hover:bg-gray-100" onClick={() => handleSort("orderIndex")}>
                                                <div className="flex items-center gap-1">
                                                    الترتيب
                                                    {sortBy === "orderIndex" && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                                                </div>
                                            </TableHead>
                                            <TableHead className="table-header">المدة</TableHead>
                                            <TableHead className="table-header">المعاينة</TableHead>
                                            <TableHead className="table-header">الحالة</TableHead>
                                            <TableHead className="table-header text-right">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedLessons.length > 0 ? paginatedLessons.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="table-cell font-medium">
                                                    <div>
                                                        <div>{item.title || "بدون عنوان"}</div>
                                                        {item.description && <div className="text-sm text-muted-foreground truncate max-w-[200px]">{item.description}</div>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <Badge variant="secondary">{item.orderIndex || "0"}</Badge>
                                                </TableCell>
                                                <TableCell className="table-cell">{formatDuration(item.durationSec)}</TableCell>
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
                                                    <Button size="icon" variant="ghost" onClick={() => setDetailDialog({ isOpen: true, lesson: item })} title="عرض التفاصيل">
                                                        <Info className="w-4 h-4" />
                                                    </Button>
                                                    {item.youtubeUrl && (
                                                        <Button size="icon" variant="ghost" onClick={() => window.open(item.youtubeUrl, '_blank')} title="مشاهدة على YouTube">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" onClick={() => handleToggleActive(item.id, item.isActive)} title={item.isActive ? "تعطيل" : "تفعيل"}>
                                                        {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => {
                                                        setEditItem(item)
                                                        setForm({
                                                            title: item.title || "",
                                                            description: item.description || "",
                                                            youtubeUrl: item.youtubeUrl || "",
                                                            youtubeId: item.youtubeId || "",
                                                            googleDriveUrl: item.googleDriveUrl || "",
                                                            durationSec: item.durationSec || "",
                                                            orderIndex: item.orderIndex || "",
                                                            isFreePreview: Boolean(item.isFreePreview)
                                                        })
                                                        setIsDialogOpen(true)
                                                    }} title="تعديل">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id, itemName: item.title, type: "lesson" })} title="حذف">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    {allLessons.length === 0 ? "لا توجد دروس" : "لم يتم العثور على نتائج"}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {paginatedLessons.length > 0 && (
                                    <div className="flex items-center justify-between gap-4 mt-6">
                                        <div className="text-sm text-muted-foreground">
                                            عرض {startItem} - {endItem} من أصل {totalItems}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNumber = currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i
                                                return (
                                                    <Button key={pageNumber} variant={currentPage === pageNumber ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNumber)}>
                                                        {pageNumber}
                                                    </Button>
                                                )
                                            })}
                                            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "files" && (
                            <div className="space-y-3">
                                {files.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">لا توجد ملفات</div>
                                ) : (
                                    files.map(file => (
                                        <Card key={file.id} className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{file.name}</h3>
                                                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                                        <span>{formatFileSize(file.size)}</span>
                                                        <span>تم الرفع: {file.createdAt ? new Date(file.createdAt).toLocaleDateString('ar') : 'N/A'}</span>
                                                        <Badge variant="outline" className="text-xs">{file.type?.split('/')[1]?.toUpperCase() || 'FILE'}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {file.url && (
                                                        <Button size="sm" variant="ghost" onClick={() => window.open(getFileUrl(file.url), '_blank')} title="تحميل">
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({ isOpen: true, itemId: file.id, itemName: file.name, type: "file" })} title="حذف">
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === "quizzes" && (
                            <div className="space-y-3">
                                {questions.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">لا توجد أسئلة</div>
                                ) : (
                                    <>
                                        {questions.length > 0 && (
                                            <div className="flex justify-end mb-4">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="destructive">
                                                            <Trash2 className="w-4 h-4 ml-1" />
                                                            حذف الجميع
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>حذف جميع الأسئلة</AlertDialogTitle>
                                                            <AlertDialogDescription>هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDeleteAllQuestions} className="bg-red-600">حذف</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                        {questions.map(question => (
                                            <Card key={question.id} className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant="secondary">{question.order}</Badge>
                                                            <h3 className="font-medium">{question.text}</h3>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button size="sm" variant="ghost" onClick={() => {
                                                            setQuestionForm({
                                                                text: question.text,
                                                                order: question.order.toString(),
                                                                options: question.options || []
                                                            })
                                                            setEditQuestionId(question.id)
                                                            setIsQuestionDialogOpen(true)
                                                        }} title="تعديل">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({ isOpen: true, itemId: question.id, itemName: question.text, type: "question" })} title="حذف">
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 ml-4">
                                                    {question.options?.map((option, idx) => (
                                                        <div key={idx} className={`flex items-center gap-2 p-2 rounded ${option.isCorrect ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                            {option.isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                                                            <span className={option.isCorrect ? 'font-medium text-green-800' : ''}>{option.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            <Dialog open={detailDialog.isOpen} onOpenChange={(open) => setDetailDialog({ isOpen: open, lesson: null })}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل الدرس</DialogTitle>
                    </DialogHeader>
                    {renderLessonDetails(detailDialog.lesson)}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({...deleteDialog, isOpen: open})}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من حذف: "{deleteDialog.itemName}"؟</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(deleteDialog.itemId, deleteDialog.type)} className="bg-red-600">حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

export default Lesson