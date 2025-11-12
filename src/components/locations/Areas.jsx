import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Search, Eye, Play, Pause, ChevronRight, ChevronLeft } from "lucide-react"
import { createArea, deleteArea, getAreas, getCities, updateArea } from "@/api/api"
import { showErrorToast, showSuccessToast } from "@/hooks/useToastMessages"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const Areas = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [areas, setAreas] = useState([])
  const [cities, setCities] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: "" })
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const [form, setForm] = useState({ name: "", cityId: "" })
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [areasRes, citiesRes] = await Promise.all([getAreas(), getCities()])
      setAreas(areasRes.data?.data || [])
      setCities(citiesRes.data?.data || [])
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تحميل المناطق/المدن")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    let list = [...areas]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      list = list.filter(a =>
        a.name?.toLowerCase().includes(term) ||
        a.city?.name?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== "all") {
      const shouldBeActive = statusFilter === "active"
      list = list.filter(area => (area.isActive ?? true) === shouldBeActive)
    }

    return list
  }, [areas, searchTerm, statusFilter])

  const paginatedAreas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, itemsPerPage, statusFilter])

  const resetForm = () => setForm({ name: "", cityId: "" })

  const handleCreate = async () => {
    if (!form.name.trim() || !form.cityId) {
      showErrorToast("يرجى إدخال الاسم واختيار المدينة")
      return
    }
    setSaving(true)
    try {
      const res = await createArea({ name: form.name.trim(), cityId: Number(form.cityId) })
      if (res.data?.success) {
        showSuccessToast("تم إنشاء المنطقة بنجاح")
        // setAddDialogOpen(false)
        // resetForm()

        fetchAll()
         setForm(prev => ({
          name: "",
          cityId: prev.cityId
        }));
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل إنشاء المنطقة")
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (area) => {
    setSelected(area)
    setForm({ name: area.name || "", cityId: String(area.cityId || area.city?.id || "") })
    setEditDialogOpen(true)
  }
  const openView = (area) => {
    setSelected(area)
    setViewDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selected) return
    if (!form.name.trim() || !form.cityId) {
      showErrorToast("يرجى إدخال الاسم واختيار المدينة")
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        cityId: Number(form.cityId),
        isActive: selected?.isActive ?? true
      }
      const res = await updateArea(selected.id, payload)
      if (res.data?.success) {
        showSuccessToast("تم تحديث المنطقة بنجاح")
        setEditDialogOpen(false)
        resetForm()
        const updatedCity = cities.find(c => c.id === Number(form.cityId))
        setAreas(prev => prev.map(area =>
          area.id === selected.id
            ? {
              ...area,
              name: form.name.trim(),
              cityId: Number(form.cityId),
              isActive: selected?.isActive ?? true,
              city: updatedCity ? { ...updatedCity } : area.city
            }
            : area
        ))
        setSelected(prev => prev ? { ...prev, name: form.name.trim(), cityId: Number(form.cityId), isActive: selected?.isActive ?? true, city: updatedCity ? { ...updatedCity } : prev.city } : prev)
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تحديث المنطقة")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await deleteArea(id)
      if (res.data?.success) {
        showSuccessToast("تم حذف المنطقة بنجاح")
        setDeleteDialog({ isOpen: false, id: null, name: "" })
        fetchAll()
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل حذف المنطقة")
    }
  }

    //  useEffect لتصفير البيانات عند إغلاق الدايلوج
  useEffect(() => {
    if (!addDialogOpen) {
      resetForm();
    }
  }, [addDialogOpen]);

  useEffect(() => {
    if (!editDialogOpen) {
      resetForm(); // تصفير البيانات عند الإغلاق
      setSelected(null); // إزالة العنصر المحدد
    }
  }, [editDialogOpen]);

  const handleToggleActive = async (area) => {
    try {
      const newStatus = !(area.isActive ?? true)
      const payload = {
        name: area.name,
        cityId: area.cityId || area.city?.id,
        isActive: newStatus
      }
      const res = await updateArea(area.id, payload)
      if (res.data?.success) {
        showSuccessToast(`تم ${newStatus ? "تفعيل" : "تعطيل"} المنطقة بنجاح`)
        setAreas(prev => prev.map(item =>
          item.id === area.id ? { ...item, isActive: newStatus } : item
        ))
        if (selected?.id === area.id) {
          setSelected(prev => prev ? { ...prev, isActive: newStatus } : prev)
        }
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تغيير حالة المنطقة")
    }
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const renderPagination = () => {
    if (totalItems === 0) return null

    const maxButtons = 5
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, startPage + maxButtons - 1)

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1)
    }

    const pages = []
    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(page)}
          className="w-9"
        >
          {page}
        </Button>
      )
    }

    return (
      <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          عرض {startItem} إلى {endItem} من {totalItems} منطقة
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {pages}
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
    )
  }

  const AreaCard = ({ area }) => (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">{area.name}</h3>
          <p className="text-sm text-muted-foreground">{area.city?.name || "-"}</p>
        </div>
        {(area.isActive ?? true) ? (
          <Badge className="bg-green-600">نشط</Badge>
        ) : (
          <Badge variant="secondary">معطل</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => openView(area)}>
          عرض
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggleActive(area)}
        >
          {(area.isActive ?? true) ? "تعطيل" : "تفعيل"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => openEdit(area)}>
          تعديل
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialog({ isOpen: true, id: area.id, name: area.name })}
        >
          حذف
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">إدارة المناطق ({areas.length})</CardTitle>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  إضافة منطقة
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
                  <DialogTitle className="text-right">إضافة منطقة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2 text-right">
                  <div className="space-y-2">
                    <label className="text-sm">المدينة</label>
                    <Select value={form.cityId} onValueChange={(v) => setForm(prev => ({ ...prev, cityId: v }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent searchable>
                        {cities.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">اسم المنطقة</label>
                    <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="text-right" />
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full">
                    {saving ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو المدينة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">معطل</SelectItem>
                </SelectContent>
              </Select>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
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
                      <TableHead>الاسم</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAreas.length ? paginatedAreas.map((area) => (
                      <TableRow key={area.id}>
                        <TableCell className="font-medium">{area.name}</TableCell>
                        <TableCell>{area.city?.name}</TableCell>
                        <TableCell>
                          {area.isActive ?? true ? (
                            <Badge className="bg-green-600">نشط</Badge>
                          ) : (
                            <Badge variant="secondary">معطل</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => openView(area)} title="عرض">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleActive(area)}
                            title={(area.isActive ?? true) ? "تعطيل" : "تفعيل"}
                          >
                            {(area.isActive ?? true) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(area)} title="تعديل">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            title="حذف"
                            onClick={() => setDeleteDialog({ isOpen: true, id: area.id, name: area.name })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          {filtered.length === 0 ? "لا توجد مناطق" : "لا توجد مناطق في هذه الصفحة"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedAreas.length ? paginatedAreas.map((area) => (
                  <AreaCard key={area.id} area={area} />
                )) : (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    {filtered.length === 0 ? "لا توجد مناطق" : "لا توجد مناطق في هذه الصفحة"}
                  </div>
                )}
              </div>
            </>
          )}

          {renderPagination()}
        </CardContent>
      </Card>

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
            <DialogTitle className="text-right">تعديل المنطقة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-right">
            <div className="space-y-2">
              <label className="text-sm">اسم المنطقة</label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="text-right" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">المدينة</label>
              <Select value={form.cityId} onValueChange={(v) => setForm(prev => ({ ...prev, cityId: v }))}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent searchable>
                  {cities.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdate} disabled={saving} className="w-full">
              {saving ? "جاري التحديث..." : "تحديث"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-right text-xl font-bold text-gray-900">
              تفاصيل المنطقة
            </DialogTitle>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">اسم المنطقة:</span>
                <span className="font-bold text-blue-600 text-lg">
                  {selected.name}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">المدينة:</span>
                <span className="font-bold text-green-600 bg-white px-3 py-1 rounded-md border border-green-200">
                  {selected.city?.name || "غير محدد"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">الحالة:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${(selected.isActive ?? true)
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
                  }`}>
                  {(selected.isActive ?? true) ? " نشط" : " معطل"}
                </span>
              </div>
            </div>
          )}

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

export default Areas


