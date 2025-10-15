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
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Youtube, Download, Info, Loader2, CheckCircle, XCircle, Clock, BookOpen, File, Upload } from "lucide-react"
import { getLevelLessons, createLessonForLevel, updateLesson, deleteLesson, toggleLessonStatus, getInstructors } from "@/api/api"
import { getCourses } from "@/api/api"
import { getCourseLevels } from "@/api/api"
import { getSpecializations } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

// مكون إدارة الاختبارات المصغر للديالوج
const QuizzesManager = ({ specializationId, courseId, levelId, onClose }) => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [newQuestion, setNewQuestion] = useState({ 
    text: "", 
    options: ["", "", "", ""], 
    correctAnswer: 0 
  })

  useEffect(() => {
    if (levelId) {
      setLoading(true)
      setTimeout(() => {
        setQuestions([
          { 
            id: 1, 
            text: "ما هو مفهوم الـ API؟", 
            order: 1,
            options: [
              { text: "واجهة برمجة التطبيقات", isCorrect: true },
              { text: "لغة برمجة", isCorrect: false },
              { text: "إطار عمل", isCorrect: false },
              { text: "قاعدة بيانات", isCorrect: false }
            ]
          },
          { 
            id: 2, 
            text: "ما هي فوائد استخدام React؟", 
            order: 2,
            options: [
              { text: "المكونات القابلة لإعادة الاستخدام", isCorrect: true },
              { text: "معالجة البيانات الضخمة", isCorrect: false },
              { text: "تصميم الواجهات الرسومية", isCorrect: false },
              { text: "إدارة الخوادم", isCorrect: false }
            ]
          }
        ])
        setLoading(false)
      }, 1000)
    }
  }, [levelId])

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim()) {
      showErrorToast("يرجى إدخال نص السؤال")
      return
    }
    
    if (newQuestion.options.filter(opt => opt.trim()).length < 2) {
      showErrorToast("يرجى إدخال خيارين على الأقل")
      return
    }
    
    const question = {
      id: Date.now(),
      text: newQuestion.text,
      order: questions.length + 1,
      options: newQuestion.options
        .filter(opt => opt.trim())
        .map((opt, index) => ({
          text: opt,
          isCorrect: index === newQuestion.correctAnswer
        }))
    }
    
    setQuestions([...questions, question])
    setNewQuestion({ text: "", options: ["", "", "", ""], correctAnswer: 0 })
    showSuccessToast("تم إضافة السؤال بنجاح")
  }

  const handleDeleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId))
    showSuccessToast("تم حذف السؤال بنجاح")
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...newQuestion.options]
    newOptions[index] = value
    setNewQuestion(prev => ({ ...prev, options: newOptions }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">إدارة أسئلة الاختبار</h3>
        <Button variant="outline" onClick={onClose}>
          رجوع
        </Button>
      </div>

      {/* نموذج إضافة سؤال جديد */}
      <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
        <h4 className="font-medium">إضافة سؤال جديد</h4>
        
        <div className="space-y-2">
          <Label>نص السؤال *</Label>
          <Textarea
            value={newQuestion.text}
            onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
            placeholder="أدخل نص السؤال..."
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <Label>خيارات الإجابة *</Label>
          {newQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center gap-3 p-2 border rounded">
              <input
                type="radio"
                name="correctAnswer"
                checked={newQuestion.correctAnswer === index}
                onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: index }))}
                className="w-4 h-4 text-blue-600"
              />
              <Input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`الخيار ${index + 1}...`}
                className="flex-1"
              />
              {newQuestion.options.length > 2 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const newOptions = newQuestion.options.filter((_, i) => i !== index)
                    setNewQuestion(prev => ({ 
                      ...prev, 
                      options: newOptions,
                      correctAnswer: prev.correctAnswer >= index ? Math.max(0, prev.correctAnswer - 1) : prev.correctAnswer
                    }))
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
          
          {newQuestion.options.length < 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewQuestion(prev => ({ 
                ...prev, 
                options: [...prev.options, ""] 
              }))}
            >
              <Plus className="w-4 h-4 ml-1" />
              إضافة خيار
            </Button>
          )}
        </div>

        <Button onClick={handleAddQuestion} className="w-full" disabled={!newQuestion.text.trim()}>
          <Plus className="w-4 h-4 ml-1" />
          إضافة السؤال
        </Button>
      </div>

      {/* قائمة الأسئلة الحالية */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">الأسئلة الحالية ({questions.length})</h4>
          <Badge variant="secondary">المستوى: {levelId}</Badge>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>جاري تحميل الأسئلة...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-muted-foreground">لا توجد أسئلة لهذا المستوى</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map(question => (
              <div key={question.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">ترتيب: {question.order}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {question.options.length} خيارات
                      </span>
                    </div>
                    <p className="font-medium text-lg">{question.text}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded ${
                        option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      {option.isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={option.isCorrect ? 'font-medium text-green-800' : 'text-gray-700'}>
                        {option.text}
                      </span>
                      {option.isCorrect && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          الإجابة الصحيحة
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// مكون إدارة الملفات المصغر للديالوج
const FilesManager = ({ specializationId, courseId, levelId, onClose }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileToUpload, setFileToUpload] = useState(null)

  useEffect(() => {
    if (levelId) {
      setLoading(true)
      setTimeout(() => {
        setFiles([
          { 
            id: 1, 
            name: "ملف الشرح.pdf", 
            size: "2.5 MB", 
            type: "document",
            uploadDate: "2024-01-15"
          },
          { 
            id: 2, 
            name: "تمارين عملية.zip", 
            size: "1.8 MB", 
            type: "archive",
            uploadDate: "2024-01-14"
          },
          { 
            id: 3, 
            name: "صورة الشرح.png", 
            size: "850 KB", 
            type: "image",
            uploadDate: "2024-01-13"
          }
        ])
        setLoading(false)
      }, 1000)
    }
  }, [levelId])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileToUpload(file)
  }

  const handleFileUpload = () => {
    if (!fileToUpload) {
      showErrorToast("يرجى اختيار ملف للرفع")
      return
    }

    setUploading(true)
    
    // محاكاة رفع الملف
    setTimeout(() => {
      const newFile = {
        id: Date.now(),
        name: fileToUpload.name,
        size: `${(fileToUpload.size / 1024 / 1024).toFixed(1)} MB`,
        type: fileToUpload.type.includes('image') ? 'image' : 
              fileToUpload.type.includes('pdf') ? 'document' : 
              fileToUpload.type.includes('zip') ? 'archive' : 'file',
        uploadDate: new Date().toISOString().split('T')[0]
      }
      
      setFiles([...files, newFile])
      setFileToUpload(null)
      setUploading(false)
      showSuccessToast("تم رفع الملف بنجاح")
      
      // إعادة تعيين حقل الرفع
      const fileInput = document.getElementById('file-upload')
      if (fileInput) fileInput.value = ''
    }, 1500)
  }

  const handleDeleteFile = (fileId) => {
    setFiles(files.filter(file => file.id !== fileId))
    showSuccessToast("تم حذف الملف بنجاح")
  }

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'document':
        return <File className="w-5 h-5 text-red-500" />
      case 'image':
        return <File className="w-5 h-5 text-blue-500" />
      case 'archive':
        return <File className="w-5 h-5 text-yellow-500" />
      default:
        return <File className="w-5 h-5 text-gray-500" />
    }
  }

  const getFileTypeText = (fileType) => {
    switch (fileType) {
      case 'document': return 'مستند'
      case 'image': return 'صورة'
      case 'archive': return 'ملف مضغوط'
      default: return 'ملف'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">إدارة ملفات المستوى</h3>
        <Button variant="outline" onClick={onClose}>
          رجوع
        </Button>
      </div>

      {/* رفع ملف جديد */}
      <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
        <h4 className="font-medium">رفع ملف جديد</h4>
        
        <div className="space-y-3">
          <Label>اختر الملف</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          
          {fileToUpload && (
            <div className="p-3 border rounded bg-white">
              <div className="flex items-center gap-3">
                <File className="w-8 h-8 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">{fileToUpload.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {`${(fileToUpload.size / 1024 / 1024).toFixed(1)} MB`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleFileUpload}
            disabled={!fileToUpload || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-1" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-1" />
                رفع الملف
              </>
            )}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>📁 الأنواع المدعومة: PDF, Word, Excel, PowerPoint, Images, ZIP, RAR</p>
          <p>💾 الحجم الأقصى: 50 MB</p>
        </div>
      </div>

      {/* قائمة الملفات الحالية */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">الملفات المرفوعة ({files.length})</h4>
          <Badge variant="secondary">المستوى: {levelId}</Badge>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>جاري تحميل الملفات...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <File className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-muted-foreground">لا توجد ملفات مرفوعة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map(file => (
              <div key={file.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{file.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {getFileTypeText(file.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{file.size}</span>
                        <span>تم الرفع: {file.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" title="تحميل الملف">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      title="حذف الملف"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
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
    
    // حالات الديالوجات
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
    const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
    const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
    
    const [editItem, setEditItem] = useState(null)
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, lesson: null })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // حالات التحقق من الروابط
    const [linkValidation, setLinkValidation] = useState({
        youtubeUrl: { isValid: false, message: "", checking: false, exists: false },
        googleDriveUrl: { isValid: false, message: "", checking: false, exists: false }
    })

    // البحث والترتيب
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [statusFilter, setStatusFilter] = useState("all")
    const [freePreviewFilter, setFreePreviewFilter] = useState("all")
    const [sortBy, setSortBy] = useState("orderIndex")
    const [sortOrder, setSortOrder] = useState("asc")

    // دوال فتح الديالوجات
    const openQuizDialog = () => {
        if (!selectedLevel) {
            showErrorToast("يرجى اختيار المستوى أولاً")
            return
        }
        setIsQuizDialogOpen(true)
    }

    const openFileDialog = () => {
        if (!selectedLevel) {
            showErrorToast("يرجى اختيار المستوى أولاً")
            return
        }
        setIsFileDialogOpen(true)
    }

    // دوال جلب البيانات
    const fetchSpecializations = async () => {
        try {
            const res = await getSpecializations();
            console.log("🔍 استجابة الاختصاصات:", res);
            
            let data = [];
            if (Array.isArray(res.data?.data?.items)) {
                data = res.data.data.items;
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }
            
            console.log("✅ بيانات الاختصاصات:", data);
            setSpecializations(data);
        } catch (err) {
            console.error("Error fetching specializations:", err);
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
            let allCourses = [];
            if (Array.isArray(res.data?.data?.items)) {
                allCourses = res.data.data.items;
            } else if (Array.isArray(res.data?.data?.data)) {
                allCourses = res.data.data.data;
            } else if (Array.isArray(res.data?.data)) {
                allCourses = res.data.data;
            }
            
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
            const res = await getCourseLevels(courseId)
            console.log("📊 استجابة المستويات:", res);
            
            let data = [];
            if (Array.isArray(res.data?.data)) {
                data = res.data.data;
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            } else if (Array.isArray(res.data?.data?.items)) {
                data = res.data.data.items;
            }
            
            console.log("✅ بيانات المستويات:", data);
            setLevels(data || []);
        } catch (err) {
            console.error("Error fetching levels:", err);
            showErrorToast("فشل تحميل مستويات الكورس");
            setLevels([]);
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
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data;
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
            setIsLessonDialogOpen(false);
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
                        {/* زر إضافة اختبار */}
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!selectedLevel}
                            onClick={openQuizDialog}
                            title="إضافة اختبار لهذا المستوى"
                        >
                            إضافة اختبار <BookOpen className="w-4 h-4 mr-1" />
                        </Button>

                        {/* زر إضافة ملف */}
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!selectedLevel}
                            onClick={openFileDialog}
                            title="إضافة ملف لهذا المستوى"
                        >
                            إضافة ملف <File className="w-4 h-4 mr-1" />
                        </Button>

                        {/* زر إضافة درس */}
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
                                });
                                setLinkValidation({
                                    youtubeUrl: { isValid: false, message: "", checking: false, exists: false },
                                    googleDriveUrl: { isValid: true, message: "", checking: false, exists: true }
                                });
                                setIsLessonDialogOpen(true)
                            }}
                        >
                            إضافة درس <Plus className="w-4 h-4 mr-1" />
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
                                                        setIsLessonDialogOpen(true)
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
                                                        setIsLessonDialogOpen(true)
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
                <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
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
                                    placeholder="أدخل وصف الدرس (اختياري)..."
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
                                        placeholder="ترتيب الدرس"
                                        min="1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>مدة الدرس (ثانية)</Label>
                                    <Input
                                        type="number"
                                        value={form.durationSec}
                                        onChange={(e) => handleFormChange("durationSec", e.target.value)}
                                        placeholder="مدة الدرس بالثواني"
                                        min="0"
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

                {/* ديالوج إدارة الاختبارات */}
                <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <QuizzesManager 
                            specializationId={selectedSpecialization}
                            courseId={selectedCourse}
                            levelId={selectedLevel}
                            onClose={() => setIsQuizDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* ديالوج إدارة الملفات */}
                <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <FilesManager 
                            specializationId={selectedSpecialization}
                            courseId={selectedCourse}
                            levelId={selectedLevel}
                            onClose={() => setIsFileDialogOpen(false)}
                        />
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
                                <div>
                                    <Label className="font-bold">المعاينة المجانية:</Label>
                                    <div className="mt-1">
                                        <Badge variant={detailDialog.lesson?.isFreePreview ? "default" : "secondary"}>
                                            {detailDialog.lesson?.isFreePreview ? "مجاني" : "مدفوع"}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="font-bold">معرف YouTube:</Label>
                                    <p className="mt-1">{detailDialog.lesson?.youtubeId || "غير محدد"}</p>
                                </div>
                            </div>
                            {detailDialog.lesson?.description && (
                                <div>
                                    <Label className="font-bold">الوصف:</Label>
                                    <p className="mt-1 p-3 bg-gray-50 rounded-lg">{detailDialog.lesson.description}</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

export default Lesson