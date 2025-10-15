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
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Youtube, Download, Info, Loader2, CheckCircle, XCircle, Clock, BookOpen, File, Settings, Check, ChevronDown } from "lucide-react"
import { getLevelLessons, createLessonForLevel, updateLesson, deleteLesson, toggleLessonStatus, getInstructors } from "@/api/api"
import { getCourses } from "@/api/api"
import { getCourseLevels } from "@/api/api"
import { getSpecializations } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

// مكون إدارة الاختبارات المصغر
const QuizzesManager = ({ specializationId, courseId, levelId, compact }) => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (levelId) {
      setLoading(true)
      setTimeout(() => {
        setQuestions([
          { id: 1, text: "ما هو مفهوم الـ API؟", order: 1 },
          { id: 2, text: "ما هي فوائد استخدام React؟", order: 2 }
        ])
        setLoading(false)
      }, 1000)
    }
  }, [levelId])

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">أسئلة الاختبار ({questions.length})</h4>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 ml-1" />
            إضافة سؤال
          </Button>
        </div>
        {loading ? (
          <div className="text-center py-4">جاري تحميل الأسئلة...</div>
        ) : (
          <div className="space-y-2">
            {questions.map(question => (
              <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="flex-1">{question.text}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <div>مكون الاختبارات الكامل</div>
}

// مكون إدارة الملفات المصغر
const FilesManager = ({ specializationId, courseId, levelId, compact }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (levelId) {
      setLoading(true)
      setTimeout(() => {
        setFiles([
          { id: 1, name: "ملف الشرح.pdf", size: "2.5 MB" },
          { id: 2, name: "تمارين عملية.zip", size: "1.8 MB" }
        ])
        setLoading(false)
      }, 1000)
    }
  }, [levelId])

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">الملفات المرفوعة ({files.length})</h4>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 ml-1" />
            رفع ملف
          </Button>
        </div>
        {loading ? (
          <div className="text-center py-4">جاري تحميل الملفات...</div>
        ) : (
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <File className="w-4 h-4" />
                  <span>{file.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{file.size}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <div>مكون الملفات الكامل</div>
}

const Lesson = () => {
    // الحالات الأساسية
    const [lessons, setLessons] = useState([])
    const [allLessons, setAllLessons] = useState([])
    const [specializations, setSpecializations] = useState([])
    const [courses, setCourses] = useState([])
    const [levels, setLevels] = useState([])
    const [instructors, setInstructors] = useState([])
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
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, lesson: null })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // حالات التحقق من الروابط
    const [linkValidation, setLinkValidation] = useState({
        youtubeUrl: { isValid: false, message: "", checking: false, exists: false },
        googleDriveUrl: { isValid: false, message: "", checking: false, exists: false }
    })

    // حالات الديالوج المتعدد الخطوات
    const [wizardDialog, setWizardDialog] = useState({
        isOpen: false,
        currentStep: 0,
        selectedModules: ['lessons']
    })

    // الخطوات المتاحة
    const steps = [
        { id: 'selection', title: 'اختر نوع المحتوى', icon: Settings },
        { id: 'lessons', title: 'الدروس', icon: BookOpen },
        { id: 'quizzes', title: 'الاختبارات', icon: File },
        { id: 'files', title: 'الملفات', icon: Check }
    ]

    // خيارات المحتوى
    const contentModules = [
        { id: 'lessons', title: 'الدروس', description: 'إدارة دروس الفيديو والمواد التعليمية', icon: BookOpen, required: true },
        { id: 'quizzes', title: 'الاختبارات', description: 'إضافة أسئلة وتقييمات للمستوى', icon: File },
        { id: 'files', title: 'الملفات', description: 'رفع ملفات ومستندات مساعدة', icon: Download }
    ]

    // البحث والترتيب
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [statusFilter, setStatusFilter] = useState("all")
    const [freePreviewFilter, setFreePreviewFilter] = useState("all")
    const [sortBy, setSortBy] = useState("orderIndex")
    const [sortOrder, setSortOrder] = useState("asc")

    // دوال الديالوج المتعدد الخطوات
    const openContentWizard = () => {
        setWizardDialog({
            isOpen: true,
            currentStep: 0,
            selectedModules: ['lessons']
        })
    }

    const goToNextStep = () => {
        setWizardDialog(prev => ({
            ...prev,
            currentStep: Math.min(steps.length - 1, prev.currentStep + 1)
        }))
    }

    const goToPrevStep = () => {
        setWizardDialog(prev => ({
            ...prev,
            currentStep: Math.max(0, prev.currentStep - 1)
        }))
    }

    const toggleModuleSelection = (moduleId) => {
        setWizardDialog(prev => {
            const newSelection = prev.selectedModules.includes(moduleId)
                ? prev.selectedModules.filter(id => id !== moduleId && id !== 'lessons')
                : [...prev.selectedModules, moduleId]
            
            if (!newSelection.includes('lessons')) {
                newSelection.push('lessons')
            }
            
            return { ...prev, selectedModules: newSelection }
        })
    }

    // دوال جلب البيانات
const fetchSpecializations = async () => {
    try {
        const res = await getSpecializations();
        console.log("🔍 فحص كامل للاستجابة:", res);
        
        // فحص جميع المستويات الممكنة للبيانات
        const possiblePaths = [
            res.data?.data?.items,
            res.data?.data?.data,
            res.data?.data,
            res.data,
            res?.data?.items,
            res?.data?.data,
            res
        ];
        
        let data = [];
        for (const path of possiblePaths) {
            if (Array.isArray(path) && path.length > 0) {
                data = path;
                console.log("✅ تم العثور على البيانات في:", path);
                break;
            }
        }
        
        if (data.length === 0) {
            console.warn("❌ لم يتم العثور على بيانات في أي مسار");
            showErrorToast("فشل تحميل الاختصاصات: لا توجد بيانات");
        }
        
        setSpecializations(data);
        
    } catch (err) {
        console.error("❌ خطأ في جلب الاختصاصات:", err);
        showErrorToast("فشل تحميل الاختصاصات");
    }
};

    const fetchCourses = async (specializationId) => {
        if (!specializationId) {
            setCourses([]);
            setSelectedCourse("");
            return;
        }
        try {
            const res = await getCourses();
            let allCourses = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
            const filteredCourses = allCourses.filter(course => 
                course.specializationId === parseInt(specializationId)
            );
            setCourses(filteredCourses);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل الكورسات");
        }
    };

   const fetchCourseLevels = async (courseId) => {
    if (!courseId) {
        setLevels([])
        setSelectedLevel("")
        return
    }

    try {
        console.log("🔄 جاري جلب مستويات الكورس:", courseId);
        const res = await getCourseLevels(courseId)
        console.log("📊 استجابة API للمستويات:", res);
        
        let data = [];
        
        // فحص جميع المسارات الممكنة للبيانات
        const possiblePaths = [
            res.data?.data?.items,
            res.data?.data?.data,
            res.data?.data,
            res.data,
            res?.data?.items,
            res?.data?.data,
            res
        ];
        
        for (const path of possiblePaths) {
            if (Array.isArray(path) && path.length > 0) {
                data = path;
                console.log("✅ تم العثور على بيانات المستويات في:", path);
                break;
            }
        }
        
        // إذا لم نجد بيانات، نستخدم بيانات تجريبية
        if (data.length === 0) {
            console.warn("❌ لم يتم العثور على مستويات في أي مسار");
            data = [
                { id: 1, name: "المستوى المبتدئ", order: 1, courseId: parseInt(courseId) },
                { id: 2, name: "المستوى المتوسط", order: 2, courseId: parseInt(courseId) },
                { id: 3, name: "المستوى المتقدم", order: 3, courseId: parseInt(courseId) }
            ];
        }
        
        console.log("🎯 بيانات المستويات النهائية:", data);
        setLevels(data);
        
    } catch (err) {
        console.error("❌ خطأ في جلب المستويات:", err);
        console.error("تفاصيل الخطأ:", err.response?.data);
        showErrorToast("فشل تحميل مستويات الكورس");
        
        // بيانات تجريبية للطوارئ
        const fallbackLevels = [
            { id: 1, name: "المستوى الأساسي", order: 1, courseId: parseInt(courseId) },
            { id: 2, name: "المستوى المتوسط", order: 2, courseId: parseInt(courseId) }
        ];
        setLevels(fallbackLevels);
    }
}

    const fetchLevelLessons = async (levelId) => {
        if (!levelId) {
            setAllLessons([])
            return
        }
        setLoading(true)
        try {
            const res = await getLevelLessons(levelId)
            let data = [];
            if (Array.isArray(res.data?.data?.data?.data)) {
                data = res.data.data.data.data;
            }
            setAllLessons(data || []);
        } catch (err) {
            console.error("❌ Error fetching lessons:", err);
            showErrorToast("فشل تحميل الدروس");
            setAllLessons([]);
        } finally {
            setLoading(false);
        }
    }

    // دوال التحقق من الروابط
    const validateYouTubeUrl = (url) => {
        if (!url) return { isValid: false, message: "يرجى إدخال رابط YouTube", exists: false };
        try {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return { 
                    isValid: false, 
                    message: "يجب أن يبدأ الرابط بـ http:// أو https://",
                    exists: false
                };
            }
            const urlObj = new URL(url);
            if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
                return { 
                    isValid: false, 
                    message: "يجب أن يكون الرابط من youtube.com أو youtu.be",
                    exists: false
                };
            }
            const youtubeId = extractYouTubeId(url);
            if (!youtubeId) {
                return { 
                    isValid: false, 
                    message: "لم يتم العثور على معرف فيديو YouTube صحيح",
                    exists: false
                };
            }
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
        const validation = await validateUrlWithDelay(url, 'youtube');
        setLinkValidation(prev => ({
            ...prev,
            youtubeUrl: { ...validation, checking: false }
        }));
        if (validation.isValid && validation.youtubeId) {
            setForm(prev => ({
                ...prev,
                youtubeId: validation.youtubeId
            }));
        }
    };

    const validateUrlWithDelay = async (url, type) => {
        const formatValidation = type === 'youtube' ? validateYouTubeUrl(url) : { isValid: true, message: "" };
        if (!formatValidation.isValid) {
            return formatValidation;
        }
        setLinkValidation(prev => ({
            ...prev,
            [type + 'Url']: { ...formatValidation, checking: true }
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            ...formatValidation,
            exists: true
        };
    };

    // دوال النموذج
    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    const canSave = useMemo(() => {
        if (!form.title.trim() || !form.orderIndex || !form.youtubeUrl) {
            return false;
        }
        if (!linkValidation.youtubeUrl.isValid || !linkValidation.youtubeUrl.exists) {
            return false;
        }
        if (form.googleDriveUrl && (!linkValidation.googleDriveUrl.isValid || !linkValidation.googleDriveUrl.exists)) {
            return false;
        }
        return true;
    }, [form, linkValidation]);

    const handleSave = async () => {
        if (!canSave) {
            showErrorToast("يرجى التحقق من صحة جميع البيانات والروابط");
            return;
        }
        setIsSubmitting(true);
        try {
            const lessonData = {
                title: form.title,
                description: form.description || '',
                youtubeUrl: form.youtubeUrl,
                youtubeId: form.youtubeId,
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
            setForm({
                title: "",
                description: "",
                youtubeUrl: "",
                youtubeId: "",
                googleDriveUrl: "",
                durationSec: "",
                orderIndex: "",
                isFreePreview: false
            });
            setLinkValidation({
                youtubeUrl: { isValid: false, message: "", checking: false, exists: false },
                googleDriveUrl: { isValid: true, message: "", checking: false, exists: true }
            });
            setIsDialogOpen(false);
            fetchLevelLessons(selectedLevel);
        } catch (err) {
            console.error("❌ Save error:", err.response?.data || err);
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

    const handleDelete = async (id) => {
        try {
            await deleteLesson(id)
            fetchLevelLessons(selectedLevel)
            showSuccessToast("تم الحذف بنجاح")
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل الحذف")
        }
    }

    const formatDuration = (seconds) => {
        if (!seconds) return "00:00"
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // دوال التصفية والترتيب
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

    const paginatedLessons = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredAndSortedLessons.slice(startIndex, endIndex)
    }, [filteredAndSortedLessons, currentPage, itemsPerPage])

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

    // دوال المساعدة
    const getCourseInfo = (lesson) => {
        if (!lesson) return "غير محدد";
        return lesson.courseLevel?.course?.title || "غير محدد";
    }

    const getInstructorInfo = (lesson) => {
        if (!lesson) return "غير محدد";
        const instructorId = lesson.courseLevel?.instructorId;
        if (!instructorId) return "غير محدد";
        const instructor = instructors.find(inst => inst.id === instructorId);
        return instructor?.name || `المدرس ID: ${instructorId}`;
    };

    const LinkStatus = ({ validation, type }) => {
        if (!validation.message) return null;
        let icon, color;
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

    // عرض الخطوات في الديالوج المتعدد
    const renderCurrentStep = () => {
        switch (wizardDialog.currentStep) {
            case 0:
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">اختر نوع المحتوى الذي تريد إضافته</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {contentModules.map(module => (
                                <div
                                    key={module.id}
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                        wizardDialog.selectedModules.includes(module.id)
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                    } ${module.required ? 'opacity-100' : 'opacity-100'}`}
                                    onClick={() => !module.required && toggleModuleSelection(module.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <module.icon className="w-5 h-5" />
                                            <div>
                                                <h4 className="font-semibold">
                                                    {module.title}
                                                    {module.required && <span className="text-xs text-red-500 mr-1">*</span>}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">{module.description}</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                            wizardDialog.selectedModules.includes(module.id)
                                                ? 'bg-primary border-primary'
                                                : 'border-gray-300'
                                        }`}>
                                            {wizardDialog.selectedModules.includes(module.id) && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                    </div>
                                    {module.required && (
                                        <p className="text-xs text-muted-foreground mt-2">مطلوب</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case 1:
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">إدارة الدروس</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Button 
                                    onClick={() => {
                                        setIsDialogOpen(true)
                                        setWizardDialog(prev => ({...prev, isOpen: false}))
                                    }}
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 ml-1" />
                                    إضافة درس جديد
                                </Button>
                            </div>
                            
                            {allLessons.length > 0 ? (
                                <div className="border rounded-lg">
                                    <div className="max-h-60 overflow-y-auto">
                                        {allLessons.slice(0, 5).map(lesson => (
                                            <div key={lesson.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                                                <div className="flex items-center gap-3">
                                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                    <span>{lesson.title}</span>
                                                </div>
                                                <Badge variant="secondary">ترتيب: {lesson.orderIndex}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                                    لا توجد دروس لهذا المستوى
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">إدارة الاختبارات</h3>
                        <QuizzesManager 
                            specializationId={selectedSpecialization}
                            courseId={selectedCourse}
                            levelId={selectedLevel}
                            compact={true}
                        />
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">إدارة الملفات</h3>
                        <FilesManager 
                            specializationId={selectedSpecialization}
                            courseId={selectedCourse}
                            levelId={selectedLevel}
                            compact={true}
                        />
                    </div>
                )

            default:
                return null
        }
    }

    // useEffect hooks
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
        } else {
            setAllLessons([])
        }
    }, [selectedLevel])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, freePreviewFilter, itemsPerPage])

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <CardTitle>إدارة الدروس</CardTitle>

                {/* التصنيف الهرمي */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* اختيار الاختصاص */}
                        <div className="space-y-2">
                            <Label>اختر الاختصاص</Label>
                            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الاختصاص" />
                                </SelectTrigger>
                                <SelectContent>
                                    {specializations.map((spec) => (
                                        <SelectItem key={spec.id} value={spec.id}>
                                            {spec.name || spec.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* اختيار الكورس */}
                        <div className="space-y-2">
                            <Label>اختر الكورس</Label>
                            <Select 
                                value={selectedCourse} 
                                onValueChange={setSelectedCourse}
                                disabled={!selectedSpecialization}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedSpecialization ? "اختر الكورس" : "اختر الاختصاص أولاً"} />
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

                        {/* اختيار المستوى */}
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

                    {/* أزرار الإدارة */}
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            onClick={openContentWizard}
                            disabled={!selectedLevel}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Settings className="w-4 h-4 ml-1" />
                            إدارة المحتوى المتكاملة
                        </Button>

                        <Button
                            size="sm"
                            disabled={!selectedLevel}
                            onClick={() => setIsDialogOpen(true)}
                        >
                            <Plus className="w-4 h-4 ml-1" />
                            إضافة درس سريع
                        </Button>
                    </div>
                </div>

                {/* Filters Section */}
                {selectedLevel && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث بالعنوان أو الوصف..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
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
                        {!selectedSpecialization ? "يرجى اختيار اختصاص أولاً" : 
                         !selectedCourse ? "يرجى اختيار كورس أولاً" : 
                         "يرجى اختيار مستوى لعرض دروسه"}
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
                    </div>
                ) : (
                    <>
                        {/* Table View */}
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
                                                            durationSec: item.durationSec || "",
                                                            orderIndex: item.orderIndex || "",
                                                            isFreePreview: Boolean(item.isFreePreview)
                                                        })
                                                        setIsDialogOpen(true)
                                                    }}
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id, itemName: item.title })}
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                {allLessons.length === 0 ? "لا توجد دروس في هذا المستوى" : "لم يتم العثور على نتائج"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Card View */}
                        <div className="md:hidden space-y-4">
                            {paginatedLessons.length > 0 ? paginatedLessons.map(item => (
                                <Card key={item.id} className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">{item.orderIndex || "0"}</Badge>
                                                <Badge variant={item.isActive ? "default" : "secondary"}>
                                                    {item.isActive ? "نشط" : "معطل"}
                                                </Badge>
                                                <Badge variant={item.isFreePreview ? "default" : "secondary"}>
                                                    {item.isFreePreview ? "مجاني" : "مدفوع"}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setDetailDialog({ isOpen: true, lesson: item })}
                                                >
                                                    <Info className="w-4 h-4" />
                                                </Button>
                                                {item.youtubeUrl && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => window.open(item.youtubeUrl, '_blank')}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-medium">{item.title || "بدون عنوان"}</h3>
                                            {item.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">المدة:</span>
                                                <span className="mr-2">{formatDuration(item.durationSec)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">الكورس:</span>
                                                <span className="mr-2">{getCourseInfo(item)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">المدرس:</span>
                                                <span className="mr-2">{getInstructorInfo(item)}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-2 border-t">
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleActive(item.id, item.isActive)}
                                                >
                                                    {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
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
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id, itemName: item.title })}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allLessons.length === 0 ? "لا توجد دروس في هذا المستوى" : "لم يتم العثور على نتائج"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {paginatedLessons.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} - {endItem} من أصل {totalItems} درس
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
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ديالوج إضافة وتعديل الدرس */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                                    className={linkValidation.youtubeUrl.isValid && linkValidation.youtubeUrl.exists ? "border-green-500" : 
                                             linkValidation.youtubeUrl.isValid && !linkValidation.youtubeUrl.exists ? "border-yellow-500" : 
                                             !linkValidation.youtubeUrl.isValid && form.youtubeUrl ? "border-red-500" : ""}
                                />
                                <LinkStatus validation={linkValidation.youtubeUrl} type="youtube" />
                                {!form.youtubeUrl && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        أدخل رابط فيديو YouTube (يجب أن يبدأ بـ http:// أو https://)
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

                {/* ديالوج إدارة المحتوى المتكاملة */}
                <Dialog open={wizardDialog.isOpen} onOpenChange={(open) => setWizardDialog({ isOpen: open, currentStep: 0, selectedModules: ['lessons'] })}>
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                                <span>إدارة المحتوى التعليمي</span>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>المستوى: {selectedLevel}</span>
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        {/* مؤشر التقدم */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                {steps.map((step, index) => (
                                    <React.Fragment key={step.id}>
                                        <div className={`flex items-center gap-2 ${
                                            index <= wizardDialog.currentStep ? 'text-primary' : 'text-muted-foreground'
                                        }`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                                index <= wizardDialog.currentStep 
                                                    ? 'bg-primary border-primary text-white' 
                                                    : 'border-gray-300'
                                            }`}>
                                                {index < wizardDialog.currentStep ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <step.icon className="w-4 h-4" />
                                                )}
                                            </div>
                                            <span className={`text-sm ${index === wizardDialog.currentStep ? 'font-semibold' : ''}`}>
                                                {step.title}
                                            </span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`w-12 h-0.5 ${
                                                index < wizardDialog.currentStep ? 'bg-primary' : 'bg-gray-300'
                                            }`} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* محتوى الخطوة الحالية */}
                        <div className="min-h-[400px] py-4">
                            {renderCurrentStep()}
                        </div>

                        {/* أزرار التنقل */}
                        <div className="flex justify-between pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={goToPrevStep}
                                disabled={wizardDialog.currentStep === 0}
                            >
                                <ChevronRight className="w-4 h-4 ml-1" />
                                السابق
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setWizardDialog({ isOpen: false, currentStep: 0, selectedModules: ['lessons'] })}
                                >
                                    إلغاء
                                </Button>
                                
                                {wizardDialog.currentStep === steps.length - 1 ? (
                                    <Button onClick={() => setWizardDialog({ isOpen: false, currentStep: 0, selectedModules: ['lessons'] })}>
                                        إنهاء
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={goToNextStep}
                                        disabled={wizardDialog.currentStep === 0 && wizardDialog.selectedModules.length === 0}
                                    >
                                        التالي
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, isOpen: open })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                                هل أنت متأكد من حذف الدرس "{deleteDialog.itemName}"؟ هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                                handleDelete(deleteDialog.itemId)
                                setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })
                            }}>
                                حذف
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Lesson Details Dialog */}
                <Dialog open={detailDialog.isOpen} onOpenChange={(open) => setDetailDialog({ ...detailDialog, isOpen: open })}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>تفاصيل الدرس</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-right">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-bold">عنوان الدرس:</Label>
                                    <p className="mt-1">{detailDialog.lesson?.title || "غير محدد"}</p>
                                </div>
                                <div>
                                    <Label className="font-bold">ترتيب الدرس:</Label>
                                    <p className="mt-1">{detailDialog.lesson?.orderIndex || "غير محدد"}</p>
                                </div>
                                <div>
                                    <Label className="font-bold">المدة:</Label>
                                    <p className="mt-1">{formatDuration(detailDialog.lesson?.durationSec)}</p>
                                </div>
                                <div>
                                    <Label className="font-bold">الحالة:</Label>
                                    <div className="mt-1">
                                        <Badge variant={detailDialog.lesson?.isActive ? "default" : "secondary"}>
                                            {detailDialog.lesson?.isActive ? "نشط" : "معطل"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

export default Lesson