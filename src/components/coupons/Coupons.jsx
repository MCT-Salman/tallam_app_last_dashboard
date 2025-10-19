import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Calendar, Percent, Hash, Users, BookOpen, Loader2, Filter } from "lucide-react"
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponActive, getCourseLevels, getCourses, getSpecializations, getInstructorsByCourse } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

const Coupons = () => {
  // الحالات الأساسية
  const [coupons, setCoupons] = useState([])
  const [allCoupons, setAllCoupons] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [courses, setCourses] = useState([])
  const [instructors, setInstructors] = useState([])
  const [courseLevels, setCourseLevels] = useState([])
  const [loading, setLoading] = useState(false)
  
  // حالات التحديد الهرمي
  const [selectedSpecialization, setSelectedSpecialization] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedInstructor, setSelectedInstructor] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")

  // حالات البحث في التحديدات
  const [specializationSearch, setSpecializationSearch] = useState("")
  const [courseSearch, setCourseSearch] = useState("")
  const [instructorSearch, setInstructorSearch] = useState("")
  const [levelSearch, setLevelSearch] = useState("")

  // حالة النموذج
  const [form, setForm] = useState({
    code: "",
    discount: "",
    isPercent: true,
    expiry: "",
    maxUsage: "",
    isActive: true,
    specializationId: "",
    courseId: "",
    instructorId: "",
    courseLevelId: ""
  })

  // حالات الديالوج
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
  const [detailDialog, setDetailDialog] = useState({ isOpen: false, coupon: null })

  // حالات الفلترة والترتيب
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [specializationFilter, setSpecializationFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [instructorFilter, setInstructorFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [totalCoupons, setTotalCoupons] = useState(0)

  // 🔄 جلب البيانات الأساسية
  const fetchSpecializations = async () => {
    try {
      const res = await getSpecializations()
      const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                  Array.isArray(res.data?.data?.data) ? res.data.data.data :
                  Array.isArray(res.data?.data) ? res.data.data : []
      setSpecializations(data)
    } catch (err) {
      console.error("❌ Error fetching specializations:", err)
      showErrorToast("فشل تحميل الاختصاصات")
    }
  }

  const fetchCourses = async (specializationId = null) => {
    try {
      const res = await getCourses()
      let allCourses = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                      Array.isArray(res.data?.data?.data) ? res.data.data.data : []
      
      // فلترة الكورسات حسب الاختصاص إذا تم تحديده
      if (specializationId) {
        allCourses = allCourses.filter(course => 
          course.specializationId === parseInt(specializationId)
        )
      }
      
      setCourses(allCourses)
    } catch (err) {
      console.error("❌ Error fetching courses:", err)
      showErrorToast("فشل تحميل الكورسات")
    }
  }

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

  const fetchCourseLevels = async (courseId, instructorId = null) => {
    if (!courseId) {
      setCourseLevels([])
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
      
      // ✅ فلترة المستويات حسب المدرس المحدد
      let filteredLevels = data || [];
      if (instructorId) {
        const selectedInstructorData = instructors.find(inst => inst.id === parseInt(instructorId));
        if (selectedInstructorData && selectedInstructorData.levelIds) {
          filteredLevels = filteredLevels.filter(level => 
            selectedInstructorData.levelIds.includes(level.id)
          );
        }
      }
      
      // إضافة معلومات الكورس لكل مستوى
      const levelsWithCourseInfo = filteredLevels.map(level => ({
        ...level,
        courseId: courseId,
        courseTitle: courses.find(course => course.id === courseId)?.title || "غير محدد"
      }))

      setCourseLevels(levelsWithCourseInfo);
    } catch (err) {
      console.error("Error fetching levels:", err);
      showErrorToast("فشل تحميل مستويات الكورس");
      setCourseLevels([]);
    }
  }

  // 🔄 جلب الكوبونات
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

      // معالجة الـ response
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

  // 🔄 useEffect للبيانات الأساسية
  useEffect(() => {
    fetchSpecializations()
    fetchCourses()
    fetchCoupons()
  }, [])

  // 🔄 useEffect للفلترة
  useEffect(() => {
    fetchCoupons()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter])

  // 🔄 عند تغيير الاختصاص في الفلتر
  useEffect(() => {
    if (specializationFilter && specializationFilter !== "all") {
      fetchCourses(specializationFilter)
      setCourseFilter("all")
      setInstructorFilter("all")
      setLevelFilter("all")
    } else {
      fetchCourses()
      setCourseFilter("all")
      setInstructorFilter("all")
      setLevelFilter("all")
    }
  }, [specializationFilter])

  // 🔄 عند تغيير الكورس في الفلتر
  useEffect(() => {
    if (courseFilter && courseFilter !== "all") {
      fetchInstructorsByCourse(parseInt(courseFilter))
      setInstructorFilter("all")
      setLevelFilter("all")
    } else {
      setInstructors([])
      setInstructorFilter("all")
      setLevelFilter("all")
    }
  }, [courseFilter])

  // 🔄 عند تغيير المدرس في الفلتر
  useEffect(() => {
    if (instructorFilter && instructorFilter !== "all") {
      fetchCourseLevels(parseInt(courseFilter), parseInt(instructorFilter))
      setLevelFilter("all")
    } else {
      setCourseLevels([])
      setLevelFilter("all")
    }
  }, [instructorFilter, courseFilter])

  // 🔄 عند تغيير الاختصاص في النموذج
  useEffect(() => {
    if (form.specializationId) {
      fetchCourses(form.specializationId)
      setForm(prev => ({ ...prev, courseId: "", instructorId: "", courseLevelId: "" }))
    } else {
      setCourses([])
      setForm(prev => ({ ...prev, courseId: "", instructorId: "", courseLevelId: "" }))
    }
  }, [form.specializationId])

  // 🔄 عند تغيير الكورس في النموذج
  useEffect(() => {
    if (form.courseId) {
      fetchInstructorsByCourse(parseInt(form.courseId))
      setForm(prev => ({ ...prev, instructorId: "", courseLevelId: "" }))
    } else {
      setInstructors([])
      setForm(prev => ({ ...prev, instructorId: "", courseLevelId: "" }))
    }
  }, [form.courseId])

  // 🔄 عند تغيير المدرس في النموذج
  useEffect(() => {
    if (form.instructorId) {
      fetchCourseLevels(parseInt(form.courseId), parseInt(form.instructorId))
      setForm(prev => ({ ...prev, courseLevelId: "" }))
    } else {
      setCourseLevels([])
      setForm(prev => ({ ...prev, courseLevelId: "" }))
    }
  }, [form.instructorId, form.courseId])

  // 🔄 فلترة البيانات للبحث في التحديدات
  const filteredSpecializationsForSelect = useMemo(() => {
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
    if (!levelSearch) return courseLevels;
    return courseLevels.filter(level => 
      level.name?.toLowerCase().includes(levelSearch.toLowerCase())
    );
  }, [courseLevels, levelSearch]);

  // 🔄 فلترة وترتيب الكوبونات
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

    // فلترة بالاختصاص
    if (specializationFilter !== "all") {
      filtered = filtered.filter(coupon => {
        const courseLevel = coupon.courseLevel
        return courseLevel && courseLevel.course?.specializationId === parseInt(specializationFilter)
      })
    }

    // فلترة بالكورس
    if (courseFilter !== "all") {
      filtered = filtered.filter(coupon => {
        const courseLevel = coupon.courseLevel
        return courseLevel && courseLevel.courseId === parseInt(courseFilter)
      })
    }

    // فلترة بالمدرس
    if (instructorFilter !== "all") {
      filtered = filtered.filter(coupon => {
        // هنا يمكن إضافة منطق الفلترة حسب المدرس
        // قد تحتاج إلى تعديل بناءً على هيكل البيانات
        return true; // مؤقتاً
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
  }, [allCoupons, searchTerm, statusFilter, typeFilter, specializationFilter, courseFilter, instructorFilter, levelFilter, sortBy, sortOrder])

  // 🔄 حساب البيانات المعروضة في الصفحة الحالية
  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedCoupons.slice(startIndex, endIndex)
  }, [filteredAndSortedCoupons, currentPage, itemsPerPage])

  // 🔄 إعادة تعيين الصفحة عند تغيير الفلتر
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter, specializationFilter, courseFilter, instructorFilter, levelFilter, itemsPerPage])

  // 🎯 دوال التعامل مع النموذج
  const handleFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setForm({
      code: "",
      discount: "",
      isPercent: true,
      expiry: "",
      maxUsage: "",
      isActive: true,
      specializationId: "",
      courseId: "",
      instructorId: "",
      courseLevelId: ""
    })
    setEditItem(null)
  }

  // 💾 حفظ الكوبون
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
      } else {
        await createCoupon(couponData)
        showSuccessToast("تم إنشاء الكوبون بنجاح")
      }

      resetForm()
      setIsDialogOpen(false)
      fetchCoupons()
    } catch (err) {
      console.error("❌ Save error:", err.response?.data || err)
      showErrorToast(err?.response?.data?.message || "فشل العملية")
    }
  }

  // 🔄 تبديل حالة الكوبون
  const handleToggleActive = async (id, isActive) => {
    try {
      await toggleCouponActive(id, !isActive)
      showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} الكوبون بنجاح`)
      fetchCoupons()
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة")
    }
  }

  // 🗑️ حذف الكوبون
  const handleDelete = async (id) => {
    try {
      await deleteCoupon(id)
      fetchCoupons()
      showSuccessToast("تم الحذف بنجاح")
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "فشل الحذف")
    }
  }

  // 📅 تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US')
  }

  // 🔍 التحقق من انتهاء الصلاحية
  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  // 🎯 الحصول على حالة الكوبون
  const getStatusBadgeVariant = (coupon) => {
    if (!coupon.isActive) return 'secondary'
    if (isExpired(coupon.expiry)) return 'destructive'
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return 'destructive'
    return 'default'
  }

  const getStatusText = (coupon) => {
    if (!coupon.isActive) return "معطل"
    if (isExpired(coupon.expiry)) return "منتهي"
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return "مستنفذ"
    return "نشط"
  }

  // 📚 الحصول على معلومات الكورس والمستوى
  const getCourseLevelInfo = (coupon) => {
    if (!coupon.courseLevel) return "غير محدد"

    const courseName = coupon.courseLevel.course?.title || "غير محدد"
    const levelName = coupon.courseLevel.name || "غير محدد"

    return `${courseName} - ${levelName}`
  }

  // 🎯 دوال مساعدة للحصول على الأسماء
  const getSpecializationName = (specializationId) => {
    const specialization = specializations.find(spec => spec.id === parseInt(specializationId))
    return specialization ? (specialization.name || specialization.title) : "غير محدد"
  }

  const getCourseName = (courseId) => {
    const course = courses.find(crs => crs.id === parseInt(courseId))
    return course ? course.title : "غير محدد"
  }

  const getInstructorName = (instructorId) => {
    const instructor = instructors.find(inst => inst.id === parseInt(instructorId));
    return instructor ? instructor.name : "غير محدد";
  };

  const getLevelName = (levelId) => {
    const level = courseLevels.find(lvl => lvl.id === parseInt(levelId))
    return level ? level.name : "غير محدد"
  }

  // 🔄 إعادة تعيين جميع التحديدات
  const resetAllSelections = () => {
    setSelectedSpecialization("")
    setSelectedCourse("")
    setSelectedInstructor("")
    setSelectedLevel("")
    setSpecializationSearch("")
    setCourseSearch("")
    setInstructorSearch("")
    setLevelSearch("")
  }

  // 📊 حسابات الترقيم
  const totalItems = filteredAndSortedCoupons.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // 🔄 تغيير الصفحة
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // 🔄 الترتيب
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  // 🔄 إعادة تعيين الفلاتر
  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
    setSpecializationFilter("all")
    setCourseFilter("all")
    setInstructorFilter("all")
    setLevelFilter("all")
    setSortBy("createdAt")
    setSortOrder("desc")
    setCurrentPage(1)
  }

  // 👁️ عرض التفاصيل الكاملة للكوبون
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
            {/* <div>
              <Label className="font-medium">معرف الكوبون:</Label>
              <p>{coupon.id || "غير محدد"}</p>
            </div> */}
          </div>
        </div>
      </div>
    )
  }

  // 📱 مكون بطاقة الكوبون للعرض على الجوال
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
                specializationId: coupon.courseLevel?.course?.specializationId?.toString() || "",
                courseId: coupon.courseLevel?.courseId?.toString() || "",
                instructorId: "",
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 ml-1" />
                إضافة كوبون
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

                {/* اختيار الاختصاص والكورس والمدرس والمستوى */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>الاختصاص</Label>
                    <Select
                      value={form.specializationId}
                      onValueChange={(value) => handleFormChange("specializationId", value)}
                    >
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
                        {filteredSpecializationsForSelect.map((spec) => (
                          <SelectItem key={spec.id} value={spec.id.toString()}>
                            {spec.name || spec.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الكورس</Label>
                    <Select
                      value={form.courseId}
                      onValueChange={(value) => handleFormChange("courseId", value)}
                      disabled={!form.specializationId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.specializationId ? "اختر الكورس" : "اختر الاختصاص أولاً"} />
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
                        {filteredCoursesForSelect
                          .filter(course => course.specializationId === parseInt(form.specializationId))
                          .map(course => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.title}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>المدرس</Label>
                    <Select
                      value={form.instructorId}
                      onValueChange={(value) => handleFormChange("instructorId", value)}
                      disabled={!form.courseId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.courseId ? "اختر المدرس" : "اختر الكورس أولاً"} />
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>المستوى الدراسي *</Label>
                    <Select
                      value={form.courseLevelId}
                      onValueChange={(value) => handleFormChange("courseLevelId", value)}
                      disabled={!form.instructorId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.instructorId ? "اختر المستوى الدراسي" : "اختر المدرس أولاً"} />
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
                        {filteredLevelsForSelect.map(level => (
                          <SelectItem key={level.id} value={level.id.toString()}>
                            {level.courseTitle} - {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) => handleFormChange("isActive", checked)}
                  />
                  <Label>الحالة: {form.isActive ? "نشط" : "معطل"}</Label>
                </div>

                <Button onClick={handleSave} className="w-full">
                  {editItem ? "حفظ التعديل" : "حفظ الكوبون"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* مسار الاختيار */}
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

        {/* 🔍 قسم الفلترة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* البحث */}
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* فلترة الحالة */}
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

          {/* فلترة النوع */}
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

          {/* فلترة الاختصاص */}
          <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة بالاختصاص" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الاختصاصات</SelectItem>
              {specializations.map(spec => (
                <SelectItem key={spec.id} value={spec.id.toString()}>
                  {spec.name || spec.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* فلترة الكورس */}
          <Select 
            value={courseFilter} 
            onValueChange={setCourseFilter}
            disabled={!specializationFilter || specializationFilter === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder={specializationFilter !== "all" ? "فلترة بالكورس" : "اختر الاختصاص أولاً"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الكورسات</SelectItem>
              {courses
                .filter(course => course.specializationId === parseInt(specializationFilter))
                .map(course => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>

          {/* فلترة المدرس */}
          <Select 
            value={instructorFilter} 
            onValueChange={setInstructorFilter}
            disabled={!courseFilter || courseFilter === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder={courseFilter !== "all" ? "فلترة بالمدرس" : "اختر الكورس أولاً"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المدرسين</SelectItem>
              {instructors.map(instructor => (
                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                  {instructor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* فلترة المستوى */}
          <Select
            value={levelFilter}
            onValueChange={setLevelFilter}
            disabled={!instructorFilter || instructorFilter === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder={instructorFilter !== "all" ? "فلترة بالمستوى" : "اختر المدرس أولاً"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              {courseLevels.map(level => (
                <SelectItem key={level.id} value={level.id.toString()}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 🔄 إعادة تعيين الفلترة وعدد النتائج */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-sm text-muted-foreground">
            عرض {startItem} إلى {endItem} من {totalItems} كوبون
            {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || specializationFilter !== "all" || courseFilter !== "all" || instructorFilter !== "all" || levelFilter !== "all") && ` (مفلتر)`}
          </div>

          {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || specializationFilter !== "all" || courseFilter !== "all" || instructorFilter !== "all" || levelFilter !== "all") && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <Filter className="w-4 h-4 ml-1" />
              إعادة تعيين الفلترة
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {/* 📊 عرض الجدول للشاشات المتوسطة والكبيرة */}
            <div className="hidden md:block">
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
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
                        className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                        onClick={() => handleSort("discount")}
                      >
                        <div className="flex items-center gap-1">
                          الخصم
                          {sortBy === "discount" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">النوع</TableHead>
                      <TableHead className="whitespace-nowrap">الاستخدام</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                        onClick={() => handleSort("expiry")}
                      >
                        <div className="flex items-center gap-1">
                          الانتهاء
                          {sortBy === "expiry" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">المستوى</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                        onClick={() => handleSort("isActive")}
                      >
                        <div className="flex items-center gap-1">
                          الحالة
                          {sortBy === "isActive" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCoupons.length > 0 ? paginatedCoupons.map(coupon => (
                      <TableRow key={coupon.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-mono font-bold">{coupon.code}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
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
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={coupon.isPercent ? "default" : "secondary"}>
                            {coupon.isPercent ? 'نسبة' : 'ثابت'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span>{coupon.usedCount || 0} / {coupon.maxUsage || '∞'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{formatDate(coupon.expiry)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getCourseLevelInfo(coupon)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(coupon)}>
                            {getStatusText(coupon)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDetailDialog({ isOpen: true, coupon })}
                            title="عرض التفاصيل"
                            className="h-8 w-8"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                            title={coupon.isActive ? "تعطيل" : "تفعيل"}
                            className="h-8 w-8"
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
                                specializationId: coupon.courseLevel?.course?.specializationId?.toString() || "",
                                courseId: coupon.courseLevel?.courseId?.toString() || "",
                                instructorId: "",
                                courseLevelId: coupon.courseLevelId?.toString() || ""
                              })
                              setIsDialogOpen(true)
                            }}
                            title="تعديل"
                            className="h-8 w-8"
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
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {allCoupons.length === 0 ? "لا توجد كوبونات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* 📱 عرض البطاقات للشاشات الصغيرة */}
            <div className="block md:hidden">
              {paginatedCoupons.length > 0 ? (
                paginatedCoupons.map(coupon => (
                  <CouponCard key={coupon.id} coupon={coupon} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {allCoupons.length === 0 ? "لا توجد كوبونات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                </div>
              )}
            </div>

            {/* 🔢 الترقيم */}
            {paginatedCoupons.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
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

                  <div className="flex items-center gap-1 flex-wrap justify-center">
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
                          className="h-8 w-8 p-0"
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

      {/* 🗑️ ديالوج تأكيد الحذف */}
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

      {/* 👁️ ديالوج تفاصيل الكوبون */}
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