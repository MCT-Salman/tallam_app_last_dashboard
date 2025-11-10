import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Search, Eye, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react"
import { createPaymentMethod, deletePaymentMethod, getPaymentMethods, togglePaymentMethodActive, updatePaymentMethod } from "@/api/api"
import { showErrorToast, showSuccessToast } from "@/hooks/useToastMessages"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

const PaymentMethods = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [methods, setMethods] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: "" })
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const [form, setForm] = useState({ company: "", name: "", code: "", isActive: true })
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await getPaymentMethods()
      setMethods(res.data?.data || [])
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تحميل وسائل الدفع")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    let result = [...methods]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(m =>
        m.name?.toLowerCase().includes(term) ||
        m.company?.toLowerCase().includes(term) ||
        m.code?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== "all") {
      const shouldBeActive = statusFilter === "active"
      result = result.filter(m => (m.isActive ?? true) === shouldBeActive)
    }

    return result
  }, [methods, searchTerm, statusFilter])

  const paginatedMethods = useMemo(() => {
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

  const resetForm = () => setForm({ company: "", name: "", code: "", isActive: true })

  const handleCreate = async () => {
    if (!form.company.trim() || !form.name.trim() || !form.code.trim()) {
      showErrorToast("يرجى ملء جميع الحقول")
      return
    }
    setSaving(true)
    try {
      const res = await createPaymentMethod({
        company: form.company.trim(),
        name: form.name.trim(),
        code: form.code.trim()
      })
      if (res.data?.success) {
        showSuccessToast("تم إنشاء وسيلة الدفع بنجاح")
        setAddDialogOpen(false)
        resetForm()
        fetchAll()
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل إنشاء وسيلة الدفع")
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (method) => {
    setSelected(method)
    setForm({ company: method.company || "", name: method.name || "", code: method.code || "", isActive: !!method.isActive })
    setEditDialogOpen(true)
  }
  const openView = (method) => {
    setSelected(method)
    setViewDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selected) return
    if (!form.company.trim() || !form.name.trim() || !form.code.trim()) {
      showErrorToast("يرجى ملء جميع الحقول")
      return
    }
    setSaving(true)
    try {
      const payload = {
        company: form.company.trim(),
        name: form.name.trim(),
        code: form.code.trim(),
        isActive: !!form.isActive
      }
      const res = await updatePaymentMethod(selected.id, payload)
      if (res.data?.success) {
        showSuccessToast("تم تحديث وسيلة الدفع بنجاح")
        setEditDialogOpen(false)
        resetForm()
        setMethods(prev => prev.map(method =>
          method.id === selected.id ? { ...method, ...payload } : method
        ))
        setSelected(prev => prev ? { ...prev, ...payload } : prev)
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل تحديث وسيلة الدفع")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await deletePaymentMethod(id)
      if (res.data?.success) {
        showSuccessToast("تم حذف وسيلة الدفع بنجاح")
        setDeleteDialog({ isOpen: false, id: null, name: "" })
        fetchAll()
      }
    } catch (e) {
      showErrorToast(e?.response?.data?.message || "فشل حذف وسيلة الدفع")
    }
  }

  const handleToggleActive = async (id, current) => {
    try {
      const newStatus = !current
      const res = await togglePaymentMethodActive(id, newStatus)
      if (res.data?.success) {
        showSuccessToast(`تم ${newStatus ? "تفعيل" : "تعطيل"} وسيلة الدفع بنجاح`)
        setMethods(prev => prev.map(method =>
          method.id === id ? { ...method, isActive: newStatus } : method
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
          عرض {startItem} إلى {endItem} من {totalItems} وسيلة دفع
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

  const PaymentCard = ({ method }) => (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">{method.company}</h3>
          <p className="text-sm text-muted-foreground">{method.name}</p>
        </div>
        {method.isActive ? (
          <Badge className="bg-green-600">نشط</Badge>
        ) : (
          <Badge variant="secondary">معطل</Badge>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">الكود/الحساب</span>
          <span dir="ltr" className="font-medium">{method.code}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">تاريخ الإنشاء</span>
          <span>{method.createdAt ?? "-"}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => openView(method)}>
          عرض
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggleActive(method.id, !!method.isActive)}
        >
          {method.isActive ? "تعطيل" : "تفعيل"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => openEdit(method)}>
          تعديل
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialog({ isOpen: true, id: method.id, name: method.name })}
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
            <CardTitle className="flex items-center gap-2">إدارة وسائل الدفع ({methods.length})</CardTitle>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  إضافة وسيلة دفع
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-right">إضافة وسيلة دفع</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2 text-right">
                  <div className="space-y-2">
                    <label className="text-sm">الشركة</label>
                    <Input value={form.company} onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">الاسم</label>
                    <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">الكود/الحساب</label>
                    <Input dir="ltr" value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))} className="text-right" />
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
                placeholder="بحث بالشركة، الاسم أو الكود..."
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
                      <TableHead>الشركة</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الكود/الحساب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMethods.length ? paginatedMethods.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.company}</TableCell>
                        <TableCell>{m.name}</TableCell>
                        <TableCell dir="ltr">{m.code}</TableCell>
                        <TableCell>
                          {m.isActive ? (
                            <Badge className="bg-green-600">نشط</Badge>
                          ) : (
                            <Badge variant="secondary">معطل</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => openView(m)} title="عرض">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleActive(m.id, !!m.isActive)}
                            title={m.isActive ? "تعطيل" : "تفعيل"}
                          >
                            {m.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(m)} title="تعديل">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            title="حذف"
                            onClick={() => setDeleteDialog({ isOpen: true, id: m.id, name: m.name })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          {filtered.length === 0 ? "لا توجد وسائل دفع" : "لا توجد وسائل دفع في هذه الصفحة"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedMethods.length ? paginatedMethods.map((method) => (
                  <PaymentCard key={method.id} method={method} />
                )) : (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    {filtered.length === 0 ? "لا توجد وسائل دفع" : "لا توجد وسائل دفع في هذه الصفحة"}
                  </div>
                )}
              </div>
            </>
          )}

          {renderPagination()}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-right text-xl font-bold text-gray-900">
              تفاصيل وسيلة الدفع
            </DialogTitle>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">الشركة:</span>
                <span className="font-bold text-blue-600 text-lg">
                  {selected.company}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">اسم وسيلة الدفع:</span>
                <span className="font-bold text-purple-600">
                  {selected.name}
                </span>
              </div>

              <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">الكود/الحساب:</span>
                </div>
                <div className="bg-white p-3 rounded-md border border-gray-300 text-left">
                  <code className="font-mono font-bold text-green-600 text-lg break-all" dir="ltr">
                    {selected.code}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">الحالة:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${selected.isActive
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
                  }`}>
                  {selected.isActive ? " نشط" : " معطل"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">تاريخ الإنشاء:</span>
                <span className="font-medium text-orange-600 bg-white px-3 py-1 rounded-md border border-orange-200">
                  {selected.createdAt}
                </span>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">تعديل وسيلة الدفع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-right">
            <div className="space-y-2">
              <label className="text-sm">الشركة</label>
              <Input value={form.company} onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))} className="text-right" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">الاسم</label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="text-right" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">الكود/الحساب</label>
              <Input dir="ltr" value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))} className="text-right" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={!!form.isActive} onCheckedChange={(v) => setForm(prev => ({ ...prev, isActive: v }))} />
              <span>{form.isActive ? "نشط" : "معطل"}</span>
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

export default PaymentMethods


