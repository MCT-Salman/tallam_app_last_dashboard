import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Search, Eye, Play, Pause, ChevronRight, ChevronLeft } from "lucide-react"
import { createPointOfSale, deletePointOfSale, getAreas, getPointsOfSale, togglePointOfSaleActive, updatePointOfSale } from "@/api/api"
import { showErrorToast, showSuccessToast } from "@/hooks/useToastMessages"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const PointsOfSale = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [points, setPoints] = useState([])
  const [areas, setAreas] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: "" })
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const [form, setForm] = useState({ name: "", address: "", phone: "", areaId: "" })
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pointsRes, areasRes] = await Promise.all([getPointsOfSale(), getAreas()])
      setPoints(pointsRes.data?.data || [])
      setAreas(areasRes.data?.data || [])
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تحميل نقاط البيع/المناطق")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    let list = [...points]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      list = list.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.address?.toLowerCase().includes(term) ||
        p.area?.name?.toLowerCase().includes(term) ||
        p.area?.city?.name?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== "all") {
      const shouldBeActive = statusFilter === "active"
      list = list.filter(point => (point.isActive ?? true) === shouldBeActive)
    }

    return list
  }, [points, searchTerm, statusFilter])

  const paginatedPoints = useMemo(() => {
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

  const resetForm = () => setForm({ name: "", address: "", phone: "", areaId: "" })

  const handleCreate = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim() || !form.areaId) {
      showErrorToast("يرجى ملء جميع الحقول")
      return
    }
    setSaving(true)
    try {
      const res = await createPointOfSale({
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        areaId: Number(form.areaId)
      })
      if (res.data?.success) {
        showSuccessToast("تم إنشاء نقطة البيع بنجاح")
        setAddDialogOpen(false)
        resetForm()
        fetchAll()
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل إنشاء نقطة البيع")
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (point) => {
    setSelected(point)
    setForm({
      name: point.name || "",
      address: point.address || "",
      phone: point.phone || "",
      areaId: String(point.areaId || point.area?.id || "")
    })
    setEditDialogOpen(true)
  }
  const openView = (point) => {
    setSelected(point)
    setViewDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selected) return
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim() || !form.areaId) {
      showErrorToast("يرجى ملء جميع الحقول")
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        areaId: Number(form.areaId)
      }
      const res = await updatePointOfSale(selected.id, payload)
      if (res.data?.success) {
        showSuccessToast("تم تحديث نقطة البيع بنجاح")
        setEditDialogOpen(false)
        resetForm()
        const updatedArea = areas.find(a => a.id === Number(form.areaId))
        setPoints(prev => prev.map(point =>
          point.id === selected.id
            ? {
                ...point,
                ...payload,
                area: updatedArea ? { ...updatedArea } : point.area
              }
            : point
        ))
        setSelected(prev => prev ? { ...prev, ...payload, area: updatedArea ? { ...updatedArea } : prev.area } : prev)
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تحديث نقطة البيع")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await deletePointOfSale(id)
      if (res.data?.success) {
        showSuccessToast("تم حذف نقطة البيع بنجاح")
        setDeleteDialog({ isOpen: false, id: null, name: "" })
        fetchAll()
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل حذف نقطة البيع")
    }
  }

  const handleToggleActive = async (id, current) => {
    try {
      const newStatus = !current
      const res = await togglePointOfSaleActive(id, newStatus)
      if (res.data?.success) {
        showSuccessToast(`تم ${newStatus ? "تفعيل" : "تعطيل"} نقطة البيع بنجاح`)
        setPoints(prev => prev.map(point =>
          point.id === id ? { ...point, isActive: newStatus } : point
        ))
        if (selected?.id === id) {
          setSelected(prev => prev ? { ...prev, isActive: newStatus } : prev)
        }
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تغيير الحالة")
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
          عرض {startItem} إلى {endItem} من {totalItems} نقطة بيع
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

  const PointCard = ({ point }) => {
    const areaName = point.area?.name || "-"
    const cityName = point.area?.city?.name || "-"

    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">{point.name}</h3>
            <p className="text-sm text-muted-foreground">{areaName} • {cityName}</p>
          </div>
          {point.isActive ? (
            <Badge className="bg-green-600">نشط</Badge>
          ) : (
            <Badge variant="secondary">معطل</Badge>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">العنوان</span>
            <span className="font-medium text-right">{point.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الهاتف</span>
            <span dir="ltr" className="font-medium">{point.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ الإنشاء</span>
            <span>{point.createdAt ?? "-"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => openView(point)}>
            عرض
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleActive(point.id, !!point.isActive)}
          >
            {point.isActive ? "تعطيل" : "تفعيل"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => openEdit(point)}>
            تعديل
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialog({ isOpen: true, id: point.id, name: point.name })}
          >
            حذف
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">إدارة نقاط البيع ({points.length})</CardTitle>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  إضافة نقطة بيع
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-right">إضافة نقطة بيع</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2 text-right">
                  <div className="space-y-2">
                    <label className="text-sm">الاسم</label>
                    <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">العنوان</label>
                    <Input value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">رقم الهاتف</label>
                    <Input dir="ltr" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">المنطقة</label>
                    <Select value={form.areaId} onValueChange={(v) => setForm(prev => ({ ...prev, areaId: v }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر المنطقة" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map(a => (
                          <SelectItem key={a.id} value={String(a.id)}>{a.name} - {a.city?.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                placeholder="بحث بالاسم، العنوان، المنطقة أو المدينة..."
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
                      <TableHead>العنوان</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>المنطقة</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPoints.length ? paginatedPoints.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.address}</TableCell>
                        <TableCell dir="ltr">{p.phone}</TableCell>
                        <TableCell>{p.area?.name}</TableCell>
                        <TableCell>{p.area?.city?.name}</TableCell>
                        <TableCell>
                          {p.isActive ? (
                            <Badge className="bg-green-600">نشط</Badge>
                          ) : (
                            <Badge variant="secondary">معطل</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => openView(p)} title="عرض">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleActive(p.id, !!p.isActive)}
                            title={p.isActive ? "تعطيل" : "تفعيل"}
                          >
                            {p.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="تعديل">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            title="حذف"
                            onClick={() => setDeleteDialog({ isOpen: true, id: p.id, name: p.name })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          {filtered.length === 0 ? "لا توجد نقاط بيع" : "لا توجد نقاط بيع في هذه الصفحة"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedPoints.length ? paginatedPoints.map((point) => (
                  <PointCard key={point.id} point={point} />
                )) : (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    {filtered.length === 0 ? "لا توجد نقاط بيع" : "لا توجد نقاط بيع في هذه الصفحة"}
                  </div>
                )}
              </div>
            </>
          )}

          {renderPagination()}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل نقطة البيع</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-right">
              <div><span className="text-sm text-muted-foreground">المعرف:</span> <span className="font-medium">{selected.id}</span></div>
              <div><span className="text-sm text-muted-foreground">الاسم:</span> <span className="font-medium">{selected.name}</span></div>
              <div><span className="text-sm text-muted-foreground">العنوان:</span> <span className="font-medium">{selected.address}</span></div>
              <div><span className="text-sm text-muted-foreground">الهاتف:</span> <span className="font-medium" dir="ltr">{selected.phone}</span></div>
              <div><span className="text-sm text-muted-foreground">الحالة:</span> <span className="font-medium">{selected.isActive ? "نشط" : "معطل"}</span></div>
              <div><span className="text-sm text-muted-foreground">المنطقة:</span> <span className="font-medium">{selected.area?.name}</span></div>
              <div><span className="text-sm text-muted-foreground">المدينة:</span> <span className="font-medium">{selected.area?.city?.name}</span></div>
              <div><span className="text-sm text-muted-foreground">تاريخ الإنشاء:</span> <span className="font-medium">{selected.createdAt}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">تعديل نقطة البيع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-right">
            <div className="space-y-2">
              <label className="text-sm">الاسم</label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="text-right" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">العنوان</label>
              <Input value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} className="text-right" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">رقم الهاتف</label>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} className="text-right" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">المنطقة</label>
              <Select value={form.areaId} onValueChange={(v) => setForm(prev => ({ ...prev, areaId: v }))}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر المنطقة" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name} - {a.city?.name}</SelectItem>
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

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent className="text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف "{deleteDialog.name}"؟</AlertDialogTitle>
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

export default PointsOfSale


