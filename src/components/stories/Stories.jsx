import { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    Plus, Edit, Trash2, Filter, BadgeCheck, CheckCircle, XCircle, Tag,
    BookOpen, Megaphone, List, FileText, X, Play, Pause, Search,
    ChevronLeft, ChevronRight, Eye, Calendar, Image, ListOrdered
} from "lucide-react"
import { getStories, createStory, updateStory, deleteStory, BASE_URL } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"
import { imageConfig } from "@/utils/corsConfig"

const Stories = () => {
    const [allStories, setAllStories] = useState([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        title: "",
        startedAt: "",
        endedAt: "",
        orderIndex: "",
        isActive: true,
        isStory: true
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, story: null })

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")
    const [sortBy, setSortBy] = useState("createdAt")
    const [sortOrder, setSortOrder] = useState("desc")


    //  دالة للحصول على الترتيب التالي حسب النوع (قصة/إعلان)
    const getNextOrderIndexByType = (isStoryType) => {
        if (allStories.length === 0) return 1;

        try {
            // فلترة القصص حسب النوع
            const filteredStories = allStories.filter(story =>
                story.isStory === isStoryType
            );

            if (filteredStories.length === 0) return 1;

            // الحصول على أعلى ترتيب موجود لهذا النوع
            const orders = filteredStories.map(story => {
                const order = parseInt(story.orderIndex);
                return isNaN(order) ? 0 : order;
            });

            const maxOrder = Math.max(...orders);
            return maxOrder > 0 ? maxOrder + 1 : 1;
        } catch (error) {
            console.error("Error calculating next order by type:", error);
            return 1;
        }
    };


    // دالة لتنظيف وتكوين مسار الصورة
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/default-story.png"
        const cleanBaseUrl = BASE_URL.replace(/\/$/, "")
        const cleanImageUrl = imageUrl.replace(/^\//, "")
        return `${cleanBaseUrl}/${cleanImageUrl}`
    }

    const fetchStories = async () => {
        setLoading(true)
        try {
            // إزالة المعاملات من API call لأن الفلترة تتم على العميل
            const res = await getStories()
            console.log(" Stories API response:", res)

            let data = []
            let total = 0

            if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
                data = res.data.data.data
                total = res.data.data.pagination?.total || data.length
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data
                total = data.length
            } else if (Array.isArray(res.data)) {
                data = res.data
                total = data.length
            }

            setAllStories(data || [])
        } catch (err) {
            console.error(" Error fetching stories:", err)
            const errorMessage = err.response?.data?.message || "فشل تحميل القصص"
            showErrorToast(errorMessage)
            setAllStories([])
        } finally {
            setLoading(false)
        }
    }

    //  تحديث ترتيب العرض تلقائياً عند تغيير القصص أو فتح الديالوج
    useEffect(() => {
        if (!editItem && isDialogOpen) {
            const nextOrder = getNextOrderIndexByType(form.isStory);
            setForm(prev => ({
                ...prev,
                orderIndex: nextOrder.toString()
            }));
        }
    }, [allStories, isDialogOpen, editItem, form.isStory]);

    useEffect(() => {
        fetchStories()
    }, [])

    // فلترة وترتيب البيانات
    const filteredAndSortedStories = useMemo(() => {
        console.log(" Filtering stories...", {
            searchTerm,
            statusFilter,
            typeFilter,
            sortBy,
            sortOrder,
            totalStories: allStories.length
        })

        let filtered = [...allStories]

        // البحث بالعنوان
        if (searchTerm.trim()) {
            filtered = filtered.filter(story =>
                story.title?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            console.log(` After search (${searchTerm}):`, filtered.length)
        }

        // فلترة بالحالة
        if (statusFilter !== "all") {
            filtered = filtered.filter(story =>
                statusFilter === "active" ? story.isActive : !story.isActive
            )
            console.log(` After status filter (${statusFilter}):`, filtered.length)
        }

        // فلترة بالنوع
        if (typeFilter !== "all") {
            filtered = filtered.filter(story =>
                typeFilter === "story" ? story.isStory : !story.isStory
            )
            console.log(` After type filter (${typeFilter}):`, filtered.length)
        }

        // الترتيب
        filtered.sort((a, b) => {
            let aValue, bValue

            switch (sortBy) {
                case "title":
                    aValue = a.title?.toLowerCase() || ""
                    bValue = b.title?.toLowerCase() || ""
                    break
                case "orderIndex":
                    aValue = parseInt(a.orderIndex) || 0
                    bValue = parseInt(b.orderIndex) || 0
                    break
                case "startedAt":
                    aValue = new Date(a.startedAt) || new Date(0)
                    bValue = new Date(b.startedAt) || new Date(0)
                    break
                case "isActive":
                    aValue = a.isActive
                    bValue = b.isActive
                    break
                case "isStory":
                    aValue = a.isStory
                    bValue = b.isStory
                    break
                case "createdAt":
                    aValue = new Date(a.createdAt) || new Date(0)
                    bValue = new Date(b.createdAt) || new Date(0)
                    break
                default:
                    aValue = new Date(a.createdAt) || new Date(0)
                    bValue = new Date(b.createdAt) || new Date(0)
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
            return 0
        })

        console.log(" Final filtered stories:", filtered.length)
        return filtered
    }, [allStories, searchTerm, statusFilter, typeFilter, sortBy, sortOrder])

    // إعادة تعيين الصفحة عند تغيير الفلتر
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder, itemsPerPage])

    // التعامل مع تغييرات النموذج
    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    // التعامل مع تغيير الصورة
    const onImageChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        } else {
            setImageFile(null)
            setImagePreview(null)
        }
    }

    // حفظ القصة (إضافة أو تعديل)
    const handleSave = async () => {
        if (!form.startedAt) return showErrorToast("يرجى تحديد التاريخ")
        if (!form.endedAt) return showErrorToast("يرجى تحديد التاريخ")
        if (!imageFile && !editItem) return showErrorToast("يرجى اختيار صورة")

        try {
            const storyData = new FormData()

            // إضافة البيانات الأساسية
            // storyData.append('title', form.title)
            storyData.append('orderIndex', form.orderIndex || "0")
            storyData.append('isActive', form.isActive.toString())
            storyData.append('isStory', form.isStory.toString())

            if (form.startedAt) storyData.append('startedAt', form.startedAt)
            if (form.endedAt) storyData.append('endedAt', form.endedAt)

            if (imageFile) {
                storyData.append('imageUrl', imageFile)
            }

            console.log(" Sending story data:", {
                // title: form.title,
                orderIndex: form.orderIndex,
                isActive: form.isActive,
                isStory: form.isStory,
                startedAt: form.startedAt,
                endedAt: form.endedAt,
                hasImage: !!imageFile,
                isEdit: !!editItem
            })

            if (editItem) {
                console.log(` Updating story ID: ${editItem.id}`)
                const response = await updateStory(editItem.id, storyData)
                console.log(" Update response:", response)
                showSuccessToast("تم التعديل بنجاح")
                setEditItem(null)
            } else {
                console.log(" Creating new story")
                const response = await createStory(storyData)
                console.log(" Create response:", response)
                showSuccessToast("تم الإضافة بنجاح")
            }

            // إعادة تعيين النموذج
            setForm({
                title: "",
                startedAt: "",
                endedAt: "",
                orderIndex: "",
                isActive: true,
                isStory: true
            })
            setImageFile(null)
            setImagePreview(null)
            setIsDialogOpen(false)

            // إعادة تحميل البيانات بعد فترة قصيرة
            setTimeout(() => {
                fetchStories()
            }, 1000)

        } catch (err) {
            console.error(" Save error:", err)
            console.error(" Error response:", err.response?.data)
            showErrorToast(err?.response?.data?.message || "فشل العملية")
        }
    }

    // تبديل حالة القصة
    const handleToggleActive = async (id, isActive) => {
        try {
            const formData = new FormData()
            formData.append('isActive', (!isActive).toString())

            await updateStory(id, formData)
            showSuccessToast(`تم ${!isActive ? 'تفعيل' : 'تعطيل'} القصة بنجاح`)
            fetchStories()
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل تغيير الحالة")
        }
    }

    // حذف القصة
    const handleDelete = async (id) => {
        try {
            await deleteStory(id)
            fetchStories()
            showSuccessToast("تم الحذف بنجاح")
        } catch (err) {
            showErrorToast(err?.response?.data?.message || "فشل الحذف")
        }
    }

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد"
        return new Date(dateString).toLocaleDateString('en-US')
    }

    // التحقق من أن القصة نشطة حالياً
    const isCurrentlyActive = (story) => {
        if (!story.isActive) return false

        const now = new Date()
        const startedAt = story.startedAt ? new Date(story.startedAt) : null
        const endedAt = story.endedAt ? new Date(story.endedAt) : null

        if (startedAt && startedAt > now) return false
        if (endedAt && endedAt < now) return false

        return true
    }

    // دالة لحساب الفرق بين تاريخين
    const calculateDateDifference = (startDate, endDate) => {
        if (!startDate || !endDate) return "غير محدد"

        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end - start)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) return "يوم واحد"
        if (diffDays < 30) return `${diffDays} يوم`

        const months = Math.floor(diffDays / 30)
        const remainingDays = diffDays % 30

        if (months === 1 && remainingDays === 0) return "شهر واحد"
        if (remainingDays === 0) return `${months} أشهر`

        return `${months} شهر و ${remainingDays} يوم`
    }

    // دالة لحساب نسبة التقدم
    const calculateProgressPercentage = (story) => {
        if (!story.startedAt || !story.endedAt) return 0

        const start = new Date(story.startedAt)
        const end = new Date(story.endedAt)
        const now = new Date()

        if (now < start) return 0
        if (now > end) return 100

        const totalDuration = end - start
        const elapsed = now - start
        return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
    }

    //  البيانات المعروضة حالياً (من filteredAndSortedStories)
    const currentPageStories = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredAndSortedStories.slice(startIndex, endIndex)
    }, [filteredAndSortedStories, currentPage, itemsPerPage])

    // Pagination calculations - تحديث الحسابات
    const totalItems = filteredAndSortedStories.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

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
        setTypeFilter("all")
        setSortBy("createdAt")
        setSortOrder("desc")
        setCurrentPage(1)
    }

    // مكون بطاقة القصة للعرض على الجوال
    const StoryCard = ({ story }) => {
        const isActiveNow = isCurrentlyActive(story)

        return (
            <Card className="mb-4 overflow-hidden">
                {/* الصورة */}
                <div className="relative h-48 bg-gray-100">
                    <img
                        src={getImageUrl(story.imageUrl)}
                        alt={story.title}
                        className="w-full h-full object-cover"
                        {...imageConfig}
                        onError={(e) => {
                            e.target.onerror = null
                            e.target.src = "/default-story.png"
                        }}
                    />
                    {/* حالة القصة في الزاوية */}
                    <div className="absolute top-3 left-3">
                        <Badge variant={story.isActive ? "default" : "secondary"}>
                            {story.isActive ? "نشط" : "معطل"}
                        </Badge>
                        {isActiveNow && story.isActive && (
                            <Badge variant="default" className="mt-1 bg-green-600">
                                نشط حالياً
                            </Badge>
                        )}
                    </div>
                </div>

                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div>
                            <h3 className="font-bold text-xl mb-1">{story.title}</h3>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">ترتيب: {story.orderIndex || 0}</Badge>
                                <Badge variant={story.isStory ? "default" : "secondary"}>
                                    {story.isStory ? "قصة" : "إعلان"}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>البدء: {formatDate(story.startedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>الانتهاء: {formatDate(story.endedAt)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailDialog({ isOpen: true, story })}
                            className="flex-1"
                        >
                            <Eye className="w-4 h-4 ml-1" />
                            التفاصيل
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(story.id, story.isActive)}
                            className="flex-1"
                        >
                            {story.isActive ? <Pause className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" />}
                            {story.isActive ? "إيقاف" : "تفعيل"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setEditItem(story)
                                setForm({
                                    title: story.title || "",
                                    startedAt: story.startedAt?.split('T')[0] || "",
                                    endedAt: story.endedAt?.split('T')[0] || "",
                                    orderIndex: story.orderIndex?.toString() || "",
                                    isActive: story.isActive || true,
                                    isStory: story.isStory !== undefined ? story.isStory : true
                                })
                                setImageFile(null)
                                setImagePreview(story.imageUrl ? getImageUrl(story.imageUrl) : null)
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
                                itemId: story.id,
                                itemName: story.title || "بدون عنوان"
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
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <CardTitle>إدارة القصص والإعلانات ({allStories.length})</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setEditItem(null)
                                    setForm({
                                        title: "",
                                        startedAt: "",
                                        endedAt: "",
                                        orderIndex: "",
                                        isActive: true,
                                        isStory: true
                                    })
                                    setImageFile(null)
                                    setImagePreview(null)
                                }}
                            >
                                إضافة <Plus className="w-4 h-4 cursor-pointer" />
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                        >
                            <DialogHeader>
                                <DialogTitle className="text-right">{editItem ? "تعديل المحتوى" : "إضافة محتوى جديد"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                {/* <div className="space-y-2">
                                    <Label>العنوان *</Label>
                                    <Input
                                        value={form.title}
                                        onChange={(e) => handleFormChange("title", e.target.value)}
                                        placeholder="أدخل العنوان..."
                                    />
                                </div> */}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ترتيب العرض</Label>
                                        <Input
                                            type="number"
                                            value={form.orderIndex}
                                            onChange={(e) => handleFormChange("orderIndex", e.target.value)}
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>

                                    <div className="space-y-2 flex items-center gap-2 justify-end">
                                        <Label htmlFor="story-type" className="cursor-pointer">
                                            {form.isStory ? "قصة" : "إعلان"}
                                        </Label>
                                        <Switch
                                            id="story-type"
                                            checked={form.isStory}
                                            onCheckedChange={(checked) => handleFormChange("isStory", checked)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>تاريخ البدء</Label>
                                        <Input
                                            type="date"
                                            value={form.startedAt}
                                            onChange={(e) => handleFormChange("startedAt", e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>تاريخ الانتهاء</Label>
                                        <Input
                                            type="date"
                                            value={form.endedAt}
                                            onChange={(e) => handleFormChange("endedAt", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="story-image">
                                        الصورة {!editItem && "*"}
                                    </Label>
                                    <Input
                                        id="story-image"
                                        type="file"
                                        accept="image/*"
                                        onChange={onImageChange}
                                    />
                                    {imagePreview && (
                                        <div className="mt-2">
                                            <img
                                                src={imagePreview}
                                                alt="معاينة"
                                                className="max-h-40 rounded-md border"
                                                {...imageConfig}
                                                onError={(e) => {
                                                    e.target.onerror = null
                                                    e.target.src = "/default-story.png"
                                                }}
                                            />
                                        </div>
                                    )}
                                    {editItem && !imagePreview && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                الصورة الحالية:
                                            </p>
                                            <img
                                                src={getImageUrl(editItem.imageUrl)}
                                                alt="الصورة الحالية"
                                                className="max-h-40 rounded-md border mt-1"
                                                {...imageConfig}
                                                onError={(e) => {
                                                    e.target.onerror = null
                                                    e.target.src = "/default-story.png"
                                                }}
                                            />
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {editItem
                                            ? "اترك الحقل فارغاً للحفاظ على الصورة الحالية"
                                            : "يجب اختيار صورة للمحتوى الجديد"
                                        }
                                    </p>
                                </div>

                                <Button onClick={handleSave}>
                                    {editItem ? "حفظ التعديل" : "حفظ المحتوى"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/*  قسم الفلترة والعرض */}
                <div className="space-y-6">
                    {/* شريط الفلاتر الرئيسي */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-sm">
                        {/* عنوان القسم */}
                        <div className="flex items-center gap-2 mb-6">
                            <Filter className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold text-gray-800">فلاتر المحتوى</h3>
                        </div>

                        {/* شبكة الفلاتر */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search - مع تأثيرات تفاعلية */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                </div>
                                <Input
                                    placeholder="بحث بالعنوان..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10 transition-all duration-200 
                   border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                   group-hover:border-gray-400 bg-white/80"
                                />
                            </div>

                            {/* Status Filter - مع أيقونة */}
                            <div className="relative group">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="transition-all duration-200
                                border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                                group-hover:border-gray-400 bg-white/80">
                                        <div className="flex items-center gap-2">
                                            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                            <SelectValue placeholder="فلترة بالحالة" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                        <SelectItem value="all" className="flex items-center gap-2">
                                            جميع الحالات
                                        </SelectItem>
                                        <SelectItem value="active" className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            نشط
                                        </SelectItem>
                                        <SelectItem value="inactive" className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-red-600" />
                                            معطل
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Type Filter - مع أيقونة */}
                            <div className="relative group">
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="transition-all duration-200
                                border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                                group-hover:border-gray-400 bg-white/80">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <SelectValue placeholder="فلترة بالنوع" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                        <SelectItem value="all" className="flex items-center gap-2">
                                            جميع الأنواع
                                        </SelectItem>
                                        <SelectItem value="story" className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-blue-600" />
                                            قصص
                                        </SelectItem>
                                        <SelectItem value="ad" className="flex items-center gap-2">
                                            <Megaphone className="h-4 w-4 text-orange-600" />
                                            إعلانات
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Items Per Page - مع أيقونة */}
                            <div className="relative group">
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={(value) => setItemsPerPage(Number(value))}
                                >
                                    <SelectTrigger className="transition-all duration-200
                                border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20
                                group-hover:border-gray-400 bg-white/80">
                                        <div className="flex items-center gap-2">
                                            <List className="h-4 w-4 text-muted-foreground" />
                                            <SelectValue placeholder="عدد العناصر" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                        <SelectItem value="5" className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                            5 عناصر
                                        </SelectItem>
                                        <SelectItem value="10" className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            10 عناصر
                                        </SelectItem>
                                        <SelectItem value="20" className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            20 عنصر
                                        </SelectItem>
                                        <SelectItem value="50" className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                            50 عنصر
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* شريط النتائج والإحصائيات */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            {/* عرض النتائج - مع تصميم جذاب */}
                            <div className="flex items-center gap-3">
                                <div className="bg-white rounded-lg p-2 shadow-sm border">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-700">
                                        عرض <span className="font-bold text-primary">{startItem}-{endItem}</span> من أصل
                                        <span className="font-bold text-gray-900"> {totalItems} </span>
                                        محتوى
                                    </p>
                                    {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            <span className="text-xs text-green-600 font-medium">نتائج مفلترة</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* أزرار الإجراءات */}
                            <div className="flex items-center gap-3">
                                {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={resetFilters}
                                        className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                                    >
                                        <X className="h-4 w-4" />
                                        مسح الفلاتر
                                    </Button>
                                )}


                            </div>
                        </div>

                        {/* شريط التقدم للإظهار المرئي */}
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-purple-900 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(filteredAndSortedStories.length / Math.max(allStories.length, 1)) * 100}%`
                                    }}
                                ></div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                                {Math.round((filteredAndSortedStories.length / Math.max(allStories.length, 1)) * 100)}%
                            </span>
                        </div>
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
                        {/* Table View - for medium screens and up */}
                        <div className="hidden md:block">
                            <Table className="direction-rtl">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="table-header">الصورة</TableHead>
                                        {/* <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("title")}
                                        >
                                            <div className="flex items-center gap-1">
                                                العنوان
                                                {sortBy === "title" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead> */}
                                        <TableHead className="table-header">النوع</TableHead>
                                        <TableHead
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("orderIndex")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الترتيب
                                                {sortBy === "orderIndex" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header">فترة العرض</TableHead>
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
                                        <TableHead className="table-header text-right">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentPageStories.length > 0 ? currentPageStories.map(story => {
                                        const isActiveNow = isCurrentlyActive(story)

                                        return (
                                            <TableRow key={story.id}>
                                                <TableCell className="table-cell">
                                                    <img
                                                        src={getImageUrl(story.imageUrl)}
                                                        alt={story.title}
                                                        className="w-12 h-12 object-cover rounded-md"
                                                        {...imageConfig}
                                                        onError={(e) => {
                                                            e.target.onerror = null
                                                            e.target.src = "/default-story.png"
                                                        }}
                                                    />
                                                </TableCell>
                                                {/* <TableCell className="table-cell font-medium">
                                                    {story.title}
                                                </TableCell> */}
                                                <TableCell className="table-cell">
                                                    <Badge variant={story.isStory ? "default" : "secondary"}>
                                                        {story.isStory ? "قصة" : "إعلان"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <Badge variant="secondary">{story.orderIndex || 0}</Badge>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <div className="text-sm">
                                                        <div>من: {formatDate(story.startedAt)}</div>
                                                        <div>إلى: {formatDate(story.endedAt)}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="table-cell">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant={story.isActive ? "default" : "secondary"}>
                                                            {story.isActive ? "نشط" : "معطل"}
                                                        </Badge>
                                                        {isActiveNow && story.isActive && (
                                                            <Badge variant="default" className="bg-green-600 text-xs">
                                                                نشط حالياً
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="table-cell text-right space-x-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setDetailDialog({ isOpen: true, story })}
                                                        title="عرض التفاصيل"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleToggleActive(story.id, story.isActive)}
                                                        title={story.isActive ? "تعطيل" : "تفعيل"}
                                                    >
                                                        {story.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditItem(story)
                                                            setForm({
                                                                title: story.title || "",
                                                                startedAt: story.startedAt?.split('T')[0] || "",
                                                                endedAt: story.endedAt?.split('T')[0] || "",
                                                                orderIndex: story.orderIndex?.toString() || "",
                                                                isActive: story.isActive || true,
                                                                isStory: story.isStory !== undefined ? story.isStory : true
                                                            })
                                                            setImageFile(null)
                                                            setImagePreview(story.imageUrl ? getImageUrl(story.imageUrl) : null)
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
                                                            itemId: story.id,
                                                            itemName: story.title || "بدون عنوان"
                                                        })}
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                                {allStories.length === 0 ? "لا توجد محتويات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Cards View - for small screens */}
                        <div className="block md:hidden">
                            {currentPageStories.length > 0 ? (
                                currentPageStories.map(story => (
                                    <StoryCard key={story.id} story={story} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allStories.length === 0 ? "لا توجد محتويات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {filteredAndSortedStories.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من {totalItems} محتوى
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

                                        {/* إضافة نقاط إذا كانت الصفحات أكثر من 5 */}
                                        {totalPages > 5 && currentPage < totalPages - 2 && (
                                            <span className="px-2">...</span>
                                        )}
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
                        <AlertDialogTitle className="text-right">هل أنت متأكد من الحذف؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف المحتوى "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
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

            {/* Story Details Dialog */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog({ isOpen, story: null })}>
                <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 text-right">
                            <div className="flex items-center gap-2">
                                <Image className="w-6 h-6 text-purple-600" />
                                تفاصيل المحتوى
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {detailDialog.story && (
                        <div className="space-y-6 text-right">
                            {/* الهيدر مع الصورة والمعلومات الأساسية */}
                            <div className="bg-gradient-to-l from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                                    {/* الصورة الرئيسية */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={getImageUrl(detailDialog.story.imageUrl)}
                                            alt={detailDialog.story.title}
                                            className="w-32 h-32 lg:w-40 lg:h-40 object-cover rounded-2xl shadow-lg border-4 border-white"
                                            {...imageConfig}
                                            onError={(e) => {
                                                e.target.onerror = null
                                                e.target.src = "/default-story.png"
                                            }}
                                        />
                                        {/* شارة الترتيب */}
                                        <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                                            {detailDialog.story.orderIndex || 0}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                                            {detailDialog.story.title}
                                        </h2>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge variant={detailDialog.story.isActive ? "default" : "secondary"}
                                                className={detailDialog.story.isActive ? "bg-green-600 hover:bg-green-700" : "bg-gray-500"}>
                                                {detailDialog.story.isActive ? "🟢 نشط" : "🔴 معطل"}
                                            </Badge>

                                            <Badge variant={detailDialog.story.isStory ? "default" : "secondary"}
                                                className={detailDialog.story.isStory ? "bg-purple-600 hover:bg-purple-700" : "bg-orange-600 hover:bg-orange-700"}>
                                                {detailDialog.story.isStory ? " قصة" : " إعلان"}
                                            </Badge>

                                            {isCurrentlyActive(detailDialog.story) && detailDialog.story.isActive && (
                                                <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                                                    نشط حالياً
                                                </Badge>
                                            )}

                                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                                <ListOrdered className="w-3 h-3 ml-1" />
                                                ترتيب: {detailDialog.story.orderIndex || 0}
                                            </Badge>
                                        </div>

                                        {/* معلومات سريعة */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar className="w-4 h-4 text-purple-600" />
                                                <span>أنشئت في: {formatDate(detailDialog.story.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* الشبكة الرئيسية للمعلومات */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* معلومات الفترة الزمنية */}
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-3 bg-gradient-to-l from-blue-50 to-cyan-50 rounded-t-lg">
                                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                            الفترة الزمنية
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        <div className="space-y-3">
                                            <div className={`flex justify-between items-center p-3 rounded-lg transition-colors ${detailDialog.story.startedAt ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50'
                                                }`}>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-gray-700">تاريخ البدء</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-medium text-gray-900 block">
                                                        {formatDate(detailDialog.story.startedAt) || 'غير محدد'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={`flex justify-between items-center p-3 rounded-lg transition-colors ${detailDialog.story.endedAt ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50'
                                                }`}>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-medium text-gray-700">تاريخ الانتهاء</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-medium text-gray-900 block">
                                                        {formatDate(detailDialog.story.endedAt) || 'غير محدد'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* شريط التقدم الزمني */}
                                        {detailDialog.story.startedAt && detailDialog.story.endedAt && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700">مدة العرض</span>
                                                    <span className="text-sm text-gray-600">
                                                        {calculateDateDifference(detailDialog.story.startedAt, detailDialog.story.endedAt)}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${calculateProgressPercentage(detailDialog.story)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* معلومات الحالة والإحصائيات */}
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-3 bg-gradient-to-l from-green-50 to-emerald-50 rounded-t-lg">
                                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                            <Eye className="w-5 h-5 text-green-600" />
                                            الحالة والإحصائيات
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <div className="text-sm font-medium text-gray-700 mt-1">الحالة</div>
                                                <div className="text-lg font-bold text-gray-900">
                                                    {detailDialog.story.isActive ? "نشط" : "معطل"}
                                                </div>
                                            </div>

                                            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                <div className="text-sm font-medium text-gray-700 mt-1">النوع</div>
                                                <div className="text-lg font-bold text-gray-900">
                                                    {detailDialog.story.isStory ? "قصة" : "إعلان"}
                                                </div>
                                            </div>

                                            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                                                <div className="text-sm font-medium text-gray-700 mt-1">الحالة الحالية</div>
                                                <div className="text-lg font-bold text-gray-900">
                                                    {isCurrentlyActive(detailDialog.story) ? "نشط الآن" : "غير نشط"}
                                                </div>
                                            </div>

                                            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                                                <div className="text-sm font-medium text-gray-700 mt-1">الترتيب</div>
                                                <div className="text-lg font-bold text-gray-900">
                                                    {detailDialog.story.orderIndex || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* معلومات إضافية */}
                            <Card className="border border-gray-200 shadow-sm">
                                <CardHeader className="pb-3 bg-gradient-to-l from-gray-50 to-slate-50 rounded-t-lg">
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                        <ListOrdered className="w-5 h-5 text-gray-600" />
                                        معلومات إضافية
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">تاريخ الإنشاء</span>
                                            <div className="text-right">
                                                <span className="font-medium text-gray-900 block">{formatDate(detailDialog.story.createdAt)}</span>
                                            </div>
                                        </div>


                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">ترتيب العرض</span>
                                            <Badge variant="secondary" className="text-lg font-bold">
                                                {detailDialog.story.orderIndex || 0}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export default Stories