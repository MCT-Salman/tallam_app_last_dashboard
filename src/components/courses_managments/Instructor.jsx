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
import { Plus, Edit, Trash2, Play, Pause, Search, ChevronLeft, ChevronRight, Eye, User, Mail, Phone, Calendar, MapPin, Upload } from "lucide-react"
import { getAllUsers, createUser, updateUser, deleteUser, toggleUserActive } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"
import { BASE_URL } from "@/api/api"
import { imageConfig } from "@/utils/corsConfig";

const Account = () => {
    const [users, setUsers] = useState([])
    const [allUsers, setAllUsers] = useState([])
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
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
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

    // دالة لتنظيف وتكوين مسار الصورة
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/default-avatar.png";
        const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
        const cleanImageUrl = imageUrl.replace(/^\//, "");
        return `${cleanBaseUrl}/${cleanImageUrl}`;
    };

    // دالة مساعدة لتحويل رابط الصورة إلى File object
    const urlToFile = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
        } catch (error) {
            console.error('Error converting URL to file:', error);
            return null;
        }
    };

    // جلب جميع المستخدمين
    const fetchUsers = async () => {
        setLoading(true)
        try {
            const params = {
                skip: (currentPage - 1) * itemsPerPage,
                take: itemsPerPage,
                q: searchTerm || undefined,
                role: roleFilter !== "all" ? roleFilter : undefined,
                country: countryFilter !== "all" ? countryFilter : undefined,
                isActive: statusFilter !== "all" ? (statusFilter === "active") : undefined
            }

            console.log("📤 Fetching users with params:", params)

            const res = await getAllUsers(params)
            console.log("📊 Users API response:", res)
            
            // معالجة الـ response بناءً على الهيكل الجديد
            let data = []
            let total = 0
            
            if (res.data?.data?.items) {
                data = res.data.data.items
                total = res.data.data.total
                console.log(`✅ Loaded ${data.length} users out of ${total} total`)
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data
                total = data.length
            } else if (Array.isArray(res.data)) {
                data = res.data
                total = data.length
            }
            
            setAllUsers(data || [])
            setUsers(data || [])
            setTotalUsers(total || 0)
        } catch (err) {
            console.error("❌ Error fetching users:", err)
            showErrorToast("فشل تحميل المستخدمين")
            setAllUsers([])
            setUsers([])
            setTotalUsers(0)
        } finally {
            setLoading(false)
        }
    }

    // استخراج الدول الفريدة من المستخدمين
    const uniqueCountries = useMemo(() => {
        const countries = allUsers
            .map(user => user.country)
            .filter(country => country && country.trim() !== "")
            .filter((country, index, self) => self.indexOf(country) === index)
            .sort()
        return countries
    }, [allUsers])

    useEffect(() => {
        fetchUsers()
    }, [currentPage, itemsPerPage, searchTerm, statusFilter, roleFilter, countryFilter])

    // فلترة وترتيب البيانات
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

    // إعادة تعيين الصفحة عند تغيير الفلتر
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, roleFilter, countryFilter, itemsPerPage])

    // التعامل مع تغييرات النموذج
    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    // التعامل مع تغيير الصورة
    const onImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    // حفظ المستخدم (إضافة أو تعديل)
    const handleSave = async () => {
        if (!form.name.trim()) return showErrorToast("يرجى إدخال اسم المستخدم")
        if (!form.phone.trim()) return showErrorToast("يرجى إدخال رقم الهاتف")
        if (!form.birthDate) return showErrorToast("يرجى إدخال تاريخ الميلاد")

        try {
            let imageToSend = imageFile;
            
            // إذا كان تعديل ولم يتم اختيار صورة جديدة، نستخدم الصورة القديمة
            if (editItem && !imageFile && editItem.avatarUrl) {
                const imageUrl = getImageUrl(editItem.avatarUrl);
                imageToSend = await urlToFile(imageUrl, `user-${editItem.id}.jpg`);
            }

            const userData = {
                name: form.name,
                phone: form.phone,
                birthDate: form.birthDate,
                sex: form.sex,
                role: form.role,
                country: form.country || "",
                isActive: Boolean(form.isActive),
                expiresAt: form.expiresAt || null,
                ...(imageToSend && { avatarUrl: imageToSend })
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
            setImageFile(null)
            setImagePreview(null)
            setIsDialogOpen(false)
            fetchUsers()
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
            fetchUsers()
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة")
        }
    }

    // حذف المستخدم
    const handleDelete = async (id) => {
        try {
            await deleteUser(id)
            fetchUsers()
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

    // Pagination calculations - استخدام total من الـ API
    const totalPages = Math.ceil(totalUsers / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalUsers)

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

    // مكون عرض الصورة المحسن
    const UserAvatar = ({ user, size = "medium" }) => {
        const imageUrl = user.avatarUrl ? getImageUrl(user.avatarUrl) : null;
        const sizeClass = size === "large" ? "w-24 h-24" : size === "small" ? "w-8 h-8" : "w-12 h-12";
        
        return (
            <div className={`${sizeClass} bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border`}>
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={user.name}
                        className={`${sizeClass} rounded-full object-cover`}
                        {...imageConfig}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                        }}
                    />
                ) : null}
                {!imageUrl && (
                    <User className={size === "large" ? "w-12 h-12 text-gray-500" : "w-5 h-5 text-gray-500"} />
                )}
            </div>
        );
    };

    // مكون بطاقة المستخدم للعرض على الجوال
    const UserCard = ({ user }) => (
        <Card className="mb-4 overflow-hidden">
            {/* صورة المستخدم في أعلى البطاقة */}
            <div className="relative h-32 bg-gray-100 flex items-center justify-center">
                <UserAvatar user={user} size="large" />
                {/* حالة المستخدم في الزاوية */}
                <div className="absolute top-3 left-3">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "نشط" : "معطل"}
                    </Badge>
                </div>
            </div>
            
            <CardContent className="p-4">
                <div className="space-y-3">
                    <div className="text-center">
                        <h3 className="font-bold text-lg">{user.name || "بدون اسم"}</h3>
                        <div className="flex justify-center gap-2 mt-1">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                {getRoleText(user.role)}
                            </Badge>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 dir-ltr text-left">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{user.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{user.country || "غير محدد"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{formatDate(user.birthDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={user.isVerified ? "text-green-600" : "text-orange-600"}>
                                {user.isVerified ? "مفعل" : "غير مفعل"}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailDialog({ isOpen: true, user })}
                        className="flex-1"
                    >
                        <Eye className="w-4 h-4 ml-1" />
                        التفاصيل
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className="flex-1"
                    >
                        {user.isActive ? <Pause className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" />}
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
                            setImageFile(null)
                            setImagePreview(user.avatarUrl ? getImageUrl(user.avatarUrl) : null)
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
                            itemId: user.id,
                            itemName: user.name || "بدون اسم"
                        })}
                        className="flex-1"
                    >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    // عرض التفاصيل الكاملة للمستخدم
    const renderUserDetails = (user) => {
        if (!user) return null

        return (
            <div className="space-y-6 text-right">
                {/* صورة المستخدم في الأعلى */}
                <div className="flex justify-center">
                    <UserAvatar user={user} size="large" />
                </div>

                {/* المعلومات الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="font-bold">الاسم:</Label>
                        <p className="mt-1">{user.name || "غير محدد"}</p>
                    </div>
                    <div>
                        <Label className="font-bold">رقم الهاتف:</Label>
                        <p className="mt-1 dir-ltr text-left">{user.phone || "غير محدد"}</p>
                    </div>
                    <div>
                        <Label className="font-bold">تاريخ الميلاد:</Label>
                        <p className="mt-1">{formatDate(user.birthDate)}</p>
                    </div>
                    <div>
                        <Label className="font-bold">الجنس:</Label>
                        <p className="mt-1">{user.sex || "غير محدد"}</p>
                    </div>
                    <div>
                        <Label className="font-bold">الدور:</Label>
                        <div className="mt-1">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                {getRoleText(user.role)}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <Label className="font-bold">البلد:</Label>
                        <p className="mt-1">{user.country || "غير محدد"}</p>
                    </div>
                    <div>
                        <Label className="font-bold">الحالة:</Label>
                        <div className="mt-1">
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? "نشط" : "معطل"}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <Label className="font-bold">الحساب مفعل:</Label>
                        <div className="mt-1">
                            <Badge variant={user.isVerified ? "default" : "secondary"}>
                                {user.isVerified ? "مفعل" : "غير مفعل"}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* معلومات إضافية */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">معلومات إضافية:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-medium">تاريخ الإنشاء:</Label>
                            <p>{formatDate(user.createdAt)}</p>
                        </div>
                        <div>
                            <Label className="font-medium">آخر تحديث:</Label>
                            <p>{formatDate(user.updatedAt)}</p>
                        </div>
                        <div>
                            <Label className="font-medium">تاريخ الانتهاء:</Label>
                            <p>{formatDate(user.expiresAt)}</p>
                        </div>
                        <div>
                            <Label className="font-medium">معرف المستخدم:</Label>
                            <p>{user.id || "غير محدد"}</p>
                        </div>
                    </div>
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
                                    setImageFile(null)
                                    setImagePreview(null)
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
                                {/* معاينة الصورة */}
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border">
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="معاينة الصورة"
                                                    className="w-24 h-24 rounded-full object-cover"
                                                    {...imageConfig}
                                                />
                                            ) : (
                                                <User className="w-12 h-12 text-gray-500" />
                                            )}
                                        </div>
                                        <Label 
                                            htmlFor="user-avatar" 
                                            className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </Label>
                                    </div>
                                </div>

                                {/* حقل رفع الصورة مخفي */}
                                <Input 
                                    id="user-avatar"
                                    type="file" 
                                    accept="image/*" 
                                    onChange={onImageChange}
                                    className="hidden"
                                />

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
                            {uniqueCountries.map(country => (
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
                        عرض {startItem} إلى {endItem} من {totalUsers} مستخدم
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
                                        <TableHead className="table-header">الصورة</TableHead>
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
                                    {allUsers.length > 0 ? allUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="table-cell">
                                                <UserAvatar user={user} size="small" />
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <div className="flex items-center gap-3">
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
                                                        setImageFile(null)
                                                        setImagePreview(user.avatarUrl ? getImageUrl(user.avatarUrl) : null)
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
                                            <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                                                لا توجد مستخدمين متاحين
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Cards View - for small screens */}
                        <div className="block md:hidden">
                            {allUsers.length > 0 ? (
                                allUsers.map(user => (
                                    <UserCard key={user.id} user={user} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    لا توجد مستخدمين متاحين
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {allUsers.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من {totalUsers} مستخدم
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

            {/* User Details Dialog */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog({ isOpen, user: null })}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل المستخدم</DialogTitle>
                    </DialogHeader>
                    {renderUserDetails(detailDialog.user)}
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export default Account