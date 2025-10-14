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
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, BookOpen, HelpCircle, ListOrdered, CheckCircle, XCircle } from "lucide-react"
import { getQuizByCourseLevel, addQuestion, updateQuestion, deleteQuestion, updateOption, deleteOption, deleteQuiz, getCourses, getCourseLevels, getSpecializations } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

const Quizzes = () => {
  const [questions, setQuestions] = useState([])
  const [allQuestions, setAllQuestions] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [courses, setCourses] = useState([])
  const [levels, setLevels] = useState([])
  const [selectedSpecialization, setSelectedSpecialization] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    text: "",
    order: "",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
  const [optionEditDialog, setOptionEditDialog] = useState({ isOpen: false, option: null, question: null })
  const [detailDialog, setDetailDialog] = useState({ isOpen: false, question: null })

  // Pagination & Filtering states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("order")
  const [sortOrder, setSortOrder] = useState("asc")

  // جلب الاختصاصات
  const fetchSpecializations = async () => {
    try {
      const res = await getSpecializations()
      const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
        Array.isArray(res.data?.data?.data) ? res.data.data.data :
        Array.isArray(res.data?.data) ? res.data.data : []
      console.log("Specializations data:", data)
      setSpecializations(data)
    } catch (err) {
      console.error("Error fetching specializations:", err)
      showErrorToast("فشل تحميل الاختصاصات")
    }
  }

  // جلب الكورسات بناءً على الاختصاص المحدد
  const fetchCourses = async (specializationId) => {
    if (!specializationId) {
      setCourses([])
      setSelectedCourse("")
      return
    }

    try {
      const res = await getCourses()
      let allCourses = Array.isArray(res.data?.data?.items) ? res.data.data.items :
        Array.isArray(res.data?.data?.data) ? res.data.data.data : []
      
      // فلترة الكورسات حسب الاختصاص المحدد
      const filteredCourses = allCourses.filter(course => 
        course.specializationId === parseInt(specializationId)
      )
      
      console.log("Filtered courses:", filteredCourses)
      setCourses(filteredCourses)
    } catch (err) {
      console.error(err)
      showErrorToast("فشل تحميل الكورسات")
    }
  }

  // جلب مستويات الكورس المحدد
  const fetchCourseLevels = async (courseId) => {
    if (!courseId) {
      setLevels([])
      setSelectedLevel("")
      return
    }

    try {
      const res = await getCourseLevels(courseId)
      console.log("Full levels response:", res)

      let data = []
      if (Array.isArray(res.data?.data)) {
        if (res.data.data.length > 0 && Array.isArray(res.data.data[0])) {
          data = res.data.data[0]
        } else {
          data = res.data.data
        }
      } else if (Array.isArray(res.data?.data?.items)) {
        data = res.data.data.items
      } else if (Array.isArray(res.data?.data?.data)) {
        data = res.data.data.data
      }

      console.log("Levels data:", data)
      setLevels(data || [])
    } catch (err) {
      console.error("Error fetching levels:", err)
      showErrorToast("فشل تحميل مستويات الكورس")
      setLevels([])
    }
  }

  // جلب أسئلة المستوى المحدد
  const fetchLevelQuestions = async (levelId) => {
    if (!levelId) {
      setAllQuestions([])
      return
    }

    setLoading(true)
    try {
      const res = await getQuizByCourseLevel(levelId)
      console.log("📚 Questions API full response:", res)

      // التحقق من وجود خطأ في الريسبونس
      if (res.data?.success === false) {
        console.log("❌ API returned error:", res.data)
        const errorMessage = res.data.message || "فشل تحميل الأسئلة"
        showErrorToast(errorMessage)
        setAllQuestions([])
        return
      }

      let data = []
      if (Array.isArray(res.data?.data)) {
        data = res.data.data
      } else if (Array.isArray(res.data?.data?.data)) {
        data = res.data.data.data
      } else if (Array.isArray(res.data)) {
        data = res.data
      }

      console.log("🎯 Final questions data:", data)
      setAllQuestions(data || [])

      // إذا كانت المصفوفة فارغة، عرض رسالة
      if (data.length === 0) {
        showErrorToast("لا توجد أسئلة لهذا المستوى")
      }

    } catch (err) {
      console.error("❌ Error fetching questions:", err)

      // طباعة كل تفاصيل الخطأ
      if (err.response) {
        console.error("❌ Error response:", err.response)
        console.error("❌ Error data:", err.response.data)
        console.error("❌ Error status:", err.response.status)
        console.error("❌ Error headers:", err.response.headers)

        const errorMessage = err.response.data?.message ||
          err.response.data?.error ||
          `فشل تحميل الأسئلة (${err.response.status})`
        showErrorToast(errorMessage)
      } else if (err.request) {
        console.error("❌ Error request:", err.request)
        showErrorToast("فشل في الاتصال بالخادم")
      } else {
        console.error("❌ Error message:", err.message)
        showErrorToast("حدث خطأ غير متوقع")
      }

      setAllQuestions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpecializations()
  }, [])

  // عند تغيير الاختصاص المحدد
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
      fetchLevelQuestions(selectedLevel)
    } else {
      setAllQuestions([])
    }
  }, [selectedLevel])

  // فلترة وترتيب البيانات
  const filteredAndSortedQuestions = useMemo(() => {
    let filtered = [...allQuestions]

    // البحث بنص السؤال
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.text?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
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

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [allQuestions, searchTerm, sortBy, sortOrder])

  // حساب البيانات المعروضة في الصفحة الحالية
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedQuestions.slice(startIndex, endIndex)
  }, [filteredAndSortedQuestions, currentPage, itemsPerPage])

  // إعادة تعيين الصفحة عند تغيير الفلتر
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, itemsPerPage])

  // التعامل مع تغييرات النموذج
  const handleFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // التعامل مع تغييرات الخيارات
  const handleOptionChange = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      )
    }))
  }

  // تحديد الإجابة الصحيحة
  const handleCorrectAnswerChange = (index) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((option, i) => ({
        ...option,
        isCorrect: i === index
      }))
    }))
  }

  // إضافة خيار جديد
  const addNewOption = () => {
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { text: "", isCorrect: false }]
    }))
  }

  // حذف خيار
  const removeOption = (index) => {
    if (form.options.length <= 2) {
      showErrorToast("يجب أن يحتوي السؤال على خيارين على الأقل")
      return
    }

    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  // حفظ السؤال (إضافة أو تعديل)
  const handleSave = async () => {
    if (!form.text.trim()) return showErrorToast("يرجى إدخال نص السؤال")
    if (!form.order) return showErrorToast("يرجى إدخال ترتيب السؤال")
    if (!selectedLevel) return showErrorToast("يرجى اختيار المستوى أولاً")

    // التحقق من الخيارات
    const validOptions = form.options.filter(opt => opt.text.trim() !== "")
    if (validOptions.length < 2) return showErrorToast("يرجى إدخال خيارين على الأقل")

    const hasCorrectAnswer = validOptions.some(opt => opt.isCorrect)
    if (!hasCorrectAnswer) return showErrorToast("يرجى تحديد الإجابة الصحيحة")

    try {
      const questionData = {
        text: form.text,
        order: parseInt(form.order),
        options: validOptions
      }

      console.log("📤 Sending question data:", questionData)

      if (editItem) {
        await updateQuestion(editItem.id, questionData)
        showSuccessToast("تم تعديل السؤال بنجاح")
        setEditItem(null)
      } else {
        await addQuestion(selectedLevel, questionData)
        showSuccessToast("تم إنشاء السؤال بنجاح")
      }

      // إعادة تعيين النموذج
      setForm({
        text: "",
        order: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false }
        ]
      })
      setIsDialogOpen(false)
      fetchLevelQuestions(selectedLevel)
    } catch (err) {
      console.error("❌ Save error:", err.response?.data || err)
      showErrorToast(err?.response?.data?.message || "فشل العملية")
    }
  }

  // حذف السؤال
  const handleDelete = async (id) => {
    try {
      await deleteQuestion(id)
      fetchLevelQuestions(selectedLevel)
      showSuccessToast("تم الحذف بنجاح")
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "فشل الحذف")
    }
  }

  // حذف جميع أسئلة المستوى
  const handleDeleteAllQuestions = async () => {
    if (!selectedLevel) return

    try {
      await deleteQuiz(selectedLevel)
      fetchLevelQuestions(selectedLevel)
      showSuccessToast("تم حذف جميع أسئلة المستوى بنجاح")
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "فشل الحذف")
    }
  }

  // تحديث خيار
  const handleUpdateOption = async (optionId, data) => {
    try {
      await updateOption(optionId, data)
      showSuccessToast("تم تحديث الخيار بنجاح")
      setOptionEditDialog({ isOpen: false, option: null, question: null })
      fetchLevelQuestions(selectedLevel)
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "فشل التحديث")
    }
  }

  // حذف خيار
  const handleDeleteOption = async (optionId) => {
    try {
      await deleteOption(optionId)
      showSuccessToast("تم حذف الخيار بنجاح")
      setOptionEditDialog({ isOpen: false, option: null, question: null })
      fetchLevelQuestions(selectedLevel)
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "فشل الحذف")
    }
  }

  // الحصول على اسم الاختصاص
  const getSpecializationName = (specializationId) => {
    const specialization = specializations.find(spec => spec.id === specializationId)
    return specialization ? (specialization.name || specialization.title) : "غير محدد"
  }

  // الحصول على اسم الكورس
  const getCourseName = (courseId) => {
    const course = courses.find(crs => crs.id === courseId)
    return course ? course.title : "غير محدد"
  }

  // الحصول على اسم المستوى
  const getLevelName = (levelId) => {
    const level = levels.find(lvl => lvl.id === levelId)
    return level ? level.name : "غير محدد"
  }

  // Pagination calculations
  const totalItems = filteredAndSortedQuestions.length
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
    setSortBy("order")
    setSortOrder("asc")
    setCurrentPage(1)
  }

  // عرض التفاصيل الكاملة للسؤال
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
            onClick={() => setDetailDialog({ isOpen: true, question })}
            className="flex-1"
          >
            <Eye className="w-4 h-4 ml-1" />
            التفاصيل
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditItem(question)
              setForm({
                text: question.text || "",
                order: question.order?.toString() || "",
                options: question.options?.map(opt => ({
                  text: opt.text || "",
                  isCorrect: opt.isCorrect || false
                })) || [
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false }
                  ]
              })
              setIsDialogOpen(true)
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
              itemName: question.text || "بدون نص"
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
        <div className="flex items-center justify-between">
          <CardTitle>إدارة الاختبارات والأسئلة</CardTitle>
          <div className="flex gap-2">
            {selectedLevel && allQuestions.length > 0 && (
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
                      className="bg-red-500 hover:bg-red-600"
                      onClick={handleDeleteAllQuestions}
                    >
                      حذف الكل
                    </AlertDialogAction>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={!selectedLevel}
                  onClick={() => {
                    setEditItem(null)
                    setForm({
                      text: "",
                      order: "",
                      options: [
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false }
                      ]
                    })
                  }}
                >
                  إضافة سؤال <Plus className="w-4 h-4 cursor-pointer" />
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editItem ? "تعديل السؤال" : "إضافة سؤال جديد"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>نص السؤال *</Label>
                    <Textarea
                      value={form.text}
                      onChange={(e) => handleFormChange("text", e.target.value)}
                      rows={3}
                      placeholder="أدخل نص السؤال..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ترتيب السؤال *</Label>
                    <Input
                      type="number"
                      value={form.order}
                      onChange={(e) => handleFormChange("order", e.target.value)}
                      placeholder="ترتيب ظهور السؤال"
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
                        onClick={addNewOption}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة خيار
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {form.options.map((option, index) => (
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
                            onClick={() => removeOption(index)}
                            disabled={form.options.length <= 2}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      💡 يجب تحديد إجابة صحيحة واحدة على الأقل وإدخال خيارين على الأقل
                    </div>
                  </div>

                  <Button onClick={handleSave}>
                    {editItem ? "حفظ التعديل" : "حفظ السؤال"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* التدرج الهرمي: اختصاص → كورس → مستوى */}
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

        {/* معلومات التحديد الحالي */}
        {selectedSpecialization && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold">الاختصاص:</span>
                <Badge variant="secondary">{getSpecializationName(selectedSpecialization)}</Badge>
              </div>
              {selectedCourse && (
                <div className="flex items-center gap-2">
                  <span className="font-bold">الكورس:</span>
                  <Badge variant="secondary">{getCourseName(selectedCourse)}</Badge>
                </div>
              )}
              {selectedLevel && (
                <div className="flex items-center gap-2">
                  <span className="font-bold">المستوى:</span>
                  <Badge variant="secondary">{getLevelName(selectedLevel)}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters Section - Only show when a level is selected */}
        {selectedLevel && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بنص السؤال..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>

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
                  <SelectItem value="20">20 عنصر</SelectItem>
                  <SelectItem value="50">50 عنصر</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">الترتيب</SelectItem>
                  <SelectItem value="text">نص السؤال</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters & Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-sm text-muted-foreground">
                عرض {filteredAndSortedQuestions.length} من أصل {allQuestions.length} سؤال
                {searchTerm && ` (مفلتر)`}
              </div>

              {searchTerm && (
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
             "يرجى اختيار مستوى لعرض أسئلته"}
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
                      onClick={() => handleSort("order")}
                    >
                      <div className="flex items-center gap-1">
                        الترتيب
                        {sortBy === "order" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="table-header cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("text")}
                    >
                      <div className="flex items-center gap-1">
                        نص السؤال
                        {sortBy === "text" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="table-header">عدد الخيارات</TableHead>
                    <TableHead className="table-header">الإجابة الصحيحة</TableHead>
                    <TableHead className="table-header text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedQuestions.length > 0 ? paginatedQuestions.map(question => (
                    <TableRow key={question.id}>
                      <TableCell className="table-cell">
                        <Badge variant="secondary">{question.order}</Badge>
                      </TableCell>
                      <TableCell className="table-cell">
                        <div className="font-medium">{question.text}</div>
                      </TableCell>
                      <TableCell className="table-cell">
                        {question.options?.length || 0}
                      </TableCell>
                      <TableCell className="table-cell">
                        {question.options?.find(opt => opt.isCorrect) ? (
                          <Badge variant="default" className="bg-green-600">
                            ✓ موجودة
                          </Badge>
                        ) : (
                          <Badge variant="secondary">غير محددة</Badge>
                        )}
                      </TableCell>
                      <TableCell className="table-cell text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDetailDialog({ isOpen: true, question })}
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditItem(question)
                            setForm({
                              text: question.text || "",
                              order: question.order?.toString() || "",
                              options: question.options?.map(opt => ({
                                text: opt.text || "",
                                isCorrect: opt.isCorrect
                              })) || [
                                  { text: "", isCorrect: false },
                                  { text: "", isCorrect: false },
                                  { text: "", isCorrect: false },
                                  { text: "", isCorrect: false }
                                ]
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
                            itemId: question.id,
                            itemName: question.text || "بدون نص"
                          })}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        {allQuestions.length === 0 ? "لا توجد أسئلة لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Cards View - for small screens */}
            <div className="block md:hidden space-y-4">
              {paginatedQuestions.length > 0 ? (
                paginatedQuestions.map(question => (
                  <QuestionCard key={question.id} question={question} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {allQuestions.length === 0 ? "لا توجد أسئلة لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                </div>
              )}
            </div>

            {/* Pagination */}
            {paginatedQuestions.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  عرض {startItem} إلى {endItem} من {totalItems} سؤال
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
            <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا السؤال؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف السؤال "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
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

      {/* Question Details Dialog */}
      <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog({ isOpen, question: null })}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل السؤال</DialogTitle>
          </DialogHeader>
          {renderQuestionDetails(detailDialog.question)}
        </DialogContent>
      </Dialog>

      {/* Option Edit Dialog */}
      <Dialog open={optionEditDialog.isOpen} onOpenChange={(isOpen) => setOptionEditDialog({ isOpen, option: null, question: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الخيار</DialogTitle>
          </DialogHeader>
          {optionEditDialog.option && (
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>نص الخيار</Label>
                <Input
                  value={optionEditDialog.option.text}
                  onChange={(e) => setOptionEditDialog(prev => ({
                    ...prev,
                    option: { ...prev.option, text: e.target.value }
                  }))}
                  placeholder="أدخل نص الخيار..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={optionEditDialog.option.isCorrect}
                  onCheckedChange={(checked) => setOptionEditDialog(prev => ({
                    ...prev,
                    option: { ...prev.option, isCorrect: checked }
                  }))}
                />
                <Label>الإجابة الصحيحة</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpdateOption(optionEditDialog.option.id, {
                    text: optionEditDialog.option.text,
                    isCorrect: optionEditDialog.option.isCorrect
                  })}
                  className="flex-1"
                >
                  حفظ التعديل
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteOption(optionEditDialog.option.id)}
                >
                  حذف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Quizzes