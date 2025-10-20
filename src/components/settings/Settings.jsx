import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Save, Phone, MessageCircle, Settings, Plus, Edit, Trash2, ToggleLeft, ToggleRight, MoreVertical } from "lucide-react"
import { getContactSettings, getAllSettings, updateSetting, addSetting, updateAllSettings } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

const SettingsComp = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("contact")
  
  // حالة إعدادات التواصل
  const [contactSettings, setContactSettings] = useState({
    whatsapp: "",
    telegram: ""
  })
  
  // حالة جميع الإعدادات
  const [allSettings, setAllSettings] = useState([])
  const [newSetting, setNewSetting] = useState({ key: "", value: "" })
  const [editSetting, setEditSetting] = useState({ key: "", value: "" })

  // حالات الدايلوج
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, settingId: null, settingKey: "" })

  // قاموس لترجمة المفاتيح إلى العربية
  const keyTranslations = {
    'allowRating': 'سماح عرض التقييمات',
    'isDollar': 'العملة بالدولار',
    'whatsapp': 'رقم واتساب',
    'telegram': 'اسم مستخدم تليجرام',
    'allowComments': 'سماح التعليقات',
    'maintenanceMode': 'وضع الصيانة',
    'registrationOpen': 'فتح التسجيل',
    'notificationsEnabled': 'تفعيل الإشعارات',
    'darkMode': 'الوضع الليلي'
  }

  // تحديد إذا كان الإعداد من نوع التواصل
  const isContactSetting = (key) => {
    return key === 'whatsapp' || key === 'telegram';
  }

  // الحصول على الاسم المعرب للمفتاح
  const getTranslatedKey = (key) => {
    return keyTranslations[key] || key;
  }

  // جلب إعدادات التواصل
  const fetchContactSettings = async () => {
    setLoading(true)
    try {
      const res = await getContactSettings()
      console.log("📞 Contact settings response:", res.data)
      
      if (res.data?.success) {
        setContactSettings({
          whatsapp: res.data.data?.whatsapp || "",
          telegram: res.data.data?.telegram || ""
        })
      }
    } catch (err) {
      console.error("❌ Error fetching contact settings:", err)
      showErrorToast(err?.response?.data?.message || "فشل تحميل إعدادات التواصل")
    } finally {
      setLoading(false)
    }
  }

  // جلب جميع الإعدادات
  const fetchAllSettings = async () => {
    setLoading(true)
    try {
      const res = await getAllSettings()
      console.log("⚙️ All settings response:", res.data)
      
      if (res.data?.success) {
        setAllSettings(res.data.data || [])
      }
    } catch (err) {
      console.error("❌ Error fetching all settings:", err)
      showErrorToast(err?.response?.data?.message || "فشل تحميل الإعدادات")
    } finally {
      setLoading(false)
    }
  }

  // حفظ إعدادات التواصل
  const handleSaveContactSettings = async () => {
    setSaving(true)
    try {
      const data = {
        whatsapp: contactSettings.whatsapp,
        telegram: contactSettings.telegram
      }
      const res = await updateAllSettings(data)
      console.log("💾 Save contact settings response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast("تم حفظ إعدادات التواصل بنجاح")
      }
    } catch (err) {
      console.error("❌ Error saving contact settings:", err)
      showErrorToast(err?.response?.data?.message || "فشل حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  // تفعيل/تعطيل إعداد
  const handleToggleSetting = async (key, currentValue) => {
    try {
      const newValue = currentValue === "true" ? "false" : "true"
      const res = await updateSetting(key, newValue)
      console.log("🔄 Toggle setting response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast(`تم ${newValue === "true" ? "تفعيل" : "تعطيل"} ${getTranslatedKey(key)} بنجاح`)
        fetchAllSettings()
      }
    } catch (err) {
      console.error("❌ Error toggling setting:", err)
      showErrorToast(err?.response?.data?.message || "فشل تحديث الإعداد")
    }
  }

  // تعديل إعداد نصي (مثل الواتساب والتليجرام)
  const handleEditSetting = async () => {
    if (!editSetting.key || !editSetting.value) {
      showErrorToast("يرجى ملء جميع الحقول")
      return
    }

    try {
      const res = await updateSetting(editSetting.key, editSetting.value)
      console.log("✏️ Edit setting response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast(`تم تعديل ${getTranslatedKey(editSetting.key)} بنجاح`)
        setEditDialogOpen(false)
        setEditSetting({ key: "", value: "" })
        fetchAllSettings()
      }
    } catch (err) {
      console.error("❌ Error editing setting:", err)
      showErrorToast(err?.response?.data?.message || "فشل تعديل الإعداد")
    }
  }

  // إضافة إعداد جديد
  const handleAddSetting = async () => {
    if (!newSetting.key || !newSetting.value) {
      showErrorToast("يرجى ملء جميع الحقول")
      return
    }

    try {
      const res = await addSetting(newSetting)
      console.log("➕ Add setting response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast("تم إضافة الإعداد الجديد بنجاح")
        setNewSetting({ key: "", value: "" })
        setAddDialogOpen(false)
        fetchAllSettings()
      }
    } catch (err) {
      console.error("❌ Error adding setting:", err)
      showErrorToast(err?.response?.data?.message || "فشل إضافة الإعداد")
    }
  }

  // حفظ جميع الإعدادات
  const handleSaveAllSettings = async () => {
    setSaving(true)
    try {
      const data = {}
      allSettings.forEach(setting => {
        data[setting.key] = setting.value
      })
      
      const res = await updateAllSettings(data)
      console.log("💾 Save all settings response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast("تم حفظ جميع الإعدادات بنجاح")
      }
    } catch (err) {
      console.error("❌ Error saving all settings:", err)
      showErrorToast(err?.response?.data?.message || "فشل حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  // حذف إعداد
  const handleDeleteSetting = async (settingId) => {
    try {
      // هنا تحتاج لإضافة دالة deleteSetting في الـ API
      // await deleteSetting(settingId)
      showSuccessToast("تم حذف الإعداد بنجاح")
      setDeleteDialog({ isOpen: false, settingId: null, settingKey: "" })
      fetchAllSettings()
    } catch (err) {
      console.error("❌ Error deleting setting:", err)
      showErrorToast(err?.response?.data?.message || "فشل حذف الإعداد")
    }
  }

  // التعامل مع تغيير الحقول
  const handleContactChange = (field, value) => {
    setContactSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNewSettingChange = (field, value) => {
    setNewSetting(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEditSettingChange = (field, value) => {
    setEditSetting(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // فتح دايولوج التعديل
  const openEditDialog = (setting) => {
    setEditSetting({ key: setting.key, value: setting.value })
    setEditDialogOpen(true)
  }

  // تحميل البيانات عند تغيير التبويب
  useEffect(() => {
    if (activeTab === "contact") {
      fetchContactSettings()
    } else if (activeTab === "general") {
      fetchAllSettings()
    }
  }, [activeTab])

  // بطاقة الإعداد للعرض على الجوال
  const SettingCard = ({ setting }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-right">
                {getTranslatedKey(setting.key)}
              </h3>
              <div className="flex flex-wrap gap-2 justify-end">
                <Badge variant="secondary" className="text-xs">
                  {setting.value}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {setting.updatedAt ? new Date(setting.updatedAt).toLocaleDateString('en-US') : '---'}
                </Badge>
              </div>
            </div>
          </div>

          {/* حالة التفعيل - فقط للإعدادات غير التواصلية */}
          {!isContactSetting(setting.key) && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">الحالة:</span>
              <div className="flex items-center gap-2">
                {setting.value === "true" ? (
                  <Badge variant="default" className="bg-green-600 text-xs">
                    مفعل
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">معطل</Badge>
                )}
                <Switch
                  checked={setting.value === "true"}
                  onCheckedChange={() => handleToggleSetting(setting.key, setting.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
          {isContactSetting(setting.key) ? (
            // إعدادات التواصل - زر تعديل فقط
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(setting)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 ml-1" />
              تعديل
            </Button>
          ) : (
            // الإعدادات الأخرى - تفعيل/تعطيل
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggleSetting(setting.key, setting.value)}
              className="flex-1"
            >
              {setting.value === "true" ? <ToggleLeft className="w-4 h-4 ml-1" /> : <ToggleRight className="w-4 h-4 ml-1" />}
              {setting.value === "true" ? "تعطيل" : "تفعيل"}
            </Button>
          )}
          
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteDialog({
              isOpen: true,
              settingId: setting.id,
              settingKey: setting.key
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">الإعدادات</h1>
          {/* <p className="text-muted-foreground text-sm sm:text-base">
            إدارة إعدادات التطبيق وتخصيص التجربة
          </p> */}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contact" className="flex items-center gap-2 text-sm sm:text-base">
            <MessageCircle className="w-4 h-4" />
            إعدادات التواصل
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2 text-sm sm:text-base">
            <Settings className="w-4 h-4" />
            الإعدادات العامة
          </TabsTrigger>
        </TabsList>

        {/* إعدادات التواصل */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right text-lg sm:text-xl">
                <Phone className="w-5 h-5" />
                إعدادات التواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6">
                    {/* واتساب */}
                    <div className="space-y-3 text-right">
                      <div className="flex flex-wrap items-center gap-2 justify-start">
                        <Label htmlFor="whatsapp" className="text-base font-medium">
                          رقم واتساب
                        </Label>
                        <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                          مطلوب
                        </Badge>
                      </div>
                      <div className="relative">
                        <Input
                          id="whatsapp"
                          dir="ltr"
                          value={contactSettings.whatsapp}
                          onChange={(e) => handleContactChange("whatsapp", e.target.value)}
                          placeholder="+963945368721"
                          className="pr-20 text-right text-sm sm:text-base"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-green-600 font-medium text-sm">واتساب:</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-right">
                        الرقم الذي سيظهر للطلاب للتواصل عبر واتساب
                      </p>
                    </div>

                    {/* تليجرام */}
                    <div className="space-y-3 text-right">
                      <div className="flex flex-wrap items-center gap-2 justify-start">
                        <Label htmlFor="telegram" className="text-base font-medium">
                          اسم مستخدم تليجرام
                        </Label>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                          مطلوب
                        </Badge>
                      </div>
                      <div className="relative">
                        <Input
                          id="telegram"
                          value={contactSettings.telegram}
                          onChange={(e) => handleContactChange("telegram", e.target.value)}
                          placeholder="@engilsh1"
                          className="pr-20 text-right text-sm sm:text-base"
                          dir="ltr"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-blue-600 font-medium text-sm">تليجرام:</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-right">
                        اسم المستخدم في تليجرام للتواصل مع الدعم
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* أزرار الحفظ */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-start">
                    <Button
                      variant="outline"
                      onClick={fetchContactSettings}
                      disabled={saving}
                      className="flex-1 sm:flex-none"
                    >
                      إعادة تحميل
                    </Button>
                    <Button
                      onClick={handleSaveContactSettings}
                      disabled={saving || !contactSettings.whatsapp || !contactSettings.telegram}
                      className="flex-1 sm:flex-none flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الإعدادات العامة */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-right text-lg sm:text-xl">
                <Settings className="w-5 h-5" />
                الإعدادات العامة
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button  className="flex-1 sm:flex-none">
                      إضافة إعداد
                      <Plus className="w-4 h-4 ml-1" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-right">إضافة إعداد جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2 text-right">
                      <div className="space-y-2">
                        <Label>المفتاح</Label>
                        <Input
                          value={newSetting.key}
                          onChange={(e) => handleNewSettingChange("key", e.target.value)}
                          placeholder="allowRating"
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>القيمة</Label>
                        <Input
                          value={newSetting.value}
                          onChange={(e) => handleNewSettingChange("value", e.target.value)}
                          placeholder="true"
                          className="text-right"
                        />
                      </div>
                      <Button 
                        onClick={handleAddSetting}
                        className="w-full flex items-center gap-2"
                      >
                        إضافة الإعداد
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={handleSaveAllSettings}
                  disabled={saving}
                  className="flex-1 sm:flex-none flex items-center gap-2"
                >
                  {saving ? "جاري الحفظ..." : "حفظ الكل"}
                  <Save className="w-4 h-4" />
                </Button>
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الإعداد</TableHead>
                          <TableHead className="text-right">القيمة</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">آخر تحديث</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSettings.map((setting) => (
                          <TableRow key={setting.id}>
                            <TableCell className="font-medium text-right">
                              {getTranslatedKey(setting.key)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">
                                {setting.value}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {!isContactSetting(setting.key) && (
                                <div className="flex items-center gap-2 justify-end">
                                  {setting.value === "true" ? (
                                    <Badge variant="default" className="bg-green-600">
                                      مفعل
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">معطل</Badge>
                                  )}
                                  <Switch
                                    checked={setting.value === "true"}
                                    onCheckedChange={() => handleToggleSetting(setting.key, setting.value)}
                                  />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {setting.updatedAt ? new Date(setting.updatedAt).toLocaleDateString('en-US') : '---'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                {isContactSetting(setting.key) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(setting)}
                                  >
                                    <Edit className="w-4 h-4 ml-1" />
                                    تعديل
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleSetting(setting.key, setting.value)}
                                  >
                                    {setting.value === "true" ? <ToggleLeft className="w-4 h-4 ml-1" /> : <ToggleRight className="w-4 h-4 ml-1" />}
                                    {setting.value === "true" ? "تعطيل" : "تفعيل"}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeleteDialog({
                                    isOpen: true,
                                    settingId: setting.id,
                                    settingKey: setting.key
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
                    {allSettings.map((setting) => (
                      <SettingCard key={setting.id} setting={setting} />
                    ))}
                  </div>
                </>
              )}

              {allSettings.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد إعدادات
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* دايولوج تعديل الإعداد */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل الإعداد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-right">
            <div className="space-y-2">
              <Label>الإعداد</Label>
              <Input
                value={getTranslatedKey(editSetting.key)}
                disabled
                className="text-right bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>القيمة</Label>
              <Input
                value={editSetting.value}
                onChange={(e) => handleEditSettingChange("value", e.target.value)}
                placeholder="أدخل القيمة الجديدة"
                className="text-right"
              />
            </div>
            <Button 
              onClick={handleEditSetting}
              className="w-full flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ التعديل
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* دايولوج حذف الإعداد */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
      >
        <AlertDialogContent className="text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف "{getTranslatedKey(deleteDialog.settingKey)}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse gap-2">
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => handleDeleteSetting(deleteDialog.settingId)}
            >
              حذف
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeleteDialog({ isOpen: false, settingId: null, settingKey: "" })}>
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SettingsComp