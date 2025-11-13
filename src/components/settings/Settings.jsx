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
import { Save, Phone, MessageCircle, Settings, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Globe, Mail, Facebook, Instagram, MessageCircleIcon, Smartphone  } from "lucide-react"
import { getAllSettings, updateSetting, addSetting, updateAllSettings } from "@/api/api"
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

  // حالة إعدادات السوشال ميديا
  const [socialSettings, setSocialSettings] = useState({
    facebook: "",
    instagram: "",
    website: "",
    email: "",

  })
  
  // حالة جميع الإعدادات
  const [allSettings, setAllSettings] = useState([])
  const [newSetting, setNewSetting] = useState({ key: "", value: "" })

  // حالات الدايلوج
  const [addDialogOpen, setAddDialogOpen] = useState(false)

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
    'darkMode': 'الوضع الليلي',
    'allowdb': 'سماح قاعدة البيانات',
    'facebook': 'رابط فيسبوك',
    'instagram': 'رابط انستجرام',
    'website': 'الموقع الإلكتروني',
    'email': 'البريد الإلكتروني',
    'allowShowCount': 'سماح بعرض عدد المشتركين'
  }

  // الحصول على الاسم المعرب للمفتاح
  const getTranslatedKey = (key) => {
    return keyTranslations[key] || key;
  }

  // جلب جميع الإعدادات
  const fetchAllSettings = async () => {
    setLoading(true)
    try {
      const res = await getAllSettings()
      console.log(" All settings response:", res.data)
      
      if (res.data?.success) {
        const settings = res.data.data || []
        setAllSettings(settings)
        
        // استخراج إعدادات التواصل من جميع الإعدادات
        const whatsappSetting = settings.find(s => s.key === 'whatsapp')
        const telegramSetting = settings.find(s => s.key === 'telegram')
        
        setContactSettings({
          whatsapp: whatsappSetting?.value || "",
          telegram: telegramSetting?.value || ""
        })

        // استخراج إعدادات السوشال ميديا
        const facebookSetting = settings.find(s => s.key === 'facebook')
        const instagramSetting = settings.find(s => s.key === 'instagram')
        const websiteSetting = settings.find(s => s.key === 'website')
        const emailSetting = settings.find(s => s.key === 'email')
        
        setSocialSettings({
          facebook: facebookSetting?.value || "",
          instagram: instagramSetting?.value || "",
          website: websiteSetting?.value || "",
          email: emailSetting?.value || "",
        })
      }
    } catch (err) {
      console.error(" Error fetching all settings:", err)
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
        fetchAllSettings() // تحديث البيانات
      }
    } catch (err) {
      console.error("❌ Error saving contact settings:", err)
      showErrorToast(err?.response?.data?.message || "فشل حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  // حفظ إعدادات السوشال ميديا
  const handleSaveSocialSettings = async () => {
    setSaving(true)
    try {
      const data = {
        facebook: socialSettings.facebook,
        instagram: socialSettings.instagram,
        website: socialSettings.website,
        email: socialSettings.email,
      }
      
      const res = await updateAllSettings(data)
      console.log("💾 Save social settings response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast("تم حفظ إعدادات السوشال ميديا بنجاح")
        fetchAllSettings() // تحديث البيانات
      }
    } catch (err) {
      console.error(" Error saving social settings:", err)
      showErrorToast(err?.response?.data?.message || "فشل حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  // تحديث إعداد سوشال ميديا فردي
  const handleUpdateSocialSetting = async (key, value) => {
    try {
      const res = await updateSetting(key, value)
      console.log("🔄 Update social setting response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast(`تم تحديث ${getTranslatedKey(key)} بنجاح`)
        fetchAllSettings()
      }
    } catch (err) {
      console.error(" Error updating social setting:", err)
      showErrorToast(err?.response?.data?.message || "فشل تحديث الإعداد")
    }
  }

  // تفعيل/تعطيل إعداد
  const handleToggleSetting = async (key, currentValue) => {
    try {
      const newValue = !(currentValue === "true" || currentValue === true)
      const res = await updateSetting(key, newValue)
      console.log("🔄 Toggle setting response:", res.data)
      
      if (res.data?.success) {
        showSuccessToast(`تم ${newValue ? "تفعيل" : "تعطيل"} ${getTranslatedKey(key)} بنجاح`)
        fetchAllSettings()
      }
    } catch (err) {
      console.error("❌ Error toggling setting:", err)
      showErrorToast(err?.response?.data?.message || "فشل تحديث الإعداد")
    }
  }

  // إضافة إعداد جديد
  const handleAddSetting = async () => {
    if (!newSetting.key || !newSetting.value) {
      showErrorToast("يرجى ملء جميع الحقول")
      return
    }

    try {
      // تحويل القيمة إلى النوع المناسب
      const data = {
        key: newSetting.key,
        value: newSetting.value === "true" ? true : 
               newSetting.value === "false" ? false : newSetting.value
      }

      const res = await addSetting(data)
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

  // التعامل مع تغيير الحقول
  const handleContactChange = (field, value) => {
    setContactSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSocialChange = (field, value) => {
    setSocialSettings(prev => ({
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

  // الحصول على قيمة الإعداد للعرض
  const getDisplayValue = (setting) => {
    const value = setting.value;
    if (value === "true" || value === true) return "مفعل";
    if (value === "false" || value === false) return "معطل";
    return value;
  }

  // التحقق من إذا كان الإعداد مفعل
  const isSettingEnabled = (setting) => {
    const value = setting.value;
    return value === "true" || value === true;
  }

  // تحميل البيانات عند تغيير التبويب
  useEffect(() => {
    fetchAllSettings()
  }, [activeTab])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">الإعدادات</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contact" className="flex items-center gap-2 text-sm sm:text-base">
            <MessageCircle className="w-4 h-4" />
            إعدادات التواصل
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2 text-sm sm:text-base">
            <Globe className="w-4 h-4" />
            السوشال ميديا
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
                      onClick={fetchAllSettings}
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

        {/* إعدادات السوشال ميديا */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right text-lg sm:text-xl">
                <Globe className="w-5 h-5" />
                إعدادات السوشال ميديا
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
                    {/* فيسبوك */}
                    <div className="space-y-3 text-right">
                      <div className="flex flex-wrap items-center gap-2 justify-start">
                        <Label htmlFor="facebook" className="text-base font-medium">
                          رابط فيسبوك
                        </Label>
                        <Facebook className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="relative">
                        <Input
                          id="facebook"
                          dir="ltr"
                          value={socialSettings.facebook}
                          onChange={(e) => handleSocialChange("facebook", e.target.value)}
                          placeholder="https://facebook.com/username"
                          className="pr-4 text-right text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateSocialSetting("facebook", socialSettings.facebook)}
                          disabled={saving}
                          size="sm"
                          variant="outline"
                        >
                          حفظ
                        </Button>
                      </div>
                    </div>

                    {/* انستجرام */}
                    <div className="space-y-3 text-right">
                      <div className="flex flex-wrap items-center gap-2 justify-start">
                        <Label htmlFor="instagram" className="text-base font-medium">
                          رابط انستجرام
                        </Label>
                        <Instagram className="w-4 h-4 text-pink-600" />
                      </div>
                      <div className="relative">
                        <Input
                          id="instagram"
                          dir="ltr"
                          value={socialSettings.instagram}
                          onChange={(e) => handleSocialChange("instagram", e.target.value)}
                          placeholder="https://instagram.com/username"
                          className="pr-4 text-right text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateSocialSetting("instagram", socialSettings.instagram)}
                          disabled={saving}
                          size="sm"
                          variant="outline"
                        >
                          حفظ
                        </Button>
                      </div>
                    </div>

                    {/* الموقع الإلكتروني */}
                    <div className="space-y-3 text-right">
                      <div className="flex flex-wrap items-center gap-2 justify-start">
                        <Label htmlFor="website" className="text-base font-medium">
                          الموقع الإلكتروني
                        </Label>
                        <Globe className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="relative">
                        <Input
                          id="website"
                          dir="ltr"
                          value={socialSettings.website}
                          onChange={(e) => handleSocialChange("website", e.target.value)}
                          placeholder="https://example.com"
                          className="pr-4 text-right text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateSocialSetting("website", socialSettings.website)}
                          disabled={saving}
                          size="sm"
                          variant="outline"
                        >
                          حفظ
                        </Button>
                      </div>
                    </div>

                    {/* البريد الإلكتروني */}
                    <div className="space-y-3 text-right">
                      <div className="flex flex-wrap items-center gap-2 justify-start">
                        <Label htmlFor="email" className="text-base font-medium">
                          البريد الإلكتروني
                        </Label>
                        <Mail className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="relative">
                        <Input
                          id="email"
                          dir="ltr"
                          value={socialSettings.email}
                          onChange={(e) => handleSocialChange("email", e.target.value)}
                          placeholder="email@example.com"
                          className="pr-4 text-right text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateSocialSetting("email", socialSettings.email)}
                          disabled={saving}
                          size="sm"
                          variant="outline"
                        >
                          حفظ
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* أزرار الحفظ */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-start">
                    <Button
                      variant="outline"
                      onClick={fetchAllSettings}
                      disabled={saving}
                      className="flex-1 sm:flex-none"
                    >
                      إعادة تحميل
                    </Button>
                    <Button
                      onClick={handleSaveSocialSettings}
                      disabled={saving}
                      className="flex-1 sm:flex-none flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "جاري الحفظ..." : "حفظ الكل"}
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
                    <Button className="flex-1 sm:flex-none">
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
                  onClick={fetchAllSettings}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  {loading ? "جاري التحميل..." : "تحديث"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {allSettings.filter(setting => 
                    !['whatsapp', 'telegram', 'facebook', 'instagram', 'website', 'email'].includes(setting.key)
                  ).map((setting) => (
                    <Card key={setting.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right">
                          <h3 className="font-bold text-lg">
                            {getTranslatedKey(setting.key)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            القيمة: {getDisplayValue(setting)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            آخر تحديث: {setting.updatedAt ? new Date(setting.updatedAt).toLocaleDateString('ar-EG') : '---'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {isSettingEnabled(setting) ? (
                              <Badge variant="default" className="bg-green-600">
                                مفعل
                              </Badge>
                            ) : (
                              <Badge variant="secondary">معطل</Badge>
                            )}
                            <Switch
                              checked={isSettingEnabled(setting)}
                              onCheckedChange={() => handleToggleSetting(setting.key, setting.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {allSettings.filter(setting => 
                !['whatsapp', 'telegram', 'facebook', 'instagram', 'website', 'email'].includes(setting.key)
              ).length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد إعدادات عامة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsComp