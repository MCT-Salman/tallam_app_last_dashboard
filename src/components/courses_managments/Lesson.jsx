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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Youtube, Download, Info, CheckCircle, XCircle, Clock, BookOpen, File, Upload, FileQuestion, Filter, FileText, Image, Archive, Video, Music, ListOrdered, HelpCircle } from "lucide-react"
import { getLevelLessons, createLessonForLevel, updateLesson, deleteLesson, toggleLessonStatus } from "@/api/api"
import { getCourses } from "@/api/api"
import { getCourseLevels } from "@/api/api"
import { getSpecializations } from "@/api/api"
import { getQuizByCourseLevel, addQuestion, updateQuestion, deleteQuestion, deleteQuiz, uploadFile, deleteFile, getFilesByLevel, getInstructorsByCourse } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"
import { BASE_URL } from "@/api/api"

const Lesson = () => {
    const [allLessons, setAllLessons] = useState([])
    const [specializations, setSpecializations] = useState([])
    const [instructors, setInstructors] = useState([])
    const [courses, setCourses] = useState([])
    const [levels, setLevels] = useState([])
    const [files, setFiles] = useState([])
    const [questions, setQuestions] = useState([])
    const [activeTab, setActiveTab] = useState("lessons")

    const [selectedSpecialization, setSelectedSpecialization] = useState("")
    const [selectedCourse, setSelectedCourse] = useState("")
    const [selectedInstructor, setSelectedInstructor] = useState("")
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
    const [fileDetailDialog, setFileDetailDialog] = useState({ isOpen: false, file: null })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Search states for selects
    const [specializationSearch, setSpecializationSearch] = useState("")
    const [courseSearch, setCourseSearch] = useState("")
    const [instructorSearch, setInstructorSearch] = useState("")
    const [levelSearch, setLevelSearch] = useState("")

    // حالات التحقق من الروابط
    const [linkValidation, setLinkValidation] = useState({
        youtubeUrl: { isValid: false, message: "", checking: false, exists: false },
        googleDriveUrl: { isValid: false, message: "", checking: false, exists: false }
    })

    // حالات البحث والترتيب للدروس
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [statusFilter, setStatusFilter] = useState("all")
    const [freePreviewFilter, setFreePreviewFilter] = useState("all")
    const [sortBy, setSortBy] = useState("orderIndex")
    const [sortOrder, setSortOrder] = useState("asc")

    // حالات الملفات
    const [fileToUpload, setFileToUpload] = useState(null)
    const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [fileSearchTerm, setFileSearchTerm] = useState("")
    const [fileTypeFilter, setFileTypeFilter] = useState("all")
    const [fileCurrentPage, setFileCurrentPage] = useState(1)
    const [fileItemsPerPage, setFileItemsPerPage] = useState(10)
    const [fileSortBy, setFileSortBy] = useState("createdAt")
    const [fileSortOrder, setFileSortOrder] = useState("desc")

    // حالات الأسئلة
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
    const [questionDetailDialog, setQuestionDetailDialog] = useState({ isOpen: false, question: null })

    // ✅ إضافة حالة لتحميل الأسئلة
    const [loadingQuestions, setLoadingQuestions] = useState(false)

    // Pagination states for questions
    const [questionCurrentPage, setQuestionCurrentPage] = useState(1)
    const [questionItemsPerPage, setQuestionItemsPerPage] = useState(10)
    const [questionSortBy, setQuestionSortBy] = useState("order")
    const [questionSortOrder, setQuestionSortOrder] = useState("asc")

    // الدوال المفقودة
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

    // جلب الكورسات بناءً على الاختصاص المحدد
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

    // ✅ جلب المدرسين بناءً على الكورس المحدد
    const fetchInstructorsByCourse = async (courseId) => {
        if (!courseId) {
            setInstructors([]);
            setSelectedInstructor("");
            return;
        }

        try {
            console.log("🔄 Fetching instructors for course:", courseId);
            const res = await getInstructorsByCourse(courseId);
            console.log("📊 Instructors API full response:", res);

            let data = [];
            if (Array.isArray(res.data?.data?.instructors)) {
                data = res.data.data.instructors;
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }

            console.log("✅ Extracted instructors for course:", data);
            setInstructors(data || []);
        } catch (err) {
            console.error("❌ Error fetching instructors:", err);
            showErrorToast("فشل تحميل المدرسين");
            setInstructors([]);
        }
    };

    // ✅ جلب المستويات بناءً على المدرس المحدد
    const fetchLevelsByInstructor = async (instructorId) => {
        if (!instructorId) {
            setLevels([]);
            setSelectedLevel("");
            return;
        }

        try {
            // البحث عن المدرس المحدد للحصول على levelIds
            const selectedInstructorData = instructors.find(inst => inst.id === parseInt(instructorId));

            if (!selectedInstructorData || !selectedInstructorData.levelIds) {
                setLevels([]);
                return;
            }

            // جلب كل المستويات للكورس أولاً
            const res = await getCourseLevels(selectedCourse);
            console.log("Full levels response:", res);

            let allLevels = [];
            if (Array.isArray(res.data?.data)) {
                if (res.data.data.length > 0 && Array.isArray(res.data.data[0])) {
                    allLevels = res.data.data[0];
                } else {
                    allLevels = res.data.data;
                }
            } else if (Array.isArray(res.data?.data?.items)) {
                allLevels = res.data.data.items;
            } else if (Array.isArray(res.data?.data?.data)) {
                allLevels = res.data.data.data;
            }

            // ✅ فلترة المستويات حسب levelIds الخاص بالمدرس
            const filteredLevels = allLevels.filter(level =>
                selectedInstructorData.levelIds.includes(level.id)
            );

            console.log("Filtered levels by instructor:", filteredLevels);
            setLevels(filteredLevels || []);
        } catch (err) {
            console.error("Error fetching levels:", err);
            showErrorToast("فشل تحميل مستويات المدرس");
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

    // ✅ جلب الأسئلة - إصدار مبسط
    const fetchQuestions = async (levelId) => {
        if (!levelId) {
            setQuestions([])
            return
        }

        setLoadingQuestions(true)
        try {
            const res = await getQuizByCourseLevel(levelId)
            console.log("📝 Questions API response:", res)

            // إذا كان هناك رسالة تفيد بعدم وجود أسئلة
            const errorMessage = res.data?.message || res.data?.data?.message || '';
            if (errorMessage.includes("لا يوجد أسئلة لهذا المستوى")) {
                setQuestions([])
                return
            }

            // إذا لم تكن هناك بيانات
            if (!res.data?.data || (Array.isArray(res.data.data) && res.data.data.length === 0)) {
                setQuestions([])
                return
            }

            // استخراج البيانات
            let data = Array.isArray(res.data.data) ? res.data.data :
                Array.isArray(res.data.data?.data) ? res.data.data.data :
                    res.data.data ? [res.data.data] : [];

            setQuestions(data)
        } catch (err) {
            console.error("❌ Error fetching questions:", err)
            // في حالة الخطأ، أعيد تعيين الأسئلة إلى فارغ
            setQuestions([])
        } finally {
            setLoadingQuestions(false)
        }
    }

    // ✅ جلب الملفات - محسّن
    const fetchFiles = async (levelId) => {
        if (!levelId) {
            setFiles([])
            return
        }

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
            setFiles([])
        }
    }

    // دوال الملفات
    const getFileIcon = (fileType) => {
        if (!fileType) return <FileQuestion className="w-5 h-5" />

        if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />
        if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />
        if (fileType.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500" />
        if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
        if (fileType.includes('word') || fileType.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileText className="w-5 h-5 text-green-600" />
        if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5 text-yellow-600" />

        return <File className="w-5 h-5 text-gray-500" />
    }

    const getFileTypeText = (fileType) => {
        if (!fileType) return "غير معروف"

        if (fileType.startsWith('image/')) return "صورة"
        if (fileType.startsWith('video/')) return "فيديو"
        if (fileType.startsWith('audio/')) return "صوت"
        if (fileType.includes('pdf')) return "PDF"
        if (fileType.includes('word') || fileType.includes('document')) return "مستند Word"
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return "جدول Excel"
        if (fileType.includes('zip') || fileType.includes('rar')) return "ملف مضغوط"

        return fileType
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

    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد"
        return new Date(dateString).toLocaleDateString('ar-SA')
    }

    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return ""
        const cleanBaseUrl = BASE_URL.replace(/\/$/, "")
        const cleanFileUrl = fileUrl.replace(/^\//, "")
        return `${cleanBaseUrl}/${cleanFileUrl}`
    }

    const handleUploadFile = async () => {
        if (!fileToUpload) {
            showErrorToast("يرجى اختيار ملف")
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()

            // ✅ إضافة الملف بشكل صحيح
            formData.append('file', fileToUpload)
            formData.append('courseLevelId', selectedLevel)

            // ✅ يمكن إضافة الاسم كحقل منفصل إذا كان السيرفر يتوقعه
            formData.append('originalFileName', fileToUpload.name)

            console.log("📤 FormData contents:");
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            const res = await uploadFile(formData)
            if (res.data?.success) {
                showSuccessToast("تم رفع الملف بنجاح")
                setFileToUpload(null)
                setIsFileDialogOpen(false)
                fetchFiles(selectedLevel)
            }
        } catch (err) {
            console.error("❌ Upload error details:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            showErrorToast(err?.response?.data?.message || "فشل رفع الملف")
        } finally {
            setUploading(false)
        }
    }

    // تفاصيل الملف
    const renderFileDetails = (file) => {
        if (!file) return null

        return (
            <div className="space-y-6 text-right">
                {/* المعلومات الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="font-bold">اسم الملف:</Label>
                        <p className="mt-1 text-lg">{file.name}</p>
                    </div>
                    <div>
                        <Label className="font-bold">نوع الملف:</Label>
                        <p className="mt-1">
                            <Badge variant="outline">
                                {getFileTypeText(file.type)}
                            </Badge>
                        </p>
                    </div>
                    <div>
                        <Label className="font-bold">حجم الملف:</Label>
                        <p className="mt-1">{formatFileSize(file.size)}</p>
                    </div>
                    <div>
                        <Label className="font-bold">تاريخ الرفع:</Label>
                        <p className="mt-1">{formatDate(file.createdAt)}</p>
                    </div>
                </div>

                {/* معلومات التصنيف الهرمي */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-3">معلومات التصنيف:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <Label className="font-medium">الاختصاص:</Label>
                            <p>{getSpecializationName(selectedSpecialization)}</p>
                        </div>
                        <div>
                            <Label className="font-medium">الكورس:</Label>
                            <p>{getCourseName(selectedCourse)}</p>
                        </div>
                        <div>
                            <Label className="font-medium">المدرس:</Label>
                            <p>{getInstructorName(selectedInstructor)}</p>
                        </div>
                        <div>
                            <Label className="font-medium">المستوى:</Label>
                            <p>{getLevelName(selectedLevel)}</p>
                        </div>
                    </div>
                </div>

                {/* رابط التحميل */}
                <div className="border-t pt-4">
                    <Label className="font-bold">رابط التحميل:</Label>
                    <div className="mt-2">
                        <a
                            href={getFileUrl(file.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                        >
                            {getFileUrl(file.url)}
                        </a>
                    </div>
                    <div className="mt-2">
                        <Button
                            size="sm"
                            onClick={() => window.open(getFileUrl(file.url), '_blank')}
                        >
                            <Download className="w-4 h-4 ml-1" />
                            تحميل الملف
                        </Button>
                    </div>
                </div>

                {/* معلومات إضافية */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">معلومات إضافية:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-medium">معرف الملف:</Label>
                            <p>{file.id || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">معرف المستوى:</Label>
                            <p>{file.courseLevelId || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">آخر تحديث:</Label>
                            <p>{formatDate(file.updatedAt)}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Filtered data for selects with search
    const filteredSpecializations = useMemo(() => {
        if (!specializationSearch) return specializations;
        return specializations.filter(spec =>
            spec.name?.toLowerCase().includes(specializationSearch.toLowerCase()) ||
            spec.title?.toLowerCase().includes(specializationSearch.toLowerCase())
        );
    }, [specializations, specializationSearch]);

    const filteredCoursesForSelect = useMemo(() => {
        if (!courseSearch) return courses;
        return courses.filter(course =>
            course.title?.toLowerCase().includes(courseSearch.toLowerCase())
        );
    }, [courses, courseSearch]);

    const filteredInstructorsForSelect = useMemo(() => {
        if (!instructorSearch) return instructors;
        return instructors.filter(instructor =>
            instructor.name?.toLowerCase().includes(instructorSearch.toLowerCase())
        );
    }, [instructors, instructorSearch]);

    const filteredLevelsForSelect = useMemo(() => {
        if (!levelSearch) return levels;
        return levels.filter(level =>
            level.name?.toLowerCase().includes(levelSearch.toLowerCase())
        );
    }, [levels, levelSearch]);

    useEffect(() => {
        fetchSpecializations()
    }, [])

    // ✅ عند تغيير الاختصاص المحدد
    useEffect(() => {
        if (selectedSpecialization) {
            fetchCourses(selectedSpecialization);
            setSelectedCourse("");
            setSelectedInstructor("");
            setSelectedLevel("");
        } else {
            setCourses([]);
            setSelectedCourse("");
            setSelectedInstructor("");
            setSelectedLevel("");
        }
    }, [selectedSpecialization])

    // ✅ عند تغيير الكورس المحدد
    useEffect(() => {
        if (selectedCourse) {
            fetchInstructorsByCourse(selectedCourse);
            setSelectedInstructor("");
            setSelectedLevel("");
        } else {
            setInstructors([]);
            setSelectedInstructor("");
            setSelectedLevel("");
        }
    }, [selectedCourse])

    // ✅ عند تغيير المدرس المحدد
    useEffect(() => {
        if (selectedInstructor) {
            fetchLevelsByInstructor(selectedInstructor);
            setSelectedLevel("");
        } else {
            setLevels([]);
            setSelectedLevel("");
        }
    }, [selectedInstructor, selectedCourse])

    // ✅ تأثير محسّن عند تغيير المستوى
    useEffect(() => {
        if (selectedLevel) {
            console.log("🔄 Fetching content for level:", selectedLevel)
            fetchLevelLessons(selectedLevel)
            fetchQuestions(selectedLevel)
            fetchFiles(selectedLevel)
        } else {
            console.log("🔄 Clearing content - no level selected")
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

    // الحصول على اسم الاختصاص
    const getSpecializationName = (specializationId) => {
        const specialization = specializations.find(spec => spec.id === parseInt(specializationId))
        return specialization ? (specialization.name || specialization.title) : "غير محدد"
    }

    // الحصول على اسم الكورس
    const getCourseName = (courseId) => {
        const course = courses.find(crs => crs.id === parseInt(courseId))
        return course ? course.title : "غير محدد"
    }

    // الحصول على اسم المدرس
    const getInstructorName = (instructorId) => {
        const instructor = instructors.find(inst => inst.id === parseInt(instructorId));
        return instructor ? instructor.name : "غير محدد";
    };

    // الحصول على اسم المستوى
    const getLevelName = (levelId) => {
        const level = levels.find(lvl => lvl.id === parseInt(levelId))
        return level ? level.name : "غير محدد"
    }

    // Reset all selections
    const resetAllSelections = () => {
        setSelectedSpecialization("")
        setSelectedCourse("")
        setSelectedInstructor("")
        setSelectedLevel("")
        setAllLessons([])
        setQuestions([])
        setFiles([])
        setSearchTerm("")
        setCurrentPage(1)
        setSpecializationSearch("")
        setCourseSearch("")
        setInstructorSearch("")
        setLevelSearch("")
    }

    // التنسيق
    const formatDuration = (seconds) => {
        if (!seconds) return "00:00"
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // فلترة وترتيب البيانات للدروس
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

    // فلترة وترتيب البيانات للملفات
    const filteredAndSortedFiles = useMemo(() => {
        let filtered = [...files]

        if (fileSearchTerm.trim()) {
            filtered = filtered.filter(file =>
                file.name?.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
                file.type?.toLowerCase().includes(fileSearchTerm.toLowerCase())
            )
        }

        if (fileTypeFilter !== "all") {
            filtered = filtered.filter(file => {
                if (fileTypeFilter === "image") return file.type?.startsWith('image/')
                if (fileTypeFilter === "video") return file.type?.startsWith('video/')
                if (fileTypeFilter === "audio") return file.type?.startsWith('audio/')
                if (fileTypeFilter === "document") return file.type?.includes('pdf') || file.type?.includes('word') || file.type?.includes('document')
                if (fileTypeFilter === "archive") return file.type?.includes('zip') || file.type?.includes('rar')
                return true
            })
        }

        filtered.sort((a, b) => {
            let aValue, bValue

            switch (fileSortBy) {
                case "name":
                    aValue = a.name?.toLowerCase() || ""
                    bValue = b.name?.toLowerCase() || ""
                    break
                case "size":
                    aValue = a.size || 0
                    bValue = b.size || 0
                    break
                case "type":
                    aValue = a.type?.toLowerCase() || ""
                    bValue = b.type?.toLowerCase() || ""
                    break
                case "createdAt":
                    aValue = new Date(a.createdAt) || new Date(0)
                    bValue = new Date(b.createdAt) || new Date(0)
                    break
                default:
                    aValue = new Date(a.createdAt) || new Date(0)
                    bValue = new Date(b.createdAt) || new Date(0)
            }

            if (aValue < bValue) return fileSortOrder === "asc" ? -1 : 1
            if (aValue > bValue) return fileSortOrder === "asc" ? 1 : -1
            return 0
        })

        return filtered
    }, [files, fileSearchTerm, fileTypeFilter, fileSortBy, fileSortOrder])

    const paginatedFiles = useMemo(() => {
        const startIndex = (fileCurrentPage - 1) * fileItemsPerPage
        const endIndex = startIndex + fileItemsPerPage
        return filteredAndSortedFiles.slice(startIndex, endIndex)
    }, [filteredAndSortedFiles, fileCurrentPage, fileItemsPerPage])

    // فلترة وترتيب البيانات للأسئلة
    const filteredAndSortedQuestions = useMemo(() => {
        let filtered = [...questions]

        if (searchTerm.trim()) {
            filtered = filtered.filter(question =>
                question.text?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        filtered.sort((a, b) => {
            let aValue, bValue

            switch (questionSortBy) {
                case "text":
                    aValue = a.text?.toLowerCase() || ""
                    bValue = b.text?.toLowerCase() || ""
                    break
                case "order":
                    aValue = parseInt(a.order) || 0
                    bValue = parseInt(b.order) || 0
                    break
                default:
                    aValue = parseInt(a.order) || 0
                    bValue = parseInt(b.order) || 0
            }

            if (aValue < bValue) return questionSortOrder === "asc" ? -1 : 1
            if (aValue > bValue) return questionSortOrder === "asc" ? 1 : -1
            return 0
        })

        return filtered
    }, [questions, searchTerm, questionSortBy, questionSortOrder])

    const paginatedQuestions = useMemo(() => {
        const startIndex = (questionCurrentPage - 1) * questionItemsPerPage
        const endIndex = startIndex + questionItemsPerPage
        return filteredAndSortedQuestions.slice(startIndex, endIndex)
    }, [filteredAndSortedQuestions, questionCurrentPage, questionItemsPerPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, freePreviewFilter, itemsPerPage])

    useEffect(() => {
        setFileCurrentPage(1)
    }, [fileSearchTerm, fileTypeFilter, fileItemsPerPage])

    useEffect(() => {
        setQuestionCurrentPage(1)
    }, [searchTerm, questionItemsPerPage])

    const totalItems = filteredAndSortedLessons.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    const fileTotalItems = filteredAndSortedFiles.length
    const fileTotalPages = Math.ceil(fileTotalItems / fileItemsPerPage)
    const fileStartItem = (fileCurrentPage - 1) * fileItemsPerPage + 1
    const fileEndItem = Math.min(fileCurrentPage * fileItemsPerPage, fileTotalItems)

    const questionTotalItems = filteredAndSortedQuestions.length
    const questionTotalPages = Math.ceil(questionTotalItems / questionItemsPerPage)
    const questionStartItem = (questionCurrentPage - 1) * questionItemsPerPage + 1
    const questionEndItem = Math.min(questionCurrentPage * questionItemsPerPage, questionTotalItems)

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const handleFilePageChange = (page) => {
        if (page >= 1 && page <= fileTotalPages) {
            setFileCurrentPage(page)
        }
    }

    const handleQuestionPageChange = (page) => {
        if (page >= 1 && page <= questionTotalPages) {
            setQuestionCurrentPage(page)
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

    const handleFileSort = (field) => {
        if (fileSortBy === field) {
            setFileSortOrder(fileSortOrder === "asc" ? "desc" : "asc")
        } else {
            setFileSortBy(field)
            setFileSortOrder("asc")
        }
    }

    const handleQuestionSort = (field) => {
        if (questionSortBy === field) {
            setQuestionSortOrder(questionSortOrder === "asc" ? "desc" : "asc")
        } else {
            setQuestionSortBy(field)
            setQuestionSortOrder("asc")
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

    const resetFileFilters = () => {
        setFileSearchTerm("")
        setFileTypeFilter("all")
        setFileSortBy("createdAt")
        setFileSortOrder("desc")
        setFileCurrentPage(1)
    }

    const resetQuestionFilters = () => {
        setSearchTerm("")
        setQuestionSortBy("order")
        setQuestionSortOrder("asc")
        setQuestionCurrentPage(1)
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

    const renderQuestionDetails = (question) => {
        if (!question) return null

        return (
            <div className="space-y-6 text-right">
                {/* المعلومات الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="font-bold">نص السؤال:</Label>
                        <p className="mt-1 text-lg">{question.text}</p>
                    </div>
                    <div>
                        <Label className="font-bold">ترتيب السؤال:</Label>
                        <p className="mt-1">
                            <Badge variant="secondary">{question.order}</Badge>
                        </p>
                    </div>
                    <div>
                        <Label className="font-bold">معرف السؤال:</Label>
                        <p className="mt-1">{question.id}</p>
                    </div>
                    <div>
                        <Label className="font-bold">عدد الخيارات:</Label>
                        <p className="mt-1">{question.options?.length || 0}</p>
                    </div>
                </div>

                {/* الخيارات */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-3">خيارات الإجابة:</h3>
                    <div className="space-y-3">
                        {question.options?.map((option, index) => (
                            <div key={option.id} className={`p-3 rounded-lg border ${option.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {option.isCorrect ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-gray-400" />
                                        )}
                                        <span className={option.isCorrect ? "font-semibold text-green-800" : "text-gray-700"}>
                                            {option.text}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {option.isCorrect && (
                                            <Badge variant="default" className="bg-green-600">
                                                الإجابة الصحيحة
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // مكون بطاقة الملف للعرض على الجوال
    const FileCard = ({ file }) => (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg truncate">{file.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                        {getFileTypeText(file.type)}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {formatFileSize(file.size)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">المستوى:</span>
                            <span className="flex-1 truncate">{getLevelName(file.courseLevelId)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">التاريخ:</span>
                            <span>{formatDate(file.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFileDetailDialog({ isOpen: true, file })}
                        className="flex-1"
                    >
                        <Eye className="w-4 h-4 ml-1" />
                        التفاصيل
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getFileUrl(file.url), '_blank')}
                        className="flex-1"
                    >
                        <Download className="w-4 h-4 ml-1" />
                        تحميل
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({
                            isOpen: true,
                            itemId: file.id,
                            itemName: file.name || "بدون اسم",
                            type: "file"
                        })}
                        className="flex-1"
                    >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    // مكون بطاقة السؤال للعرض على الجوال
    const QuestionCard = ({ question }) => (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">{question.text}</h3>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">ترتيب: {question.order}</Badge>
                                <Badge variant="outline">
                                    {question.options?.filter(opt => opt.isCorrect).length > 0 ? 'به إجابة صحيحة' : 'بدون إجابة صحيحة'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* الخيارات */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">خيارات الإجابة:</Label>
                        {question.options?.map((option, index) => (
                            <div key={option.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                {option.isCorrect ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                                <span className={`text-sm flex-1 ${option.isCorrect ? 'font-medium text-green-800' : 'text-gray-700'}`}>
                                    {option.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQuestionDetailDialog({ isOpen: true, question })}
                        className="flex-1"
                    >
                        <Eye className="w-4 h-4 ml-1" />
                        التفاصيل
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setQuestionForm({
                                text: question.text,
                                order: question.order.toString(),
                                options: question.options || []
                            })
                            setEditQuestionId(question.id)
                            setIsQuestionDialogOpen(true)
                        }}
                        className="flex-1"
                    >
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({
                            isOpen: true,
                            itemId: question.id,
                            itemName: question.text || "بدون نص",
                            type: "question"
                        })}
                        className="flex-1"
                    >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <CardTitle>إدارة محتوى المستوى</CardTitle>

                <div className="space-y-4">
                    {/* ✅ مسار الاختيار */}
                    {(selectedSpecialization || selectedCourse || selectedInstructor || selectedLevel) && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-medium">
                                <span className="text-blue-700">المسار المختار:</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="bg-white">
                                        {selectedSpecialization ? getSpecializationName(selectedSpecialization) : "---"}
                                    </Badge>
                                    <ChevronRight className="h-4 w-4 text-blue-500" />
                                    <Badge variant="outline" className="bg-white">
                                        {selectedCourse ? getCourseName(selectedCourse) : "---"}
                                    </Badge>
                                    <ChevronRight className="h-4 w-4 text-blue-500" />
                                    <Badge variant="outline" className="bg-white">
                                        {selectedInstructor ? getInstructorName(selectedInstructor) : "---"}
                                    </Badge>
                                    <ChevronRight className="h-4 w-4 text-blue-500" />
                                    <Badge variant="outline" className="bg-white">
                                        {selectedLevel ? getLevelName(selectedLevel) : "---"}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetAllSelections}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        إعادة تعيين الكل
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* ✅ اختيار الاختصاص */}
                        <div className="space-y-2">
                            <Label>الاختصاص</Label>
                            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الاختصاص" />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="p-2">
                                        <Input
                                            placeholder="ابحث عن اختصاص..."
                                            value={specializationSearch}
                                            onChange={(e) => setSpecializationSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                    </div>
                                    {filteredSpecializations.map((spec) => (
                                        <SelectItem key={spec.id} value={spec.id.toString()}>
                                            {spec.name || spec.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ✅ اختيار الكورس */}
                        <div className="space-y-2">
                            <Label>الكورس</Label>
                            <Select
                                value={selectedCourse}
                                onValueChange={setSelectedCourse}
                                disabled={!selectedSpecialization}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedSpecialization ? "اختر الكورس" : "اختر الاختصاص أولاً"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="p-2">
                                        <Input
                                            placeholder="ابحث عن كورس..."
                                            value={courseSearch}
                                            onChange={(e) => setCourseSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                    </div>
                                    {filteredCoursesForSelect.map((course) => (
                                        <SelectItem key={course.id} value={course.id.toString()}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ✅ اختيار المدرس */}
                        <div className="space-y-2">
                            <Label>المدرس</Label>
                            <Select
                                value={selectedInstructor}
                                onValueChange={setSelectedInstructor}
                                disabled={!selectedCourse}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedCourse ? "اختر المدرس" : "اختر الكورس أولاً"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="p-2">
                                        <Input
                                            placeholder="ابحث عن مدرس..."
                                            value={instructorSearch}
                                            onChange={(e) => setInstructorSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                    </div>
                                    {filteredInstructorsForSelect.map((instructor) => (
                                        <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                            {instructor.name}
                                        </SelectItem>
                                    ))}
                                    {filteredInstructorsForSelect.length === 0 && selectedCourse && (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            لا توجد مدرسين لهذا الكورس
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ✅ اختيار المستوى */}
                        <div className="space-y-2">
                            <Label>المستوى</Label>
                            <Select
                                value={selectedLevel}
                                onValueChange={setSelectedLevel}
                                disabled={!selectedInstructor}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedInstructor ? "اختر المستوى" : "اختر المدرس أولاً"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="p-2">
                                        <Input
                                            placeholder="ابحث عن مستوى..."
                                            value={levelSearch}
                                            onChange={(e) => setLevelSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                    </div>
                                    {filteredLevelsForSelect.map((level) => (
                                        <SelectItem key={level.id} value={level.id.toString()}>
                                            {level.name} (ترتيب: {level.order})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {!selectedLevel ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {!selectedSpecialization ? "يرجى اختيار اختصاص أولاً" :
                            !selectedCourse ? "يرجى اختيار كورس أولاً" :
                                !selectedInstructor ? "يرجى اختيار مدرس أولاً" :
                                    "يرجى اختيار مستوى لعرض المحتوى"}
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
                        <TabsList className="grid grid-cols-3 gap-2 bg-muted rounded-lg p-1">
                            <TabsTrigger value="lessons" className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                الدروس ({allLessons.length})
                            </TabsTrigger>
                            <TabsTrigger value="files" className="flex items-center gap-2">
                                <File className="w-4 h-4" />
                                الملفات ({files.length})
                            </TabsTrigger>
                            <TabsTrigger value="quizzes" className="flex items-center gap-2">
                                <FileQuestion className="w-4 h-4" />
                                الأسئلة ({questions.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* محتوى تاب الدروس */}
                        <TabsContent value="lessons" className="space-y-4 mt-4">
                            <div className="flex justify-between items-center">
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

                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="بحث بالعنوان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10 w-48" />
                                    </div>

                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="الحالة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">جميع الحالات</SelectItem>
                                            <SelectItem value="active">نشط</SelectItem>
                                            <SelectItem value="inactive">معطل</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={freePreviewFilter} onValueChange={setFreePreviewFilter}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder="المعاينة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">جميع الدروس</SelectItem>
                                            <SelectItem value="free">معاينة مجانية</SelectItem>
                                            <SelectItem value="paid">بدون معاينة</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {(searchTerm || statusFilter !== "all" || freePreviewFilter !== "all") && (
                                        <Button variant="outline" size="sm" onClick={resetFilters}>
                                            <Filter className="w-4 h-4 ml-1" />
                                            إعادة تعيين
                                        </Button>
                                    )}
                                </div>
                            </div>

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
                        </TabsContent>

                        {/* محتوى تاب الملفات */}
                        <TabsContent value="files" className="space-y-4 mt-4">
                            <div className="flex justify-between items-center">
                                <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
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
                                                        <div className="flex items-center gap-2">
                                                            {getFileIcon(fileToUpload.type)}
                                                            <div>
                                                                <p className="font-medium">{fileToUpload.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {formatFileSize(fileToUpload.size)}
                                                                </p>
                                                            </div>
                                                        </div>
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

                                {/* أدوات البحث والفلترة للملفات */}
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="بحث باسم الملف..."
                                            value={fileSearchTerm}
                                            onChange={(e) => setFileSearchTerm(e.target.value)}
                                            className="pr-10 w-48"
                                        />
                                    </div>

                                    <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="النوع" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">جميع الأنواع</SelectItem>
                                            <SelectItem value="image">الصور</SelectItem>
                                            <SelectItem value="video">الفيديوهات</SelectItem>
                                            <SelectItem value="audio">الصوتيات</SelectItem>
                                            <SelectItem value="document">المستندات</SelectItem>
                                            <SelectItem value="archive">ملفات مضغوطة</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={fileItemsPerPage.toString()}
                                        onValueChange={(value) => setFileItemsPerPage(Number(value))}
                                        className="w-32"
                                    >
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

                                    {(fileSearchTerm || fileTypeFilter !== "all") && (
                                        <Button variant="outline" size="sm" onClick={resetFileFilters}>
                                            <Filter className="w-4 h-4 ml-1" />
                                            إعادة تعيين
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Table View for files - for medium screens and up */}
                            <div className="hidden md:block">
                                <Table className="direction-rtl">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="table-header">الملف</TableHead>
                                            <TableHead
                                                className="table-header cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleFileSort("name")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    الاسم
                                                    {fileSortBy === "name" && <span>{fileSortOrder === "asc" ? "↑" : "↓"}</span>}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="table-header cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleFileSort("type")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    النوع
                                                    {fileSortBy === "type" && <span>{fileSortOrder === "asc" ? "↑" : "↓"}</span>}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="table-header cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleFileSort("size")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    الحجم
                                                    {fileSortBy === "size" && <span>{fileSortOrder === "asc" ? "↑" : "↓"}</span>}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="table-header cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleFileSort("createdAt")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    تاريخ الرفع
                                                    {fileSortBy === "createdAt" && <span>{fileSortOrder === "asc" ? "↑" : "↓"}</span>}
                                                </div>
                                            </TableHead>
                                            <TableHead className="table-header text-right">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedFiles.length > 0 ? paginatedFiles.map(file => (
                                            <TableRow key={file.id}>
                                                <TableCell className="table-cell">
                                                    {getFileIcon(file.type)}
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <div className="font-medium">{file.name}</div>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <Badge variant="outline">
                                                        {getFileTypeText(file.type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    {formatFileSize(file.size)}
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    {formatDate(file.createdAt)}
                                                </TableCell>
                                                <TableCell className="table-cell text-right space-x-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setFileDetailDialog({ isOpen: true, file })}
                                                        title="عرض التفاصيل"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => window.open(getFileUrl(file.url), '_blank')}
                                                        title="تحميل الملف"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        onClick={() => setDeleteDialog({
                                                            isOpen: true,
                                                            itemId: file.id,
                                                            itemName: file.name || "بدون اسم",
                                                            type: "file"
                                                        })}
                                                        title="حذف الملف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                    {files.length === 0 ? "لا توجد ملفات لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Cards View for files - for small screens */}
                            <div className="block md:hidden">
                                {paginatedFiles.length > 0 ? (
                                    paginatedFiles.map(file => (
                                        <FileCard key={file.id} file={file} />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {files.length === 0 ? "لا توجد ملفات لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                                    </div>
                                )}
                            </div>

                            {/* Pagination for files */}
                            {paginatedFiles.length > 0 && (
                                <div className="flex items-center justify-between gap-4 mt-6">
                                    <div className="text-sm text-muted-foreground">
                                        عرض {fileStartItem} - {fileEndItem} من أصل {fileTotalItems}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleFilePageChange(fileCurrentPage - 1)} disabled={fileCurrentPage === 1}>
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                        {Array.from({ length: Math.min(5, fileTotalPages) }, (_, i) => {
                                            let pageNumber = fileCurrentPage <= 3 ? i + 1 : fileCurrentPage >= fileTotalPages - 2 ? fileTotalPages - 4 + i : fileCurrentPage - 2 + i
                                            return (
                                                <Button key={pageNumber} variant={fileCurrentPage === pageNumber ? "default" : "outline"} size="sm" onClick={() => handleFilePageChange(pageNumber)}>
                                                    {pageNumber}
                                                </Button>
                                            )
                                        })}
                                        <Button variant="outline" size="sm" onClick={() => handleFilePageChange(fileCurrentPage + 1)} disabled={fileCurrentPage === fileTotalPages}>
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* محتوى تاب الأسئلة */}
                        <TabsContent value="quizzes" className="space-y-4 mt-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
                                        setIsQuestionDialogOpen(open)
                                        if (!open) resetQuestionForm()
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                disabled={!selectedLevel}
                                                onClick={() => {
                                                    resetQuestionForm()
                                                    setIsQuestionDialogOpen(true)
                                                }}
                                            >
                                                <Plus className="w-4 h-4 ml-1" />
                                                إضافة سؤال
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>{editQuestionId ? "تعديل السؤال" : "إضافة سؤال جديد"}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 mt-2">
                                                <div className="space-y-2">
                                                    <Label>نص السؤال *</Label>
                                                    <Textarea
                                                        value={questionForm.text}
                                                        onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                                                        placeholder="أدخل نص السؤال..."
                                                        rows={3}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>ترتيب السؤال *</Label>
                                                    <Input
                                                        type="number"
                                                        value={questionForm.order}
                                                        onChange={(e) => setQuestionForm({ ...questionForm, order: e.target.value })}
                                                        min="1"
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label>خيارات الإجابة *</Label>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setQuestionForm(prev => ({
                                                                    ...prev,
                                                                    options: [...prev.options, { text: "", isCorrect: false }]
                                                                }))
                                                            }}
                                                        >
                                                            <Plus className="w-4 h-4 ml-1" />
                                                            إضافة خيار
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {questionForm.options.map((option, index) => (
                                                            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                                                <Switch
                                                                    checked={option.isCorrect}
                                                                    onCheckedChange={() => handleCorrectAnswerChange(index)}
                                                                />
                                                                <Input
                                                                    value={option.text}
                                                                    onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                                                                    placeholder={`الخيار ${index + 1}...`}
                                                                    className="flex-1"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        if (questionForm.options.length <= 2) {
                                                                            showErrorToast("يجب أن يحتوي السؤال على خيارين على الأقل")
                                                                            return
                                                                        }
                                                                        setQuestionForm(prev => ({
                                                                            ...prev,
                                                                            options: prev.options.filter((_, i) => i !== index)
                                                                        }))
                                                                    }}
                                                                    disabled={questionForm.options.length <= 2}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                                                        💡 يجب تحديد إجابة صحيحة واحدة على الأقل وإدخال خيارين على الأقل
                                                    </div>
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

                                    {selectedLevel && questions.length > 0 && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="destructive">
                                                    <Trash2 className="w-4 h-4 ml-1" />
                                                    حذف كل الأسئلة
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="text-right" dir="rtl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-right">هل أنت متأكد من حذف جميع الأسئلة؟</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-right">
                                                        سيتم حذف جميع أسئلة هذا المستوى بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="flex flex-row-reverse gap-2">
                                                    <AlertDialogAction
                                                        onClick={handleDeleteAllQuestions}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        حذف الكل
                                                    </AlertDialogAction>
                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>

                                {/* أدوات البحث والفلترة للأسئلة */}
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:flex-none">
                                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="بحث بنص السؤال..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pr-10 w-full sm:w-64"
                                        />
                                    </div>

                                    <Select
                                        value={questionItemsPerPage.toString()}
                                        onValueChange={(value) => setQuestionItemsPerPage(Number(value))}
                                        className="w-full sm:w-32"
                                    >
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

                                    <Select
                                        value={questionSortBy}
                                        onValueChange={setQuestionSortBy}
                                        className="w-full sm:w-32"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="ترتيب حسب" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="order">الترتيب</SelectItem>
                                            <SelectItem value="text">نص السؤال</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {(searchTerm || questionSortBy !== "order") && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={resetQuestionFilters}
                                            className="w-full sm:w-auto"
                                        >
                                            <Filter className="w-4 h-4 ml-1" />
                                            إعادة تعيين
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Table View for questions - for medium screens and up */}
                            <div className="hidden md:block">
                                <Table className="direction-rtl">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead
                                                className="table-header cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleQuestionSort("order")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    الترتيب
                                                    {questionSortBy === "order" && <span>{questionSortOrder === "asc" ? "↑" : "↓"}</span>}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="table-header cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleQuestionSort("text")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    نص السؤال
                                                    {questionSortBy === "text" && <span>{questionSortOrder === "asc" ? "↑" : "↓"}</span>}
                                                </div>
                                            </TableHead>
                                            <TableHead className="table-header">عدد الخيارات</TableHead>
                                            <TableHead className="table-header">الإجابة الصحيحة</TableHead>
                                            <TableHead className="table-header text-right">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingQuestions ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8">
                                                    <div className="flex justify-center">
                                                        <div className="animate-spin h-6 w-6 border-b-2 rounded-full border-gray-900"></div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedQuestions.length > 0 ? paginatedQuestions.map(question => (
                                            <TableRow key={question.id}>
                                                <TableCell className="table-cell">
                                                    <Badge variant="secondary">{question.order}</Badge>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <div className="font-medium">{question.text}</div>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <div className="flex items-center gap-1">
                                                        <ListOrdered className="w-4 h-4" />
                                                        {question.options?.length || 0}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    {question.options?.find(opt => opt.isCorrect) ? (
                                                        <Badge variant="default" className="bg-green-600">
                                                            <CheckCircle className="w-3 h-3 ml-1" />
                                                            موجودة
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <XCircle className="w-3 h-3 ml-1" />
                                                            غير محددة
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="table-cell text-right space-x-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setQuestionDetailDialog({ isOpen: true, question })}
                                                        title="عرض التفاصيل"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setQuestionForm({
                                                                text: question.text,
                                                                order: question.order.toString(),
                                                                options: question.options || []
                                                            })
                                                            setEditQuestionId(question.id)
                                                            setIsQuestionDialogOpen(true)
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
                                                            itemId: question.id,
                                                            itemName: question.text,
                                                            type: "question"
                                                        })}
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    {questions.length === 0 ? "لا توجد أسئلة لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Cards View for questions - for small screens */}
                            <div className="block md:hidden">
                                {loadingQuestions ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
                                    </div>
                                ) : paginatedQuestions.length > 0 ? (
                                    paginatedQuestions.map(question => (
                                        <QuestionCard key={question.id} question={question} />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {questions.length === 0 ? "لا توجد أسئلة لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                                    </div>
                                )}
                            </div>

                            {/* Pagination for questions */}
                            {paginatedQuestions.length > 0 && (
                                <div className="flex items-center justify-between gap-4 mt-6">
                                    <div className="text-sm text-muted-foreground">
                                        عرض {questionStartItem} - {questionEndItem} من أصل {questionTotalItems}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleQuestionPageChange(questionCurrentPage - 1)} disabled={questionCurrentPage === 1}>
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                        {Array.from({ length: Math.min(5, questionTotalPages) }, (_, i) => {
                                            let pageNumber = questionCurrentPage <= 3 ? i + 1 : questionCurrentPage >= questionTotalPages - 2 ? questionTotalPages - 4 + i : questionCurrentPage - 2 + i
                                            return (
                                                <Button key={pageNumber} variant={questionCurrentPage === pageNumber ? "default" : "outline"} size="sm" onClick={() => handleQuestionPageChange(pageNumber)}>
                                                    {pageNumber}
                                                </Button>
                                            )
                                        })}
                                        <Button variant="outline" size="sm" onClick={() => handleQuestionPageChange(questionCurrentPage + 1)} disabled={questionCurrentPage === questionTotalPages}>
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>

            {/* Dialog لعرض تفاصيل الدرس */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(open) => setDetailDialog({ isOpen: open, lesson: null })}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل الدرس</DialogTitle>
                    </DialogHeader>
                    {renderLessonDetails(detailDialog.lesson)}
                </DialogContent>
            </Dialog>

            {/* Dialog لعرض تفاصيل الملف */}
            <Dialog open={fileDetailDialog.isOpen} onOpenChange={(open) => setFileDetailDialog({ isOpen: open, file: null })}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل الملف</DialogTitle>
                    </DialogHeader>
                    {renderFileDetails(fileDetailDialog.file)}
                </DialogContent>
            </Dialog>

            {/* Dialog لعرض تفاصيل السؤال */}
            <Dialog open={questionDetailDialog.isOpen} onOpenChange={(open) => setQuestionDetailDialog({ isOpen: open, question: null })}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل السؤال</DialogTitle>
                    </DialogHeader>
                    {renderQuestionDetails(questionDetailDialog.question)}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, isOpen: open })}>
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