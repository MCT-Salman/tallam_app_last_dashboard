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
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Calendar, Percent, Hash, Users, BookOpen } from "lucide-react"
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponActive, getCourseLevels, getCourses } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

const Coupons = () => {
  const [coupons, setCoupons] = useState([])
  const [allCoupons, setAllCoupons] = useState([])
  const [courseLevels, setCourseLevels] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: "",
    discount: "",
    isPercent: true,
    expiry: "",
    maxUsage: "",
    isActive: true,
    courseLevelId: ""
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
  const [detailDialog, setDetailDialog] = useState({ isOpen: false, coupon: null })

  // Pagination & Filtering states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [totalCoupons, setTotalCoupons] = useState(0)

  // جلب جميع الكوبونات
  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
        q: searchTerm || undefined,
        isActive: statusFilter !== "all" ? (statusFilter === "active") : undefined
      }

      console.log("📤 Fetching coupons with params:", params)

      const res = await getCoupons(params)
      console.log("📊 Coupons API response:", res)

      // معالجة الـ response بناءً على الهيكل الذي عرضته
      let data = []
      let total = 0

      if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
        data = res.data.data.data
        total = data.length
      } else if (Array.isArray(res.data?.data)) {
        data = res.data.data
        total = data.length
      } else if (Array.isArray(res.data)) {
        data = res.data
        total = data.length
      }

      setAllCoupons(data || [])
      setCoupons(data || [])
      setTotalCoupons(total || 0)
    } catch (err) {
      console.error("❌ Error fetching coupons:", err)
      showErrorToast("فشل تحميل الكوبونات")
      setAllCoupons([])
      setCoupons([])
      setTotalCoupons(0)
    } finally {
      setLoading(false)
    }
  }

  // جلب الكورسات
  const fetchCourses = async () => {
    try {
      const res = await getCourses()
      console.log("📚 Courses API response:", res)

      let coursesData = []
      if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
        coursesData = res.data.data.items
      } else if (Array.isArray(res.data?.items)) {
        coursesData = res.data.data
      } else if (Array.isArray(res.data)) {
        coursesData = res.data
      }

      setCourses(coursesData || [])
      console.log("📚 Courses data:", coursesData)
    } catch (err) {
      console.error("❌ Error fetching courses:", err)
      showErrorToast("فشل تحميل الكورسات")
    }
  }

  // جلب مستويات كورس محدد
  const fetchCourseLevels = async (courseId) => {
    if (!courseId) {
      setCourseLevels([])
      return
    }

    try {
      const res = await getCourseLevels(courseId)
      console.log(`📚 Levels for course ${courseId}:`, res)

      let levelsData = []
      if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
        levelsData = res.data.data.data
      } else if (Array.isArray(res.data?.data)) {
        levelsData = res.data.data
      } else if (Array.isArray(res.data)) {
        levelsData = res.data
      }

      // إضافة معلومات الكورس لكل مستوى
      const levelsWithCourseInfo = levelsData.map(level => ({
        ...level,
        courseId: courseId,
        courseTitle: courses.find(course => course.id === courseId)?.title || "غير محدد"
      }))

      setCourseLevels(levelsWithCourseInfo)
      console.log("📚 Loaded course levels:", levelsWithCourseInfo)
    } catch (err) {
      console.error(`❌ Error fetching levels for course ${courseId}:`, err)
      showErrorToast("فشل تحميل مستويات الكورس")
      setCourseLevels([])
    }
  }

  useEffect(() => {
    fetchCoupons()
    fetchCourses()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter])

  // عند تغيير الكورس في الفلتر
  useEffect(() => {
    if (courseFilter && courseFilter !== "all") {
      fetchCourseLevels(parseInt(courseFilter))
    } else {
      setCourseLevels([])
      setLevelFilter("all")
    }
  }, [courseFilter])

  // فلترة وترتيب البيانات
  const filteredAndSortedCoupons = useMemo(() => {
    let filtered = [...allCoupons]

    // البحث بالكود
    if (searchTerm.trim()) {
      filtered = filtered.filter(coupon =>
        coupon.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // فلترة بالحالة
    if (statusFilter !== "all") {
      filtered = filtered.filter(coupon =>
        statusFilter === "active" ? coupon.isActive : !coupon.isActive
      )
    }

    // فلترة بالنوع
    if (typeFilter !== "all") {
      filtered = filtered.filter(coupon =>
        typeFilter === "percent" ? coupon.isPercent : !coupon.isPercent
      )
    }

    // فلترة بالكورس
    if (courseFilter !== "all") {
      filtered = filtered.filter(coupon => {
        const courseLevel = allCoupons.find(c => c.id === coupon.id)?.courseLevel
        return courseLevel && courseLevel.courseId === parseInt(courseFilter)
      })
    }

    // فلترة بالمستوى
    if (levelFilter !== "all") {
      filtered = filtered.filter(coupon =>
        coupon.courseLevelId === parseInt(levelFilter)
      )
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "code":
          aValue = a.code?.toLowerCase() || ""
          bValue = b.code?.toLowerCase() || ""
          break
        case "discount":
          aValue = a.discount || 0
          bValue = b.discount || 0
          break
        case "createdAt":
          aValue = new Date(a.createdAt) || new Date(0)
          bValue = new Date(b.createdAt) || new Date(0)
          break
        case "expiry":
          aValue = new Date(a.expiry) || new Date(0)
          bValue = new Date(b.expiry) || new Date(0)
          break
        case "isActive":
          aValue = a.isActive
          bValue = b.isActive
          break
        default:
          aValue = new Date(a.createdAt) || new Date(0)
          bValue = new Date(b.createdAt) || new Date(0)
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [allCoupons, searchTerm, statusFilter, typeFilter, courseFilter, levelFilter, sortBy, sortOrder])

  // حساب البيانات المعروضة في الصفحة الحالية
  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedCoupons.slice(startIndex, endIndex)
  }, [filteredAndSortedCoupons, currentPage, itemsPerPage])

  // إعادة تعيين الصفحة عند تغيير الفلتر
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter, courseFilter, levelFilter, itemsPerPage])

  // التعامل مع تغييرات النموذج
  const handleFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // حفظ الكوبون (إضافة أو تعديل)
  const handleSave = async () => {
    if (!form.code.trim()) return showErrorToast("يرجى إدخال كود الخصم")
    if (!form.discount || parseFloat(form.discount) <= 0) return showErrorToast("يرجى إدخال قيمة الخصم صحيحة")
    if (!form.courseLevelId) return showErrorToast("يرجى اختيار المستوى الدراسي")

    try {
      const couponData = {
        code: form.code.trim().toUpperCase(),
        discount: parseFloat(form.discount),
        isPercent: Boolean(form.isPercent),
        expiry: form.expiry || null,
        maxUsage: form.maxUsage ? parseInt(form.maxUsage) : null,
        isActive: Boolean(form.isActive),
        courseLevelId: parseInt(form.courseLevelId)
      }

      console.log("📤 Sending coupon data:", couponData)

      if (editItem) {
        await updateCoupon(editItem.id, couponData)
        showSuccessToast("تم تعديل الكوبون بنجاح")
        setEditItem(null)
      } else {
        await createCoupon(couponData)
        showSuccessToast("تم إنشاء الكوبون بنجاح")
      }

      // إعادة تعيين النموذج
      setForm({
        code: "",
        discount: "",
        isPercent: true,
        expiry: "",
        maxUsage: "",
        isActive: true,
        courseLevelId: ""
      })
      setIsDialogOpen(false)
      fetchCoupons()
    } catch (err) {
      console.error("❌ Save error:", err.response?.data || err)
      showErrorToast(err?.response?.data?.message || "فشل العملية")
    }
  }

  // تبديل حالة الكوبون
  const handleToggleActive = async (id, isActive) => {
    try {
      await toggleCouponActive(id, !isActive)
      showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} الكوبون بنجاح`)
      fetchCoupons()
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة")
    }
  }

  // حذف الكوبون
  const handleDelete = async (id) => {
    try {
      await deleteCoupon(id)
      fetchCoupons()
      showSuccessToast("تم الحذف بنجاح")
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "فشل الحذف")
    }
  }

  // تنسيق التاريخ بالتقويم السوري
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US')
  }

  // تنسيق العملة السورية
  const formatCurrency = (amount) => {
    if (!amount) return "0 ل.س"
    return new Intl.NumberFormat('ar-SY').format(amount) + " ل.س"
  }

  // التحقق من انتهاء الصلاحية
  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  // الحصول على لون البادج حسب الحالة
  const getStatusBadgeVariant = (coupon) => {
    if (!coupon.isActive) return 'secondary'
    if (isExpired(coupon.expiry)) return 'destructive'
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return 'destructive'
    return 'default'
  }

  // الحصول على نص الحالة
  const getStatusText = (coupon) => {
    if (!coupon.isActive) return "معطل"
    if (isExpired(coupon.expiry)) return "منتهي"
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return "مستنفذ"
    return "نشط"
  }

  // الحصول على اسم المستوى الدراسي والكورس
  const getCourseLevelInfo = (coupon) => {
    if (!coupon.courseLevel) return "غير محدد"

    const courseName = coupon.courseLevel.course?.title || "غير محدد"
    const levelName = coupon.courseLevel.name || "غير محدد"

    return `${courseName} - ${levelName}`
  }

  // Pagination calculations
  const totalItems = filteredAndSortedCoupons.length
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
    setTypeFilter("all")
    setCourseFilter("all")
    setLevelFilter("all")
    setSortBy("createdAt")
    setSortOrder("desc")
    setCurrentPage(1)
  }

  // عرض التفاصيل الكاملة للكوبون
  const renderCouponDetails = (coupon) => {
    if (!coupon) return null

    return (
      <div className="space-y-6 text-right">
        {/* المعلومات الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="font-bold">كود الخصم:</Label>
            <p className="mt-1 text-lg font-mono">{coupon.code}</p>
          </div>
          <div>
            <Label className="font-bold">قيمة الخصم:</Label>
            <p className="mt-1 text-lg">
              {coupon.discount} {coupon.isPercent ? '%' : 'ل.س'}
            </p>
          </div>
          <div>
            <Label className="font-bold">نوع الخصم:</Label>
            <p className="mt-1">{coupon.isPercent ? 'نسبة مئوية' : 'قيمة ثابتة'}</p>
          </div>
          <div>
            <Label className="font-bold">الحالة:</Label>
            <div className="mt-1">
              <Badge variant={getStatusBadgeVariant(coupon)}>
                {getStatusText(coupon)}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="font-bold">تاريخ الانتهاء:</Label>
            <p className="mt-1">{formatDate(coupon.expiry)}</p>
          </div>
          <div>
            <Label className="font-bold">الحد الأقصى للاستخدام:</Label>
            <p className="mt-1">{coupon.maxUsage || 'غير محدد'}</p>
          </div>
          <div>
            <Label className="font-bold">مرات الاستخدام:</Label>
            <p className="mt-1">{coupon.usedCount || 0}</p>
          </div>
          <div>
            <Label className="font-bold">المستوى الدراسي:</Label>
            <p className="mt-1">
              {getCourseLevelInfo(coupon)}
            </p>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="border-t pt-4">
          <h3 className="font-bold mb-2">معلومات إضافية:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="font-medium">تاريخ الإنشاء:</Label>
              <p>{formatDate(coupon.createdAt)}</p>
            </div>
            <div>
              <Label className="font-medium">آخر تحديث:</Label>
              <p>{formatDate(coupon.updatedAt)}</p>
            </div>
            <div>
              <Label className="font-medium">معرف الكوبون:</Label>
              <p>{coupon.id || "غير محدد"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // مكون بطاقة الكوبون للعرض على الجوال
  const CouponCard = ({ coupon }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg font-mono">{coupon.code}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusBadgeVariant(coupon)}>
                  {getStatusText(coupon)}
                </Badge>
                <Badge variant={coupon.isPercent ? "default" : "secondary"}>
                  {coupon.isPercent ? 'نسبة' : 'ثابت'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">
                {coupon.discount} {coupon.isPercent ? '%' : 'ل.س'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{formatDate(coupon.expiry)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{coupon.usedCount || 0} / {coupon.maxUsage || '∞'}</span>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>{getCourseLevelInfo(coupon)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDetailDialog({ isOpen: true, coupon })}
            className="flex-1"
          >
            <Eye className="w-4 h-4 ml-1" />
            التفاصيل
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
            className="flex-1"
          >
            {coupon.isActive ? <Pause className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" />}
            {coupon.isActive ? "إيقاف" : "تفعيل"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditItem(coupon)
              setForm({
                code: coupon.code || "",
                discount: coupon.discount?.toString() || "",
                isPercent: coupon.isPercent,
                expiry: coupon.expiry?.split('T')[0] || "",
                maxUsage: coupon.maxUsage?.toString() || "",
                isActive: coupon.isActive,
                courseLevelId: coupon.courseLevelId?.toString() || ""
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
              itemId: coupon.id,
              itemName: coupon.code || "بدون كود"
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
          <CardTitle>إدارة كوبونات الخصم</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditItem(null)
                  setForm({
                    code: "",
                    discount: "",
                    isPercent: true,
                    expiry: "",
                    maxUsage: "",
                    isActive: true,
                    courseLevelId: ""
                  })
                }}
              >
                إضافة كوبون <Plus className="w-4 h-4 cursor-pointer" />
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editItem ? "تعديل الكوبون" : "إضافة كوبون جديد"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>كود الخصم *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => handleFormChange("code", e.target.value)}
                    placeholder="أدخل كود الخصم..."
                    className="font-mono text-center text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>قيمة الخصم *</Label>
                    <Input
                      type="number"
                      value={form.discount}
                      onChange={(e) => handleFormChange("discount", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>نوع الخصم</Label>
                    <Select
                      value={form.isPercent.toString()}
                      onValueChange={(value) => handleFormChange("isPercent", value === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">نسبة مئوية %</SelectItem>
                        <SelectItem value="false">قيمة ثابتة (ل.س)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ الانتهاء</Label>
                    <Input
                      type="date"
                      value={form.expiry}
                      onChange={(e) => handleFormChange("expiry", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الحد الأقصى للاستخدام</Label>
                    <Input
                      type="number"
                      value={form.maxUsage}
                      onChange={(e) => handleFormChange("maxUsage", e.target.value)}
                      placeholder="غير محدد"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المستوى الدراسي *</Label>
                    <Select
                      value={form.courseLevelId}
                      onValueChange={(value) => handleFormChange("courseLevelId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستوى الدراسي" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(courseLevels) && courseLevels.map(level => (
                          <SelectItem key={level.id} value={level.id.toString()}>
                            {level.courseTitle} - {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 flex items-center gap-2">
                    <Label>الحالة</Label>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) => handleFormChange("isActive", checked)}
                    />
                    <span>{form.isActive ? "نشط" : "معطل"}</span>
                  </div>
                </div>

                <Button onClick={handleSave}>
                  {editItem ? "حفظ التعديل" : "حفظ"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالكود..."
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

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة بالنوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="percent">نسبة مئوية</SelectItem>
              <SelectItem value="fixed">قيمة ثابتة</SelectItem>
            </SelectContent>
          </Select>

          {/* Course Filter */}
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة بالكورس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الكورسات</SelectItem>
              {Array.isArray(courses) && courses.map(course => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Level Filter */}
          <Select
            value={levelFilter}
            onValueChange={setLevelFilter}
            disabled={!courseFilter || courseFilter === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder={courseFilter !== "all" ? "فلترة بالمستوى" : "اختر الكورس أولاً"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              {Array.isArray(courseLevels) && courseLevels.map(level => (
                <SelectItem key={level.id} value={level.id.toString()}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filters & Results Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-sm text-muted-foreground">
            عرض {startItem} إلى {endItem} من {totalItems} كوبون
            {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || courseFilter !== "all" || levelFilter !== "all") && ` (مفلتر)`}
          </div>

          {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || courseFilter !== "all" || levelFilter !== "all") && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              إعادة تعيين الفلترة
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
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
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex items-center gap-1">
                        كود الخصم
                        {sortBy === "code" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="table-header cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("discount")}
                    >
                      <div className="flex items-center gap-1">
                        الخصم
                        {sortBy === "discount" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="table-header">النوع</TableHead>
                    <TableHead className="table-header">الاستخدام</TableHead>
                    <TableHead
                      className="table-header cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("expiry")}
                    >
                      <div className="flex items-center gap-1">
                        الانتهاء
                        {sortBy === "expiry" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="table-header">المستوى</TableHead>
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
                  {Array.isArray(paginatedCoupons) && paginatedCoupons.length > 0 ? paginatedCoupons.map(coupon => (
                    <TableRow key={coupon.id}>
                      <TableCell className="table-cell">
                        <div className="font-mono font-bold">{coupon.code}</div>
                      </TableCell>
                      <TableCell className="table-cell">
                        <div className="flex items-center gap-2">
                          {coupon.isPercent ? (
                            <Percent className="w-4 h-4 text-green-600" />
                          ) : (
                            <Hash className="w-4 h-4 text-blue-600" />
                          )}
                          <span className="font-bold">
                            {coupon.discount} {coupon.isPercent ? '%' : 'ل.س'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="table-cell">
                        <Badge variant={coupon.isPercent ? "default" : "secondary"}>
                          {coupon.isPercent ? 'نسبة' : 'ثابت'}
                        </Badge>
                      </TableCell>
                      <TableCell className="table-cell">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{coupon.usedCount || 0} / {coupon.maxUsage || '∞'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{formatDate(coupon.expiry)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="table-cell">
                        {getCourseLevelInfo(coupon)}
                      </TableCell>
                      <TableCell className="table-cell">
                        <Badge variant={getStatusBadgeVariant(coupon)}>
                          {getStatusText(coupon)}
                        </Badge>
                      </TableCell>
                      <TableCell className="table-cell text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDetailDialog({ isOpen: true, coupon })}
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                          title={coupon.isActive ? "تعطيل" : "تفعيل"}
                        >
                          {coupon.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditItem(coupon)
                            setForm({
                              code: coupon.code || "",
                              discount: coupon.discount?.toString() || "",
                              isPercent: coupon.isPercent,
                              expiry: coupon.expiry?.split('T')[0] || "",
                              maxUsage: coupon.maxUsage?.toString() || "",
                              isActive: coupon.isActive,
                              courseLevelId: coupon.courseLevelId?.toString() || ""
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
                            itemId: coupon.id,
                            itemName: coupon.code || "بدون كود"
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
                        {allCoupons.length === 0 ? "لا توجد كوبونات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Cards View - for small screens */}
            <div className="block md:hidden">
              {Array.isArray(paginatedCoupons) && paginatedCoupons.length > 0 ? (
                paginatedCoupons.map(coupon => (
                  <CouponCard key={coupon.id} coupon={coupon} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {allCoupons.length === 0 ? "لا توجد كوبونات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                </div>
              )}
            </div>

            {/* Pagination */}
            {Array.isArray(paginatedCoupons) && paginatedCoupons.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  عرض {startItem} إلى {endItem} من {totalItems} كوبون
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
            <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا الكوبون؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف الكوبون "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
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

      {/* Coupon Details Dialog */}
      <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog({ isOpen, coupon: null })}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الكوبون</DialogTitle>
          </DialogHeader>
          {renderCouponDetails(detailDialog.coupon)}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Coupons