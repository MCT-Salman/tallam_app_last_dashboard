import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Plus, Edit, Trash2, Eye, User, Mail, Phone, Calendar, Key, UserCheck, UserX, Globe, Clock, Shield, Search, ChevronLeft, ChevronRight, Filter, Play, Pause } from "lucide-react"
import { createAdmin, getAdminsList, updateAdmin, deleteAdmin } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

const Admins_Accounts = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [admins, setAdmins] = useState([])
  
  // Pagination & Filtering states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [statusFilter, setStatusFilter] = useState("all")

  // حالة النموذج
  const [form, setForm] = useState({
    phone: "",
    name: "",
    birthDate: "",
    sex: "ذكر",
    role: "ADMIN",
    username: "",
    email: "",
    password: "",
    expiresAt: "",
    isActive: true
  })

  // حالات الدايلوج
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, adminId: null, adminName: "" })
  const [selectedAdmin, setSelectedAdmin] = useState(null)

  // جلب قائمة المدراء
  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const res = await getAdminsList()
      console.log("👥 Admins list response:", res.data)
      
      if (res.data?.success) {
        setAdmins(res.data.data?.admins || [])
      }
    } catch (err) {
      console.error("❌ Error fetching admins:", err)
      showErrorToast(err?.response?.data?.message || "فشل تحميل قائمة المدراء")
    } finally {
      setLoading(false)
    }
  }

  // إضافة مدير جديد
  const handleCreateAdmin = async () => {
    // التحقق من الحقول المطلوبة
    if (!form.phone || !form.name || !form.username || !form.email || !form.password) {
      showErrorToast("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setSaving(true)
    try {
      // تحضير البيانات للإرسال
      const adminData = {
        phone: form.phone,
        name: form.name,
        birthDate: form.birthDate || null,
        sex: form.sex,
        role: form.role,
        username: form.username,
        email: form.email,
        password: form.password,
        expiresAt: form.expiresAt || null,
        isActive: Boolean(form.isActive)
      }

      console.log("📤 Sending admin data:", adminData)

      const res = await createAdmin(adminData)
      console.log("➕ Create admin response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast("تم إنشاء حساب المدير بنجاح")
        resetForm()
        setAddDialogOpen(false)
        fetchAdmins()
      }
    } catch (err) {
      console.error("❌ Error creating admin:", err)
      showErrorToast(err?.response?.data?.message || "فشل إنشاء حساب المدير")
    } finally {
      setSaving(false)
    }
  }

  // تعديل مدير
  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return

    setSaving(true)
    try {
      const adminData = {
        phone: form.phone,
        name: form.name,
        birthDate: form.birthDate || null,
        sex: form.sex,
        role: form.role,
        username: form.username,
        email: form.email,
        expiresAt: form.expiresAt || null,
        isActive: Boolean(form.isActive)
      }

      // إضافة كلمة المرور فقط إذا تم إدخالها
      if (form.password) {
        adminData.password = form.password
      }

      console.log("📤 Updating admin data:", adminData)

      const res = await updateAdmin(selectedAdmin.id, adminData)
      console.log("✏️ Update admin response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast("تم تحديث بيانات المدير بنجاح")
        resetForm()
        setEditDialogOpen(false)
        fetchAdmins()
      }
    } catch (err) {
      console.error("❌ Error updating admin:", err)
      showErrorToast(err?.response?.data?.message || "فشل تحديث بيانات المدير")
    } finally {
      setSaving(false)
    }
  }

  // تبديل حالة المدير (تفعيل/تعطيل)
  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    try {
      const admin = admins.find(admin => admin.id === adminId)
      const newStatus = !currentStatus
      
      const adminData = {
        phone: admin?.user?.phone || "",
        name: admin?.user?.name || "",
        username: admin?.username || "",
        email: admin?.email || "",
        isActive: newStatus
      }

      const res = await updateAdmin(adminId, adminData)
      console.log("🔄 Toggle admin status response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast(`تم ${newStatus ? "تفعيل" : "تعطيل"} حساب المدير بنجاح`)
        fetchAdmins()
      }
    } catch (err) {
      console.error("❌ Error toggling admin status:", err)
      showErrorToast(err?.response?.data?.message || "فشل تحديث حالة المدير")
    }
  }

  // حذف مدير
  const handleDeleteAdmin = async (adminId) => {
    try {
      const res = await deleteAdmin(adminId)
      console.log("🗑️ Delete admin response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast("تم حذف المدير بنجاح")
        setDeleteDialog({ isOpen: false, adminId: null, adminName: "" })
        fetchAdmins()
      }
    } catch (err) {
      console.error("❌ Error deleting admin:", err)
      showErrorToast(err?.response?.data?.message || "فشل حذف المدير")
    }
  }

  // التعامل مع تغييرات النموذج
  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // إعادة تعيين النموذج
  const resetForm = () => {
    setForm({
      phone: "",
      name: "",
      birthDate: "",
      sex: "ذكر",
      role: "ADMIN",
      username: "",
      email: "",
      password: "",
      expiresAt: "",
      isActive: true
    })
    setSelectedAdmin(null)
  }

  // فتح دايولوج عرض التفاصيل
  const openViewDialog = (admin) => {
    setSelectedAdmin(admin)
    setViewDialogOpen(true)
  }

  // فتح دايولوج التعديل
  const openEditDialog = (admin) => {
    setSelectedAdmin(admin)
    setForm({
      phone: admin.user?.phone || "",
      name: admin.user?.name || "",
      birthDate: admin.user?.birthDate ? admin.user.birthDate.split('T')[0] : "",
      sex: admin.user?.sex || "ذكر",
      role: admin.user?.role || "ADMIN",
      username: admin.username || "",
      email: admin.email || "",
      password: "", // لا نعرض كلمة المرور الحالية
      expiresAt: admin.user?.expiresAt ? admin.user.expiresAt.split('T')[0] : "",
      isActive: admin.user?.isActive || true
    })
    setEditDialogOpen(true)
  }

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد"
    return new Date(dateString).toLocaleDateString('en-US')
  }

  // فلترة وترتيب البيانات
  const filteredAndSortedAdmins = useMemo(() => {
    let filtered = [...admins]

    // البحث
    if (searchTerm.trim()) {
      filtered = filtered.filter(admin =>
        admin.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.user?.phone?.includes(searchTerm)
      )
    }

    // فلترة حسب الحالة
    if (statusFilter !== "all") {
      filtered = filtered.filter(admin => 
        statusFilter === "active" ? admin.user?.isActive : !admin.user?.isActive
      )
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "name":
          aValue = a.user?.name?.toLowerCase() || ""
          bValue = b.user?.name?.toLowerCase() || ""
          break
        case "username":
          aValue = a.username?.toLowerCase() || ""
          bValue = b.username?.toLowerCase() || ""
          break
        case "email":
          aValue = a.email?.toLowerCase() || ""
          bValue = b.email?.toLowerCase() || ""
          break
        case "createdAt":
          aValue = new Date(a.user?.createdAt) || new Date(0)
          bValue = new Date(b.user?.createdAt) || new Date(0)
          break
        default:
          aValue = new Date(a.user?.createdAt) || new Date(0)
          bValue = new Date(b.user?.createdAt) || new Date(0)
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [admins, searchTerm, sortBy, sortOrder, statusFilter])

  // حساب البيانات المعروضة في الصفحة الحالية
  const paginatedAdmins = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedAdmins.slice(startIndex, endIndex)
  }, [filteredAndSortedAdmins, currentPage, itemsPerPage])

  // إعادة تعيين الصفحة عند تغيير الفلتر
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, itemsPerPage, statusFilter])

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
    setSortBy("createdAt")
    setSortOrder("desc")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  // Pagination calculations
  const totalItems = filteredAndSortedAdmins.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // تحميل البيانات عند فتح المكون
  useEffect(() => {
    fetchAdmins()
  }, [])

  // بطاقة المدير للعرض على الجوال
  const AdminCard = ({ admin }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">{admin.user?.name}</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  @{admin.username}
                </Badge>
                <Badge variant={admin.user?.isActive ? "default" : "secondary"} 
                       className={admin.user?.isActive ? "bg-green-600 text-xs" : "text-xs"}>
                  {admin.user?.isActive ? "نشط" : "معطل"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {admin.user?.role === "SUPER_ADMIN" ? "مدير عام" : "مدير"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{admin.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span dir='ltr'>{admin.user?.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>أنشئ في: {formatDate(admin.user?.createdAt)}</span>
            </div>
            {admin.user?.expiresAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>ينتهي في: {formatDate(admin.user?.expiresAt)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openViewDialog(admin)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 ml-1" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditDialog(admin)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 ml-1" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleAdminStatus(admin.id, admin.user?.isActive)}
            className="flex-1"
          >
            {admin.user?.isActive ? <Pause className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" />}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteDialog({
              isOpen: true,
              adminId: admin.id,
              adminName: admin.user?.name
            })}
            className="flex-1"
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">إدارة حسابات المدراء</h1>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              إضافة مدير جديد
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة مدير جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2 text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* الاسم */}
                <div className="space-y-2">
                  <Label>الاسم الكامل *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="أدخل الاسم الكامل"
                    className="text-right"
                  />
                </div>

                {/* اسم المستخدم */}
                <div className="space-y-2">
                  <Label>اسم المستخدم *</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => handleFormChange("username", e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="text-right"
                  />
                </div>

                {/* البريد الإلكتروني */}
                <div className="space-y-2">
                  <Label>البريد الإلكتروني *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    placeholder="admin@example.com"
                    className="text-right"
                  />
                </div>

                {/* رقم الهاتف */}
                <div className="space-y-2">
                  <Label>رقم الهاتف *</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    placeholder="+963123456789"
                    className="text-right"
                    dir="ltr"
                  />
                </div>

                {/* كلمة المرور */}
                <div className="space-y-2">
                  <Label>كلمة المرور *</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="text-right"
                  />
                </div>

                {/* الجنس */}
                <div className="space-y-2">
                  <Label>الجنس</Label>
                  <Select value={form.sex} onValueChange={(value) => handleFormChange("sex", value)}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ذكر">ذكر</SelectItem>
                      <SelectItem value="أنثى">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* تاريخ الميلاد */}
                <div className="space-y-2">
                  <Label>تاريخ الميلاد</Label>
                  <Input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => handleFormChange("birthDate", e.target.value)}
                    className="text-right"
                  />
                </div>

                {/* تاريخ الانتهاء */}
                <div className="space-y-2">
                  <Label>تاريخ انتهاء الصلاحية</Label>
                  <Input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => handleFormChange("expiresAt", e.target.value)}
                    className="text-right"
                  />
                </div>

                {/* الدور */}
                <div className="space-y-2">
                  <Label>الدور</Label>
                  <Select value={form.role} onValueChange={(value) => handleFormChange("role", value)}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">مدير</SelectItem>
                      <SelectItem value="SUPER_ADMIN">مدير عام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* الحالة */}
                {/* <div className="space-y-2 flex items-center gap-2"> */}
                  <div className="space-y-2 mt-6.5">
                    <Button
                      variant={form.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFormChange("isActive", !form.isActive)}
                      className="flex items-center gap-1"
                    >
                      {form.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {form.isActive ? "نشط" : "معطل"}
                    </Button>
                  </div>
                {/* </div> */}
              </div>

              <Separator />

              <Button 
                onClick={handleCreateAdmin}
                disabled={saving}
                className="w-full flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {saving ? "جاري الإنشاء..." : "إنشاء حساب المدير"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              قائمة المدراء ({admins.length})
            </CardTitle>
          </div>

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، اسم المستخدم، البريد أو الهاتف..."
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

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة بالحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط فقط</SelectItem>
                <SelectItem value="inactive">معطل فقط</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
                <SelectItem value="name">الاسم</SelectItem>
                <SelectItem value="username">اسم المستخدم</SelectItem>
                <SelectItem value="email">البريد الإلكتروني</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters & Results Count */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-muted-foreground">
              عرض {filteredAndSortedAdmins.length} من أصل {admins.length} مدير
              {searchTerm && ` (مفلتر)`}
            </div>

            {(searchTerm || statusFilter !== "all" || sortBy !== "createdAt" || sortOrder !== "desc") && (
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
              <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
            </div>
          ) : (
            <>
              {/* عرض الجدول للشاشات المتوسطة والكبيرة */}
              <div className="hidden md:block">
                <Table className="direction-rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          الاسم
                          {sortBy === "name" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("username")}
                      >
                        <div className="flex items-center gap-1">
                          اسم المستخدم
                          {sortBy === "username" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center gap-1">
                          البريد الإلكتروني
                          {sortBy === "email" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center gap-1">
                          تاريخ الإنشاء
                          {sortBy === "createdAt" && (
                            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAdmins.length > 0 ? paginatedAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">
                          {admin.user?.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">@{admin.username}</Badge>
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell dir="ltr">{admin.user?.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {admin.user?.role === "SUPER_ADMIN" ? "مدير عام" : "مدير"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={admin.user?.isActive ? "default" : "secondary"} 
                                className={admin.user?.isActive ? "bg-green-600" : ""}>
                            {admin.user?.isActive ? "نشط" : "معطل"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(admin.user?.createdAt)}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openViewDialog(admin)}
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleAdminStatus(admin.id, admin.user?.isActive)}
                            title={admin.user?.isActive ? "تعطيل" : "تفعيل"}
                          >
                            {admin.user?.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(admin)}
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => setDeleteDialog({
                              isOpen: true,
                              adminId: admin.id,
                              adminName: admin.user?.name
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
                          {admins.length === 0 ? "لا توجد حسابات مدراء" : "لا توجد نتائج مطابقة للبحث"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* عرض البطاقات للشاشات الصغيرة */}
              <div className="block md:hidden space-y-4">
                {paginatedAdmins.length > 0 ? (
                  paginatedAdmins.map((admin) => (
                    <AdminCard key={admin.id} admin={admin} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {admins.length === 0 ? "لا توجد حسابات مدراء" : "لا توجد نتائج مطابقة للبحث"}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {paginatedAdmins.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    عرض {startItem} إلى {endItem} من {totalItems} مدير
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
      </Card>

      {/* دايولوج عرض التفاصيل - تصميم محسن */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 text-right">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                تفاصيل المدير
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedAdmin && (
            <div className="space-y-6 text-right">
              {/* الهيدر مع المعلومات الأساسية */}
              <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* الصورة الرمزية */}
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedAdmin.user?.name}</h2>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        @{selectedAdmin.username}
                      </Badge>
                      <Badge variant={selectedAdmin.user?.isActive ? "default" : "secondary"} 
                            className={selectedAdmin.user?.isActive ? "bg-green-600 hover:bg-green-700" : "bg-gray-500"}>
                        {selectedAdmin.user?.isActive ? "🟢 نشط" : "🔴 معطل"}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                        {selectedAdmin.user?.role === "SUPER_ADMIN" ? "👑 مدير عام" : "🛡️ مدير"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* الشبكة الرئيسية للمعلومات */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* المعلومات الشخصية */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                      <User className="w-5 h-5 text-blue-600" />
                      المعلومات الشخصية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">البريد الإلكتروني</span>
                        </div>
                        <span className="font-medium text-gray-900">{selectedAdmin.email}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">رقم الهاتف</span>
                        </div>
                        <span className="font-medium text-gray-900" dir="ltr">{selectedAdmin.user?.phone}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">الجنس</span>
                        </div>
                        <span className="font-medium text-gray-900">{selectedAdmin.user?.sex || 'غير محدد'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">تاريخ الميلاد</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {selectedAdmin.user?.birthDate ? formatDate(selectedAdmin.user.birthDate) : 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* معلومات الحساب */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                      <Shield className="w-5 h-5 text-green-600" />
                      معلومات الحساب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">تاريخ الإنشاء</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatDate(selectedAdmin.user?.createdAt)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">تاريخ الانتهاء</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {selectedAdmin.user?.expiresAt ? formatDate(selectedAdmin.user.expiresAt) : 'غير محدد'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">آخر تحديث</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {selectedAdmin.user?.updatedAt ? formatDate(selectedAdmin.user.updatedAt) : 'غير متوفر'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    openEditDialog(selectedAdmin)
                    setViewDialogOpen(false)
                  }}
                  className="flex items-center gap-2 flex-1"
                >
                  <Edit className="w-4 h-4" />
                  تعديل البيانات
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleToggleAdminStatus(selectedAdmin.id, selectedAdmin.user?.isActive)}
                  className="flex items-center gap-2 flex-1"
                >
                  {selectedAdmin.user?.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {selectedAdmin.user?.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteDialog({
                      isOpen: true,
                      adminId: selectedAdmin.id,
                      adminName: selectedAdmin.user?.name
                    })
                    setViewDialogOpen(false)
                  }}
                  className="flex items-center gap-2 flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف الحساب
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* دايولوج تعديل المدير */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل بيانات المدير</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4 mt-2 text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* الاسم */}
                <div className="space-y-2">
                  <Label>الاسم الكامل *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="أدخل الاسم الكامل"
                    className="text-right"
                  />
                </div>

                {/* اسم المستخدم */}
                <div className="space-y-2">
                  <Label>اسم المستخدم *</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => handleFormChange("username", e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="text-right"
                  />
                </div>

                {/* البريد الإلكتروني */}
                <div className="space-y-2">
                  <Label>البريد الإلكتروني *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    placeholder="admin@example.com"
                    className="text-right"
                  />
                </div>

                {/* رقم الهاتف */}
                <div className="space-y-2">
                  <Label>رقم الهاتف *</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    placeholder="+963123456789"
                    className="text-right"
                    dir="ltr"
                  />
                </div>

                {/* كلمة المرور الجديدة */}
                <div className="space-y-2">
                  <Label>كلمة المرور الجديدة (اختياري)</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    placeholder="اتركه فارغاً للحفاظ على كلمة المرور الحالية"
                    className="text-right"
                  />
                </div>

                {/* الجنس */}
                <div className="space-y-2">
                  <Label>الجنس</Label>
                  <Select value={form.sex} onValueChange={(value) => handleFormChange("sex", value)}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ذكر">ذكر</SelectItem>
                      <SelectItem value="أنثى">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* تاريخ الميلاد */}
                <div className="space-y-2">
                  <Label>تاريخ الميلاد</Label>
                  <Input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => handleFormChange("birthDate", e.target.value)}
                    className="text-right"
                  />
                </div>

                {/* تاريخ الانتهاء */}
                <div className="space-y-2">
                  <Label>تاريخ انتهاء الصلاحية</Label>
                  <Input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => handleFormChange("expiresAt", e.target.value)}
                    className="text-right"
                  />
                </div>

                {/* الدور */}
                <div className="space-y-2">
                  <Label>الدور</Label>
                  <Select value={form.role} onValueChange={(value) => handleFormChange("role", value)}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">مدير</SelectItem>
                      <SelectItem value="SUPER_ADMIN">مدير عام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* الحالة */}
                <div className="space-y-2 flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={form.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFormChange("isActive", !form.isActive)}
                      className="flex items-center gap-1"
                    >
                      {form.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {form.isActive ? "نشط" : "معطل"}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <Button 
                onClick={handleUpdateAdmin}
                disabled={saving}
                className="w-full flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {saving ? "جاري التحديث..." : "تحديث بيانات المدير"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* دايولوج حذف المدير */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
      >
        <AlertDialogContent className="text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف حساب المدير "{deleteDialog.adminName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse gap-2">
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => handleDeleteAdmin(deleteDialog.adminId)}
            >
              حذف
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeleteDialog({ isOpen: false, adminId: null, adminName: "" })}>
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Admins_Accounts