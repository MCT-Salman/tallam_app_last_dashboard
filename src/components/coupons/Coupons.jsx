// import React, { useEffect, useState, useMemo } from 'react'
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Switch } from "@/components/ui/switch"
// import { Plus, Edit, DollarSign, Shield, BarChart3, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Calendar, Percent, Hash, Users, BookOpen, Loader2, Filter } from "lucide-react"
// import { getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponActive, getCourseLevels, getCourses, getSpecializations, getInstructorsByCourse } from "@/api/api"
// import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

// const Coupons = () => {
//   // الحالات الأساسية
//   const [coupons, setCoupons] = useState([])
//   const [allCoupons, setAllCoupons] = useState([])
//   const [specializations, setSpecializations] = useState([])
//   const [courses, setCourses] = useState([])
//   const [instructors, setInstructors] = useState([])
//   const [courseLevels, setCourseLevels] = useState([])
//   const [loading, setLoading] = useState(false)

//   // حالات التحديد الهرمي
//   const [selectedSpecialization, setSelectedSpecialization] = useState("")
//   const [selectedCourse, setSelectedCourse] = useState("")
//   const [selectedInstructor, setSelectedInstructor] = useState("")
//   const [selectedLevel, setSelectedLevel] = useState("")

//   // حالات البحث في التحديدات
//   const [specializationSearch, setSpecializationSearch] = useState("")
//   const [courseSearch, setCourseSearch] = useState("")
//   const [instructorSearch, setInstructorSearch] = useState("")
//   const [levelSearch, setLevelSearch] = useState("")

//   // حالة النموذج
//   const [form, setForm] = useState({
//     code: "",
//     discount: "",
//     isPercent: true,
//     expiry: "",
//     maxUsage: "",
//     isActive: true,
//     specializationId: "",
//     courseId: "",
//     instructorId: "",
//     courseLevelId: ""
//   })

//   // حالات الديالوج
//   const [isDialogOpen, setIsDialogOpen] = useState(false)
//   const [editItem, setEditItem] = useState(null)
//   const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
//   const [detailDialog, setDetailDialog] = useState({ isOpen: false, coupon: null })

//   // حالات الفلترة والترتيب
//   const [currentPage, setCurrentPage] = useState(1)
//   const [itemsPerPage, setItemsPerPage] = useState(10)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [statusFilter, setStatusFilter] = useState("all")
//   const [typeFilter, setTypeFilter] = useState("all")
//   const [specializationFilter, setSpecializationFilter] = useState("all")
//   const [courseFilter, setCourseFilter] = useState("all")
//   const [instructorFilter, setInstructorFilter] = useState("all")
//   const [levelFilter, setLevelFilter] = useState("all")
//   const [sortBy, setSortBy] = useState("createdAt")
//   const [sortOrder, setSortOrder] = useState("desc")
//   const [totalCoupons, setTotalCoupons] = useState(0)

//   // 🔄 جلب البيانات الأساسية
//   const fetchSpecializations = async () => {
//     try {
//       const res = await getSpecializations()
//       const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
//         Array.isArray(res.data?.data?.data) ? res.data.data.data :
//           Array.isArray(res.data?.data) ? res.data.data : []
//       setSpecializations(data)
//     } catch (err) {
//       console.error("❌ Error fetching specializations:", err)
//       showErrorToast("فشل تحميل الاختصاصات")
//     }
//   }

//   const fetchCourses = async (specializationId = null) => {
//     try {
//       const res = await getCourses()
//       let allCourses = Array.isArray(res.data?.data?.items) ? res.data.data.items :
//         Array.isArray(res.data?.data?.data) ? res.data.data.data : []

//       // فلترة الكورسات حسب الاختصاص إذا تم تحديده
//       if (specializationId) {
//         allCourses = allCourses.filter(course =>
//           course.specializationId === parseInt(specializationId)
//         )
//       }

//       setCourses(allCourses)
//     } catch (err) {
//       console.error("❌ Error fetching courses:", err)
//       showErrorToast("فشل تحميل الكورسات")
//     }
//   }

//   const fetchInstructorsByCourse = async (courseId) => {
//     if (!courseId) {
//       setInstructors([]);
//       setSelectedInstructor("");
//       return;
//     }

//     try {
//       console.log("🔄 Fetching instructors for course:", courseId);
//       const res = await getInstructorsByCourse(courseId);
//       console.log("📊 Instructors API full response:", res);

//       let data = [];
//       if (Array.isArray(res.data?.data?.instructors)) {
//         data = res.data.data.instructors;
//       } else if (Array.isArray(res.data?.data?.data)) {
//         data = res.data.data.data;
//       } else if (Array.isArray(res.data?.data)) {
//         data = res.data.data;
//       } else if (Array.isArray(res.data)) {
//         data = res.data;
//       }

//       console.log("✅ Extracted instructors for course:", data);
//       setInstructors(data || []);
//     } catch (err) {
//       console.error("❌ Error fetching instructors:", err);
//       showErrorToast("فشل تحميل المدرسين");
//       setInstructors([]);
//     }
//   };

//   const fetchCourseLevels = async (courseId, instructorId = null) => {
//     if (!courseId) {
//       setCourseLevels([])
//       return
//     }

//     try {
//       const res = await getCourseLevels(courseId)
//       console.log("Full levels response:", res);

//       let data = [];
//       if (Array.isArray(res.data?.data)) {
//         if (res.data.data.length > 0 && Array.isArray(res.data.data[0])) {
//           data = res.data.data[0];
//         } else {
//           data = res.data.data;
//         }
//       } else if (Array.isArray(res.data?.data?.items)) {
//         data = res.data.data.items;
//       } else if (Array.isArray(res.data?.data?.data)) {
//         data = res.data.data.data;
//       }

//       // ✅ فلترة المستويات حسب المدرس المحدد
//       let filteredLevels = data || [];
//       if (instructorId) {
//         const selectedInstructorData = instructors.find(inst => inst.id === parseInt(instructorId));
//         if (selectedInstructorData && selectedInstructorData.levelIds) {
//           filteredLevels = filteredLevels.filter(level =>
//             selectedInstructorData.levelIds.includes(level.id)
//           );
//         }
//       }

//       // إضافة معلومات الكورس لكل مستوى
//       const levelsWithCourseInfo = filteredLevels.map(level => ({
//         ...level,
//         courseId: courseId,
//         courseTitle: courses.find(course => course.id === courseId)?.title || "غير محدد"
//       }))

//       setCourseLevels(levelsWithCourseInfo);
//     } catch (err) {
//       console.error("Error fetching levels:", err);
//       showErrorToast("فشل تحميل مستويات الكورس");
//       setCourseLevels([]);
//     }
//   }

//   // 🔄 جلب الكوبونات
//   const fetchCoupons = async () => {
//     setLoading(true)
//     try {
//       const params = {
//         skip: (currentPage - 1) * itemsPerPage,
//         take: itemsPerPage,
//         q: searchTerm || undefined,
//         isActive: statusFilter !== "all" ? (statusFilter === "active") : undefined
//       }

//       console.log("📤 Fetching coupons with params:", params)

//       const res = await getCoupons(params)
//       console.log("📊 Coupons API response:", res)

//       // معالجة الـ response
//       let data = []
//       let total = 0

//       if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
//         data = res.data.data.data
//         total = data.length
//       } else if (Array.isArray(res.data?.data)) {
//         data = res.data.data
//         total = data.length
//       } else if (Array.isArray(res.data)) {
//         data = res.data
//         total = data.length
//       }

//       setAllCoupons(data || [])
//       setCoupons(data || [])
//       setTotalCoupons(total || 0)
//     } catch (err) {
//       console.error("❌ Error fetching coupons:", err)
//       showErrorToast("فشل تحميل الكوبونات")
//       setAllCoupons([])
//       setCoupons([])
//       setTotalCoupons(0)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // 🔄 useEffect للبيانات الأساسية
//   useEffect(() => {
//     fetchSpecializations()
//     fetchCourses()
//     fetchCoupons()
//   }, [])

//   // 🔄 useEffect للفلترة
//   useEffect(() => {
//     fetchCoupons()
//   }, [currentPage, itemsPerPage, searchTerm, statusFilter])

//   // 🔄 عند تغيير الاختصاص في الفلتر
//   useEffect(() => {
//     if (specializationFilter && specializationFilter !== "all") {
//       fetchCourses(specializationFilter)
//       setCourseFilter("all")
//       setInstructorFilter("all")
//       setLevelFilter("all")
//     } else {
//       fetchCourses()
//       setCourseFilter("all")
//       setInstructorFilter("all")
//       setLevelFilter("all")
//     }
//   }, [specializationFilter])

//   // 🔄 عند تغيير الكورس في الفلتر
//   useEffect(() => {
//     if (courseFilter && courseFilter !== "all") {
//       fetchInstructorsByCourse(parseInt(courseFilter))
//       setInstructorFilter("all")
//       setLevelFilter("all")
//     } else {
//       setInstructors([])
//       setInstructorFilter("all")
//       setLevelFilter("all")
//     }
//   }, [courseFilter])

//   // 🔄 عند تغيير المدرس في الفلتر
//   useEffect(() => {
//     if (instructorFilter && instructorFilter !== "all") {
//       fetchCourseLevels(parseInt(courseFilter), parseInt(instructorFilter))
//       setLevelFilter("all")
//     } else {
//       setCourseLevels([])
//       setLevelFilter("all")
//     }
//   }, [instructorFilter, courseFilter])

//   // 🔄 عند تغيير الاختصاص في النموذج
//   useEffect(() => {
//     if (form.specializationId) {
//       fetchCourses(form.specializationId)
//       setForm(prev => ({ ...prev, courseId: "", instructorId: "", courseLevelId: "" }))
//     } else {
//       setCourses([])
//       setForm(prev => ({ ...prev, courseId: "", instructorId: "", courseLevelId: "" }))
//     }
//   }, [form.specializationId])

//   // 🔄 عند تغيير الكورس في النموذج
//   useEffect(() => {
//     if (form.courseId) {
//       fetchInstructorsByCourse(parseInt(form.courseId))
//       setForm(prev => ({ ...prev, instructorId: "", courseLevelId: "" }))
//     } else {
//       setInstructors([])
//       setForm(prev => ({ ...prev, instructorId: "", courseLevelId: "" }))
//     }
//   }, [form.courseId, allCoupons])

//   // 🔄 عند تغيير المدرس في النموذج
//   useEffect(() => {
//     if (form.instructorId) {
//       fetchCourseLevels(parseInt(form.courseId), parseInt(form.instructorId))
//       setForm(prev => ({ ...prev, courseLevelId: "" }))
//     } else {
//       setCourseLevels([])
//       setForm(prev => ({ ...prev, courseLevelId: "" }))
//     }
//   }, [form.instructorId, form.courseId])



//   // 🔄 عند فتح dialog التعديل - تعبئة البيانات التلقائية
//   useEffect(() => {
//     if (editItem && isDialogOpen) {
//       const coupon = allCoupons.find(c => c.id === editItem.id);
//       if (coupon && coupon.courseLevel) {
//         const newForm = {
//           code: coupon.code || "",
//           discount: coupon.discount?.toString() || "",
//           isPercent: coupon.isPercent,
//           expiry: coupon.expiry?.split('T')[0] || "",
//           maxUsage: coupon.maxUsage?.toString() || "",
//           isActive: coupon.isActive,
//           specializationId: coupon.courseLevel?.instructor?.specializationId?.toString() ||
//             coupon.courseLevel?.course?.specializationId?.toString() || "",
//           courseId: coupon.courseLevel?.courseId?.toString() || "",
//           instructorId: coupon.courseLevel?.instructorId?.toString() || "",
//           courseLevelId: coupon.courseLevelId?.toString() || ""
//         };

//         setForm(newForm);

//         // جلب البيانات المرتبطة تلقائياً
//         if (coupon.courseLevel?.course?.specializationId) {
//           fetchCourses(coupon.courseLevel.course.specializationId.toString());
//         }

//         if (coupon.courseLevel?.courseId) {
//           setTimeout(() => {
//             fetchInstructorsByCourse(parseInt(coupon.courseLevel.courseId));
//           }, 100);
//         }

//         if (coupon.courseLevel?.instructorId) {
//           setTimeout(() => {
//             fetchCourseLevels(parseInt(coupon.courseLevel.courseId), parseInt(coupon.courseLevel.instructorId));
//           }, 200);
//         }
//       }
//     }
//   }, [editItem, isDialogOpen, allCoupons]);


//   // 🎯 دالة التعديل
//   const handleEdit = (coupon) => {
//     setEditItem(coupon);

//     // تعبئة البيانات الأساسية أولاً
//     const newForm = {
//       code: coupon.code || "",
//       discount: coupon.discount?.toString() || "",
//       isPercent: coupon.isPercent,
//       expiry: coupon.expiry?.split('T')[0] || "",
//       maxUsage: coupon.maxUsage?.toString() || "",
//       isActive: coupon.isActive,
//       specializationId: coupon.courseLevel?.instructor?.specializationId?.toString() ||
//         coupon.courseLevel?.course?.specializationId?.toString() || "",
//       courseId: coupon.courseLevel?.courseId?.toString() || "",
//       instructorId: coupon.courseLevel?.instructorId?.toString() || "",
//       courseLevelId: coupon.courseLevelId?.toString() || ""
//     };

//     setForm(newForm);
//     setIsDialogOpen(true);

//     // تحميل البيانات المرتبطة
//     if (coupon.courseLevel?.course?.specializationId) {
//       fetchCourses(coupon.courseLevel.course.specializationId.toString());
//     }
//   };


//   // 🔄 فلترة البيانات للبحث في التحديدات
//   const filteredSpecializationsForSelect = useMemo(() => {
//     if (!specializationSearch) return specializations;
//     return specializations.filter(spec =>
//       spec.name?.toLowerCase().includes(specializationSearch.toLowerCase()) ||
//       spec.title?.toLowerCase().includes(specializationSearch.toLowerCase())
//     );
//   }, [specializations, specializationSearch]);

//   const filteredCoursesForSelect = useMemo(() => {
//     if (!courseSearch) return courses;
//     return courses.filter(course =>
//       course.title?.toLowerCase().includes(courseSearch.toLowerCase())
//     );
//   }, [courses, courseSearch]);

//   const filteredInstructorsForSelect = useMemo(() => {
//     if (!instructorSearch) return instructors;
//     return instructors.filter(instructor =>
//       instructor.name?.toLowerCase().includes(instructorSearch.toLowerCase())
//     );
//   }, [instructors, instructorSearch]);

//   const filteredLevelsForSelect = useMemo(() => {
//     if (!levelSearch) return courseLevels;
//     return courseLevels.filter(level =>
//       level.name?.toLowerCase().includes(levelSearch.toLowerCase())
//     );
//   }, [courseLevels, levelSearch]);

//   // 🔄 فلترة وترتيب الكوبونات
//   const filteredAndSortedCoupons = useMemo(() => {
//     let filtered = [...allCoupons]

//     // البحث بالكود
//     if (searchTerm.trim()) {
//       filtered = filtered.filter(coupon =>
//         coupon.code?.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     }

//     // فلترة بالحالة
//     if (statusFilter !== "all") {
//       filtered = filtered.filter(coupon =>
//         statusFilter === "active" ? coupon.isActive : !coupon.isActive
//       )
//     }

//     // فلترة بالنوع
//     if (typeFilter !== "all") {
//       filtered = filtered.filter(coupon =>
//         typeFilter === "percent" ? coupon.isPercent : !coupon.isPercent
//       )
//     }

//     // فلترة بالاختصاص
//     if (specializationFilter !== "all") {
//       filtered = filtered.filter(coupon => {
//         const courseLevel = coupon.courseLevel
//         return courseLevel && courseLevel.course?.specializationId === parseInt(specializationFilter)
//       })
//     }

//     // فلترة بالكورس
//     if (courseFilter !== "all") {
//       filtered = filtered.filter(coupon => {
//         const courseLevel = coupon.courseLevel
//         return courseLevel && courseLevel.courseId === parseInt(courseFilter)
//       })
//     }

//     // فلترة بالمدرس
//     if (instructorFilter !== "all") {
//       filtered = filtered.filter(coupon => {
//         // هنا يمكن إضافة منطق الفلترة حسب المدرس
//         // قد تحتاج إلى تعديل بناءً على هيكل البيانات
//         return true; // مؤقتاً
//       })
//     }

//     // فلترة بالمستوى
//     if (levelFilter !== "all") {
//       filtered = filtered.filter(coupon =>
//         coupon.courseLevelId === parseInt(levelFilter)
//       )
//     }

//     // الترتيب
//     filtered.sort((a, b) => {
//       let aValue, bValue

//       switch (sortBy) {
//         case "code":
//           aValue = a.code?.toLowerCase() || ""
//           bValue = b.code?.toLowerCase() || ""
//           break
//         case "discount":
//           aValue = a.discount || 0
//           bValue = b.discount || 0
//           break
//         case "createdAt":
//           aValue = new Date(a.createdAt) || new Date(0)
//           bValue = new Date(b.createdAt) || new Date(0)
//           break
//         case "expiry":
//           aValue = new Date(a.expiry) || new Date(0)
//           bValue = new Date(b.expiry) || new Date(0)
//           break
//         case "isActive":
//           aValue = a.isActive
//           bValue = b.isActive
//           break
//         default:
//           aValue = new Date(a.createdAt) || new Date(0)
//           bValue = new Date(b.createdAt) || new Date(0)
//       }

//       if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
//       if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
//       return 0
//     })

//     return filtered
//   }, [allCoupons, searchTerm, statusFilter, typeFilter, specializationFilter, courseFilter, instructorFilter, levelFilter, sortBy, sortOrder])

//   // 🔄 حساب البيانات المعروضة في الصفحة الحالية
//   const paginatedCoupons = useMemo(() => {
//     const startIndex = (currentPage - 1) * itemsPerPage
//     const endIndex = startIndex + itemsPerPage
//     return filteredAndSortedCoupons.slice(startIndex, endIndex)
//   }, [filteredAndSortedCoupons, currentPage, itemsPerPage])

//   // 🔄 إعادة تعيين الصفحة عند تغيير الفلتر
//   useEffect(() => {
//     setCurrentPage(1)
//   }, [searchTerm, statusFilter, typeFilter, specializationFilter, courseFilter, instructorFilter, levelFilter, itemsPerPage])

//   // 🎯 دوال التعامل مع النموذج
//   const handleFormChange = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }))
//   }

//   // دالة لتحسين تنسيق التاريخ
//   // const formatDate = (dateString) => {
//   //   if (!dateString) return "غير محدد";
//   //   const date = new Date(dateString);
//   //   return date.toLocaleDateString('ar-SA', {
//   //     year: 'numeric',
//   //     month: 'long',
//   //     day: 'numeric',
//   //     hour: '2-digit',
//   //     minute: '2-digit'
//   //   });
//   // };

//   // دالة لحساب الوقت المنقضي
//   const calculateTimeAgo = (dateString) => {
//     if (!dateString) return "غير محدد";

//     const date = new Date(dateString);
//     const now = new Date();
//     const diffMs = now - date;
//     const diffMins = Math.floor(diffMs / (1000 * 60));
//     const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
//     const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

//     if (diffMins < 1) return "الآن";
//     if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
//     if (diffHours < 24) return `منذ ${diffHours} ساعة`;
//     if (diffDays === 1) return "منذ يوم";
//     if (diffDays < 7) return `منذ ${diffDays} أيام`;
//     if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
//     if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
//     return `منذ ${Math.floor(diffDays / 365)} سنوات`;
//   };

//   const resetForm = () => {
//     setForm({
//       code: "",
//       discount: "",
//       isPercent: true,
//       expiry: "",
//       maxUsage: "",
//       isActive: true,
//       specializationId: "",
//       courseId: "",
//       instructorId: "",
//       courseLevelId: ""
//     })
//     setEditItem(null)
//   }

//   // 💾 حفظ الكوبون
//   const handleSave = async () => {
//     if (!form.code.trim()) return showErrorToast("يرجى إدخال كود الخصم")
//     if (!form.discount || parseFloat(form.discount) <= 0) return showErrorToast("يرجى إدخال قيمة الخصم صحيحة")
//     if (!form.courseLevelId) return showErrorToast("يرجى اختيار المستوى الدراسي")

//     try {
//       const couponData = {
//         code: form.code.trim().toUpperCase(),
//         discount: parseFloat(form.discount),
//         isPercent: Boolean(form.isPercent),
//         expiry: form.expiry || null,
//         maxUsage: form.maxUsage ? parseInt(form.maxUsage) : null,
//         isActive: Boolean(form.isActive),
//         courseLevelId: parseInt(form.courseLevelId)
//       }

//       console.log("📤 Sending coupon data:", couponData)

//       if (editItem) {
//         await updateCoupon(editItem.id, couponData)
//         showSuccessToast("تم تعديل الكوبون بنجاح")
//       } else {
//         await createCoupon(couponData)
//         showSuccessToast("تم إنشاء الكوبون بنجاح")
//       }

//       resetForm()
//       setIsDialogOpen(false)
//       fetchCoupons()
//     } catch (err) {
//       console.error("❌ Save error:", err.response?.data || err)
//       showErrorToast(err?.response?.data?.message || "فشل العملية")
//     }
//   }

//   // 🔄 تبديل حالة الكوبون
//   const handleToggleActive = async (id, isActive) => {
//     try {
//       await toggleCouponActive(id, !isActive)
//       showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} الكوبون بنجاح`)
//       fetchCoupons()
//     } catch (err) {
//       showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة")
//     }
//   }

//   // 🗑️ حذف الكوبون
//   const handleDelete = async (id) => {
//     try {
//       await deleteCoupon(id)
//       fetchCoupons()
//       showSuccessToast("تم الحذف بنجاح")
//     } catch (err) {
//       showErrorToast(err?.response?.data?.message || "فشل الحذف")
//     }
//   }

//   // 📅 تنسيق التاريخ
//   const formatDate = (dateString) => {
//     if (!dateString) return "غير محدد"
//     const date = new Date(dateString)
//     return date.toLocaleDateString('en-US')
//   }

//   // 🔍 التحقق من انتهاء الصلاحية
//   const isExpired = (expiryDate) => {
//     if (!expiryDate) return false
//     return new Date(expiryDate) < new Date()
//   }

//   // 🎯 الحصول على حالة الكوبون
//   const getStatusBadgeVariant = (coupon) => {
//     if (!coupon.isActive) return 'secondary'
//     if (isExpired(coupon.expiry)) return 'destructive'
//     if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return 'destructive'
//     return 'default'
//   }

//   const getStatusText = (coupon) => {
//     if (!coupon.isActive) return "معطل"
//     if (isExpired(coupon.expiry)) return "منتهي"
//     if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return "مستنفذ"
//     return "نشط"
//   }

//   // 📚 الحصول على معلومات الكورس والمستوى
//   const getCourseLevelInfo = (coupon) => {
//     if (!coupon.courseLevel) return "غير محدد"

//     const courseName = coupon.courseLevel.course?.title || "غير محدد"
//     const levelName = coupon.courseLevel.name || "غير محدد"

//     return `${courseName} - ${levelName}`
//   }

//   // 🎯 دوال مساعدة للحصول على الأسماء
//   const getSpecializationName = (specializationId) => {
//     const specialization = specializations.find(spec => spec.id === parseInt(specializationId))
//     return specialization ? (specialization.name || specialization.title) : "غير محدد"
//   }

//   const getCourseName = (courseId) => {
//     const course = courses.find(crs => crs.id === parseInt(courseId))
//     return course ? course.title : "غير محدد"
//   }

//   const getInstructorName = (instructorId) => {
//     const instructor = instructors.find(inst => inst.id === parseInt(instructorId));
//     return instructor ? instructor.name : "غير محدد";
//   };

//   const getLevelName = (levelId) => {
//     const level = courseLevels.find(lvl => lvl.id === parseInt(levelId))
//     return level ? level.name : "غير محدد"
//   }

//   // 🔄 إعادة تعيين جميع التحديدات
//   const resetAllSelections = () => {
//     setSelectedSpecialization("")
//     setSelectedCourse("")
//     setSelectedInstructor("")
//     setSelectedLevel("")
//     setSpecializationSearch("")
//     setCourseSearch("")
//     setInstructorSearch("")
//     setLevelSearch("")
//   }

//   // 📊 حسابات الترقيم
//   const totalItems = filteredAndSortedCoupons.length
//   const totalPages = Math.ceil(totalItems / itemsPerPage)
//   const startItem = (currentPage - 1) * itemsPerPage + 1
//   const endItem = Math.min(currentPage * itemsPerPage, totalItems)

//   // 🔄 تغيير الصفحة
//   const handlePageChange = (page) => {
//     if (page >= 1 && page <= totalPages) {
//       setCurrentPage(page)
//     }
//   }

//   // 🔄 الترتيب
//   const handleSort = (field) => {
//     if (sortBy === field) {
//       setSortOrder(sortOrder === "asc" ? "desc" : "asc")
//     } else {
//       setSortBy(field)
//       setSortOrder("asc")
//     }
//   }

//   // 🔄 إعادة تعيين الفلاتر
//   const resetFilters = () => {
//     setSearchTerm("")
//     setStatusFilter("all")
//     setTypeFilter("all")
//     setSpecializationFilter("all")
//     setCourseFilter("all")
//     setInstructorFilter("all")
//     setLevelFilter("all")
//     setSortBy("createdAt")
//     setSortOrder("desc")
//     setCurrentPage(1)
//   }

//   // 👁️ عرض التفاصيل الكاملة للكوبون
//   const renderCouponDetails = (coupon) => {
//     if (!coupon) return null

//     return (
//       <div className="space-y-6 text-right">
//         {/* المعلومات الأساسية */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <Label className="font-bold">كود الخصم:</Label>
//             <p className="mt-1 text-lg font-mono">{coupon.code}</p>
//           </div>
//           <div>
//             <Label className="font-bold">قيمة الخصم:</Label>
//             <p className="mt-1 text-lg">
//               {coupon.discount} {coupon.isPercent ? '%' : 'ل.س'}
//             </p>
//           </div>
//           <div>
//             <Label className="font-bold">نوع الخصم:</Label>
//             <p className="mt-1">{coupon.isPercent ? 'نسبة مئوية' : 'قيمة ثابتة'}</p>
//           </div>
//           <div>
//             <Label className="font-bold">الحالة:</Label>
//             <div className="mt-1">
//               <Badge variant={getStatusBadgeVariant(coupon)}>
//                 {getStatusText(coupon)}
//               </Badge>
//             </div>
//           </div>
//           <div>
//             <Label className="font-bold">تاريخ الانتهاء:</Label>
//             <p className="mt-1">{formatDate(coupon.expiry)}</p>
//           </div>
//           <div>
//             <Label className="font-bold">الحد الأقصى للاستخدام:</Label>
//             <p className="mt-1">{coupon.maxUsage || 'غير محدد'}</p>
//           </div>
//           <div>
//             <Label className="font-bold">مرات الاستخدام:</Label>
//             <p className="mt-1">{coupon.usedCount || 0}</p>
//           </div>
//           <div>
//             <Label className="font-bold">المستوى الدراسي:</Label>
//             <p className="mt-1">
//               {getCourseLevelInfo(coupon)}
//             </p>
//           </div>
//         </div>

//         {/* معلومات إضافية */}
//         <div className="border-t pt-4">
//           <h3 className="font-bold mb-2">معلومات إضافية:</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <Label className="font-medium">تاريخ الإنشاء:</Label>
//               <p>{formatDate(coupon.createdAt)}</p>
//             </div>
//             <div>
//               <Label className="font-medium">آخر تحديث:</Label>
//               <p>{formatDate(coupon.updatedAt)}</p>
//             </div>
//             {/* <div>
//               <Label className="font-medium">معرف الكوبون:</Label>
//               <p>{coupon.id || "غير محدد"}</p>
//             </div> */}
//           </div>
//         </div>
//       </div>
//     )
//   }

//   // 📱 مكون بطاقة الكوبون للعرض على الجوال
//   const CouponCard = ({ coupon }) => (
//     <Card className="mb-4">
//       <CardContent className="p-4">
//         <div className="space-y-3">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-bold text-lg font-mono">{coupon.code}</h3>
//               <div className="flex items-center gap-2 mt-1">
//                 <Badge variant={getStatusBadgeVariant(coupon)}>
//                   {getStatusText(coupon)}
//                 </Badge>
//                 <Badge variant={coupon.isPercent ? "default" : "secondary"}>
//                   {coupon.isPercent ? 'نسبة' : 'ثابت'}
//                 </Badge>
//               </div>
//             </div>
//             <div className="text-right">
//               <div className="text-xl font-bold">
//                 {coupon.discount} {coupon.isPercent ? '%' : 'ل.س'}
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3 text-sm">
//             <div className="flex items-center gap-2">
//               <Calendar className="w-4 h-4 text-gray-500" />
//               <span>{formatDate(coupon.expiry)}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Users className="w-4 h-4 text-gray-500" />
//               <span>{coupon.usedCount || 0} / {coupon.maxUsage || '∞'}</span>
//             </div>
//             <div className="col-span-2">
//               <div className="flex items-center gap-2 text-muted-foreground">
//                 <BookOpen className="w-4 h-4" />
//                 <span>{getCourseLevelInfo(coupon)}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
//           <Button
//             size="sm"
//             variant="outline"
//             onClick={() => setDetailDialog({ isOpen: true, coupon })}
//             className="flex-1"
//           >
//             <Eye className="w-4 h-4 ml-1" />
//             التفاصيل
//           </Button>
//           <Button
//             size="sm"
//             variant="outline"
//             onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
//             className="flex-1"
//           >
//             {coupon.isActive ? <Pause className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" />}
//             {coupon.isActive ? "إيقاف" : "تفعيل"}
//           </Button>
//           <Button
//             size="sm"
//             variant="outline"
//             onClick={() => {
//               setEditItem(coupon)
//               setForm({
//                 code: coupon.code || "",
//                 discount: coupon.discount?.toString() || "",
//                 isPercent: coupon.isPercent,
//                 expiry: coupon.expiry?.split('T')[0] || "",
//                 maxUsage: coupon.maxUsage?.toString() || "",
//                 isActive: coupon.isActive,
//                 specializationId: coupon.courseLevel?.instructor?.specializationId?.toString() || "",
//                 courseId: coupon.courseLevel?.courseId?.toString() || "",
//                 instructorId: coupon.courseLevel?.instructor?.id?.toString() || "",
//                 courseLevelId: coupon.courseLevelId?.toString() || ""
//               })
//               // setForm({
//               //   code: coupon.code || "",
//               //   discount: coupon.discount?.toString() || "",
//               //   isPercent: coupon.isPercent,
//               //   expiry: coupon.expiry?.split('T')[0] || "",
//               //   maxUsage: coupon.maxUsage?.toString() || "",
//               //   isActive: coupon.isActive,
//               //   specializationId: coupon.courseLevel?.course?.specializationId?.toString() || "",
//               //   courseId: coupon.courseLevel?.courseId?.toString() || "",
//               //   instructorId: "",
//               //   courseLevelId: coupon.courseLevelId?.toString() || ""
//               // })
//               setIsDialogOpen(true)
//             }}
//             className="flex-1"
//           >
//             <Edit className="w-4 h-4 ml-1" />
//             تعديل
//           </Button>
//           <Button
//             size="sm"
//             variant="destructive"
//             onClick={() => setDeleteDialog({
//               isOpen: true,
//               itemId: coupon.id,
//               itemName: coupon.code || "بدون كود"
//             })}
//             className="flex-1"
//           >
//             <Trash2 className="w-4 h-4 ml-1" />
//             حذف
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )

//   return (
//     <Card>
//       <CardHeader className="flex flex-col gap-4">
//         <div className="flex items-center justify-between">
//           <CardTitle>إدارة كوبونات الخصم</CardTitle>
//           <Dialog open={isDialogOpen} onOpenChange={(open) => {
//             setIsDialogOpen(open)
//             if (!open) resetForm()
//           }}>
//             <DialogTrigger asChild>
//               <Button size="sm">
//                 إضافة كوبون
//                 <Plus className="w-4 h-4 ml-1" />
//               </Button>
//             </DialogTrigger>

//             <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle className="text-right">{editItem ? "تعديل الكوبون" : "إضافة كوبون جديد"}</DialogTitle>
//               </DialogHeader>
//               <div className="space-y-4 mt-2">
//                 <div className="space-y-2">
//                   <Label>كود الخصم *</Label>
//                   <Input
//                     value={form.code}
//                     onChange={(e) => handleFormChange("code", e.target.value)}
//                     placeholder="أدخل كود الخصم..."
//                     className="font-mono text-center text-lg"
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label>قيمة الخصم *</Label>
//                     <Input
//                       type="number"
//                       value={form.discount}
//                       onChange={(e) => handleFormChange("discount", e.target.value)}
//                       placeholder="0.00"
//                       min="0"
//                       step="0.01"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label>نوع الخصم</Label>
//                     <Select
//                       value={form.isPercent.toString()}
//                       onValueChange={(value) => handleFormChange("isPercent", value === "true")}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="اختر النوع" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="true">نسبة مئوية %</SelectItem>
//                         <SelectItem value="false">قيمة ثابتة (ل.س)</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label>تاريخ الانتهاء</Label>
//                     <Input
//                       type="date"
//                       value={form.expiry}
//                       onChange={(e) => handleFormChange("expiry", e.target.value)}
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label>الحد الأقصى للاستخدام</Label>
//                     <Input
//                       type="number"
//                       value={form.maxUsage}
//                       onChange={(e) => handleFormChange("maxUsage", e.target.value)}
//                       placeholder="غير محدد"
//                       min="1"
//                     />
//                   </div>
//                 </div>

//                 {/* اختيار الاختصاص والكورس والمدرس والمستوى */}
//                 <div className="space-y-3">
//                   <div className="space-y-2">
//                     <Label>الاختصاص</Label>
//                     <Select
//                       value={form.specializationId}
//                       onValueChange={(value) => handleFormChange("specializationId", value)}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="اختر الاختصاص" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <div className="p-2">
//                           <Input
//                             placeholder="ابحث عن اختصاص..."
//                             value={specializationSearch}
//                             onChange={(e) => setSpecializationSearch(e.target.value)}
//                             className="mb-2"
//                           />
//                         </div>
//                         {filteredSpecializationsForSelect.map((spec) => (
//                           <SelectItem key={spec.id} value={spec.id.toString()}>
//                             {spec.name || spec.title}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label>الكورس</Label>
//                     <Select
//                       value={form.courseId}
//                       onValueChange={(value) => handleFormChange("courseId", value)}
//                       disabled={!form.specializationId}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder={form.specializationId ? "اختر الكورس" : "اختر الاختصاص أولاً"} />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <div className="p-2">
//                           <Input
//                             placeholder="ابحث عن كورس..."
//                             value={courseSearch}
//                             onChange={(e) => setCourseSearch(e.target.value)}
//                             className="mb-2"
//                           />
//                         </div>
//                         {filteredCoursesForSelect
//                           .filter(course => course.specializationId === parseInt(form.specializationId))
//                           .map(course => (
//                             <SelectItem key={course.id} value={course.id.toString()}>
//                               {course.title}
//                             </SelectItem>
//                           ))
//                         }
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label>المدرس</Label>
//                     <Select
//                       value={form.instructorId}
//                       onValueChange={(value) => handleFormChange("instructorId", value)}
//                       disabled={!form.courseId}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder={form.courseId ? "اختر المدرس" : "اختر الكورس أولاً"} />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <div className="p-2">
//                           <Input
//                             placeholder="ابحث عن مدرس..."
//                             value={instructorSearch}
//                             onChange={(e) => setInstructorSearch(e.target.value)}
//                             className="mb-2"
//                           />
//                         </div>
//                         {filteredInstructorsForSelect.map((instructor) => (
//                           <SelectItem key={instructor.id} value={instructor.id.toString()}>
//                             {instructor.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label>المستوى الدراسي *</Label>
//                     <Select
//                       value={form.courseLevelId}
//                       onValueChange={(value) => handleFormChange("courseLevelId", value)}
//                       disabled={!form.instructorId}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder={form.instructorId ? "اختر المستوى الدراسي" : "اختر المدرس أولاً"} />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <div className="p-2">
//                           <Input
//                             placeholder="ابحث عن مستوى..."
//                             value={levelSearch}
//                             onChange={(e) => setLevelSearch(e.target.value)}
//                             className="mb-2"
//                           />
//                         </div>
//                         {filteredLevelsForSelect.map(level => (
//                           <SelectItem key={level.id} value={level.id.toString()}>
//                             {level.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 {/* <div className="flex items-center gap-2">
//                   <Switch
//                     checked={form.isActive}
//                     onCheckedChange={(checked) => handleFormChange("isActive", checked)}
//                   />
//                   <Label>الحالة: {form.isActive ? "نشط" : "معطل"}</Label>
//                 </div> */}

//                 <Button onClick={handleSave} className="w-full">
//                   {editItem ? "حفظ التعديل" : "حفظ الكوبون"}
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>

//         {/* مسار الاختيار */}
//         {(selectedSpecialization || selectedCourse || selectedInstructor || selectedLevel) && (
//           <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
//             <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-medium">
//               <span className="text-blue-700">المسار المختار:</span>
//               <div className="flex items-center gap-2 flex-wrap">
//                 <Badge variant="outline" className="bg-white">
//                   {selectedSpecialization ? getSpecializationName(selectedSpecialization) : "---"}
//                 </Badge>
//                 <ChevronRight className="h-4 w-4 text-blue-500" />
//                 <Badge variant="outline" className="bg-white">
//                   {selectedCourse ? getCourseName(selectedCourse) : "---"}
//                 </Badge>
//                 <ChevronRight className="h-4 w-4 text-blue-500" />
//                 <Badge variant="outline" className="bg-white">
//                   {selectedInstructor ? getInstructorName(selectedInstructor) : "---"}
//                 </Badge>
//                 <ChevronRight className="h-4 w-4 text-blue-500" />
//                 <Badge variant="outline" className="bg-white">
//                   {selectedLevel ? getLevelName(selectedLevel) : "---"}
//                 </Badge>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={resetAllSelections}
//                   className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                 >
//                   إعادة تعيين الكل
//                 </Button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* 🔍 قسم الفلترة */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
//           {/* البحث */}
//           <div className="relative md:col-span-2">
//             <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="بحث بالكود..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pr-10"
//             />
//           </div>

//           {/* فلترة الحالة */}
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger>
//               <SelectValue placeholder="فلترة بالحالة" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">جميع الحالات</SelectItem>
//               <SelectItem value="active">نشط</SelectItem>
//               <SelectItem value="inactive">معطل</SelectItem>
//             </SelectContent>
//           </Select>

//           {/* فلترة النوع */}
//           <Select value={typeFilter} onValueChange={setTypeFilter}>
//             <SelectTrigger>
//               <SelectValue placeholder="فلترة بالنوع" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">جميع الأنواع</SelectItem>
//               <SelectItem value="percent">نسبة مئوية</SelectItem>
//               <SelectItem value="fixed">قيمة ثابتة</SelectItem>
//             </SelectContent>
//           </Select>

//           {/* فلترة الاختصاص */}
//           <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
//             <SelectTrigger>
//               <SelectValue placeholder="فلترة بالاختصاص" />
//             </SelectTrigger>
//             <SelectContent searchable>
//               <SelectItem value="all">جميع الاختصاصات</SelectItem>
//               {specializations.map(spec => (
//                 <SelectItem key={spec.id} value={spec.id.toString()}>
//                   {spec.name || spec.title}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           {/* فلترة الكورس */}
//           <Select
//             value={courseFilter}
//             onValueChange={setCourseFilter}
//             disabled={!specializationFilter || specializationFilter === "all"}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder={specializationFilter !== "all" ? "فلترة بالكورس" : "اختر الاختصاص أولاً"} />
//             </SelectTrigger>
//             <SelectContent searchable>
//               <SelectItem value="all">جميع الكورسات</SelectItem>
//               {courses
//                 .filter(course => course.specializationId === parseInt(specializationFilter))
//                 .map(course => (
//                   <SelectItem key={course.id} value={course.id.toString()}>
//                     {course.title}
//                   </SelectItem>
//                 ))
//               }
//             </SelectContent>
//           </Select>

//           {/* فلترة المدرس */}
//           <Select
//             value={instructorFilter}
//             onValueChange={setInstructorFilter}
//             disabled={!courseFilter || courseFilter === "all"}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder={courseFilter !== "all" ? "فلترة بالمدرس" : "اختر الكورس أولاً"} />
//             </SelectTrigger>
//             <SelectContent searchable>
//               <SelectItem value="all">جميع المدرسين</SelectItem>
//               {instructors.map(instructor => (
//                 <SelectItem key={instructor.id} value={instructor.id.toString()}>
//                   {instructor.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           {/* فلترة المستوى */}
//           <Select
//             value={levelFilter}
//             onValueChange={setLevelFilter}
//             disabled={!instructorFilter || instructorFilter === "all"}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder={instructorFilter !== "all" ? "فلترة بالمستوى" : "اختر المدرس أولاً"} />
//             </SelectTrigger>
//             <SelectContent searchable>
//               <SelectItem value="all">جميع المستويات</SelectItem>
//               {courseLevels.map(level => (
//                 <SelectItem key={level.id} value={level.id.toString()}>
//                   {level.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         {/* 🔄 إعادة تعيين الفلترة وعدد النتائج */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
//           <div className="text-sm text-muted-foreground">
//             عرض {startItem} إلى {endItem} من {totalItems} كوبون
//             {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || specializationFilter !== "all" || courseFilter !== "all" || instructorFilter !== "all" || levelFilter !== "all") && ` (مفلتر)`}
//           </div>

//           {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || specializationFilter !== "all" || courseFilter !== "all" || instructorFilter !== "all" || levelFilter !== "all") && (
//             <Button variant="outline" size="sm" onClick={resetFilters}>
//               <Filter className="w-4 h-4 ml-1" />
//               إعادة تعيين الفلترة
//             </Button>
//           )}
//         </div>
//       </CardHeader>

//       <CardContent>
//         {loading ? (
//           <div className="flex justify-center py-8">
//             <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
//           </div>
//         ) : (
//           <>
//             {/* 📊 عرض الجدول للشاشات المتوسطة والكبيرة */}
//             <div className="hidden md:block">
//               <div className="rounded-md border overflow-x-auto">
//                 <Table className="min-w-full">
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead
//                         className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
//                         onClick={() => handleSort("code")}
//                       >
//                         <div className="flex items-center gap-1">
//                           كود الخصم
//                           {sortBy === "code" && (
//                             <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
//                           )}
//                         </div>
//                       </TableHead>
//                       <TableHead
//                         className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
//                         onClick={() => handleSort("discount")}
//                       >
//                         <div className="flex items-center gap-1">
//                           الخصم
//                           {sortBy === "discount" && (
//                             <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
//                           )}
//                         </div>
//                       </TableHead>
//                       <TableHead className="whitespace-nowrap">النوع</TableHead>
//                       <TableHead className="whitespace-nowrap">الاستخدام</TableHead>
//                       <TableHead
//                         className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
//                         onClick={() => handleSort("expiry")}
//                       >
//                         <div className="flex items-center gap-1">
//                           الانتهاء
//                           {sortBy === "expiry" && (
//                             <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
//                           )}
//                         </div>
//                       </TableHead>
//                       <TableHead className="whitespace-nowrap">المستوى</TableHead>
//                       <TableHead
//                         className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
//                         onClick={() => handleSort("isActive")}
//                       >
//                         <div className="flex items-center gap-1">
//                           الحالة
//                           {sortBy === "isActive" && (
//                             <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
//                           )}
//                         </div>
//                       </TableHead>
//                       <TableHead className="text-right whitespace-nowrap">الإجراءات</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {paginatedCoupons.length > 0 ? paginatedCoupons.map(coupon => (
//                       <TableRow key={coupon.id}>
//                         <TableCell className="whitespace-nowrap">
//                           <div className="font-mono font-bold">{coupon.code}</div>
//                         </TableCell>
//                         <TableCell className="whitespace-nowrap">
//                           <div className="flex items-center gap-2">
//                             {coupon.isPercent ? (
//                               <Percent className="w-4 h-4 text-green-600" />
//                             ) : (
//                               <Hash className="w-4 h-4 text-blue-600" />
//                             )}
//                             <span className="font-bold">
//                               {coupon.discount} {coupon.isPercent ? '%' : 'ل.س'}
//                             </span>
//                           </div>
//                         </TableCell>
//                         <TableCell className="whitespace-nowrap">
//                           <Badge variant={coupon.isPercent ? "default" : "secondary"}>
//                             {coupon.isPercent ? 'نسبة' : 'ثابت'}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="whitespace-nowrap">
//                           <div className="flex items-center gap-2">
//                             <Users className="w-4 h-4 text-gray-500" />
//                             <span>{coupon.usedCount || 0} / {coupon.maxUsage || '∞'}</span>
//                           </div>
//                         </TableCell>
//                         <TableCell className="whitespace-nowrap">
//                           <div className="flex items-center gap-2">
//                             <Calendar className="w-4 h-4 text-gray-500" />
//                             <span>{formatDate(coupon.expiry)}</span>
//                           </div>
//                         </TableCell>
//                         <TableCell className="whitespace-nowrap">
//                           {getCourseLevelInfo(coupon)}
//                         </TableCell>
//                         <TableCell className="whitespace-nowrap">
//                           <Badge variant={getStatusBadgeVariant(coupon)}>
//                             {getStatusText(coupon)}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right space-x-2 whitespace-nowrap">
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             onClick={() => setDetailDialog({ isOpen: true, coupon })}
//                             title="عرض التفاصيل"
//                             className="h-8 w-8"
//                           >
//                             <Eye className="w-4 h-4" />
//                           </Button>
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
//                             title={coupon.isActive ? "تعطيل" : "تفعيل"}
//                             className="h-8 w-8"
//                           >
//                             {coupon.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
//                           </Button>
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             onClick={() => handleEdit(coupon)}
//                             title="تعديل"
//                             className="h-8 w-8"
//                           >
//                             <Edit className="w-4 h-4" />
//                           </Button>
//                           <Button
//                             size="icon"
//                             variant="destructive"
//                             onClick={() => setDeleteDialog({
//                               isOpen: true,
//                               itemId: coupon.id,
//                               itemName: coupon.code || "بدون كود"
//                             })}
//                             title="حذف"
//                             className="h-8 w-8"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     )) : (
//                       <TableRow>
//                         <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
//                           {allCoupons.length === 0 ? "لا توجد كوبونات متاحة" : "لا توجد نتائج مطابقة للبحث"}
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>
//             </div>

//             {/* 📱 عرض البطاقات للشاشات الصغيرة */}
//             <div className="block md:hidden">
//               {paginatedCoupons.length > 0 ? (
//                 paginatedCoupons.map(coupon => (
//                   <CouponCard key={coupon.id} coupon={coupon} />
//                 ))
//               ) : (
//                 <div className="text-center py-8 text-muted-foreground">
//                   {allCoupons.length === 0 ? "لا توجد كوبونات متاحة" : "لا توجد نتائج مطابقة للبحث"}
//                 </div>
//               )}
//             </div>

//             {/* 🔢 الترقيم */}
//             {paginatedCoupons.length > 0 && (
//               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
//                 <div className="text-sm text-muted-foreground">
//                   عرض {startItem} إلى {endItem} من {totalItems} كوبون
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handlePageChange(currentPage - 1)}
//                     disabled={currentPage === 1}
//                   >
//                     <ChevronRight className="h-4 w-4" />
//                   </Button>

//                   <div className="flex items-center gap-1 flex-wrap justify-center">
//                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                       let pageNumber
//                       if (totalPages <= 5) {
//                         pageNumber = i + 1
//                       } else if (currentPage <= 3) {
//                         pageNumber = i + 1
//                       } else if (currentPage >= totalPages - 2) {
//                         pageNumber = totalPages - 4 + i
//                       } else {
//                         pageNumber = currentPage - 2 + i
//                       }

//                       return (
//                         <Button
//                           key={pageNumber}
//                           variant={currentPage === pageNumber ? "default" : "outline"}
//                           size="sm"
//                           onClick={() => handlePageChange(pageNumber)}
//                           className="h-8 w-8 p-0"
//                         >
//                           {pageNumber}
//                         </Button>
//                       )
//                     })}
//                   </div>

//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handlePageChange(currentPage + 1)}
//                     disabled={currentPage === totalPages}
//                   >
//                     <ChevronLeft className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </CardContent>

//       {/* 🗑️ ديالوج تأكيد الحذف */}
//       <AlertDialog
//         open={deleteDialog.isOpen}
//         onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
//       >
//         <AlertDialogContent className="text-right" dir="rtl">
//           <AlertDialogHeader>
//             <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا الكوبون؟</AlertDialogTitle>
//             <AlertDialogDescription className="text-right">
//               سيتم حذف الكوبون "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter className="flex flex-row-reverse gap-2">
//             <AlertDialogAction
//               className="bg-red-500 hover:bg-red-600"
//               onClick={async () => {
//                 await handleDelete(deleteDialog.itemId)
//                 setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })
//               }}
//             >
//               حذف
//             </AlertDialogAction>
//             <AlertDialogCancel onClick={() => setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })}>
//               إلغاء
//             </AlertDialogCancel>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/*  ديالوج تفاصيل الكوبون */}
//       <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog({ isOpen, coupon: null })}>
//         <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle className="text-xl font-bold text-gray-900 text-right">
//               <div className="flex items-center gap-2">
//                 <Percent className="w-6 h-6 text-green-600" />
//                 تفاصيل كوبون الخصم
//               </div>
//             </DialogTitle>
//           </DialogHeader>

//           {detailDialog.coupon && (
//             <div className="space-y-6 text-right">
//               {/* الهيدر مع المعلومات الأساسية */}
//               <div className="bg-gradient-to-l from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
//                 <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
//                   {/* أيقونة الكوبون */}
//                   <div className="relative flex-shrink-0">
//                     <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
//                       {detailDialog.coupon.isPercent ? (
//                         <Percent className="w-10 h-10 text-green-600" />
//                       ) : (
//                         <Hash className="w-10 h-10 text-green-600" />
//                       )}
//                     </div>
//                     {/* شارة الحالة */}
//                     <div className={`absolute -top-2 -right-2 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg ${getStatusBadgeVariant(detailDialog.coupon) === 'default'
//                       ? "bg-green-500 text-white"
//                       : getStatusBadgeVariant(detailDialog.coupon) === 'destructive'
//                         ? "bg-red-500 text-white"
//                         : "bg-gray-500 text-white"
//                       }`}>
//                       {getStatusText(detailDialog.coupon) === "نشط" ? "✓" :
//                         getStatusText(detailDialog.coupon) === "منتهي" ? "⌛" :
//                           getStatusText(detailDialog.coupon) === "مستنفذ" ? "⛔" : "✗"}
//                     </div>
//                   </div>

//                   <div className="flex-1">
//                     <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//                       <div>
//                         <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 font-mono">
//                           {detailDialog.coupon.code}
//                         </h2>

//                         <div className="flex flex-wrap gap-2 mb-4">
//                           <Badge variant={getStatusBadgeVariant(detailDialog.coupon)}
//                             className={`text-sm font-medium ${getStatusBadgeVariant(detailDialog.coupon) === 'default'
//                               ? "bg-green-600 hover:bg-green-700"
//                               : getStatusBadgeVariant(detailDialog.coupon) === 'destructive'
//                                 ? "bg-red-600 hover:bg-red-700"
//                                 : "bg-gray-500"
//                               }`}>
//                             {getStatusText(detailDialog.coupon)}
//                           </Badge>

//                           <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
//                             {detailDialog.coupon.isPercent ? 'نسبة مئوية' : 'قيمة ثابتة'}
//                           </Badge>

//                           {detailDialog.coupon.maxUsage && (
//                             <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
//                               <Users className="w-3 h-3 ml-1" />
//                               {detailDialog.coupon.usedCount || 0} / {detailDialog.coupon.maxUsage}
//                             </Badge>
//                           )}
//                         </div>
//                       </div>

//                       {/* قيمة الخصم */}
//                       <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
//                         <div className="text-2xl font-bold text-green-600">
//                           {detailDialog.coupon.discount} {detailDialog.coupon.isPercent ? '%' : 'ل.س'}
//                         </div>
//                         <div className="text-sm text-gray-600 mt-1">قيمة الخصم</div>
//                       </div>
//                     </div>

//                     {/* معلومات سريعة */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
//                       <div className="flex items-center gap-2 text-gray-700">
//                         <Calendar className="w-4 h-4 text-green-600" />
//                         <span>أنشئ في: {formatDate(detailDialog.coupon.createdAt)}</span>
//                       </div>
//                       {detailDialog.coupon.expiry && (
//                         <div className="flex items-center gap-2 text-gray-700">
//                           <Calendar className="w-4 h-4 text-orange-600" />
//                           <span>ينتهي في: {formatDate(detailDialog.coupon.expiry)}</span>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* الشبكة الرئيسية للمعلومات */}
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* معلومات الكوبون */}
//                 <Card className="border border-gray-200 shadow-sm">
//                   <CardHeader className="pb-3 bg-gradient-to-l from-blue-50 to-cyan-50 rounded-t-lg">
//                     <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
//                       <Percent className="w-5 h-5 text-blue-600" />
//                       معلومات الكوبون
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4 pt-4">
//                     <div className="space-y-3">
//                       <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center gap-2">
//                           <Hash className="w-4 h-4 text-gray-600" />
//                           <span className="text-sm font-medium text-gray-700">كود الخصم</span>
//                         </div>
//                         <span className="font-mono font-bold text-gray-900">{detailDialog.coupon.code}</span>
//                       </div>

//                       <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center gap-2">
//                           <Percent className="w-4 h-4 text-gray-600" />
//                           <span className="text-sm font-medium text-gray-700">نوع الخصم</span>
//                         </div>
//                         <Badge variant={detailDialog.coupon.isPercent ? "default" : "secondary"}>
//                           {detailDialog.coupon.isPercent ? 'نسبة مئوية' : 'قيمة ثابتة'}
//                         </Badge>
//                       </div>

//                       <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center gap-2">
//                           <DollarSign className="w-4 h-4 text-gray-600" />
//                           <span className="text-sm font-medium text-gray-700">قيمة الخصم</span>
//                         </div>
//                         <span className="font-bold text-lg text-green-600">
//                           {detailDialog.coupon.discount} {detailDialog.coupon.isPercent ? '%' : 'ل.س'}
//                         </span>
//                       </div>

//                       <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center gap-2">
//                           <Calendar className="w-4 h-4 text-gray-600" />
//                           <span className="text-sm font-medium text-gray-700">تاريخ الانتهاء</span>
//                         </div>
//                         <div className="text-right">
//                           <span className="font-medium text-gray-900 block">
//                             {detailDialog.coupon.expiry ? formatDate(detailDialog.coupon.expiry) : 'غير محدد'}
//                           </span>
//                           {detailDialog.coupon.expiry && (
//                             <span className={`text-xs ${isExpired(detailDialog.coupon.expiry) ? 'text-red-600' : 'text-green-600'
//                               }`}>
//                               {isExpired(detailDialog.coupon.expiry) ? 'منتهي الصلاحية' : 'نشط'}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* معلومات الاستخدام */}
//                 <Card className="border border-gray-200 shadow-sm">
//                   <CardHeader className="pb-3 bg-gradient-to-l from-purple-50 to-pink-50 rounded-t-lg">
//                     <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
//                       <Users className="w-5 h-5 text-purple-600" />
//                       معلومات الاستخدام
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="pt-4">
//                     <div className="space-y-4">
//                       <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center gap-2">
//                           <Users className="w-4 h-4 text-gray-600" />
//                           <span className="text-sm font-medium text-gray-700">مرات الاستخدام</span>
//                         </div>
//                         <span className="font-medium text-gray-900">{detailDialog.coupon.usedCount || 0}</span>
//                       </div>

//                       <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center gap-2">
//                           <Hash className="w-4 h-4 text-gray-600" />
//                           <span className="text-sm font-medium text-gray-700">الحد الأقصى</span>
//                         </div>
//                         <span className="font-medium text-gray-900">
//                           {detailDialog.coupon.maxUsage || '∞'}
//                         </span>
//                       </div>

//                       <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center gap-2">
//                           <Shield className="w-4 h-4 text-gray-600" />
//                           <span className="text-sm font-medium text-gray-700">الحالة الحالية</span>
//                         </div>
//                         <Badge variant={getStatusBadgeVariant(detailDialog.coupon)}>
//                           {getStatusText(detailDialog.coupon)}
//                         </Badge>
//                       </div>

//                       <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center gap-2">
//                           <Calendar className="w-4 h-4 text-gray-600" />
//                           <span className="text-sm font-medium text-gray-700">آخر تحديث</span>
//                         </div>
//                         <div className="text-right">
//                           <span className="font-medium text-gray-900 block">{formatDate(detailDialog.coupon.updatedAt)}</span>
//                           {/* <span className="text-xs text-gray-500">
//                       {new Date(detailDialog.coupon.updatedAt).toLocaleTimeString('ar-SA')}
//                     </span> */}
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>

//               {/* معلومات الكورس والمستوى */}
//               <Card className="border border-gray-200 shadow-sm">
//                 <CardHeader className="pb-3 bg-gradient-to-l from-orange-50 to-amber-50 rounded-t-lg">
//                   <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
//                     <BookOpen className="w-5 h-5 text-orange-600" />
//                     معلومات الكورس والمستوى
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="pt-4">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
//                       <span className="text-sm font-medium text-gray-700">الاختصاص</span>
//                       <span className="font-medium text-gray-900">
//                         {detailDialog.coupon.courseLevel?.instructor?.specialization?.name ||
//                           detailDialog.coupon.courseLevel?.course?.specialization?.title ||
//                           "غير محدد"}
//                       </span>
//                     </div>

//                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
//                       <span className="text-sm font-medium text-gray-700">المدرب</span>
//                       <span className="font-medium text-gray-900">
//                         {detailDialog.coupon.courseLevel?.instructor?.name || "غير محدد"}
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
//                       <span className="text-sm font-medium text-gray-700">الكورس</span>
//                       <span className="font-medium text-gray-900">
//                         {detailDialog.coupon.courseLevel?.course?.title || "غير محدد"}
//                       </span>
//                     </div>

//                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
//                       <span className="text-sm font-medium text-gray-700">المستوى</span>
//                       <span className="font-medium text-gray-900">
//                         {detailDialog.coupon.courseLevel?.name || "غير محدد"}
//                       </span>
//                     </div>


//                   </div>
//                 </CardContent>
//               </Card>

//               {/* الإحصائيات السريعة */}
//               <Card className="border border-gray-200 shadow-sm">
//                 <CardHeader className="pb-3 bg-gradient-to-l from-gray-50 to-slate-50 rounded-t-lg">
//                   <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
//                     <BarChart3 className="w-5 h-5 text-gray-600" />
//                     ملخص الكوبون
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="pt-4">
//                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                     <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
//                       <div className="text-2xl font-bold text-green-600">
//                         {detailDialog.coupon.isPercent ? "%" : "💰"}
//                       </div>
//                       <div className="text-sm font-medium text-gray-700 mt-1">نوع الخصم</div>
//                       <div className="text-lg font-bold text-gray-900">
//                         {detailDialog.coupon.isPercent ? 'نسبة' : 'ثابت'}
//                       </div>
//                     </div>

//                     <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
//                       <div className="text-2xl font-bold text-blue-600">🎯</div>
//                       <div className="text-sm font-medium text-gray-700 mt-1">الحالة</div>
//                       <div className="text-lg font-bold text-gray-900">
//                         {getStatusText(detailDialog.coupon)}
//                       </div>
//                     </div>

//                     <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
//                       <div className="text-2xl font-bold text-purple-600">📊</div>
//                       <div className="text-sm font-medium text-gray-700 mt-1">الاستخدام</div>
//                       <div className="text-lg font-bold text-gray-900">
//                         {detailDialog.coupon.usedCount || 0} / {detailDialog.coupon.maxUsage || '∞'}
//                       </div>
//                     </div>
//                     {/*               
//               <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
//                 <div className="text-2xl font-bold text-orange-600">🆔</div>
//                 <div className="text-sm font-medium text-gray-700 mt-1">المعرف</div>
//                 <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 truncate">
//                   {detailDialog.coupon.id}
//                 </div>
//               </div> */}
//                   </div>
//                 </CardContent>
//               </Card>



//               {/* أزرار الإجراءات */}
//               {/* <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     navigator.clipboard.writeText(detailDialog.coupon.code);
//                     showSuccessToast("تم نسخ كود الكوبون إلى الحافظة");
//                   }}
//                   className="flex items-center gap-2 flex-1"
//                 >
//                   <Hash className="w-4 h-4" />
//                   نسخ الكود
//                 </Button>

//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     handleToggleActive(detailDialog.coupon.id, detailDialog.coupon.isActive);
//                     setDetailDialog({ isOpen: false, coupon: null });
//                   }}
//                   className="flex items-center gap-2 flex-1"
//                 >
//                   {detailDialog.coupon.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
//                   {detailDialog.coupon.isActive ? "تعطيل الكوبون" : "تفعيل الكوبون"}
//                 </Button>

//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={() => handleEdit(coupon)}
//                   className="flex-1"
//                 >
//                   <Edit className="w-4 h-4 ml-1" />
//                   تعديل
//                 </Button>

//                 <Button
//                   variant="destructive"
//                   onClick={() => {
//                     setDeleteDialog({
//                       isOpen: true,
//                       itemId: detailDialog.coupon.id,
//                       itemName: detailDialog.coupon.code
//                     });
//                     setDetailDialog({ isOpen: false, coupon: null });
//                   }}
//                   className="flex items-center gap-2 flex-1"
//                 >
//                   <Trash2 className="w-4 h-4" />
//                   حذف الكوبون
//                 </Button>
//               </div> */}
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </Card>
//   )
// }

// export default Coupons



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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Edit, Copy, Tag, Maximize, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, Calendar, Percent, Hash, Users, BookOpen, Loader2, Filter, User, Star } from "lucide-react"
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponActive, getCourseLevels, getCourses, getSpecializations, getInstructorsByCourse, getAllUsersHavePoints } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

const Coupons = () => {
  // الحالات الأساسية
  const [coupons, setCoupons] = useState([])
  const [allCoupons, setAllCoupons] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [courses, setCourses] = useState([])
  const [instructors, setInstructors] = useState([])
  const [courseLevels, setCourseLevels] = useState([])
  const [usersWithPoints, setUsersWithPoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)

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
  const [userSearch, setUserSearch] = useState("")

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
    courseLevelId: "",
    userId: "",
    reason: "",
    couponType: "courseLevel" // "courseLevel", "user", "both", "none"
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
  const [userFilter, setUserFilter] = useState("all")
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
      showErrorToast("فشل تحميل المواد")
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
      showErrorToast("فشل تحميل مستويات المواد");
      setCourseLevels([]);
    }
  }

  // 🔄 جلب المستخدمين الذين لديهم نقاط
  const fetchUsersWithPoints = async () => {
    setUsersLoading(true);
    try {
      const res = await getAllUsersHavePoints();
      console.log("📊 Users with points response:", res);
      
      let data = [];
      if (res.data?.success && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (Array.isArray(res.data?.data?.items)) {
        data = res.data.data.items;
      } else if (Array.isArray(res.data?.data)) {
        data = res.data.data;
      }

      setUsersWithPoints(data || []);
    } catch (err) {
      console.error("❌ Error fetching users with points:", err);
      showErrorToast("فشل تحميل بيانات المستخدمين");
      setUsersWithPoints([]);
    } finally {
      setUsersLoading(false);
    }
  };

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
  }, [form.courseId, allCoupons])

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

  // 🔄 عند فتح dialog التعديل - تعبئة البيانات التلقائية
  useEffect(() => {
    if (editItem && isDialogOpen) {
      const coupon = allCoupons.find(c => c.id === editItem.id);
      if (coupon) {
        const newForm = {
          code: coupon.code || "",
          discount: coupon.discount?.toString() || "",
          isPercent: coupon.isPercent,
          expiry: coupon.expiry?.split('T')[0] || "",
          maxUsage: coupon.maxUsage?.toString() || "",
          isActive: coupon.isActive,
          specializationId: coupon.courseLevel?.instructor?.specializationId?.toString() ||
            coupon.courseLevel?.course?.specializationId?.toString() || "",
          courseId: coupon.courseLevel?.courseId?.toString() || "",
          instructorId: coupon.courseLevel?.instructorId?.toString() || "",
          courseLevelId: coupon.courseLevelId?.toString() || "",
          userId: coupon.userId?.toString() || "",
          reason: coupon.reason || "",
          couponType: coupon.userId ? (coupon.courseLevelId ? "both" : "user") : (coupon.courseLevelId ? "courseLevel" : "none")
        };

        setForm(newForm);

        // جلب البيانات المرتبطة تلقائياً
        if (coupon.courseLevel?.course?.specializationId) {
          fetchCourses(coupon.courseLevel.course.specializationId.toString());
        }

        if (coupon.courseLevel?.courseId) {
          setTimeout(() => {
            fetchInstructorsByCourse(parseInt(coupon.courseLevel.courseId));
          }, 100);
        }

        if (coupon.courseLevel?.instructorId) {
          setTimeout(() => {
            fetchCourseLevels(parseInt(coupon.courseLevel.courseId), parseInt(coupon.courseLevel.instructorId));
          }, 200);
        }
      }
    }
  }, [editItem, isDialogOpen, allCoupons]);

  // 🎯 دالة التعديل
  const handleEdit = (coupon) => {
    setEditItem(coupon);
    const newForm = {
      code: coupon.code || "",
      discount: coupon.discount?.toString() || "",
      isPercent: coupon.isPercent,
      expiry: coupon.expiry?.split('T')[0] || "",
      maxUsage: coupon.maxUsage?.toString() || "",
      isActive: coupon.isActive,
      specializationId: coupon.courseLevel?.instructor?.specializationId?.toString() ||
        coupon.courseLevel?.course?.specializationId?.toString() || "",
      courseId: coupon.courseLevel?.courseId?.toString() || "",
      instructorId: coupon.courseLevel?.instructorId?.toString() || "",
      courseLevelId: coupon.courseLevelId?.toString() || "",
      userId: coupon.userId?.toString() || "",
      reason: coupon.reason || "",
      couponType: coupon.userId ? (coupon.courseLevelId ? "both" : "user") : (coupon.courseLevelId ? "courseLevel" : "none")
    };

    setForm(newForm);
    setIsDialogOpen(true);

    if (coupon.courseLevel?.course?.specializationId) {
      fetchCourses(coupon.courseLevel.course.specializationId.toString());
    }
  };

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

  const filteredUsersForSelect = useMemo(() => {
    if (!userSearch) return usersWithPoints;
    return usersWithPoints.filter(user =>
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.id?.toString().includes(userSearch)
    );
  }, [usersWithPoints, userSearch]);

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

    // فلترة بالمستخدم
    if (userFilter !== "all") {
      filtered = filtered.filter(coupon => 
        coupon.userId === parseInt(userFilter)
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
  }, [allCoupons, searchTerm, statusFilter, typeFilter, specializationFilter, courseFilter, userFilter, sortBy, sortOrder])

  // 🔄 حساب البيانات المعروضة في الصفحة الحالية
  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedCoupons.slice(startIndex, endIndex)
  }, [filteredAndSortedCoupons, currentPage, itemsPerPage])

  // 🔄 إعادة تعيين الصفحة عند تغيير الفلتر
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter, specializationFilter, courseFilter, instructorFilter, levelFilter, userFilter, itemsPerPage])

  // 🎯 دوال التعامل مع النموذج
  const handleFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    
    // إذا تم تغيير نوع الكوبون، إعادة تعيين الحقول غير المستخدمة
    if (key === "couponType") {
      if (value === "courseLevel") {
        setForm(prev => ({ ...prev, userId: "" }))
      } else if (value === "user") {
        setForm(prev => ({ ...prev, specializationId: "", courseId: "", instructorId: "", courseLevelId: "" }))
      } else if (value === "none") {
        setForm(prev => ({ ...prev, specializationId: "", courseId: "", instructorId: "", courseLevelId: "", userId: "" }))
      }
    }
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
      courseLevelId: "",
      userId: "",
      reason: "",
      couponType: "courseLevel"
    })
    setEditItem(null)
  }

  // 💾 حفظ الكوبون
  const handleSave = async () => {
    if (!form.code.trim()) return showErrorToast("يرجى إدخال كود الخصم")
    if (!form.discount || parseFloat(form.discount) <= 0) return showErrorToast("يرجى إدخال قيمة الخصم صحيحة")
    
    // التحقق من صحة البيانات حسب نوع الكوبون
    if (form.couponType === "courseLevel" && !form.courseLevelId) {
      return showErrorToast("يرجى اختيار المستوى الدراسي")
    }
    if (form.couponType === "user" && !form.userId) {
      return showErrorToast("يرجى اختيار المستخدم")
    }
    if (form.couponType === "both" && (!form.courseLevelId || !form.userId)) {
      return showErrorToast("يرجى اختيار المستوى الدراسي والمستخدم")
    }

    try {
      const couponData = {
        code: form.code.trim().toUpperCase(),
        discount: parseFloat(form.discount),
        isPercent: Boolean(form.isPercent),
        expiry: form.expiry || null,
        maxUsage: form.maxUsage ? parseInt(form.maxUsage) : null,
        isActive: Boolean(form.isActive),
        reason: form.reason || null
      }

      // إضافة الحقول حسب نوع الكوبون
      if (form.couponType === "courseLevel" || form.couponType === "both") {
        couponData.courseLevelId = parseInt(form.courseLevelId)
      }
      if (form.couponType === "user" || form.couponType === "both") {
        couponData.userId = parseInt(form.userId)
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

  // 👤 الحصول على اسم المستخدم
  const getUserInfo = (coupon) => {
    if (!coupon.userId) return "لجميع المستخدمين"
    
    const user = usersWithPoints.find(u => u.id === coupon.userId)
    return user ? `${user.name} (${user.points} نقطة)` : `المستخدم ${coupon.userId}`
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

  const getUserName = (userId) => {
    const user = usersWithPoints.find(u => u.id === parseInt(userId))
    return user ? user.name : "غير محدد"
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
    setUserFilter("all")
    setSortBy("createdAt")
    setSortOrder("desc")
    setCurrentPage(1)
  }

  // 👁️ عرض التفاصيل الكاملة للكوبون
  // const renderCouponDetails = (coupon) => {
  //   if (!coupon) return null

  //   return (
  //     <div className="space-y-6 text-right">
  //       {/* المعلومات الأساسية */}
  //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //         <div>
  //           <Label className="font-bold">كود الخصم:</Label>
  //           <p className="mt-1 text-lg font-mono">{coupon.code}</p>
  //         </div>
  //         <div>
  //           <Label className="font-bold">قيمة الخصم:</Label>
  //           <p className="mt-1 text-lg">
  //             {coupon.discount} {coupon.isPercent ? '%' : 'ل.س'}
  //           </p>
  //         </div>
  //         <div>
  //           <Label className="font-bold">نوع الخصم:</Label>
  //           <p className="mt-1">{coupon.isPercent ? 'نسبة مئوية' : 'قيمة ثابتة'}</p>
  //         </div>
  //         <div>
  //           <Label className="font-bold">الحالة:</Label>
  //           <div className="mt-1">
  //             <Badge variant={getStatusBadgeVariant(coupon)}>
  //               {getStatusText(coupon)}
  //             </Badge>
  //           </div>
  //         </div>
  //         <div>
  //           <Label className="font-bold">تاريخ الانتهاء:</Label>
  //           <p className="mt-1">{formatDate(coupon.expiry)}</p>
  //         </div>
  //         <div>
  //           <Label className="font-bold">الحد الأقصى للاستخدام:</Label>
  //           <p className="mt-1">{coupon.maxUsage || 'غير محدد'}</p>
  //         </div>
  //         <div>
  //           <Label className="font-bold">مرات الاستخدام:</Label>
  //           <p className="mt-1">{coupon.usedCount || 0}</p>
  //         </div>
  //         <div>
  //           <Label className="font-bold">المستخدم:</Label>
  //           <p className="mt-1">{getUserInfo(coupon)}</p>
  //         </div>
  //         {coupon.courseLevel && (
  //           <div>
  //             <Label className="font-bold">المستوى الدراسي:</Label>
  //             <p className="mt-1">{getCourseLevelInfo(coupon)}</p>
  //           </div>
  //         )}
  //         {coupon.reason && (
  //           <div className="md:col-span-2">
  //             <Label className="font-bold">السبب:</Label>
  //             <p className="mt-1">{coupon.reason}</p>
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   )
  // }

  const copyToClipboard = (text) => {
   navigator.clipboard.writeText(text).then(() => {
               showSuccessToast("تم نسخ الكود إلى الحافظة");
           }).catch(() => {
               showErrorToast("فشل نسخ الكود");
           });
};

  const renderCouponDetails = (coupon) => {
    if (!coupon) return null;

    return (
        <div className="space-y-8 text-right">
            {/* البطاقة الرئيسية */}
            <div className="bg-gradient-to-l from-white to-green-50/30 border border-green-100 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-10 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                        <h3 className="font-bold text-2xl text-gray-800">تفاصيل الكوبون</h3>
                    </div>
                    <Badge 
                        variant={getStatusBadgeVariant(coupon)}
                        className="px-4 py-2 text-base font-semibold rounded-full"
                    >
                        {getStatusText(coupon)}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* العمود الأول */}
                    <div className="space-y-6">
                        {/* كود الخصم */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                            <Label className="font-bold text-lg text-gray-800 mb-3 block">كود الخصم</Label>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    <p className="text-2xl font-mono font-bold bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-lg border border-green-200 text-green-700 text-center">
                                        {coupon.code}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 transition-all duration-200 shadow-sm"
                                    onClick={() => copyToClipboard(coupon.code)}
                                >
                                    <Copy className="w-4 h-4 ml-1" />
                                    نسخ
                                </Button>
                            </div>
                        </div>

                        {/* قيمة الخصم ونوعه */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">قيمة الخصم</Label>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <Percent className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-gray-800">
                                        {coupon.discount} {coupon.isPercent ? '%' : 'ل.س'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">نوع الخصم</Label>
                                <div className="flex items-center gap-2 text-lg font-medium text-gray-800">
                                    <Tag className="w-4 h-4 text-blue-500" />
                                    {coupon.isPercent ? 'نسبة مئوية' : 'قيمة ثابتة'}
                                </div>
                            </div>
                        </div>

                        {/* المستخدم */}
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <Label className="font-semibold text-gray-700 mb-3 block">المستخدم</Label>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium text-gray-800 text-lg">
                                    {getUserInfo(coupon) || "غير محدد"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* العمود الثاني */}
                    <div className="space-y-6">
                        {/* التواريخ */}
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <Label className="font-semibold text-gray-700 mb-3 block">فترة الصلاحية</Label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                                    <span className="text-orange-700 font-medium">تاريخ الانتهاء</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-orange-500" />
                                        <span className="font-bold text-orange-800">{formatDate(coupon.expiry)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* إحصائيات الاستخدام */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">الحد الأقصى</Label>
                                <div className="flex items-center gap-2">
                                    <Maximize className="w-4 h-4 text-purple-500" />
                                    <span className="text-lg font-bold text-gray-800">
                                        {coupon.maxUsage || '∞'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">مرات الاستخدام</Label>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    <span className="text-lg font-bold text-gray-800">
                                        {coupon.usedCount || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* المستوى الدراسي */}
                        {coupon.courseLevel && (
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <Label className="font-semibold text-gray-700 mb-2 block">المستوى الدراسي</Label>
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="font-medium text-blue-800 text-center">
                                        {getCourseLevelInfo(coupon)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* السبب */}
                {coupon.reason && (
                    <div className="mt-6 bg-amber-50 rounded-xl p-5 border border-amber-200 shadow-sm">
                        <Label className="font-bold text-lg text-amber-800 mb-3 block flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            السبب
                        </Label>
                        <p className="text-amber-800 font-medium leading-relaxed bg-amber-100/50 p-4 rounded-lg border border-amber-200">
                            {coupon.reason}
                        </p>
                    </div>
                )}

                {/* شريط التقدم للاستخدام */}
                {coupon.maxUsage && (
                    <div className="mt-6 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <Label className="font-semibold text-gray-700 mb-3 block">معدل الاستخدام</Label>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>مرات الاستخدام</span>
                                <span>{coupon.usedCount || 0} / {coupon.maxUsage}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(((coupon.usedCount || 0) / coupon.maxUsage) * 100, 100)}%`
                                    }}
                                ></div>
                            </div>
                            <div className="text-xs text-gray-500 text-center">
                                متبقي {Math.max(coupon.maxUsage - (coupon.usedCount || 0), 0)} استخدام
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ملخص سريع */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white text-center shadow-lg">
                    <div className="text-2xl font-bold mb-1">{coupon.discount}{coupon.isPercent ? '%' : 'ل.س'}</div>
                    <div className="text-blue-100 text-sm">قيمة الخصم</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white text-center shadow-lg">
                    <div className="text-2xl font-bold mb-1">{coupon.usedCount || 0}</div>
                    <div className="text-green-100 text-sm">مرات الاستخدام</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white text-center shadow-lg">
                    <div className="text-2xl font-bold mb-1">{coupon.maxUsage || '∞'}</div>
                    <div className="text-purple-100 text-sm">الحد الأقصى</div>
                </div>
            </div>
        </div>
    );
};

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
                <User className="w-4 h-4" />
                <span>{getUserInfo(coupon)}</span>
              </div>
            </div>
            {coupon.courseLevel && (
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{getCourseLevelInfo(coupon)}</span>
                </div>
              </div>
            )}
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
            onClick={() => handleEdit(coupon)}
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

  // 🎯 عرض حقل اختيار نوع الكوبون
  const renderCouponTypeSelector = () => (
    <div className="space-y-3">
      <Label>نوع الكوبون *</Label>
      <RadioGroup 
        value={form.couponType} 
        onValueChange={(value) => handleFormChange("couponType", value)}
        className="grid grid-cols-2 gap-4"
      >
        <div className="flex items-center space-x-2 space-x-reverse border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
          <RadioGroupItem value="courseLevel" id="courseLevel" />
          <Label htmlFor="courseLevel" className="cursor-pointer mr-4 flex-1">
            <div className="font-medium">لمادة دراسية</div>
            {/* <div className="text-sm text-muted-foreground">للكورس والمستوى المحدد</div> */}
          </Label>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
          <RadioGroupItem value="user" id="user" />
          <Label htmlFor="user" className="cursor-pointer mr-4 flex-1">
            <div className="font-medium">لمستخدم محدد</div>
            {/* <div className="text-sm text-muted-foreground">للمستخدم المحدد فقط</div> */}
          </Label>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
          <RadioGroupItem value="both" id="both" />
          <Label htmlFor="both" className="cursor-pointer mr-4 flex-1">
            <div className="font-medium">لمستخدم ومادة</div>
            {/* <div className="text-sm text-muted-foreground">مخصص للمستخدم والمستوى</div> */}
          </Label>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
          <RadioGroupItem value="none" id="none" />
          <Label htmlFor="none" className="cursor-pointer mr-4 flex-1">
            <div className="font-medium">عام</div>
            {/* <div className="text-sm text-muted-foreground">لجميع المستخدمين والمستويات</div> */}
          </Label>
        </div>
      </RadioGroup>
    </div>
  )

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <CardTitle>إدارة كوبونات الخصم</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
            if (open) fetchUsersWithPoints()
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                إضافة كوبون
                <Plus className="w-4 h-4 ml-1" />
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-right">{editItem ? "تعديل الكوبون" : "إضافة كوبون جديد"}</DialogTitle>
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

                <div className="space-y-2">
                  <Label>السبب</Label>
                  <Input
                    value={form.reason}
                    onChange={(e) => handleFormChange("reason", e.target.value)}
                    placeholder="أدخل سبب إنشاء الكوبون..."
                  />
                </div>

                {/* اختيار نوع الكوبون */}
                {renderCouponTypeSelector()}

                {/* اختيار المستوى الدراسي (لأنواع courseLevel و both) */}
                {(form.couponType === "courseLevel" || form.couponType === "both") && (
                  <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                    <Label className="text-lg font-medium">اختيار المستوى الدراسي *</Label>
                    
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
                      <Label>المادة</Label>
                      <Select
                        value={form.courseId}
                        onValueChange={(value) => handleFormChange("courseId", value)}
                        disabled={!form.specializationId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={form.specializationId ? "اختر المادة" : "اختر الاختصاص أولاً"} />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input
                              placeholder="ابحث عن مادة..."
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
                          <SelectValue placeholder={form.courseId ? "اختر المدرس" : "اختر المادة أولاً"} />
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
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* اختيار المستخدم (لأنواع user و both) */}
                {(form.couponType === "user" || form.couponType === "both") && (
                  <div className="space-y-3 border rounded-lg p-4 bg-blue-50">
                    <Label className="text-lg font-medium">اختيار المستخدم *</Label>
                    
                    {usersLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      <Select
                        value={form.userId}
                        onValueChange={(value) => handleFormChange("userId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستخدم" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input
                              placeholder="ابحث عن مستخدم..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              className="mb-2"
                            />
                          </div>
                          {filteredUsersForSelect.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{user.name}</span>
                                <Badge variant="secondary" className="ml-2">
                                  <Star className="w-3 h-3 ml-1" />
                                  {user.points} نقطة
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {form.userId && (
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">المستخدم المحدد:</span>
                          <span>{getUserName(form.userId)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">النقاط:</span>
                          <Badge variant="outline">
                            <Star className="w-3 h-3 ml-1" />
                            {usersWithPoints.find(u => u.id === parseInt(form.userId))?.points || 0} نقطة
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={handleSave} className="w-full" size="lg">
                  {editItem ? "حفظ التعديل" : "إنشاء الكوبون"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 🔍 قسم الفلترة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <SelectContent searchable>
              <SelectItem value="all">جميع الاختصاصات</SelectItem>
              {specializations.map(spec => (
                <SelectItem key={spec.id} value={spec.id.toString()}>
                  {spec.name || spec.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* فلترة المستخدم */}
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة بالمستخدم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستخدمين</SelectItem>
              {usersWithPoints.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name} ({user.points} نقطة)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 🔄 إعادة تعيين الفلترة وعدد النتائج */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-sm text-muted-foreground">
            عرض {startItem} إلى {endItem} من {totalItems} كوبون
            {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || specializationFilter !== "all" || userFilter !== "all") && ` (مفلتر)`}
          </div>

          {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || specializationFilter !== "all" || userFilter !== "all") && (
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
                      <TableHead className="whitespace-nowrap">المستخدم</TableHead>
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
                          {getUserInfo(coupon)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {coupon.courseLevel ? getCourseLevelInfo(coupon) : "لجميع المستويات"}
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
                            onClick={() => handleEdit(coupon)}
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
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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

      {/* ديالوج تفاصيل الكوبون */}
      <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog({ isOpen, coupon: null })}>
        <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 text-right">
              <div className="flex items-center gap-2">
                <Percent className="w-6 h-6 text-green-600" />
                تفاصيل كوبون الخصم
              </div>
            </DialogTitle>
          </DialogHeader>

          {detailDialog.coupon && renderCouponDetails(detailDialog.coupon)}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Coupons