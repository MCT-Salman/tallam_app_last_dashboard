import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { showErrorToast, showSuccessToast } from "@/hooks/useToastMessages"
import { BASE_URL, createMobileVersion, deleteMobileVersion, getMobileVersionById, getMobileVersions, updateMobileVersion } from "@/api/api"

const MobileVersions = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [versions, setVersions] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [mandatoryFilter, setMandatoryFilter] = useState("all")
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: "" })
  const [selected, setSelected] = useState(null)

  const emptyForm = { platform: "android", versionCode: "", versionName: "", isMandatory: false, releaseNotes: "", downloadUrl: "" }
  const [form, setForm] = useState(emptyForm)

  // دالة لتوليد الرقم التالي تلقائياً
  const getNextVersionCode = () => {
    if (versions.length === 0) return "1"

    const codes = versions
      .filter(v => v.platform === form.platform)
      .map(v => {
        const code = parseInt(v.versionCode)
        return isNaN(code) ? 0 : code
      })

    if (codes.length === 0) return "1"

    const maxCode = Math.max(...codes)
    return String(maxCode + 1)
  }

  // دالة لتنسيق رقم الإصدار تلقائياً
const formatVersionName = (value) => {
  // السماح فقط بالأرقام والنقاط
  let cleaned = value.replace(/[^\d.]/g, '')
  
  // منع أكثر من نقطتين متتاليتين
  cleaned = cleaned.replace(/\.{2,}/g, '.')
  
  // منع النقطة في البداية
  if (cleaned.startsWith('.')) {
    cleaned = cleaned.substring(1)
  }
  
  // منع أكثر من 3 أجزاء (مثل 1.2.3.4)
  const parts = cleaned.split('.')
  if (parts.length > 3) {
    cleaned = parts.slice(0, 3).join('.')
  }
  
  return cleaned
}

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await getMobileVersions()
      let data = []
      if (Array.isArray(res?.data?.data?.items)) data = res.data.data.items
      else if (Array.isArray(res?.data?.data?.data)) data = res.data.data.data
      else if (Array.isArray(res?.data?.data)) data = res.data.data
      else if (Array.isArray(res?.data)) data = res.data
      setVersions(data || [])
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تحميل الإصدارات")
      setVersions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    let result = [...versions]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(v =>
        v.versionName?.toLowerCase().includes(term) ||
        v.versionCode?.toString().includes(term) ||
        v.platform?.toLowerCase().includes(term)
      )
    }

    if (platformFilter !== "all") {
      result = result.filter(v => (v.platform || "").toLowerCase() === platformFilter)
    }

    if (mandatoryFilter !== "all") {
      const flag = mandatoryFilter === "mandatory"
      result = result.filter(v => Boolean(v.isMandatory) === flag)
    }

    return result
  }, [versions, searchTerm, platformFilter, mandatoryFilter])

  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  useEffect(() => { setCurrentPage(1) }, [searchTerm, platformFilter, mandatoryFilter, itemsPerPage])

  const resetForm = () => setForm(emptyForm)

  const handleCreate = async () => {
    if (!form.platform || !form.versionCode || !form.versionName) {
      showErrorToast("يرجى ملء الحقول المطلوبة")
      return
    }
    setSaving(true)
    try {
      const payload = {
        platform: form.platform,
        versionCode: isNaN(Number(form.versionCode)) ? form.versionCode : String(form.versionCode),
        versionName: form.versionName,
        isMandatory: !!form.isMandatory,
        releaseNotes: form.releaseNotes || "",
        downloadUrl: form.downloadUrl || ""
      }
      const res = await createMobileVersion(payload)
      if (res.data?.success) {
        showSuccessToast("تم إنشاء الإصدار بنجاح")
        setAddDialogOpen(false)
        resetForm()
        fetchAll()
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل إنشاء الإصدار")
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      platform: item.platform || "android",
      versionCode: String(item.versionCode ?? ""),
      versionName: item.versionName || "",
      isMandatory: !!item.isMandatory,
      releaseNotes: item.releaseNotes || "",
      downloadUrl: item.downloadUrl || ""
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selected) return
    if (!form.platform || !form.versionCode || !form.versionName) {
      showErrorToast("يرجى ملء الحقول المطلوبة")
      return
    }
    setSaving(true)
    try {
      const payload = {
        platform: form.platform,
        versionCode: isNaN(Number(form.versionCode)) ? form.versionCode : String(form.versionCode),
        versionName: form.versionName,
        isMandatory: !!form.isMandatory,
        releaseNotes: form.releaseNotes || "",
        downloadUrl: form.downloadUrl || ""
      }
      const res = await updateMobileVersion(selected.id, payload)
      if (res.data?.success) {
        showSuccessToast("تم تحديث الإصدار بنجاح")
        setEditDialogOpen(false)
        setVersions(prev => prev.map(v => v.id === selected.id ? { ...v, ...payload } : v))
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تحديث الإصدار")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await deleteMobileVersion(id)
      if (res.data?.success) {
        showSuccessToast("تم حذف الإصدار بنجاح")
        setDeleteDialog({ isOpen: false, id: null, name: "" })
        fetchAll()
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل حذف الإصدار")
    }
  }

  const openView = async (item) => {
    try {
      const res = await getMobileVersionById(item.id)
      const details = res?.data?.data || item
      setSelected(details)
      setViewDialogOpen(true)
    } catch {
      setSelected(item)
      setViewDialogOpen(true)
    }
  }

  const formatDate = (d) => {
    if (!d) return "-"
    try { return new Date(d).toLocaleDateString('en-US') } catch { return String(d) }
  }

  const handleDownload = (url) => {
    if (!url) {
      showErrorToast("لا يوجد رابط تحميل")
      return
    }
    const finalUrl = url.startsWith('/') ? `${BASE_URL}${url}` : url
    window.open(finalUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  useEffect(() => {
    if (addDialogOpen) {
      // عند فتح dialog الإضافة، توليد الرقم التالي تلقائياً
      const nextCode = getNextVersionCode()
      setForm(prev => ({
        ...prev,
        versionCode: nextCode,
        versionName: "" // مسح رقم الإصدار ليتم تعبئته يدوياً
      }))
    }
  }, [addDialogOpen, versions, form.platform])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">إدارة إصدارات التطبيق ({versions.length})</CardTitle>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  إضافة إصدار
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle className="text-right">إضافة إصدار</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2 text-right">
                  <div className="space-y-2">
                    <label className="text-sm">المنصة</label>
                    <Select value={form.platform} onValueChange={(v) => setForm(prev => ({ ...prev, platform: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المنصة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="android">Android</SelectItem>
                        <SelectItem value="ios">iOS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">ترتيب الإصدار</label>
                    <Input value={form.versionCode} onChange={(e) => setForm(prev => ({ ...prev, versionCode: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">رقم الإصدار </label>
                    <Input
                      value={form.versionName}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        versionName: formatVersionName(e.target.value)
                      }))}
                      placeholder="مثال: 1.0.0"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={!!form.isMandatory} onCheckedChange={(v) => setForm(prev => ({ ...prev, isMandatory: v }))} />
                    <span>تحديث إجباري</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">ملاحظات الإصدار</label>
                    <Input value={form.releaseNotes} onChange={(e) => setForm(prev => ({ ...prev, releaseNotes: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">رابط التحميل</label>
                    <Input dir="ltr" value={form.downloadUrl} onChange={(e) => setForm(prev => ({ ...prev, downloadUrl: e.target.value }))} />
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full">
                    {saving ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-[520px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالنسخة أو المنصة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="المنصة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المنصات</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={mandatoryFilter} onValueChange={setMandatoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الإلزام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="mandatory">إجباري</SelectItem>
                  <SelectItem value="optional">اختياري</SelectItem>
                </SelectContent>
              </Select>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="عدد العناصر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 عناصر</SelectItem>
                  <SelectItem value="10">10 عناصر</SelectItem>
                  <SelectItem value="20">20 عنصر</SelectItem>
                  <SelectItem value="50">50 عنصر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table className="direction-rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنصة</TableHead>
                      <TableHead>ترتيب الإصدار</TableHead>
                      <TableHead>رقم الإصدار </TableHead>
                      <TableHead>إجباري</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length ? paginated.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.platform}</TableCell>
                        <TableCell>{v.versionCode}</TableCell>
                        <TableCell>{v.versionName}</TableCell>
                        <TableCell>
                          {v.isMandatory ? (
                            <Badge className="bg-red-600">إجباري</Badge>
                          ) : (
                            <Badge variant="secondary">اختياري</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(v.createdAt)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDownload(v.downloadUrl)}
                            title="تحميل"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openView(v)} title="عرض">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(v)} title="تعديل">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" title="حذف" onClick={() => setDeleteDialog({ isOpen: true, id: v.id, name: v.versionName })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          {filtered.length === 0 ? "لا توجد إصدارات" : "لا توجد عناصر في هذه الصفحة"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {paginated.length ? paginated.map((v) => (
                  <div key={v.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{v.platform} - {v.versionName}</h3>
                        <p className="text-sm text-muted-foreground">Code: {v.versionCode}</p>
                      </div>
                      {v.isMandatory ? (
                        <Badge className="bg-red-600">إجباري</Badge>
                      ) : (
                        <Badge variant="secondary">اختياري</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => openView(v)}>عرض</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(v.downloadUrl)}>تحميل</Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(v)}>تعديل</Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteDialog({ isOpen: true, id: v.id, name: v.versionName })}>حذف</Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    {filtered.length === 0 ? "لا توجد إصدارات" : "لا توجد عناصر في هذه الصفحة"}
                  </div>
                )}
              </div>
            </>
          )}

          {totalItems > 0 && (
            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                عرض {startItem} إلى {endItem} من {totalItems} إصدار
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page = i + Math.max(1, Math.min(currentPage - 2, totalPages - 4))
                  return (
                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)} className="w-9">
                      {page}
                    </Button>
                  )
                })}
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-right text-xl font-bold text-gray-900">تفاصيل الإصدار</DialogTitle>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 mt-4 text-right">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">المنصة:</span>
                <span className="font-bold text-blue-600 text-lg">{selected.platform}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">رقم الإصدار :</span>
                <span className="font-bold text-purple-600">{selected.versionName}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">ترتيب الإصدار:</span>
                <span className="font-medium" dir="ltr">{selected.versionCode}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">إجباري:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${selected.isMandatory ? "bg-red-100 text-red-800 border border-red-200" : "bg-green-100 text-green-800 border border-green-200"}`}>
                  {selected.isMandatory ? "نعم" : "لا"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">تاريخ الإنشاء:</span>
                <span className="font-medium text-orange-600 bg-white px-3 py-1 rounded-md border border-orange-200">{formatDate(selected.createdAt)}</span>
              </div>
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600">ملاحظات الإصدار:</div>
                <div className="bg-white p-3 rounded-md border border-gray-300 text-right break-words">{selected.releaseNotes || "-"}</div>
              </div>
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600">رابط التحميل:</div>
                <div className="bg-white p-3 rounded-md border border-gray-300 text-left break-words" dir="ltr">{selected.downloadUrl || "-"}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
              e.preventDefault();
              handleUpdate();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-right">تعديل الإصدار</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-right">
            <div className="space-y-2">
              <label className="text-sm">المنصة</label>
              <Select value={form.platform} onValueChange={(v) => setForm(prev => ({ ...prev, platform: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنصة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="android">Android</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">ترتيب الإصدار</label>
              <Input value={form.versionCode} onChange={(e) => setForm(prev => ({ ...prev, versionCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">رقم الإصدار </label>
              <Input
                value={form.versionName}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  versionName: formatVersionName(e.target.value)
                }))}
                placeholder="مثال: 1.0.0"
                dir="ltr"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={!!form.isMandatory} onCheckedChange={(v) => setForm(prev => ({ ...prev, isMandatory: v }))} />
              <span>تحديث إجباري</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm">ملاحظات الإصدار</label>
              <Input value={form.releaseNotes} onChange={(e) => setForm(prev => ({ ...prev, releaseNotes: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">رابط التحميل</label>
              <Input dir="ltr" value={form.downloadUrl} onChange={(e) => setForm(prev => ({ ...prev, downloadUrl: e.target.value }))} />
            </div>
            <Button onClick={handleUpdate} disabled={saving} className="w-full">
              {saving ? "جاري التحديث..." : "تحديث"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent className="text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">هل أنت متأكد من حذف "{deleteDialog.name}"؟</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse gap-2">
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDelete(deleteDialog.id)}>
              حذف
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeleteDialog({ isOpen: false, id: null, name: "" })}>
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MobileVersions
