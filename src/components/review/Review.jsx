import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Star, Search, Filter, User, MessageCircle, Calendar, BookOpen, Eye, Trash2 } from "lucide-react"
import { getReviews, getCourses, getCourseLevels, getInstructorsByCourse } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

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

  // جلب الكورسات
  const fetchCourses = async () => {
    try {
      const res = await getCourses()
      if (res.data?.success) {
        setCourses(res.data.data?.items || res.data.data || [])
      }
    } catch (err) {
      console.error("❌ Error fetching courses:", err)
      showErrorToast("فشل تحميل الكورسات")
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
      showErrorToast("فشل تحميل مستويات الكورس")
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
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 mr-2">({rating})</span>
      </div>
    )
  }

  // تحميل البيانات الأولية
  useEffect(() => {
    fetchCourses()
  }, [])

  // بطاقة التقييم للعرض على الجوال
  const ReviewCard = ({ review }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* رأس البطاقة */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {review.user?.avatarUrl ? (
                  <img 
                    src={review.user.avatarUrl} 
                    alt={review.user.name}
                    className="w-10 h-10 rounded-full object-cover"
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
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString('ar-SA') : '---'}
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
            onClick={() => {/* يمكن إضافة وظيفة عرض التفاصيل */}}
          >
            <Eye className="w-4 h-4 ml-1" />
            التفاصيل
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => {/* يمكن إضافة وظيفة الحذف */}}
          >
            <Trash2 className="w-4 h-4 ml-1" />
            حذف
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
            عرض وإدارة تقييمات المستخدمين للكورسات والمستويات
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
              <Label>اختر الكورس</Label>
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الكورس" />
                </SelectTrigger>
                <SelectContent>
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
                  <SelectValue placeholder={selectedCourse ? "اختر المستوى" : "اختر الكورس أولاً"} />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name} (ترتيب: {level.order})
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
              <p className="text-lg">يرجى اختيار كورس ومستوى لعرض التقييمات</p>
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
                      <TableHead className="text-right">الكورس</TableHead>
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
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {review.user?.avatarUrl ? (
                                <img 
                                  src={review.user.avatarUrl} 
                                  alt={review.user.name}
                                  className="w-8 h-8 rounded-full object-cover"
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
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('ar-SA') : '---'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {/* عرض التفاصيل */}}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              عرض
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {/* حذف التقييم */}}
                            >
                              <Trash2 className="w-4 h-4 ml-1" />
                              حذف
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
    </div>
  )
}

export default Review