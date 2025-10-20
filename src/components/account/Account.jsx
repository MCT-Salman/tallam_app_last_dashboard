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
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, User, Mail, Phone, Calendar, MapPin, Shield, Clock, Globe } from "lucide-react"
import { getAllUsers, createUser, updateUser, deleteUser, toggleUserActive } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"
import { BASE_URL } from "@/api/api"
import { imageConfig } from "@/utils/corsConfig";

const Account = () => {
    const [users, setUsers] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [currentPageData, setCurrentPageData] = useState([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: "",
        phone: "",
        birthDate: "",
        sex: "ذكر",
        role: "STUDENT",
        country: "",
        isActive: true,
        expiresAt: ""
    })
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, user: null })

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [roleFilter, setRoleFilter] = useState("all")
    const [countryFilter, setCountryFilter] = useState("all")
    const [sortBy, setSortBy] = useState("createdAt")
    const [sortOrder, setSortOrder] = useState("desc")
    const [totalUsers, setTotalUsers] = useState(0)
    const [allCountries, setAllCountries] = useState([])

    // دالة لتنظيف وتكوين مسار الصورة
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/default-avatar.png";
        
        // إذا كان الرابط يحتوي على النطاق الأساسي بالفعل
        if (imageUrl.includes('http')) {
            return imageUrl;
        }
        
        const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
        const cleanImageUrl = imageUrl.replace(/^\//, "");
        
        return `${cleanBaseUrl}/${cleanImageUrl}`;
    };

    // جلب جميع المستخدمين مرة واحدة
    const fetchAllUsersData = async () => {
        setLoading(true)
        try {
            // جلب عدد كبير جداً لضمان الحصول على جميع البيانات
            const params = {
                skip: 0,
                take: 10000, // رقم كبير لضمان جلب كل شيء
                q: "",
                role: undefined,
                country: undefined, 
                isActive: undefined
            }

            console.log("📤 Fetching ALL users data...")

            const res = await getAllUsers(params)
            console.log("📊 ALL Users API response:", res)
            
            let allData = []
            let total = 0
            
            if (res.data?.data?.items) {
                allData = res.data.data.items
                total = res.data.data.total
            } else if (Array.isArray(res.data?.data)) {
                allData = res.data.data
                total = res.data.length
            } else if (Array.isArray(res.data)) {
                allData = res.data
                total = res.data.length
            }
            
            console.log(`✅ Loaded ${allData.length} total users`)
            
            // حفظ جميع البيانات
            setAllUsers(allData || [])
            setTotalUsers(total || 0)
            
            // استخراج جميع البلدان الفريدة
            const countries = allData
                .map(user => user.country)
                .filter(country => country && country.trim() !== "")
                .filter((country, index, self) => self.indexOf(country) === index)
                .sort()
            
            setAllCountries(countries)
            console.log("🌍 Extracted countries:", countries)
            
        } catch (err) {
            console.error("❌ Error fetching all users:", err)
            showErrorToast("فشل تحميل بيانات المستخدمين")
            setAllUsers([])
            setAllCountries([])
            setTotalUsers(0)
        } finally {
            setLoading(false)
        }
    }

    // فلترة وترتيب البيانات (كل البيانات بدون باجينيشن)
    const filteredAndSortedUsers = useMemo(() => {
        let filtered = [...allUsers]

        // البحث بالاسم والهاتف
        if (searchTerm.trim()) {
            filtered = filtered.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm)
            )
        }

        // فلترة بالحالة
        if (statusFilter !== "all") {
            filtered = filtered.filter(user =>
                statusFilter === "active" ? user.isActive : !user.isActive
            )
        }

        // فلترة بالدور
        if (roleFilter !== "all") {
            filtered = filtered.filter(user => user.role === roleFilter)
        }

        // فلترة بالبلد
        if (countryFilter !== "all") {
            filtered = filtered.filter(user => 
                user.country?.toLowerCase().includes(countryFilter.toLowerCase())
            )
        }

        // الترتيب
        filtered.sort((a, b) => {
            let aValue, bValue

            switch (sortBy) {
                case "name":
                    aValue = a.name?.toLowerCase() || ""
                    bValue = b.name?.toLowerCase() || ""
                    break
                case "role":
                    aValue = a.role || ""
                    bValue = b.role || ""
                    break
                case "createdAt":
                    aValue = new Date(a.createdAt) || new Date(0)
                    bValue = new Date(b.createdAt) || new Date(0)
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
    }, [allUsers, searchTerm, statusFilter, roleFilter, countryFilter, sortBy, sortOrder])

    // تطبيق الباجينيشن على البيانات المفلترة
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedData = filteredAndSortedUsers.slice(startIndex, endIndex)
        
        setCurrentPageData(paginatedData)
        
        // تحديث إحصائيات الباجينيشن
        const totalFiltered = filteredAndSortedUsers.length
        setTotalUsers(totalFiltered)
        
        console.log(`📊 Pagination: Showing ${startIndex + 1}-${Math.min(endIndex, totalFiltered)} of ${totalFiltered} users`)
    }, [filteredAndSortedUsers, currentPage, itemsPerPage])

    // إعادة تعيين الصفحة عند تغيير الفلتر
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, roleFilter, countryFilter, itemsPerPage])

    useEffect(() => {
        fetchAllUsersData()
    }, []) // فارغ يعني مرة واحدة عند التحميل

    // Pagination calculations - استخدام طول البيانات المفلترة
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)

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
        setRoleFilter("all")
        setCountryFilter("all")
        setSortBy("createdAt")
        setSortOrder("desc")
        setCurrentPage(1)
    }

    // التعامل مع تغييرات النموذج
    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    // حفظ المستخدم (إضافة أو تعديل)
    const handleSave = async () => {
        if (!form.name.trim()) return showErrorToast("يرجى إدخال اسم المستخدم")
        if (!form.phone.trim()) return showErrorToast("يرجى إدخال رقم الهاتف")
        if (!form.birthDate) return showErrorToast("يرجى إدخال تاريخ الميلاد")

        try {
            const userData = {
                name: form.name,
                phone: form.phone,
                birthDate: form.birthDate,
                sex: form.sex,
                role: form.role,
                country: form.country || "",
                isActive: Boolean(form.isActive),
                expiresAt: form.expiresAt || null
            }

            console.log("📤 Sending user data:", userData)

            if (editItem) {
                await updateUser(editItem.id, userData)
                showSuccessToast("تم تعديل المستخدم بنجاح")
                setEditItem(null)
            } else {
                await createUser(userData)
                showSuccessToast("تم إنشاء المستخدم بنجاح")
            }

            // إعادة تعيين النموذج
            setForm({
                name: "",
                phone: "",
                birthDate: "",
                sex: "ذكر",
                role: "STUDENT",
                country: "",
                isActive: true,
                expiresAt: ""
            })
            setIsDialogOpen(false)
            fetchAllUsersData() // إعادة تحميل البيانات
        } catch (err) {
            console.error("❌ Save error:", err.response?.data || err)
            showErrorToast(err?.response?.data?.message || "فشل العملية")
        }
    }

    // تبديل حالة المستخدم
    const handleToggleActive = async (id, isActive) => {
        try {
            await toggleUserActive(id)
            showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`)
            fetchAllUsersData() // إعادة تحميل البيانات
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة")
        }
    }

    // حذف المستخدم
    const handleDelete = async (id) => {
        try {
            await deleteUser(id)
            fetchAllUsersData() // إعادة تحميل البيانات
            showSuccessToast("تم الحذف بنجاح")
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل الحذف")
        }
    }

    // تنسيق التاريخ بالميلادي السوري
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد"
        return new Date(dateString).toLocaleDateString('en-US')
    }

    // الحصول على لون البادج حسب الدور
    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'ADMIN': return 'destructive'
            case 'SUBADMIN': return 'default'
            case 'STUDENT': return 'secondary'
            default: return 'outline'
        }
    }

    // الحصول على نص الدور
    const getRoleText = (role) => {
        switch (role) {
            case 'ADMIN': return 'مدير'
            case 'SUBADMIN': return 'مساعد مدير'
            case 'STUDENT': return 'طالب'
            default: return role
        }
    }

    // مكون عرض الصورة
    const UserAvatar = ({ user, size = "medium", className = "" }) => {
        const [imgError, setImgError] = useState(false);
        const imageUrl = user.avatarUrl ? getImageUrl(user.avatarUrl) : null;
        const sizeClass = size === "large" ? "w-24 h-24" : size === "small" ? "w-8 h-8" : "w-12 h-12";
        
        const handleImageError = (e) => {
            console.warn(`Failed to load image: ${imageUrl}`);
            setImgError(true);
            e.target.style.display = 'none';
        };

        return (
            <div className={`${sizeClass} ${className} bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border`}>
                {imageUrl && !imgError ? (
                    <img 
                        src={imageUrl} 
                        alt={user.name}
                        className={`${sizeClass} rounded-full object-cover`}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                        loading="lazy"
                    />
                ) : (
                    <User className={size === "large" ? "w-12 h-12 text-gray-500" : "w-5 h-5 text-gray-500"} />
                )}
            </div>
        );
    };

    // عرض التفاصيل الكاملة للمستخدم - تصميم محسن
    const renderUserDetails = (user) => {
        if (!user) return null

        return (
            <div className="space-y-6 text-right">
                {/* الهيدر مع الصورة والمعلومات الأساسية */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-l from-gray-50 to-white rounded-lg border">
                    <UserAvatar user={user} size="large" className="flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{user.name || "بدون اسم"}</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant={getRoleBadgeVariant(user.role)} className="text-sm">
                                <Shield className="w-3 h-3 ml-1" />
                                {getRoleText(user.role)}
                            </Badge>
                            <Badge variant={user.isActive ? "default" : "secondary"} className="text-sm">
                                {user.isActive ? "نشط" : "معطل"}
                            </Badge>
                            <Badge variant={user.isVerified ? "default" : "secondary"} className="text-sm">
                                {user.isVerified ? "مفعل" : "غير مفعل"}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* الشبكة الرئيسية للمعلومات */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* المعلومات الشخصية */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5" />
                                المعلومات الشخصية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-600">رقم الهاتف</Label>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium" dir="ltr">{user.phone || "غير محدد"}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-600">تاريخ الميلاد</Label>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{formatDate(user.birthDate)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-600">الجنس</Label>
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <span className="font-medium">{user.sex || "غير محدد"}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-600">البلد</Label>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <Globe className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{user.country || "غير محدد"}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* معلومات الحساب */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                معلومات الحساب
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">تاريخ الإنشاء</span>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{formatDate(user.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">تاريخ الانتهاء</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{formatDate(user.expiresAt) || "غير محدد"}</span>
                                    </div>
                                </div>
                                {/* <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">معرف المستخدم</span>
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{user.id || "غير محدد"}</span>
                                </div> */}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* الإجراءات */}
                <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className="flex items-center gap-2"
                    >
                        {user.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {user.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setEditItem(user)
                            setForm({
                                name: user.name || "",
                                phone: user.phone || "",
                                birthDate: user.birthDate?.split('T')[0] || "",
                                sex: user.sex || "ذكر",
                                role: user.role || "STUDENT",
                                country: user.country || "",
                                isActive: user.isActive || true,
                                expiresAt: user.expiresAt?.split('T')[0] || ""
                            })
                            setIsDialogOpen(true)
                            setDetailDialog({ isOpen: false, user: null })
                        }}
                        className="flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        تعديل المستخدم
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            setDeleteDialog({
                                isOpen: true,
                                itemId: user.id,
                                itemName: user.name || "بدون اسم"
                            })
                            setDetailDialog({ isOpen: false, user: null })
                        }}
                        className="flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        حذف المستخدم
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <CardTitle>إدارة المستخدمين</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setEditItem(null)
                                    setForm({
                                        name: "",
                                        phone: "",
                                        birthDate: "",
                                        sex: "ذكر",
                                        role: "STUDENT",
                                        country: "",
                                        isActive: true,
                                        expiresAt: ""
                                    })
                                }}
                            >
                                إضافة مستخدم <Plus className="w-4 h-4 cursor-pointer" />
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editItem ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label>الاسم الكامل *</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => handleFormChange("name", e.target.value)}
                                        placeholder="أدخل الاسم الكامل..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>رقم الهاتف *</Label>
                                    <Input
                                        value={form.phone}
                                        onChange={(e) => handleFormChange("phone", e.target.value)}
                                        placeholder="أدخل رقم الهاتف..."
                                        className="dir-ltr text-left"
                                        dir="ltr"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>تاريخ الميلاد *</Label>
                                        <Input
                                            type="date"
                                            value={form.birthDate}
                                            onChange={(e) => handleFormChange("birthDate", e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>الجنس</Label>
                                        <Select
                                            value={form.sex}
                                            onValueChange={(value) => handleFormChange("sex", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الجنس" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ذكر">ذكر</SelectItem>
                                                <SelectItem value="أنثى">أنثى</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>الدور *</Label>
                                        <Select
                                            value={form.role}
                                            onValueChange={(value) => handleFormChange("role", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الدور" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STUDENT">طالب</SelectItem>
                                                <SelectItem value="SUBADMIN">مساعد مدير</SelectItem>
                                                <SelectItem value="ADMIN">مدير</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>البلد</Label>
                                        <Input
                                            value={form.country}
                                            onChange={(e) => handleFormChange("country", e.target.value)}
                                            placeholder="أدخل اسم البلد..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>تاريخ الانتهاء</Label>
                                        <Input
                                            type="date"
                                            value={form.expiresAt}
                                            onChange={(e) => handleFormChange("expiresAt", e.target.value)}
                                        />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث بالاسم أو الهاتف..."
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

                    {/* Role Filter */}
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="فلترة بالدور" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع الأدوار</SelectItem>
                            <SelectItem value="STUDENT">طالب</SelectItem>
                            <SelectItem value="SUBADMIN">مساعد مدير</SelectItem>
                            <SelectItem value="ADMIN">مدير</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Country Filter - ديناميكي */}
                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="فلترة بالبلد" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع البلدان</SelectItem>
                            {allCountries.map(country => (
                                <SelectItem key={country} value={country}>
                                    {country}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

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
                            <SelectItem value="20">20 عناصر</SelectItem>
                            <SelectItem value="50">50 عناصر</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Reset Filters & Results Count */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                        عرض {startItem} إلى {endItem} من {filteredAndSortedUsers.length} مستخدم
                        {(searchTerm || statusFilter !== "all" || roleFilter !== "all" || countryFilter !== "all") && ` (مفلتر)`}
                    </div>

                    {(searchTerm || statusFilter !== "all" || roleFilter !== "all" || countryFilter !== "all") && (
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
                                        <TableHead className="table-header">المستخدم</TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("role")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الدور
                                                {sortBy === "role" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header">الهاتف</TableHead>
                                        <TableHead className="table-header">البلد</TableHead>
                                        <TableHead className="table-header">تاريخ الميلاد</TableHead>
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
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("createdAt")}
                                        >
                                            <div className="flex items-center gap-1">
                                                تاريخ الإنشاء
                                                {sortBy === "createdAt" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header text-right">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentPageData.length > 0 ? currentPageData.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="table-cell">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar user={user} />
                                                    <div>
                                                        <div className="font-medium">{user.name || "بدون اسم"}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                                    {getRoleText(user.role)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <div className="flex items-center gap-2  text-left" dir='ltr'>
                                                    <Phone className="w-4 h-4 text-gray-500" />
                                                    {user.phone}
                                                </div>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {user.country ? (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-gray-500" />
                                                        {user.country}
                                                    </div>
                                                ) : (
                                                    "غير محدد"
                                                )}
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {formatDate(user.birthDate)}
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <Badge variant={user.isActive ? "default" : "secondary"}>
                                                    {user.isActive ? "نشط" : "معطل"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                            <TableCell className="table-cell text-right space-x-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setDetailDialog({ isOpen: true, user })}
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleToggleActive(user.id, user.isActive)}
                                                    title={user.isActive ? "تعطيل" : "تفعيل"}
                                                >
                                                    {user.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditItem(user)
                                                        setForm({
                                                            name: user.name || "",
                                                            phone: user.phone || "",
                                                            birthDate: user.birthDate?.split('T')[0] || "",
                                                            sex: user.sex || "ذكر",
                                                            role: user.role || "STUDENT",
                                                            country: user.country || "",
                                                            isActive: user.isActive || true,
                                                            expiresAt: user.expiresAt?.split('T')[0] || ""
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
                                                        itemId: user.id,
                                                        itemName: user.name || "بدون اسم"
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
                                                {allUsers.length === 0 ? "لا توجد مستخدمين" : "لا توجد نتائج مطابقة للبحث"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards View - محسن */}
                        <div className="block md:hidden space-y-4">
                            {currentPageData.length > 0 ? currentPageData.map(user => (
                                <Card key={user.id} className="p-4 overflow-hidden">
                                    {/* الهيدر مع الصورة */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <UserAvatar user={user} size="large" className="flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg truncate">{user.name || "بدون اسم"}</h3>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                                    {getRoleText(user.role)}
                                                </Badge>
                                                <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                                                    {user.isActive ? "نشط" : "معطل"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* معلومات المستخدم */}
                                    <div className="grid grid-cols-1 gap-3 text-sm mb-4">
                                        <div className="flex items-center gap-2 dir-ltr text-left bg-gray-50 p-2 rounded-lg">
                                            <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <span className="truncate">{user.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                            <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <span className="truncate">{user.country || "غير محدد"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <span>{formatDate(user.birthDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                            <span className={user.isVerified ? "text-green-600" : "text-orange-600"}>
                                                {user.isVerified ? "✓ الحساب مفعل" : "✗ الحساب غير مفعل"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* الأزرار - متجاوبة */}
                                    <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setDetailDialog({ isOpen: true, user })}
                                            className="h-10 text-xs"
                                        >
                                            <Eye className="w-3 h-3 ml-1" />
                                            التفاصيل
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleToggleActive(user.id, user.isActive)}
                                            className="h-10 text-xs"
                                        >
                                            {user.isActive ? <Pause className="w-3 h-3 ml-1" /> : <Play className="w-3 h-3 ml-1" />}
                                            {user.isActive ? "إيقاف" : "تفعيل"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditItem(user)
                                                setForm({
                                                    name: user.name || "",
                                                    phone: user.phone || "",
                                                    birthDate: user.birthDate?.split('T')[0] || "",
                                                    sex: user.sex || "ذكر",
                                                    role: user.role || "STUDENT",
                                                    country: user.country || "",
                                                    isActive: user.isActive || true,
                                                    expiresAt: user.expiresAt?.split('T')[0] || ""
                                                })
                                                setIsDialogOpen(true)
                                            }}
                                            className="h-10 text-xs"
                                        >
                                            <Edit className="w-3 h-3 ml-1" />
                                            تعديل
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => setDeleteDialog({
                                                isOpen: true,
                                                itemId: user.id,
                                                itemName: user.name || "بدون اسم"
                                            })}
                                            className="h-10 text-xs"
                                        >
                                            <Trash2 className="w-3 h-3 ml-1" />
                                            حذف
                                        </Button>
                                    </div>
                                </Card>
                            )) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allUsers.length === 0 ? "لا توجد مستخدمين" : "لا توجد نتائج مطابقة للبحث"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {filteredAndSortedUsers.length > itemsPerPage && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من {filteredAndSortedUsers.length} مستخدم
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
                        <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا المستخدم؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف المستخدم "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
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

            {/* User Details Dialog - محسن */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog(prev => ({ ...prev, isOpen }))}>
                <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">تفاصيل المستخدم</DialogTitle>
                    </DialogHeader>
                    {renderUserDetails(detailDialog.user)}
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export default Account