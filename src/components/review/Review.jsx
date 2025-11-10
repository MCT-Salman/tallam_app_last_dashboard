import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, Search, Filter, User, MessageCircle, Calendar, BookOpen, Eye, Trash2 } from "lucide-react"
import { getReviews, getCourses, getCourseLevels, deleteReview } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
const Review = () => {
  const [loading, setLoading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 })

  // بيانات التصفية
  const [courses, setCourses] = useState([])
  const [levels, setLevels] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // حالة لعرض التفاصيل
  const [detailDialog, setDetailDialog] = useState({ isOpen: false, review: null })
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, reviewId: null, reviewInfo: "" })

  // دالة لتنظيف وعرض الصورة
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    // إذا كانت الصورة تحتوي على مسار كامل
    if (imageUrl.startsWith('http')) return imageUrl
    // إذا كانت الصورة تبدأ بـ /uploads
    if (imageUrl.startsWith('/uploads')) {
      return `https://dev.tallaam.com${imageUrl}`
    }
    // إذا كانت الصورة تحتوي على مسار نسبي فقط
    return `https://dev.tallaam.com/uploads${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
  }

  // جلب الكورسات
  const fetchCourses = async () => {
    try {
      const res = await getCourses()
      if (res.data?.success) {
        setCourses(res.data.data?.items || res.data.data || [])
      }
    } catch (err) {
      console.error("❌ Error fetching courses:", err)
      showErrorToast("فشل تحميل المواد")
    }
  }

  // جلب مستويات الكورس
  const fetchLevels = async (courseId) => {
    if (!courseId) {
      setLevels([])
      setSelectedLevel("")
      return
    }

    try {
      const res = await getCourseLevels(courseId)
      console.log("📊 Levels response:", res.data)

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

      setLevels(data || [])
    } catch (err) {
      console.error("❌ Error fetching levels:", err)
      showErrorToast("فشل تحميل مستويات المواد")
      setLevels([])
    }
  }

  // جلب التقييمات
  const fetchReviews = async (levelId) => {
    if (!levelId) {
      setReviews([])
      setStats({ averageRating: 0, totalReviews: 0 })
      return
    }

    setLoading(true)
    try {
      const res = await getReviews(levelId)
      console.log("⭐ Reviews response:", res.data)

      if (res.data?.success) {
        setReviews(res.data.data?.reviews || [])
        setStats(res.data.data?.stats || { averageRating: 0, totalReviews: 0 })
      }
    } catch (err) {
      console.error("❌ Error fetching reviews:", err)
      showErrorToast(err?.response?.data?.message || "فشل تحميل التقييمات")
      setReviews([])
      setStats({ averageRating: 0, totalReviews: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId)
      showSuccessToast("تم حذف التقييم بنجاح")

      // إعادة تحميل التقييمات بعد الحذف
      if (selectedLevel) {
        fetchReviews(selectedLevel)
      }

      setDeleteDialog({ isOpen: false, reviewId: null, reviewInfo: "" })
    } catch (err) {
      console.error("❌ Error deleting review:", err)
      showErrorToast(err?.response?.data?.message || "فشل حذف التقييم")
    }
  }

  // التعامل مع تغيير الكورس
  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId)
    setSelectedLevel("")
    fetchLevels(courseId)
  }

  // التعامل مع تغيير المستوى
  const handleLevelChange = (levelId) => {
    setSelectedLevel(levelId)
    fetchReviews(levelId)
  }

  // تصفية التقييمات حسب البحث
  const filteredReviews = reviews.filter(review =>
    review.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.courseLevel?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // عرض النجوم
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
              }`}
          />
        ))}
        <span className="text-sm text-gray-600 mr-2">({rating})</span>
      </div>
    )
  }

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد"
    return new Date(dateString).toLocaleDateString('en-US')
  }

  // تحميل البيانات الأولية
  useEffect(() => {
    fetchCourses()
  }, [])

  // عرض تفاصيل التقييم
  const renderReviewDetails = (review) => {
    if (!review) return null

    return (
      <div className="space-y-6 text-right">
        {/* الهيدر مع المعلومات الأساسية */}
        <div className="bg-gradient-to-l from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* صورة المستخدم */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 bg-gray-200 rounded-2xl shadow-lg border-4 border-white overflow-hidden">
                {review.user?.avatarUrl ? (
                  <img
                    src={getImageUrl(review.user.avatarUrl)}
                    alt={review.user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 rounded-2xl flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-500" />
                  </div>
                )}
              </div>
              {/* شارة رقم التقييم */}
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-lg">
                #{review.id}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                تقييم #{review.id}
              </h2>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  ⭐ {review.rating}/5
                </Badge>

                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  <BookOpen className="w-3 h-3 ml-1" />
                  {review.courseLevel?.course?.title}
                </Badge>

                {review.comment && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    💬 يحتوي على تعليق
                  </Badge>
                )}
              </div>

              {/* معلومات سريعة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>المستخدم: {review.user?.name || "غير محدد"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>التاريخ: {formatDate(review.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* الشبكة الرئيسية للمعلومات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* معلومات التقييم */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-l from-yellow-50 to-amber-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <Star className="w-5 h-5 text-yellow-600" />
                معلومات التقييم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700">التقييم</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-2xl text-yellow-600 block">
                      {review.rating}/5
                    </span>
                    {renderStars(review.rating)}
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">تاريخ التقييم</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900 block">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات المستخدم */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-l from-purple-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <User className="w-5 h-5 text-purple-600" />
                معلومات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">الاسم الكامل</span>
                  <span className="font-medium text-gray-900">
                    {review.user?.name || "غير محدد"}
                  </span>
                </div>

                {/* <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">معرف المستخدم</span>
                  <span className="font-medium text-gray-900">
                    #{review.userId}
                  </span>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* معلومات الكورس */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 bg-gradient-to-l from-green-50 to-emerald-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
              <BookOpen className="w-5 h-5 text-green-600" />
              معلومات المادة
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">اسم المادة</span>
                  <span className="font-medium text-gray-900">
                    {review.courseLevel?.course?.title || "غير محدد"}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">المستوى</span>
                  <span className="font-medium text-gray-900">
                    {review.courseLevel?.name || "غير محدد"}
                  </span>
                </div>
              </div>

              {/* <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">معرف المستوى</span>
                  <span className="font-medium text-gray-900">
                    #{review.courseLevelId}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">معرف التقييم</span>
                  <span className="font-medium text-gray-900">
                    #{review.id}
                  </span>
                </div>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* التعليق */}
        {review.comment && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-l from-blue-50 to-cyan-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                التعليق
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {review.comment}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // بطاقة التقييم للعرض على الجوال
  const ReviewCard = ({ review }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* رأس البطاقة */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {review.user?.avatarUrl ? (
                  <img
                    src={getImageUrl(review.user.avatarUrl)}
                    alt={review.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
                    }}
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm">{review.user?.name}</h3>
                <p className="text-xs text-gray-500">
                  {review.courseLevel?.course?.title}
                </p>
              </div>
            </div>
            {renderStars(review.rating)}
          </div>

          {/* التعليق */}
          {review.comment && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            </div>
          )}

          {/* المعلومات الإضافية */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{review.courseLevel?.name}</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              #{review.id}
            </Badge>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => setDetailDialog({ isOpen: true, review })}
          >
            <Eye className="w-4 h-4 ml-1" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => setDeleteDialog({
              isOpen: true,
              reviewId: review.id,
              reviewInfo: `تقييم ${review.user?.name} للمادة ${review.courseLevel?.course?.title}`
            })}
          >
            <Trash2 className="w-4 h-4 ml-1" />

          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">إدارة التقييمات</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            عرض وإدارة تقييمات المستخدمين للمواد والمستويات
          </p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      {stats.totalReviews > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">متوسط التقييم</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-sm text-gray-600 mt-1">إجمالي التقييمات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{filteredReviews.length}</div>
              <p className="text-sm text-gray-600 mt-1">التقييمات المفلترة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* أدوات التصفية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right text-lg">
            <Filter className="w-5 h-5" />
            تصفية التقييمات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* اختيار الكورس */}
            <div className="space-y-2">
              <Label>اختر المادة</Label>
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent searchable>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
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
                onValueChange={handleLevelChange}
                disabled={!selectedCourse}
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder={selectedCourse ? "اختر المستوى" : "اختر المادة أولاً"} />
                </SelectTrigger>
                <SelectContent searchable>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name}
                      {/* (ترتيب: {level.order}) */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* البحث */}
            <div className="space-y-2">
              <Label>بحث في التقييمات</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في التقييمات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </div>

            {/* معلومات التحديد */}
            <div className="space-y-2">
              <Label>الحالة</Label>
              <div className="p-2 bg-gray-50 rounded-lg text-sm text-center">
                {selectedLevel ? (
                  <Badge variant="default" className="bg-green-600">
                    {reviews.length} تقييم
                  </Badge>
                ) : (
                  <span className="text-gray-500">اختر مستوى لعرض التقييمات</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة التقييمات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Star className="w-5 h-5" />
            قائمة التقييمات
            {selectedLevel && ` (${filteredReviews.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedLevel ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg">يرجى اختيار مادة ومستوى لعرض التقييمات</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
            </div>
          ) : (
            <>
              {/* عرض الجدول للشاشات المتوسطة والكبيرة */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">المادة</TableHead>
                      <TableHead className="text-right">المستوى</TableHead>
                      <TableHead className="text-right">التقييم</TableHead>
                      <TableHead className="text-right">التعليق</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex items-center gap-3 justify-end">
                            <div className="text-right">
                              <div className="font-medium">{review.user?.name}</div>
                              <div className="text-sm text-gray-500">#{review.userId}</div>
                            </div>
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {review.user?.avatarUrl ? (
                                <img
                                  src={getImageUrl(review.user.avatarUrl)}
                                  alt={review.user.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
                                  }}
                                />
                              ) : (
                                <User className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {review.courseLevel?.course?.title}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {review.courseLevel?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            {renderStars(review.rating)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right max-w-xs">
                          {review.comment ? (
                            <p className="text-sm line-clamp-2">{review.comment}</p>
                          ) : (
                            <span className="text-gray-400 text-sm">لا يوجد تعليق</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatDate(review.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDetailDialog({ isOpen: true, review })}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteDialog({
                                isOpen: true,
                                reviewId: review.id,
                                reviewInfo: `تقييم ${review.user?.name} للمادة ${review.courseLevel?.course?.title}`
                              })}
                            >
                              <Trash2 className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* عرض البطاقات للشاشات الصغيرة */}
              <div className="block md:hidden space-y-4">
                {filteredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </>
          )}

          {selectedLevel && !loading && filteredReviews.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg">لا توجد تقييمات لهذا المستوى</p>
              {searchTerm && (
                <p className="text-sm mt-2">جرب تغيير كلمات البحث</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ديالوج التفاصيل */}
      <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog({ isOpen, review: null })}>
        <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 text-right">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-600" />
                تفاصيل التقييم
              </div>
            </DialogTitle>
          </DialogHeader>
          {renderReviewDetails(detailDialog.review)}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
      >
        <AlertDialogContent className="text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا التقييم؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف التقييم "{deleteDialog.reviewInfo}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse gap-2">
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => handleDeleteReview(deleteDialog.reviewId)}
            >
              حذف
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeleteDialog({ isOpen: false, reviewId: null, reviewInfo: "" })}>
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Review