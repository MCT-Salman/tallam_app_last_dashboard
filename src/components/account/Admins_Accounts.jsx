import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, Edit, Trash2, Eye, User, Mail, Phone, Calendar, Key, UserCheck, UserX } from "lucide-react"
import { createAdmin, getAdminsList, updateAdmin, deleteAdmin, toggleAdminStatus } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

const Admins_Accounts = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [admins, setAdmins] = useState([])
  
  // حالة النموذج
  const [form, setForm] = useState({
    phone: "",
    name: "",
    birthDate: "",
    sex: "ذكر",
    role: "ADMIN",
    username: "",
    email: "",
    password: ""
  })

  // حالات الدايلوج
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
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
      const res = await createAdmin(form)
      console.log("➕ Create admin response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast("تم إنشاء حساب المدير بنجاح")
        setForm({
          phone: "",
          name: "",
          birthDate: "",
          sex: "ذكر",
          role: "ADMIN",
          username: "",
          email: "",
          password: ""
        })
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

  // تبديل حالة المدير (تفعيل/تعطيل)
  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    try {
      const newStatus = !currentStatus
      const res = await toggleAdminStatus(adminId, newStatus)
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

  // فتح دايولوج عرض التفاصيل
  const openViewDialog = (admin) => {
    setSelectedAdmin(admin)
    setViewDialogOpen(true)
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
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  @{admin.username}
                </Badge>
                <Badge variant={admin.user?.isActive ? "default" : "secondary"} 
                       className={admin.user?.isActive ? "bg-green-600 text-xs" : "text-xs"}>
                  {admin.user?.isActive ? "نشط" : "معطل"}
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
              <span>{admin.user?.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>
                {admin.user?.createdAt ? new Date(admin.user.createdAt).toLocaleDateString('ar-SA') : '---'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openViewDialog(admin)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 ml-1" />
            التفاصيل
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleAdminStatus(admin.id, admin.user?.isActive)}
            className="flex-1"
          >
            {admin.user?.isActive ? <UserX className="w-4 h-4 ml-1" /> : <UserCheck className="w-4 h-4 ml-1" />}
            {admin.user?.isActive ? "تعطيل" : "تفعيل"}
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">إدارة حسابات المدراء</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            إدارة وتفعيل وتعطيل حسابات المدراء في النظام
          </p>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إضافة مدير جديد
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <User className="w-5 h-5" />
            قائمة المدراء ({admins.length})
          </CardTitle>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">اسم المستخدم</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">رقم الهاتف</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium text-right">
                          {admin.user?.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">@{admin.username}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{admin.email}</TableCell>
                        <TableCell className="text-right">{admin.user?.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant={admin.user?.isActive ? "default" : "secondary"} 
                                  className={admin.user?.isActive ? "bg-green-600" : ""}>
                              {admin.user?.isActive ? "نشط" : "معطل"}
                            </Badge>
                            <Switch
                              checked={admin.user?.isActive}
                              onCheckedChange={() => handleToggleAdminStatus(admin.id, admin.user?.isActive)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {admin.user?.createdAt ? new Date(admin.user.createdAt).toLocaleDateString('ar-SA') : '---'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewDialog(admin)}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              التفاصيل
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteDialog({
                                isOpen: true,
                                adminId: admin.id,
                                adminName: admin.user?.name
                              })}
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
                {admins.map((admin) => (
                  <AdminCard key={admin.id} admin={admin} />
                ))}
              </div>
            </>
          )}

          {admins.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد حسابات مدراء
            </div>
          )}
        </CardContent>
      </Card>

      {/* دايولوج عرض التفاصيل */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل المدير</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4 mt-2 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">الاسم الكامل:</Label>
                  <p className="mt-1">{selectedAdmin.user?.name}</p>
                </div>
                <div>
                  <Label className="font-medium">اسم المستخدم:</Label>
                  <p className="mt-1">@{selectedAdmin.username}</p>
                </div>
                <div>
                  <Label className="font-medium">البريد الإلكتروني:</Label>
                  <p className="mt-1">{selectedAdmin.email}</p>
                </div>
                <div>
                  <Label className="font-medium">رقم الهاتف:</Label>
                  <p className="mt-1">{selectedAdmin.user?.phone}</p>
                </div>
                <div>
                  <Label className="font-medium">الجنس:</Label>
                  <p className="mt-1">{selectedAdmin.user?.sex || '---'}</p>
                </div>
                <div>
                  <Label className="font-medium">الحالة:</Label>
                  <div className="mt-1">
                    <Badge variant={selectedAdmin.user?.isActive ? "default" : "secondary"} 
                          className={selectedAdmin.user?.isActive ? "bg-green-600" : ""}>
                      {selectedAdmin.user?.isActive ? "نشط" : "معطل"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="font-medium">تاريخ الميلاد:</Label>
                  <p className="mt-1">
                    {selectedAdmin.user?.birthDate ? new Date(selectedAdmin.user.birthDate).toLocaleDateString('ar-SA') : '---'}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">تاريخ الإنشاء:</Label>
                  <p className="mt-1">
                    {selectedAdmin.user?.createdAt ? new Date(selectedAdmin.user.createdAt).toLocaleDateString('ar-SA') : '---'}
                  </p>
                </div>
              </div>
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